
export function personalizeAids(profile, existingAids) {

  const details = profile.details || [];
  const age = Number(profile.age);

  const insured = [
    'basic', 'mutual', 'solidarity'
  ].includes(profile.coverage);

  const solidarity = profile.coverage === 'solidarity';
  const mutual = profile.coverage === 'mutual';

  const has = (detail) => details.includes(detail);

  const selected = (category) =>
    details.some(d => d.startsWith(category + ':'));

  // Filtrer les aides déjà présentes

  const filters = {
    'Protections menstruelles réutilisables': [
      'menstrual', ['products']
    ],
    'Distribution de protections périodiques': [
      'menstrual', ['products']
    ],
    'Consultation pour douleurs menstruelles': [
      'menstrual', ['pain', 'heavy', 'endometriosis', 'pcos', 'pms']
    ],
    'Contraception régulière': [
      'contraception', ['pill', 'implant', 'iud', 'advice']
    ],
    'Préservatifs remboursables': [
      'contraception', ['condoms']
    ],
    'Contraception d’urgence hormonale': [
      'contraception', ['emergency']
    ],
    'Mon test IST': [
      'sexual', ['screening']
    ],
    'Kit de dépistage à domicile': [
      'sexual', ['home_test']
    ],
    'Santé Psy Étudiant': [
      'mental', ['psychologist', 'free_support']
    ],
    'Mon soutien psy': [
      'mental', ['psychologist']
    ],
    'Suivi de grossesse': [
      'maternity', ['pregnancy', 'postpartum']
    ],
    'Accouchement': [
      'maternity', ['delivery']
    ],
    'Interruption volontaire de grossesse': [
      'maternity', ['abortion']
    ],
    'Consultation médicale': [
      'general', ['consultation']
    ],
    'Examen de prévention en santé': [
      'general', ['prevention']
    ]
  };

  const aids = existingAids.filter(aid => {

    const filter = filters[aid.title];

    if (!filter) return true;

    const [category, options] = filter;

    if (!selected(category)) return true;

    return options.some(option =>
      has(category + ':' + option)
    );

  });

  function add(title, category, amount,
               description, conditions, source) {

    aids.push({
      title,
      category,
      amount,
      description,
      conditions,
      source
    });
  }

  const consultation = solidarity
    ? 'Prise en charge intégrale sous conditions'
    : mutual
      ? 'Selon les garanties de ta mutuelle'
      : insured
        ? '70 % du tarif conventionnel'
        : 'Droits à vérifier';

  // ===== ENDOMETRIOSE =====

  if (has('menstrual:endometriosis')) {

    add(
      'Prise en charge de l’endométriose',
      'Santé menstruelle',
      insured ? 'Jusqu’à 100 % sous conditions'
        : 'Droits à vérifier',
      'Certaines formes d’endométriose peuvent ouvrir droit à une reconnaissance en affection de longue durée hors liste.',
      'Demande médicale et accord de l’Assurance Maladie. La prise en charge renforcée concerne les soins liés à la maladie, dans les limites réglementaires.',
      'https://www.ameli.fr/assure/sante/themes/endometriose/traitement'
    );
  }

  // ===== OVAIRES POLYKYSTIQUES =====

  if (has('menstrual:pcos')) {

    add(
      'Suivi du syndrome des ovaires polykystiques',
      'Santé menstruelle',
      consultation,
      'Consultations médicales, examens biologiques et traitements remboursables.',
      'Les taux dépendent des actes prescrits. Aucun remboursement intégral automatique lié au diagnostic.',
      'https://www.ameli.fr/'
    );
  }

  // ===== REGLES ABONDANTES =====

  if (has('menstrual:heavy')) {

    add(
      'Bilan médical pour règles abondantes',
      'Santé menstruelle',
      insured ? 'Selon les actes prescrits'
        : 'Droits à vérifier',
      'Les consultations et examens peuvent être remboursés selon les règles habituelles.',
      'Une consultation médicale permet de déterminer les examens nécessaires.',
      'https://www.ameli.fr/'
    );
  }

  // ===== SYNDROME PREMENSTRUEL =====

  if (has('menstrual:pms')) {

    add(
      'Accompagnement du syndrome prémenstruel',
      'Santé menstruelle',
      consultation,
      'Les consultations et certains traitements peuvent être pris en charge.',
      'Selon le parcours de soins, les prescriptions et la couverture sociale.',
      'https://www.ameli.fr/'
    );
  }

  // ===== CONTRACEPTION DETAILLEE =====

  const contraceptives = [
    ['pill', 'Pilule contraceptive'],
    ['implant', 'Implant contraceptif'],
    ['iud', 'Stérilet']
  ];

  if (insured) {

    contraceptives.forEach(([code, title]) => {

      if (!has('contraception:' + code)) return;

      add(
        title,
        'Contraception',
        age < 26 || solidarity
          ? '100 % pour les produits éligibles'
          : mutual
            ? '65 à 100 % selon les garanties'
            : '65 % pour les produits remboursables',
        'Prise en charge du contraceptif lorsqu’il figure parmi les produits remboursables.',
        'Prescription et conditions réglementaires. Les frais de consultation ou de pose peuvent suivre des règles distinctes.',
        'https://www.ameli.fr/assure/remboursements/rembourse/contraception-ivg/contraception'
      );
    });
  }

  // ===== VACCINATION HPV =====

  if (has('sexual:hpv')) {

    add(
      'Vaccination contre les papillomavirus',
      'Santé sexuelle',
      !insured ? 'Droits à vérifier'
        : age > 26 ? 'Hors rattrapage standard'
        : solidarity ? '100 % du vaccin éligible'
        : mutual ? '65 à 100 % selon les garanties'
        : '65 % du prix remboursable',
      'Rattrapage vaccinal pris en charge jusqu’à 26 ans inclus.',
      'Selon les recommandations vaccinales et les doses déjà reçues. Les frais d’injection sont distincts.',
      'https://www.ameli.fr/assure/actualites/le-vaccin-contre-les-infections-papillomavirus-humains-est-desormais-rembourse-jusqu-26-ans'
    );
  }

  // ===== TRAITEMENTS DES INFECTIONS =====

  if (has('sexual:treatment')) {

    add(
      'Consultations et traitements des infections',
      'Santé sexuelle',
      insured ? 'Remboursement selon le soin'
        : 'Orientation vers un centre gratuit',
      'Les consultations, analyses et médicaments suivent leurs règles respectives de remboursement.',
      'Le montant dépend des actes, des médicaments et de la couverture sociale.',
      'https://www.ameli.fr/assure/sante/themes/mst-ist/depistage'
    );
  }

  // ===== PSYCHIATRE =====

  if (has('mental:psychiatrist')) {

    add(
      'Consultation chez un psychiatre',
      'Santé mentale',
      consultation,
      age >= 16 && age <= 25
        ? 'Accès direct possible entre 16 et 25 ans.'
        : 'Consultation généralement soumise au parcours de soins coordonnés.',
      'Médecin traitant déclaré, secteur du praticien et éventuels dépassements à vérifier.',
      'https://www.ameli.fr/assure/remboursements'
    );
  }

  // ===== APRES LA NAISSANCE =====

  if (has('maternity:postpartum')) {

    add(
      'Suivi après l’accouchement',
      'Grossesse et maternité',
      insured ? 'Jusqu’à 100 % selon le soin'
        : 'Droits à vérifier',
      'Certaines consultations postnatales et séances de rééducation bénéficient d’une prise en charge spécifique.',
      'Selon la période, le type de soin et la prescription.',
      'https://www.ameli.fr/'
    );
  }

  // ===== AIDES A LA MATERNITE =====

  if (has('maternity:financial_support')) {

    add(
      'Prestations financières liées à la maternité',
      'Grossesse et maternité',
      'Montants selon la situation',
      'Prime à la naissance, allocation de base et aides à la garde d’enfant.',
      'Conditions de ressources, de résidence et de situation familiale.',
      'https://www.caf.fr/'
    );
  }

  // ===== SOINS DENTAIRES =====

  if (has('general:dental')) {

    if (insured && age <= 24) {

      add(
        'M’T dents tous les ans',
        'Santé générale',
        'Gratuité sous conditions',
        'Examen dentaire annuel et certains soins associés.',
        'Programme de 3 à 24 ans inclus. Vérifier la prise en charge des soins associés et les modalités sans complémentaire.',
        'https://www.ameli.fr/'
      );

    } else {

      add(
        'Remboursement des soins dentaires',
        'Santé générale',
        insured ? 'Selon les actes et la couverture'
          : 'Droits à vérifier',
        'Certains soins et prothèses dentaires sont remboursables.',
        'Demander un devis pour les prestations coûteuses.',
        'https://www.ameli.fr/assure/remboursements'
      );
    }
  }

  // ===== OPTIQUE =====

  if (has('general:optical')) {

    add(
      'Lunettes et panier 100 % Santé',
      'Santé générale',
      mutual || solidarity
        ? '0 € possible sur le panier éligible'
        : 'Selon la couverture',
      'Certaines montures et certains verres peuvent être intégralement remboursés.',
      'Prescription, équipement éligible et complémentaire responsable ou solidaire.',
      'https://www.ameli.fr/assure/remboursements'
    );
  }

  // ===== VACCINATIONS =====

  if (has('general:vaccination')) {

    add(
      'Remboursement des vaccinations',
      'Prévention',
      insured ? 'Selon le vaccin et les conditions'
        : 'Centre public de vaccination',
      'Certains vaccins sont remboursés selon les recommandations officielles.',
      'Le taux dépend du vaccin, de l’âge et des indications.',
      'https://www.ameli.fr/assure/remboursements/rembourse/medicaments-vaccins-dispositifs-medicaux/vaccination'
    );
  }

  // Supprimer la carte générique de contraception
  // si une méthode précise a déjà été ajoutée.

  const preciseMethod = insured && contraceptives.some(
    ([code]) => has('contraception:' + code)
  );

  const finalAids = preciseMethod
    ? aids.filter(aid => aid.title !== 'Contraception régulière')
    : aids;

  return finalAids;
}
