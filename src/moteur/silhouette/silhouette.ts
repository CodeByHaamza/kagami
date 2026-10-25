// Le détourage de la personne, pour les clones, la permutation et les genjutsus.
//
// doc : https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter/web_js
//
// Le modèle « selfie segmenter » (MediaPipe, licence Apache 2.0) donne pour chaque
// pixel la probabilité qu'il appartienne à une personne.
//
// Rien ici ne connaît d'anime : c'est une brique du moteur. La bibliothèque est lourde
// (~11 Mo), donc elle n'est chargée qu'au premier effet qui en a besoin.

import { FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision";
import { toileHorsEcran } from "../rendu/particules";

/** Les fichiers WebAssembly de MediaPipe, servis depuis public/. */
const WASM = "/mediapipe/wasm";

/** Le modèle de détourage, suivi par Git LFS. */
const MODELE = "/modeles/selfie_segmenter.tflite";

export type Delegue = "GPU" | "CPU";

type Toile = OffscreenCanvas | HTMLCanvasElement;

const contexte = (toile: Toile): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D =>
  toile.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export class Silhouette {
  pret = false;
  enChargement = false;

  private segmenteur: ImageSegmenter | null = null;
  private pixels: ImageData | null = null;

  /** Le masque, en image : sa transparence est la confiance du modèle. */
  private readonly masque: Toile = toileHorsEcran(1, 1);
  /** La personne seule, sur fond transparent. */
  private readonly personne: Toile = toileHorsEcran(1, 1);
  /** Le décor sans la personne. */
  private readonly trou: Toile = toileHorsEcran(1, 1);
  /** De quoi boucher le trou qu'elle laisse. */
  private readonly bouche: Toile = toileHorsEcran(1, 1);

  /**
   * @param delegue "GPU" (plus rapide) ou "CPU" (moins de mémoire, pour les téléphones).
   *   En cas d'échec du GPU, on retombe sur le CPU plutôt que de perdre l'effet.
   */
  async charger(delegue: Delegue): Promise<void> {
    if (this.pret || this.enChargement) return;
    this.enChargement = true;

    try {
      const fichiers = await FilesetResolver.forVisionTasks(WASM);
      const options = (ou: Delegue) => ({
        baseOptions: { modelAssetPath: MODELE, delegate: ou },
        runningMode: "VIDEO" as const,
        outputCategoryMask: false,
        outputConfidenceMasks: true
      });
      try {
        this.segmenteur = await ImageSegmenter.createFromOptions(fichiers, options(delegue));
      } catch {
        this.segmenteur = await ImageSegmenter.createFromOptions(fichiers, options("CPU"));
      }
      this.pret = true;
    } finally {
      this.enChargement = false;
    }
  }

  /** Découpe la personne dans l'image actuelle de la vidéo. */
  decouper(video: HTMLVideoElement, temps: number): Toile | null {
    if (!this.segmenteur) return null;

    const resultat = this.segmenteur.segmentForVideo(video, temps);
    const masque = resultat.confidenceMasks?.[0];
    if (!masque) {
      resultat.close();
      return null;
    }
    const l = masque.width;
    const h = masque.height;
    const confiance = masque.getAsFloat32Array();

    if (this.masque.width !== l || this.masque.height !== h) {
      this.masque.width = l;
      this.masque.height = h;
      this.pixels = new ImageData(l, h);
    }
    const pixels = this.pixels!;
    for (let i = 0; i < confiance.length; i++) pixels.data[i * 4 + 3] = confiance[i]! * 255;
    contexte(this.masque).putImageData(pixels, 0, 0);
    resultat.close(); // libère la mémoire du masque

    // La personne seule : la vidéo, gardée seulement là où le masque est opaque.
    // En demi-résolution : c'est bien assez pour les effets.
    const L = Math.round(video.videoWidth / 2);
    const H = Math.round(video.videoHeight / 2);
    this.ajuster(this.personne, L, H);

    const ctx = contexte(this.personne);
    ctx.globalCompositeOperation = "copy";
    ctx.drawImage(video, 0, 0, L, H);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(this.masque, 0, 0, L, H);
    ctx.globalCompositeOperation = "source-over";
    return this.personne;
  }

  /**
   * Pour faire disparaître la personne : le décor autour d'elle, étalé par un flou pour
   * boucher le trou qu'elle laisse. À dessiner par-dessus la personne.
   */
  couverture(video: HTMLVideoElement): Toile {
    const L = 160;
    const H = Math.round((160 * video.videoHeight) / video.videoWidth);
    this.ajuster(this.trou, L, H);
    this.ajuster(this.bouche, L, H);

    const trou = contexte(this.trou);
    trou.globalCompositeOperation = "copy";
    trou.drawImage(video, 0, 0, L, H);
    trou.globalCompositeOperation = "destination-out"; // on retire la personne
    trou.drawImage(this.masque, 0, 0, L, H);

    const bouche = contexte(this.bouche);
    bouche.globalCompositeOperation = "source-over";
    bouche.clearRect(0, 0, L, H);
    bouche.filter = "blur(8px)";
    // chaque passage bouche un peu plus le trou
    for (let i = 0; i < 4; i++) bouche.drawImage(this.trou, 0, 0);
    bouche.filter = "none";
    bouche.globalCompositeOperation = "destination-in"; // on ne garde que sa forme
    bouche.drawImage(this.masque, 0, 0, L, H);
    bouche.globalCompositeOperation = "source-over";
    return this.bouche;
  }

  private ajuster(toile: Toile, l: number, h: number): void {
    if (toile.width !== l || toile.height !== h) {
      toile.width = l;
      toile.height = h;
    }
  }
}
