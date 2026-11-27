// Carte interactive des psychologues en France (Leaflet + OpenStreetMap).
// Données : data/psy/ (Annuaire Santé RPPS géocodé, voir backend/scripts/build_psy_map.py)
//   index.json    : un résumé par département (effectifs, centre, emprise)
//   communes.json : [nom, département, lat, lng, effectif] pour la recherche par ville
//   <dép>.json    : les lieux d'exercice du département, chargés seulement quand on zoome dessus
// Leaflet est chargé à la demande depuis un CDN : aucune dépendance npm, aucun build.

const LEAFLET_VERSION = '1.9.4';
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet-src.esm.js`;
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const DATA_DIR = 'data/psy';
const FRANCE = [46.6, 2.4];
const FRANCE_ZOOM = window.matchMedia('(max-width: 719px)').matches ? 5 : 6;
const DETAIL_ZOOM = 8; // à partir de ce zoom, on affiche les adresses au lieu des départements

const FILTERS = {
  all: { label: 'Tous', key: 'n', test: () => true },
  student: { label: '🎓 Pour les étudiantes', key: 'student', test: (p) => isStudentService(p) },
  L: { label: 'Libéral (cabinet)', key: 'L', test: (p) => p.mode === 'L' },
  S: { label: 'Salarié (hôpital, CMP…)', key: 'S', test: (p) => p.mode === 'S' },
};

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[-']/g, ' ');
// Même règle que build_psy_map.py : BAPU, services de santé universitaires / étudiants.
const STUDENT_RE = /^(BAPU|UNIVERSITE|SERVICE (DE )?SANTE (UNIVERSITAIRE|ETUDIANT)|SUMPPS|SSU|SSE)\b/;
const isStudentService = (p) => STUDENT_RE.test(normalize(p.site || '').toUpperCase().replace(/ +/g, ' '));
const formatTel = (t) => t.replace(/(\d{2})(?=\d)/g, '$1 ');
const plural = (n, word) => `${n.toLocaleString('fr-FR')} ${word}${n > 1 ? 's' : ''}`;

// ---------- Chargements (mis en cache pour toute la session) ----------

let leafletPromise;
let indexPromise;
let communesPromise;
const depPromises = new Map();

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

const getJson = (url) => fetch(url).then((r) => {
  if (!r.ok) throw new Error(`data_${r.status}`);
  return r.json();
});

const loadIndex = () => (indexPromise ??= getJson(`${DATA_DIR}/index.json`));
const loadCommunes = () => (communesPromise ??= getJson(`${DATA_DIR}/communes.json`));
function loadDep(code) {
  if (!depPromises.has(code)) {
    depPromises.set(code, getJson(`${DATA_DIR}/${code}.json`).catch((e) => {
      depPromises.delete(code); // permettra de réessayer
      throw e;
    }));
  }
  return depPromises.get(code);
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

// ---------- Rendu ----------

/**
 * Affiche la carte dans `el`. Appelée à chaque affichage de l'accueil.
 * @param {HTMLElement} el
 */
export async function renderPsyMap(el) {
  el.innerHTML = `
    <div class="map-head">
      <div>
        <p class="eyebrow">Se soigner près de chez toi</p>
        <h2>Trouver un·e psychologue</h2>
      </div>
      <p class="map-count muted" aria-live="polite">Chargement…</p>
    </div>
    <div class="map-tools">
      <div class="chips" role="group" aria-label="Filtrer par type d'exercice">
        ${Object.entries(FILTERS).map(([k, f]) => `<button type="button" class="option" data-filter="${k}" aria-pressed="${k === 'all'}">${f.label}</button>`).join('')}
      </div>
      <div class="map-search">
        <input type="search" class="map-input" list="map-cities" autocomplete="off"
          placeholder="Ville (ex : Rennes, Lyon…) ou nom" aria-label="Rechercher une ville ou un nom">
        <datalist id="map-cities"></datalist>
        <select class="map-select" aria-label="Aller à un département"><option value="">Département…</option></select>
        <button type="button" class="btn btn-ghost btn-small" data-locate>📍 Autour de moi</button>
        <button type="button" class="btn btn-ghost btn-small" data-france>🇫🇷 France</button>
      </div>
    </div>
    <div class="map-canvas" role="region" aria-label="Carte des psychologues en France"></div>
    <p class="map-note muted">
      Zoome ou clique sur un département pour voir les adresses.
      Étudiante ? Le <strong>BAPU</strong> et les services de santé universitaires proposent des consultations gratuites.
      En libéral, demande si la ou le psychologue est partenaire de <strong>Mon soutien psy</strong> (séances remboursées).
    </p>
    <p class="map-source muted"></p>`;

  const countEl = el.querySelector('.map-count');
  const canvas = el.querySelector('.map-canvas');
  const input = el.querySelector('.map-input');
  const datalist = el.querySelector('#map-cities');
  const select = el.querySelector('.map-select');

  let L;
  let index;
  try {
    [L, index] = await Promise.all([loadLeaflet(), loadIndex()]);
  } catch {
    countEl.textContent = '';
    canvas.innerHTML = '<p class="map-error">La carte n\'a pas pu se charger (connexion internet nécessaire pour le fond de carte).</p>';
    return;
  }
  if (!el.isConnected) return; // le tableau de bord a été re-rendu entre-temps

  el.querySelector('.map-source').textContent = `Source : ${index.source}`;
  const deps = Object.entries(index.deps);
  select.insertAdjacentHTML('beforeend', deps
    .sort(([a], [b]) => a.localeCompare(b, 'fr', { numeric: true }))
    .map(([code, d]) => `<option value="${code}">${code} — ${escapeHtml(d.name)}</option>`).join(''));

  const map = L.map(canvas, { preferCanvas: true, scrollWheelZoom: false, minZoom: 3 }).setView(FRANCE, FRANCE_ZOOM);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  // Zoom à la molette seulement après un clic sur la carte (évite de piéger le défilement de la page).
  map.on('click', () => map.scrollWheelZoom.enable());
  map.on('mouseout', () => map.scrollWheelZoom.disable());

  const colors = {
    L: cssVar('--primary'), S: cssVar('--sun-strong'), student: cssVar('--ink'),
    ring: cssVar('--surface'), studentRing: cssVar('--sun'),
  };
  const layer = L.layerGroup().addTo(map);
  const loaded = new Map(); // code département → lieux
  const state = { filter: 'all', query: '', me: null };

  const depBounds = (d) => L.latLngBounds([d.bbox[0], d.bbox[1]], [d.bbox[2], d.bbox[3]]);
  // Centre le département, assez zoomé pour afficher les adresses.
  const goToDep = (d) => map.setView([d.lat, d.lng], Math.max(DETAIL_ZOOM, Math.min(12, map.getBoundsZoom(depBounds(d)))), { animate: false });

  // Vue nationale : une bulle par département.
  function drawDeps() {
    const key = FILTERS[state.filter].key;
    let total = 0;
    const max = Math.max(...deps.map(([, d]) => d[key] || 0), 1);
    for (const [code, d] of deps) {
      const n = d[key] || 0;
      total += n;
      if (!n) continue;
      L.circleMarker([d.lat, d.lng], {
        radius: 6 + 22 * Math.sqrt(n / max),
        color: colors.ring, weight: 1.5,
        fillColor: state.filter === 'S' ? colors.S : state.filter === 'student' ? colors.student : colors.L,
        fillOpacity: 0.75,
      })
        .bindTooltip(`${code} · ${escapeHtml(d.name)} : ${plural(n, 'psychologue')}`)
        .on('click', () => goToDep(d))
        .addTo(layer);
    }
    countEl.textContent = `${plural(total, 'psychologue')} en France — zoome pour voir les adresses`;
  }

  // Vue détaillée : les adresses des départements visibles.
  function drawPlaces() {
    const view = map.getBounds().pad(0.2);
    const q = normalize(state.query.trim());
    let total = 0;
    for (const places of loaded.values()) {
      for (const place of places) {
        if (!view.contains([place.lat, place.lng])) continue;
        const people = place.people.filter((p) => FILTERS[state.filter].test(p)
          && (!q || normalize(p.name).includes(q) || normalize(p.site || '').includes(q)));
        if (!people.length) continue;
        total += people.length;

        const student = people.some(isStudentService);
        const liberal = people.filter((p) => p.mode === 'L').length;
        L.circleMarker([place.lat, place.lng], {
          radius: Math.min(16, 5 + Math.sqrt(people.length) * 2.2),
          color: student ? colors.studentRing : colors.ring,
          weight: student ? 3 : 1.5,
          fillColor: student ? colors.student : liberal >= people.length / 2 ? colors.L : colors.S,
          fillOpacity: place.approx ? 0.45 : 0.85,
        })
          .bindPopup(popupHtml(place, people), { maxHeight: 260 })
          .bindTooltip(`${plural(people.length, 'psychologue')} · ${escapeHtml(place.city)}`)
          .addTo(layer);
      }
    }
    countEl.textContent = loaded.size
      ? `${plural(total, 'psychologue')} dans cette zone${q ? ` pour « ${state.query.trim()} »` : ''}`
      : 'Chargement des adresses…';
  }

  let drawToken = 0;
  async function draw() {
    const token = ++drawToken;
    if (map.getZoom() < DETAIL_ZOOM) {
      layer.clearLayers();
      drawDeps();
      drawMe();
      return;
    }
    // Charge les départements dont l'emprise croise la vue.
    const view = map.getBounds();
    const needed = deps.filter(([, d]) => view.intersects(depBounds(d))).map(([code]) => code);
    const missing = needed.filter((c) => !loaded.has(c));
    if (missing.length) {
      countEl.textContent = 'Chargement des adresses…';
      const results = await Promise.allSettled(missing.map(loadDep));
      results.forEach((r, i) => { if (r.status === 'fulfilled') loaded.set(missing[i], r.value.places); });
      if (token !== drawToken || !el.isConnected) return; // la vue a changé entre-temps
    }
    layer.clearLayers();
    drawPlaces();
    drawMe();
  }

  function drawMe() {
    if (!state.me) return;
    L.circleMarker(state.me, { radius: 8, color: colors.ring, weight: 3, fillColor: colors.student, fillOpacity: 1 })
      .bindTooltip('Tu es ici').addTo(layer);
  }

  map.on('moveend', draw);

  // ---------- Contrôles ----------

  el.querySelector('.map-tools').onclick = (e) => {
    const chip = e.target.closest('[data-filter]');
    if (chip) {
      state.filter = chip.dataset.filter;
      el.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === chip)));
      draw();
      return;
    }
    if (e.target.closest('[data-france]')) {
      input.value = '';
      state.query = '';
      select.value = '';
      map.setView(FRANCE, FRANCE_ZOOM);
      return;
    }
    if (e.target.closest('[data-locate]')) {
      if (!navigator.geolocation) return;
      // Position utilisée uniquement dans le navigateur, jamais envoyée ni enregistrée.
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          state.me = [coords.latitude, coords.longitude];
          map.setView(state.me, 13);
        },
        () => { countEl.textContent = 'Position indisponible : cherche plutôt ta ville.'; },
        { timeout: 8000 },
      );
    }
  };

  select.onchange = () => {
    const d = index.deps[select.value];
    if (d) goToDep(d);
  };

  // Recherche : une ville connue → on y va ; sinon, filtre par nom dans la zone affichée.
  let communes = [];
  let searchTimer;
  input.oninput = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      const raw = input.value.trim();
      if (!communes.length) {
        try { communes = await loadCommunes(); } catch { /* recherche par nom seulement */ }
      }
      const exact = raw.match(/^(.*) \((\w+)\)$/); // valeur choisie dans les suggestions : « Rennes (35) »
      const q = normalize(exact ? exact[1] : raw);
      const matches = q.length >= 2
        ? communes.filter(([name, dep]) => normalize(name).startsWith(q) && (!exact || dep === exact[2]))
          .sort((a, b) => b[4] - a[4])
        : [];
      datalist.innerHTML = matches.slice(0, 8)
        .map(([name, dep, , , n]) => `<option value="${escapeHtml(name)} (${dep})">${plural(n, 'psychologue')}</option>`).join('');

      const city = matches.find(([name]) => normalize(name) === q) || (exact && matches[0]);
      if (city) {
        state.query = '';
        map.setView([city[2], city[3]], 13);
      } else {
        state.query = raw;
        if (map.getZoom() >= DETAIL_ZOOM) draw();
        else if (raw && !matches.length) countEl.textContent = 'Zoome sur une zone pour chercher un nom.';
      }
    }, 250);
  };

  draw();
  // Le conteneur peut avoir changé de taille pendant le chargement.
  setTimeout(() => map.invalidateSize(), 0);
}
