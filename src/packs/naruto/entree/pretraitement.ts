// Ce que le modele YOLOX attend en entree, et comment lire ce qu'il renvoie.
//
// Ces deux fonctions sont pures : elles se testent sans charger les 4 Mo du modele,
// et ce sont elles qui portent les conventions faciles a casser en silence.

import type { Detection } from "../../../moteur/types";

/**
 * Convertit des pixels RVBA entrelaces en trois plans separes bleu, vert, rouge.
 *
 * Le modele a ete entraine avec des images OpenCV : il attend cet ordre-la, et des
 * valeurs de 0 a 255 **non normalisees**. Inverser les plans ne fait rien planter,
 * ca degrade juste la reconnaissance sans prevenir.
 *
 * @param pixels  les donnees RVBA de getImageData
 * @param n       le nombre de pixels (largeur x hauteur)
 * @param sortie  le tableau a remplir, de taille 3 * n ; reutilise d'une image a l'autre
 */
export function enPlansBGR(pixels: Uint8ClampedArray, n: number, sortie: Float32Array): void {
  for (let i = 0; i < n; i++) {
    sortie[i] = pixels[i * 4 + 2]!; // bleu
    sortie[n + i] = pixels[i * 4 + 1]!; // vert
    sortie[2 * n + i] = pixels[i * 4]!; // rouge
  }
}

/** Le nombre de valeurs par ligne de sortie : [lot, classe, score, x1, y1, x2, y2]. */
const PAR_LIGNE = 7;

/**
 * Garde la meilleure detection parmi les lignes renvoyees par le modele, et remet sa
 * boite a l'echelle de la video.
 *
 * @param donnees  la sortie brute du modele
 * @param lignes   le nombre de detections
 * @param ratio    le facteur de reduction applique a l'image avant l'inference
 * @param classes  l'ordre des classes du modele ; une entree nulle n'est pas un jeton
 */
export function meilleureDetection<J extends string>(
  donnees: Float32Array,
  lignes: number,
  ratio: number,
  classes: readonly (J | null)[]
): Detection<J> | null {
  let meilleure: Detection<J> | null = null;

  for (let i = 0; i < lignes; i++) {
    const d = i * PAR_LIGNE;
    const jeton = classes[donnees[d + 1]!];
    const score = donnees[d + 2]!;
    if (!jeton || (meilleure && score <= meilleure.score)) continue;

    meilleure = {
      jeton,
      score,
      boite: {
        x1: donnees[d + 3]! / ratio,
        y1: donnees[d + 4]! / ratio,
        x2: donnees[d + 5]! / ratio,
        y2: donnees[d + 6]! / ratio
      }
    };
  }
  return meilleure;
}
