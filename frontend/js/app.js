// Point d'entrée : routage par hash et tableau de bord.

import { capitalize, formatLong, formatShort, fromKey, toKey, today } from './dates.js';
import * as store from './storage.js';
import { PHASES, getCurrentStatus, getCycleStats, getPredictions } from './cycle.js';
import { renderCalendar } from './calendar.js';
import { renderCheckin } from './checkin.js';
import { PAGES } from './pages/index.js';

const main = document.getElementById('main');
const now = today();
const state = {
  selectedKey: toKey(now),
  viewYear: now.getFullYear(),
  viewMonth: now.getMonth(),
};

// ---------- Utilitaires ----------

let toastTimer;
function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2600);
}

function computeCycle() {
  const entries = store.getAll();
  const stats = getCycleStats(entries);
  const predictions = getPredictions(stats);
  const status = getCurrentStatus(stats, predictions, entries);
  return { entries, stats, predictions, status };
}

// ---------- Routage ----------

function route() {
  const name = location.hash.slice(1) || 'accueil';
  document.querySelectorAll('.nav a').forEach((a) => {
    if (a.dataset.route === name) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  if (PAGES[name]) renderPage(PAGES[name]);
  else renderDashboard();
  window.scrollTo(0, 0);
}

function renderPage(page) {
  main.innerHTML = `
    <section class="page">
      <p class="page-icon" aria-hidden="true">${page.icon}</p>
      <h1>${page.title}</h1>
      <p class="lead">${page.intro}</p>
      <div class="card">
        <p class="eyebrow">Bientôt disponible</p>
        <ul class="upcoming">${page.upcoming.map((u) => `<li>${u}</li>`).join('')}</ul>
      </div>
      <a class="btn btn-primary" href="#accueil">Retour au tableau de bord</a>
    </section>`;
}

// ---------- Tableau de bord ----------

function renderDashboard() {
  main.innerHTML = `
    <section class="hero">
      <div class="hero-text">
        <p class="eyebrow">${capitalize(formatLong(now))}</p>
        <h1>Bonjour 👋</h1>
        <p class="lead">Comment s'est passée ta journée ? Quelques questions suffisent pour mieux comprendre ton corps et ton rythme d'études.</p>
        <button type="button" class="btn btn-primary" data-action="fill-today">Remplir ma journée</button>
      </div>
      <div id="status" class="status-card"></div>
    </section>
    <div class="dashboard">
      <section class="card calendar-card" id="calendar"></section>
      <section class="card checkin-card" id="checkin"></section>
    </div>
    <footer class="dash-footer">
      <p class="muted">Tes données restent sur cet appareil. Les prédictions sont indicatives et ne remplacent ni un avis médical ni une contraception.</p>
      <div class="footer-actions">
        <button type="button" class="link-btn" data-action="demo">Charger des données de démo</button>
        <button type="button" class="link-btn" data-action="clear">Effacer toutes mes données</button>
      </div>
    </footer>`;

  main.onclick = (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'fill-today') {
      selectDay(toKey(now));
      document.getElementById('checkin').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (action === 'demo') {
      if (store.hasData() && !confirm('Remplacer tes données actuelles par des données de démonstration ?')) return;
      store.loadDemoData();
      toast('Données de démo chargées');
      refreshAll();
    } else if (action === 'clear') {
      if (!confirm('Effacer définitivement toutes tes données ?')) return;
      store.clearAll();
      toast('Données effacées');
      refreshAll();
    }
  };

  refreshAll();
}

function refreshAll() {
  const cycle = computeCycle();
  renderStatus(cycle);
  renderCal(cycle);
  renderCheckinPanel(cycle);
}

function selectDay(key) {
  const d = fromKey(key);
  state.selectedKey = key;
  state.viewYear = d.getFullYear();
  state.viewMonth = d.getMonth();
  const cycle = computeCycle();
  renderCal(cycle);
  renderCheckinPanel(cycle);
}

function renderStatus({ status, stats }) {
  const el = document.getElementById('status');
  if (!status) {
    el.innerHTML = `
      <p class="status-kicker">Mon cycle</p>
      <p class="status-big">🌱</p>
      <p class="status-phase">Bienvenue !</p>
      <p class="muted">Indique tes dernières règles dans le calendrier pour activer les prévisions.</p>`;
    return;
  }

  const phase = status.phase ? PHASES[status.phase] : null;
  let next = '';
  if (status.daysLate > 0) next = `Retard de <strong>${status.daysLate} j</strong>`;
  else if (status.daysUntilNext === 0) next = "Règles prévues <strong>aujourd'hui</strong>";
  else if (status.daysUntilNext > 0) {
    next = `Prochaines règles dans <strong>${status.daysUntilNext} j</strong><br><span class="muted">vers le ${formatShort(status.nextStart)}</span>`;
  }

  el.innerHTML = `
    <p class="status-kicker">Mon cycle</p>
    ${status.cycleDay
      ? `<p class="status-big"><span class="status-day">${status.cycleDay}</span><span class="status-unit">e jour</span></p>`
      : '<p class="status-big">🔄</p>'}
    <p class="status-phase">${phase ? phase.label : 'Pas de saisie récente'}</p>
    <p class="status-next">${next}</p>
    ${phase ? `<p class="status-tip">${phase.tip}</p>` : '<p class="status-tip">Mets à jour tes dernières règles pour des prévisions fiables.</p>'}
    <p class="status-meta muted">Cycle ${stats.isPersonalized ? 'moyen' : 'par défaut'} : ${stats.cycleLength} j · Règles : ${stats.periodLength} j</p>`;
}

function renderCal({ entries, predictions }) {
  renderCalendar(document.getElementById('calendar'), {
    year: state.viewYear,
    month: state.viewMonth,
    selectedKey: state.selectedKey,
    entries,
    predictions,
    onSelect: (key) => {
      selectDay(key);
      if (window.matchMedia('(max-width: 959px)').matches) {
        document.getElementById('checkin').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    onMonthChange: (y, m) => {
      state.viewYear = y;
      state.viewMonth = m;
      renderCal(computeCycle());
    },
  });
}

function renderCheckinPanel({ entries, predictions }) {
  const key = state.selectedKey;
  let dayInfo = '';
  if (predictions.periodDays.has(key)) dayInfo = '🩸 Règles prévues ce jour-là';
  else if (predictions.ovulationDays.has(key)) dayInfo = '🥚 Ovulation estimée';
  else if (predictions.fertileDays.has(key)) dayInfo = '🌿 Fenêtre fertile estimée';

  renderCheckin(document.getElementById('checkin'), {
    dateKey: key,
    entry: entries[key],
    dayInfo,
    onSave: (dateKey, data) => {
      if (Object.keys(data).length === 0) return toast('Réponds à au moins une question 🙂');
      store.setEntry(dateKey, data);
      toast('Journée enregistrée ✨');
      refreshAll();
    },
    onDelete: (dateKey) => {
      if (!confirm('Effacer les réponses de cette journée ?')) return;
      store.deleteEntry(dateKey);
      toast('Journée effacée');
      refreshAll();
    },
  });
}

window.addEventListener('hashchange', route);
route();
