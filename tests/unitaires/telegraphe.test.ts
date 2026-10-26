// Les attaques télégraphiées et leurs quatre réponses.
//
// Jamais d'attaque non annoncée (spec §9.6) : l'ennemi télégraphie, l'élément est
// affiché, et le joueur peut esquiver au corps, garder, contrer avec un jutsu défensif
// (ou le Kawarimi), ou abattre la source avant l'impact.

import { HorlogeDeJeu } from "../../src/moteur/jeu/horloge";
import { Joueur } from "../../src/moteur/jeu/joueur";
import { Telegraphe } from "../../src/moteur/jeu/telegraphe";
import { Scene } from "../../src/moteur/scene/scene";
import type { Attaque } from "../../src/moteur/types";

const attaque = (a: Partial<Attaque> = {}): Attaque => ({
  id: "coup",
  element: "eau",
  duree: 2,
  degats: 24,
  esquivable: true,
  ...a
});

function sourceVivante(pv = 40) {
  const scene = new Scene();
  const entite = scene.ajouter("zabuza", { pv, vitesse: 0.1 }, 0);
  return { scene, entite };
}

test("un télégraphe progresse de 0 à 1 et arrive au bout de sa durée", () => {
  const { entite } = sourceVivante();
  const tel = new Telegraphe(attaque({ duree: 2 }), entite);
  expect(tel.part).toBe(0);
  expect(tel.arrive).toBe(false);

  tel.avancer(1);
  expect(tel.part).toBeCloseTo(0.5);
  tel.avancer(1);
  expect(tel.arrive).toBe(true);
});

test("Review Focus 1 : un télégraphe lancé avant l'incantation continue d'avancer au ralenti", () => {
  // Entrer en concentration ralentit l'attaque, mais ne la gèle jamais (spec §7.8) :
  // former un jutsu trop long devant un télégraphe déjà parti reste dangereux.
  const { entite } = sourceVivante();
  const tel = new Telegraphe(attaque({ duree: 2 }), entite);
  const horloge = new HorlogeDeJeu({ ralenti: 0.35, transition: 1 });

  tel.avancer(horloge.avancer(0.5, "neutre"));
  const avantConcentration = tel.part;

  tel.avancer(horloge.avancer(1, "concentration"));
  expect(tel.part).toBeGreaterThan(avantConcentration);
  expect(tel.part).toBeLessThan(avantConcentration + 0.5);
});

test("une esquive pendant le télégraphe annule l'attaque", () => {
  const { entite } = sourceVivante();
  const tel = new Telegraphe(attaque(), entite);
  const joueur = new Joueur();

  tel.avancer(1);
  expect(tel.esquiver()).toBe(true);
  tel.avancer(1);

  const r = tel.resoudre(joueur);
  expect(r.issue).toBe("esquivee");
  expect(r.degats).toBe(0);
  expect(joueur.vie).toBe(100);
});

test("une attaque non esquivable refuse l'esquive mais s'encaisse en garde", () => {
  const { entite } = sourceVivante();
  const tel = new Telegraphe(attaque({ esquivable: false, degats: 40 }), entite);
  const joueur = new Joueur();
  joueur.garde = true;

  expect(tel.esquiver()).toBe(false);
  tel.avancer(2);

  const r = tel.resoudre(joueur);
  expect(r.issue).toBe("gardee");
  expect(r.degats).toBeLessThan(20);
});

test("contrer annule toute attaque, même non esquivable", () => {
  const { entite } = sourceVivante();
  const tel = new Telegraphe(attaque({ esquivable: false }), entite);
  const joueur = new Joueur();

  tel.contrer();
  tel.avancer(2);
  expect(tel.resoudre(joueur)).toEqual({ issue: "contree", degats: 0 });
  expect(joueur.vie).toBe(100);
});

test("une attaque de genjutsu envoûte le joueur au lieu de lui retirer de la vie", () => {
  const { entite } = sourceVivante();
  const tel = new Telegraphe(attaque({ genjutsu: true, degats: 0 }), entite);
  const joueur = new Joueur();

  tel.avancer(2);
  const r = tel.resoudre(joueur);
  expect(r.issue).toBe("encaissee");
  expect(joueur.illusion).toBe(true);
  expect(joueur.vie).toBe(100);
});

test("une attaque qui draine du chakra vide aussi la jauge : Kisame", () => {
  const { entite } = sourceVivante();
  const tel = new Telegraphe(attaque({ draineChakra: 35, degats: 20 }), entite);
  const joueur = new Joueur();

  tel.avancer(2);
  tel.resoudre(joueur);
  expect(joueur.chakra).toBe(65);
  expect(joueur.vie).toBe(80);
});

test("si la source meurt avant l'impact, le télégraphe est annulé", () => {
  const { scene, entite } = sourceVivante(20);
  const tel = new Telegraphe(attaque(), entite);
  tel.avancer(1);
  scene.toucher(entite, 30, 100);

  expect(tel.annule).toBe(true);
});
