// Les effets en cours, et le contrat qui les laisse se dessiner au bon moment.
//
// Un effet peut intervenir a quatre moments : `fond` juste apres la video (pour la
// transformer), `derriere` entre le decor et la personne, `personne` pour remplacer la
// personne detouree, `devant` par-dessus tout. C'est ce decoupage qui permet a un clone
// de passer derriere toi et a une boule de feu de passer devant.
//
// Le dictionnaire d'effets est injecte : la classe ne connait aucun anime.

import type {
  Contexte2D,
  ContexteEffet,
  Effet,
  EtatEffet,
  MomentEffet,
  Particules as InterfaceParticules
} from "../types";
import { Particules } from "./particules";

export interface EffetActif {
  nom: string;
  def: Effet;
  /** Horloge du navigateur au lancement, en millisecondes. */
  debut: number;
  /** Horloge du navigateur a laquelle l'effet s'arrete. */
  fin: number;
  etat: EtatEffet;
}

/** Le nom de l'effet joue quand une illusion est rompue. */
const EFFET_KAI = "kai";

export class Effets {
  private enCours: EffetActif[] = [];
  readonly particules: InterfaceParticules = new Particules();

  constructor(private readonly catalogue: Readonly<Record<string, Effet>>) {}

  get actifs(): readonly EffetActif[] {
    return this.enCours;
  }

  /** Lance un effet et renvoie sa definition, ou null si le nom est inconnu. */
  lancer(nom: string, e: ContexteEffet): Effet | null {
    const def = this.catalogue[nom];
    if (!def) return null;

    const effet: EffetActif = {
      nom,
      def,
      debut: e.temps,
      fin: e.temps + def.duree * 1000,
      etat: {}
    };
    def.depart?.(effet.etat, e, this.particules);
    this.enCours.push(effet);
    return def;
  }

  /** Un effet en cours a-t-il besoin de la personne detouree ? C'est un calcul de plus. */
  besoinSilhouette(): boolean {
    return this.enCours.some(a => a.def.silhouette);
  }

  genjutsuActif(): boolean {
    return this.enCours.some(a => a.def.genjutsu);
  }

  /** « Kai ! » : termine toutes les illusions en cours et joue l'effet de rupture. */
  rompreGenjutsu(e: ContexteEffet): void {
    for (const a of this.enCours) if (a.def.genjutsu) a.fin = e.temps;
    this.lancer(EFFET_KAI, e);
  }

  /**
   * Appelle le moment demande de chaque effet en cours, dans l'ordre de lancement.
   * Renvoie true si l'un d'eux a dessine la personne lui-meme.
   */
  appeler(moment: MomentEffet, ctx: Contexte2D, e: ContexteEffet): boolean {
    let dessine = false;
    for (const a of this.enCours) {
      const fonction = a.def[moment];
      if (!fonction || e.temps > a.fin) continue;

      e.t = (e.temps - a.debut) / 1000;
      ctx.save();
      if (fonction(ctx, e, a.etat, this.particules)) dessine = true;
      ctx.restore();
    }
    return dessine;
  }

  avancer(dt: number, temps: number): void {
    this.enCours = this.enCours.filter(a => temps <= a.fin);
    this.particules.avancer(dt);
  }

  dessinerParticules(ctx: Contexte2D): void {
    this.particules.dessiner(ctx);
  }
}
