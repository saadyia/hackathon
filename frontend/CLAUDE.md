# CLAUDE.md — Frontend

> Hérite du `CLAUDE.md` racine. Ne contient que ce qui est propre au frontend.

## Stack & commandes
- HTML/CSS/JS vanilla, modules ES natifs : **aucun build, aucune dépendance npm**.
- Lancer : `python3 -m http.server 8000 --directory frontend` (les modules ES ne fonctionnent pas en `file://`).
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
js/storage.js       # persistance localStorage + générateur de données de démo
js/dates.js         # utilitaires de dates (clés locales "YYYY-MM-DD")
js/pages/index.js   # registre des pages secondaires
js/pages/<pilier>.js # une page par pilier (s-informer, se-soigner, se-comprendre)
```

## Conventions
- **Ajouter une question** = ajouter un objet dans `js/questions.js` (types : `toggle`, `single`, `multi`, `scale`, `text` ; `layout: 'rating'` pour une échelle 1-5 ; `showIf` pour l'affichage conditionnel). Ne pas toucher à `checkin.js` pour ça.
- Les **valeurs** stockées sont des codes anglais stables (`'heavy'`, `'cramps'`), les **libellés** en français : on peut changer un libellé sans casser les données (important pour le futur ML).
- Dates : toujours passer par `toKey()` / `fromKey()` de `dates.js`, jamais `toISOString()` (décalage UTC).
- Couleurs : uniquement via les variables CSS de `:root`.
- Un module = une responsabilité ; les rendus remplacent `innerHTML` d'un conteneur et réattachent leurs événements.
- Toute la donnée passe par `storage.js` : c'est le seul fichier à modifier pour brancher le backend.
