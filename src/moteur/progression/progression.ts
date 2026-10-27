// Règles de progression canoniques : passage de grade, déblocage des jutsus et des missions.
//
// Échelle de l'œuvre (§9.8) :
// Académie → Genin → Chūnin → Jōnin → Kage.
// Chaque grade ouvre les techniques du rang correspondant, et les missions associées.

import type { Grade, Progression } from "../stockage/sauvegarde";
import type { ProfilCombat, Rang } from "../types";

export const GRADES_ORDRE: readonly Grade[] = ["academie", "genin", "chunin", "jonin", "kage"];
export const gradesOrdre = GRADES_ORDRE;

/** Les rangs de jutsu accessibles par grade. */
const RANGS_PAR_GRADE: Record<Grade, readonly (Rang | null)[]> = {
  academie: ["E"],
  genin: ["E", "D", "C"],
  chunin: ["E", "D", "C", "B"],
  jonin: ["E", "D", "C", "B", "A"],
  kage: ["E", "D", "C", "B", "A", "S", null]
};

/** Les rangs de mission accessibles par grade. */
const MISSIONS_PAR_GRADE: Record<Grade, readonly Rang[]> = {
  academie: ["D"],
  genin: ["D", "C"],
  chunin: ["D", "C", "B"],
  jonin: ["D", "C", "B", "A", "S"],
  kage: ["D", "C", "B", "A", "S"]
};

/** Vérifie si une technique donnée est débloquée pour le grade du joueur. */
export function estTechniqueDisponible(
  techniqueId: string,
  grade: Grade,
  profils: Readonly<Record<string, ProfilCombat>>
): boolean {
  const profil = profils[techniqueId];
  if (!profil) return true;
  const rangsAutorises = RANGS_PAR_GRADE[grade];
  if (profil.rang === null) {
    // Les techniques sans rang officiel (dōjutsu suprêmes, ultimes de taijutsu) se débloquent avec Kage
    return rangsAutorises.includes(null);
  }
  return rangsAutorises.includes(profil.rang);
}

/** Vérifie si une mission d'arcade d'un rang donné est accessible pour le grade actuel. */
export function estMissionAccessible(missionRang: Rang, grade: Grade): boolean {
  return MISSIONS_PAR_GRADE[grade].includes(missionRang);
}

export interface StatutProgression {
  prochainGrade?: Grade;
  type: "examen" | "recommandation";
  examenId?: string;
  prerequisRempli: boolean;
}

/**
 * Analyse la progression du joueur pour déterminer le prochain palier canonique.
 * - Académie → Genin : Examen Bunshin (sans prérequis préalable).
 * - Genin → Chūnin : Avoir réussi la mission de rang C pour passer l'Examen Chūnin.
 * - Chūnin → Jōnin : Recommandation (pas d'examen dans l'œuvre) : mission de rang B + 8 jutsus maîtrisés.
 * - Jōnin → Kage : Mission de rang S réussie.
 */
export function statutProgression(
  progression: Progression,
  nombreJutsusConnus: number = 0
): StatutProgression {
  switch (progression.grade) {
    case "academie":
      return {
        prochainGrade: "genin",
        type: "examen",
        examenId: "examenGenin",
        prerequisRempli: true
      };
    case "genin":
      return {
        prochainGrade: "chunin",
        type: "examen",
        examenId: "examenChunin",
        prerequisRempli: progression.missionsReussies.includes("rangC")
      };
    case "chunin":
      return {
        prochainGrade: "jonin",
        type: "recommandation",
        prerequisRempli:
          progression.missionsReussies.includes("rangB") && nombreJutsusConnus >= 8
      };
    case "jonin":
      return {
        prochainGrade: "kage",
        type: "recommandation",
        prerequisRempli: progression.missionsReussies.includes("rangS")
      };
    case "kage":
    default:
      return {
        type: "recommandation",
        prerequisRempli: false
      };
  }
}

export const progressionSuivante = statutProgression;
