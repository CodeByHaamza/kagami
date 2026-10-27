// Gestionnaire d'examens de l'Académie ninja (§9.8).
//
// Un examen est une séquence d'épreuves chronométrées, exécutées sans ennemi,
// validant l'aptitude du joueur à monter de grade (ex: Bunshin no Jutsu pour Genin).

import type { Grade } from "../stockage/sauvegarde";

export type EtatExamen = "enCours" | "reussi" | "echoue";

export interface EpreuveExamen {
  readonly id: string;
  readonly nom: string;
  readonly techniqueId: string;
  /** Temps limite pour exécuter la technique, en secondes. */
  readonly tempsMax: number;
  readonly description?: string;
}

export interface ExamenDefinition {
  readonly id: string;
  readonly nom: string;
  readonly gradeCible: Grade;
  readonly epreuves: readonly EpreuveExamen[];
}

export class SessionExamen {
  private _indice = 0;
  private _etat: EtatExamen = "enCours";
  private _tempsRestant = 0;

  constructor(readonly definition: ExamenDefinition) {
    this.reinitialiser();
  }

  get indiceEpreuve(): number {
    return this._indice;
  }

  get etat(): EtatExamen {
    return this._etat;
  }

  get tempsRestantEpreuve(): number {
    return this._tempsRestant;
  }

  get epreuveCourante(): EpreuveExamen | null {
    if (this._etat !== "enCours") return null;
    return this.definition.epreuves[this._indice] ?? null;
  }

  reinitialiser(): void {
    this._indice = 0;
    this._etat = "enCours";
    this._tempsRestant = this.definition.epreuves[0]?.tempsMax ?? 0;
  }

  avancer(dt: number): void {
    if (this._etat !== "enCours") return;
    this._tempsRestant = Math.max(0, this._tempsRestant - Math.max(0, dt));
    if (this._tempsRestant <= 0) {
      this._etat = "echoue";
    }
  }

  validerTechnique(techniqueId: string): boolean {
    if (this._etat !== "enCours") return false;
    const courante = this.epreuveCourante;
    if (!courante || courante.techniqueId !== techniqueId) return false;

    this._indice++;
    if (this._indice >= this.definition.epreuves.length) {
      this._etat = "reussi";
    } else {
      this._tempsRestant = this.definition.epreuves[this._indice]?.tempsMax ?? 0;
    }
    return true;
  }
}

