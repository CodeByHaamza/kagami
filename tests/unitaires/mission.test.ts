// Le déroulement d'une mission : les vagues, les entractes, la victoire, la défaite.

import { Joueur } from "../../src/moteur/jeu/joueur";
import { DeroulementMission } from "../../src/moteur/jeu/mission";
import { Scene } from "../../src/moteur/scene/scene";
import type { Mission } from "../../src/moteur/types";

const MISSION_SIMPLE: Mission = {
  id: "test",
  rang: "D",
  vagues: [
    { ennemis: [{ modele: "zetsu", nombre: 2 }] },
    { ennemis: [{ modele: "zetsu", nombre: 1 }], boss: "zabuza" }
  ]
};

test("les ennemis d'une vague entrent échelonnés, pas tous à la même image", () => {
  const m = new DeroulementMission(MISSION_SIMPLE, { ecartApparition: 1, entracte: 1 });
  expect(m.vagueCourante).toBe(1);
  expect(m.total).toBe(2);

  // Au début de la vague, un seul ennemi entre ; le second attend l'écart.
  expect(m.apparitions(0)).toEqual([{ modele: "zetsu", boss: false }]);
  expect(m.apparitions(0.4)).toEqual([]);
  expect(m.apparitions(0.7)).toEqual([{ modele: "zetsu", boss: false }]);
});

test("une vague abattue ouvre un entracte puis lance la vague suivante", () => {
  const m = new DeroulementMission(MISSION_SIMPLE, { ecartApparition: 0, entracte: 1.5 });
  const scene = new Scene();
  const joueur = new Joueur();

  for (const a of m.apparitions(0)) scene.ajouter(a.modele, { pv: 10, vitesse: 0.1 }, 0);
  for (const e of scene.vivantes()) scene.toucher(e, 20, 100);

  m.avancer(0.1, scene, joueur);
  expect(m.etat).toBe("entracte");
  expect(m.vagueCourante).toBe(1);

  m.avancer(1.6, scene, joueur);
  expect(m.etat).toBe("vague");
  expect(m.vagueCourante).toBe(2);
  expect(m.apparitions(0)).toEqual([
    { modele: "zetsu", boss: false },
    { modele: "zabuza", boss: true }
  ]);
});

test("la dernière vague abattue donne immédiatement la victoire", () => {
  const m = new DeroulementMission(
    { id: "une", rang: "D", vagues: [{ ennemis: [{ modele: "zetsu", nombre: 1 }] }] },
    { ecartApparition: 0, entracte: 1 }
  );
  const scene = new Scene();
  const joueur = new Joueur();

  for (const a of m.apparitions(0)) scene.ajouter(a.modele, { pv: 10, vitesse: 0.1 }, 0);
  for (const e of scene.vivantes()) scene.toucher(e, 20, 100);

  m.avancer(0.1, scene, joueur);
  expect(m.etat).toBe("victoire");
});

test("un joueur vaincu donne la défaite et bloque toute apparition suivante", () => {
  const m = new DeroulementMission(MISSION_SIMPLE, { ecartApparition: 1, entracte: 1 });
  const scene = new Scene();
  const joueur = new Joueur();
  joueur.encaisser(200);

  m.avancer(0.1, scene, joueur);
  expect(m.etat).toBe("defaite");
  expect(m.apparitions(5)).toEqual([]);
});
