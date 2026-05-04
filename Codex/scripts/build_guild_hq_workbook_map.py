"""Match Excel workbook HQ names to canon realm_id and emit JSON for Codex."""
import json
import re
import openpyxl

XLSX = r"c:\Antigravity local\LH\Video Game\Project Documents\Gamified Cluster headquarter Names (1).xlsx"
OUT = r"c:\Antigravity local\LH\Video Game\Codex\data\samples\guild_hq_workbook_image_map.json"

# guild_headquarters from canonRealms (must stay aligned)
CANON_HQ = [
    ("realm_aethelwood", "Aethelwood Farmsteads"),
    ("realm_monolith_masonry", "Monolith of Masonry"),
    ("realm_chroniclers_spire", "Chronicler's Spire"),
    ("realm_mercantile_citadel", "Mercantile's Citadel"),
    ("realm_archives_ascension", "The Archives of Ascension"),
    ("realm_gilded_vault", "The Gilded Vault"),
    ("realm_high_council_hall", "The High Council Hall"),
    ("realm_aurora_apothecary", "Aurora Apothecary"),
    ("realm_crossroads_haven", "The Crossroads Haven"),
    ("realm_empaths_enclave", "Empath's Enclave"),
    ("realm_etheric_nexus", "The Etheric Nexus"),
    ("realm_valors_watchtower", "Valor's Watchtower"),
    ("realm_vulcanis_forge", "The Great Vulcanis Forge"),
    ("realm_bards_beacon", "The Bard's Beacon"),
    ("realm_alchemical_observatory", "The Alchemical Observatory"),
    ("realm_odyssey_harbor", "Odyssey's Harbor"),
]


def norm(s: str) -> str:
    s = (s or "").strip().lower()
    s = s.replace("’", "'").replace("`", "'")
    s = re.sub(r"[^a-z0-9]+", "", s)
    return s


def extract_file_id(url: str | None) -> str | None:
    if not url or not isinstance(url, str):
        return None
    u = url.strip()
    m = re.search(r"[?&]id=([a-zA-Z0-9_-]+)", u)
    if m:
        return m.group(1)
    m = re.search(r"/file/d/([a-zA-Z0-9_-]+)/", u)
    if m:
        return m.group(1)
    return None


hq_to_realm = {norm(hq): rid for rid, hq in CANON_HQ}

wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
ws = wb.active
rows = list(ws.iter_rows(min_row=2, max_row=25, values_only=True))
out = []
seen = set()
for row in rows:
    if not row or row[0] is None:
        continue
    cluster, hq_name, _lore, _old_url, new_url = (row[0], row[1], row[2], row[3], row[4])
    if not hq_name or str(hq_name).strip().lower() in ("legendary horizons", "soundtrack", "sound effect"):
        continue
    key = norm(str(hq_name))
    rid = hq_to_realm.get(key)
    if not rid:
        # fuzzy: try contains
        for nk, r in hq_to_realm.items():
            if nk in key or key in nk:
                rid = r
                break
    if not rid:
        print("SKIP unmatched:", hq_name)
        continue
    url = (str(new_url).strip() if new_url else "") or (str(_old_url).strip() if _old_url else "")
    fid = extract_file_id(url)
    if not fid and not url:
        continue
    if rid in seen:
        continue
    seen.add(rid)
    entry = {
        "realm_id": rid,
        "workbook_hq_label": str(hq_name).strip(),
        "workbook_career_cluster": str(cluster).strip() if cluster else "",
        "hero_image_url": url if url else None,
        "drive_file_id": fid,
    }
    out.append(entry)

out.sort(key=lambda x: x["realm_id"])
with open(OUT, "w", encoding="utf-8") as f:
    json.dump({"schema_version": 1, "source": "Gamified Cluster headquarter Names (1).xlsx", "entries": out}, f, indent=2)
    f.write("\n")
print("Wrote", OUT, "count", len(out))
wb.close()
