// La scène : les entités ennemies, leur profondeur et leurs PV.
//
// Toutes les coordonnées sont des fractions : `x` de 0 (gauche) à 1 (droite), et la
// `profondeur` de 0 (au fond) à 1 (au contact). Comme les mesures du corps, elles ne
// dépendent pas de la résolution de la caméra.

import { Scene } from "../../src/moteur/scene/scene";

test("une entité ajoutée apparaît au fond puis approche", () => {
  const scene = new Scene();
  const zetsu = scene.ajouter("zetsu", { pv: 30, vitesse: 0.2 }, 0);
  expect(zetsu.etat).toBe("apparition");
  expect(zetsu.profondeur).toBe(0);

  scene.avancer(0.5, 500);
  expect(zetsu.etat).toBe("approche");
  expect(zetsu.profondeur).toBeGreaterThan(0);
});

test("toucher retire des PV et marque l'état touché avant le retour à l'approche", () => {
  const scene = new Scene();
  const e = scene.ajouter("zetsu", { pv: 30, vitesse: 0.1 }, 0);
  scene.avancer(0.5, 500);

  expect(scene.toucher(e, 10, 600)).toBe(false);
  expect(e.pv).toBe(20);
  expect(e.etat).toBe("touche");

  scene.avancer(0.4, 1000);
  expect(e.etat).toBe("approche");
});

test("à zéro PV l'entité meurt, quitte les vivantes, puis disparaît de la scène", () => {
  const scene = new Scene();
  const e = scene.ajouter("zetsu", { pv: 20, vitesse: 0.1 }, 0);

  expect(scene.toucher(e, 25, 100)).toBe(true);
  expect(e.pv).toBe(0);
  expect(e.etat).toBe("mort");
  expect(scene.vivantes()).toEqual([]);
  expect(scene.toutes).toHaveLength(1);

  scene.avancer(1, 1100);
  expect(scene.toutes).toEqual([]);
});

test("aPortee ne garde que les entités vivantes assez proches", () => {
  const scene = new Scene();
  const loin = scene.ajouter("zetsu", { pv: 20, vitesse: 0.1, profondeur: 0.2 }, 0);
  const pres = scene.ajouter("zetsu", { pv: 20, vitesse: 0.1, profondeur: 0.8 }, 0);
  const mort = scene.ajouter("zetsu", { pv: 20, vitesse: 0.1, profondeur: 0.9 }, 0);
  scene.toucher(mort, 30, 10);

  expect(scene.aPortee(0.6)).toEqual([pres]);
  expect(loin.profondeur).toBeLessThan(0.6);
});

test("plusProche choisit la plus grande profondeur parmi les vivantes", () => {
  const scene = new Scene();
  expect(scene.plusProche()).toBeNull();

  scene.ajouter("zetsu", { pv: 20, vitesse: 0.1, profondeur: 0.3 }, 0);
  const devant = scene.ajouter("anbu", { pv: 20, vitesse: 0.1, profondeur: 0.7 }, 0);
  scene.ajouter("zetsu", { pv: 20, vitesse: 0.1, profondeur: 0.5 }, 0);

  expect(scene.plusProche()).toBe(devant);
});

test("une entité Edo Tensei se reforme une fois, et une seule", () => {
  const scene = new Scene();
  const edo = scene.ajouter("edo", { pv: 40, vitesse: 0.1, seReforme: true }, 0);

  // Première mort : elle revient à mi-vie au lieu de mourir.
  expect(scene.toucher(edo, 50, 100)).toBe(false);
  expect(edo.pv).toBe(20);
  expect(edo.etat).toBe("apparition");
  expect(scene.vivantes()).toEqual([edo]);

  // Seconde mort : cette fois elle tombe pour de bon.
  expect(scene.toucher(edo, 50, 200)).toBe(true);
  expect(edo.etat).toBe("mort");
  expect(scene.vivantes()).toEqual([]);
});

test("la profondeur plafonne au contact", () => {
  const scene = new Scene();
  const e = scene.ajouter("zetsu", { pv: 20, vitesse: 0.5 }, 0);
  scene.avancer(10, 10_000);
  expect(e.profondeur).toBe(1);
});
