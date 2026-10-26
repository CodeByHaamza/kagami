// Le cycle élémentaire et le barème des dégâts.
//
// Le cycle est ce qui empêche de gagner en répétant Gōkakyū : contre un ennemi d'Eau,
// le Feu ne fait presque rien. Le moteur ne connaît aucun élément — le pack lui donne
// son cycle, dans l'ordre où chacun bat le suivant.

import { BAREME, coutChakra, FAIBLE, FORT, multiplicateur, puissance } from "../../src/moteur/jeu/degats";
import type { ProfilCombat } from "../../src/moteur/types";

const CYCLE = ["feu", "vent", "foudre", "terre", "eau"] as const;

const profil = (p: Partial<ProfilCombat> = {}): ProfilCombat => ({
  rang: "C",
  element: null,
  role: "attaque",
  ...p
});

describe("le cycle élémentaire", () => {
  test("le Feu bat le Vent", () => {
    expect(multiplicateur("feu", "vent", CYCLE)).toBe(FORT);
  });

  test("le Feu perd contre l'Eau", () => {
    expect(multiplicateur("feu", "eau", CYCLE)).toBe(FAIBLE);
  });

  test("le cycle se referme : l'Eau bat le Feu, la Terre bat l'Eau", () => {
    expect(multiplicateur("eau", "feu", CYCLE)).toBe(FORT);
    expect(multiplicateur("terre", "eau", CYCLE)).toBe(FORT);
  });

  test("un même élément est neutre", () => {
    expect(multiplicateur("foudre", "foudre", CYCLE)).toBe(1);
  });

  test("deux éléments non voisins sont neutres", () => {
    // le Feu et la Foudre ne sont pas adjacents dans le cycle
    expect(multiplicateur("feu", "foudre", CYCLE)).toBe(1);
  });

  test("un élément hors cycle est neutre dans les deux sens", () => {
    expect(multiplicateur(null, "eau", CYCLE)).toBe(1);
    expect(multiplicateur("feu", null, CYCLE)).toBe(1);
    expect(multiplicateur("bois", "eau", CYCLE)).toBe(1);
  });
});

describe("la puissance", () => {
  test("elle croît avec le rang", () => {
    const rangs = ["E", "D", "C", "B", "A", "S"] as const;
    const valeurs = rangs.map(rang => puissance(profil({ rang }), 3));
    for (let i = 1; i < valeurs.length; i++) expect(valeurs[i]).toBeGreaterThan(valeurs[i - 1]!);
  });

  test("avec un rang, le nombre de jetons ne compte pas", () => {
    expect(puissance(profil({ rang: "B" }), 2)).toBe(puissance(profil({ rang: "B" }), 12));
  });

  test("sans rang, elle croît avec le nombre de jetons", () => {
    expect(puissance(profil({ rang: null }), 6)).toBeGreaterThan(puissance(profil({ rang: null }), 2));
  });

  test("sans rang, elle reste plafonnée sous le rang S", () => {
    // le Dragon d'eau a 44 signes : il ne doit pas dépasser un Rasenshuriken
    expect(puissance(profil({ rang: null }), 44)).toBeLessThan(BAREME.S.puissance);
  });
});

describe("le coût en chakra", () => {
  test("il croît avec le rang", () => {
    expect(coutChakra(profil({ rang: "A" }), 3)).toBeGreaterThan(coutChakra(profil({ rang: "D" }), 3));
  });

  test("sans rang, il croît avec le nombre de jetons, plafonné", () => {
    const court = coutChakra(profil({ rang: null }), 2);
    const long = coutChakra(profil({ rang: null }), 44);
    expect(long).toBeGreaterThan(court);
    expect(long).toBeLessThanOrEqual(BAREME.S.cout);
  });

  test("une technique sans jeton de signe ne coûte rien : le taijutsu", () => {
    // La réponse au chakra vide : on peut toujours frapper.
    expect(coutChakra(profil({ rang: "B" }), 0)).toBe(0);
  });
});

