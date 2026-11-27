// Registre des pages secondaires. Chaque pilier vit dans son propre fichier
// pour que plusieurs personnes puissent travailler en parallèle sans conflit.
// Ajouter un pilier = créer son fichier + l'ajouter à la liste ci-dessous.

import sInformer from './s-informer.js';
import seSoigner from './se-soigner.js';
import seComprendre from './se-comprendre.js';

export const PAGES = Object.fromEntries(
  [sInformer, seSoigner, seComprendre].map((page) => [page.route, page]),
);
