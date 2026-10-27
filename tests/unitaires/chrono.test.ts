// Tests unitaires du chronomètre du Dojo.

import { ChronometreDojo } from "../../src/moteur/jeu/chrono";

describe("ChronometreDojo", () => {
  test("est inactif au départ", () => {
    const chrono = new ChronometreDojo();
    expect(chrono.actif).toBe(false);
    expect(chrono.techniqueCibleId).toBeNull();
    expect(chrono.tempsEcoule(1000)).toBe(0);
  });

  test("démarre sur une technique cible", () => {
    const chrono = new ChronometreDojo();
    chrono.demarrer("goukakyu", 1000);
    expect(chrono.actif).toBe(true);
    expect(chrono.techniqueCibleId).toBe("goukakyu");
    expect(chrono.tempsEcoule(1500)).toBe(500);
  });

  test("valide la technique et établit un premier record", () => {
    const chrono = new ChronometreDojo();
    chrono.demarrer("goukakyu", 1000);
    const res = chrono.arreter("goukakyu", 2250, {});
    expect(res.reussi).toBe(true);
    if (res.reussi) {
      expect(res.dureeMs).toBe(1250);
      expect(res.estNouveauRecord).toBe(true);
      expect(res.recordPrecedent).toBeUndefined();
    }
    expect(chrono.actif).toBe(false);
  });

  test("détecte si le record existant est battu", () => {
    const chrono = new ChronometreDojo();
    const records = { goukakyu: 1500 };

    chrono.demarrer("goukakyu", 2000);
    // 2000 -> 3200 = 1200ms < 1500ms => Record battu !
    const res = chrono.arreter("goukakyu", 3200, records);
    expect(res.reussi).toBe(true);
    if (res.reussi) {
      expect(res.dureeMs).toBe(1200);
      expect(res.estNouveauRecord).toBe(true);
      expect(res.recordPrecedent).toBe(1500);
    }
  });

  test("ne valide pas de nouveau record si le temps est plus long", () => {
    const chrono = new ChronometreDojo();
    const records = { goukakyu: 1000 };

    chrono.demarrer("goukakyu", 2000);
    // 2000 -> 3400 = 1400ms > 1000ms => Pas de record
    const res = chrono.arreter("goukakyu", 3400, records);
    expect(res.reussi).toBe(true);
    if (res.reussi) {
      expect(res.dureeMs).toBe(1400);
      expect(res.estNouveauRecord).toBe(false);
      expect(res.recordPrecedent).toBe(1000);
    }
  });

  test("refuse l'arrêt si une autre technique est exécutée", () => {
    const chrono = new ChronometreDojo();
    chrono.demarrer("goukakyu", 1000);
    const res = chrono.arreter("chidori", 1800, {});
    expect(res.reussi).toBe(false);
    expect(chrono.actif).toBe(true);
    expect(chrono.tempsEcoule(2000)).toBe(1000);
  });

  test("reinitialiser remet le chrono à zéro", () => {
    const chrono = new ChronometreDojo();
    chrono.demarrer("goukakyu", 1000);
    chrono.reinitialiser();
    expect(chrono.actif).toBe(false);
    expect(chrono.techniqueCibleId).toBeNull();
    expect(chrono.tempsEcoule(2000)).toBe(0);
  });
});
