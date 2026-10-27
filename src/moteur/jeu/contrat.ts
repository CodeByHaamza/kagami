// Spécialités canoniques des contrats d'invocation en combat (§9.10) :
// - Crapauds (Mont Myōboku) : Mode Ermite — boost d'attaque sous concentration (charge).
// - Serpents (Grotte Ryūchi) : Réflexe ermite — esquive par substitution (esquive toutes les attaques).
// - Limaces (Forêt Shikkotsu) : Régénération de Katsuyu — soin passif continu de PV.
// - Chiens ninja (Ninken de Kakashi) : Pistage — anticipation accrue (durée des télégraphes allongée).

import type { Attitude } from "../corps/postures";
import type { Contrat } from "../stockage/sauvegarde";
import type { Attaque } from "../types";
import type { Joueur } from "./joueur";
import type { Telegraphe } from "./telegraphe";

export const EFFETS_CONTRAT = {
  crapauds: {
    /** Boost multiplicateur des techniques d'attaque sous concentration (senjutsu). */
    boostAttaque: 1.5
  },
  serpents: {
    /** Permet d'esquiver même les attaques réputées inesquivables grâce à la mue/substitution. */
    esquiveInesquivable: true
  },
  limaces: {
    /** Points de vie régénérés passivement par seconde. */
    regenVieParSeconde: 2.0
  },
  chiens: {
    /** Facteur d'allongement de la durée d'anticipation des télégraphes ennemis. */
    bonusAnticipation: 1.25
  }
} as const;

export interface OptionsSpecialiteContrat {
  dtReel?: number;
  attitude?: Attitude;
  actionEsquive?: boolean;
}

/** Calcule le multiplicateur de dégâts conféré par le contrat d'invocation. */
export function multiplicateurDegatsContrat(
  contrat: Contrat | null | undefined,
  attitude: Attitude
): number {
  if (contrat === "crapauds" && attitude === "charge") {
    return EFFETS_CONTRAT.crapauds.boostAttaque;
  }
  return 1;
}

/** Ajuste une attaque ennemie entrante selon les atouts du contrat (ex: anticipation du pistage ninken). */
export function ajusterAttaqueParContrat(
  contrat: Contrat | null | undefined,
  attaque: Attaque
): Attaque {
  if (contrat === "chiens") {
    return {
      ...attaque,
      duree: Math.round(attaque.duree * EFFETS_CONTRAT.chiens.bonusAnticipation * 100) / 100
    };
  }
  return attaque;
}

/** Applique les effets continus ou déclenchés de la spécialité du contrat d'invocation. */
export function appliquerSpecialiteContrat(
  contrat: Contrat | null | undefined,
  joueur: Joueur,
  telegraphes: readonly Telegraphe[],
  options: OptionsSpecialiteContrat = {}
): void {
  if (!contrat) return;

  // 1. Limaces : régénération de points de vie passive
  if (contrat === "limaces" && options.dtReel && options.dtReel > 0 && !joueur.vaincu) {
    joueur.vie = Math.min(100, joueur.vie + EFFETS_CONTRAT.limaces.regenVieParSeconde * options.dtReel);
  }

  // 2. Serpents : réflexe ermite (mue/substitution) forçant l'esquive sur action d'esquive
  if (contrat === "serpents" && options.actionEsquive) {
    for (const tel of telegraphes) {
      tel.esquiver(true);
    }
  }
}
