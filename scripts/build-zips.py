#!/usr/bin/env python3
"""Build src/data/zips.json (ZIP code -> town and location) from the GeoNames US postal code file.

Source: https://download.geonames.org/export/zip/US.zip (US.txt inside). GeoNames data is licensed
CC BY 4.0, so keep the attribution shown in the app and in CLAUDE.md.

Usage:
  python3 scripts/build-zips.py path/to/US.txt            # New Jersey only (matches the map's coverage)
  python3 scripts/build-zips.py path/to/US.txt NJ NY PA   # chosen states
  python3 scripts/build-zips.py path/to/US.txt all        # every state (about 2 MB)
"""
import csv
import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "zips.json"


def main(path, states):
    rows = []
    for r in csv.reader(open(path, encoding="utf-8"), delimiter="\t"):
        if len(r) < 11 or (states != {"ALL"} and r[4] not in states):
            continue
        # [zip, town, state, county, latitude, longitude]
        rows.append([r[1], r[2], r[4], r[5], round(float(r[9]), 4), round(float(r[10]), 4)])
    rows.sort()
    data = {"source": "GeoNames postal codes (geonames.org), CC BY 4.0", "rows": rows}
    OUT.write_text(json.dumps(data, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT.relative_to(OUT.parent.parent.parent)}: {len(rows)} ZIP codes, {OUT.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1], {s.upper() for s in sys.argv[2:]} or {"NJ"})
