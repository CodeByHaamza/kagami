// Générateur de vagues infinies pour le mode Survie / Boss Rush.

import type { Mission, Vague } from "../types";

export interface EtatSurvie {
  vagueActuelle: number;
  score: number;
  ennemisVaincus: number;
}

const BOSS_PALIERS = ["zabuza", "kisame", "deidara", "itachi", "madara"];

/**
 * Génère dynamiquement une vague infinie en alternant escouades et paliers de boss.
 */
export function genererVagueSurvie(numeroVague: number): Vague {
  const estBoss = numeroVague % 5 === 0;
  const indexBoss = Math.floor((numeroVague - 1) / 5) % BOSS_PALIERS.length;

  if (estBoss) {
    return {
      ennemis: [{ modele: "zetsu", nombre: Math.min(2 + Math.floor(numeroVague / 5), 6) }],
      boss: BOSS_PALIERS[indexBoss]
    };
  }

  const modeles = ["deserteurFeu", "deserteurVent", "deserteurFoudre", "deserteurTerre", "deserteurEau", "zetsu"];
  const modeleChoisi = modeles[(numeroVague - 1) % modeles.length]!;
  const nombre = Math.min(2 + Math.floor(numeroVague * 0.8), 8);

  return {
    ennemis: [{ modele: modeleChoisi, nombre }]
  };
}

/**
 * Crée une mission de survie infinie / marathon de boss.
 */
export function creerMissionSurvie(totalVagues = 50): Mission {
  const vagues: Vague[] = [];
  for (let i = 1; i <= totalVagues; i++) {
    vagues.push(genererVagueSurvie(i));
  }
  return {
    id: "survie",
    rang: "S",
    vagues
  };
}

