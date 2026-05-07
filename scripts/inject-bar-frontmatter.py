#!/usr/bin/env python3
"""
For each bar in /tmp/bars-resolved.json, find its block in bars-san-francisco.md
and inject:
  - lat: <number>           (replaces lat: TBD)
  - lng: <number>           (replaces lng: TBD)
  - place_id: "<id>"        (new line)
  - country_affiliations:   (new line, derived from existing country_affinity)

country_affiliations rules:
  - take every country listed in country_affinity (regardless of role)
  - dedupe + sort
  - if any role == "general_soccer", also include "*" so the bar polls
    on every active match day
"""

import json
import re
import sys
from pathlib import Path

BARS_PATH = Path(
    "/Users/samuelatiye/Sammy/Sammy/05-project-notes/fanroute/data/bars-san-francisco.md"
)
RESOLVED_PATH = Path("/tmp/bars-resolved.json")


def derive_affiliations(block_text: str) -> list[str]:
    """Parse the country_affinity YAML list inline-flow style and return
    a sorted list of country codes plus '*' if any general_soccer role appears.
    """
    # country_affinity block is a list of inline objects:
    #   country_affinity:
    #     - { country: USA, role: home_bar, confidence: very_high }
    #     - { country: ENG, role: general_soccer, confidence: high }
    aff_match = re.search(
        r"^country_affinity:\s*\n((?:\s+-.*\n)+)",
        block_text,
        flags=re.M,
    )
    if not aff_match:
        return ["*"]  # default fallback

    countries: set[str] = set()
    has_general = False
    for line in aff_match.group(1).splitlines():
        c = re.search(r"country:\s*([A-Z*]+)", line)
        r = re.search(r"role:\s*([a-z_]+)", line)
        if c:
            countries.add(c.group(1))
        if r and r.group(1) == "general_soccer":
            has_general = True

    out = sorted(countries)
    if has_general and "*" not in out:
        out.append("*")
    return out or ["*"]


def yaml_array(items: list[str]) -> str:
    return "[" + ", ".join(f'"{it}"' for it in items) + "]"


def inject_bar_block(block_text: str, lat: float, lng: float, place_id: str,
                     affiliations: list[str]) -> str:
    """Replace lat: TBD / lng: TBD with real values, then insert
    place_id: and country_affiliations: lines right after lng:.
    """
    # Replace lat/lng TBD
    block_text = re.sub(r"^lat:\s*TBD\s*$", f"lat: {lat}", block_text, flags=re.M)
    block_text = re.sub(r"^lng:\s*TBD\s*$", f"lng: {lng}", block_text, flags=re.M)

    # Insert place_id + country_affiliations after the lng line
    aff_yaml = yaml_array(affiliations)
    block_text = re.sub(
        r"^(lng:\s*-?\d+\.?\d*)$",
        f'\\1\nplace_id: "{place_id}"\ncountry_affiliations: {aff_yaml}',
        block_text,
        count=1,
        flags=re.M,
    )
    return block_text


def main() -> int:
    resolved = json.loads(RESOLVED_PATH.read_text())
    by_id = {r["id"]: r for r in resolved if r.get("place_id")}

    raw = BARS_PATH.read_text()
    blocks = re.split(r"^---[ \t]*$", raw, flags=re.M)

    changes = 0
    for i, blk in enumerate(blocks):
        m = re.search(r"^id:\s*(\S+)\s*$", blk, flags=re.M)
        if not m:
            continue
        bar_id = m.group(1)
        if bar_id not in by_id:
            continue
        r = by_id[bar_id]
        affiliations = derive_affiliations(blk)
        new_blk = inject_bar_block(
            blk, r["lat"], r["lng"], r["place_id"], affiliations
        )
        if new_blk != blk:
            blocks[i] = new_blk
            changes += 1
            sys.stderr.write(
                f"  ✓ {bar_id}: lat={r['lat']:.4f} lng={r['lng']:.4f} "
                f"affil={affiliations}\n"
            )

    BARS_PATH.write_text("---".join(blocks))
    sys.stderr.write(f"\nupdated {changes} bar blocks in {BARS_PATH}\n")
    return 0 if changes == len(by_id) else 1


if __name__ == "__main__":
    sys.exit(main())
