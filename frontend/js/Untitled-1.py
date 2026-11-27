
export function getEligibleAids(profile) {
  const aids = [];

  const insured = [
    'basic',
    'mutual',
    'solidarity'
  ].includes(profile.coverage);

  const solidarity = profile.coverage === 'solidarity';
  const mutual = profile.coverage === 'mutual';
  const ame = profile.coverage === 'ame';

  // ===== SANTÉ MENTALE =====

  if (profile.needs.includes('mental')) {

    if (profile.student === 'yes') {
      aids.push({
        title: 'Santé Psy Étudiant',
        category: 'Santé mentale',
        amount: '0 €',
        description: '12 séances gratuites par année universitaire.',
        conditions: 'Être inscrite dans un établissement éligible et consulter un psychologue partenaire.',
        source: 'https://santepsy.etudiant.gouv.fr/'
      });
    }

    if (insured || ame) {
      aids.push({
        title: 'Mon soutien psy',
        category: 'Santé mentale',
        amount: solidarity || ame
          ? '0 € par séance'
          : mutual
            ? '0 à 20 € par séance'
            : '20 € par séance',
        description: '12 séances par année civile au tarif de 50 €.',
        conditions: 'Psychologue partenaire et critères médicaux du dispositif. Estimation hors régime particulier.',
        source: 'https://www.ameli.fr/assure/remboursements/rembourse/remboursement-seance-psychologue-mon-soutien-psy'
      });
    }
  }

  // ===== CONTRACEPTION =====

  if (profile.needs.includes('contraception')) {

    if (insured) {
      aids.push({
        title: 'Contraception régulière',
        category: 'Contraception',
        amount: profile.age < 26 || solidarity
          ? '100 % pris en charge'
          : mutual
            ? '65 à 100 % remboursés'
            : '65 % remboursés',
        description: 'Prise en charge des contraceptifs remboursables concernés.',
        conditions: 'Selon le contraceptif, la prescription et les garanties de la mutuelle.',
        source: 'https://www.ameli.fr/assure/remboursements/rembourse/contraception-ivg/contraception'
      });

      aids.push({
        title: 'Préservatifs remboursables',
        category: 'Contraception',
        amount: profile.age < 26 || solidarity
          ? '100 % pris en charge'
          : mutual
            ? '60 à 100 % remboursés'
            : '60 % remboursés',
        description: 'Certaines marques de préservatifs sont remboursées.',
        conditions: profile.age < 26
          ? 'Sans ordonnance pour les marques référencées.'
          : 'Ordonnance nécessaire pour le remboursement.',
        source: 'https://www.ameli.fr/assure/remboursements/rembourse/contraception-ivg/contraception'
      });
    }

    aids.push({
      title: 'Contraception d’urgence hormonale',
      category: 'Contraception',
      amount: insured
        ? '0 € en pharmacie'
        : 'Accès gratuit possible',
      description: 'Accessible sans ordonnance et sans limite d’âge.',
      conditions: insured
        ? 'Disponible en pharmacie. Consulter rapidement.'
        : 'Contacter rapidement une pharmacie ou un centre de santé sexuelle pour accéder au dispositif adapté.',
      source: 'https://www.ameli.fr/assure/sante/themes/contraception-urgence/contraception-urgence-gratuite'
    });

    if (!insured) {
      aids.push({
        title: 'Centre de santé sexuelle',
        category: 'Contraception',
        amount: 'Gratuité possible',
        description: 'Consultations et contraceptifs gratuits selon ta situation.',
        conditions: 'Vérifier les modalités d’accès auprès du centre.',
        source: 'https://ivg.gouv.fr/'
      });
    }
  }

  // ===== SANTÉ SEXUELLE =====

  if (profile.needs.includes('sexual')) {

    if (insured) {
      aids.push({
        title: 'Mon test IST',
        category: 'Santé sexuelle',
        amount: profile.age < 26 || solidarity
          ? '100 % pris en charge'
          : '60 à 100 % remboursés',
        description: 'Dépistage de cinq infections en laboratoire sans ordonnance.',
        conditions: 'Le remboursement dépend de l’âge et du test. Le dépistage du VIH est pris en charge à 100 %. Des participations peuvent rester dues.',
        source: 'https://www.ameli.fr/assure/sante/themes/mst-ist/depistage'
      });
    }

    aids.push({
      title: 'Centre gratuit de dépistage',
      category: 'Santé sexuelle',
      amount: '0 €',
      description: 'Dépistage gratuit, même sans couverture médicale.',
      conditions: 'Vérifier les modalités d’accueil du centre.',
      source: 'https://www.ameli.fr/assure/sante/themes/mst-ist/depistage'
    });
  }

  return aids;
}
