// Les règles de progression canoniques et les déblocages par grade.

import {
  GRADES_ORDRE,
  estMissionAccessible,
  estTechniqueDisponible,
  statutProgression
} from "../../src/moteur/progression/progression";
import type { Grade, Progression } from "../../src/moteur/stockage/sauvegarde";
import type { ProfilCombat, Rang } from "../../src/moteur/types";

const profilsFactices: Record<string, ProfilCombat> = {
  bunshin: { rang: "E", element: null, role: "utilitaire" },
  goukakyu: { rang: "C", element: "feu", role: "attaque" },
  shunshin: { rang: "D", element: null, role: "utilitaire" },
  karyuuendan: { rang: "B", element: "feu", role: "attaque" },
  chidori: { rang: "A", element: "foudre", role: "attaque" },
  kirin: { rang: "S", element: "foudre", role: "attaque" },
  hachimon: { rang: null, element: null, role: "attaque" }
};

describe("GRADES_ORDRE", () => {
  test("respecte la hiérarchie de l'œuvre", () => {
    expect(GRADES_ORDRE).toEqual(["academie", "genin", "chunin", "jonin", "kage"]);
  });
});

describe("estTechniqueDisponible", () => {
  test("à l'Académie, seuls les rangs E sont disponibles", () => {
    expect(estTechniqueDisponible("bunshin", "academie", profilsFactices)).toBe(true);
    expect(estTechniqueDisponible("goukakyu", "academie", profilsFactices)).toBe(false);
    expect(estTechniqueDisponible("chidori", "academie", profilsFactices)).toBe(false);
  });

  test("Genin ouvre les rangs D et C", () => {
    expect(estTechniqueDisponible("shunshin", "genin", profilsFactices)).toBe(true);
    expect(estTechniqueDisponible("goukakyu", "genin", profilsFactices)).toBe(true);
    expect(estTechniqueDisponible("karyuuendan", "genin", profilsFactices)).toBe(false);
  });

  test("Chūnin ouvre le rang B", () => {
    expect(estTechniqueDisponible("karyuuendan", "chunin", profilsFactices)).toBe(true);
    expect(estTechniqueDisponible("chidori", "chunin", profilsFactices)).toBe(false);
  });

  test("Jōnin ouvre le rang A", () => {
    expect(estTechniqueDisponible("chidori", "jonin", profilsFactices)).toBe(true);
    expect(estTechniqueDisponible("kirin", "jonin", profilsFactices)).toBe(false);
  });

  test("Kage ouvre le rang S et les ultimes", () => {
    expect(estTechniqueDisponible("kirin", "kage", profilsFactices)).toBe(true);
    expect(estTechniqueDisponible("hachimon", "kage", profilsFactices)).toBe(true);
  });
});

describe("estMissionAccessible", () => {
  test("l'Académie a accès à la patrouille de rang D", () => {
    expect(estMissionAccessible("D", "academie")).toBe(true);
    expect(estMissionAccessible("C", "academie")).toBe(false);
  });

  test("Genin ouvre les missions de rang C", () => {
    expect(estMissionAccessible("C", "genin")).toBe(true);
    expect(estMissionAccessible("B", "genin")).toBe(false);
  });

  test("Chūnin ouvre les missions de rang B", () => {
    expect(estMissionAccessible("B", "chunin")).toBe(true);
    expect(estMissionAccessible("A", "chunin")).toBe(false);
  });

  test("Jōnin ouvre les missions de rang A et S", () => {
    expect(estMissionAccessible("A", "jonin")).toBe(true);
    expect(estMissionAccessible("S", "jonin")).toBe(true);
  });
});

describe("statutProgression", () => {
  const pBase: Progression = {
    grade: "academie",
    missionsReussies: [],
    examensPasses: [],
    recordsDojo: {}
  };

  test("un élève d'Académie peut passer l'examen Genin dès le départ", () => {
    const s = statutProgression(pBase, 2);
    expect(s.prochainGrade).toBe("genin");
    expect(s.type).toBe("examen");
    expect(s.examenId).toBe("examenGenin");
    expect(s.prerequisRempli).toBe(true);
  });

  test("un Genin doit réussir la mission de rang C pour passer l'examen Chūnin", () => {
    const genin: Progression = { ...pBase, grade: "genin" };
    expect(statutProgression(genin, 5).prerequisRempli).toBe(false);

    const pret: Progression = { ...pBase, grade: "genin", missionsReussies: ["rangC"] };
    const s = statutProgression(pret, 5);
    expect(s.prochainGrade).toBe("chunin");
    expect(s.type).toBe("examen");
    expect(s.examenId).toBe("examenChunin");
    expect(s.prerequisRempli).toBe(true);
  });

  test("un Chūnin monte à Jōnin par recommandation (mission rang B + jutsus maîtrisés)", () => {
    const chunin: Progression = { ...pBase, grade: "chunin", missionsReussies: ["rangC"] };
    expect(statutProgression(chunin, 4).prerequisRempli).toBe(false);

    const avecMission: Progression = { ...chunin, missionsReussies: ["rangC", "rangB"] };
    // Pas assez de jutsus découverts (< 8)
    expect(statutProgression(avecMission, 6).prerequisRempli).toBe(false);

    // Recommandé avec 8 jutsus et rang B
    const promu = statutProgression(avecMission, 8);
    expect(promu.prochainGrade).toBe("jonin");
    expect(promu.type).toBe("recommandation");
    expect(promu.prerequisRempli).toBe(true);
  });

  test("un Jōnin monte à Kage en réussissant la mission de rang S", () => {
    const jonin: Progression = { ...pBase, grade: "jonin" };
    expect(statutProgression(jonin, 20).prerequisRempli).toBe(false);

    const vainqueur: Progression = { ...jonin, missionsReussies: ["rangS"] };
    const s = statutProgression(vainqueur, 20);
    expect(s.prochainGrade).toBe("kage");
    expect(s.type).toBe("recommandation");
    expect(s.prerequisRempli).toBe(true);
  });

  test("un Kage a atteint le sommet", () => {
    const kage: Progression = { ...pBase, grade: "kage" };
    expect(statutProgression(kage, 50).prochainGrade).toBeUndefined();
  });
});
