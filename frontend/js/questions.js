// Configuration des questions du suivi quotidien.
// Pour ajouter une question : ajouter un objet ici, le formulaire se génère tout seul.
//
// Types disponibles :
//   toggle : Oui / Non (valeur booléenne)
//   single : un seul choix parmi `options` (layout: 'rating' pour une échelle 1-5)
//   multi  : plusieurs choix ; `exclusive` = valeur qui désélectionne les autres (ex : "aucune")
//   scale  : curseur numérique entre `min` et `max` (`step` : pas, 1 par défaut ; `initial` : position de départ)
//   number : nombre saisi au clavier entre `min` et `max` (`step`, `unit` : unité affichée)
//   text   : champ libre (`rows` : hauteur, 3 par défaut)
// `showIf(answers)` : la question n'apparaît que si la fonction renvoie true.
// `optional: true` : remarque facultative, non comptée dans la progression.

const rating = (labels) => labels.map((label, i) => ({ value: i + 1, label }));

/** Jour de règles : « Oui » ou « Premier jour » (valeur 'first', qui marque le début des règles). */
export const isPeriodDay = (entry) => entry?.period === true || entry?.period === 'first';

// Efficacité d'un traitement ou d'un soulagement (même échelle pour chacun).
const EFFICACY = [
  { value: 0, label: 'Pas efficace' },
  { value: 1, label: 'Un peu' },
  { value: 2, label: 'Efficace' },
  { value: 3, label: 'Très efficace' },
];
const reliefTaken = (value) => (a) => a.relief?.includes(value);

const remark = (id, showIf) => ({
  id, label: 'Une remarque ?', type: 'text', rows: 2, optional: true,
  placeholder: 'Facultatif', showIf,
});

export const SECTIONS = [
  {
    id: 'cycle',
    title: 'Mon cycle',
    questions: [
      {
        id: 'period', label: "As-tu eu tes règles aujourd'hui ?", type: 'single',
        options: [
          { value: false, label: 'Non' },
          { value: 'first', label: 'Premier jour' },
          { value: true, label: 'Oui' },
        ],
      },
      {
        id: 'flow', label: 'Ton flux ?', type: 'single',
        showIf: isPeriodDay,
        options: [
          { value: 'light', label: 'Léger' },
          { value: 'medium', label: 'Moyen' },
          { value: 'heavy', label: 'Abondant' },
        ],
      },
      {
        id: 'painLevel', label: 'Intensité des douleurs', type: 'scale', min: 1, max: 10,
        minLabel: 'Légère', maxLabel: 'Insupportable',
      },
      {
        id: 'pains', label: 'Où as-tu mal ?', type: 'multi', exclusive: 'none',
        options: [
          { value: 'none', label: 'Pas de douleur particulière' },
          { value: 'cramps', label: 'Crampes' },
          { value: 'headache', label: 'Maux de tête' },
          { value: 'back', label: 'Dos' },
          { value: 'breasts', label: 'Poitrine sensible' },
          { value: 'bloating', label: 'Ventre gonflé' },
          { value: 'nausea', label: 'Nausées' },
          { value: 'other', label: 'Autre' },
        ],
      },
      {
        id: 'painOther', label: 'Précise la douleur', type: 'text', rows: 2,
        placeholder: 'Où, comment…', showIf: (a) => a.pains?.includes('other'),
      },
    ],
  },
  {
    id: 'body',
    title: 'Mon humeur et mon corps',
    questions: [
      {
        id: 'mood', label: 'Ton état émotionnel dominant ?', type: 'multi',
        options: [
          { value: 'calm', label: 'Sereine' },
          { value: 'stressed', label: 'Stressée' },
          { value: 'irritable', label: 'Irritable' },
          { value: 'anxious', label: 'Anxieuse' },
          { value: 'depressed', label: 'Déprimée' },
          { value: 'sensitive', label: 'Sensible' },
          { value: 'happy', label: 'Joyeuse' },
          { value: 'sad', label: 'Triste' },
        ],
      },
      {
        id: 'stressExam', label: 'Ce stress est-il lié à un examen ?', type: 'toggle',
        showIf: (a) => a.mood?.includes('stressed'),
      },
      {
        id: 'energy', label: "Ton niveau d'énergie dans la journée", type: 'single', layout: 'rating',
        options: rating(['Épuisée', 'Fatiguée', 'Correct', 'En forme', 'Au top']),
      },
      {
        id: 'sleepHours', label: "Combien d'heures as-tu dormi ?", type: 'number', min: 0, max: 24, step: 0.5,
        unit: 'heures', placeholder: 'ex : 7,5',
      },
      {
        id: 'sleep', label: 'Qualité de ton sommeil', type: 'single', layout: 'rating',
        options: rating(['Très mauvais', 'Mauvais', 'Moyen', 'Bon', 'Excellent']),
      },
      { id: 'nightWaking', label: 'T’es-tu réveillée pendant la nuit ?', type: 'toggle' },
      {
        id: 'relief', label: 'As-tu pris un traitement ou un soulagement ?', type: 'multi', exclusive: 'nothing',
        options: [
          { value: 'painkiller', label: 'Antalgique' },
          { value: 'heat', label: 'Bouillotte' },
          { value: 'rest', label: 'Repos' },
          { value: 'nothing', label: 'Rien' },
        ],
      },
      {
        id: 'reliefPainkiller', label: "Efficacité de l'antalgique", type: 'single',
        options: EFFICACY, showIf: reliefTaken('painkiller'),
      },
      {
        id: 'reliefHeat', label: 'Efficacité de la bouillotte', type: 'single',
        options: EFFICACY, showIf: reliefTaken('heat'),
      },
      {
        id: 'reliefRest', label: 'Efficacité du repos', type: 'single',
        options: EFFICACY, showIf: reliefTaken('rest'),
      },
    ],
  },
  {
    // Critères utilisés par le modèle du mode SOS (voir buildPredictPayload dans js/api.js).
    id: 'focusBody',
    title: 'Mon énergie pour étudier',
    questions: [
      {
        id: 'fatigue', label: 'Ton niveau de fatigue', type: 'scale', min: 0, max: 5,
        minLabel: 'Reposée', maxLabel: 'Épuisée',
      },
      {
        id: 'brainFog', label: 'Brouillard mental (difficulté à penser clairement)', type: 'scale', min: 0, max: 5,
        minLabel: 'Esprit clair', maxLabel: 'Très embrumé',
      },
      {
        id: 'moodScore', label: 'Ton moral global', type: 'single', layout: 'rating',
        options: rating(['Très bas', 'Bas', 'Moyen', 'Bon', 'Excellent']),
      },
    ],
  },
  {
    id: 'student',
    title: 'Ma vie étudiante',
    questions: [
      {
        id: 'context', label: "Qu'avais-tu au programme aujourd'hui ?", type: 'multi',
        options: [
          { value: 'lecture', label: 'Cours ou TD' },
          { value: 'revision', label: 'Révisions' },
          { value: 'exam', label: 'Partiel ou examen' },
          { value: 'deadline', label: 'Rendu de projet' },
          { value: 'internship', label: 'Stage ou alternance' },
          { value: 'job', label: 'Job étudiant' },
          { value: 'off', label: 'Journée off' },
        ],
      },
      {
        id: 'focus', label: "As-tu réussi à te concentrer aujourd'hui ?", type: 'single', layout: 'rating',
        options: rating(['Pas du tout', 'Difficilement', 'Moyennement', 'Plutôt bien', 'Très bien']),
      },
      remark('focusNote'),
      {
        id: 'productivity', label: 'Es-tu satisfaite de ta productivité ?', type: 'single', layout: 'rating',
        options: rating(['Pas du tout', 'Peu', 'Moyennement', 'Plutôt', 'Très']),
      },
      remark('productivityNote'),
      {
        id: 'stress', label: 'Ton niveau de stress', type: 'single', layout: 'rating',
        options: rating(['Très bas', 'Bas', 'Moyen', 'Élevé', 'Très élevé']),
      },
      {
        id: 'missedClass',
        label: "As-tu dû manquer des cours ou des activités aujourd'hui à cause de ta santé ?",
        type: 'toggle',
      },
    ],
  },
];

export const TOGGLE_OPTIONS = [
  { value: true, label: 'Oui' },
  { value: false, label: 'Non' },
];

/** Index { id → question } pour accès direct. */
export const QUESTIONS = Object.fromEntries(
  SECTIONS.flatMap((s) => s.questions).map((q) => [q.id, q]),
);

export const optionsOf = (q) => (q.type === 'toggle' ? TOGGLE_OPTIONS : q.options || []);
export const isVisible = (q, answers) => !q.showIf || q.showIf(answers);
