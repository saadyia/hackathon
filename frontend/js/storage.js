// Persistance locale des saisies quotidiennes (localStorage, uniquement sur l'appareil).
// Format : { "YYYY-MM-DD": { period: true, flow: "medium", focus: 3, ... } }
// À remplacer plus tard par des appels au backend (voir docs/api.md).

import { today, toKey, addDays } from './dates.js';

const STORAGE_KEY = 'eclore.entries.v1';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

let entries = load();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Navigation privée / stockage plein : les données restent en mémoire pour la session.
  }
}

export const getAll = () => entries;
export const getEntry = (key) => entries[key];

export function setEntry(key, data) {
  entries = { ...entries, [key]: data };
  persist();
}

export function deleteEntry(key) {
  const { [key]: _removed, ...rest } = entries;
  entries = rest;
  persist();
}

export function clearAll() {
  entries = {};
  persist();
}

export const hasData = () => Object.keys(entries).length > 0;

// ---------- Données de démonstration (pour la présentation au jury) ----------

function seededRandom(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function loadDemoData() {
  const rnd = seededRandom(42);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const clamp = (v) => Math.max(1, Math.min(5, Math.round(v)));
  const flows = ['medium', 'heavy', 'heavy', 'medium', 'light'];

  // 4 cycles passés, le dernier a commencé il y a 10 jours.
  const ref = today();
  const lastStart = addDays(ref, -10);
  const starts = [lastStart];
  for (const len of [28, 30, 27]) starts.unshift(addDays(starts[0], -len));
  const periodDay = new Map();
  for (const s of starts) for (let i = 0; i < 5; i++) periodDay.set(toKey(addDays(s, i)), i);

  const demo = {};
  for (let d = starts[0]; d <= ref; d = addDays(d, 1)) {
    const key = toKey(d);
    const pDay = periodDay.get(key);
    const onPeriod = pDay !== undefined;
    if (!onPeriod && rnd() < 0.25) continue; // quelques jours non remplis, comme en vrai

    const entry = { period: onPeriod };
    if (onPeriod) {
      entry.flow = flows[pDay];
      entry.pains = pDay < 3 ? ['cramps', pick(['back', 'headache', 'bloating'])] : ['cramps'];
      entry.painLevel = Math.max(1, 7 - pDay * 2 + Math.round(rnd() * 2));
    } else {
      entry.pains = rnd() < 0.7 ? ['none'] : [pick(['headache', 'bloating', 'breasts'])];
      if (!entry.pains.includes('none')) entry.painLevel = 2 + Math.round(rnd() * 2);
    }
    const penalty = onPeriod && pDay < 3 ? 1.5 : 0;
    entry.mood = [pick(onPeriod ? ['sensitive', 'irritable', 'calm'] : ['calm', 'happy', 'happy', 'anxious'])];
    entry.energy = clamp(4 - penalty + rnd() * 1.5 - 0.5);
    entry.sleep = clamp(3 + rnd() * 2 - 0.8);
    entry.focus = clamp(4 - penalty + rnd() * 1.5 - 0.7);
    entry.productivity = clamp(entry.focus + rnd() - 0.5);
    entry.stress = clamp(2.5 + rnd() * 2);
    const weekday = d.getDay();
    entry.context = weekday === 0 || weekday === 6 ? [pick(['off', 'revision', 'job'])] : ['lecture', ...(rnd() < 0.3 ? [pick(['exam', 'deadline'])] : [])];
    entry.missedClass = onPeriod && pDay < 2 && weekday !== 0 && weekday !== 6 && rnd() < 0.4;
    demo[key] = entry;
  }
  entries = demo;
  persist();
}
