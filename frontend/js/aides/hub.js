// Page « Se soigner » : menu d'accueil des aides (bilan complet ou outil ciblé).
// Styles : section « Se soigner : aides » de css/styles.css (couleurs du site uniquement).

import { renderSimulator } from './simulator.js';
import { renderCoverage } from './coverage.js';
import { renderSolidarity } from './solidarity.js';
import { renderReimbursement } from './reimbursement.js';
import { renderSpecific } from './specific.js';
import { QUESTIONS_AIDES } from './questionnaire.js';

const MODULES = [
  { id: 'reimbursement', title: 'Mes remboursements', description: 'Estimer mon reste à charge.' },
  { id: 'coverage', title: 'Ma couverture santé', description: 'Comprendre mes droits et mes démarches.' },
  { id: 'solidarity', title: 'Ma complémentaire solidaire', description: 'Tester mon éligibilité.' },
  { id: 'mental', title: 'Ma santé mentale', description: 'Calculer mes séances restantes.' },
  { id: 'maternity', title: 'Grossesse et maternité', description: 'Comprendre mes remboursements.' },
];

export function renderAidesHub(container) {
  function showMenu() {
    container.innerHTML = `
      <section class="page page-wide aides">
        <p class="eyebrow">Se soigner · Mes droits</p>
        <h1>Ta santé ne devrait pas dépendre de ton budget.</h1>
        <p class="lead">Découvre tes droits et les solutions pour accéder plus facilement aux soins.</p>

        <div class="card aides-summary aides-hero">
          <div class="aides-hero-text">
            <p class="eyebrow">Mes aides financières</p>
            <h2>Mon bilan personnalisé</h2>
            <p>Découvre toutes les aides adaptées à ta situation grâce à notre questionnaire.</p>
          </div>
          <button type="button" class="btn btn-primary" data-module="full">Commencer mon bilan</button>
        </div>

        <h2>Accéder directement à mes outils</h2>
        <div class="aides-tools">
          ${MODULES.map((module) => `
            <button type="button" class="card aides-tool" data-module="${module.id}">
              <span class="aides-tool-title">${module.title}</span>
              <span class="muted">${module.description}</span>
              <span class="aides-tool-link">Accéder à mon outil</span>
            </button>
          `).join('')}
        </div>

        <div class="card aides-section aides-highlight-neutral">
          <h2>Trouver un·e professionnel·le</h2>
          <p>La carte des psychologues et gynécologues joignables par téléphone est sur l'accueil.</p>
          <a class="btn btn-primary btn-small" href="#accueil">Voir la carte</a>
        </div>

        <p class="muted">Prototype : utilise uniquement des données fictives.</p>
      </section>
    `;

    container.querySelectorAll('[data-module]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.module;
        if (id === 'full') showFull();
        else showQuick(id);
      });
    });
  }

  function backButton() {
    return '<button type="button" class="btn btn-ghost btn-small aides-back" data-return>Retour à Se soigner</button>';
  }

  function showFull() {
    container.innerHTML = `${backButton()}<div data-content></div>`;
    container.querySelector('[data-return]').addEventListener('click', showMenu);
    renderSimulator(container.querySelector('[data-content]'));
    window.scrollTo(0, 0);
  }

  function showQuick(id) {
    const module = MODULES.find((item) => item.id === id);
    const coverageQuestion = QUESTIONS_AIDES.find((question) => question.id === 'coverage');

    container.innerHTML = `
      <section class="page page-wide aides">
        ${backButton()}
        <p class="eyebrow">Se soigner · Mes outils</p>
        <h1>${module.title}</h1>
        <p class="lead">${module.description}</p>

        <form class="card aides-section aides-form">
          <h2>Ma situation</h2>

          <label>
            <strong>Quel âge as-tu ?</strong>
            <input type="number" name="age" min="16" max="100" placeholder="Exemple : 21" required>
          </label>

          <label>
            <strong>Es-tu étudiante ?</strong>
            <select name="student" required>
              <option value="">Sélectionner</option>
              <option value="yes">Oui</option>
              <option value="no">Non</option>
            </select>
          </label>

          <label>
            <strong>Quelle est ta couverture santé ?</strong>
            <select name="coverage" required>
              <option value="">Sélectionner</option>
              ${coverageQuestion.options.map((option) => `<option value="${option.value}">${option.label}</option>`).join('')}
            </select>
          </label>

          <button class="btn btn-primary" type="submit">Accéder à mon simulateur</button>
        </form>

        <div class="aides-results" data-result aria-live="polite"></div>

        <p class="muted">Les résultats sont indicatifs. Utilise uniquement des données fictives.</p>
      </section>
    `;

    container.querySelector('[data-return]').addEventListener('click', showMenu);

    const form = container.querySelector('form');
    const result = container.querySelector('[data-result]');

    form.addEventListener('input', () => {
      result.innerHTML = '';
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const data = new FormData(form);
      const profile = {
        age: Number(data.get('age')),
        student: data.get('student'),
        coverage: data.get('coverage'),
        needs: [id],
        details: [],
      };

      result.innerHTML = '';

      if (id === 'reimbursement') renderReimbursement(result, profile);
      if (id === 'coverage') renderCoverage(result, profile);
      if (id === 'solidarity') {
        profile.needs = ['financial'];
        renderSolidarity(result, profile);
      }
      if (id === 'mental' || id === 'maternity') renderSpecific(result, profile);

      // Simulateur indisponible pour cette couverture : on oriente vers les démarches.
      if (!result.children.length) {
        result.innerHTML = `
          <div class="card aides-section">
            <h2>Ta situation nécessite une vérification complémentaire</h2>
            <p>Ce simulateur ne permet pas de calculer précisément tes droits avec cette couverture.</p>
            <p>Voici les démarches qui peuvent t'aider.</p>
          </div>
        `;
        renderCoverage(result, profile);
      }

      result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    window.scrollTo(0, 0);
  }

  showMenu();
}
