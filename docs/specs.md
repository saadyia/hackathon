# Spécifications fonctionnelles

## Utilisateurs cibles
Étudiantes (université, écoles), souvent avec un budget serré, des pics de stress (partiels, rendus) et un emploi du temps chargé (cours, stage, job étudiant).

## Périmètre MVP (doit être démo-able)
1. **Accueil / tableau de bord** ✅ première version faite
   - Carte « Mon cycle » : jour du cycle, phase estimée, prochaines règles, retard, conseil
   - Calendrier mensuel : règles enregistrées, règles prévues, fenêtre fertile/ovulation estimées, jours remplis
   - Suivi du jour (aussi pour les jours passés) :
     - *Mon cycle* : règles (oui/non), flux, douleurs + intensité, humeur, énergie, sommeil
     - *Ma vie étudiante* : programme du jour, concentration, satisfaction de la productivité, stress, cours manqué pour raison de santé
     - *Notes* libres
2. **S'informer** — page provisoire « bientôt disponible »
3. **Se soigner** — page provisoire
4. **Se comprendre** — page provisoire (statistiques + conseils par machine learning à venir)

## User stories
- En tant qu'étudiante, je veux noter mes règles en un clic afin de prévoir les prochaines.
- En tant qu'étudiante, je veux noter ma concentration et mon stress afin de voir si mon cycle influence mes études.
- En tant qu'étudiante, je veux noter les cours manqués à cause de ma santé afin de pouvoir le justifier ou en parler à un médecin.

## Hors périmètre
- Comptes utilisateurs / synchronisation (données en local pour l'instant)
- Diagnostic médical, usage comme contraception

## Scénario de démo
1. Ouvrir l'app → « Charger des données de démo » (en bas du tableau de bord), ce qui génère environ 3 mois de suivi
2. Montrer la carte du cycle et le calendrier (règles passées, prévisions, fenêtre fertile)
3. Remplir la journée du jour (questions de cycle puis questions étudiantes) → Enregistrer
4. Naviguer vers les autres piliers pour présenter la vision du projet
