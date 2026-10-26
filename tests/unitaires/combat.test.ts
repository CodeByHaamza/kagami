// Le combat : ce qui assemble la scène, les vagues, les télégraphes, le joueur et les
// dégâts, et la seule pièce que l'appli appelle.

import { Combat } from "../../src/moteur/jeu/combat";
import type { Mission } from "../../src/moteur/types";
import { ARMES } from "../../src/packs/naruto/donnees/armes";
import { BESTIAIRE } from "../../src/packs/naruto/donnees/bestiaire";
import { BOSS } from "../../src/packs/naruto/donnees/boss";
import { CYCLE } from "../../src/packs/naruto/donnees/elements";
import { JUTSUS } from "../../src/packs/naruto/donnees/jutsus";
import { PROFILS } from "../../src/packs/naruto/donnees/profils";
import { TAIJUTSU } from "../../src/packs/naruto/donnees/taijutsu";

const jutsu = (id: string) => JUTSUS.find(j => j.id === id)!;
const tai = (id: string) => TAIJUTSU.find(t => t.id === id)!;
const arme = (id: string) => ARMES.find(a => a.id === id)!;

function creerCombat(mission?: Mission): Combat {
  return new Combat({
    mission: mission ?? {
      id: "test",
      rang: "D",
      vagues: [{ ennemis: [{ modele: "deserteurVent", nombre: 2 }] }]
    },
    cycle: CYCLE,
    profils: PROFILS,
    bestiaire: BESTIAIRE,
    boss: BOSS,
    ecartApparition: 0,
    entracte: 0.5
  });
}

test("un jutsu d'attaque coûte son chakra et touche tous les ennemis présents", () => {
  // Spec §9.2 étape 3 : sans zone déclarée, un jutsu applique ses dégâts au lancement
  // à tout ce qui est à portée.
  const c = creerCombat();
  c.avancer(0.1, 100, "neutre");
  expect(c.scene.vivantes()).toHaveLength(2);

  const r = c.technique(jutsu("goukakyu"), 200);
  expect(r.ok).toBe(true);
  expect(c.joueur.chakra).toBeLessThan(100);
  // Feu contre Vent : ×2 → les deux déserteurs tombent d'un coup.
  expect(c.scene.vivantes()).toEqual([]);
});

test("l'élément fort double les dégâts, le faible les divise", () => {
  const contreVent = creerCombat({
    id: "v",
    rang: "D",
    vagues: [{ ennemis: [{ modele: "deserteurVent", nombre: 1 }] }]
  });
  const contreEau = creerCombat({
    id: "e",
    rang: "D",
    vagues: [{ ennemis: [{ modele: "deserteurEau", nombre: 1 }] }]
  });
  contreVent.avancer(0.1, 100, "neutre");
  contreEau.avancer(0.1, 100, "neutre");

  // Mizurappa (Eau) contre Eau est neutre ; Hōsenka (Feu) contre Eau est faible.
  contreEau.technique(jutsu("housenka"), 200);
  const pvApresFaible = contreEau.scene.vivantes()[0]!.pv;

  contreVent.technique(jutsu("mizurappa"), 200);
  const pvApresNeutre = contreVent.scene.vivantes()[0]!.pv;

  expect(pvApresFaible).toBeGreaterThan(pvApresNeutre);
});

test("Review Focus 2 : une technique dojo est refusée sans retirer de chakra", () => {
  const c = creerCombat();
  c.avancer(0.1, 100, "neutre");

  const r = c.technique(jutsu("tsukuyomi"), 200);
  expect(r).toEqual({ ok: false, raison: "dojo" });
  expect(c.joueur.chakra).toBe(100);
});

test("Review Focus 3 : sans chakra le jutsu est refusé, mais le taijutsu et les armes partent", () => {
  const c = creerCombat();
  c.avancer(0.1, 100, "neutre");
  c.joueur.chakra = 2;

  expect(c.technique(jutsu("goukakyu"), 200)).toEqual({ ok: false, raison: "chakra" });
  expect(c.joueur.chakra).toBe(2);

  // Une arme est gratuite et vise le plus proche.
  const avantArme = c.scene.plusProche()!.pv;
  expect(c.arme(arme("kunai"), 250).ok).toBe(true);
  expect(c.scene.plusProche()!.pv).toBeLessThan(avantArme);

  // Le taijutsu est gratuit, mais demande que l'ennemi soit à portée courte.
  c.scene.plusProche()!.profondeur = 0.8;
  const avantTai = c.scene.plusProche()!.pv;
  expect(c.technique(tai("konohaSenpuu"), 300).ok).toBe(true);
  expect(c.scene.plusProche()!.pv).toBeLessThan(avantTai);
});

test("le parchemin explosif blesse aussi les voisins de sa cible", () => {
  const c = creerCombat();
  c.avancer(0.1, 100, "neutre");
  const [a, b] = c.scene.vivantes();

  c.arme(arme("parcheminExplosif"), 200);
  expect(a!.pv).toBeLessThan(a!.pvMax);
  expect(b!.pv).toBeLessThan(b!.pvMax);
});

test("un jutsu défensif ou le Kawarimi contre les télégraphes en vol", () => {
  const c = creerCombat({
    id: "b",
    rang: "C",
    vagues: [{ ennemis: [], boss: "zabuza" }]
  });
  c.avancer(3, 3000, "neutre");
  expect(c.telegraphes.length).toBeGreaterThan(0);

  expect(c.technique(jutsu("kawarimi"), 3100).ok).toBe(true);
  c.avancer(3, 6000, "neutre");
  expect(c.joueur.vie).toBe(100);
});

test("l'esquive annule un télégraphe esquivable en cours", () => {
  const c = creerCombat();
  c.avancer(4, 4000, "combat");
  expect(c.telegraphes.length).toBeGreaterThan(0);

  expect(c.esquive()).toBe(true);
  c.avancer(3, 7000, "combat");
  expect(c.joueur.vie).toBe(100);
});

test("Review Focus 4 : la victoire annule les télégraphes en vol et la défaite fige le combat", () => {
  const c = creerCombat({
    id: "une",
    rang: "D",
    vagues: [{ ennemis: [{ modele: "zetsu", nombre: 1 }] }]
  });
  c.avancer(4, 4000, "neutre");
  expect(c.telegraphes.length).toBeGreaterThan(0);

  // Le dernier ennemi tombe pendant que son télégraphe est en vol.
  c.technique(jutsu("goukakyu"), 4100);
  expect(c.etat).toBe("victoire");
  expect(c.telegraphes).toEqual([]);

  // Même si du temps passe après la victoire, le joueur ne reçoit aucun coup.
  c.avancer(5, 9000, "neutre");
  expect(c.joueur.vie).toBe(100);

  // Côté défaite : plus rien n'avance.
  const d = creerCombat();
  d.joueur.encaisser(200);
  d.avancer(1, 1000, "neutre");
  expect(d.etat).toBe("defaite");
  d.avancer(10, 11_000, "neutre");
  expect(d.scene.vivantes()).toEqual([]);
});

test("Review Focus 5 : sous illusion un jutsu est refusé, et kai rompt même à zéro de chakra", () => {
  const c = creerCombat();
  c.avancer(0.1, 100, "concentration");
  c.joueur.envouter();
  c.joueur.chakra = 0;

  expect(c.technique(jutsu("goukakyu"), 200)).toEqual({ ok: false, raison: "illusion" });
  expect(c.kai()).toBe(true);
  expect(c.joueur.illusion).toBe(false);
});
