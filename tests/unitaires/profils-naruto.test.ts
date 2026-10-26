// Le profil de combat des 52 jutsus et des 7 techniques de taijutsu.
//
// Ce ne sont pas des réglages : ce sont des faits de l'œuvre (spec §9.1, §9.3). Un
// cycle élémentaire inversé ou un Tsukuyomi qui attaque un ennemi alors que son effet
// déforme l'écran du joueur feraient rater l'arcade.

import { CYCLE, ELEMENTS, type ElementNaruto } from "../../src/packs/naruto/donnees/elements";
import { PROFILS } from "../../src/packs/naruto/donnees/profils";
import { JUTSUS } from "../../src/packs/naruto/donnees/jutsus";
import { TAIJUTSU } from "../../src/packs/naruto/donnees/taijutsu";
import { PACK_KATA } from "../../src/packs/naruto/manifeste";

const TOUTES = [...JUTSUS, ...TAIJUTSU];

test("chaque jutsu et chaque taijutsu a un profil", () => {
  const manquants = TOUTES.map(t => t.id).filter(id => !(id in PROFILS));
  expect(manquants).toEqual([]);
});

test("aucun profil n'est orphelin", () => {
  const connus = new Set(TOUTES.map(t => t.id));
  const orphelins = Object.keys(PROFILS).filter(id => !connus.has(id));
  expect(orphelins).toEqual([]);
});

test("le cycle est Feu ▶ Vent ▶ Foudre ▶ Terre ▶ Eau", () => {
  expect(CYCLE).toEqual(["feu", "vent", "foudre", "terre", "eau"]);
  expect(Object.keys(ELEMENTS)).toEqual(["feu", "vent", "foudre", "terre", "eau"]);
  for (const el of CYCLE) expect(ELEMENTS[el].kanji).toBeTruthy();
});

test("l'élément suit le type de la technique", () => {
  const parType: Record<string, ElementNaruto | null> = {
    Katon: "feu",
    Suiton: "eau",
    Raiton: "foudre",
    "Fūton": "vent",
    Doton: "terre",
    // Le Mokuton et toutes les familles non élémentaires sont hors cycle (spec §9.3).
    Mokuton: null,
    Ninjutsu: null,
    Kuchiyose: null,
    Kinjutsu: null,
    "Fūinjutsu": null,
    "Iryō ninjutsu": null,
    Genjutsu: null,
    "Dōjutsu": null,
    Taijutsu: null
  };

  // Une seule exception canon : Amaterasu est un Dōjutsu dont la nature est le Feu
  // (Enton / Katon, flammes noires).
  const exceptions: Record<string, ElementNaruto | null> = { amaterasu: "feu" };

  const incoherents = TOUTES.filter(t => {
    const attendu = t.id in exceptions ? exceptions[t.id] : parType[t.type];
    const profil = PROFILS[t.id as keyof typeof PROFILS];
    return profil.element !== attendu;
  }).map(t => t.id);

  expect(incoherents).toEqual([]);
});

test("les douze techniques tournées vers le joueur sont marquées dojo", () => {
  // Elles déforment l'écran du joueur, le grisent ou l'enferment (spec §9.3) : en
  // arcade elles ne doivent ni coûter ni toucher tant qu'une variante offensive n'a
  // pas été écrite.
  const dojo = [
    "tsukuyomi",
    "narakumi",
    "jubakusatsu",
    "edotensei",
    "gamaguchi",
    "shichuurou",
    "henge",
    "shichuuka",
    "jukaikoutan",
    "shousen",
    "fuujahouin",
    "shikifuujin"
  ];
  for (const id of dojo) {
    expect(PROFILS[id as keyof typeof PROFILS].role).toBe("dojo");
  }
});

test("les murs, le Kaiten et le Kawarimi sont des défenses", () => {
  for (const id of ["suijinheki", "doryuuheki", "rashoumon", "kaiten", "kawarimi", "harijizou", "susanoo"]) {
    expect(PROFILS[id as keyof typeof PROFILS].role).toBe("defense");
  }
});

test("le manifeste du pack expose le cycle et les profils", () => {
  expect(PACK_KATA.cycle).toBe(CYCLE);
  expect(PACK_KATA.profils).toBe(PROFILS);
});
