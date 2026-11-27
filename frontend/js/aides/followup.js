
const DETAILS = {
  menstrual: {
    title: 'Précise tes besoins menstruels',
    options: [
      ['products', 'Protections périodiques'],
      ['pain', 'Règles douloureuses'],
      ['endometriosis', 'Endométriose'],
      ['pcos', 'Syndrome des ovaires polykystiques'],
      ['heavy', 'Règles abondantes'],
      ['pms', 'Syndrome prémenstruel']
    ]
  },

  contraception: {
    title: 'Quelle contraception te concerne ?',
    options: [
      ['pill', 'Pilule contraceptive'],
      ['implant', 'Implant'],
      ['iud', 'Stérilet'],
      ['condoms', 'Préservatifs'],
      ['emergency', 'Contraception d’urgence'],
      ['advice', 'Consultation et conseils']
    ]
  },

  sexual: {
    title: 'Quels sont tes besoins en santé sexuelle ?',
    options: [
      ['screening', 'Dépistage en laboratoire'],
      ['home_test', 'Dépistage à domicile'],
      ['hpv', 'Vaccination contre les papillomavirus'],
      ['treatment', 'Consultations et traitements']
    ]
  },

  mental: {
    title: 'Quel accompagnement recherches-tu ?',
    options: [
      ['psychologist', 'Psychologue'],
      ['psychiatrist', 'Psychiatre'],
      ['free_support', 'Accompagnement gratuit']
    ]
  },

  maternity: {
    title: 'Quelle situation te concerne ?',
    options: [
      ['pregnancy', 'Suivi de grossesse'],
      ['delivery', 'Accouchement'],
      ['abortion', 'Interruption volontaire de grossesse'],
      ['postpartum', 'Suivi après la naissance'],
      ['financial_support', 'Aides financières à la maternité']
    ]
  },

  financial: {
    title: 'Quelles difficultés rencontres-tu ?',
    options: [
      ['insurance', 'Mutuelle trop chère'],
      ['medical_costs', 'Frais médicaux importants'],
      ['low_income', 'Ressources insuffisantes'],
      ['no_access', 'Difficultés d’accès aux soins']
    ]
  },

  international: {
    title: 'Quelle est ta situation administrative ?',
    options: [
      ['european', 'Carte européenne d’assurance maladie'],
      ['foreign_insurance', 'Assurance étrangère'],
      ['affiliation_pending', 'Affiliation en cours'],
      ['french_insurance', 'Affiliation française effective']
    ]
  },

  general: {
    title: 'Quels soins recherches-tu ?',
    options: [
      ['consultation', 'Consultation médicale'],
      ['dental', 'Soins dentaires'],
      ['optical', 'Lunettes et soins optiques'],
      ['vaccination', 'Vaccination'],
      ['prevention', 'Bilan de prévention']
    ]
  }
};

export function renderFollowups(form) {
  const panel = form.querySelector('[data-step="2"]');

  if (!panel) return;

  const section = document.createElement('div');
  section.className = 'aides-followups';

  panel.appendChild(section);

  const selectedDetails = new Set();

  function refresh() {
    const needs = [...form.querySelectorAll(
      'input[name="needs"]:checked'
    )].map(input => input.value);

    section.innerHTML = needs
      .filter(need => DETAILS[need])
      .map(need => {
        const detail = DETAILS[need];

        return `
          <fieldset class="aides-followup">
            <legend class="aides-label">${detail.title}</legend>
            <p class="muted">Facultatif, plusieurs réponses possibles.</p>
            <div class="aides-choices">
              ${detail.options.map(([value, label]) => {
                const key = need + ':' + value;
                return `
                  <label class="aides-choice">
                    <input type="checkbox" name="details" value="${key}" ${selectedDetails.has(key) ? 'checked' : ''}>
                    <span>${label}</span>
                  </label>
                `;
              }).join('')}
            </div>
          </fieldset>
        `;
      }).join('');
  }

  form.addEventListener('change', event => {
    const input = event.target;

    if (input.name === 'details') {
      if (input.checked) {
        selectedDetails.add(input.value);
      } else {
        selectedDetails.delete(input.value);
      }
    }

    if (input.name === 'needs') {
      refresh();
    }
  });

  refresh();
}
