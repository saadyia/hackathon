
export function renderSpecific(container, profile) {

  const needs = profile.needs || [];

  if (needs.includes('mental')) {
    renderMental(container, profile);
  }

  if (needs.includes('maternity')) {
    renderMaternity(container, profile);
  }
}

// ==================================
// SIMULATEUR DE SANTE MENTALE
// ==================================

function renderMental(container, profile) {

  const student = profile.student === 'yes';

  const insured = [
    'basic', 'mutual', 'solidarity', 'ame'
  ].includes(profile.coverage);

  const free = ['solidarity', 'ame']
    .includes(profile.coverage);

  const mutual = profile.coverage === 'mutual';

  if (!student && !insured) return;

  const section = document.createElement('section');

  section.className = 'card aides-section';

  section.innerHTML = `
    <p class="eyebrow">Mon budget santé mentale</p>

    <h2>Combien de séances me reste-t-il ?</h2>

    <p class="muted">
      Estime les séances encore accessibles
      et leur coût potentiel.
    </p>

    <form class="aides-form">

      ${student ? `
        <label>
          <strong>Santé Psy Étudiant</strong>

          <p class="muted">
            Séances utilisées depuis le 1er septembre
            de l'année universitaire en cours.
          </p>

          <input type="number"
                 name="studentUsed"
                 min="0" max="12"
                 value="0" required>
        </label>
      ` : ''}

      ${insured ? `
        <label>
          <strong>Mon soutien psy</strong>

          <p class="muted">
            Séances utilisées depuis le 1er janvier
            de l'année civile en cours.
          </p>

          <input type="number"
                 name="generalUsed"
                 min="0" max="12"
                 value="0" required>
        </label>
      ` : ''}

      ${mutual ? `
        <label>
          <strong>
            Ta mutuelle couvre-t-elle les 40 % restants ?
          </strong>

          <select name="guarantee">
            <option value="unknown">Je ne sais pas</option>
            <option value="yes">Oui, intégralement</option>
            <option value="no">Non</option>
          </select>
        </label>
      ` : ''}

      <button type="submit" class="btn btn-primary">
        Calculer mes séances restantes
      </button>

    </form>

    <div class="specific-result" aria-live="polite"></div>

    <p class="muted">
      Simulation du régime standard, sous réserve
      d'éligibilité et de l'avis des professionnels.
      Certains régimes particuliers peuvent modifier
      les droits et les remboursements.
    </p>
  `;

  container.appendChild(section);

  const form = section.querySelector('form');
  const result = section.querySelector('.specific-result');

  form.addEventListener('input', () => {
    result.innerHTML = '';
  });

  form.addEventListener('submit', event => {

    event.preventDefault();

    const data = new FormData(form);

    const remainingStudent = student
      ? 12 - Number(data.get('studentUsed'))
      : 0;

    const remainingGeneral = insured
      ? 12 - Number(data.get('generalUsed'))
      : 0;

    const guarantee = data.get('guarantee');

    const costPerSession =
      free || (mutual && guarantee === 'yes')
        ? 0
        : 20;

    const unknownCost =
      mutual && guarantee === 'unknown';

    const maxCost = remainingGeneral * costPerSession;

    result.innerHTML = `
      <div class="aides-results-stack">

        ${student ? `
          <div class="aides-highlight aides-highlight-primary">

            <p class="eyebrow">Santé Psy Étudiant</p>

            <p class="aides-figure">${remainingStudent}</p>

            <p>Séances gratuites restantes</p>

            <a href="https://santepsy.etudiant.gouv.fr/"
               target="_blank"
               rel="noopener noreferrer">
              Trouver un psychologue partenaire
            </a>

          </div>
        ` : ''}

        ${insured ? `
          <div class="aides-highlight">

            <p class="eyebrow">Mon soutien psy</p>

            <p class="aides-figure">${remainingGeneral}</p>

            <p>Séances potentiellement remboursables</p>

            <p>
              Reste à charge par séance :
              <strong>
                ${unknownCost
                  ? '0 à 20 €'
                  : costPerSession + ' €'}
              </strong>
            </p>

            <a href="https://monsoutienpsy.ameli.fr/"
               target="_blank"
               rel="noopener noreferrer">
              Trouver un psychologue partenaire
            </a>

          </div>
        ` : ''}

        <div class="aides-highlight aides-highlight-neutral">

          <h3>Mon estimation globale</h3>

          <p>
            Jusqu'à
            ${remainingStudent + remainingGeneral}
            séances restantes dans les dispositifs.
          </p>

          <p class="aides-figure">
            ${unknownCost
              ? '0 à ' + maxCost
              : maxCost} €
          </p>

          <p>Reste à charge total estimé</p>

          <p class="muted">
            Les séances ne constituent pas une
            prescription. Leur nombre dépend de
            l'accompagnement nécessaire.
          </p>

        </div>

      </div>
    `;
  });
}

// ==================================
// SIMULATEUR DE GROSSESSE
// ==================================

function renderMaternity(container, profile) {

  const insured = [
    'basic', 'mutual', 'solidarity'
  ].includes(profile.coverage);

  const solidarity = profile.coverage === 'solidarity';

  const section = document.createElement('section');

  section.className = 'card aides-section';

  section.innerHTML = `
    <p class="eyebrow">Grossesse et maternité</p>

    <h2>Comment mes soins sont-ils remboursés ?</h2>

    <form class="aides-form">

      <label>
        <strong>À quelle période te trouves-tu ?</strong>

        <select name="period">
          <option value="early">
            Du premier au cinquième mois
          </option>

          <option value="late">
            Du sixième mois jusqu'à l'accouchement
          </option>

          <option value="postpartum">
            Dans les 12 jours après l'accouchement
          </option>

          <option value="after">
            Plus de 12 jours après l'accouchement
          </option>
        </select>
      </label>

      <label>
        <strong>Ta grossesse a-t-elle été déclarée ?</strong>

        <select name="declared">
          <option value="yes">Oui</option>
          <option value="no">Non</option>
          <option value="unknown">Je ne sais pas</option>
        </select>
      </label>

      <label>
        <strong>Quel type de soin ?</strong>

        <select name="care">
          <option value="mandatory">
            Examen prénatal obligatoire
          </option>

          <option value="ultrasound">
            Échographie
          </option>

          <option value="consultation">
            Consultation médicale classique
          </option>
        </select>
      </label>

      <button type="submit" class="btn btn-primary">
        Estimer ma prise en charge
      </button>

    </form>

    <div class="specific-result" aria-live="polite"></div>
  `;

  container.appendChild(section);

  const form = section.querySelector('form');
  const result = section.querySelector('.specific-result');

  form.addEventListener('input', () => {
    result.innerHTML = '';
  });

  form.addEventListener('submit', event => {

    event.preventDefault();

    const data = new FormData(form);

    const period = data.get('period');
    const care = data.get('care');
    const declared = data.get('declared');

    let amount = '';
    let explanation = '';

    if (!insured) {

      amount = 'Droits à vérifier';

      explanation =
        'Contacte un service de protection maternelle ' +
        'et infantile ou un service social hospitalier ' +
        'pour identifier la prise en charge applicable.';

    } else if (declared !== 'yes') {

      amount = 'Démarches à vérifier';

      explanation =
        'Vérifie la déclaration de grossesse et ' +
        'l’ouverture de tes droits maternité auprès ' +
        'de ton organisme d’assurance maladie.';

    } else if (
      period === 'late' ||
      period === 'postpartum'
    ) {

      amount = '100 %';

      explanation =
        'Les soins remboursables sont pris en charge ' +
        'à 100 % du tarif réglementaire pendant cette période.';

    } else if (
      period === 'early' &&
      care === 'mandatory'
    ) {

      amount = '100 %';

      explanation =
        'Les examens prénataux obligatoires ' +
        'bénéficient d’une prise en charge intégrale ' +
        'dans les limites réglementaires.';

    } else if (
      period === 'after' &&
      care !== 'consultation'
    ) {

      amount = 'Prise en charge spécifique à vérifier';

      explanation =
        'Les règles dépendent du soin postnatal ' +
        'effectivement réalisé et de sa prescription.';

    } else if (solidarity) {

      amount = 'Prise en charge intégrale sous conditions';

      explanation =
        'Ta complémentaire solidaire couvre les dépenses ' +
        'éligibles dans les limites réglementaires.';

    } else {

      amount = '70 % du tarif conventionnel';

      explanation =
        'Estimation pour une consultation classique ' +
        'dans le parcours de soins ou une échographie ' +
        'standard avant le sixième mois. ' +
        'Ta mutuelle peut compléter le remboursement.';

    }

    result.innerHTML = `
      <div class="aides-highlight">

        <p class="eyebrow">Ma prise en charge</p>

        <p class="aides-figure">${amount}</p>

        <p>${explanation}</p>

        <p class="muted">
          Estimation indicative, hors dépassements
          et prestations non remboursables.
        </p>

        <a class="btn btn-primary"
           href="https://www.ameli.fr/assure/droits-demarches/famille/maternite-paternite-adoption/grossesse"
           target="_blank"
           rel="noopener noreferrer">

          Vérifier mes droits maternité

        </a>

      </div>
    `;
  });
}

