// Tests unitaires des examens de passage de grade à l'Académie ninja.

import { SessionExamen, type ExamenDefinition } from "../../src/moteur/jeu/examen";
import { EXAMENS_NARUTO } from "../../src/packs/naruto/donnees/examens";
import { JUTSUS } from "../../src/packs/naruto/donnees/jutsus";

const examenTest: ExamenDefinition = {
  id: "testExamen",
  nom: "Examen Test",
  gradeCible: "genin",
  epreuves: [
    { id: "e1", nom: "Épreuve 1", techniqueId: "bunshin", tempsMax: 5 },
    { id: "e2", nom: "Épreuve 2", techniqueId: "shunshin", tempsMax: 4 }
  ]
};

describe("SessionExamen", () => {
  test("initialise la session sur la première épreuve en cours", () => {
    const session = new SessionExamen(examenTest);
    expect(session.etat).toBe("enCours");
    expect(session.indiceEpreuve).toBe(0);
    expect(session.epreuveCourante?.id).toBe("e1");
    expect(session.tempsRestantEpreuve).toBe(5);
  });

  test("le temps s'écoule lors de l'avancement", () => {
    const session = new SessionExamen(examenTest);
    session.avancer(2);
    expect(session.tempsRestantEpreuve).toBe(3);
    expect(session.etat).toBe("enCours");
  });

  test("l'épreuve échoue si le temps limite est dépassé", () => {
    const session = new SessionExamen(examenTest);
    session.avancer(5.1);
    expect(session.tempsRestantEpreuve).toBe(0);
    expect(session.etat).toBe("echoue");
  });

  test("une mauvaise technique ne valide pas l'épreuve", () => {
    const session = new SessionExamen(examenTest);
    const valide = session.validerTechnique("kage_bunshin");
    expect(valide).toBe(false);
    expect(session.indiceEpreuve).toBe(0);
    expect(session.etat).toBe("enCours");
  });

  test("la bonne technique valide la première étape et passe à la suivante", () => {
    const session = new SessionExamen(examenTest);
    session.avancer(1.5);
    const valide = session.validerTechnique("bunshin");
    expect(valide).toBe(true);
    expect(session.indiceEpreuve).toBe(1);
    expect(session.epreuveCourante?.id).toBe("e2");
    expect(session.tempsRestantEpreuve).toBe(4);
    expect(session.etat).toBe("enCours");
  });

  test("valider la dernière épreuve marque l'examen comme réussi", () => {
    const session = new SessionExamen(examenTest);
    session.validerTechnique("bunshin");
    const valideDerniere = session.validerTechnique("shunshin");
    expect(valideDerniere).toBe(true);
    expect(session.epreuveCourante).toBeNull();
    expect(session.etat).toBe("reussi");
  });

  test("aucune validation n'est possible après échec ou réussite", () => {
    const session = new SessionExamen(examenTest);
    session.avancer(10);
    expect(session.etat).toBe("echoue");
    expect(session.validerTechnique("bunshin")).toBe(false);
  });

  test("la réinitialisation remet la session au départ", () => {
    const session = new SessionExamen(examenTest);
    session.avancer(10);
    expect(session.etat).toBe("echoue");
    session.reinitialiser();
    expect(session.etat).toBe("enCours");
    expect(session.indiceEpreuve).toBe(0);
    expect(session.tempsRestantEpreuve).toBe(5);
  });
});

describe("Définitions canoniques Naruto (EXAMENS_NARUTO)", () => {
  test("l'examen Genin est Bunshin no Jutsu (§9.8 canon)", () => {
    const genin = EXAMENS_NARUTO.find(e => e.id === "examenGenin");
    expect(genin).toBeDefined();
    expect(genin?.gradeCible).toBe("genin");
    expect(genin?.epreuves).toHaveLength(1);
    expect(genin?.epreuves[0]?.techniqueId).toBe("bunshin");
  });

  test("l'examen Chūnin comporte plusieurs épreuves techniques", () => {
    const chunin = EXAMENS_NARUTO.find(e => e.id === "examenChunin");
    expect(chunin).toBeDefined();
    expect(chunin?.gradeCible).toBe("chunin");
    expect(chunin?.epreuves.length).toBeGreaterThanOrEqual(2);
  });

  test("tous les jutsus demandés dans les examens existent dans le pack Naruto", () => {
    const jutsusIds = new Set<string>(JUTSUS.map(j => j.id));
    for (const ex of EXAMENS_NARUTO) {
      for (const ep of ex.epreuves) {
        expect(jutsusIds.has(ep.techniqueId)).toBe(true);
      }
    }
  });
});
