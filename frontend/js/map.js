// Carte interactive des psychologues d'Ille-et-Vilaine (Leaflet + OpenStreetMap).
// Données : data/psychologues-35.json (Annuaire Santé RPPS, géocodé avec la Base Adresse Nationale).
// Leaflet est chargé à la demande depuis un CDN : aucune dépendance npm, aucun build.

const LEAFLET_VERSION = '1.9.4';
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet-src.esm.js`;
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const DATA_URL = 'data/psychologues-35.json';
const CENTER = [48.15, -1.65]; // Ille-et-Vilaine
const ZOOM = 9;

const FILTERS = {
  all: { label: 'Tous', test: () => true },
  student: { label: '🎓 Pour les étudiantes', test: (p) => isStudentService(p) },
  L: { label: 'Libéral (cabinet)', test: (p) => p.mode === 'L' },
  S: { label: 'Salarié (hôpital, CMP…)', test: (p) => p.mode === 'S' },
};

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const isStudentService = (p) => /^BAPU\b|^UNIVERSITE\b/.test((p.site || '').toUpperCase());
const formatTel = (t) => t.replace(/(\d{2})(?=\d)/g, '$1 ');

let leafletPromise;
let dataPromise;

function loadLeaflet() {
  if (!leafletPromise) {
    // On attend aussi la feuille de style : sans elle, Leaflet mesure mal la carte.
    const css = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      link.onload = resolve;
      link.onerror = reject;
      document.head.append(link);
    });
    leafletPromise = Promise.all([import(LEAFLET_JS), css]).then(([L]) => L);
  }
  return leafletPromise;
}

function loadData() {
  dataPromise ??= fetch(DATA_URL).then((r) => {
    if (!r.ok) throw new Error(`data_${r.status}`);
    return r.json();
  });
  return dataPromise;
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function popupHtml(place, people) {
  const where = place.addr
    ? `${escapeHtml(place.addr)}, ${escapeHtml(place.cp)} ${escapeHtml(place.city)}`
    : `${escapeHtml(place.city)} <em>(position approximative : centre de la commune)</em>`;
  const list = people.map((p) => `
    <li>
      <strong>${escapeHtml(p.name)}</strong>
      <span class="map-badge map-badge-${p.mode}">${p.mode === 'L' ? 'Libéral' : 'Salarié'}</span>
      ${p.site ? `<br><span class="map-site">${escapeHtml(p.site)}</span>` : ''}
      ${p.tel ? `<br><a href="tel:${escapeHtml(p.tel)}">📞 ${escapeHtml(formatTel(p.tel))}</a>` : ''}
      ${p.email ? `<br><a href="mailto:${escapeHtml(p.email)}">✉️ ${escapeHtml(p.email)}</a>` : ''}
    </li>`).join('');
  return `<div class="map-popup"><p class="map-where">📍 ${where}</p><ul>${list}</ul></div>`;
}

/**
 * Affiche la carte dans `el`. Peut être rappelée à chaque rendu du tableau de bord.
 * @param {HTMLElement} el
 */
export async function renderPsyMap(el) {
  el.innerHTML = `
    <div class="map-head">
      <div>
        <p class="eyebrow">Se soigner près de chez toi</p>
        <h2>Psychologues en Ille-et-Vilaine</h2>
      </div>
      <p class="map-count muted" aria-live="polite">Chargement…</p>
    </div>
    <div class="map-tools">
      <div class="chips" role="group" aria-label="Filtrer par type d'exercice">
        ${Object.entries(FILTERS).map(([k, f]) => `<button type="button" class="option" data-filter="${k}" aria-pressed="${k === 'all'}">${f.label}</button>`).join('')}
      </div>
      <div class="map-search">
        <input type="search" class="map-input" placeholder="Ville ou nom (ex : Rennes, Saint-Malo…)" aria-label="Rechercher une ville ou un nom">
        <button type="button" class="btn btn-ghost btn-small" data-locate>📍 Autour de moi</button>
      </div>
    </div>
    <div class="map-canvas" role="region" aria-label="Carte des psychologues d'Ille-et-Vilaine"></div>
    <p class="map-note muted">
      Étudiante ? Le <strong>BAPU</strong> et les services de santé universitaires proposent des consultations gratuites.
      En libéral, demande si la ou le psychologue est partenaire de <strong>Mon soutien psy</strong> (séances remboursées).
    </p>
    <p class="map-source muted"></p>`;

  const countEl = el.querySelector('.map-count');
  const canvas = el.querySelector('.map-canvas');

  let L;
  let data;
  try {
    [L, data] = await Promise.all([loadLeaflet(), loadData()]);
  } catch {
    countEl.textContent = '';
    canvas.innerHTML = '<p class="map-error">La carte n\'a pas pu se charger (connexion internet nécessaire pour le fond de carte).</p>';
    return;
  }
  if (!el.isConnected) return; // le tableau de bord a été re-rendu entre-temps

  el.querySelector('.map-source').textContent = `Source : ${data.source}`;

  const map = L.map(canvas, { preferCanvas: true, scrollWheelZoom: false }).setView(CENTER, ZOOM);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  // Zoom à la molette seulement après un clic sur la carte (évite de piéger le défilement de la page).
  map.on('click', () => map.scrollWheelZoom.enable());
  map.on('mouseout', () => map.scrollWheelZoom.disable());

  const colors = { L: cssVar('--primary'), S: cssVar('--sun-strong'), student: cssVar('--ink') };
  const layer = L.layerGroup().addTo(map);
  const state = { filter: 'all', query: '' };

  function draw({ fit = false } = {}) {
    layer.clearLayers();
    const q = normalize(state.query.trim());
    const bounds = [];
    let total = 0;

    for (const place of data.places) {
      const cityMatch = q && normalize(place.city).includes(q);
      const people = place.people.filter((p) => FILTERS[state.filter].test(p)
        && (!q || cityMatch || normalize(p.name).includes(q) || normalize(p.site || '').includes(q)));
      if (!people.length) continue;
      total += people.length;
      bounds.push([place.lat, place.lng]);

      const student = people.some(isStudentService);
      const liberal = people.filter((p) => p.mode === 'L').length;
      const color = student ? colors.student : liberal >= people.length / 2 ? colors.L : colors.S;
      L.circleMarker([place.lat, place.lng], {
        radius: Math.min(16, 5 + Math.sqrt(people.length) * 2.2),
        color: student ? cssVar('--sun') : cssVar('--surface'),
        weight: student ? 3 : 1.5,
        fillColor: color,
        fillOpacity: place.approx ? 0.45 : 0.85,
      })
        .bindPopup(popupHtml(place, people), { maxHeight: 260 })
        .bindTooltip(`${people.length} psychologue${people.length > 1 ? 's' : ''} · ${place.city}`)
        .addTo(layer);
    }

    countEl.textContent = `${total} psychologue${total > 1 ? 's' : ''} affiché${total > 1 ? 's' : ''}`;
    if (fit && bounds.length) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
  }

  el.querySelector('.map-tools').onclick = (e) => {
    const chip = e.target.closest('[data-filter]');
    if (chip) {
      state.filter = chip.dataset.filter;
      el.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === chip)));
      draw({ fit: state.filter !== 'all' || !!state.query });
      if (state.filter === 'all' && !state.query) map.setView(CENTER, ZOOM);
      return;
    }
    if (e.target.closest('[data-locate]')) {
      if (!navigator.geolocation) return;
      // Position utilisée uniquement dans le navigateur, jamais envoyée ni enregistrée.
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          map.setView([coords.latitude, coords.longitude], 13);
          L.circleMarker([coords.latitude, coords.longitude], { radius: 8, color: cssVar('--surface'), weight: 3, fillColor: cssVar('--ink'), fillOpacity: 1 })
            .bindTooltip('Tu es ici').addTo(layer);
        },
        () => { countEl.textContent = 'Position indisponible : cherche plutôt ta ville.'; },
        { timeout: 8000 },
      );
    }
  };

  let searchTimer;
  el.querySelector('.map-input').oninput = (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = e.target.value;
      draw({ fit: !!state.query.trim() });
      if (!state.query.trim()) map.setView(CENTER, ZOOM);
    }, 250);
  };

  draw();
  // Le conteneur peut avoir changé de taille pendant le chargement.
  setTimeout(() => map.invalidateSize(), 0);
}
