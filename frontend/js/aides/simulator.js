// Page « Se soigner » : simulateur des aides et remboursements santé.
// Styles : section « Se soigner : aides » de css/styles.css (couleurs du site uniquement).

import { renderSpecific } from './specific.js';
import { renderCoverage } from './coverage.js';
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
      questions: ['age', 'student'],
    },
    {
      title: 'Ta couverture santé',
      description: 'Identifions les remboursements dont tu peux bénéficier.',
      questions: ['coverage'],
    },
    {
      title: 'Tes besoins de santé',
      description: 'Sélectionne les sujets qui te concernent.',
      questions: ['needs'],
    },
  ];

  let currentStep = 0;

  container.innerHTML = `
    <section class="page page-wide aides">
      <p class="eyebrow">Se soigner · Mes droits</p>
      <h1>Ta santé ne devrait pas être une question de budget.</h1>
      <p class="lead">Découvre les aides, remboursements et solutions de santé adaptés à ta situation.</p>

      <div class="card aides-card">
        <div id="aides-progress"></div>

        <form id="aides-form">
          ${steps.map((step, index) => `
            <div class="aides-step" data-step="${index}" ${index !== 0 ? 'hidden' : ''}>
              <h2>${step.title}</h2>
              <p class="muted">${step.description}</p>
              <div class="aides-fields">
                ${QUESTIONS_AIDES
                  .filter((q) => step.questions.includes(q.id))
                  .map(renderQuestion)
                  .join('')}
              </div>
            </div>
          `).join('')}

          <p id="aides-error" class="aides-error" role="alert"></p>

          <div class="aides-actions">
            <button type="button" class="btn btn-ghost" id="aides-back">Précédent</button>
            <button type="button" class="btn btn-primary" id="aides-next">Continuer</button>
            <button type="submit" class="btn btn-primary" id="aides-submit" hidden>Découvrir mes aides</button>
          </div>
        </form>
      </div>

      <div id="aides-results" class="aides-results" aria-live="polite" hidden></div>

      <p class="muted">Tes réponses ne sont ni enregistrées ni envoyées à un serveur. Utilise uniquement des données fictives.</p>

      <a class="btn btn-primary" href="#accueil">Retour au tableau de bord</a>
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
    container.querySelectorAll('.aides-step').forEach((panel, index) => {
      panel.hidden = index !== currentStep;
    });

    back.hidden = currentStep === 0;
    next.hidden = currentStep === steps.length - 1;
    submit.hidden = currentStep !== steps.length - 1;

    error.textContent = '';

    progress.innerHTML = `
      <p class="eyebrow">Étape ${currentStep + 1} sur ${steps.length}</p>
      <div class="aides-progress" aria-hidden="true">
        ${steps.map((step, index) => `<span class="${index <= currentStep ? 'is-done' : ''}"></span>`).join('')}
      </div>
    `;
  }

  function validateStep() {
    const panel = container.querySelector(`[data-step="${currentStep}"]`);
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

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (currentStep !== steps.length - 1) return;

    const data = new FormData(form);

    const profile = {
      age: Number(data.get('age')),
      student: data.get('student'),
      coverage: data.get('coverage'),
      needs: data.getAll('needs'),
      details: data.getAll('details'),
    };

    if (profile.needs.length === 0) {
      error.textContent = 'Sélectionne au moins un besoin de santé.';
      return;
    }

    renderResults(container, profile);
  });

  updateStep();
}

function renderQuestion(question) {
  if (question.type === 'number') {
    return `
      <div class="aides-question">
        <label class="aides-label" for="${question.id}">${question.label}</label>
        <input id="${question.id}" name="${question.id}" type="number"
          min="${question.min}" max="${question.max}" placeholder="Exemple : 21" required>
      </div>
    `;
  }

  const inputType = question.type === 'multi' ? 'checkbox' : 'radio';

  return `
    <fieldset class="aides-question">
      <legend class="aides-label">${question.label}</legend>
      <div class="aides-choices">
        ${question.options.map((option) => `
          <label class="aides-choice">
            <input type="${inputType}" name="${question.id}" value="${option.value}"
              ${inputType === 'radio' ? 'required' : ''}>
            <span>${option.label}</span>
          </label>
        `).join('')}
      </div>
    </fieldset>
  `;
}

function renderResults(container, profile) {
  const results = container.querySelector('#aides-results');
  const aids = personalizeAids(profile, getEligibleAids(profile));
  const categories = [...new Set(aids.map((aid) => aid.category))];

  results.hidden = false;

  results.innerHTML = `
    <div class="card aides-summary">
      <p class="eyebrow">Ton bilan personnalisé</p>
      <h2>Mes aides santé</h2>
      <p class="aides-figure">${aids.length}</p>
      <p>Dispositif(s) potentiel(s) identifié(s) selon ta situation.</p>
      <p class="muted">Découvre les conditions et les démarches associées à chaque dispositif.</p>
    </div>

    ${categories.map((category) => `
      <section class="aides-category">
        <h2>${category}</h2>
        <div class="aides-grid">
          ${aids
            .filter((aid) => aid.category === category)
            .map((aid) => `
              <article class="card aid-card">
                <p class="eyebrow">${aid.category}</p>
                <h3>${aid.title}</h3>
                <p class="aid-amount">${aid.amount}</p>
                <p>${aid.description}</p>
                <details>
                  <summary>Conditions d'accès</summary>
                  <p class="muted">${aid.conditions}</p>
                </details>
                <a class="btn btn-primary btn-small" href="${aid.source}" target="_blank" rel="noopener noreferrer">
                  Découvrir le dispositif ↗
                </a>
              </article>
            `).join('')}
        </div>
      </section>
    `).join('')}

    ${aids.length === 0 ? `
      <div class="card aides-section">
        <h2>Aucun dispositif identifié</h2>
        <p>Cela ne signifie pas que tu n'as droit à aucune aide. Notre catalogue peut être incomplet.</p>
      </div>
    ` : ''}

    <p class="muted">Les résultats sont indicatifs et ne constituent pas une décision administrative.</p>
  `;

  renderCoverage(results, profile);
  renderSolidarity(results, profile);
  renderReimbursement(results, profile);
  renderSpecific(results, profile);

  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
