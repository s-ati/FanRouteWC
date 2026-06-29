#!/usr/bin/env python3
"""Download real Google Maps photos for the non-bar venues (FIFA watch parties
+ partner spots) and self-host them under public/images/venues/.

Same rationale + idempotency as scripts/download-bar-photos.py, but the venue
list comes from Supabase (source_type != 'community') instead of the bars
markdown. Some plaza/street venues (e.g. yerba-buena-lane) have no Google
business photo and are skipped — they keep their UI fallback.

Run from fanroute-app/:  python3 scripts/download-venue-photos.py
Then regenerate lib/bar-photos.ts from the files on disk.
"""
import json, os, sys, time, urllib.parse, urllib.request

OUTDIR = "public/images/venues"


def env(name):
    for line in open(".env.local"):
        if line.startswith(name + "="):
            return line.split("=", 1)[1].strip().strip('"')
    sys.exit(f"{name} not found in .env.local")


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read()


def main():
    surl, srk, key = env("NEXT_PUBLIC_SUPABASE_URL"), env(
        "SUPABASE_SERVICE_ROLE_KEY"), env("SERPAPI_API_KEY")
    os.makedirs(OUTDIR, exist_ok=True)
    rows = json.loads(get(urllib.request.Request(
        f"{surl}/rest/v1/venues?select=id,name,place_id,source_type",
        headers={"apikey": srk, "Authorization": f"Bearer {srk}"})).decode())
    venues = [r for r in rows if r.get("source_type") != "community" and r.get("place_id")]
    todo = [v for v in venues if not any(
        os.path.exists(f"{OUTDIR}/{v['id']}{e}") for e in (".jpg", ".png"))]
    print(f"{len(venues)} venues, {len(todo)} to fetch")
    for v in todo:
        vid, pid, name = v["id"], v["place_id"], v["name"]
        # place_id first; fall back to a text query (better photo coverage)
        for api in (
            f"https://serpapi.com/search.json?engine=google_maps&type=place&place_id={urllib.parse.quote(pid)}&api_key={key}",
            f"https://serpapi.com/search.json?engine=google_maps&q={urllib.parse.quote(name + ', San Francisco, CA')}&api_key={key}",
        ):
            try:
                d = json.loads(get(api).decode())
                top = d.get("place_results") or (d.get("local_results") or [{}])[0]
                cands = []
                for p in (top.get("photos") or []):
                    if isinstance(p, dict):
                        cands += [p.get("image"), p.get("thumbnail")]
                cands.append(top.get("thumbnail"))
                saved = False
                for u in [c for c in cands if c]:
                    img = get(u)
                    if len(img) > 20000 and (img[:2] == b"\xff\xd8" or img[:8] == b"\x89PNG\r\n\x1a\n"):
                        ext = ".png" if img[:8] == b"\x89PNG\r\n\x1a\n" else ".jpg"
                        open(f"{OUTDIR}/{vid}{ext}", "wb").write(img)
                        print(f"  {vid} ✓ {len(img)//1024}KB{ext}")
                        saved = True
                        break
                if saved:
                    break
            except Exception as e:
                print(f"  {vid} ✗ {str(e)[:50]}")
        else:
            print(f"  {vid} ✗ no usable photo")
        time.sleep(0.25)


if __name__ == "__main__":
    main()
