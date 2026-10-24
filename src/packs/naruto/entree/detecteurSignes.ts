// La detection des signes : le modele YOLOX-Nano du projet NARUTO-HandSignDetection
// (Kazuhito Takahashi, licence MIT), execute dans le navigateur avec onnxruntime-web.
//
// doc : https://onnxruntime.ai/docs/tutorials/web/
//       https://github.com/Kazuhito00/NARUTO-HandSignDetection
//
// C'est la seule piece du pack qui touche un modele, et elle est propre a Naruto :
// 14 signes de mains, inutilisable pour un autre anime.

import * as ort from "onnxruntime-web";
import type { Detection, Image, Reconnaisseur } from "../../../moteur/entree/reconnaisseur";
import { CLASSES, type SigneNaruto } from "../donnees/signes";
import { enPlansBGR, meilleureDetection } from "./pretraitement";

/** Le modele attend une image carree de 416 x 416 pixels. */
const TAILLE = 416;

/** Le gris dont le carre est rempli avant d'y poser l'image, comme dans le projet d'origine. */
const FOND = "rgb(114, 114, 114)";

/**
 * Ce que le detecteur a besoin de savoir d'une session ONNX. L'injecter permet de
 * tester le traitement des erreurs sans charger 4 Mo de modele.
 */
export interface SessionModele {
  inputNames: readonly string[];
  outputNames: readonly string[];
  run(entrees: Record<string, ort.Tensor>): Promise<Record<string, ort.Tensor>>;
}

export type FabriqueDeSession = (url: string) => Promise<SessionModele>;

const sessionParDefaut: FabriqueDeSession = url =>
  ort.InferenceSession.create(url, { executionProviders: ["wasm"] });

export class DetecteurDeSignes implements Reconnaisseur<SigneNaruto> {
  private session: SessionModele | null = null;
  private entree = "";
  private sortie = "";
  private toile: OffscreenCanvas | HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
  private readonly donnees = new Float32Array(3 * TAILLE * TAILLE);

  constructor(private readonly fabrique: FabriqueDeSession = sessionParDefaut) {}

  get pret(): boolean {
    return this.session !== null;
  }

  async charger(url: string): Promise<void> {
    try {
      this.session = await this.fabrique(url);
    } catch (cause) {
      // Le cas courant : les modeles sont suivis par Git LFS et le clone ne les a pas
      // tires, donc le fichier fait quelques octets. L'erreur brute d'onnxruntime ne
      // dit rien de tout ca.
      throw new Error(
        `Le modèle de reconnaissance n'a pas pu être chargé depuis ${url}. ` +
          `Vérifie que le fichier existe et que « git lfs pull » a bien été lancé.`,
        { cause }
      );
    }
    this.entree = this.session.inputNames[0] ?? "images";
    this.sortie = this.session.outputNames[0] ?? "batchno_classid_score_x1y1x2y2";
    this.preparerToile();
  }

  private preparerToile(): void {
    this.toile =
      typeof OffscreenCanvas === "function"
        ? new OffscreenCanvas(TAILLE, TAILLE)
        : Object.assign(document.createElement("canvas"), { width: TAILLE, height: TAILLE });
    this.ctx = this.toile.getContext("2d", {
      willReadFrequently: true
    }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  }

  /**
   * Renvoie la meilleure detection de l'image, ou null. La boite est en pixels de la
   * source, pas du carre du modele.
   */
  async reconnaitre(
    image: Image,
    largeur: number,
    hauteur: number
  ): Promise<Detection<SigneNaruto> | null> {
    const session = this.session;
    const ctx = this.ctx;
    if (!session || !ctx) {
      throw new Error("Le modèle de reconnaissance n'est pas chargé : appelle charger() d'abord.");
    }

    // L'image reduite en haut a gauche d'un carre gris, sans la deformer.
    const ratio = Math.min(TAILLE / largeur, TAILLE / hauteur);
    ctx.fillStyle = FOND;
    ctx.fillRect(0, 0, TAILLE, TAILLE);
    ctx.drawImage(image, 0, 0, largeur * ratio, hauteur * ratio);

    const pixels = ctx.getImageData(0, 0, TAILLE, TAILLE).data;
    enPlansBGR(pixels, TAILLE * TAILLE, this.donnees);

    const tenseur = new ort.Tensor("float32", this.donnees, [1, 3, TAILLE, TAILLE]);
    const resultat = (await session.run({ [this.entree]: tenseur }))[this.sortie];
    if (!resultat) return null;

    return meilleureDetection(
      resultat.data as Float32Array,
      resultat.dims[0] ?? 0,
      ratio,
      CLASSES
    );
  }
}
