
const COVERAGE_GUIDE = {

  basic: {
    title: 'Assurance Maladie sans mutuelle',
    status: 'Couverture à compléter',
    description: 'Une partie de tes dépenses de santé est remboursée, mais certains frais restent à ta charge.',
    actions: [
      'Vérifier ton attestation de droits.',
      'Tester ton éligibilité à la complémentaire santé solidaire.',
      'Comparer les garanties des complémentaires santé.',
      'Déclarer un médecin traitant si nécessaire.'
    ],
    link: 'https://www.ameli.fr/'
  },

  mutual: {
    title: 'Assurance Maladie et mutuelle',
    status: 'Couverture complémentaire active',
    description: 'Ta mutuelle complète tes remboursements selon les garanties de ton contrat.',
    actions: [
      'Consulter ton tableau de garanties.',
      'Vérifier les remboursements des consultations spécialisées.',
      'Rechercher les forfaits psychologie et contraception.',
      'Vérifier ton éligibilité à la complémentaire santé solidaire.'
    ],
    link: 'https://www.mesdroitssociaux.gouv.fr/'
  },

  solidarity: {
    title: 'Complémentaire santé solidaire',
    status: 'Protection renforcée',
    description: 'Tes dépenses de santé couvertes sont généralement prises en charge intégralement dans les limites réglementaires.',
    actions: [
      'Vérifier la date de fin de tes droits.',
      'Présenter ton attestation ou ta carte Vitale à jour.',
      'Respecter les conditions du parcours de soins.',
      'Renouveler tes droits lorsque nécessaire.'
    ],
    link: 'https://www.ameli.fr/assure/remboursements/complementaire-sante-solidaire'
  },

  international: {
    title: 'Couverture médicale internationale',
    status: 'Droits à préciser',
    description: 'Tes remboursements dépendent de ton régime étranger et des accords applicables en France.',
    actions: [
      'Identifier ton pays et ton régime d’affiliation.',
      'Vérifier la validité de ta carte européenne, si tu en possèdes une.',
      'Vérifier les garanties de ton assurance étrangère.',
      'Déterminer si une affiliation française est nécessaire.',
      'Conserver les justificatifs de tes dépenses médicales.'
    ],
    link: 'https://www.ameli.fr/assure/droits-demarches/etudes-stages/etudiant/vous-venez-etudier-en-france'
  },

  ame: {
    title: 'Aide médicale de l’État',
    status: 'Prise en charge spécifique',
    description: 'Les soins couverts bénéficient d’une prise en charge selon les conditions propres à ce dispositif.',
    actions: [
      'Vérifier la validité de ton attestation.',
      'Présenter ton justificatif lors des consultations.',
      'Vérifier les prestations couvertes.',
      'Anticiper le renouvellement de tes droits.'
    ],
    link: 'https://www.ameli.fr/'
  },

  pending: {
    title: 'Droits en cours d’ouverture',
    status: 'Démarches à poursuivre',
    description: 'Tes possibilités de remboursement dépendent de la date effective d’ouverture de tes droits.',
    actions: [
      'Vérifier si une attestation provisoire est disponible.',
      'Consulter l’avancement de ton dossier.',
      'Conserver tes factures et feuilles de soins.',
      'Contacter le service social étudiant si nécessaire.'
    ],
    link: 'https://www.ameli.fr/'
  },

  none: {
    title: 'Absence de couverture médicale',
    status: 'Accompagnement recommandé',
    description: 'Des structures gratuites et des dispositifs d’accompagnement peuvent rester accessibles.',
    actions: [
      'Contacter le service de santé étudiante.',
      'Rechercher une permanence d’accès aux soins de santé.',
      'Vérifier les possibilités d’affiliation à l’Assurance Maladie.',
      'Identifier les dispositifs gratuits adaptés à tes besoins.'
    ],
    link: 'https://lannuaire.service-public.gouv.fr/'
  },

  unknown: {
    title: 'Couverture médicale inconnue',
    status: 'Droits à identifier',
    description: 'Il faut identifier ta couverture actuelle avant de pouvoir calculer précisément tes remboursements.',
    actions: [
      'Vérifier si tu disposes d’un compte ameli.',
      'Rechercher une attestation de droits.',
      'Vérifier si tu es couverte par la mutuelle de tes parents.',
      'Contacter l’Assurance Maladie ou le service social étudiant.'
    ],
    link: 'https://www.ameli.fr/'
  }
};


export function renderCoverage(container, profile) {

  const guide = COVERAGE_GUIDE[profile.coverage];

  if (!guide) return;

  const section = document.createElement('section');

  section.className = 'card';

  section.style.cssText = `
    display:grid;
    gap:18px;
    margin-top:24px;
    border-left:5px solid var(--accent);
  `;

  section.innerHTML = `
    <p class="eyebrow">
      Ma couverture sociale
    </p>

    <h2>Mon bilan de couverture santé</h2>

    <div style="
      background:var(--accent-soft);
      border-radius:var(--radius-sm);
      padding:20px;
      display:grid;
      gap:10px
    ">

      <p style="
        color:var(--accent);
        font-weight:700
      ">
        ${guide.status}
      </p>

      <h2>${guide.title}</h2>

      <p>${guide.description}</p>

    </div>

    <h2>Mes prochaines démarches</h2>

    <div style="display:grid;gap:12px">

      ${guide.actions.map((action, index) => `
        <label style="
          display:flex;
          align-items:center;
          gap:12px;
          border:1px solid var(--line);
          padding:16px;
          border-radius:var(--radius-sm);
          cursor:pointer
        ">

          <input
            type="checkbox"
            style="accent-color:var(--accent)"
          >

          <span>${action}</span>

        </label>
      `).join('')}

    </div>

    <p class="muted" data-coverage-progress>
      0 démarche sur ${guide.actions.length} réalisée
    </p>

    <a class="btn btn-primary"
       href="${guide.link}"
       target="_blank"
       rel="noopener noreferrer">

      Accéder aux démarches officielles ↗

    </a>

    <p class="muted">
      Ce bilan est indicatif et ne remplace
      pas une vérification officielle de tes droits.
    </p>
  `;

  const checkboxes =
    section.querySelectorAll('input[type="checkbox"]');

  const progress =
    section.querySelector('[data-coverage-progress]');

  checkboxes.forEach(checkbox => {

    checkbox.addEventListener('change', () => {

      const completed = [...checkboxes]
        .filter(input => input.checked)
        .length;

      progress.textContent =
        completed + ' démarche(s) sur ' +
        checkboxes.length + ' réalisée(s)';

    });

  });

  container.appendChild(section);
}
