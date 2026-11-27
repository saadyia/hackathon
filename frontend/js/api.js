// Client de l'API Deep Learning (backend FastAPI, voir docs/api.md).
// Seul module qui fait des appels réseau. Le serveur tourne en local (localhost).

export const API_BASE = 'http://localhost:8000';
const TIMEOUT_MS = 8000;

// Phases de l'app (cycle.js) → codes attendus par le modèle.
// 0 : menstruelle, 1 : folliculaire, 2 : ovulatoire, 3 : lutéale.
const PHASE_CODES = { menstruation: 0, follicular: 1, fertile: 1, ovulation: 2, luteal: 3, late: 3 };

/** Même découpage que le backend quand la phase n'est pas connue. */
const phaseFromDay = (day) => (day <= 5 ? 0 : day <= 13 ? 1 : day <= 16 ? 2 : 3);

// Valeurs neutres utilisées quand une question n'a pas été remplie.
const NEUTRAL = {
  cramps_pain: 0, fatigue_level: 2, brain_fog: 1, mood_score: 3,
  sleep_hours: 7, sleep_quality: 3, stress_level: 2, headache_nausea: 0,
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * Traduit une saisie du check-in (codes de questions.js) en 10 critères pour /api/predict.
 * @returns {{ payload: object, missing: string[] }} `missing` = libellés des critères remplacés par une valeur neutre.
 */
export function buildPredictPayload(entry, status) {
  const missing = [];
  const pick = (field, label, compute) => {
    const v = compute();
    if (v === undefined || Number.isNaN(v)) {
      missing.push(label);
      return NEUTRAL[field];
    }
    return v;
  };
  const pains = entry.pains;

  const cycleDay = clamp(status.cycleDay, 1, 35);
  const payload = {
    cycle_day: cycleDay,
    phase: PHASE_CODES[status.phase] ?? phaseFromDay(cycleDay),
    cramps_pain: pick('cramps_pain', 'crampes', () => {
      if (!pains) return undefined;
      if (!pains.includes('cramps')) return 0;
      if (entry.crampsLevel !== undefined) return entry.crampsLevel;
      // Repli : intensité globale (1-10) ramenée sur 0-5.
      return entry.painLevel !== undefined ? Math.round(entry.painLevel / 2) : undefined;
    }),
    fatigue_level: pick('fatigue_level', 'fatigue', () => entry.fatigue),
    brain_fog: pick('brain_fog', 'brouillard mental', () => entry.brainFog),
    mood_score: pick('mood_score', 'moral', () => entry.moodScore),
    sleep_hours: pick('sleep_hours', 'heures de sommeil', () => entry.sleepHours),
    sleep_quality: pick('sleep_quality', 'qualité du sommeil', () => entry.sleep),
    // Stress saisi sur 1-5, le modèle attend 0-5.
    stress_level: pick('stress_level', 'stress', () =>
      entry.stress === undefined ? undefined : Math.round((entry.stress - 1) * 1.25)),
    headache_nausea: pick('headache_nausea', 'maux de tête / nausées', () =>
      pains ? Number(pains.includes('headache') || pains.includes('nausea')) : undefined),
  };
  return { payload, missing };
}

async function post(path, body) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new Error('offline');
  }
  if (!res.ok) throw new Error(`http_${res.status}`);
  return res.json();
}

/** → { cognitive_capacity_percent, recommendation: { type, label, advice }, sos_recommended } */
export const predict = (payload) => post('/api/predict', payload);

/** → { status, message, future_capacities: { "1": 72, … }, updated_tasks: [...] } */
export const sosRebalance = (payload) => post('/api/sos-rebalance', payload);
