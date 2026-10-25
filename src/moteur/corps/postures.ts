// La machine à deux postures : concentration, combat, neutre.
//
// Le problème qu'elle résout est technique — les mains servent à la fois à former les
// signes et à frapper, donc un direct serait lu comme un signe raté. Mais elle le
// résout avec la règle de l'œuvre : former des sceaux prend du temps et laisse ouvert.
// C'est précisément pour ça que les ninjas s'interrompent mutuellement en pleine
// incantation, et le jeu hérite gratuitement de cette tension.
//
// Elle fait aussi une deuxième chose : le reconnaisseur de signes ne tourne qu'en
// concentration, ce qui libère beaucoup de temps machine pour le lecteur de posture.

import type { Posture } from "../types";
import { gardeHaute, mainsHautes, mainsRapprochees } from "./reperes";

export type Attitude = "concentration" | "combat" | "neutre";

export interface OptionsPostures {
  /** Combien de temps une posture doit tenir avant que la bascule compte, en ms. */
  tenue?: number;
  surChangement?: (avant: Attitude, apres: Attitude) => void;
}

/** Assez long pour ignorer une image isolée, assez court pour rester réactif. */
const TENUE_PAR_DEFAUT = 220;

/** Ce que la posture brute dit, avant toute temporisation. */
function lire(p: Posture | null): Attitude {
  if (!p) return "neutre";
  // La garde d'abord : mains hautes ET coudes serrés est plus spécifique que
  // mains jointes, et les deux peuvent être vraies en même temps.
  if (gardeHaute(p) || mainsHautes(p)) return "combat";
  if (mainsRapprochees(p)) return "concentration";
  return "neutre";
}

export class MachineAPostures {
  private readonly tenue: number;
  private readonly surChangement: (avant: Attitude, apres: Attitude) => void;

  private attitude: Attitude = "neutre";
  private depuisQuand = 0;
  /** La posture brute qu'on observe en ce moment, pas encore retenue. */
  private candidate: Attitude = "neutre";
  private candidateDepuis = 0;

  constructor(options: OptionsPostures = {}) {
    this.tenue = options.tenue ?? TENUE_PAR_DEFAUT;
    this.surChangement = options.surChangement ?? (() => {});
  }

  get courante(): Attitude {
    return this.attitude;
  }

  /** Depuis combien de temps la posture actuelle tient, en millisecondes. */
  get depuis(): number {
    return this.depuisQuand;
  }

  observer(p: Posture | null, maintenant: number): Attitude {
    const vue = lire(p);

    if (vue !== this.candidate) {
      this.candidate = vue;
      this.candidateDepuis = maintenant;
    }

    // La bascule ne compte que si la nouvelle posture a tenu : sans ça, une image
    // isolée interromprait un enchaînement de six signes.
    if (vue !== this.attitude && maintenant - this.candidateDepuis >= this.tenue) {
      const avant = this.attitude;
      this.attitude = vue;
      this.depuisQuand = 0;
      this.surChangement(avant, vue);
    } else if (vue === this.attitude) {
      this.depuisQuand = maintenant - this.candidateDepuis;
    }

    return this.attitude;
  }
}
