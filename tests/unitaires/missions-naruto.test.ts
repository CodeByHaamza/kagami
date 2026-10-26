// Le bestiaire, les boss et les missions du pack Kata.
//
// Les règles viennent de la spec (§9.5–9.7) :
// - rangs D à S mappés sur 3 / 5 / 10 / 15 / 20 vagues ;
// - boss : Zabuza (C), Kisame (B), Deidara (B), Itachi (A), Madara (S) ;
// - le boss de la vague 5 du rang B est celui du rang C : on le retrouve plus fort, on
//   sait déjà le lire.

import { BESTIAIRE } from "../../src/packs/naruto/donnees/bestiaire";
import { BOSS } from "../../src/packs/naruto/donnees/boss";
import { CYCLE } from "../../src/packs/naruto/donnees/elements";
import { MISSIONS } from "../../src/packs/naruto/donnees/missions";
import { PACK_KATA } from "../../src/packs/naruto/manifeste";

const elementsConnus = new Set<string>(CYCLE);

test("les cinq rangs D à S ont 3, 5, 10, 15 et 20 vagues", () => {
  expect(MISSIONS.map(m => [m.rang, m.vagues.length])).toEqual([
    ["D", 3],
    ["C", 5],
    ["B", 10],
    ["A", 15],
    ["S", 20]
  ]);
});

test("les boss tombent aux vagues prévues et on retrouve Zabuza au rang B", () => {
  const parRang = Object.fromEntries(MISSIONS.map(m => [m.rang, m]));

  // Rang D : aucun boss.
  expect(parRang.D!.vagues.every(v => !v.boss)).toBe(true);
  // Rang C : Zabuza à la vague 5.
  expect(parRang.C!.vagues[4]!.boss).toBe("zabuza");
  // Rang B : Zabuza à la vague 5, Kisame à la vague 10 (spec §9.7).
  expect(parRang.B!.vagues[4]!.boss).toBe("zabuza");
  expect(parRang.B!.vagues[9]!.boss).toBe("kisame");
  // Rang A : trois boss dont Deidara et Itachi.
  const bossA = parRang.A!.vagues.map(v => v.boss).filter(Boolean);
  expect(bossA).toHaveLength(3);
  expect(bossA).toContain("deidara");
  expect(bossA[2]).toBe("itachi");
  // Rang S : quatre boss plus Madara en final.
  const bossS = parRang.S!.vagues.map(v => v.boss).filter(Boolean);
  expect(bossS).toHaveLength(5);
  expect(bossS[4]).toBe("madara");
});

test("chaque ennemi et chaque boss référencé par une mission existe", () => {
  for (const m of MISSIONS) {
    for (const v of m.vagues) {
      expect(v.ennemis.length > 0 || Boolean(v.boss)).toBe(true);
      for (const e of v.ennemis) {
        expect(e.modele in BESTIAIRE).toBe(true);
        expect(e.nombre).toBeGreaterThan(0);
      }
      if (v.boss) expect(v.boss in BOSS).toBe(true);
    }
  }
});

test("chaque affinité et chaque élément d'attaque appartient au cycle ou vaut null", () => {
  for (const e of Object.values(BESTIAIRE)) {
    if (e.affinite) expect(elementsConnus.has(e.affinite)).toBe(true);
    if (e.attaque.element) expect(elementsConnus.has(e.attaque.element)).toBe(true);
  }
  for (const b of Object.values(BOSS)) {
    if (b.affinite) expect(elementsConnus.has(b.affinite)).toBe(true);
    expect(b.attaques.length).toBeGreaterThan(0);
    for (const a of b.attaques) {
      if (a.element) expect(elementsConnus.has(a.element)).toBe(true);
    }
  }
});

test("Edo Tensei se reforme, Kisame draine le chakra, Itachi a un genjutsu", () => {
  expect(BESTIAIRE.edoTensei.seReforme).toBe(true);
  expect(BOSS.kisame.attaques.some(a => (a.draineChakra ?? 0) > 0)).toBe(true);
  expect(BOSS.itachi.attaques.some(a => "genjutsu" in a && a.genjutsu)).toBe(true);
});

test("le manifeste du pack expose bestiaire, boss et missions", () => {
  expect(PACK_KATA.bestiaire).toBe(BESTIAIRE);
  expect(PACK_KATA.boss).toBe(BOSS);
  expect(PACK_KATA.missions).toBe(MISSIONS);
});
