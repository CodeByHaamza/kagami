// L'internationalisation. Le vrai risque ici n'est pas la traduction, c'est la derive :
// une cle ajoutee en francais et oubliee en anglais, qui n'apparait qu'en production.
// Le premier test ferme cette porte.

import { changerLangue, langue, reinitialiser, t } from "../../src/moteur/ui/i18n";
import { EN, FR, enregistrerTextes } from "../../src/packs/naruto/i18n";
import { JUTSUS } from "../../src/packs/naruto/donnees/jutsus";
import { SIGNES } from "../../src/packs/naruto/donnees/signes";

const clesTriees = (d: Readonly<Record<string, string>>) => Object.keys(d).sort();

beforeEach(() => {
  reinitialiser();
  enregistrerTextes();
  changerLangue("fr");
});

test("les dictionnaires fr et en ont exactement les mêmes clés", () => {
  const manquantesEnAnglais = clesTriees(FR).filter(c => !(c in EN));
  const enTropEnAnglais = clesTriees(EN).filter(c => !(c in FR));

  expect(manquantesEnAnglais).toEqual([]);
  expect(enTropEnAnglais).toEqual([]);
});

test("aucune valeur n'est vide", () => {
  const vides = [
    ...Object.entries(FR).filter(([, v]) => !v.trim()).map(([c]) => `fr:${c}`),
    ...Object.entries(EN).filter(([, v]) => !v.trim()).map(([c]) => `en:${c}`)
  ];
  expect(vides).toEqual([]);
});

test("chaque jutsu a un nom et une description dans les deux langues", () => {
  const manquants = JUTSUS.flatMap(j =>
    ["nom", "texte"].flatMap(champ =>
      [
        [`jutsu.${j.id}.${champ}`, FR, "fr"],
        [`jutsu.${j.id}.${champ}`, EN, "en"]
      ]
        .filter(([cle, d]) => !((cle as string) in (d as Record<string, string>)))
        .map(([cle, , l]) => `${l as string}:${cle as string}`)
    )
  );
  expect(manquants).toEqual([]);
});

test("chaque signe a un nom et une position dans les deux langues", () => {
  const manquants = Object.keys(SIGNES).flatMap(s =>
    ["nom", "position"].flatMap(champ =>
      (
        [
          ["fr", FR],
          ["en", EN]
        ] as const
      )
        .filter(([, d]) => !(`signe.${s}.${champ}` in d))
        .map(([l]) => `${l}:signe.${s}.${champ}`)
    )
  );
  expect(manquants).toEqual([]);
});

test("t interpole les valeurs nommées", () => {
  expect(t("decouverte.compte", { faits: 3, total: 52 })).toContain("3");
  expect(t("decouverte.compte", { faits: 3, total: 52 })).toContain("52");
  expect(t("decouverte.compte", { faits: 3, total: 52 })).not.toContain("{");
});

test("t renvoie la clé si la traduction manque, sans jeter", () => {
  expect(() => t("cle.qui.nexiste.pas")).not.toThrow();
  expect(t("cle.qui.nexiste.pas")).toBe("cle.qui.nexiste.pas");
});

test("changer de langue change ce que t renvoie", () => {
  const fr = t("accueil.ouvrir");
  changerLangue("en");
  expect(langue()).toBe("en");
  expect(t("accueil.ouvrir")).not.toBe(fr);
});

test("la langue par défaut est le français quand celle du navigateur est inconnue", () => {
  expect(langue("pt-BR")).toBe("fr");
  expect(langue("fr-CA")).toBe("fr");
  expect(langue("en-GB")).toBe("en");
});

test("les kanji et les romaji ne sont pas dans les dictionnaires", () => {
  // Ils ne se traduisent pas : ils restent dans les donnees du pack.
  const japonais = Object.keys(FR).filter(c => c.endsWith(".kanji") || c.endsWith(".romaji"));
  expect(japonais).toEqual([]);
});

test("les noms de jutsus anglais ne sont pas de simples copies du français", () => {
  // Un dictionnaire en recopie du fr passerait les tests de cles mais ne servirait a rien.
  const identiques = JUTSUS.filter(j => FR[`jutsu.${j.id}.texte`] === EN[`jutsu.${j.id}.texte`]);
  expect(identiques.map(j => j.id)).toEqual([]);
});
