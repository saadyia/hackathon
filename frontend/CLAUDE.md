# CLAUDE.md — Frontend

> Hérite du `CLAUDE.md` racine. Ne contient que ce qui est propre au frontend.

## Stack & commandes
- HTML/CSS/JS vanilla, modules ES natifs : **aucun build, aucune dépendance npm**.
- Lancer : `python3 -m http.server 5500 --directory frontend` (les modules ES ne fonctionnent pas en `file://`). Le port 8000 est réservé à l'API (`backend/`).
- Polices Google Fonts (DM Sans, Fraunces) avec repli sur les polices système.

## Structure des dossiers
```
index.html          # coquille : en-tête, navigation, <main>, toast
css/styles.css      # tokens de design (:root) + tous les styles
js/app.js           # point d'entrée : routage par hash (#accueil, #s-informer…) + tableau de bord
js/questions.js     # ★ configuration des questions du suivi quotidien (piloté par les données)
js/checkin.js       # génère le formulaire à partir de questions.js
js/calendar.js      # calendrier mensuel (règles, prédictions, fenêtre fertile)
js/cycle.js         # calculs : périodes, moyennes, prédictions, phase du cycle
js/storage.js       # persistance localStorage (saisies, tâches de révision, analyses) + données de démo
js/api.js           # client de l'API Deep Learning (/api/predict, /api/sos-rebalance) : seul module réseau
js/dates.js         # utilitaires de dates (clés locales "YYYY-MM-DD")
js/map.js           # carte des psychologues en France (Leaflet chargé à la demande depuis unpkg)
data/psy/           # données de la carte, générées par backend/scripts/build_psy_map.py (ne pas éditer à la main) :
                    #   index.json (résumé par département), communes.json (recherche), <dép>.json (adresses)
js/pages/index.js   # registre des pages secondaires
js/pages/<pilier>.js # une page par pilier (s-informer, se-soigner, se-comprendre)
js/aides/           # page « Se soigner » : simulateur des aides et remboursements (styles : section « Se soigner » du CSS)
```

## Conventions
- **Ajouter une question** = ajouter un objet dans `js/questions.js` (types : `toggle`, `single`, `multi`, `scale`, `number`, `text` ; `layout: 'rating'` pour une échelle 1-5 ; `showIf` pour l'affichage conditionnel). Ne pas toucher à `checkin.js` pour ça.
- Les **valeurs** stockées sont des codes anglais stables (`'heavy'`, `'cramps'`), les **libellés** en français : on peut changer un libellé sans casser les données (important pour le futur ML).
- Dates : toujours passer par `toKey()` / `fromKey()` de `dates.js`, jamais `toISOString()` (décalage UTC).
- Couleurs : uniquement via les variables CSS de `:root`.
- Un module = une responsabilité ; les rendus remplacent `innerHTML` d'un conteneur et réattachent leurs événements.
- Toute la donnée locale passe par `storage.js` ; tous les appels réseau passent par `api.js` (mapping des réponses du check-in → critères du modèle dans `buildPredictPayload`).
- Direction artistique : violet (`--primary`, identité/actions) + jaune (`--sun*`, énergie/SOS). Pas de rose. Le jaune ne sert jamais de couleur de texte sur fond clair.
