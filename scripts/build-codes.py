#!/usr/bin/env python3
"""Build src/data/codes.json from the DMDC military occupation crosswalk (CSV), as published by the
O*NET Resource Center: https://www.onetcenter.org/crosswalks.html  ("Military Crosswalk" zip).

Usage:
  python3 scripts/build-codes.py path/to/milx0724.csv

Keeps the codes veterans actually put on a resume: Army MOS (enlisted, warrant, officer), Marine Corps MOS,
Air Force and Space Force AFSC (merged across skill levels, so 3E032/3E052/3E072 become 3E0X2), and Navy and
Coast Guard ratings. Drops qualifiers and prefixes (ASI, SQI, SEI, NEC, billet codes) and civilian codes.
Obsolete codes are kept (people left the service years ago) but marked retired, and only when their title
differs from the current meaning of the same code.
"""
import csv
import json
import re
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "codes.json"
SERVICES = {"A": "Army", "M": "Marine Corps", "F": "Air Force", "H": "Space Force", "N": "Navy", "C": "Coast Guard"}
AF_LEVEL_WORDS = re.compile(r"\b(Helper|Apprentice|Journeyman|Craftsman|Superintendent)\b\s*")
AFSC = re.compile(r"^(\d[A-Z]\d)[0-9X](\d)([A-Z]?)$")


def clean(text):
    return re.sub(r"\s+", " ", (text or "").strip())


def keep(svc, code):
    if svc == "N":  # ratings only (2-4 letters); NEC and billet codes are numeric
        return bool(re.fullmatch(r"[A-Z]{2,4}", code))
    return bool(re.fullmatch(r"[0-9A-Z]{2,6}", code))


def normalize(svc, code, title):
    """AFSC/SFSC skill levels collapse to the X form; the level word is dropped from the title."""
    m = AFSC.match(code) if svc in ("F", "H") else None
    if not m:
        return code, title
    title = clean(AF_LEVEL_WORDS.sub("", title)).replace(" ,", ",")
    return f"{m.group(1)}X{m.group(2)}{m.group(3)}", title


def main(path):
    rows = list(csv.DictReader(open(path, encoding="utf-8-sig", newline="")))
    onet_titles = {}
    entries = {}  # (svc, code) -> {"active": {title: row}, "retired": {title: row}}
    for r in rows:
        svc, code, mpc = r["SVC"], clean(r["MOC"]).upper(), r["MPC"]
        if svc not in SERVICES or mpc not in "EWO" or mpc == "-" or not keep(svc, code):
            continue
        code, title = normalize(svc, code, clean(r["MOC_TITLE"]))
        if not title:
            continue
        slot = entries.setdefault((svc, code), {"active": {}, "retired": {}})
        bucket = slot["retired" if r["STATUS"] in ("O",) else "active"]
        onets = []
        for i in range(1, 5):
            o, t = clean(r[f"ONET{i}"]), clean(r[f"ONET{i}_TITLE"])
            if o and t:
                onets.append(o)
                onet_titles[o] = t
        prev = bucket.get(title)
        if prev is None or (not prev["onets"] and onets):
            bucket[title] = {"mpc": mpc, "onets": onets, "edate": r["EDATE"]}

    # Space Force still shares most AFSCs with the Air Force; list a code under Space Force only when it differs.
    for (svc, code), slot in list(entries.items()):
        twin = entries.get(("F", code))
        if svc == "H" and twin and {t.lower() for t in slot["active"]} <= {t.lower() for t in twin["active"]}:
            slot["active"] = {}
            slot["retired"] = {t: v for t, v in slot["retired"].items() if t.lower() not in {x.lower() for x in twin["retired"]}}

    out_rows = []
    for (svc, code), slot in sorted(entries.items(), key=lambda kv: (kv[0][1], kv[0][0])):
        active_titles = {t.lower() for t in slot["active"]}
        for title, v in sorted(slot["active"].items()):
            out_rows.append([svc, code, title, v["mpc"], 0, v["onets"]])
        retired = [(t, v) for t, v in slot["retired"].items() if t.lower() not in active_titles]
        if retired:  # the most recently retired meaning is the likeliest match
            title, v = max(retired, key=lambda tv: tv[1]["edate"])
            out_rows.append([svc, code, title, v["mpc"], 1, v["onets"]])

    data = {
        "source": "DMDC Military Occupational Classification crosswalk, published by the O*NET Resource Center (onetcenter.org/crosswalks.html)",
        "services": SERVICES,
        "onet": onet_titles,
        "rows": out_rows,  # [service, code, title, personnel category (E/W/O), retired (0/1), O*NET-SOC codes]
    }
    OUT.write_text(json.dumps(data, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    kb = OUT.stat().st_size / 1024
    print(f"Wrote {OUT.relative_to(OUT.parent.parent.parent)}: {len(out_rows)} codes, {len(onet_titles)} civilian titles, {kb:.0f} KB")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
