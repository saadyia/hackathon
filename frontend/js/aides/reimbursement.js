
export function renderReimbursement(container, profile) {

  const supported = ['basic', 'mutual', 'solidarity'];

  if (!supported.includes(profile.coverage)) {
    return;
  }

  const section = document.createElement('section');

  section.className = 'card aides-section';

  section.innerHTML = `
    <p class="eyebrow">Mon budget santé</p>

    <h2>Combien vais-je réellement payer ?</h2>

    <p class="muted">
      Estime le reste à charge de ta consultation
      selon ta couverture médicale.
    </p>

    <form class="aides-form">

      <label>
        <strong>Prix facturé (€)</strong>
        <input type="number" name="price"
          min="0.01" step="0.01" value="60" required>
      </label>

      <label>
        <strong>Base de remboursement (€)</strong>
        <input type="number" name="base"
          min="0.01" step="0.01" value="30" required>
      </label>

      <label>
        <strong>Taux de remboursement Assurance Maladie</strong>

        <select name="rate">
          <option value="70">70 % — Consultation classique</option>
          <option value="100">100 % — Prise en charge spécifique</option>
        </select>
      </label>

      ${profile.coverage === 'mutual' ? `
        <label>
          <strong>Garantie de ta mutuelle</strong>
          <select name="guarantee">
            <option value="unknown">Je ne sais pas</option>
            <option value="100">100 %</option>
            <option value="150">150 %</option>
            <option value="200">200 %</option>
            <option value="250">250 %</option>
            <option value="300">300 %</option>
          </select>
        </label>
      ` : ''}

      ${profile.age >= 18 && profile.coverage !== 'solidarity' ? `
        <label class="aides-choice">
          <input type="checkbox" name="exempt">
          Je bénéficie d'une exonération de la participation
          forfaitaire ou mon plafond annuel est atteint.
        </label>
      ` : ''}

      <button type="submit" class="btn btn-primary">
        Calculer mon remboursement
      </button>

    </form>

    <div class="reimbursement-result" aria-live="polite"></div>

    <p class="muted">
      Simulation indicative pour une consultation conventionnée
      dans le parcours de soins. Hors pénalités, plafonds
      spécifiques et garanties particulières du contrat.
    </p>
  `;

  container.appendChild(section);

  const form = section.querySelector('form');
  const result = section.querySelector('.reimbursement-result');

  const euros = value => value.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  });

  form.addEventListener('input', () => {
    result.innerHTML = '';
  });

  form.addEventListener('submit', event => {

    event.preventDefault();

    const data = new FormData(form);

    const price = Number(data.get('price'));
    const base = Number(data.get('base'));
    const rate = Number(data.get('rate')) / 100;

    const gross = Math.min(price, base * rate);

    const exempt =
      profile.age < 18 ||
      profile.coverage === 'solidarity' ||
      data.has('exempt');

    const participation = exempt || gross < 2 ? 0 : 2;

    const insurance = gross - participation;

    let complementary = 0;
    let unknownGuarantee = false;

    if (profile.coverage === 'solidarity') {

      complementary = Math.max(
        0,
        Math.min(price, base) - gross
      );

    } else if (profile.coverage === 'mutual') {

      const guarantee = data.get('guarantee');

      if (guarantee === 'unknown') {

        unknownGuarantee = true;

      } else {

        const ceiling = base * Number(guarantee) / 100;

        complementary = Math.max(
          0,
          Math.min(price, ceiling) - gross
        );
      }
    }

    const remaining = Math.max(
      0,
      price - insurance - complementary
    );

    result.innerHTML = `
      <div class="aides-highlight">

        <p class="eyebrow">Mon estimation</p>

        <h3>
          ${unknownGuarantee
            ? 'Reste à charge avant mutuelle'
            : 'Reste à charge estimé'}
        </h3>

        <p class="aides-figure">${euros(remaining)}</p>

        <p>Prix initial : ${euros(price)}</p>

        <p>
          Assurance Maladie :
          ${euros(insurance)}
        </p>

        <p>
          Complémentaire :
          ${unknownGuarantee
            ? 'Montant à vérifier'
            : euros(complementary)}
        </p>

        <p>
          Participation forfaitaire :
          ${euros(participation)}
        </p>

        <p class="muted">
          ${unknownGuarantee
            ? 'Consulte ton tableau de garanties pour affiner cette estimation.'
            : 'Estimation selon les paramètres renseignés.'}
        </p>

        ${profile.coverage === 'solidarity' && price > base ? `
          <p>
            Les dépassements ne sont normalement pas facturés
            aux bénéficiaires de la complémentaire solidaire,
            sauf exceptions. Vérifie le tarif proposé.
          </p>
        ` : ''}

        <a class="btn btn-primary"
           href="https://www.ameli.fr/assure/remboursements"
           target="_blank"
           rel="noopener noreferrer">
          Comprendre mes remboursements
        </a>

      </div>
    `;
  });
}
