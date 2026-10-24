// Les types du moteur sont ce qui remplace les chaines de caracteres non verifiees de la
// version d'origine : 52 techniques reliees a 52 effets par des noms, sans filet.

import { expectTypeOf } from "vitest";
import type {
  Detection,
  Effet,
  ContexteEffet,
  Jeton,
  Langue,
  MomentEffet,
  Pack,
  Technique
} from "../../src/moteur/types";

type SigneTest = "tigre" | "serpent";

test("une technique exige un identifiant, une suite de jetons et un effet", () => {
  expectTypeOf<Technique<SigneTest>>().toHaveProperty("id").toEqualTypeOf<string>();
  expectTypeOf<Technique<SigneTest>>().toHaveProperty("effet").toEqualTypeOf<string>();
  expectTypeOf<Technique<SigneTest>>()
    .toHaveProperty("signes")
    .toEqualTypeOf<readonly SigneTest[]>();
});

test("variante et tenir sont facultatifs sur une technique", () => {
  const minimale: Technique<SigneTest> = {
    id: "essai",
    type: "Katon",
    kanji: "火",
    romaji: "Essai",
    signes: ["tigre"],
    effet: "bouleDeFeu",
    source: "anime"
  };
  expectTypeOf(minimale).toExtend<Technique<SigneTest>>();
  expectTypeOf<Technique<SigneTest>["variante"]>().toEqualTypeOf<readonly SigneTest[] | undefined>();
  expectTypeOf<Technique<SigneTest>["tenir"]>().toEqualTypeOf<boolean | undefined>();
});

test("une technique sans identifiant ne compile pas", () => {
  // @ts-expect-error il manque id
  const sansId: Technique<SigneTest> = {
    type: "Katon",
    kanji: "火",
    romaji: "Essai",
    signes: ["tigre"],
    effet: "bouleDeFeu",
    source: "anime"
  };
  expect(sansId).toBeDefined();
});

test("un jeton d'une technique doit appartenir a son alphabet", () => {
  // @ts-expect-error "chat" n'est pas un signe de SigneTest
  const mauvaisJeton: Technique<SigneTest>["signes"] = ["chat"];
  expect(mauvaisJeton).toBeDefined();
});

test("un effet exige une duree et accepte les quatre moments", () => {
  expectTypeOf<Effet>().toHaveProperty("duree").toEqualTypeOf<number>();
  const complet: Effet = {
    duree: 2,
    son: "jutsu",
    depart: () => {},
    fond: () => {},
    derriere: () => {},
    personne: () => true,
    devant: () => {}
  };
  expectTypeOf(complet).toExtend<Effet>();
  const minimal: Effet = { duree: 1 };
  expectTypeOf(minimal).toExtend<Effet>();
});

test("le moment personne peut signaler qu'il a dessine la personne", () => {
  expectTypeOf<NonNullable<Effet["personne"]>>().returns.toEqualTypeOf<boolean | void>();
});

test("les quatre moments d'un effet sont exactement MomentEffet", () => {
  expectTypeOf<MomentEffet>().toEqualTypeOf<"fond" | "derriere" | "personne" | "devant">();
});

test("le contexte d'effet porte le temps, la taille et la position des mains", () => {
  expectTypeOf<ContexteEffet>().toHaveProperty("t").toEqualTypeOf<number>();
  expectTypeOf<ContexteEffet>().toHaveProperty("dt").toEqualTypeOf<number>();
  expectTypeOf<ContexteEffet>().toHaveProperty("l").toEqualTypeOf<number>();
  expectTypeOf<ContexteEffet>().toHaveProperty("h").toEqualTypeOf<number>();
  expectTypeOf<ContexteEffet["main"]>().toEqualTypeOf<{ x: number; y: number; r: number }>();
});

test("une detection porte un jeton, un score et une boite", () => {
  expectTypeOf<Detection<SigneTest>>().toHaveProperty("jeton").toEqualTypeOf<SigneTest>();
  expectTypeOf<Detection<SigneTest>>().toHaveProperty("score").toEqualTypeOf<number>();
  expectTypeOf<Detection<SigneTest>["boite"]>().toEqualTypeOf<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }>();
});

test("un pack expose ses techniques en lecture seule", () => {
  expectTypeOf<Pack<SigneTest>["techniques"]>().toEqualTypeOf<readonly Technique<SigneTest>[]>();
  expectTypeOf<Pack<SigneTest>["jetons"]>().toEqualTypeOf<readonly SigneTest[]>();
});

test("les langues du projet sont le francais et l'anglais", () => {
  expectTypeOf<Langue>().toEqualTypeOf<"fr" | "en">();
});

test("Jeton est une chaine, restreinte par chaque pack", () => {
  expectTypeOf<Jeton>().toEqualTypeOf<string>();
  expectTypeOf<SigneTest>().toExtend<Jeton>();
});
