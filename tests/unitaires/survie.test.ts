// Tests unitaires du générateur de vagues infinies et Boss Rush.

import { genererVagueSurvie, creerMissionSurvie } from "../../src/moteur/jeu/survie";

describe("genererVagueSurvie", () => {
  test("génère des ennemis adaptés au numéro de vague", () => {
    const vague1 = genererVagueSurvie(1);
    expect(vague1.ennemis.length).toBeGreaterThan(0);
    expect(vague1.boss).toBeUndefined();

    const vague5 = genererVagueSurvie(5);
    // Vague 5 est un palier de boss
    expect(vague5.boss).toBeDefined();
  });

  test("augmente la difficulté avec les vagues", () => {
    const v1 = genererVagueSurvie(1);
    const v10 = genererVagueSurvie(10);
    const countV1 = v1.ennemis.reduce((s, e) => s + e.nombre, 0);
    const countV10 = v10.ennemis.reduce((s, e) => s + e.nombre, 0);
    expect(countV10).toBeGreaterThanOrEqual(countV1);
  });

  test("creerMissionSurvie assemble une mission complète de 50 vagues", () => {
    const mission = creerMissionSurvie(50);
    expect(mission.id).toBe("survie");
    expect(mission.rang).toBe("S");
    expect(mission.vagues).toHaveLength(50);
    expect(mission.vagues[4]!.boss).toBe("zabuza");
  });
});
