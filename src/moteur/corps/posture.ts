// Le lecteur de posture : 33 points du corps, trente fois par seconde.
//
// doc : https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
//
// C'est le capteur qui manquait au plan 1. Le détourage ne donne qu'un masque
// personne / fond : on peut en tirer « il a bougé à gauche », pas « bras resserrés sur
// la poitrine » ni « il vient de lancer un direct ». Tous les gestes en dépendent.
//
// Rien ici ne connaît d'anime : c'est l'entrée générique du moteur, et ce sera
// l'entrée principale du pack suivant, dont les techniques se jouent aux poses du
// corps plutôt qu'aux signes de mains.

import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import type { Image, Posture } from "../types";

/** Les fichiers WebAssembly de MediaPipe, recopiés dans public/ par scripts/preparer.mjs. */
const WASM = "/mediapipe/wasm";

/** Le modèle, suivi par Git LFS. La variante légère suffit et coûte 4 Mo de moins. */
const MODELES = {
  lite: "/modeles/pose_landmarker_lite.task",
  full: "/modeles/pose_landmarker_full.task"
} as const;

/**
 * Les indices des points qu'on utilise, nommés. MediaPipe les numérote de 0 à 32 ;
 * écrire `points[15]` dans le code des gestes serait illisible et fragile.
 *
 * La gauche et la droite sont celles **du modèle**, c'est-à-dire celles de la personne
 * filmée, pas celles de l'écran — l'image est en miroir.
 */
export const REPERE = {
  nez: 0,
  epauleG: 11,
  epauleD: 12,
  coudeG: 13,
  coudeD: 14,
  poignetG: 15,
  poignetD: 16,
  hancheG: 23,
  hancheD: 24,
  genouG: 25,
  genouD: 26,
  chevilleG: 27,
  chevilleD: 28
} as const satisfies Readonly<Record<string, number>>;

/** Ce qu'on utilise d'un `PoseLandmarker` ; l'injecter rend l'échec testable. */
export interface ModelePose {
  detectForVideo(
    image: Image,
    horodatage: number
  ): { landmarks: { x: number; y: number; z: number; visibility?: number }[][] };
}

export type FabriqueDePose = (variante: keyof typeof MODELES) => Promise<ModelePose>;

const fabriqueParDefaut: FabriqueDePose = async variante => {
  const fichiers = await FilesetResolver.forVisionTasks(WASM);
  const landmarker = await PoseLandmarker.createFromOptions(fichiers, {
    baseOptions: { modelAssetPath: MODELES[variante], delegate: "GPU" },
    runningMode: "VIDEO",
    numPoses: 1
  });
  // `detectForVideo` est surchargé — une forme à rappel, une forme avec options — et
  // aucune de ces surcharges n'est structurellement assignable à la forme réduite dont
  // on a besoin. On ne se sert que de la surcharge à deux arguments.
  return landmarker as unknown as ModelePose;
};

export interface OptionsPosture {
  variante?: keyof typeof MODELES;
  fabrique?: FabriqueDePose;
}

export class PostureMediaPipe {
  private modele: ModelePose | null = null;
  private echec = false;
  private readonly variante: keyof typeof MODELES;
  private readonly fabrique: FabriqueDePose;

  constructor(options: OptionsPosture = {}) {
    this.variante = options.variante ?? "lite";
    this.fabrique = options.fabrique ?? fabriqueParDefaut;
  }

  get pret(): boolean {
    return this.modele !== null;
  }

  /** Vrai après un échec de chargement : l'appli reste jouable aux signes seuls. */
  get enEchec(): boolean {
    return this.echec;
  }

  /**
   * Charge le modèle. Après un échec, **ne retente pas** : retélécharger 14 Mo à chaque
   * geste qui en aurait besoin est exactement le défaut qu'on a corrigé sur le
   * détourage.
   */
  async charger(): Promise<void> {
    if (this.modele || this.echec) return;

    try {
      this.modele = await this.fabrique(this.variante);
    } catch (cause) {
      this.echec = true;
      throw new Error(
        `Le modèle de posture n'a pas pu être chargé (${MODELES[this.variante]}). ` +
          `La reconnaissance des signes continue de fonctionner ; le taijutsu et les ` +
          `gestes du corps sont indisponibles.`,
        { cause }
      );
    }
  }

  lire(image: Image, horodatage: number): Posture | null {
    if (!this.modele) return null;

    const points = this.modele.detectForVideo(image, horodatage).landmarks[0];
    if (!points?.length) return null;

    return {
      horodatage,
      points: points.map(p => ({
        x: p.x,
        y: p.y,
        z: p.z,
        visibilite: p.visibility ?? 1
      }))
    };
  }
}
