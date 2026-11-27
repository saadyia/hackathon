// Formulaire de suivi quotidien, généré à partir de questions.js.

import { SECTIONS, QUESTIONS, optionsOf, isVisible } from './questions.js';
import { capitalize, formatLong, fromKey, toKey, today } from './dates.js';

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function dayTitle(dateKey) {
  return dateKey === toKey(today()) ? "Aujourd'hui" : capitalize(formatLong(fromKey(dateKey)));
}

function renderQuestion(q) {
  const labelId = `q-${q.id}`;
  let control;

  if (q.type === 'scale') {
    control = `
      <div class="scale">
        <input type="range" id="in-${q.id}" data-scale="${q.id}" min="${q.min}" max="${q.max}" step="${q.step || 1}" value="${q.initial ?? q.min}" aria-labelledby="${labelId}">
        <output class="scale-value" data-output="${q.id}">–</output>
      </div>
      <div class="scale-labels"><span>${q.minLabel}</span><span>${q.maxLabel}</span></div>`;
  } else if (q.type === 'text') {
    control = `<textarea id="in-${q.id}" data-text="${q.id}" rows="3" placeholder="${escapeHtml(q.placeholder || '')}" aria-labelledby="${labelId}"></textarea>`;
  } else {
    const layout = q.layout === 'rating' ? 'rating' : 'chips';
    const buttons = optionsOf(q).map((opt, i) => `
      <button type="button" class="option" data-q="${q.id}" data-i="${i}" aria-pressed="false">
        ${opt.emoji ? `<span class="option-emoji" aria-hidden="true">${opt.emoji}</span>` : ''}
        <span class="option-label">${opt.label}</span>
      </button>`).join('');
    control = `<div class="${layout}" role="group" aria-labelledby="${labelId}">${buttons}</div>`;
  }

  return `
    <div class="question" data-qid="${q.id}">
      <p class="question-label" id="${labelId}">${q.label}</p>
      ${control}
    </div>`;
}

/**
 * @param {HTMLElement} el
 * @param {{dateKey: string, entry?: object, dayInfo?: string, onSave: Function, onDelete: Function}} opts
 */
export function renderCheckin(el, { dateKey, entry, dayInfo, onSave, onDelete }) {
  const title = dayTitle(dateKey);
  const isFuture = dateKey > toKey(today());

  if (isFuture) {
    el.innerHTML = `
      <header class="checkin-head">
        <p class="eyebrow">Journée sélectionnée</p>
        <h2>${title}</h2>
      </header>
      <div class="empty-state">
        <p class="empty-emoji" aria-hidden="true">🗓️</p>
        <p>Cette journée n'est pas encore arrivée : tu pourras la remplir le jour venu.</p>
        ${dayInfo ? `<p class="pill">${dayInfo}</p>` : ''}
      </div>`;
    return;
  }

  const draft = structuredClone(entry || {});

  el.innerHTML = `
    <header class="checkin-head">
      <p class="eyebrow">${entry ? 'Journée remplie ✓' : 'Mon suivi du jour'}</p>
      <h2>${title}</h2>
      <div class="progress" aria-hidden="true"><span class="progress-bar"></span></div>
      <p class="progress-text muted"></p>
    </header>
    <form class="checkin-form" novalidate>
      ${SECTIONS.map((s) => `
        <fieldset class="section">
          <legend><span aria-hidden="true">${s.icon}</span> ${s.title}</legend>
          ${s.questions.map(renderQuestion).join('')}
        </fieldset>`).join('')}
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">${entry ? 'Mettre à jour' : 'Enregistrer ma journée'}</button>
        ${entry ? '<button type="button" class="btn btn-ghost" data-action="delete">Effacer cette journée</button>' : ''}
      </div>
    </form>`;

  const form = el.querySelector('form');

  function sync() {
    let answered = 0;
    let visible = 0;
    for (const q of Object.values(QUESTIONS)) {
      const wrapper = form.querySelector(`[data-qid="${q.id}"]`);
      const shown = isVisible(q, draft);
      wrapper.hidden = !shown;
      if (!shown) continue;
      visible++;
      const value = draft[q.id];
      if (value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0)) answered++;

      if (q.type === 'scale') {
        const input = wrapper.querySelector('input');
        if (value !== undefined) input.value = value;
        wrapper.querySelector('output').textContent = value ?? '–';
      } else if (q.type === 'text') {
        const ta = wrapper.querySelector('textarea');
        if (ta.value !== (value || '')) ta.value = value || '';
      } else {
        optionsOf(q).forEach((opt, i) => {
          const selected = q.type === 'multi' ? (value || []).includes(opt.value) : value === opt.value;
          wrapper.querySelector(`[data-i="${i}"]`).setAttribute('aria-pressed', String(selected));
        });
      }
    }
    el.querySelector('.progress-bar').style.width = `${Math.round((answered / visible) * 100)}%`;
    el.querySelector('.progress-text').textContent = `${answered} / ${visible} questions remplies`;
  }

  form.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="delete"]')) return onDelete(dateKey);
    // Un clic sur un curseur pas encore touché enregistre sa valeur (ex : 0 = « aucune »).
    const range = e.target.dataset?.scale;
    if (range && draft[range] === undefined) {
      draft[range] = Number(e.target.value);
      return sync();
    }
    const btn = e.target.closest('button[data-q]');
    if (!btn) return;
    const q = QUESTIONS[btn.dataset.q];
    const value = optionsOf(q)[Number(btn.dataset.i)].value;

    if (q.type === 'multi') {
      let list = draft[q.id] || [];
      if (value === q.exclusive) list = list.includes(value) ? [] : [value];
      else {
        list = list.filter((v) => v !== q.exclusive);
        list = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      }
      if (list.length) draft[q.id] = list;
      else delete draft[q.id];
    } else if (draft[q.id] === value) {
      delete draft[q.id]; // re-cliquer désélectionne
    } else {
      draft[q.id] = value;
    }
    sync();
  });

  form.addEventListener('input', (e) => {
    if (e.target.dataset.scale) draft[e.target.dataset.scale] = Number(e.target.value);
    if (e.target.dataset.text !== undefined) {
      const v = e.target.value;
      if (v.trim()) draft[e.target.dataset.text] = v;
      else delete draft[e.target.dataset.text];
    }
    sync();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const cleaned = {};
    for (const q of Object.values(QUESTIONS)) {
      if (isVisible(q, draft) && draft[q.id] !== undefined) cleaned[q.id] = draft[q.id];
    }
    onSave(dateKey, cleaned);
  });

  sync();
}
