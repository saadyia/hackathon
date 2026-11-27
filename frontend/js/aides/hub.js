
import { renderSimulator } from './simulator.js';
import { renderCoverage } from './coverage.js';
import { renderSolidarity } from './solidarity.js';
import { renderReimbursement } from './reimbursement.js';
import { renderSpecific } from './specific.js';
import { QUESTIONS_AIDES } from './questionnaire.js';

const MODULES = [
  {
    id: 'reimbursement',
    icon: '🧮',
    title: 'Mes remboursements',
    description: 'Estimer mon reste à charge.'
  },
  {
    id: 'coverage',
    icon: '🛡️',
    title: 'Ma couverture santé',
    description: 'Comprendre mes droits et mes démarches.'
  },
  {
    id: 'solidarity',
    icon: '💶',
    title: 'Ma complémentaire solidaire',
    description: 'Tester mon éligibilité.'
  },
  {
    id: 'mental',
    icon: '🧠',
    title: 'Ma santé mentale',
    description: 'Calculer mes séances restantes.'
  },
  {
    id: 'maternity',
    icon: '🌷',
    title: 'Grossesse et maternité',
    description: 'Comprendre mes remboursements.'
  }
];

export function renderAidesHub(container) {

  function showMenu() {

    container.innerHTML = `
      <section class="page" style="display:grid;gap:24px">

        <p class="eyebrow">HERHEALTH · SE SOIGNER</p>

        <h1>Ta santé ne devrait pas dépendre
        de ton budget.</h1>

        <p class="lead">
          Découvre tes droits et les solutions
          pour accéder plus facilement aux soins.
        </p>

        <div class="card" style="
          background:var(--primary-soft);
          display:grid;
          gap:16px;
        ">

          <p style="font-size:36px">📋</p>

          <h2>Mon bilan personnalisé</h2>

          <p>
            Découvre toutes les aides adaptées
            à ta situation grâce à notre questionnaire.
          </p>

          <button class="btn btn-primary"
                  data-module="full">
            Commencer mon bilan →
          </button>

        </div>

        <h2>Accéder directement à mes outils</h2>

        <div style="
          display:grid;
          grid-template-columns:
            repeat(auto-fit,minmax(min(100%,240px),1fr));
          gap:20px;
        ">

          ${MODULES.map(module => `
            <button type="button"
                    class="card"
                    data-module="${module.id}"
                    style="
                      text-align:left;
                      border:1px solid var(--line);
                      display:grid;
                      gap:12px;
                      color:var(--ink);
                    ">

              <span style="font-size:36px">
                ${module.icon}
              </span>

              <h2>${module.title}</h2>

              <p class="muted">
                ${module.description}
              </p>

              <strong style="color:var(--primary)">
                Accéder à mon outil →
              </strong>

            </button>
          `).join('')}

        </div>

        <div class="card" style="
          background:var(--surface-2);
          display:grid;
          gap:12px;
        ">
          <h2>📍 Trouver un professionnel</h2>

          <p>
            Découvre bientôt les professionnels
            et structures de santé accessibles.
          </p>

          <p class="muted">
            Fonctionnalité en cours d'intégration.
          </p>
        </div>

        <p class="muted">
          Prototype : utilise uniquement
          des données fictives.
        </p>

      </section>
    `;

    container.querySelectorAll('[data-module]')
      .forEach(button => {

        button.addEventListener('click', () => {

          const id = button.dataset.module;

          if (id === 'full') {
            showFull();
          } else {
            showQuick(id);
          }

        });

      });
  }

  function showFull() {

    container.innerHTML = `
      <button class="btn" data-return>
        ← Retour à Se soigner
      </button>

      <div data-content></div>
    `;

    container.querySelector('[data-return]')
      .addEventListener('click', showMenu);

    renderSimulator(
      container.querySelector('[data-content]')
    );

    window.scrollTo(0, 0);
  }

  function showQuick(id) {

    const module = MODULES.find(item => item.id === id);

    const coverageQuestion = QUESTIONS_AIDES.find(
      question => question.id === 'coverage'
    );

    container.innerHTML = `
      <section class="page" style="display:grid;gap:24px">

        <button class="btn" data-return>
          ← Retour à Se soigner
        </button>

        <p style="font-size:36px">${module.icon}</p>

        <h1>${module.title}</h1>

        <p class="lead">${module.description}</p>

        <form class="card" style="display:grid;gap:20px">

          <h2>Ma situation</h2>

          <label>
            <strong>Quel âge as-tu ?</strong>

            <input type="number"
                   name="age"
                   min="16"
                   max="100"
                   placeholder="Exemple : 21"
                   required>
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

              ${coverageQuestion.options.map(option => `
                <option value="${option.value}">
                  ${option.label}
                </option>
              `).join('')}

            </select>
          </label>

          <button class="btn btn-primary" type="submit">
            Accéder à mon simulateur →
          </button>

        </form>

        <div data-result aria-live="polite"></div>

        <p class="muted">
          Les résultats sont indicatifs.
          Utilise uniquement des données fictives.
        </p>

      </section>
    `;

    container.querySelector('[data-return]')
      .addEventListener('click', showMenu);

    const form = container.querySelector('form');
    const result = container.querySelector('[data-result]');

    form.querySelectorAll('input, select')
      .forEach(field => {

        field.style.cssText = `
          display:block;
          width:100%;
          margin-top:12px;
          padding:14px;
          border:1px solid var(--line);
          border-radius:var(--radius-sm);
          background:var(--surface-2);
          color:var(--ink);
          font:inherit;
        `;

      });

    form.addEventListener('input', () => {
      result.innerHTML = '';
    });

    form.addEventListener('submit', event => {

      event.preventDefault();

      const data = new FormData(form);

      const profile = {
        age: Number(data.get('age')),
        student: data.get('student'),
        coverage: data.get('coverage'),
        needs: [id],
        details: []
      };

      result.innerHTML = '';

      if (id === 'reimbursement') {
        renderReimbursement(result, profile);
      }

      if (id === 'coverage') {
        renderCoverage(result, profile);
      }

      if (id === 'solidarity') {
        profile.needs = ['financial'];
        renderSolidarity(result, profile);
      }

      if (id === 'mental' || id === 'maternity') {
        renderSpecific(result, profile);
      }

      if (!result.children.length) {

        result.innerHTML = `
          <div class="card" style="display:grid;gap:12px">

            <h2>Ta situation nécessite
            une vérification complémentaire</h2>

            <p>
              Ce simulateur ne permet pas de calculer
              précisément tes droits avec cette couverture.
            </p>

            <p>
              Voici les démarches qui peuvent t'aider.
            </p>

          </div>
        `;

        renderCoverage(result, profile);
      }

      result.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

    });

    window.scrollTo(0, 0);
  }

  showMenu();
}
