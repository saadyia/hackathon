import { personalizeAids } from './personalization.js';
import { renderFollowups } from './followup.js';
import { QUESTIONS_AIDES } from './questionnaire.js';
import { getEligibleAids } from './eligibility.js';
import { renderSolidarity } from './solidarity.js';
import { renderReimbursement } from './reimbursement.js';

export function renderSimulator(container) {

  const steps = [
    {
      title: 'Faisons connaissance',
      description: 'Quelques informations pour personnaliser tes droits.',
      icon: '👤',
      questions: ['age', 'student']
    },
    {
      title: 'Ta couverture santé',
      description: 'Identifions les remboursements dont tu peux bénéficier.',
      icon: '🛡️',
      questions: ['coverage']
    },
    {
      title: 'Tes besoins de santé',
      description: 'Sélectionne les sujets qui te concernent.',
      icon: '🌷',
      questions: ['needs']
    }
  ];

  let currentStep = 0;

  container.innerHTML = `
    <section class="page">

      <p class="eyebrow">HERHEALTH · MES DROITS</p>

      <h1>Ta santé ne devrait pas être
      une question de budget.</h1>

      <p class="lead">
        Découvre les aides, remboursements et solutions
        de santé adaptés à ta situation.
      </p>

      <div class="card" style="display:grid;gap:24px">

        <div id="aides-progress"></div>

        <form id="aides-form">

          ${steps.map((step, index) => `
            <div class="aides-step"
                 data-step="${index}"
                 ${index !== 0 ? 'hidden' : ''}>

              <p style="font-size:36px">${step.icon}</p>

              <h2>${step.title}</h2>

              <p class="muted" style="margin:12px 0 24px">
                ${step.description}
              </p>

              <div style="display:grid;gap:24px">
                ${QUESTIONS_AIDES
                  .filter(q => step.questions.includes(q.id))
                  .map(renderQuestion)
                  .join('')}
              </div>

            </div>
          `).join('')}

          <p id="aides-error"
             role="alert"
             style="color:var(--primary);margin-top:12px">
          </p>

          <div style="
            display:flex;
            flex-wrap:wrap;
            justify-content:space-between;
            gap:12px;
            margin-top:28px
          ">

            <button type="button"
                    class="btn"
                    id="aides-back">
              ← Précédent
            </button>

            <button type="button"
                    class="btn btn-primary"
                    id="aides-next">
              Continuer →
            </button>

            <button type="submit"
                    class="btn btn-primary"
                    id="aides-submit"
                    hidden>
              Découvrir mes aides
            </button>

          </div>

        </form>

      </div>

      <div id="aides-results"
           aria-live="polite"
           hidden>
      </div>

      <p class="muted">
        🔒 Tes réponses ne sont ni enregistrées
        ni envoyées à un serveur.
        Utilise uniquement des données fictives.
      </p>

      <a class="btn" href="#accueil">
        Retour au tableau de bord
      </a>

    </section>
  `;

  const form = container.querySelector('#aides-form');
renderFollowups(form);
  const progress = container.querySelector('#aides-progress');
  const back = container.querySelector('#aides-back');
  const next = container.querySelector('#aides-next');
  const submit = container.querySelector('#aides-submit');
  const error = container.querySelector('#aides-error');
  const results = container.querySelector('#aides-results');

  function updateStep() {

    container.querySelectorAll('.aides-step')
      .forEach((panel, index) => {
        panel.hidden = index !== currentStep;
      });

    back.hidden = currentStep === 0;
    next.hidden = currentStep === steps.length - 1;
    submit.hidden = currentStep !== steps.length - 1;

    error.textContent = '';

    progress.innerHTML = `
      <p class="eyebrow">
        Étape ${currentStep + 1} sur ${steps.length}
      </p>

      <div style="
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:8px;
        margin-top:12px
      ">
        ${steps.map((step, index) => `
          <div style="
            height:8px;
            border-radius:999px;
            background:var(--${index <= currentStep
              ? 'primary'
              : 'primary-soft'})
          "></div>
        `).join('')}
      </div>
    `;
  }

  function validateStep() {

    const panel = container.querySelector(
      `[data-step="${currentStep}"]`
    );

    const fields = panel.querySelectorAll('input');

    for (const field of fields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }

    return true;
  }

  next.addEventListener('click', () => {

    if (!validateStep()) return;

    currentStep++;
    updateStep();
  });

  back.addEventListener('click', () => {

    if (currentStep > 0) {
      currentStep--;
      updateStep();
    }
  });

  form.addEventListener('input', () => {
    results.hidden = true;
    results.innerHTML = '';
    error.textContent = '';
  });

  form.addEventListener('submit', event => {

    event.preventDefault();

    if (currentStep !== steps.length - 1) return;

    const data = new FormData(form);

    const profile = {
      age: Number(data.get('age')),
      student: data.get('student'),
      coverage: data.get('coverage'),
      needs: data.getAll('needs'),
details: data.getAll('details')
    };

    if (profile.needs.length === 0) {
      error.textContent =
        'Sélectionne au moins un besoin de santé.';
      return;
    }

    renderResults(container, profile);
  });

  updateStep();
}

function renderQuestion(question) {

  if (question.type === 'number') {

    return `
      <div>
        <label for="${question.id}">
          <strong>${question.label}</strong>
        </label>

        <input
          id="${question.id}"
          name="${question.id}"
          type="number"
          min="${question.min}"
          max="${question.max}"
          placeholder="Exemple : 21"
          required
          style="
            display:block;
            width:100%;
            padding:16px;
            margin-top:12px;
            border:1px solid var(--line);
            border-radius:var(--radius-sm);
            background:var(--surface-2);
            color:var(--ink);
            font:inherit
          "
        >
      </div>
    `;
  }

  const inputType =
    question.type === 'multi' ? 'checkbox' : 'radio';

  return `
    <fieldset style="border:0;padding:0;margin:0">

      <legend>
        <strong>${question.label}</strong>
      </legend>

      <div style="display:grid;gap:12px;margin-top:16px">

        ${question.options.map(option => `
          <label style="
            display:flex;
            align-items:center;
            gap:14px;
            padding:18px;
            border:1px solid var(--line);
            border-radius:var(--radius-sm);
            background:var(--surface-2);
            cursor:pointer
          ">

            <input
              type="${inputType}"
              name="${question.id}"
              value="${option.value}"
              ${inputType === 'radio' ? 'required' : ''}
              style="accent-color:var(--primary)"
            >

            <span>${option.label}</span>

          </label>
        `).join('')}

      </div>
    </fieldset>
  `;
}

function renderResults(container, profile) {

  const results = container.querySelector('#aides-results');
  const aids = personalizeAids(
  profile,
  getEligibleAids(profile)
);

  const categories = [...new Set(
    aids.map(aid => aid.category)
  )];

  results.hidden = false;

  results.innerHTML = `
    <div style="display:grid;gap:24px;margin-top:24px">

      <div class="card" style="
        background:var(--primary-soft);
        display:grid;
        gap:12px
      ">

        <p class="eyebrow">TON BILAN PERSONNALISÉ</p>

        <h1>Mes aides santé</h1>

        <strong style="
          font-size:42px;
          color:var(--primary)
        ">
          ${aids.length}
        </strong>

        <p>
          Dispositif(s) potentiel(s) identifié(s)
          selon ta situation.
        </p>

        <p class="muted">
          Découvre les conditions et les démarches
          associées à chaque dispositif.
        </p>

      </div>

      ${categories.map(category => `

        <section style="display:grid;gap:16px">

          <h2>${category}</h2>

          <div style="
            display:grid;
            grid-template-columns:
              repeat(auto-fit,minmax(min(100%,280px),1fr));
            gap:16px
          ">

            ${aids
              .filter(aid => aid.category === category)
              .map(aid => `

                <article class="card" style="
                  display:grid;
                  gap:14px;
                  align-content:start;
                  border-top:4px solid var(--primary)
                ">

                  <p class="eyebrow">${aid.category}</p>

                  <h2>${aid.title}</h2>

                  <div style="
                    background:var(--fertile-soft);
                    color:var(--fertile);
                    border-radius:var(--radius-sm);
                    padding:14px;
                    font-size:24px;
                    font-weight:700
                  ">
                    ${aid.amount}
                  </div>

                  <p>${aid.description}</p>

                  <details>

                    <summary style="cursor:pointer">
                      Conditions d'accès
                    </summary>

                    <p class="muted" style="margin-top:10px">
                      ${aid.conditions}
                    </p>

                  </details>

                  <a class="btn btn-primary"
                     href="${aid.source}"
                     target="_blank"
                     rel="noopener noreferrer">
                    Découvrir le dispositif ↗
                  </a>

                </article>

              `).join('')}

          </div>
        </section>

      `).join('')}

      ${aids.length === 0 ? `
        <div class="card">
          <h2>Aucun dispositif identifié</h2>

          <p>
            Cela ne signifie pas que tu n'as droit
            à aucune aide. Notre catalogue peut être incomplet.
          </p>
        </div>
      ` : ''}

    </div>

    <p class="muted" style="margin-top:24px">
      Les résultats sont indicatifs et ne constituent
      pas une décision administrative.
    </p>
  `;

  renderSolidarity(results, profile);
  renderReimbursement(results, profile);

  results.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}
