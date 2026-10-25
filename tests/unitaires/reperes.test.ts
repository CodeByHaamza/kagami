// Les mesures du corps.
//
// Tout est divisé par la largeur des épaules. C'est ce qui rend un seuil valable pour
// un enfant comme pour un adulte, à un mètre comme à trois : sans cette normalisation,
// un geste réglé sur une personne ne marcherait sur aucune autre.

import {
  centreDeMasse,
  extensionBras,
  fiable,
  gardeHaute,
  immobilite,
  largeurEpaules,
  mainsHautes,
  mainsRapprochees
} from "../../src/moteur/corps/reperes";
import { REPERE } from "../../src/moteur/corps/posture";
import type { Point3, Posture } from "../../src/moteur/types";

const P = (x: number, y: number, visibilite = 0.95): Point3 => ({ x, y, z: 0, visibilite });

/** Un corps debout, bras le long du corps, épaules à 0,2 de large. */
function corps(remplacements: Partial<Record<keyof typeof REPERE, Point3>> = {}): Posture {
  const base: Record<keyof typeof REPERE, Point3> = {
    nez: P(0.5, 0.15),
    epauleG: P(0.4, 0.3),
    epauleD: P(0.6, 0.3),
    coudeG: P(0.38, 0.45),
    coudeD: P(0.62, 0.45),
    poignetG: P(0.37, 0.6),
    poignetD: P(0.63, 0.6),
    hancheG: P(0.44, 0.6),
    hancheD: P(0.56, 0.6),
    genouG: P(0.44, 0.78),
    genouD: P(0.56, 0.78),
    chevilleG: P(0.44, 0.95),
    chevilleD: P(0.56, 0.95)
  };
  const points: Point3[] = Array.from({ length: 33 }, () => P(0, 0, 0.1));
  for (const [nom, indice] of Object.entries(REPERE)) {
    points[indice] = remplacements[nom as keyof typeof REPERE] ?? base[nom as keyof typeof REPERE];
  }
  return { horodatage: 0, points };
}

/** Le même corps, mis à l'échelle autour de son centre : même pose, autre distance. */
function aLEchelle(p: Posture, facteur: number): Posture {
  return {
    ...p,
    points: p.points.map(q => ({ ...q, x: 0.5 + (q.x - 0.5) * facteur, y: 0.5 + (q.y - 0.5) * facteur }))
  };
}

test("largeurEpaules mesure la distance entre les deux épaules", () => {
  expect(largeurEpaules(corps())).toBeCloseTo(0.2);
});

test("mainsRapprochees est vrai poignets joints, faux bras écartés", () => {
  const jointes = corps({ poignetG: P(0.49, 0.42), poignetD: P(0.51, 0.42) });
  const ecartees = corps({ poignetG: P(0.15, 0.3), poignetD: P(0.85, 0.3) });

  expect(mainsRapprochees(jointes)).toBe(true);
  expect(mainsRapprochees(ecartees)).toBe(false);
});

test("mainsHautes distingue les bras levés des bras le long du corps", () => {
  const levees = corps({ poignetG: P(0.4, 0.2), poignetD: P(0.6, 0.2) });

  expect(mainsHautes(levees)).toBe(true);
  expect(mainsHautes(corps())).toBe(false);
});

test("gardeHaute exige les deux : poignets près du visage ET coudes serrés", () => {
  // C'est la garde de boxe. Poignets hauts mais coudes ouverts, c'est autre chose.
  const garde = corps({
    poignetG: P(0.46, 0.2), poignetD: P(0.54, 0.2),
    coudeG: P(0.44, 0.38), coudeD: P(0.56, 0.38)
  });
  const coudesOuverts = corps({
    poignetG: P(0.46, 0.2), poignetD: P(0.54, 0.2),
    coudeG: P(0.15, 0.3), coudeD: P(0.85, 0.3)
  });

  expect(gardeHaute(garde)).toBe(true);
  expect(gardeHaute(coudesOuverts)).toBe(false);
});

test("extensionBras vaut environ 1 bras tendu et proche de 0 bras replié", () => {
  const tendu = corps({ coudeG: P(0.25, 0.3), poignetG: P(0.1, 0.3) });
  const replie = corps({ coudeG: P(0.3, 0.45), poignetG: P(0.41, 0.31) });

  expect(extensionBras(tendu, "g")).toBeGreaterThan(0.9);
  expect(extensionBras(replie, "g")).toBeLessThan(0.5);
});

test("centreDeMasse suit le torse", () => {
  const centre = centreDeMasse(corps());
  expect(centre.x).toBeCloseTo(0.5, 1);

  const decale = centreDeMasse(
    corps({ epauleG: P(0.6, 0.3), epauleD: P(0.8, 0.3), hancheG: P(0.64, 0.6), hancheD: P(0.76, 0.6) })
  );
  expect(decale.x).toBeGreaterThan(centre.x);
});

test("immobilite vaut 1 sur des postures identiques, et tombe quand ça bouge", () => {
  const statue = [corps(), corps(), corps()];
  const agite = [corps(), corps({ poignetG: P(0.1, 0.2) }), corps({ poignetG: P(0.9, 0.7) })];

  expect(immobilite(statue)).toBeCloseTo(1);
  expect(immobilite(agite)).toBeLessThan(0.5);
});

test("fiable est faux quand les points clés sont peu visibles", () => {
  // Review Focus 2 : personne devant la caméra, ou corps à moitié hors cadre. Décider
  // sur des points inventés produirait des gestes fantômes.
  const flou = corps({
    epauleG: P(0.4, 0.3, 0.2), epauleD: P(0.6, 0.3, 0.2),
    poignetG: P(0.37, 0.6, 0.1), poignetD: P(0.63, 0.6, 0.1)
  });

  expect(fiable(corps())).toBe(true);
  expect(fiable(flou)).toBe(false);
});

test("une posture non fiable rend des mesures neutres plutôt qu'inventées", () => {
  const flou = corps({
    epauleG: P(0.4, 0.3, 0.1), epauleD: P(0.6, 0.3, 0.1),
    poignetG: P(0.5, 0.3, 0.1), poignetD: P(0.5, 0.3, 0.1)
  });

  expect(mainsRapprochees(flou)).toBe(false);
  expect(gardeHaute(flou)).toBe(false);
  expect(mainsHautes(flou)).toBe(false);
});

test("toutes les mesures sont indépendantes de la distance à la caméra", () => {
  // Le même geste, deux fois plus loin : les seuils doivent se comporter pareil.
  const garde = corps({
    poignetG: P(0.46, 0.2), poignetD: P(0.54, 0.2),
    coudeG: P(0.44, 0.38), coudeD: P(0.56, 0.38)
  });
  const loin = aLEchelle(garde, 0.5);

  expect(gardeHaute(loin)).toBe(gardeHaute(garde));
  expect(mainsRapprochees(loin)).toBe(mainsRapprochees(garde));
  expect(extensionBras(loin, "g")).toBeCloseTo(extensionBras(garde, "g"), 2);
});
