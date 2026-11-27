# CLAUDE.md — Backend

> Hérite du `CLAUDE.md` racine. Ne contient que ce qui est propre au backend.

## Stack & commandes
- Python 3.9, FastAPI, PyTorch, NumPy (versions figées dans `requirements.txt`).
- Installer : `python3 -m venv venv && ./venv/bin/pip install -r requirements.txt`
- Lancer (depuis `backend/`) : `./venv/bin/uvicorn main:app --reload --port 8000` — doc interactive sur `/docs`.
- Réentraîner le modèle : supprimer `cycle_study_dl.pth` puis relancer (≈ 1 s, données synthétiques).

## Structure des dossiers
- `main.py` : API (`/api/predict`, `/api/sos-rebalance`), CORS ouvert pour le dev.
- `model_dl.py` : réseau `CycleStudyNet` (10 entrées → capacité 0-1 + 4 types de révision) et génération du jeu de données simulé.
- `scripts/build_psy_map.py` : régénère `frontend/data/psy/` (carte des psychologues) à partir de l'extraction RPPS
  de data.gouv.fr (« Annuaire Santé … Format Zip »). Python standard, sans venv :
  `python3 backend/scripts/build_psy_map.py PS_LibreAcces_xxx.zip` (≈ 10 min ; cache du géocodage dans `.cache/`).

## Conventions
- Contrat d'API : voir `docs/api.md`. `MODEL_PATH` est relatif : lancer depuis `backend/`.
- Le modèle est entraîné sur des données **simulées** : résultats présentés comme indicatifs.
- Le mode SOS ne déplace jamais une tâche après sa deadline.
