// Le cycle élémentaire et le barème des dégâts.
//
// Le moteur ne connaît ni le Feu ni l'Eau : le pack lui passe son cycle dans l'ordre
// où chaque élément bat le suivant. Un élément absent du cycle (Mokuton, non-élémentaire)
// reste neutre dans les deux sens.
//
// Toutes les valeurs chiffrées sont regroupées dans `BAREME` : ce sont des points de
// départ, réglables sans toucher au code appelant.

import type { ProfilCombat, Rang } from "../types";

export const FORT = 2;
export const FAIBLE = 0.5;

export const BAREME: Readonly<Record<Rang, { puissance: number; cout: number }>> = {
  E: { puissance: 12, cout: 8 },
  D: { puissance: 20, cout: 14 },
  C: { puissance: 32, cout: 22 },
  B: { puissance: 48, cout: 32 },
  A: { puissance: 68, cout: 45 },
  S: { puissance: 95, cout: 62 }
};

/** Pour les jutsus dont l'œuvre ne publie pas le rang : on compte les signes, plafonné sous S. */
const SANS_RANG = {
  puissanceBase: 14,
  puissanceParJeton: 4,
  puissanceMax: 78,
  coutBase: 10,
  coutParJeton: 3,
  coutMax: 52
} as const;

/**
 * Le multiplicateur élémentaire. Dans `cycle`, chaque entrée bat la suivante et la
 * dernière bat la première. Tout le reste vaut 1.
 */
export function multiplicateur(
  attaque: string | null,
  defense: string | null,
  cycle: readonly string[]
): number {
  if (!attaque || !defense || cycle.length < 2) return 1;
  const i = cycle.indexOf(attaque);
  const j = cycle.indexOf(defense);
  if (i < 0 || j < 0 || i === j) return 1;
  if ((i + 1) % cycle.length === j) return FORT;
  if ((j + 1) % cycle.length === i) return FAIBLE;
  return 1;
}

/** Les dégâts de base d'une technique, avant le cycle élémentaire et la garde. */
export function puissance(profil: ProfilCombat, nombreDeJetons: number): number {
  if (profil.rang) return BAREME[profil.rang].puissance;
  const jetons = Math.max(1, nombreDeJetons);
  return Math.min(SANS_RANG.puissanceMax, SANS_RANG.puissanceBase + jetons * SANS_RANG.puissanceParJeton);
}

/**
 * Le coût en chakra. Zéro jeton de signe signifie que la technique vient du corps
 * (taijutsu) : elle ne coûte pas de chakra, c'est précisément la réponse au chakra vide.
 */
export function coutChakra(profil: ProfilCombat, nombreDeJetons: number): number {
  if (nombreDeJetons <= 0) return 0;
  if (profil.rang) return BAREME[profil.rang].cout;
  return Math.min(SANS_RANG.coutMax, SANS_RANG.coutBase + nombreDeJetons * SANS_RANG.coutParJeton);
}
