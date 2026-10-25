// Les armes : shuriken, kunai, parchemin explosif.
//
// Elles reglent un probleme de jeu reel. Sans elles, jauge de chakra vide, le joueur
// reste plante a regarder les ennemis arriver. Elles sont donc **gratuites** : c'est
// leur raison d'etre, et c'est canon — le lancer est la base enseignee a l'Academie.
//
// Les trois partent du meme geste de lancer : un seul mouvement de bras existe dans la
// nature, et pretendre distinguer un shuriken d'un kunai a la trajectoire du poignet
// serait inventer. C'est l'arme **selectionnee** qui part.

import type { JetonCorps } from "../../../moteur/corps/gestes";

/** Combien de parchemins on emporte par mission. */
export const PARCHEMIN_PAR_MISSION = 5;

export interface Arme {
  id: string;
  kanji: string;
  romaji: string;
  jeton: JetonCorps;
  /** En chakra. Zero pour toutes : c'est le point. */
  cout: number;
  degats: number;
  /** null : illimite. Un nombre : le stock emporte par mission. */
  stock: number | null;
  effet: string;
}

export const ARMES: readonly Arme[] = [
  {
    id: "shuriken",
    kanji: "手裏剣",
    romaji: "Shuriken",
    jeton: "lancer",
    cout: 0,
    degats: 6,
    stock: null,
    effet: "shurikenLance"
  },
  {
    id: "kunai",
    kanji: "苦無",
    romaji: "Kunai",
    jeton: "lancer",
    cout: 0,
    degats: 11,
    stock: null,
    effet: "kunaiLance"
  },
  {
    // Le combo canon : le parchemin se colle au kunai, et explose a l'impact.
    id: "parcheminExplosif",
    kanji: "起爆札",
    romaji: "Kibaku Fuda",
    jeton: "lancer",
    cout: 0,
    degats: 34,
    stock: PARCHEMIN_PAR_MISSION,
    effet: "parcheminExplosif"
  }
];
