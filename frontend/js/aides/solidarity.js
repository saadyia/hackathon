
export function renderSolidarity(container, profile) {

  // Uniquement pour les assurées sans complémentaire solidaire

  if (!['basic', 'mutual'].includes(profile.coverage)) {
    return;
  }

  const section = document.createElement('section');

  section.className = 'card';
  section.style.marginTop = '24px';

  section.innerHTML = `
    <p class="eyebrow">Ma couverture sociale</p>

    <h2>Ai-je droit à la complémentaire santé solidaire ?</h2>

    <p class="muted">
      Estime tes droits à une complémentaire
      gratuite ou à tarif réduit.
    </p>

    <form style="display:grid; gap:18px; margin-top:20px">

      ${profile.age < 25 ? `
        <label>
          <strong>Quelle est ta situation familiale ?</strong>
          <select name="family" required>
            <option value="">Choisir ma situation</option>
            <option value="independent">
              Je vis séparément, je déclare mes impôts
              séparément et je ne reçois pas de pension
              alimentaire fiscalement déductible
              (ou je prends les engagements requis).
            </option>
            <option value="dependent">
              Je dépends du foyer de mes parents
            </option>
            <option value="exception">
              Je suis enceinte, j'ai un enfant à charge
              ou je bénéficie d'une allocation annuelle
              d'urgence du Crous en tant qu'étudiante isolée
            </option>
            <option value="unknown">
              Je ne sais pas
            </option>
          </select>
        </label>
      ` : ''}

      <label>
        <strong>Nombre de personnes dans le foyer retenu</strong>
        <input type="number" name="household"
          min="1" max="30" required
          placeholder="Exemple : 1">
      </label>

      <label>
        <strong>Ressources annuelles du foyer (€)</strong>
        <input type="number" name="income"
          min="0" step="0.01" required
          placeholder="Exemple : 12000">
      </label>

      <p class="muted">
        Indique les ressources retenues selon les règles
        officielles, y compris les éventuels forfaits logement.
        Si tu dépends de tes parents, utilise les ressources
        du foyer familial.
      </p>

      <button type="submit" class="btn btn-primary">
        Estimer mes droits
      </button>

    </form>

    <div class="solidarity-result"
         aria-live="polite"
         style="margin-top:20px">
    </div>

    <p class="muted" style="margin-top:20px">
      Barèmes métropolitains au 1er avril 2026.
      Simulation indicative sur données fictives.
    </p>
  `;

  section.querySelectorAll('input, select').forEach(el => {
    el.style.cssText = `
      display:block;
      width:100%;
      padding:12px;
      margin-top:8px;
      border:1px solid var(--line);
      border-radius:var(--radius-sm);
      background:var(--surface);
      color:var(--ink);
      font:inherit;
    `;
  });

  container.appendChild(section);

  const form = section.querySelector('form');
  const result = section.querySelector('.solidarity-result');

  form.addEventListener('input', () => {
    result.innerHTML = '';
  });

  form.addEventListener('submit', event => {

    event.preventDefault();

    const data = new FormData(form);

    const household = Number(data.get('household'));
    const income = Number(data.get('income'));
    const family = data.get('family');

    if (family === 'unknown') {
      result.textContent =
        'Il faut déterminer ton foyer de référence avant de calculer tes droits.';
      return;
    }

    if (family === 'dependent' && household < 2) {
      result.textContent =
        'Tu dois renseigner le nombre de personnes de ton foyer familial.';
      return;
    }

    const freeLimits = [10421, 15632, 18758, 21885];
    const paidLimits = [14069, 21103, 25324, 29544];

    const freeLimit = household <= 4
      ? freeLimits[household - 1]
      : 21885 + (household - 4) * 4169;

    const paidLimit = household <= 4
      ? paidLimits[household - 1]
      : 29544 + (household - 4) * 5628;

    const age = Number(profile.age);

    const fee = age <= 29 ? 8
      : age <= 49 ? 14
      : age <= 59 ? 21
      : age <= 69 ? 25
      : 30;

    let title;
    let amount;
    let description;

    if (income <= freeLimit) {

      title = 'Complémentaire gratuite potentielle';
      amount = '0 € / mois';
      description =
        'Tes ressources déclarées respectent le plafond de gratuité.';

    } else if (income <= paidLimit) {

      title = 'Complémentaire avec participation potentielle';
      amount = fee + ' € / mois';
      description =
        'Estimation de ta cotisation individuelle. Les autres membres du foyer peuvent avoir une cotisation différente.';

    } else {

      title = 'Plafond standard dépassé';
      amount = 'Droits à vérifier';
      description =
        'Tes ressources dépassent le plafond standard. Des situations particulières peuvent modifier tes droits.';

    }

    result.innerHTML = `
      <div style="
        background:var(--fertile-soft);
        padding:20px;
        border-radius:var(--radius);
        display:grid;
        gap:12px;
      ">

        <h2>${title}</h2>

        <strong style="font-size:32px;color:var(--fertile)">
          ${amount}
        </strong>

        <p>${description}</p>

        <p>
          Ressources renseignées :
          ${income.toLocaleString('fr-FR')} €
        </p>

        <p>
          Plafond gratuit :
          ${freeLimit.toLocaleString('fr-FR')} €
        </p>

        <p>
          Plafond avec participation :
          ${paidLimit.toLocaleString('fr-FR')} €
        </p>

        <a class="btn btn-primary"
           href="https://www.mesdroitssociaux.gouv.fr/"
           target="_blank"
           rel="noopener noreferrer">
          Vérifier officiellement mes droits
        </a>

      </div>
    `;
  });
}
