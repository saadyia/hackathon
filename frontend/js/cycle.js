// Calculs du cycle : regroupement des jours de règles, moyennes, prédictions.
// Méthode simple (moyenne des derniers cycles, ovulation ≈ 14 j avant les règles suivantes).
// Indicatif uniquement : ne pas utiliser comme moyen de contraception.

import { addDays, diffDays, fromKey, toKey, today } from './dates.js';

const DEFAULT_CYCLE = 28;
const DEFAULT_PERIOD = 5;
const MAX_LATE_DAYS = 14; // au-delà, on considère que la saisie a été interrompue
const avg = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;

/** Regroupe les jours "règles" consécutifs (1 jour d'oubli toléré) en périodes. */
export function getPeriods(entries) {
  const keys = Object.keys(entries).filter((k) => entries[k]?.period === true).sort();
  const periods = [];
  for (const key of keys) {
    const d = fromKey(key);
    const last = periods.at(-1);
    if (last && diffDays(d, last.end) <= 2) last.end = d;
    else periods.push({ start: d, end: d });
  }
  return periods;
}

export function getCycleStats(entries) {
  const periods = getPeriods(entries);
  const cycleLengths = [];
  for (let i = 1; i < periods.length; i++) {
    const len = diffDays(periods[i].start, periods[i - 1].start);
    if (len >= 18 && len <= 60) cycleLengths.push(len);
  }
  const recentCycles = cycleLengths.slice(-6);
  const periodLengths = periods.slice(-6).map((p) => diffDays(p.end, p.start) + 1);

  return {
    periods,
    lastPeriod: periods.at(-1) || null,
    cycleLength: recentCycles.length ? Math.round(avg(recentCycles)) : DEFAULT_CYCLE,
    periodLength: periodLengths.length
      ? Math.min(10, Math.max(2, Math.round(avg(periodLengths))))
      : DEFAULT_PERIOD,
    isPersonalized: recentCycles.length > 0,
  };
}

export function getPredictions(stats, ref = today()) {
  const periodDays = new Set();
  const fertileDays = new Set();
  const ovulationDays = new Set();
  const empty = { periodDays, fertileDays, ovulationDays, nextStart: null, daysLate: 0 };
  if (!stats.lastPeriod) return empty;

  const { cycleLength: C, periodLength: P } = stats;
  const lastStart = stats.lastPeriod.start;
  let nextStart = addDays(lastStart, C);
  let daysLate = 0;

  if (nextStart < ref) {
    const late = diffDays(ref, nextStart);
    if (late <= MAX_LATE_DAYS) {
      daysLate = late;
      nextStart = ref;
    } else {
      while (nextStart < ref) nextStart = addDays(nextStart, C);
    }
  }

  const starts = [lastStart, nextStart];
  for (let i = 0; i < 5; i++) starts.push(addDays(starts.at(-1), C));

  const refKey = toKey(ref);
  starts.forEach((start, i) => {
    if (i > 0) {
      for (let d = 0; d < P; d++) {
        const key = toKey(addDays(start, d));
        if (key >= refKey) periodDays.add(key);
      }
    }
    const next = starts[i + 1];
    if (!next) return;
    const ovulation = addDays(next, -14);
    if (diffDays(ovulation, start) < P) return; // cycle trop court pour une estimation fiable
    ovulationDays.add(toKey(ovulation));
    for (let d = -5; d <= 1; d++) fertileDays.add(toKey(addDays(ovulation, d)));
  });

  return { periodDays, fertileDays, ovulationDays, nextStart, daysLate };
}

export const PHASES = {
  menstruation: { label: 'Règles', tip: "Écoute ton corps : repos, hydratation et chaleur peuvent aider." },
  follicular: { label: 'Phase folliculaire', tip: "L'énergie a souvent tendance à remonter pendant cette phase." },
  fertile: { label: 'Fenêtre fertile (estimée)', tip: 'Estimation indicative, pas une méthode de contraception.' },
  ovulation: { label: 'Ovulation (estimée)', tip: 'Estimation indicative, pas une méthode de contraception.' },
  luteal: { label: 'Phase lutéale', tip: 'Fatigue, irritabilité ou fringales peuvent apparaître (SPM).' },
  late: { label: 'Règles en retard', tip: "Stress et fatigue peuvent décaler le cycle. Si ça dure, parles-en à un·e professionnel·le de santé." },
};

export function getCurrentStatus(stats, preds, entries, ref = today()) {
  if (!stats.lastPeriod) return null;
  const refKey = toKey(ref);
  const cycleDay = diffDays(ref, stats.lastPeriod.start) + 1;
  const stale = cycleDay > stats.cycleLength + MAX_LATE_DAYS;

  let phase;
  if (entries[refKey]?.period) phase = 'menstruation';
  else if (preds.daysLate > 0) phase = 'late';
  else if (stale) phase = null;
  else if (cycleDay <= stats.periodLength && diffDays(ref, stats.lastPeriod.end) <= 1) phase = 'menstruation';
  else if (preds.ovulationDays.has(refKey)) phase = 'ovulation';
  else if (preds.fertileDays.has(refKey)) phase = 'fertile';
  else {
    const ovulation = addDays(stats.lastPeriod.start, stats.cycleLength - 14);
    phase = ref < ovulation ? 'follicular' : 'luteal';
  }

  return {
    cycleDay: stale ? null : cycleDay,
    phase,
    stale,
    nextStart: preds.nextStart,
    daysUntilNext: preds.nextStart ? diffDays(preds.nextStart, ref) : null,
    daysLate: preds.daysLate,
  };
}
