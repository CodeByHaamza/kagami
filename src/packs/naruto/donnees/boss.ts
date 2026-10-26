// Les cinq boss d'arcade (spec §9.6).
//
// Chacun enseigne une réponse du jeu :
// - Zabuza : Suiton lourd et tranchant ;
// - Kisame : Samehada draine le chakra, ce qui force à sortir le taijutsu et les armes ;
// - Deidara : l'argile explosive force l'esquive au corps ;
// - Itachi : Katon et Tsukuyomi — le « Kai ! » au Bélier devient vital ;
// - Madara : enchaîne les cinq éléments.

import type { ModeleBoss } from "../../../moteur/types";

export const BOSS = {
  zabuza: {
    id: "zabuza",
    kanji: "桃地再不斬",
    romaji: "Momochi Zabuza",
    pv: 160,
    vitesse: 0.12,
    affinite: "eau",
    cadence: 2.8,
    attaques: [
      { id: "kubikiribocho", element: "eau", duree: 2.0, degats: 22, esquivable: true },
      { id: "suiryuudanBoss", element: "eau", duree: 2.2, degats: 28, esquivable: false }
    ]
  },

  kisame: {
    id: "kisame",
    kanji: "干柿鬼鮫",
    romaji: "Hoshigaki Kisame",
    pv: 210,
    vitesse: 0.12,
    affinite: "eau",
    cadence: 2.7,
    attaques: [
      { id: "samehada", element: "eau", duree: 2.0, degats: 20, esquivable: true, draineChakra: 35 },
      { id: "requinBoss", element: "eau", duree: 2.1, degats: 28, esquivable: false, draineChakra: 20 }
    ]
  },

  deidara: {
    id: "deidara",
    kanji: "デイダラ",
    romaji: "Deidara",
    pv: 190,
    vitesse: 0.1,
    affinite: "terre",
    cadence: 2.4,
    attaques: [
      { id: "argileC1", element: "terre", duree: 1.8, degats: 24, esquivable: true },
      { id: "argileC3", element: "terre", duree: 2.3, degats: 36, esquivable: true }
    ]
  },

  itachi: {
    id: "itachi",
    kanji: "うちはイタチ",
    romaji: "Uchiha Itachi",
    pv: 230,
    vitesse: 0.14,
    affinite: "feu",
    cadence: 2.5,
    attaques: [
      { id: "illusionItachi", element: null, duree: 2.0, degats: 0, esquivable: false, genjutsu: true },
      { id: "amaterasuBoss", element: "feu", duree: 2.0, degats: 32, esquivable: true }
    ]
  },

  madara: {
    id: "madara",
    kanji: "うちはマダラ",
    romaji: "Uchiha Madara",
    pv: 320,
    vitesse: 0.14,
    affinite: "feu",
    cadence: 2.2,
    attaques: [
      { id: "katonMadara", element: "feu", duree: 1.9, degats: 30, esquivable: true },
      { id: "futonMadara", element: "vent", duree: 1.9, degats: 28, esquivable: true },
      { id: "raitonMadara", element: "foudre", duree: 1.9, degats: 30, esquivable: false },
      { id: "dotonMadara", element: "terre", duree: 2.1, degats: 34, esquivable: false },
      { id: "suitonMadara", element: "eau", duree: 1.9, degats: 28, esquivable: true }
    ]
  }
} as const satisfies Readonly<Record<string, ModeleBoss>>;

export type IdBoss = keyof typeof BOSS;
