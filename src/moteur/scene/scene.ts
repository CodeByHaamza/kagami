// La scène : les entités ennemies qui arrivent derrière la personne détourée.
//
// `x` va de 0 (gauche) à 1 (droite), `profondeur` de 0 (au fond) à 1 (au contact).
// Quatre états visuels (§9.5) — apparition, télégraphe, touché, mort — plus l'approche
// tranquille entre deux actions.

export type EtatEntite = "apparition" | "approche" | "telegraphe" | "touche" | "mort";

export interface Entite {
  id: number;
  modele: string;
  x: number;
  profondeur: number;
  vitesse: number;
  pv: number;
  pvMax: number;
  affinite: string | null;
  etat: EtatEntite;
  depuis: number;
  boss: boolean;
  /** Vrai tant qu'elle peut encore se reformer une fois après sa mort (Edo Tensei). */
  seReforme: boolean;
}

export interface OptionsEntite {
  pv: number;
  vitesse: number;
  x?: number;
  profondeur?: number;
  affinite?: string | null;
  boss?: boolean;
  seReforme?: boolean;
}

const DUREE_APPARITION = 350;
const DUREE_TOUCHE = 260;
const DUREE_MORT = 700;

export class Scene {
  private readonly liste: Entite[] = [];
  private prochainId = 1;

  get toutes(): readonly Entite[] {
    return this.liste;
  }

  vivantes(): Entite[] {
    return this.liste.filter(e => e.etat !== "mort");
  }

  ajouter(modele: string, options: OptionsEntite, maintenant: number): Entite {
    const entite: Entite = {
      id: this.prochainId++,
      modele,
      x: options.x ?? 0.5,
      profondeur: options.profondeur ?? 0,
      vitesse: options.vitesse,
      pv: options.pv,
      pvMax: options.pv,
      affinite: options.affinite ?? null,
      etat: "apparition",
      depuis: maintenant,
      boss: options.boss ?? false,
      seReforme: options.seReforme ?? false
    };
    this.liste.push(entite);
    return entite;
  }

  /**
   * Inflige des dégâts. Renvoie `true` si l'entité tombe définitivement ; une entité qui
   * se reforme consomme sa seconde vie et repart en apparition à mi-PV.
   */
  toucher(entite: Entite, degats: number, maintenant: number): boolean {
    if (entite.etat === "mort") return false;
    entite.pv = Math.max(0, entite.pv - Math.max(0, degats));

    if (entite.pv > 0) {
      entite.etat = "touche";
      entite.depuis = maintenant;
      return false;
    }

    if (entite.seReforme) {
      entite.seReforme = false;
      entite.pv = Math.max(1, Math.round(entite.pvMax / 2));
      entite.etat = "apparition";
      entite.depuis = maintenant;
      return false;
    }

    entite.etat = "mort";
    entite.depuis = maintenant;
    return true;
  }

  aPortee(profondeurMin: number): Entite[] {
    return this.vivantes().filter(e => e.profondeur >= profondeurMin);
  }

  plusProche(): Entite | null {
    let meilleure: Entite | null = null;
    for (const e of this.vivantes()) {
      if (!meilleure || e.profondeur > meilleure.profondeur) meilleure = e;
    }
    return meilleure;
  }

  avancer(dtJeu: number, maintenant: number): void {
    for (let i = this.liste.length - 1; i >= 0; i--) {
      const e = this.liste[i]!;
      const ecoule = maintenant - e.depuis;

      if (e.etat === "mort") {
        if (ecoule >= DUREE_MORT) this.liste.splice(i, 1);
        continue;
      }

      if (e.etat === "apparition" && ecoule >= DUREE_APPARITION) {
        e.etat = "approche";
        e.depuis = maintenant;
      } else if (e.etat === "touche" && ecoule >= DUREE_TOUCHE) {
        e.etat = "approche";
        e.depuis = maintenant;
      }

      if (e.etat === "approche") {
        e.profondeur = Math.min(1, e.profondeur + e.vitesse * dtJeu);
      }
    }
  }

  vider(): void {
    this.liste.length = 0;
  }
}
