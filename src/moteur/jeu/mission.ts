// Le déroulement d'une mission : les vagues d'ennemis, les entractes, la victoire et
// la défaite.
//
// Les ennemis d'une vague n'arrivent pas tous d'un bloc : ils entrent échelonnés, et le
// boss ferme la marche. Quand tous sont entrés et qu'il n'en reste plus un seul en vie,
// la vague est gagnée.

import type { Scene } from "../scene/scene";
import type { Mission, Vague } from "../types";
import type { Joueur } from "./joueur";

export type EtatMission = "vague" | "entracte" | "victoire" | "defaite";

export interface Apparition {
  modele: string;
  boss: boolean;
}

export interface OptionsMission {
  /** Écart entre deux entrées d'ennemis d'une même vague, en secondes de jeu. */
  ecartApparition?: number;
  /** Pause entre deux vagues, en secondes de jeu. */
  entracte?: number;
}

const ECART_PAR_DEFAUT = 1.2;
const ENTRACTE_PAR_DEFAUT = 2;

function preparerFile(vague: Vague | undefined): Apparition[] {
  if (!vague) return [];
  const file: Apparition[] = [];
  for (const lot of vague.ennemis) {
    for (let i = 0; i < lot.nombre; i++) file.push({ modele: lot.modele, boss: false });
  }
  if (vague.boss) file.push({ modele: vague.boss, boss: true });
  return file;
}

export class DeroulementMission {
  private readonly ecart: number;
  private readonly dureeEntracte: number;
  private indiceVague = 0;
  private file: Apparition[];
  private attenteApparition = 0;
  private attenteEntracte = 0;
  private courant: EtatMission = "vague";

  constructor(
    readonly mission: Mission,
    options: OptionsMission = {}
  ) {
    this.ecart = options.ecartApparition ?? ECART_PAR_DEFAUT;
    this.dureeEntracte = options.entracte ?? ENTRACTE_PAR_DEFAUT;
    this.file = preparerFile(mission.vagues[0]);
  }

  /** Numéro humain de la vague en cours (1 à `total`). */
  get vagueCourante(): number {
    return this.indiceVague + 1;
  }

  get total(): number {
    return this.mission.vagues.length;
  }

  get etat(): EtatMission {
    return this.courant;
  }

  /**
   * Rend les entités qui doivent entrer sur la scène après `dtJeu` secondes de jeu.
   */
  apparitions(dtJeu: number): Apparition[] {
    if (this.courant !== "vague" || this.file.length === 0) return [];

    this.attenteApparition -= Math.max(0, dtJeu);
    const sorties: Apparition[] = [];
    while (this.file.length > 0 && this.attenteApparition <= 0) {
      sorties.push(this.file.shift()!);
      if (this.ecart <= 0) continue;
      this.attenteApparition += this.ecart;
    }
    return sorties;
  }

  avancer(dtJeu: number, scene: Scene, joueur: Joueur): void {
    if (this.courant === "victoire" || this.courant === "defaite") return;

    if (joueur.vaincu) {
      this.courant = "defaite";
      this.file = [];
      return;
    }

    if (this.courant === "entracte") {
      this.attenteEntracte -= Math.max(0, dtJeu);
      if (this.attenteEntracte <= 0) {
        this.indiceVague++;
        this.file = preparerFile(this.mission.vagues[this.indiceVague]);
        this.attenteApparition = 0;
        this.courant = "vague";
      }
      return;
    }

    if (this.file.length === 0 && scene.vivantes().length === 0) {
      if (this.indiceVague + 1 >= this.mission.vagues.length) {
        this.courant = "victoire";
      } else {
        this.courant = "entracte";
        this.attenteEntracte = this.dureeEntracte;
      }
    }
  }
}
