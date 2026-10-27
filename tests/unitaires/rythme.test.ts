// Tests unitaires du mode défi rythmique au Dojo.

import { MetronomeRythme, evaluerFrappeRythme } from "../../src/moteur/jeu/rythme";

describe("MetronomeRythme", () => {
  test("calcule l'intervalle de temps entre battements selon le BPM", () => {
    const m = new MetronomeRythme(120);
    // 120 BPM = 0.5s par battement (500 ms)
    expect(m.intervalleMs).toBe(500);
  });

  test("détermine le temps du prochain battement", () => {
    const m = new MetronomeRythme(60, 1000); // Début à 1000 ms, 1s par battement
    expect(m.prochainBattement(1200)).toBe(2000);
    expect(m.battementLePlusProche(1100)).toBe(1000);
    expect(m.battementLePlusProche(1800)).toBe(2000);
  });
});

describe("evaluerFrappeRythme", () => {
  const metronome = new MetronomeRythme(100, 0); // intervalle 600ms : battements à 0, 600, 1200, 1800

  test("accorde 'parfait' pour une frappe très précise", () => {
    const j = evaluerFrappeRythme(metronome, 620); // écart 20ms
    expect(j.jugement).toBe("parfait");
    expect(j.ecartMs).toBe(20);
  });

  test("accorde 'bien' pour une frappe légèrement décalée", () => {
    const j = evaluerFrappeRythme(metronome, 750); // écart 150ms
    expect(j.jugement).toBe("bien");
  });

  test("déclare 'rate' pour une frappe hors temps", () => {
    const j = evaluerFrappeRythme(metronome, 900); // écart 300ms (demi-temps)
    expect(j.jugement).toBe("rate");
  });
});

