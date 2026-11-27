// Calendrier mensuel : jours de règles enregistrés, prédictions, fenêtre fertile, saisies, révisions.

import { MONTHS, WEEKDAYS_SHORT, addDays, toKey, today } from './dates.js';

export function renderCalendar(el, { year, month, selectedKey, entries, predictions, taskDays = new Set(), onSelect, onMonthChange }) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // semaine commençant le lundi
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7;
  const gridStart = addDays(first, -offset);
  const now = today();
  const todayKey = toKey(now);
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

  const cells = [];
  for (let i = 0; i < cellCount; i++) {
    const d = addDays(gridStart, i);
    const key = toKey(d);
    const entry = entries[key];
    const classes = ['day'];
    const labels = [d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })];

    if (d.getMonth() !== month) classes.push('is-outside');
    if (key > todayKey) classes.push('is-future');
    if (key === todayKey) { classes.push('is-today'); labels.push("aujourd'hui"); }
    if (key === selectedKey) classes.push('is-selected');

    if (entry?.period) {
      classes.push('is-period');
      labels.push('règles enregistrées');
    } else if (predictions.periodDays.has(key)) {
      classes.push('is-predicted');
      labels.push('règles prévues');
    } else if (predictions.ovulationDays.has(key)) {
      classes.push('is-ovulation');
      labels.push('ovulation estimée');
    } else if (predictions.fertileDays.has(key)) {
      classes.push('is-fertile');
      labels.push('fenêtre fertile estimée');
    }
    if (entry) { classes.push('has-entry'); labels.push('journée remplie'); }
    if (taskDays.has(key)) { classes.push('has-task'); labels.push('révision prévue'); }

    cells.push(`
      <button type="button" class="${classes.join(' ')}" data-key="${key}"
        tabindex="${key === selectedKey ? 0 : -1}"
        aria-pressed="${key === selectedKey}" aria-label="${labels.join(', ')}">
        <span class="day-num">${d.getDate()}</span>
      </button>`);
  }

  el.innerHTML = `
    <div class="cal-head">
      <button type="button" class="icon-btn" data-nav="-1" aria-label="Mois précédent">‹</button>
      <h2 id="cal-title" class="cal-title">${MONTHS[month]} ${year}</h2>
      <button type="button" class="icon-btn" data-nav="1" aria-label="Mois suivant">›</button>
    </div>
    ${isCurrentMonth ? '' : `<button type="button" class="link-btn cal-today" data-nav="today">Revenir à aujourd'hui</button>`}
    <div class="cal-weekdays" aria-hidden="true">${WEEKDAYS_SHORT.map((w) => `<span>${w}</span>`).join('')}</div>
    <div class="cal-grid" role="group" aria-labelledby="cal-title">${cells.join('')}</div>
    <ul class="legend">
      <li><span class="swatch swatch-period"></span>Règles</li>
      <li><span class="swatch swatch-predicted"></span>Règles prévues</li>
      <li><span class="swatch swatch-fertile"></span>Fenêtre fertile</li>
      <li><span class="swatch swatch-entry"></span>Journée remplie</li>
      <li><span class="swatch swatch-task"></span>Révision prévue</li>
    </ul>`;

  // Propriétés on* (et non addEventListener) : le conteneur est réutilisé à chaque rendu.
  el.onclick = (e) => {
    const nav = e.target.closest('[data-nav]');
    if (nav) {
      if (nav.dataset.nav === 'today') return onMonthChange(now.getFullYear(), now.getMonth());
      const target = new Date(year, month + Number(nav.dataset.nav), 1);
      return onMonthChange(target.getFullYear(), target.getMonth());
    }
    const day = e.target.closest('.day');
    if (day) onSelect(day.dataset.key);
  };

  // Navigation au clavier dans la grille (flèches).
  el.onkeydown = (e) => {
    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (!(e.key in moves) || !e.target.classList.contains('day')) return;
    e.preventDefault();
    const days = [...el.querySelectorAll('.day')];
    const next = days[days.indexOf(e.target) + moves[e.key]];
    if (next) {
      e.target.tabIndex = -1;
      next.tabIndex = 0;
      next.focus();
    }
  };
}
