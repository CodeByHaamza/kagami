// Les jetons corporels : ce que le corps dit au jeu.
//
// Chaque geste est une petite machine à trois temps : une condition d'entrée sur les
// mesures, une vitesse minimale, puis un **verrou** jusqu'au retour au repos. Le verrou
// est la pièce qui compte : sans lui, un bras laissé tendu émettrait une frappe à
// chaque image. C'est le même principe que les deux confirmations du détecteur de
// signes, et pour la même raison — le capteur est bruité, le jeu ne doit pas l'être.
//
// Le risque ici n'est pas de rater un geste, c'est d'en voir partout. Un jeu qui lance
// un taijutsu quand on se gratte est insupportable ; un jeu qui demande de refaire le
// geste ne l'est pas. Les seuils penchent donc vers le silence.

import type { Posture } from "../types";
import { centreDeMasse, extensionBras, fiable, gardeHaute, largeurEpaules } from "./reperes";
import { REPERE } from "./posture";

export type JetonCorps =
  | "directG"
  | "directD"
  | "crochet"
  | "coupDePied"
  | "lancer"
  | "rotation"
  | "garde"
  | "saut"
  | "accroupi"
  | "brasCroises"
  | "esquiveG"
  | "esquiveD";

export interface ReglagesGestes {
  /** Combien de temps on regarde en arrière pour juger d'un mouvement, en ms. */
  fenetreGeste: number;
  /** Extension de bras en deçà de laquelle on considère le bras replié. */
  extensionRepliee: number;
  /** Extension au-delà de laquelle le bras est tendu. */
  extensionTendue: number;
  /** Déplacement du torse, en largeurs d'épaules, qui vaut une esquive. */
  seuilEsquive: number;
  /** Montée des hanches, en largeurs d'épaules, qui vaut un saut. */
  seuilSaut: number;
  /** Rotation des épaules, en radians, qui vaut une rotation. */
  seuilRotation: number;
  /** Visibilité minimale des points clés. */
  visibiliteMinimale: number;
}

/**
 * Valeurs de départ, pas des mesures : elles se règlent au banc de rejeu, sur de
 * vraies sessions. `fenetreGeste` est l'horizon de tous les gestes — un mouvement
 * étalé plus longtemps n'en est pas un, c'est la vie courante.
 */
export const REGLAGES_PAR_DEFAUT: ReglagesGestes = {
  fenetreGeste: 300,
  extensionRepliee: 0.72,
  extensionTendue: 0.9,
  seuilEsquive: 0.6,
  seuilSaut: 0.35,
  seuilRotation: 0.7,
  visibiliteMinimale: 0.5
};

interface Instant {
  t: number;
  extensionG: number;
  extensionD: number;
  centre: { x: number; y: number };
  hanches: number;
  angleEpaules: number;
  poignetDHaut: boolean;
  garde: boolean;
  echelle: number;
}

const y = (p: Posture, nom: keyof typeof REPERE): number => p.points[REPERE[nom]]?.y ?? 0;

function mesurer(p: Posture): Instant {
  const eg = p.points[REPERE.epauleG];
  const ed = p.points[REPERE.epauleD];
  return {
    t: p.horodatage,
    extensionG: extensionBras(p, "g"),
    extensionD: extensionBras(p, "d"),
    centre: centreDeMasse(p),
    hanches: (y(p, "hancheG") + y(p, "hancheD")) / 2,
    angleEpaules: eg && ed ? Math.atan2(ed.y - eg.y, ed.x - eg.x) : 0,
    // le poignet droit au-dessus de l'épaule droite : l'armement d'un lancer
    poignetDHaut: y(p, "poignetD") < y(p, "epauleD"),
    garde: gardeHaute(p),
    echelle: largeurEpaules(p) || 1
  };
}

export class LecteurDeGestes {
  private readonly reglages: ReglagesGestes;
  private readonly histoire: Instant[] = [];
  /** Les gestes verrouillés : ils ne se redéclenchent pas avant un retour au repos. */
  private readonly verrous = new Set<JetonCorps>();
  private avantDernier: JetonCorps | null = null;

  constructor(reglages: Partial<ReglagesGestes> = {}) {
    this.reglages = { ...REGLAGES_PAR_DEFAUT, ...reglages };
  }

  get dernier(): JetonCorps | null {
    return this.avantDernier;
  }

  observer(p: Posture | null, maintenant: number): JetonCorps | null {
    if (!p || !fiable(p, this.reglages.visibiliteMinimale)) {
      this.histoire.length = 0;
      this.verrous.clear();
      return null;
    }

    const ici = mesurer({ ...p, horodatage: maintenant });
    this.histoire.push(ici);
    // on ne garde que la fenêtre utile, plus une image de marge
    while (this.histoire.length > 2 && this.histoire[0]!.t < maintenant - this.reglages.fenetreGeste) {
      this.histoire.shift();
    }

    const avant = this.histoire[0]!;
    if (avant === ici) return null;

    this.relacherLesVerrous(ici);

    const jeton = this.chercher(avant, ici);
    if (!jeton || this.verrous.has(jeton)) return null;

    this.verrous.add(jeton);
    this.avantDernier = jeton;
    return jeton;
  }

  /** Un geste redevient disponible quand le corps est revenu dans son état de départ. */
  private relacherLesVerrous(ici: Instant): void {
    if (ici.extensionG < this.reglages.extensionRepliee) this.verrous.delete("directG");
    if (ici.extensionD < this.reglages.extensionRepliee) {
      this.verrous.delete("directD");
      this.verrous.delete("lancer");
    }
    if (!ici.garde) this.verrous.delete("garde");
    if (Math.abs(ici.angleEpaules) < this.reglages.seuilRotation / 2) this.verrous.delete("rotation");
    for (const jeton of ["saut", "accroupi", "esquiveG", "esquiveD", "crochet", "coupDePied"] as const) {
      // ces gestes sont transitoires : leur verrou tombe dès que la fenêtre a tourné
      if (this.histoire.length <= 2) this.verrous.delete(jeton);
    }
  }

  private chercher(avant: Instant, ici: Instant): JetonCorps | null {
    const r = this.reglages;
    const echelle = ici.echelle;

    // La garde est un état, pas un mouvement : elle n'a pas de condition de vitesse.
    if (ici.garde) return "garde";

    // Un lancer est une frappe du bras droit *partie de haut* : c'est ce qui le
    // distingue d'un direct, sans rien savoir de la main.
    const detendD = ici.extensionD > r.extensionTendue && avant.extensionD < r.extensionRepliee;
    if (detendD && avant.poignetDHaut) return "lancer";
    if (detendD) return "directD";

    if (ici.extensionG > r.extensionTendue && avant.extensionG < r.extensionRepliee) return "directG";

    if (Math.abs(ici.angleEpaules - avant.angleEpaules) > r.seuilRotation) return "rotation";

    const montee = (avant.hanches - ici.hanches) / echelle;
    if (montee > r.seuilSaut) return "saut";
    if (-montee > r.seuilSaut) return "accroupi";

    const glissement = (ici.centre.x - avant.centre.x) / echelle;
    if (glissement < -r.seuilEsquive) return "esquiveG";
    if (glissement > r.seuilEsquive) return "esquiveD";

    return null;
  }
}
