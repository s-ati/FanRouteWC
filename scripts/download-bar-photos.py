#!/usr/bin/env python3
"""Download real Google Maps photos for every bar and self-host them.

WHY: the venue photo_url values stored in Supabase are Google Places *signed*
URLs (lh3.googleusercontent.com/gps-cs-s/...). They work when freshly minted
but Google expires/locks them after a few weeks -> 403 everywhere -> broken
images. SerpAPI is fine; the URLs are just short-lived. The durable fix is to
download the bytes ONCE and serve them from public/images/bars/.

Idempotent: skips any bar whose image file already exists, so re-runs don't
spend SerpAPI credits on bars already cached. 1 SerpAPI credit per *new* bar.

Run from fanroute-app/:  python3 scripts/download-bar-photos.py
Then regenerate lib/bar-photos.ts from the files on disk.
"""
import json, os, re, sys, time, urllib.parse, urllib.request

DATA = "../Sammy/05-project-notes/fanroute/data/bars-san-francisco.md"
OUTDIR = "public/images/bars"


def load_key():
    for line in open(".env.local"):
        if line.startswith("SERPAPI_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"')
    sys.exit("SERPAPI_API_KEY not found in .env.local")


def parse_bars(md):
    bars = []
    for block in re.split(r"(?m)^---\s*$", md):
        if "place_id:" not in block:
            continue
        d = {}
        for line in block.splitlines():
            m = re.match(r"\s*(id|name|place_id):\s*(.*)", line)
            if m:
                d[m.group(1)] = m.group(2).strip().strip('"')
        if d.get("id") and d.get("place_id"):
            bars.append(d)
    return bars


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read(), r.headers.get("content-type", "")


def main():
    key = load_key()
    os.makedirs(OUTDIR, exist_ok=True)
    bars = parse_bars(open(DATA).read())
    todo = [b for b in bars if not any(
        os.path.exists(f"{OUTDIR}/{b['id']}{e}") for e in (".jpg", ".png"))]
    print(f"{len(bars)} bars, {len(todo)} missing -> fetching")
    for b in todo:
        bid, pid = b["id"], b["place_id"]
        try:
            api = ("https://serpapi.com/search.json?engine=google_maps&type=place"
                   f"&place_id={urllib.parse.quote(pid)}&api_key={key}")
            d = json.loads(get(api)[0].decode())
            pr = d.get("place_results", {}) or {}
            ph = pr.get("photos") or []
            url = (ph[0].get("image") or ph[0].get("thumbnail")) if (
                ph and isinstance(ph[0], dict)) else None
            url = url or pr.get("thumbnail")
            if not url:
                print(f"  {bid} ✗ no photo"); continue
            img, ct = get(url)
            ext = ".png" if img[:8] == b"\x89PNG\r\n\x1a\n" else ".jpg"
            open(f"{OUTDIR}/{bid}{ext}", "wb").write(img)
            print(f"  {bid} ✓ {len(img)//1024}KB{ext}")
            time.sleep(0.25)
        except Exception as e:
            print(f"  {bid} ✗ {str(e)[:60]}")


if __name__ == "__main__":
    main()
