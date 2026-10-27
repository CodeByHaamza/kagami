// Les mesures du corps : ce qu'on peut dire d'une posture, en nombres.
//
// Tout est exprimé en **largeurs d'épaules**. C'est la décision qui porte tout le
// reste : un seuil écrit en fraction d'image ne vaudrait que pour une personne, à une
// distance. Divisé par la largeur des épaules, le même seuil marche pour un enfant
// comme pour un adulte, à un mètre comme à trois.
//
// Tout est pur ici — aucune horloge, aucun état. C'est ce qui rend ces fonctions
// vérifiables sur des corps synthétiques, sans caméra.

import type { Point3, Posture } from "../types";
import { REPERE } from "./posture";

/** En dessous, le modèle devine plus qu'il ne voit. */
export const VISIBILITE_MINIMALE = 0.5;

/** Les seuils, en largeurs d'épaules. À régler au banc de rejeu. */
export const SEUILS = {
  /** Distance entre les poignets au-delà de laquelle les mains ne sont plus jointes. */
  mains: 0.72,
  /** Distance poignet–nez en deçà de laquelle le poignet est « près du visage ». */
  gardeVisage: 0.7,
  /** Écart entre les coudes au-delà duquel ils ne sont plus serrés. */
  coudes: 0.9
} as const;

const point = (p: Posture, nom: keyof typeof REPERE): Point3 | undefined => p.points[REPERE[nom]];

const distance = (a: Point3, b: Point3): number => Math.hypot(a.x - b.x, a.y - b.y);

/** L'unité de référence du corps. Zéro si les épaules ne sont pas vues. */
export function largeurEpaules(p: Posture): number {
  const g = point(p, "epauleG");
  const d = point(p, "epauleD");
  return g && d ? distance(g, d) : 0;
}

/**
 * Y a-t-il assez de points visibles pour décider ? Les points du haut du corps
 * suffisent : les jambes sortent souvent du cadre sans que ça empêche de jouer.
 */
export function fiable(p: Posture, minimum = VISIBILITE_MINIMALE): boolean {
  const essentiels = ["epauleG", "epauleD", "poignetG", "poignetD"] as const;
  return essentiels.every(nom => (point(p, nom)?.visibilite ?? 0) >= minimum);
}

/** Les poignets se touchent-ils devant le corps ? */
export function mainsRapprochees(p: Posture): boolean {
  if (!fiable(p)) return false;
  const [g, d, l] = [point(p, "poignetG"), point(p, "poignetD"), largeurEpaules(p)];
  if (!g || !d || !l) return false;
  return distance(g, d) / l < SEUILS.mains;
}

/** Les deux poignets sont-ils au-dessus de la ligne des épaules (et non joints pour un signe) ? */
export function mainsHautes(p: Posture): boolean {
  if (!fiable(p)) return false;
  if (mainsRapprochees(p)) return false;
  const [pg, pd, eg, ed] = [
    point(p, "poignetG"),
    point(p, "poignetD"),
    point(p, "epauleG"),
    point(p, "epauleD")
  ];
  if (!pg || !pd || !eg || !ed) return false;
  // y croît vers le bas : « au-dessus » veut dire y plus petit.
  const ligne = (eg.y + ed.y) / 2;
  return pg.y < ligne && pd.y < ligne;
}

/**
 * La garde de boxe : les deux poignets près du visage **et** les coudes serrés. Les
 * deux conditions comptent — poignets hauts et coudes ouverts, c'est une autre pose.
 */
export function gardeHaute(p: Posture): boolean {
  if (!fiable(p)) return false;
  const l = largeurEpaules(p);
  const [pg, pd, cg, cd, nez] = [
    point(p, "poignetG"),
    point(p, "poignetD"),
    point(p, "coudeG"),
    point(p, "coudeD"),
    point(p, "nez")
  ];
  if (!pg || !pd || !cg || !cd || !nez || !l) return false;

  const presDuVisage =
    distance(pg, nez) / l < SEUILS.gardeVisage && distance(pd, nez) / l < SEUILS.gardeVisage;
  const coudesSerres = distance(cg, cd) / l < SEUILS.coudes;
  return presDuVisage && coudesSerres;
}

/**
 * À quel point le bras est tendu : 0 complètement replié, 1 complètement tendu.
 * C'est le rapport entre la distance épaule–poignet et la longueur du bras déplié.
 */
export function extensionBras(p: Posture, cote: "g" | "d"): number {
  const suffixe = cote === "g" ? "G" : "D";
  const [epaule, coude, poignet] = [
    point(p, `epaule${suffixe}` as keyof typeof REPERE),
    point(p, `coude${suffixe}` as keyof typeof REPERE),
    point(p, `poignet${suffixe}` as keyof typeof REPERE)
  ];
  if (!epaule || !coude || !poignet) return 0;

  const deplie = distance(epaule, coude) + distance(coude, poignet);
  return deplie ? Math.min(distance(epaule, poignet) / deplie, 1) : 0;
}

/** Le milieu du torse : la moyenne des épaules et des hanches. */
export function centreDeMasse(p: Posture): { x: number; y: number } {
  const noms = ["epauleG", "epauleD", "hancheG", "hancheD"] as const;
  const vus = noms.map(n => point(p, n)).filter((q): q is Point3 => q !== undefined);
  if (!vus.length) return { x: 0.5, y: 0.5 };

  return {
    x: vus.reduce((s, q) => s + q.x, 0) / vus.length,
    y: vus.reduce((s, q) => s + q.y, 0) / vus.length
  };
}

/**
 * À quel point le corps est resté immobile sur la fenêtre donnée : 1 statue, 0 agité.
 *
 * C'est ce qui portera le mode ermite — l'énergie naturelle demande une immobilité
 * parfaite, et le jeu hérite donc gratuitement d'une mécanique risquée.
 */
export function immobilite(historique: readonly Posture[]): number {
  if (historique.length < 2) return 1;

  const reference = largeurEpaules(historique[0]!) || 1;
  let total = 0;
  let mesures = 0;

  for (let i = 1; i < historique.length; i++) {
    const avant = historique[i - 1]!;
    const apres = historique[i]!;
    for (const nom of ["poignetG", "poignetD", "epauleG", "epauleD"] as const) {
      const a = point(avant, nom);
      const b = point(apres, nom);
      if (!a || !b) continue;
      total += distance(a, b) / reference;
      mesures++;
    }
  }
  if (!mesures) return 1;

  // Un dixième de largeur d'épaules de déplacement moyen suffit à dire « ça bouge ».
  return Math.max(0, 1 - (total / mesures) / 0.1);
}
