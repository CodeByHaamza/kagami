// Métronome et système de score pour le mode défi rythmique au Dojo.

export type JugementRythme = "parfait" | "bien" | "rate";

export interface ResultatFrappe {
  jugement: JugementRythme;
  ecartMs: number;
}

export class MetronomeRythme {
  readonly intervalleMs: number;
  readonly debutMs: number;

  constructor(public readonly bpm: number, debutMs = 0) {
    this.intervalleMs = Math.round(60000 / bpm);
    this.debutMs = debutMs;
  }

  /**
   * Retourne le timestamp du prochain battement suivant ou égal au temps donné.
   */
  prochainBattement(tempsMs: number): number {
    if (tempsMs <= this.debutMs) return this.debutMs;
    const ecoule = tempsMs - this.debutMs;
    const battementIndex = Math.ceil(ecoule / this.intervalleMs);
    return this.debutMs + battementIndex * this.intervalleMs;
  }

  /**
   * Retourne le timestamp du battement le plus proche du temps donné.
   */
  battementLePlusProche(tempsMs: number): number {
    if (tempsMs <= this.debutMs) return this.debutMs;
    const ecoule = tempsMs - this.debutMs;
    const battementIndex = Math.round(ecoule / this.intervalleMs);
    return this.debutMs + battementIndex * this.intervalleMs;
  }
}

/**
 * Évalue la précision d'une exécution de signe par rapport au métronome.
 * Tolérances canoniques :
 * - <= 80 ms : "parfait" (+100 pts)
 * - <= 220 ms : "bien" (+50 pts)
 * - au-delà : "rate" (combo brisé)
 */
export function evaluerFrappeRythme(metronome: MetronomeRythme, tempsMs: number): ResultatFrappe {
  const battementCible = metronome.battementLePlusProche(tempsMs);
  const ecartMs = Math.abs(tempsMs - battementCible);

  let jugement: JugementRythme;
  if (ecartMs <= 80) {
    jugement = "parfait";
  } else if (ecartMs <= 220) {
    jugement = "bien";
  } else {
    jugement = "rate";
  }

  return { jugement, ecartMs };
}

export interface ScoreRythme {
  points: number;
  combo: number;
  comboMax: number;
  parfaits: number;
  biens: number;
  rates: number;
}

export function creerScoreRythme(): ScoreRythme {
  return { points: 0, combo: 0, comboMax: 0, parfaits: 0, biens: 0, rates: 0 };
}

export function enregistrerFrappe(score: ScoreRythme, resultat: ResultatFrappe): void {
  if (resultat.jugement === "parfait") {
    score.parfaits++;
    score.combo++;
    score.points += 100 * Math.min(score.combo, 4);
  } else if (resultat.jugement === "bien") {
    score.biens++;
    score.combo++;
    score.points += 50 * Math.min(score.combo, 2);
  } else {
    score.rates++;
    score.combo = 0;
  }
  if (score.combo > score.comboMax) {
    score.comboMax = score.combo;
  }
}

