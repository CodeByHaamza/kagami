// Le joueur en arcade : sa vie, son chakra, son invocation, sa garde et l'illusion.

import { Joueur } from "../../src/moteur/jeu/joueur";

test("dépenser plus que le chakra disponible échoue sans rien retirer", () => {
  // Review Focus 3 : si un jutsu trop cher vidait la jauge sans partir, le joueur serait
  // doublement puni.
  const j = new Joueur();
  j.chakra = 20;
  expect(j.depenser(30)).toBe(false);
  expect(j.chakra).toBe(20);
  expect(j.depenser(20)).toBe(true);
  expect(j.chakra).toBe(0);
});

test("la garde réduit fortement les dégâts reçus", () => {
  const sans = new Joueur();
  const avec = new Joueur();
  avec.garde = true;

  const plein = sans.encaisser(40);
  const reduit = avec.encaisser(40);
  expect(reduit).toBeLessThan(plein / 2);
  expect(avec.vie).toBeGreaterThan(sans.vie);
});

test("le chakra se régénère lentement au repos et se charge vite au palier charge", () => {
  const j = new Joueur();
  j.chakra = 10;
  j.avancer(1);
  const apresRepos = j.chakra;
  expect(apresRepos).toBeGreaterThan(10);

  j.charger(1);
  expect(j.chakra - apresRepos).toBeGreaterThan((apresRepos - 10) * 3);
  expect(j.chakra).toBeLessThanOrEqual(100);
});

test("sous illusion le chakra fuit, et rompre ne coûte rien", () => {
  // Review Focus 5 : Itachi draine le chakra pendant son genjutsu ; si le « Kai ! »
  // demandait du chakra, un joueur vidé ne pourrait jamais en sortir.
  const j = new Joueur();
  j.chakra = 15;
  j.envouter();
  expect(j.illusion).toBe(true);

  j.avancer(2);
  expect(j.chakra).toBe(0);

  j.rompre();
  expect(j.illusion).toBe(false);
});

test("la vie ne descend pas sous zéro et le joueur est alors vaincu", () => {
  const j = new Joueur();
  expect(j.vaincu).toBe(false);
  j.encaisser(500);
  expect(j.vie).toBe(0);
  expect(j.vaincu).toBe(true);
});

test("drainer retire du chakra sans descendre sous zéro : l'épée de Kisame", () => {
  const j = new Joueur();
  j.chakra = 25;
  j.drainer(40);
  expect(j.chakra).toBe(0);
});
