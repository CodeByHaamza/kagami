// Le bestiaire canon du pack Kata (spec §9.5).
//
// Quatre familles : les Zetsu blancs (sans affinité, la chair à canon de la Quatrième
// Guerre), les déserteurs élémentaires (un par nature, pour forcer à lire le cycle),
// l'ANBU Racine (rapide, attaque moins esquivable qui pousse à garder) et les Edo Tensei
// (qui se reforment une fois après leur première mort).

import type { ModeleEnnemi } from "../../../moteur/types";
import type { ElementNaruto } from "./elements";

function deserteur(
  id: string,
  kanji: string,
  romaji: string,
  affinite: ElementNaruto
): ModeleEnnemi {
  return {
    id,
    kanji,
    romaji,
    pv: 42,
    vitesse: 0.14,
    affinite,
    cadence: 3.4,
    attaque: {
      id: `salve_${affinite}`,
      element: affinite,
      duree: 2.1,
      degats: 14,
      esquivable: true
    }
  };
}

export const BESTIAIRE = {
  zetsu: {
    id: "zetsu",
    kanji: "白ゼツ",
    romaji: "Shiro Zetsu",
    pv: 28,
    vitesse: 0.16,
    affinite: null,
    cadence: 3.6,
    attaque: {
      id: "spore",
      element: null,
      duree: 2.2,
      degats: 10,
      esquivable: true
    }
  },

  deserteurFeu: deserteur("deserteurFeu", "抜け忍・火", "Nukenin · Katon", "feu"),
  deserteurVent: deserteur("deserteurVent", "抜け忍・風", "Nukenin · Fūton", "vent"),
  deserteurFoudre: deserteur("deserteurFoudre", "抜け忍・雷", "Nukenin · Raiton", "foudre"),
  deserteurTerre: deserteur("deserteurTerre", "抜け忍・土", "Nukenin · Doton", "terre"),
  deserteurEau: deserteur("deserteurEau", "抜け忍・水", "Nukenin · Suiton", "eau"),

  anbuRacine: {
    id: "anbuRacine",
    kanji: "根",
    romaji: "Anbu · Ne",
    pv: 52,
    vitesse: 0.24,
    affinite: "vent",
    cadence: 2.6,
    attaque: {
      id: "lame",
      element: "vent",
      duree: 1.7,
      degats: 18,
      // Une lame ANBU en groupe se pare en garde plutôt qu'elle ne s'esquive (spec §9.5).
      esquivable: false
    }
  },

  edoTensei: {
    id: "edoTensei",
    kanji: "穢土転生",
    romaji: "Shinobi · Edo Tensei",
    pv: 56,
    vitesse: 0.13,
    affinite: "terre",
    cadence: 3.2,
    seReforme: true,
    attaque: {
      id: "cendre",
      element: "terre",
      duree: 2.0,
      degats: 16,
      esquivable: true
    }
  }
} as const satisfies Readonly<Record<string, ModeleEnnemi>>;

export type IdEnnemi = keyof typeof BESTIAIRE;
