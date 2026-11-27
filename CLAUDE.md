# CLAUDE.md — Projet Hackathon

> Contexte principal du projet. Garder ce fichier court : le détail va dans `docs/`.
> Les `CLAUDE.md` des sous-dossiers (`frontend/`, `backend/`) complètent celui-ci.

## 1. Vue d'ensemble & objectifs
Application de santé féminine pour les **étudiantes**, développée par une équipe de 4 étudiants.
- **Nom du projet :** Éclore (nom provisoire)
- **Problème :** l'information, l'accès aux soins et aux aides sont dispersés et ne tiennent pas compte des contraintes universitaires (examens, stress, emploi du temps, budget).
- **Solution :** une app qui centralise 4 piliers :
  1. **Accueil / tableau de bord** (prioritaire) : calendrier de suivi menstruel + questions quotidiennes (cycle **et** vie étudiante : concentration, productivité, stress…)
  2. **S'informer** : comprendre les ressources disponibles
  3. **Se soigner** : accéder aux soins et aux aides financières
  4. **Se comprendre** : suivre et documenter sa santé, puis conseils personnalisés par machine learning après un temps d'utilisation
- **Critères de réussite / jury :** _à définir_
- **Échéance (deadline) :** _à définir_

## 2. Stack technique & commandes
<!-- Langages, frameworks, BDD, services externes, hébergement. -->
| Couche     | Technologie |
|------------|-------------|
| Couche     | Technologie |
|------------|-------------|
| Frontend   | HTML + CSS + JavaScript vanilla (modules ES), **sans build ni dépendance** |
| Backend    | _à définir_ (pressenti : Python, pour la partie ML) |
| Données    | `localStorage` du navigateur pour l'instant (`frontend/js/storage.js`) |
| Déploiement| _à définir_ (tout hébergeur statique suffit pour le frontend) |

```bash
# Lancement (dev) — depuis la racine du projet, puis ouvrir http://localhost:8000
python3 -m http.server 8000 --directory frontend

# Build : aucun
# Tests / lint : à définir
```
> Node.js n'est pas installé sur la machine de dev : ne pas introduire npm/Vite sans accord de l'équipe.

## 3. Règles d'architecture & conventions de code
<!-- Règles NON négociables que Claude doit toujours respecter. -->
- **Langue :** interface et contenus en français, tutoiement de l'utilisatrice, ton bienveillant et non culpabilisant.
- **Code :** identifiants en anglais (`camelCase`), commentaires en français.
- **Données de santé = sensibles :** rien ne quitte l'appareil sans consentement explicite ; jamais de données réelles dans le dépôt.
- **Pas de promesse médicale :** les prédictions et conseils sont toujours présentés comme indicatifs (pas de contraception, pas de diagnostic).
- **Accessibilité :** boutons natifs, `aria-pressed` pour les choix, navigation clavier, contrastes suffisants, mobile en priorité.
- **Secrets :** `.env` jamais commité.
- **Git (travail à 4) :** suivre `CONTRIBUTING.md`. Jamais de commit direct sur `main` : une branche `prenom/sujet` par tâche, `git rebase origin/main` avant de pousser, puis Pull Request. À la fin de chaque étape : commit clair en français + push de la branche.
- **Éviter les conflits :** un pilier = un fichier (`frontend/js/pages/<pilier>.js`). Modifier un fichier partagé (CSS, `index.html`, `pages/index.js`, docs) seulement si la tâche l'exige, avec des changements limités.

## 4. Fichiers de contexte secondaires
<!-- À lire à la demande selon la tâche. Pour charger un fichier systématiquement,
     préfixer son chemin par @ (ex: @docs/specs.md). -->
- `docs/architecture.md` — architecture globale, composants, flux de données
- `docs/specs.md` — spécifications fonctionnelles, user stories, périmètre MVP
- `docs/api.md` — contrat d'API (endpoints, schémas, erreurs)
- `docs/todo.md` — backlog, tâches en cours, décisions en attente
- `CONTRIBUTING.md` — méthode Git de l'équipe (branches, PR, conflits)
- `frontend/CLAUDE.md` — règles spécifiques au frontend
- `backend/CLAUDE.md` — règles spécifiques au backend
