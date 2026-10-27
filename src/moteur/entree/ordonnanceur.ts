// L'ordonnanceur : qui écoute, et quand.
//
// Trois modèles ne peuvent pas tourner à pleine cadence ensemble — les signes, le
// détourage et maintenant la posture. La règle qui règle ça règle aussi autre chose :
// le reconnaisseur de signes ne tourne **qu'en posture de concentration**. Hors de
// cette posture il est en pause, ce qui libère beaucoup de temps machine, et lève
// l'ambiguïté entre un signe et un coup puisque les deux se font avec les mains.
//
// C'est aussi, et surtout, la règle de l'œuvre : former des sceaux prend du temps et
// laisse ouvert.

import type { Detection, Image, Posture } from "../types";
import type { Attitude, MachineAPostures } from "../corps/postures";

export interface PiecesOrdonnanceur<J extends string, G extends string> {
  /** L'horloge, injectable pour les tests. */
  maintenant?: () => number;
  /** Lit la posture. Prioritaire : elle porte l'esquive et la garde. */
  lirePosture: (horodatage: number) => Posture | null;
  /** Interroge le reconnaisseur de signes. Ne tourne qu'en concentration. */
  reconnaitreSigne: (horodatage: number) => Promise<Detection<J> | null>;
  /** Lit un geste à partir de la posture. Ne compte qu'en combat. */
  lireGeste: (p: Posture | null, horodatage: number) => G | null;
  machine: MachineAPostures;
  surJeton: (detection: Detection<J>) => void;
  surGeste: (geste: G) => void;
  /** Millisecondes au moins entre deux inférences de signes. */
  ecartSignes?: number;
}

/** La cadence du reconnaisseur, inchangée depuis la version d'origine. */
const ECART_SIGNES = 80;

export class Ordonnanceur<J extends string = string, G extends string = string> {
  private readonly p: Required<Pick<PiecesOrdonnanceur<J, G>, "maintenant" | "ecartSignes">> &
    PiecesOrdonnanceur<J, G>;

  private enMarche = true;
  private derniereInference = -Infinity;
  private attenteSignes = false;
  private attitude: Attitude = "neutre";

  /**
   * Appelé quand la posture bascule : l'enchaînement de signes en cours est abandonné.
   * Sans ça, lever les mains pour se défendre laisserait la grammaire à moitié pleine,
   * et un jutsu partirait tout seul en revenant à la concentration.
   */
  surViderSequence: () => void = () => {};

  constructor(pieces: PiecesOrdonnanceur<J, G>) {
    this.p = {
      ...pieces,
      maintenant: pieces.maintenant ?? (() => performance.now()),
      ecartSignes: pieces.ecartSignes ?? ECART_SIGNES
    };
  }

  get posture(): Attitude {
    return this.attitude;
  }

  get actif(): boolean {
    return this.enMarche;
  }

  demarrer(): void {
    this.enMarche = true;
  }

  arreter(): void {
    this.enMarche = false;
  }

  /** Une image : la posture d'abord, puis ce que la posture autorise. */
  async image(): Promise<void> {
    if (!this.enMarche) return;
    const t = this.p.maintenant();

    const posture = this.p.lirePosture(t);
    const avant = this.attitude;
    this.attitude = this.p.machine.observer(posture, t);

    // Toute bascule abandonne l'enchaînement en cours, dans les deux sens.
    if (this.attitude !== avant) this.surViderSequence();

    if (this.attitude === "combat") {
      const geste = this.p.lireGeste(posture, t);
      if (geste) this.p.surGeste(geste);
      return;
    }

    if (this.attitude !== "concentration") return;
    if (this.attenteSignes || t - this.derniereInference < this.p.ecartSignes) return;

    this.attenteSignes = true;
    this.derniereInference = t;
    try {
      const vue = await this.p.reconnaitreSigne(t);
      if (vue) this.p.surJeton(vue);
    } finally {
      this.attenteSignes = false;
    }
  }
}

export type { Image };
