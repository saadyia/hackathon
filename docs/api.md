# Contrat d'API

## Conventions
- URL de base (dev) : `http://localhost:8000` — doc interactive : `/docs`.
- JSON uniquement, pas d'authentification (serveur local). Erreur de validation → `422` (format FastAPI).
- Client frontend : `frontend/js/api.js`.

## Endpoints

### `POST /api/predict`
- **Description :** estime la capacité cognitive du jour et le type de révision recommandé.
- **Requête :**
```json
{ "cycle_day": 11, "phase": 1, "cramps_pain": 0, "fatigue_level": 2, "brain_fog": 1,
  "mood_score": 4, "sleep_hours": 7.5, "sleep_quality": 4, "stress_level": 2, "headache_nausea": 0 }
```
  `phase` : 0 menstruelle, 1 folliculaire, 2 ovulatoire, 3 lutéale. Échelles 0-5 sauf `mood_score` / `sleep_quality` (1-5), `sleep_hours` (0-12), `headache_nausea` (0/1).
- **Réponse 200 :**
```json
{ "cognitive_capacity_percent": 70,
  "recommendation": { "type": "standard_study", "label": "Révisions régulières", "advice": "…" },
  "sos_recommended": false }
```
  `type` ∈ `rest`, `light_review`, `standard_study`, `deep_work`. `sos_recommended` = capacité < 30 %.

### `POST /api/sos-rebalance`
- **Description :** mode « journée difficile » : prédit la capacité des 7 prochains jours et replanifie les tâches du jour (offset 0) avant leur deadline. Une tâche dont la deadline est aujourd'hui reste en place.
- **Requête :**
```json
{ "current_cycle_day": 11,
  "tasks": [{ "id": "t-1", "title": "Chapitre 5", "difficulty": "high", "scheduled_day_offset": 0, "deadline_offset": 5 }] }
```
  Offsets en jours depuis aujourd'hui. `difficulty` ∈ `high`, `medium`, `low`.
- **Réponse 200 :**
```json
{ "status": "sos_activated", "message": "Mode SOS activé. 1 tâche(s) replanifiée(s)…",
  "future_capacities": { "1": 71, "2": 71, "…": 0 },
  "updated_tasks": [{ "id": "t-1", "title": "Chapitre 5", "difficulty": "high", "scheduled_day_offset": 1, "deadline_offset": 5 }] }
```

## Services externes
Aucun.
