
export const QUESTIONS_AIDES = [
  {
    id: 'age',
    label: 'Quel âge as-tu ?',
    type: 'number',
    min: 16,
    max: 100,
  },
  {
    id: 'student',
    label: 'Es-tu actuellement étudiante ?',
    type: 'single',
    options: [
      { value: 'yes', label: 'Oui' },
      { value: 'no', label: 'Non' },
    ],
  },
  {
    id: 'coverage',
    label: 'Quelle est ta couverture médicale ?',
    type: 'single',
    options: [
      {
        value: 'basic',
        label: 'Assurance Maladie sans mutuelle',
      },
      {
        value: 'mutual',
        label: 'Assurance Maladie avec mutuelle',
      },
      {
        value: 'solidarity',
        label: 'Complémentaire santé solidaire',
      },
      {
        value: 'international',
        label: 'Couverture internationale',
      },
      {
        value: 'ame',
        label: "Aide médicale de l'État",
      },
      {
        value: 'pending',
        label: "Droits en cours d'ouverture",
      },
      {
        value: 'none',
        label: 'Aucune couverture médicale',
      },
      {
        value: 'unknown',
        label: 'Je ne connais pas mes droits',
      },
    ],
  },
  {
    id: 'needs',
    label: 'Quels sont tes besoins de santé ?',
    type: 'multi',
    options: [
      {
        value: 'menstrual',
        label: 'Santé menstruelle',
      },
      {
        value: 'contraception',
        label: 'Contraception',
      },
      {
        value: 'sexual',
        label: 'Santé sexuelle',
      },
      {
        value: 'mental',
        label: 'Santé mentale',
      },
      {
        value: 'maternity',
        label: 'Grossesse et maternité',
      },
      {
        value: 'financial',
        label: 'Difficultés financières',
      },
      {
        value: 'international',
        label: 'Étudiante internationale',
      },
      {
        value: 'general',
        label: 'Santé générale et prévention',
      },
      {
        value: 'local',
        label: 'Aides locales',
      },
    ],
  },
];
