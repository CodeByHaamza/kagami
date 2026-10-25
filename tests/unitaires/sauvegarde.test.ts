// La sauvegarde. Trois clés éparpillées deviennent une seule, versionnée : les plans
// suivants (progression, fiche ninja) vont l'étendre, et une version permet de le faire
// sans perdre ce que le joueur a déjà débloqué.

import { PAR_DEFAUT, charger, enregistrer, VERSION } from "../../src/moteur/stockage/sauvegarde";

function stockageFactice(options: { enPanne?: boolean } = {}) {
  const donnees = new Map<string, string>();
  return {
    donnees,
    getItem: (c: string) => {
      if (options.enPanne) throw new DOMException("refusé", "SecurityError");
      return donnees.get(c) ?? null;
    },
    setItem: (c: string, v: string) => {
      if (options.enPanne) throw new DOMException("quota", "QuotaExceededError");
      donnees.set(c, v);
    },
    removeItem: (c: string) => void donnees.delete(c),
    clear: () => donnees.clear(),
    key: () => null,
    length: 0
  };
}

let stockage: ReturnType<typeof stockageFactice>;

beforeEach(() => {
  stockage = stockageFactice();
  vi.stubGlobal("localStorage", stockage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("une sauvegarde absente donne les valeurs par défaut", () => {
  expect(charger()).toEqual(PAR_DEFAUT);
});

test("ce qu'on enregistre se relit", () => {
  enregistrer({ ...PAR_DEFAUT, decouvertes: ["goukakyu"], langue: "en" });

  const relu = charger();
  expect(relu.decouvertes).toEqual(["goukakyu"]);
  expect(relu.langue).toBe("en");
});

test("les anciennes clés ninjutsu-* sont reprises puis supprimées", () => {
  stockage.donnees.set("ninjutsu-decouverts", JSON.stringify(["chidori", "rasengan"]));
  stockage.donnees.set("ninjutsu-compteurs", JSON.stringify({ tigre: 7 }));
  stockage.donnees.set("ninjutsu-photos", JSON.stringify({ tigre: { image: "x", score: 0.9 } }));

  const reprise = charger();

  expect(reprise.decouvertes).toEqual(["chidori", "rasengan"]);
  expect(reprise.compteurs).toEqual({ tigre: 7 });
  expect(reprise.photos.tigre?.score).toBe(0.9);
  // l'ancien format ne doit pas traîner
  expect(stockage.donnees.has("ninjutsu-decouverts")).toBe(false);
  expect(stockage.donnees.has("ninjutsu-compteurs")).toBe(false);
  expect(stockage.donnees.has("ninjutsu-photos")).toBe(false);
});

test("la migration n'écrase pas une sauvegarde déjà au nouveau format", () => {
  enregistrer({ ...PAR_DEFAUT, decouvertes: ["kamui"] });
  stockage.donnees.set("ninjutsu-decouverts", JSON.stringify(["chidori"]));

  expect(charger().decouvertes).toEqual(["kamui"]);
});

test("une sauvegarde d'une version future n'est pas lue de travers", () => {
  stockage.donnees.set(
    `kagami.v${VERSION}`,
    JSON.stringify({ version: VERSION + 5, decouvertes: ["venu du futur"] })
  );

  // On ne sait pas ce que cette version signifie : on repart des valeurs par défaut
  // plutôt que d'interpréter des champs qu'on ne connaît pas.
  expect(charger()).toEqual(PAR_DEFAUT);
});

test("du JSON invalide donne les valeurs par défaut sans jeter", () => {
  stockage.donnees.set(`kagami.v${VERSION}`, "{ ceci n'est pas du JSON");

  expect(() => charger()).not.toThrow();
  expect(charger()).toEqual(PAR_DEFAUT);
});

test("une sauvegarde incomplète est complétée par les valeurs par défaut", () => {
  stockage.donnees.set(`kagami.v${VERSION}`, JSON.stringify({ version: VERSION }));

  const reprise = charger();
  expect(reprise.decouvertes).toEqual([]);
  expect(reprise.compteurs).toEqual({});
  expect(reprise.langue).toBe(PAR_DEFAUT.langue);
});

test("localStorage indisponible ne fait pas tomber l'appli", () => {
  // Review Focus 4 : navigation privée, quota plein, cookies bloqués.
  vi.stubGlobal("localStorage", stockageFactice({ enPanne: true }));

  expect(charger()).toEqual(PAR_DEFAUT);
  expect(() => enregistrer({ ...PAR_DEFAUT, decouvertes: ["goukakyu"] })).not.toThrow();
});

test("localStorage totalement absent ne fait pas tomber l'appli", () => {
  vi.stubGlobal("localStorage", undefined);

  expect(charger()).toEqual(PAR_DEFAUT);
  expect(() => enregistrer(PAR_DEFAUT)).not.toThrow();
});
