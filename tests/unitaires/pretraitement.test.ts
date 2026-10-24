// Les deux parties calculables du reconnaisseur YOLOX, isolees du modele.
//
// Le modele a ete entraine sur des images OpenCV : il attend trois plans separes dans
// l'ordre bleu, vert, rouge, avec des valeurs de 0 a 255 non normalisees. Se tromper
// la-dessus ne fait rien planter, ca degrade juste la reconnaissance en silence — d'ou
// ces tests.

import { enPlansBGR, meilleureDetection } from "../../src/packs/naruto/entree/pretraitement";
import { DetecteurDeSignes } from "../../src/packs/naruto/entree/detecteurSignes";
import { CLASSES } from "../../src/packs/naruto/donnees/signes";

/** Une ligne de sortie du modele : [lot, classe, score, x1, y1, x2, y2]. */
const ligne = (classe: number, score: number, boite: readonly number[]) => [
  0,
  classe,
  score,
  ...boite
];

const sortie = (...lignes: readonly (readonly number[])[]) =>
  new Float32Array(lignes.flat() as number[]);

test("enPlansBGR sépare les plans dans l'ordre bleu, vert, rouge", () => {
  // Deux pixels en RVBA : (10,20,30) et (40,50,60).
  const pixels = new Uint8ClampedArray([10, 20, 30, 255, 40, 50, 60, 255]);
  const plans = new Float32Array(3 * 2);

  enPlansBGR(pixels, 2, plans);

  expect(Array.from(plans.slice(0, 2))).toEqual([30, 60]); // bleu
  expect(Array.from(plans.slice(2, 4))).toEqual([20, 50]); // vert
  expect(Array.from(plans.slice(4, 6))).toEqual([10, 40]); // rouge
});

test("enPlansBGR ne normalise pas les valeurs", () => {
  const pixels = new Uint8ClampedArray([255, 255, 255, 255]);
  const plans = new Float32Array(3);
  enPlansBGR(pixels, 1, plans);
  expect(Array.from(plans)).toEqual([255, 255, 255]);
});

test("meilleureDetection garde la détection au meilleur score", () => {
  const donnees = sortie(
    ligne(0, 0.4, [0, 0, 10, 10]), // rat
    ligne(2, 0.9, [1, 2, 3, 4]), // tigre
    ligne(5, 0.7, [0, 0, 10, 10]) // serpent
  );
  const trouve = meilleureDetection(donnees, 3, 1, CLASSES);
  expect(trouve?.jeton).toBe("tigre");
  expect(trouve?.score).toBeCloseTo(0.9);
});

test("meilleureDetection ignore la classe 13 (Unknown)", () => {
  const donnees = sortie(
    ligne(13, 0.99, [0, 0, 10, 10]), // Unknown, le meilleur score
    ligne(2, 0.5, [0, 0, 10, 10]) // tigre
  );
  const trouve = meilleureDetection(donnees, 2, 1, CLASSES);
  expect(trouve?.jeton).toBe("tigre");
});

test("meilleureDetection remet la boîte à l'échelle de la vidéo", () => {
  // L'image a ete reduite de moitie pour entrer dans le carre du modele.
  const donnees = sortie(ligne(2, 0.9, [10, 20, 30, 40]));
  const trouve = meilleureDetection(donnees, 1, 0.5, CLASSES);
  expect(trouve?.boite).toEqual({ x1: 20, y1: 40, x2: 60, y2: 80 });
});

test("meilleureDetection renvoie null si aucune ligne n'est exploitable", () => {
  expect(meilleureDetection(sortie(), 0, 1, CLASSES)).toBeNull();
  expect(meilleureDetection(sortie(ligne(13, 0.9, [0, 0, 1, 1])), 1, 1, CLASSES)).toBeNull();
});

test("charger donne une erreur lisible si le modèle est introuvable", async () => {
  // Review Focus 2 : LFS non tire, 404 sur le .onnx. Le joueur doit comprendre, pas
  // tomber sur une erreur brute d'onnxruntime ni rester sur un chargement infini.
  const detecteur = new DetecteurDeSignes(async () => {
    throw new Error("no available backend found. ERR: [wasm] RuntimeError");
  });

  await expect(detecteur.charger("/modeles/absent.onnx")).rejects.toThrow(/modèle/i);
  expect(detecteur.pret).toBe(false);
});

test("charger expose le chemin fautif dans l'erreur", async () => {
  const detecteur = new DetecteurDeSignes(async () => {
    throw new Error("404");
  });
  await expect(detecteur.charger("/modeles/absent.onnx")).rejects.toThrow(/absent\.onnx/);
});

test("reconnaitre refuse de tourner avant le chargement", async () => {
  const detecteur = new DetecteurDeSignes(async () => {
    throw new Error("jamais appele");
  });
  await expect(detecteur.reconnaitre({} as CanvasImageSource, 640, 480)).rejects.toThrow(
    /charg/i
  );
});
