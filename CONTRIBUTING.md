# Travailler à 4 sans écraser le travail des autres

## La règle d'or
**Personne ne travaille directement sur `main`.** `main` contient toujours une version qui marche et qu'on peut montrer au jury.
Chaque tâche se fait sur **sa propre branche**, puis rejoint `main` par une **Pull Request (PR)**.

## Qui travaille sur quoi
Chaque personne a « ses » fichiers : on évite ainsi presque tous les conflits.
Si vous devez modifier le fichier de quelqu'un d'autre, prévenez-le sur le groupe de l'équipe.

| Pilier / zone | Fichiers principaux | Responsable |
|---|---|---|
| Accueil (tableau de bord, calendrier, questions) | `frontend/js/app.js`, `calendar.js`, `checkin.js`, `questions.js`, `cycle.js` | _à définir_ |
| S'informer | `frontend/js/pages/s-informer.js` | _à définir_ |
| Se soigner | `frontend/js/pages/se-soigner.js` | _à définir_ |
| Se comprendre (stats + ML) | `frontend/js/pages/se-comprendre.js`, `backend/` | _à définir_ |
| Fichiers partagés (prévenir avant de les modifier) | `frontend/css/styles.css`, `frontend/index.html`, `frontend/js/pages/index.js`, `CLAUDE.md`, `docs/` | toute l'équipe |

## Le cycle de travail (à chaque tâche)

```bash
# 1. Partir d'un main à jour
git switch main
git pull

# 2. Créer sa branche :  prenom/description-courte
git switch -c sadia/questions-sommeil

# 3. Travailler, puis commiter souvent (petits commits, message en français)
git add .
git commit -m "Ajoute la question sur la qualité du sommeil"

# 4. Récupérer régulièrement le travail des autres (au moins 1 fois par heure)
git fetch origin
git rebase origin/main          # rejoue vos commits par-dessus le main à jour

# 5. Envoyer sa branche sur GitHub
git push -u origin sadia/questions-sommeil
#    (après un rebase sur une branche déjà poussée : git push --force-with-lease)
```

6. Sur GitHub, cliquer sur **« Compare & pull request »**, remplir le modèle et demander une relecture à un·e coéquipier·e.
7. Après validation : **« Squash and merge »**, puis **supprimer la branche**.
8. Retour à l'étape 1 pour la tâche suivante.

## En cas de conflit
Un conflit arrive quand deux personnes ont modifié les mêmes lignes. Git ne choisit pas à votre place : c'est normal, rien n'est perdu.

```bash
git rebase origin/main          # Git s'arrête sur le fichier en conflit
# Ouvrir le fichier : garder la bonne version entre <<<<<<<, ======= et >>>>>>>
# (souvent : garder LES DEUX modifications)
git add fichier-corrige.js
git rebase --continue
# En cas de doute : git rebase --abort  → on revient comme avant, et on appelle l'équipe
```

## Interdits
- `git push` directement sur `main`
- `git push --force` (sans `-with-lease`), et jamais sur `main`
- Commiter des secrets (`.env`, clés d'API) ou de vraies données de santé
- Des PR énormes : une PR = une fonctionnalité, à fusionner dans la demi-journée

## Configuration GitHub (à faire une fois, par la personne propriétaire du dépôt)
**Settings → Branches → Add branch ruleset** (ou *Add rule*) sur `main` :
- ✅ *Require a pull request before merging* (1 approbation)
- ✅ *Block force pushes*
- ✅ *Restrict deletions*

**Settings → Collaborators** : ajouter les 3 coéquipier·es avec le rôle *Write*.
