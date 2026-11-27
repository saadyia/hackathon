// Configuration des questions du suivi quotidien.
// Pour ajouter une question : ajouter un objet ici, le formulaire se génère tout seul.
//
// Types disponibles :
//   toggle : Oui / Non (valeur booléenne)
//   single : un seul choix parmi `options` (layout: 'rating' pour une échelle 1-5 avec emojis)
//   multi  : plusieurs choix ; `exclusive` = valeur qui désélectionne les autres (ex : "aucune")
//   scale  : curseur numérique entre `min` et `max`
//   text   : champ libre
// `showIf(answers)` : la question n'apparaît que si la fonction renvoie true.

const rating = (labels) => labels.map(([emoji, label], i) => ({ value: i + 1, emoji, label }));

export const SECTIONS = [
  {
    id: 'cycle',
    title: 'Mon cycle',
    icon: '🌸',
    questions: [
      { id: 'period', label: "As-tu tes règles aujourd'hui ?", type: 'toggle' },
      {
        id: 'flow', label: 'Quel est ton flux ?', type: 'single',
        showIf: (a) => a.period === true,
        options: [
          { value: 'spotting', emoji: '·', label: 'Spotting' },
          { value: 'light', emoji: '💧', label: 'Léger' },
          { value: 'medium', emoji: '💧💧', label: 'Moyen' },
          { value: 'heavy', emoji: '💧💧💧', label: 'Abondant' },
          { value: 'very_heavy', emoji: '🌊', label: 'Très abondant' },
        ],
      },
      {
        id: 'pains', label: 'Ressens-tu des douleurs ?', type: 'multi', exclusive: 'none',
        options: [
          { value: 'cramps', emoji: '🌀', label: 'Crampes' },
          { value: 'headache', emoji: '🤕', label: 'Maux de tête' },
          { value: 'back', emoji: '🔙', label: 'Dos' },
          { value: 'breasts', emoji: '💗', label: 'Poitrine sensible' },
          { value: 'bloating', emoji: '🎈', label: 'Ventre gonflé' },
          { value: 'nausea', emoji: '🤢', label: 'Nausées' },
          { value: 'none', emoji: '✅', label: 'Aucune' },
        ],
      },
      {
        id: 'painLevel', label: 'Intensité de la douleur', type: 'scale', min: 1, max: 10,
        minLabel: 'Légère', maxLabel: 'Insupportable',
        showIf: (a) => a.pains?.length > 0 && !a.pains.includes('none'),
      },
      {
        id: 'mood', label: 'Comment te sens-tu ?', type: 'multi',
        options: [
          { value: 'calm', emoji: '😌', label: 'Sereine' },
          { value: 'happy', emoji: '😊', label: 'Joyeuse' },
          { value: 'sensitive', emoji: '🥺', label: 'Sensible' },
          { value: 'irritable', emoji: '😤', label: 'Irritable' },
          { value: 'anxious', emoji: '😰', label: 'Anxieuse' },
          { value: 'sad', emoji: '😔', label: 'Triste' },
        ],
      },
      {
        id: 'energy', label: "Ton niveau d'énergie", type: 'single', layout: 'rating',
        options: rating([['🪫', 'Épuisée'], ['😴', 'Fatiguée'], ['😐', 'Correct'], ['🙂', 'En forme'], ['⚡', 'Au top']]),
      },
      {
        id: 'sleep', label: 'Qualité de ton sommeil', type: 'single', layout: 'rating',
        options: rating([['😫', 'Très mauvais'], ['😕', 'Mauvais'], ['😐', 'Moyen'], ['🙂', 'Bon'], ['😴', 'Excellent']]),
      },
    ],
  },
  {
    id: 'student',
    title: 'Ma vie étudiante',
    icon: '📚',
    questions: [
      {
        id: 'context', label: "Qu'avais-tu au programme ?", type: 'multi',
        options: [
          { value: 'lecture', emoji: '🏫', label: 'Cours / TD' },
          { value: 'revision', emoji: '📚', label: 'Révisions' },
          { value: 'exam', emoji: '📝', label: 'Partiel / examen' },
          { value: 'deadline', emoji: '⏰', label: 'Rendu de projet' },
          { value: 'internship', emoji: '💼', label: 'Stage / alternance' },
          { value: 'job', emoji: '🧾', label: 'Job étudiant' },
          { value: 'off', emoji: '🌿', label: 'Journée off' },
        ],
      },
      {
        id: 'focus', label: "As-tu réussi à te concentrer aujourd'hui ?", type: 'single', layout: 'rating',
        options: rating([['😵‍💫', 'Pas du tout'], ['😕', 'Difficilement'], ['😐', 'Moyennement'], ['🙂', 'Plutôt bien'], ['🎯', 'Très bien']]),
      },
      {
        id: 'productivity', label: 'Es-tu satisfaite de ta productivité ?', type: 'single', layout: 'rating',
        options: rating([['😞', 'Pas du tout'], ['😕', 'Peu'], ['😐', 'Moyennement'], ['🙂', 'Plutôt'], ['🤩', 'Très']]),
      },
      {
        id: 'stress', label: 'Ton niveau de stress', type: 'single', layout: 'rating',
        options: rating([['😌', 'Très bas'], ['🙂', 'Bas'], ['😐', 'Moyen'], ['😣', 'Élevé'], ['🤯', 'Très élevé']]),
      },
      {
        id: 'missedClass',
        label: 'As-tu dû manquer un cours ou une activité à cause de ta santé ?',
        type: 'toggle',
      },
    ],
  },
  {
    id: 'notes',
    title: 'Notes',
    icon: '📝',
    questions: [
      { id: 'note', label: 'Quelque chose à ajouter ?', type: 'text', placeholder: 'Symptôme inhabituel, médicament pris, ressenti…' },
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
