// Le filet du catalogue.
//
// 52 techniques reliees a 52 effets et a 14 signes par des chaines de caracteres : dans
// la version d'origine une faute de frappe y etait silencieuse. Ces tests, plus les
// types fermes, la rendent impossible.

import type { Technique } from "../../src/moteur/types";
import type { SigneNaruto } from "../../src/packs/naruto/donnees/signes";
import { CLASSES, FAMILLES, SIGNE_KAI, SIGNES } from "../../src/packs/naruto/donnees/signes";
import type { EffetNaruto } from "../../src/packs/naruto/donnees/jutsus";
import { JUTSUS } from "../../src/packs/naruto/donnees/jutsus";

// `JUTSUS` est declare `as const` pour que les noms d'effets restent des litteraux (c'est
// ce qui fait exister EffetNaruto). Pour les verifications d'execution ci-dessous on en
// prend une vue elargie : la precision des litteraux rendrait les tests inecrivables.
const CATALOGUE: readonly Technique<SigneNaruto>[] = JUTSUS;

const signesConnus = new Set<string>(Object.keys(SIGNES));

/** Toutes les suites de signes d'un jutsu : la principale et l'eventuelle variante. */
const suites = (j: Technique<SigneNaruto>): readonly (readonly string[])[] =>
  j.variante ? [j.signes, j.variante] : [j.signes];

test("il y a 58 jutsus et 14 signes", () => {
  expect(JUTSUS).toHaveLength(58);
  expect(Object.keys(SIGNES)).toHaveLength(14);
});

test("chaque jutsu n'utilise que des signes connus", () => {
  const inconnus = CATALOGUE.flatMap(j =>
    suites(j)
      .flat()
      .filter(signe => !signesConnus.has(signe))
      .map(signe => `${j.id} : ${signe}`)
  );
  expect(inconnus).toEqual([]);
});

test("aucun jutsu n'a de séquence vide", () => {
  const vides = CATALOGUE.filter(j => suites(j).some(s => s.length === 0)).map(j => j.id);
  expect(vides).toEqual([]);
});

test("chaque identifiant de jutsu est unique", () => {
  const ids = CATALOGUE.map(j => j.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test("chaque jutsu à tenir n'a qu'un seul signe", () => {
  const fautifs = CATALOGUE.filter(j => j.tenir && j.signes.length !== 1).map(j => j.id);
  expect(fautifs).toEqual([]);
});

test("aucune séquence n'est identique à celle d'un autre jutsu", () => {
  // Deux jutsus avec le meme enchainement : l'un des deux serait inatteignable.
  const vues = new Map<string, string>();
  const collisions: string[] = [];
  for (const j of CATALOGUE) {
    for (const suite of suites(j)) {
      const cle = suite.join(">");
      const deja = vues.get(cle);
      if (deja) collisions.push(`${deja} et ${j.id} : ${cle}`);
      else vues.set(cle, j.id);
    }
  }
  expect(collisions).toEqual([]);
});

test("CLASSES a 15 entrées et l'indice 13 est null", () => {
  // L'ordre des classes du modele YOLOX ; la classe 13 (« Unknown ») n'est pas un signe.
  expect(CLASSES).toHaveLength(15);
  expect(CLASSES[13]).toBeNull();
});

test("chaque signe de CLASSES non nul existe dans SIGNES", () => {
  const inconnus = CLASSES.filter((c): c is SigneNaruto => c !== null).filter(
    c => !signesConnus.has(c)
  );
  expect(inconnus).toEqual([]);
});

test("SIGNE_KAI est un signe connu", () => {
  expect(signesConnus.has(SIGNE_KAI)).toBe(true);
});

test("chaque type de jutsu a une famille", () => {
  const sansFamille = [...new Set(CATALOGUE.map(j => j.type))].filter(t => !(t in FAMILLES));
  expect(sansFamille).toEqual([]);
});

test("chaque signe a un kanji et un romaji", () => {
  const incomplets = Object.entries(SIGNES)
    .filter(([, s]) => !s.kanji || !s.romaji)
    .map(([cle]) => cle);
  expect(incomplets).toEqual([]);
});

test("chaque jutsu a un kanji, un romaji et une source connue", () => {
  const incomplets = CATALOGUE.filter(
    j => !j.kanji || !j.romaji || !["anime", "appli"].includes(j.source)
  ).map(j => j.id);
  expect(incomplets).toEqual([]);
});

test("EffetNaruto est une union fermée, pas string", () => {
  // C'est ce type qui forcera la tache 7 a fournir exactement les effets que le
  // catalogue reference. S'il valait `string`, le @ts-expect-error ci-dessous serait
  // inutilise et ce test echouerait a la compilation.
  const connu: EffetNaruto = "bouleDeFeu";
  // @ts-expect-error aucun jutsu ne reference cet effet
  const inconnu: EffetNaruto = "effetQuiNExistePas";
  expect([connu, inconnu]).toHaveLength(2);
});
