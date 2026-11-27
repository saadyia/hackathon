"""Construit les données de la carte des psychologues (France entière).

Étapes :
  1. lit l'extraction officielle « PS_LibreAcces » de l'Annuaire Santé (RPPS, Licence Ouverte) ;
  2. garde les psychologues ayant une adresse d'exercice ;
  3. géocode les adresses avec la Base Adresse Nationale (Géoplateforme, service public gratuit) :
     seules les adresses sont envoyées, jamais les noms ;
  4. écrit frontend/data/psy/index.json, communes.json et un fichier par département.

Usage (depuis la racine du projet, Python 3.9+, aucune dépendance) :
  python3 backend/scripts/build_psy_map.py chemin/vers/PS_LibreAcces_xxx.zip [--cache dossier]

Le zip se télécharge sur data.gouv.fr : « Annuaire Santé - Extractions des données en libre accès
des professionnels intervenant dans le système de Santé (RPPS) - Format Zip ».
Les réponses du géocodeur sont mises en cache : relancer le script reprend là où il s'était arrêté.
"""

import argparse
import csv
import io
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request
import uuid
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

GEOCODER = "https://data.geopf.fr/geocodage"
CHUNK = 5000
ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "frontend" / "data" / "psy"
STUDENT = re.compile(r"^(BAPU|UNIVERSITE|SERVICE (DE )?SANTE (UNIVERSITAIRE|ETUDIANT)|SUMPPS|SSU|SSE)\b")


def log(*a):
    print(*a, file=sys.stderr, flush=True)


# ---------- 1. Lecture de l'extraction ----------

def read_rows(zip_path):
    with zipfile.ZipFile(zip_path) as z:
        name = next(n for n in z.namelist() if "Personne_activite" in n)
        with z.open(name) as f:
            src = io.TextIOWrapper(f, encoding="utf-8", errors="replace")
            header = src.readline().rstrip("\n").split("|")
            ix = {h: i for i, h in enumerate(header)}
            for line in src:
                r = line.rstrip("\n").split("|")
                g = lambda h: r[ix[h]].strip() if ix[h] < len(r) else ""
                if g("Libellé profession") != "Psychologue":
                    continue
                city_code = g("Code commune (coord. structure)")
                if not city_code and not g("Code postal (coord. structure)"):
                    continue  # pas d'adresse d'exercice : impossible à cartographier
                street = " ".join(x for x in [g("Numéro Voie (coord. structure)"), g("Indice répétition voie (coord. structure)"),
                                              g("Libellé type de voie (coord. structure)"), g("Libellé Voie (coord. structure)")] if x)
                yield {
                    "rpps": g("Identifiant PP"),
                    "first": g("Prénom d'exercice"),
                    "last": g("Nom d'exercice"),
                    "mode": "L" if g("Libellé mode exercice").startswith("Lib") else "S",
                    "sector": g("Libellé secteur d'activité"),
                    "site": g("Enseigne commerciale site") or g("Raison sociale site"),
                    "street": street,
                    "cp": g("Code postal (coord. structure)"),
                    "city": " ".join(g("Libellé commune (coord. structure)").split()),
                    "citycode": city_code,
                    "tel": g("Téléphone (coord. structure)"),
                    "email": g("Adresse e-mail (coord. structure)"),
                }


# ---------- 2. Géocodage (Base Adresse Nationale) ----------

def post_csv(rows, fields, params):
    """Envoie un CSV au géocodeur par lots (/search/csv) et renvoie les lignes résultat."""
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(fields)
    w.writerows(rows)
    boundary = uuid.uuid4().hex
    parts = []
    for k, v in params:
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="data"; filename="a.csv"\r\n'
                 f"Content-Type: text/csv\r\n\r\n".encode() + buf.getvalue().encode() + b"\r\n")
    body = b"".join(parts) + f"--{boundary}--\r\n".encode()
    req = urllib.request.Request(f"{GEOCODER}/search/csv", data=body,
                                 headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=600) as res:
                return list(csv.DictReader(io.StringIO(res.read().decode("utf-8"))))
        except urllib.error.HTTPError as e:
            if e.code != 429 and e.code < 500:
                raise RuntimeError(f"requête refusée par le géocodeur : {e.read()[:200]!r}") from e
            log(f"  géocodeur indisponible ({e}), nouvel essai dans {10 * (attempt + 1)} s")
            time.sleep(10 * (attempt + 1))
        except OSError as e:  # coupure réseau, délai dépassé : on patiente puis on réessaie
            log(f"  géocodeur indisponible ({e}), nouvel essai dans {10 * (attempt + 1)} s")
            time.sleep(10 * (attempt + 1))
    raise RuntimeError("géocodeur injoignable")


def geocode(keys, cache_dir, kind):
    """keys : liste de tuples. Renvoie {clé: résultat}. Résultats mis en cache par lot."""
    cache_dir.mkdir(parents=True, exist_ok=True)
    out = {}
    for i in range(0, len(keys), CHUNK):
        chunk = keys[i:i + CHUNK]
        cache = cache_dir / f"{kind}-{i // CHUNK:04d}.json"
        if cache.exists():
            data = json.loads(cache.read_text())
        else:
            log(f"  {kind} : lot {i // CHUNK + 1}/{(len(keys) - 1) // CHUNK + 1} ({len(chunk)} lignes)")
            if kind == "address":
                res = post_csv(chunk, ["street", "city", "citycode"],
                               [("columns", "street"), ("columns", "city"), ("citycode", "citycode")])
            else:
                # Pour l'API CSV, `type` désigne une colonne contenant le type voulu.
                res = post_csv([(*k, "municipality") for k in chunk], ["city", "citycode", "kind"],
                               [("columns", "city"), ("citycode", "citycode"), ("type", "kind")])
            data = [[r.get("latitude"), r.get("longitude"), r.get("result_score"), r.get("result_type"),
                     r.get("result_context")] for r in res]
            cache.write_text(json.dumps(data))
        for k, d in zip(chunk, data):
            out[k] = d
    return out


# ---------- 3. Construction des fichiers ----------

def dep_of(citycode, cp):
    code = citycode or cp
    if code.startswith(("97", "98")):  # outre-mer : code à 3 chiffres
        return code[:3]
    if code.startswith("20") and citycode:
        return citycode[:2]  # 2A / 2B
    if code.startswith("20"):
        return "2A" if int(cp or 0) < 20200 else "2B"
    return code[:2]


def pretty_name(first, last):
    first = " ".join("-".join(p[:1].upper() + p[1:] for p in w.split("-")) for w in first.lower().split())
    return f"{first} {last.upper()}".strip()


def extraction_date(zip_path):
    """Date de l'extraction, lue dans le nom du fichier contenu (…_AAAAMMJJhhmm.txt) → JJ/MM/AAAA."""
    with zipfile.ZipFile(zip_path) as z:
        m = next((re.search(r"_(\d{4})(\d{2})(\d{2})\d{4}\.txt$", n) for n in z.namelist()), None)
    return f"{m[3]}/{m[2]}/{m[1]}" if m else "date inconnue"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("zip")
    ap.add_argument("--cache", default=str(ROOT / ".cache" / "geocode"))
    args = ap.parse_args()
    cache_dir = Path(args.cache)

    log("1/4 Lecture de l'extraction…")
    rows = list(read_rows(args.zip))
    log(f"  {len(rows)} lignes de psychologues avec adresse")

    log("2/4 Géocodage des adresses…")
    addr_keys = sorted({(r["street"], r["city"], r["citycode"]) for r in rows if r["street"]})
    addr = geocode(addr_keys, cache_dir, "address")
    town_keys = sorted({(r["city"], r["citycode"]) for r in rows})
    towns = geocode(town_keys, cache_dir, "town")

    log("3/4 Regroupement par adresse…")
    # Point de chaque fiche : adresse si fiable, sinon centre de la commune.
    located = []
    for r in rows:
        hit = addr.get((r["street"], r["city"], r["citycode"])) if r["street"] else None
        ok = bool(hit and hit[0] and float(hit[2] or 0) >= 0.45 and hit[3] != "municipality")
        town = towns.get((r["city"], r["citycode"]))
        town = town if town and town[0] else None
        if ok or town:
            located.append((r, hit if ok else town, ok, town))

    # Garde-fou : un point trop loin du centre (médiane) de son département est une erreur
    # de géocodage → on se replie sur la commune, ou on écarte la fiche si la commune est fausse aussi.
    # ≈ 150 km en métropole ; plus large outre-mer (la Guyane fait ~ 400 km de large).
    max_deg = lambda dep: 3.0 if len(dep) == 3 else 1.4
    by_dep_pts = defaultdict(list)
    for r, hit, _, _ in located:
        by_dep_pts[dep_of(r["citycode"], r["cp"])].append((float(hit[0]), float(hit[1])))
    median = {}
    for dep, pts in by_dep_pts.items():
        lats = sorted(p[0] for p in pts)
        lngs = sorted(p[1] for p in pts)
        median[dep] = (lats[len(lats) // 2], lngs[len(lngs) // 2])
    near = lambda h, dep: abs(float(h[0]) - median[dep][0]) <= max_deg(dep) and abs(float(h[1]) - median[dep][1]) <= max_deg(dep)

    places = {}
    dep_names = {}
    approx_count = 0
    outliers = 0
    for r, hit, ok, town in located:
        dep = dep_of(r["citycode"], r["cp"])
        if not near(hit, dep):
            outliers += 1
            if ok and town and near(town, dep):
                hit, ok = town, False
            else:
                continue
        if not ok:
            approx_count += 1
        lat, lng = round(float(hit[0]), 5), round(float(hit[1]), 5)
        ctx = (hit[4] or "").split(", ")
        if len(ctx) >= 2:
            dep_names.setdefault(dep, ctx[1])
        key = (dep, lat, lng, not ok)
        place = places.setdefault(key, {"lat": lat, "lng": lng, "cp": r["cp"], "city": r["city"], "people": []})
        if ok:
            place.setdefault("addr", r["street"])
        else:
            place["approx"] = True
        person = {"name": pretty_name(r["first"], r["last"]), "mode": r["mode"], "sector": r["sector"],
                  "site": r["site"], "tel": r["tel"], "email": r["email"]}
        person = {k: v for k, v in person.items() if v}
        if person not in place["people"]:
            place["people"].append(person)

    log("4/4 Écriture des fichiers…")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUT_DIR.glob("*.json"):
        old.unlink()
    by_dep = defaultdict(list)
    for (dep, *_), p in places.items():
        by_dep[dep].append(p)

    index = {}
    communes = defaultdict(lambda: [0, 0.0, 0.0])
    for dep, plist in sorted(by_dep.items()):
        plist.sort(key=lambda p: (p["city"], p.get("addr", "")))
        (OUT_DIR / f"{dep}.json").write_text(json.dumps({"places": plist}, ensure_ascii=False, separators=(",", ":")))
        people = [x for p in plist for x in p["people"]]
        counts = Counter(x["mode"] for x in people)
        lats = [p["lat"] for p in plist]
        lngs = [p["lng"] for p in plist]
        index[dep] = {
            "name": dep_names.get(dep, dep),
            "n": len(people), "L": counts["L"], "S": counts["S"],
            "student": sum(1 for x in people if STUDENT.match(unicodedata.normalize("NFD", x.get("site", "")).encode("ascii", "ignore").decode().upper())),
            # centre pondéré + emprise (sud, ouest, nord, est) pour le chargement à la demande
            "lat": round(sum(p["lat"] * len(p["people"]) for p in plist) / len(people), 4),
            "lng": round(sum(p["lng"] * len(p["people"]) for p in plist) / len(people), 4),
            "bbox": [min(lats), min(lngs), max(lats), max(lngs)],
        }
        for p in plist:
            c = communes[(p["city"], dep)]
            n = len(p["people"])
            c[1] = (c[1] * c[0] + p["lat"] * n) / (c[0] + n)
            c[2] = (c[2] * c[0] + p["lng"] * n) / (c[0] + n)
            c[0] += n

    total = sum(d["n"] for d in index.values())
    meta = {
        "source": "Annuaire Santé (RPPS) — Agence du Numérique en Santé, Licence Ouverte. "
                  f"Extraction du {extraction_date(args.zip)}, géocodage Base Adresse Nationale.",
        "total": total,
        "deps": index,
    }
    (OUT_DIR / "index.json").write_text(json.dumps(meta, ensure_ascii=False, separators=(",", ":")))
    (OUT_DIR / "communes.json").write_text(json.dumps(
        sorted([[city, dep, round(lat, 4), round(lng, 4), n] for (city, dep), (n, lat, lng) in communes.items()]),
        ensure_ascii=False, separators=(",", ":")))
    log(f"Terminé : {total} fiches, {len(places)} lieux, {len(index)} départements, "
        f"{approx_count} fiches placées au centre de leur commune, {outliers} points aberrants corrigés ou écartés.")


if __name__ == "__main__":
    main()
