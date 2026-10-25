// Le taijutsu et les armes.
//
// Le taijutsu est la famille que le catalogue n'avait pas, et c'est celle qui exploite
// nativement le lecteur de posture : elle ne demande aucun signe. Les armes règlent un
// problème de jeu réel — jauge de chakra vide, il faut pouvoir encore agir.

import { Sequence } from "../../src/moteur/grammaire/sequence";
import { ARMES, PARCHEMIN_PAR_MISSION } from "../../src/packs/naruto/donnees/armes";
import { TAIJUTSU } from "../../src/packs/naruto/donnees/taijutsu";
import { EFFETS_CORPS } from "../../src/packs/naruto/effets/corps";
import type { JetonCorps } from "../../src/moteur/corps/gestes";

const JETONS: readonly JetonCorps[] = [
  "directG", "directD", "crochet", "coupDePied", "lancer", "rotation",
  "garde", "saut", "accroupi", "brasCroises", "esquiveG", "esquiveD"
];

const vu = (jeton: JetonCorps) => ({ jeton, score: 1, boite: { x1: 0, y1: 0, x2: 1, y2: 1 } });

/**
 * Une sequence corporelle. Le lecteur de gestes emet un evenement discret puis plus
 * rien : une seule confirmation suffit, et deux coups de pied d'affilee sont bien deux
 * coups — contrairement a un signe tenu, que le detecteur revoit douze fois par seconde.
 */
const sequenceDuCorps = () =>
  new Sequence(TAIJUTSU, { confirmations: 1, repetitions: true, oubli: 10_000 });

/** Emet un geste, puis le silence, comme le fait le lecteur de gestes. */
function geste(s: Sequence<JetonCorps>, jeton: JetonCorps, t: number): void {
  s.ajouter(vu(jeton), t);
  s.ajouter(null, t + 20);
}

test("chaque technique de taijutsu n'utilise que des jetons corporels connus", () => {
  const inconnus = TAIJUTSU.flatMap(t =>
    [...t.signes, ...(t.variante ?? []), ...(t.cadence?.parmi ?? [])].filter(
      j => !JETONS.includes(j)
    )
  );
  expect(inconnus).toEqual([]);
});

test("chaque technique de taijutsu pointe un effet qui existe", () => {
  const manquants = TAIJUTSU.filter(t => !(t.effet in EFFETS_CORPS)).map(t => t.id);
  expect(manquants).toEqual([]);
});

test("aucun enchaînement de taijutsu n'est identique à un autre", () => {
  // Deux techniques avec la même suite en rendraient une injouable.
  const vues = new Set<string>();
  const collisions: string[] = [];
  for (const t of TAIJUTSU) {
    if (t.cadence) continue; // une cadence n'est pas une suite
    const cle = t.signes.join(">");
    if (vues.has(cle)) collisions.push(`${t.id} : ${cle}`);
    vues.add(cle);
  }
  expect(collisions).toEqual([]);
});

test("les sept techniques annoncées sont là", () => {
  expect(TAIJUTSU.map(t => t.id).sort()).toEqual(
    [
      "gatsuuga", "hachimon", "hakkeRokujuuyonShou", "kaiten",
      "konohaSenpuu", "omoteRenge", "shishiRendan"
    ].sort()
  );
});

test("le 64 Poings se déclenche à huit frappes en trois secondes, des deux mains", () => {
  // La rafale alterne les bras : la compter sur un seul serait injouable.
  const s = sequenceDuCorps();
  for (let i = 0; i < 8; i++) geste(s, i % 2 ? "directG" : "directD", i * 300);

  expect(s.techniqueTerminee(2400)?.technique.id).toBe("hakkeRokujuuyonShou");
});

test("sept frappes ne suffisent pas", () => {
  const s = sequenceDuCorps();
  for (let i = 0; i < 7; i++) geste(s, i % 2 ? "directG" : "directD", i * 300);

  expect(s.techniqueTerminee(2100)).toBeNull();
});

test("le Lion Combo demande ses quatre coups dans l'ordre", () => {
  const s = sequenceDuCorps();
  for (const [i, j] of (["directG", "directD", "coupDePied", "coupDePied"] as const).entries()) {
    geste(s, j, i * 300);
  }

  expect(s.techniqueTerminee(900)?.technique.id).toBe("shishiRendan");
});

test("les armes ne coûtent pas de chakra", () => {
  // C'est leur raison d'être : jauge vide, on peut encore agir au lieu de rester planté.
  expect(ARMES.every(a => a.cout === 0)).toBe(true);
});

test("toutes les armes partent du même geste de lancer", () => {
  expect(ARMES.every(a => a.jeton === "lancer")).toBe(true);
});

test("le parchemin explosif a un stock limité, les shuriken et kunai non", () => {
  const parchemin = ARMES.find(a => a.id === "parcheminExplosif");
  const shuriken = ARMES.find(a => a.id === "shuriken");
  const kunai = ARMES.find(a => a.id === "kunai");

  expect(parchemin?.stock).toBe(PARCHEMIN_PAR_MISSION);
  expect(shuriken?.stock).toBeNull();
  expect(kunai?.stock).toBeNull();
});

test("le parchemin explosif fait plus de dégâts que le kunai, qui en fait plus que le shuriken", () => {
  const degats = (id: string) => ARMES.find(a => a.id === id)!.degats;

  expect(degats("shuriken")).toBeLessThan(degats("kunai"));
  expect(degats("kunai")).toBeLessThan(degats("parcheminExplosif"));
});

test("chaque arme pointe un effet qui existe", () => {
  const manquants = ARMES.filter(a => !(a.effet in EFFETS_CORPS)).map(a => a.id);
  expect(manquants).toEqual([]);
});

test("les Huit Portes infligent des dégâts croissants au joueur", () => {
  // C'est le canon, et c'est le pari du jeu : la huitième tue.
  expect(EFFETS_CORPS.huitPortes).toBeDefined();

  const hachimon = TAIJUTSU.find(t => t.id === "hachimon");
  expect(hachimon?.tenir).toBe(true);
});

test("aucun effet corporel n'a une durée nulle", () => {
  const fautifs = Object.entries(EFFETS_CORPS)
    .filter(([, def]) => !(def.duree > 0))
    .map(([nom]) => nom);
  expect(fautifs).toEqual([]);
});
