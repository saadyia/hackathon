// Point d'entrée : routage par hash et tableau de bord.

import { addDays, capitalize, diffDays, formatLong, formatShort, fromKey, toKey, today } from './dates.js';
import * as store from './storage.js';
import * as api from './api.js';
import { PHASES, getCurrentStatus, getCycleStats, getPredictions } from './cycle.js';
import { renderCalendar } from './calendar.js';
import { renderCheckin } from './checkin.js';
import { renderPsyMap } from './map.js';
import { PAGES } from './pages/index.js';

const main = document.getElementById('main');
const now = today();
const state = {
  selectedKey: toKey(now),
  viewYear: now.getFullYear(),
  viewMonth: now.getMonth(),
  analyzing: false,
  analysisError: null, // 'no_cycle' | 'offline' | 'server'
  sos: null, // résultat du dernier mode SOS (bannière + capacités prévues)
  sosLoading: false,
};

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Utilitaires ----------

let toastTimer;
function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 3200);
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
        <div class="hero-actions">
          <button type="button" class="btn btn-primary" data-action="fill-today">Remplir ma journée</button>
          <button type="button" class="btn btn-sos" data-action="sos"><span aria-hidden="true">🛟</span> Mode SOS / Journée difficile</button>
        </div>
      </div>
      <div id="status" class="status-card"></div>
    </section>
    <div class="insights">
      <section class="card capacity-card" id="capacity" aria-live="polite"></section>
      <section class="card planning-card" id="planning"></section>
    </div>
    <div class="dashboard">
      <section class="card calendar-card" id="calendar"></section>
      <section class="card checkin-card" id="checkin"></section>
    </div>
    <section class="card map-card" id="psy-map"></section>
    <footer class="dash-footer">
      <p class="muted">Tes données restent sur cet appareil : l'analyse est calculée par un serveur local (localhost). Les prédictions sont indicatives et ne remplacent ni un avis médical ni une contraception.</p>
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
    } else if (action === 'sos') {
      triggerSos();
    } else if (action === 'dismiss-sos') {
      state.sos = null;
      renderPlanning();
    } else if (action === 'task-done') {
      store.deleteTask(e.target.closest('[data-id]').dataset.id);
      toast('Bravo, une de moins ✓');
      refreshAll();
    } else if (action === 'demo') {
      if (store.hasData() && !confirm('Remplacer tes données actuelles par des données de démonstration ?')) return;
      store.loadDemoData();
      state.sos = null;
      state.analysisError = null;
      toast('Données de démo chargées');
      refreshAll();
    } else if (action === 'clear') {
      if (!confirm('Effacer définitivement toutes tes données ?')) return;
      store.clearAll();
      state.sos = null;
      state.analysisError = null;
      toast('Données effacées');
      refreshAll();
    }
  };

  refreshAll();
  // Rendue une seule fois par affichage de l'accueil (indépendante des saisies).
  renderPsyMap(document.getElementById('psy-map'));
}

function refreshAll() {
  const cycle = computeCycle();
  renderStatus(cycle);
  renderCapacity();
  renderPlanning();
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
    taskDays: new Set(store.getTasks().map((t) => t.date)),
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
      // L'analyse de capacité porte sur la journée en cours.
      if (dateKey === toKey(now)) {
        analyzeToday(data);
        document.getElementById('capacity').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    onDelete: (dateKey) => {
      if (!confirm('Effacer les réponses de cette journée ?')) return;
      store.deleteEntry(dateKey);
      toast('Journée effacée');
      refreshAll();
    },
  });
}

// ---------- Capacité cognitive (modèle Deep Learning) ----------

const RECO_ICONS = { rest: '🛌', light_review: '🗂️', standard_study: '📘', deep_work: '🚀' };

async function analyzeToday(entry) {
  const { status } = computeCycle();
  const todayKey = toKey(now);
  state.analysisError = null;
  if (!status?.cycleDay) {
    state.analysisError = 'no_cycle';
    return renderCapacity();
  }
  const { payload, missing } = api.buildPredictPayload(entry, status);
  state.analyzing = true;
  renderCapacity();
  try {
    const result = await api.predict(payload);
    store.setAnalysis(todayKey, { ...result, missing });
  } catch (err) {
    state.analysisError = err.message === 'offline' ? 'offline' : 'server';
  } finally {
    state.analyzing = false;
    renderCapacity();
  }
}

function renderCapacity() {
  const el = document.getElementById('capacity');
  if (!el) return;
  const head = `<p class="eyebrow">Capacité cognitive du jour</p>`;
  const analysis = store.getAnalysis(toKey(now));

  if (state.analyzing) {
    el.innerHTML = `${head}<div class="capacity-empty"><p class="empty-emoji" aria-hidden="true">🧠</p><p>Analyse en cours…</p></div>`;
    return;
  }
  if (state.analysisError) {
    const messages = {
      no_cycle: 'Indique tes dernières règles dans le calendrier : le modèle a besoin de ton jour de cycle.',
      offline: `Le serveur d'analyse est injoignable. Lance-le avec <code>uvicorn main:app --port 8000</code> dans <code>backend/</code>, puis réenregistre ta journée.`,
      server: "Le serveur d'analyse a renvoyé une erreur. Réessaie dans un instant.",
    };
    el.innerHTML = `${head}<div class="capacity-empty"><p class="empty-emoji" aria-hidden="true">🔌</p><p>${messages[state.analysisError]}</p></div>`;
    return;
  }
  if (!analysis) {
    el.innerHTML = `${head}
      <div class="capacity-empty">
        <p class="empty-emoji" aria-hidden="true">🧠</p>
        <p>Remplis ta journée : on estimera ta capacité de concentration et le type de révision le plus adapté.</p>
        <button type="button" class="btn btn-ghost" data-action="fill-today">Remplir ma journée</button>
      </div>`;
    return;
  }

  const pct = analysis.cognitive_capacity_percent;
  const reco = analysis.recommendation;
  el.innerHTML = `${head}
    <div class="capacity-body">
      <div class="gauge" style="--p: ${pct}" role="img" aria-label="Capacité cognitive estimée : ${pct} %">
        <span class="gauge-value">${pct}<small>%</small></span>
      </div>
      <div class="capacity-reco">
        <p class="reco-label"><span aria-hidden="true">${RECO_ICONS[reco.type] || '📚'}</span> ${escapeHtml(reco.label)}</p>
        <p>${escapeHtml(reco.advice)}</p>
      </div>
    </div>
    ${analysis.sos_recommended && !state.sos ? `
      <div class="callout">
        <p>Ta journée a l'air difficile. Tu peux alléger ton planning sans risquer tes examens.</p>
        <button type="button" class="btn btn-sos btn-small" data-action="sos">Activer le mode SOS</button>
      </div>` : ''}
    ${analysis.missing?.length ? `<p class="capacity-note muted">Valeurs neutres utilisées pour : ${analysis.missing.join(', ')}.</p>` : ''}
    <p class="capacity-note muted">Estimation indicative d'un réseau de neurones entraîné sur des données simulées.</p>`;
}

// ---------- Planning de révisions & mode SOS ----------

const DIFFICULTY = { high: 'Difficile', medium: 'Moyenne', low: 'Légère' };

function dayHeading(key, todayKey) {
  if (key < todayKey) return 'À replanifier';
  if (key === todayKey) return "Aujourd'hui";
  if (key === toKey(addDays(now, 1))) return 'Demain';
  return capitalize(formatLong(fromKey(key)));
}

function renderPlanning() {
  const el = document.getElementById('planning');
  if (!el) return;
  const todayKey = toKey(now);
  const tasks = store.getTasks().filter((t) => t.deadline >= todayKey);
  const groups = new Map();
  for (const t of tasks) {
    const k = t.date < todayKey ? 'past' : t.date;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(t);
  }

  const sos = state.sos;
  const banner = sos ? `
    <div class="sos-banner" role="status">
      <p class="sos-title"><span aria-hidden="true">🫶</span> Prends soin de toi aujourd'hui</p>
      <p>${sos.moved
        ? `${sos.moved} révision${sos.moved > 1 ? 's' : ''} replanifiée${sos.moved > 1 ? 's' : ''} sur tes prochains pics d'énergie, prédits par le modèle.`
        : "Rien à déplacer aujourd'hui : profite-en pour te reposer."}</p>
      <p><strong>Tes deadlines d'examens sont préservées</strong> : aucune révision n'a été placée après sa date limite.</p>
      ${sos.kept ? `<p class="muted">${sos.kept} tâche${sos.kept > 1 ? 's' : ''} à rendre aujourd'hui reste${sos.kept > 1 ? 'nt' : ''} en place : fais juste le minimum, c'est déjà beaucoup.</p>` : ''}
      <button type="button" class="link-btn" data-action="dismiss-sos">Fermer</button>
    </div>` : '';

  const list = tasks.length
    ? [...groups.entries()].map(([key, items]) => {
      const offset = key === 'past' ? null : diffDays(fromKey(key), now);
      const cap = sos?.capacities?.[offset];
      return `
        <li class="task-day">
          <p class="task-day-head">
            <span>${key === 'past' ? 'À replanifier' : dayHeading(key, todayKey)}</span>
            ${offset === 0 && sos ? '<span class="energy energy-rest">Repos</span>' : ''}
            ${cap !== undefined ? `<span class="energy" title="Capacité prévue par le modèle">⚡ ${cap} %</span>` : ''}
          </p>
          <ul class="task-list">
            ${items.map((t) => `
              <li class="task" data-id="${t.id}">
                <span class="diff diff-${t.difficulty}">${DIFFICULTY[t.difficulty]}</span>
                <div class="task-body">
                  <p class="task-title">${escapeHtml(t.title)}</p>
                  <p class="task-meta">📝 Échéance : ${formatShort(fromKey(t.deadline))}
                    ${t.movedFrom ? '<span class="task-moved">↪ replanifiée (SOS)</span>' : ''}</p>
                </div>
                <button type="button" class="link-btn" data-action="task-done" aria-label="Marquer « ${escapeHtml(t.title)} » comme terminée">Terminée</button>
              </li>`).join('')}
          </ul>
        </li>`;
    }).join('')
    : '<li class="muted task-empty">Aucune révision prévue. Ajoute tes prochaines sessions et leurs échéances.</li>';

  el.innerHTML = `
    <div class="planning-head">
      <div>
        <p class="eyebrow">Mon planning de révisions</p>
        <h2>À venir</h2>
      </div>
    </div>
    ${banner}
    <ul class="task-days">${list}</ul>
    <details class="task-add">
      <summary>+ Ajouter une révision</summary>
      <form class="task-form">
        <label class="field field-wide">Intitulé
          <input name="title" required maxlength="80" placeholder="Ex : Chapitre 3 — Probabilités">
        </label>
        <label class="field">Difficulté
          <select name="difficulty">
            <option value="low">Légère</option>
            <option value="medium" selected>Moyenne</option>
            <option value="high">Difficile</option>
          </select>
        </label>
        <label class="field">Prévue le
          <input type="date" name="date" required min="${todayKey}" value="${todayKey}">
        </label>
        <label class="field">Échéance (examen, rendu)
          <input type="date" name="deadline" required min="${todayKey}">
        </label>
        <button type="submit" class="btn btn-primary">Ajouter</button>
      </form>
    </details>`;

  el.querySelector('.task-form').onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const task = {
      title: f.get('title').trim(),
      difficulty: f.get('difficulty'),
      date: f.get('date'),
      deadline: f.get('deadline'),
    };
    if (!task.title) return toast('Donne un intitulé à ta révision');
    if (task.deadline < task.date) return toast("L'échéance doit être après la date prévue");
    store.addTask(task);
    toast('Révision ajoutée 📚');
    refreshAll();
  };
}

async function triggerSos() {
  if (state.sosLoading) return;
  const { status } = computeCycle();
  if (!status?.cycleDay) return toast('Indique tes dernières règles pour activer le mode SOS');

  const todayKey = toKey(now);
  const upcoming = store.getTasks().filter((t) => t.date >= todayKey && t.deadline >= todayKey);
  const payload = {
    current_cycle_day: status.cycleDay,
    tasks: upcoming.map((t) => ({
      id: t.id,
      title: t.title,
      difficulty: t.difficulty,
      scheduled_day_offset: diffDays(fromKey(t.date), now),
      deadline_offset: diffDays(fromKey(t.deadline), now),
    })),
  };

  state.sosLoading = true;
  document.querySelectorAll('[data-action="sos"]').forEach((b) => { b.disabled = true; b.setAttribute('aria-busy', 'true'); });
  try {
    const res = await api.sosRebalance(payload);
    const updates = new Map(res.updated_tasks.map((u) => [u.id, u]));
    let moved = 0;
    let kept = 0;
    const next = store.getTasks().map((t) => {
      const u = updates.get(t.id);
      if (!u) return t;
      const newDate = toKey(addDays(now, u.scheduled_day_offset));
      // Garde-fou : jamais de révision après son échéance, quoi que renvoie le serveur.
      if (newDate > t.deadline || newDate === t.date) {
        if (t.date === todayKey) kept++;
        return t;
      }
      moved++;
      return { ...t, date: newDate, movedFrom: t.date };
    });
    store.setTasks(next);
    state.sos = { moved, kept, capacities: res.future_capacities };
    toast("Mode SOS activé 🫶 Tes deadlines d'examens sont préservées");
    refreshAll();
    document.getElementById('planning').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    toast(err.message === 'offline'
      ? "Serveur d'analyse injoignable (port 8000)"
      : 'Le mode SOS a rencontré une erreur, réessaie');
  } finally {
    state.sosLoading = false;
    document.querySelectorAll('[data-action="sos"]').forEach((b) => { b.disabled = false; b.removeAttribute('aria-busy'); });
  }
}

window.addEventListener('hashchange', route);
route();
