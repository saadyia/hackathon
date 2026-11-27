# Architecture

## Vue d'ensemble
```
Navigateur
 └─ frontend/ (statique)
     app.js ──► calendar.js ─┐
        │                    ├─► cycle.js (calculs purs)
        └──► checkin.js ◄── questions.js (configuration)
                 │
             storage.js ──► localStorage   (plus tard : API backend)
```

## Composants
<!-- Pour chaque composant : rôle, techno, responsabilités. -->
Voir `frontend/CLAUDE.md` pour le rôle de chaque module.

## Modèle de données
Une saisie par jour, indexée par date locale :
```json
{ "2026-11-27": { "period": true, "flow": "medium", "pains": ["cramps"], "painLevel": 6,
                  "mood": ["sensitive"], "energy": 2, "sleep": 3, "context": ["lecture", "exam"],
                  "focus": 2, "productivity": 3, "stress": 4, "missedClass": false, "note": "…" } }
```
Toutes les clés sont optionnelles. Les échelles vont de 1 à 5, `painLevel` de 1 à 10.

## Décisions techniques
- **JS vanilla sans build** — Node indisponible sur la machine et mise en route immédiate pour 4 personnes — React+Vite écarté pour l'instant.
- **Questions pilotées par configuration** — ajouter ou modifier des questions sans toucher à l'interface ; codes de valeurs stables pour le ML.
- **Prédiction simple** (moyenne des 6 derniers cycles, ovulation à J-14) — suffisant pour la démo ; à remplacer ou compléter par le ML.
