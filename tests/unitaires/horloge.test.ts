// Le ralenti d'incantation.
//
// À 12 détections par seconde avec deux confirmations, un Gōkakyū demande trois à quatre
// secondes d'enchaînement parfait ; un télégraphe de boss en dure deux (spec §7.8). Sans
// ralenti, les deux tiers du catalogue seraient injouables en arcade.
//
// Le ralenti est un paramètre du **mode**, jamais de la grammaire : le Dojo n'en a pas,
// et le constructeur peut le couper d'un drapeau pour mesurer.

import { HorlogeDeJeu } from "../../src/moteur/jeu/horloge";

test("hors concentration le jeu avance à vitesse normale", () => {
  const h = new HorlogeDeJeu();
  expect(h.avancer(0.1, "neutre")).toBeCloseTo(0.1);
  expect(h.avancer(0.1, "combat")).toBeCloseTo(0.1);
  expect(h.facteur).toBe(1);
});

test("en concentration le jeu ralentit vers le facteur réglé", () => {
  const h = new HorlogeDeJeu({ ralenti: 0.35, transition: 100 });
  for (let i = 0; i < 10; i++) h.avancer(0.02, "concentration");
  expect(h.facteur).toBeCloseTo(0.35);
  expect(h.avancer(1, "concentration")).toBeCloseTo(0.35);
});

test("la bascule est progressive : le premier pas ne saute pas d'un coup", () => {
  const h = new HorlogeDeJeu({ ralenti: 0.35, transition: 200 });
  h.avancer(0.05, "concentration");
  expect(h.facteur).toBeLessThan(1);
  expect(h.facteur).toBeGreaterThan(0.35);
});

test("désactivée, l'horloge ne ralentit jamais", () => {
  const h = new HorlogeDeJeu({ actif: false });
  expect(h.avancer(1, "concentration")).toBe(1);
  expect(h.facteur).toBe(1);
});
