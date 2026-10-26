// Le ralenti d'incantation.
//
// Entrer en posture de concentration ralentit les ennemis et les télégraphes (~×0,35),
// tandis que la détection des signes et l'interface restent en temps réel (spec §7.8).
// La transition est lissée sur quelques images : un saut brutal de vitesse ressemble à
// une saccade.

import type { Attitude } from "../corps/postures";

export interface OptionsHorloge {
  /** Le facteur en pleine concentration. 0,35 par défaut. */
  ralenti?: number;
  /** Durée de la rampe entre 1 et `ralenti`, en millisecondes. */
  transition?: number;
  /** Permet de couper le ralenti pour mesurer au banc. */
  actif?: boolean;
}

export const RALENTI_PAR_DEFAUT = 0.35;
const TRANSITION_PAR_DEFAUT = 150;

export class HorlogeDeJeu {
  private readonly ralenti: number;
  private readonly transitionS: number;
  actif: boolean;
  private courant = 1;

  constructor(options: OptionsHorloge = {}) {
    this.ralenti = options.ralenti ?? RALENTI_PAR_DEFAUT;
    this.transitionS = Math.max(0.001, (options.transition ?? TRANSITION_PAR_DEFAUT) / 1000);
    this.actif = options.actif ?? true;
  }

  get facteur(): number {
    return this.actif ? this.courant : 1;
  }

  /**
   * Transforme un pas de temps réel (en secondes) en pas de temps de jeu.
   */
  avancer(dtReel: number, attitude: Attitude): number {
    if (!this.actif) {
      this.courant = 1;
      return dtReel;
    }

    const cible = attitude === "concentration" ? this.ralenti : 1;
    const pas = ((1 - this.ralenti) * dtReel) / this.transitionS;
    if (this.courant > cible) this.courant = Math.max(cible, this.courant - pas);
    else if (this.courant < cible) this.courant = Math.min(cible, this.courant + pas);

    return dtReel * this.courant;
  }
}
