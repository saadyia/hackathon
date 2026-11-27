
export function getEligibleAids(profile) {
  const aids = [];

  const age = Number(profile.age);
  const student = profile.student === 'yes';

  const insured = [
    'basic', 'mutual', 'solidarity'
  ].includes(profile.coverage);

  const solidarity = profile.coverage === 'solidarity';
  const mutual = profile.coverage === 'mutual';
  const ame = profile.coverage === 'ame';

  const needs = profile.needs || [];

  function add(title, category, amount, description, conditions, source) {
    aids.push({
      title,
      category,
      amount,
      description,
      conditions,
      source
    });
  }

  // ==========================
  // 1. SANTE MENSTRUELLE
  // ==========================

  if (needs.includes('menstrual')) {

    if (insured && (age < 26 || solidarity)) {
      add(
        'Protections menstruelles réutilisables',
        'Santé menstruelle',
        solidarity ? '100 % pris en charge'
          : mutual ? '60 à 100 % remboursés'
          : '60 % remboursés',
        'Remboursement de certaines culottes et coupes menstruelles depuis octobre 2026.',
        'Produits référencés achetés en pharmacie, dans la limite du quota réglementaire.',
        'https://www.ameli.fr/assure/remboursements/rembourse/protections-periodiques-reutilisables-remboursees'
      );
    }

    if (student) {
      add(
        'Distribution de protections périodiques',
        'Santé menstruelle',
        'Gratuité possible',
        'Des protections gratuites peuvent être distribuées dans les établissements universitaires.',
        'Disponibilité à vérifier auprès de ton établissement ou du Crous.',
        'https://www.etudiant.gouv.fr/'
      );
    }

    if (insured) {
      add(
        'Consultation pour douleurs menstruelles',
        'Santé menstruelle',
        solidarity ? 'Prise en charge intégrale'
          : mutual ? 'Selon les garanties'
          : '70 % du tarif conventionnel',
        'Consultation médicale pour douleurs, règles abondantes ou irrégulières.',
        'Selon le parcours de soins et le professionnel. Des frais peuvent rester à charge.',
        'https://www.ameli.fr/assure/remboursements/rembourse/consultations-telemedecine/metropole'
      );
    }
  }

  // ==========================
  // 2. CONTRACEPTION
  // ==========================

  if (needs.includes('contraception')) {

    if (insured) {
      add(
        'Contraception régulière',
        'Contraception',
        age < 26 || solidarity ? '100 % pris en charge'
          : mutual ? '65 à 100 % remboursés'
          : '65 % remboursés',
        'Remboursement des contraceptifs éligibles.',
        'Selon la méthode contraceptive et les conditions de prescription.',
        'https://www.ameli.fr/assure/remboursements/rembourse/contraception-ivg/contraception'
      );

      add(
        'Préservatifs remboursables',
        'Contraception',
        age < 26 || solidarity ? '100 % pris en charge'
          : mutual ? '60 à 100 % remboursés'
          : '60 % remboursés',
        'Certaines marques sont prises en charge.',
        age < 26
          ? 'Sans ordonnance pour les produits référencés.'
          : 'Ordonnance nécessaire pour le remboursement.',
        'https://www.ameli.fr/assure/remboursements/rembourse/contraception-ivg/contraception'
      );
    }

    add(
      'Contraception d’urgence hormonale',
      'Contraception',
      insured ? '0 € en pharmacie' : 'Gratuité possible',
      'Contraception d’urgence sans ordonnance et sans limite d’âge.',
      'Contacter rapidement une pharmacie ou un centre de santé sexuelle.',
      'https://www.ameli.fr/assure/remboursements/rembourse/contraception-ivg/contraception'
    );

    if (!insured) {
      add(
        'Centre de santé sexuelle',
        'Contraception',
        'Gratuité possible',
        'Accès à certaines consultations et méthodes contraceptives.',
        'Vérifier les modalités de gratuité auprès du centre.',
        'https://ivg.gouv.fr/'
      );
    }
  }

  // ==========================
  // 3. SANTE SEXUELLE
  // ==========================

  if (needs.includes('sexual')) {

    if (insured) {
      add(
        'Mon test IST',
        'Santé sexuelle',
        age < 26 || solidarity ? '100 % pris en charge'
          : '60 à 100 % remboursés',
        'Dépistage de cinq infections sans ordonnance en laboratoire.',
        'Selon l’âge et le test. Des participations peuvent rester dues.',
        'https://www.ameli.fr/assure/sante/themes/mst-ist/depistage'
      );

      if (age >= 18 && age <= 25) {
        add(
          'Kit de dépistage à domicile',
          'Santé sexuelle',
          '0 € sous conditions',
          'Autoprélèvement pour dépister certaines infections.',
          'Remplir le questionnaire officiel d’éligibilité.',
          'https://mon-test-ist.ameli.fr/'
        );
      }
    }

    add(
      'Centre gratuit de dépistage',
      'Santé sexuelle',
      '0 €',
      'Dépistage gratuit, même sans couverture médicale.',
      'Vérifier les modalités d’accueil du centre.',
      'https://www.ameli.fr/assure/sante/themes/mst-ist/depistage'
    );
  }

  // ==========================
  // 4. SANTE MENTALE
  // ==========================

  if (needs.includes('mental')) {

    if (student) {
      add(
        'Santé Psy Étudiant',
        'Santé mentale',
        '0 €',
        'Jusqu’à 12 séances gratuites par année universitaire.',
        'Être étudiante dans un établissement éligible.',
        'https://santepsy.etudiant.gouv.fr/'
      );
    }

    if (insured || ame) {
      add(
        'Mon soutien psy',
        'Santé mentale',
        solidarity || ame ? '0 € par séance'
          : mutual ? '0 à 20 € par séance'
          : '20 € par séance',
        'Jusqu’à 12 séances par année civile au tarif de 50 €.',
        'Psychologue partenaire et critères médicaux du dispositif. Hors régime particulier.',
        'https://www.ameli.fr/assure/remboursements/rembourse/remboursement-seance-psychologue-mon-soutien-psy'
      );
    }

    add(
      'Accompagnement psychologique gratuit',
      'Santé mentale',
      'Solutions gratuites possibles',
      'Services universitaires, structures publiques et dispositifs d’écoute.',
      'Conditions d’accès variables selon la structure.',
      'https://santementale.etudiant.gouv.fr/'
    );
  }

  // ==========================
  // 5. GROSSESSE ET MATERNITE
  // ==========================

  if (needs.includes('maternity')) {

    if (insured) {
      add(
        'Suivi de grossesse',
        'Grossesse et maternité',
        'Jusqu’à 100 % remboursés',
        'Examens obligatoires pris en charge et remboursement renforcé à partir du sixième mois.',
        'Grossesse déclarée et tarifs réglementaires.',
        'https://www.ameli.fr/assure/droits-demarches/famille/maternite-paternite-adoption/grossesse'
      );

      add(
        'Accouchement',
        'Grossesse et maternité',
        '100 % du tarif conventionnel',
        'Prise en charge des frais couverts dans un établissement conventionné.',
        'Les dépassements et prestations de confort peuvent rester à charge.',
        'https://www.ameli.fr/assure/droits-demarches/famille/maternite-paternite-adoption/accouchement-retour-domicile'
      );
    }

    add(
      'Interruption volontaire de grossesse',
      'Grossesse et maternité',
      insured || ame ? '100 % pris en charge'
        : 'Dispositifs de gratuité à vérifier',
      'Prise en charge du parcours d’interruption volontaire de grossesse.',
      'Sans couverture, contacter une structure habilitée pour connaître ses droits.',
      'https://ivg.gouv.fr/'
    );

    if (!insured) {
      add(
        'Protection maternelle et infantile',
        'Grossesse et maternité',
        'Consultations gratuites possibles',
        'Accompagnement préventif pendant la grossesse.',
        'Contacter les services du département.',
        'https://lannuaire.service-public.gouv.fr/'
      );
    }
  }

  // ==========================
  // 6. PRECARITE FINANCIERE
  // ==========================

  if (needs.includes('financial')) {

    if (insured && !solidarity) {
      add(
        'Complémentaire santé solidaire',
        'Couverture sociale',
        'Gratuite ou avec participation',
        'Complémentaire santé destinée aux personnes ayant des ressources modestes.',
        'Éligibilité selon les ressources et la composition du foyer. Règles spécifiques avant 25 ans.',
        'https://www.mesdroitssociaux.gouv.fr/'
      );
    }

    if (solidarity) {
      add(
        'Tes droits à la complémentaire santé solidaire',
        'Couverture sociale',
        'Reste à charge réduit',
        'Tu bénéficies déjà d’une couverture complémentaire solidaire.',
        'Prise en charge dans les limites réglementaires.',
        'https://www.ameli.fr/'
      );
    }

    if (student) {
      add(
        'Aide spécifique du Crous',
        'Aide financière',
        'Montant selon le dossier',
        'Aide destinée aux étudiants rencontrant de graves difficultés financières.',
        'Évaluation par le service social du Crous.',
        'https://www.etudiant.gouv.fr/fr/aides-specifiques-1306'
      );
    }

    if (insured) {
      add(
        'Aide financière de l’Assurance Maladie',
        'Aide financière',
        'Montant variable',
        'Aide exceptionnelle pour certaines dépenses de santé.',
        'Attribution sur dossier, selon la situation financière et médicale.',
        'https://www.ameli.fr/assure/droits-demarches/difficultes-acces-droits-soins/aides-financieres-individuelles'
      );
    }
  }

  // ==========================
  // 7. ETUDIANTES INTERNATIONALES
  // ==========================

  if (needs.includes('international') ||
      profile.coverage === 'international') {

    add(
      'Couverture médicale des étudiantes internationales',
      'Couverture sociale',
      'Affiliation gratuite si applicable',
      'Vérification des droits à l’Assurance Maladie française ou au régime étranger.',
      'Selon le pays d’affiliation, les documents et les conditions de séjour.',
      'https://www.ameli.fr/assure/droits-demarches/etudes-stages/etudiant/vous-venez-etudier-en-france'
    );
  }

  // ==========================
  // 8. SANTE GENERALE
  // ==========================

  if (needs.includes('general')) {

    if (insured) {
      add(
        'Consultation médicale',
        'Santé générale',
        solidarity ? 'Prise en charge intégrale'
          : mutual ? 'Selon les garanties'
          : '70 % du tarif conventionnel',
        'Remboursement des consultations médicales classiques.',
        'Dans le parcours de soins, hors dépassements et participations éventuelles.',
        'https://www.ameli.fr/assure/remboursements/rembourse/consultations-telemedecine/metropole'
      );

      if (age >= 16) {
        add(
          'Examen de prévention en santé',
          'Prévention',
          '0 €',
          'Bilan de prévention personnalisé.',
          'Accessible aux assurés concernés à partir de 16 ans.',
          'https://www.ameli.fr/assure/sante/assurance-maladie/prevention-depistages/examen-prevention-sante'
        );
      }
    }

    if (student) {
      add(
        'Service de santé étudiante',
        'Santé générale',
        'Prestations gratuites possibles',
        'Consultations et accompagnement de santé universitaire.',
        'Selon les prestations proposées par ton établissement.',
        'https://www.etudiant.gouv.fr/'
      );
    }
  }

  // ==========================
  // 9. AIDES LOCALES
  // ==========================

  if (needs.includes('local')) {
    add(
      'Structures de proximité',
      'Aides locales',
      'Gratuité possible',
      'Centres de santé, services universitaires et structures sociales.',
      'Les prestations dépendent de la commune et de l’établissement.',
      'https://lannuaire.service-public.gouv.fr/'
    );
  }

  // ==========================
  // ACCES AUX SOINS SANS DROITS
  // ==========================

  if (['none', 'pending', 'unknown'].includes(profile.coverage)) {

    add(
      'Accompagnement pour accéder aux soins',
      'Couverture sociale',
      'Accompagnement possible',
      'Les permanences d’accès aux soins de santé peuvent accompagner les personnes rencontrant des difficultés d’accès aux soins.',
      'Vérifier les conditions auprès de la structure hospitalière et de son service social.',
      'https://www.ameli.fr/'
    );

    add(
      'Ouverture des droits à l’Assurance Maladie',
      'Couverture sociale',
      'Droits à vérifier',
      'Accompagnement pour identifier ou ouvrir tes droits à une couverture médicale.',
      'Selon ta résidence, ton activité et ta situation administrative.',
      'https://www.ameli.fr/assure/droits-demarches/etudes-stages/etudiant/etudiant'
    );
  }

  return aids;
}
