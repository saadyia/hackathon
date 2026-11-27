// Utilitaires de dates. Les dates sont stockées sous forme de clé locale "YYYY-MM-DD"
// (jamais via toISOString(), qui passe en UTC et peut décaler d'un jour).

const DAY_MS = 86_400_000;

export const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
  'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const WEEKDAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export const WEEKDAYS_LONG = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const today = () => startOfDay(new Date());

export function toKey(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Nombre de jours entre a et b (a - b). Arrondi pour absorber les changements d'heure. */
export const diffDays = (a, b) => Math.round((startOfDay(a) - startOfDay(b)) / DAY_MS);

export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const formatLong = (d) =>
  d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

export const formatShort = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
