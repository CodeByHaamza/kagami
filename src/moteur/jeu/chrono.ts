// Le chronomètre d'exécution du Dojo (§10.5).
//
// Permet au joueur de choisir un jutsu, de lancer le chrono au premier signe
// ou sur commande, et de mesurer sa vitesse d'enchaînement des mudras pour battre
// ses records personnels.

export type ResultatArretChrono =
  | {
      reussi: true;
      dureeMs: number;
      estNouveauRecord: boolean;
      recordPrecedent?: number;
    }
  | {
      reussi: false;
      raison: "inactif" | "mauvaiseTechnique";
    };

export class ChronometreDojo {
  private _techniqueCibleId: string | null = null;
  private _debutMs: number | null = null;

  get actif(): boolean {
    return this._debutMs !== null && this._techniqueCibleId !== null;
  }

  get techniqueCibleId(): string | null {
    return this._techniqueCibleId;
  }

  get debut(): number | null {
    return this._debutMs;
  }

  demarrer(techniqueId: string, maintenant: number): void {
    this._techniqueCibleId = techniqueId;
    this._debutMs = maintenant;
  }

  tempsEcoule(maintenant: number): number {
    if (!this.actif || this._debutMs === null) return 0;
    return Math.max(0, maintenant - this._debutMs);
  }

  arreter(
    techniqueId: string,
    maintenant: number,
    recordsExistants: Readonly<Record<string, number>> = {}
  ): ResultatArretChrono {
    if (!this.actif || this._debutMs === null || this._techniqueCibleId === null) {
      return { reussi: false, raison: "inactif" };
    }

    if (techniqueId !== this._techniqueCibleId) {
      return { reussi: false, raison: "mauvaiseTechnique" };
    }

    const dureeMs = Math.max(0, maintenant - this._debutMs);
    const precedent = recordsExistants[techniqueId];
    const estNouveauRecord = precedent === undefined || dureeMs < precedent;

    this.reinitialiser();

    return {
      reussi: true,
      dureeMs,
      estNouveauRecord,
      recordPrecedent: precedent
    };
  }

  reinitialiser(): void {
    this._techniqueCibleId = null;
    this._debutMs = null;
  }
}
