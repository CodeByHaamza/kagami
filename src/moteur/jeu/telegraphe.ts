// Une attaque annoncée et sa résolution.
//
// L'ennemi télégraphie en temps de jeu (`dtJeu`) : si le joueur incante, l'attaque
// ralentit avec le reste, mais elle n'est jamais gelée (spec §7.8). À l'impact, quatre
// issues : esquivée, contrée, gardée, ou encaissée en plein.

import type { Entite } from "../scene/scene";
import type { Attaque } from "../types";
import type { Joueur } from "./joueur";

export type IssueTelegraphe = "esquivee" | "contree" | "gardee" | "encaissee";

export interface ResolutionTelegraphe {
  issue: IssueTelegraphe;
  degats: number;
}

export class Telegraphe {
  private ecoule = 0;
  private esquivee = false;
  private contree = false;

  constructor(
    readonly attaque: Attaque,
    readonly source: Entite
  ) {}

  get part(): number {
    if (this.attaque.duree <= 0) return 1;
    return Math.min(1, this.ecoule / this.attaque.duree);
  }

  get arrive(): boolean {
    return this.ecoule >= this.attaque.duree;
  }

  /** Vrai si la source est morte avant d'avoir pu porter son coup. */
  get annule(): boolean {
    return this.source.etat === "mort";
  }

  avancer(dtJeu: number): void {
    this.ecoule += Math.max(0, dtJeu);
  }

  esquiver(force = false): boolean {
    if (!force && !this.attaque.esquivable) return false;
    this.esquivee = true;
    return true;
  }

  contrer(): void {
    this.contree = true;
  }

  resoudre(joueur: Joueur): ResolutionTelegraphe {
    if (this.contree) return { issue: "contree", degats: 0 };
    if (this.esquivee) return { issue: "esquivee", degats: 0 };

    if (this.attaque.genjutsu) {
      if (!joueur.garde) joueur.envouter();
      return { issue: joueur.garde ? "gardee" : "encaissee", degats: 0 };
    }

    if (this.attaque.draineChakra) {
      joueur.drainer(joueur.garde ? Math.round(this.attaque.draineChakra / 2) : this.attaque.draineChakra);
    }

    const degats = joueur.encaisser(this.attaque.degats);
    return { issue: joueur.garde ? "gardee" : "encaissee", degats };
  }
}
