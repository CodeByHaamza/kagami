// Des jetons vus par la camera jusqu'a une technique.
//
// Le reconnaisseur donne un jeton par image, avec des erreurs d'une image a l'autre.
// Un jeton n'est donc valide que s'il est vu sur plusieurs images d'affilee, puis il
// s'ajoute a l'historique. Une technique part quand l'historique se termine par son
// enchainement. Quelques techniques n'ont qu'un jeton : il faut le tenir.
//
// Ces reglages sont regles finement contre le bruit du modele : ne pas y toucher sans
// mesurer.

import type { Detection, Technique } from "../types";

export interface Reglages {
  /** En dessous, la detection est ignoree. */
  seuil: number;
  /** Nombre d'images d'affilee pour valider un jeton. */
  confirmations: number;
  /** Millisecondes sans nouveau jeton avant d'oublier l'enchainement commence. */
  oubli: number;
  /** Millisecondes pour les techniques a un seul jeton. */
  tenir: number;
  /** Millisecondes laissees pour continuer vers une technique plus longue. */
  attente: number;
}

export const REGLAGES_PAR_DEFAUT: Reglages = {
  seuil: 0.6,
  confirmations: 2,
  oubli: 4000,
  tenir: 2500,
  attente: 1500
};

/** Au-dela, l'historique ne sert plus a rien : la plus longue suite connue fait 44 jetons. */
const HISTORIQUE_MAX = 60;

export interface Progression<J extends string> {
  fait: number;
  total: number;
  prochain: J | undefined;
}

export interface TechniqueEnCours<J extends string> extends Progression<J> {
  technique: Technique<J>;
}

/**
 * Les enchainements d'une technique : le principal et l'eventuelle variante.
 * Les techniques a tenir n'en ont pas, elles ne partent pas d'un enchainement.
 */
function enchainements<J extends string>(technique: Technique<J>): readonly (readonly J[])[] {
  if (technique.tenir) return [];
  return technique.variante ? [technique.signes, technique.variante] : [technique.signes];
}

/** Combien de jetons du debut de `suite` se trouvent a la fin de `historique`. */
function avancement<J extends string>(historique: readonly J[], suite: readonly J[]): number {
  for (let n = Math.min(suite.length, historique.length); n > 0; n--) {
    const fin = historique.slice(-n);
    if (fin.every((jeton, i) => jeton === suite[i])) return n;
  }
  return 0;
}

export class Sequence<J extends string = string> {
  readonly reglages: Reglages;

  private readonly techniques: readonly Technique<J>[];
  /** Les jetons valides. */
  private jetons: J[] = [];
  /** Le jeton vu sur les dernieres images. */
  private candidat: J | null = null;
  /** Depuis combien d'images. */
  private vu = 0;
  /** Moment ou le jeton actuel a ete valide. */
  private debutTenu = 0;
  /** Moment du dernier jeton valide, en millisecondes. */
  private dernierJeton = 0;

  constructor(techniques: readonly Technique<J>[], reglages: Partial<Reglages> = {}) {
    this.techniques = techniques;
    this.reglages = { ...REGLAGES_PAR_DEFAUT, ...reglages };
  }

  get historique(): readonly J[] {
    return this.jetons;
  }

  /** Une detection du reconnaisseur, ou null ; renvoie le jeton s'il vient d'etre valide. */
  ajouter(detection: Detection<J> | null, maintenant: number): J | null {
    if (this.jetons.length && maintenant - this.dernierJeton > this.reglages.oubli) {
      this.jetons = [];
    }

    if (!detection || detection.score < this.reglages.seuil) {
      this.candidat = null;
      this.vu = 0;
      return null;
    }

    if (detection.jeton === this.candidat) this.vu++;
    else {
      this.candidat = detection.jeton;
      this.vu = 1;
    }
    if (this.vu < this.reglages.confirmations) return null;

    // tenir un jeton empeche aussi l'oubli
    this.dernierJeton = maintenant;
    if (this.vu > this.reglages.confirmations) return null; // le meme jeton, toujours tenu

    this.debutTenu = maintenant;
    if (detection.jeton === this.jetons[this.jetons.length - 1]) return null;

    this.jetons.push(detection.jeton);
    if (this.jetons.length > HISTORIQUE_MAX) this.jetons.shift();
    return detection.jeton;
  }

  vider(): void {
    this.jetons = [];
  }

  /**
   * La technique dont l'enchainement termine l'historique, la plus longue s'il y en a
   * plusieurs. `attendre` signale que ces jetons sont aussi le debut d'une technique
   * plus longue : il faut laisser au joueur le temps de continuer (le Rasengan est le
   * debut du Rasenshuriken).
   */
  techniqueTerminee(): { technique: Technique<J>; attendre: boolean } | null {
    let trouve: Technique<J> | null = null;
    let longueur = 0;

    for (const technique of this.techniques) {
      for (const suite of enchainements(technique)) {
        if (suite.length > longueur && avancement(this.jetons, suite) === suite.length) {
          trouve = technique;
          longueur = suite.length;
        }
      }
    }
    if (!trouve) return null;

    const attendre = this.techniques.some(
      autre =>
        autre !== trouve &&
        enchainements(autre).some(
          suite => suite.length > longueur && avancement(this.jetons, suite) >= longueur
        )
    );
    return { technique: trouve, attendre };
  }

  /**
   * Une technique a tenir : son jeton est le seul de l'historique et il est toujours
   * tenu. `part` va de 0 a 1 ; la technique part a 1.
   */
  jetonTenu(maintenant: number): { technique: Technique<J>; part: number } | null {
    if (
      this.jetons.length !== 1 ||
      this.candidat !== this.jetons[0] ||
      this.vu < this.reglages.confirmations
    ) {
      return null;
    }
    const technique = this.techniques.find(t => t.tenir && t.signes[0] === this.candidat);
    if (!technique) return null;
    return { technique, part: Math.min((maintenant - this.debutTenu) / this.reglages.tenir, 1) };
  }

  /** Ou en est-on d'une technique. */
  progression(technique: Technique<J>): Progression<J> {
    if (technique.tenir) return { fait: 0, total: 1, prochain: technique.signes[0] };

    let meilleur: Progression<J> = {
      fait: 0,
      total: technique.signes.length,
      prochain: technique.signes[0]
    };
    for (const suite of enchainements(technique)) {
      const fait = avancement(this.jetons, suite);
      if (fait > meilleur.fait) meilleur = { fait, total: suite.length, prochain: suite[fait] };
    }
    return meilleur;
  }

  /** Les techniques commencees, les plus avancees d'abord. */
  enCours(nombre = 3): TechniqueEnCours<J>[] {
    return this.techniques
      .filter(technique => !technique.tenir)
      .map(technique => ({ technique, ...this.progression(technique) }))
      .filter(p => p.fait > 0 && p.fait < p.total)
      .sort((a, b) => b.fait / b.total - a.fait / a.total || b.fait - a.fait)
      .slice(0, nombre);
  }
}
