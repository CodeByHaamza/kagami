// Le lecteur de posture : MediaPipe Pose Landmarker, 33 points du corps.
//
// C'est le capteur qui manquait. Le détourage ne donne qu'un masque personne / fond :
// on peut en tirer « il a bougé à gauche », pas « bras resserrés sur la poitrine ».
//
// La fabrique de modèle est injectable, comme le détecteur de signes : c'est ce qui
// permet de tester le traitement de l'échec sans télécharger 14 Mo.

import { PostureMediaPipe, REPERE } from "../../src/moteur/corps/posture";
import type { FabriqueDePose, ModelePose } from "../../src/moteur/corps/posture";

/** Un modèle factice qui rend toujours le même corps. */
const modeleFactice = (x = 0.5): ModelePose => ({
  detectForVideo: () => ({
    landmarks: [
      Array.from({ length: 33 }, (_, i) => ({ x: x + i / 1000, y: 0.4, z: 0, visibility: 0.9 }))
    ]
  })
});

const image = {} as CanvasImageSource;

test("lire renvoie null tant que le modèle n'est pas chargé", () => {
  const lecteur = new PostureMediaPipe();

  expect(lecteur.pret).toBe(false);
  expect(lecteur.lire(image, 0)).toBeNull();
});

test("lire rend 33 points, en fractions de l'image", async () => {
  // On ne multiplie pas par la largeur ici : les mesures travaillent en fractions
  // pour rester indépendantes de la résolution de la caméra.
  const lecteur = new PostureMediaPipe({ fabrique: () => Promise.resolve(modeleFactice()) });
  await lecteur.charger();

  const p = lecteur.lire(image, 1234);

  expect(p?.points).toHaveLength(33);
  expect(p?.points[0]?.x).toBeCloseTo(0.5);
  expect(p?.horodatage).toBe(1234);
  for (const point of p!.points) {
    expect(point.x).toBeGreaterThanOrEqual(0);
    expect(point.x).toBeLessThanOrEqual(1);
  }
});

test("lire rend null quand le modèle ne voit personne", async () => {
  const vide: ModelePose = { detectForVideo: () => ({ landmarks: [] }) };
  const lecteur = new PostureMediaPipe({ fabrique: () => Promise.resolve(vide) });
  await lecteur.charger();

  expect(lecteur.lire(image, 0)).toBeNull();
});

test("un échec de chargement laisse l'appli jouable, et ne se retente pas", async () => {
  // Review Focus 1 : 14 Mo. Les retélécharger à chaque jutsu qui en a besoin est le
  // défaut relevé sur le détourage au plan 1 ; on ne le refait pas.
  let tentatives = 0;
  const fabrique: FabriqueDePose = () => {
    tentatives++;
    return Promise.reject(new Error("WebGL indisponible"));
  };
  const lecteur = new PostureMediaPipe({ fabrique });

  await expect(lecteur.charger()).rejects.toThrow(/posture/i);
  expect(lecteur.pret).toBe(false);
  expect(lecteur.enEchec).toBe(true);

  // le second appel ne retente pas, et ne jette pas non plus
  await lecteur.charger();
  expect(tentatives).toBe(1);
  expect(lecteur.lire(image, 0)).toBeNull();
});

test("l'échec nomme le modèle de posture et le fichier attendu", async () => {
  const lecteur = new PostureMediaPipe({
    fabrique: () => Promise.reject(new Error("404"))
  });

  await expect(lecteur.charger()).rejects.toThrow(/pose_landmarker/);
});

test("REPERE couvre les points dont les gestes ont besoin", () => {
  const attendus = [
    "nez", "epauleG", "epauleD", "coudeG", "coudeD", "poignetG", "poignetD",
    "hancheG", "hancheD", "genouG", "genouD", "chevilleG", "chevilleD"
  ] as const satisfies readonly (keyof typeof REPERE)[];

  for (const nom of attendus) {
    expect(REPERE[nom], nom).toBeTypeOf("number");
    expect(REPERE[nom]).toBeGreaterThanOrEqual(0);
    expect(REPERE[nom]).toBeLessThanOrEqual(32);
  }
  // MediaPipe numérote 33 points : aucun repère ne doit sortir de cet intervalle.
  expect(new Set(Object.values(REPERE)).size).toBe(Object.keys(REPERE).length);
});
