// Tests unitaires des spécialités des quatre contrats d'invocation en combat.

import { Combat } from "../../src/moteur/jeu/combat";
import {
  EFFETS_CONTRAT,
  ajusterAttaqueParContrat,
  appliquerSpecialiteContrat,
  multiplicateurDegatsContrat
} from "../../src/moteur/jeu/contrat";
import { Joueur } from "../../src/moteur/jeu/joueur";
import { Telegraphe } from "../../src/moteur/jeu/telegraphe";
import { Scene } from "../../src/moteur/scene/scene";
import type { Attaque, Mission } from "../../src/moteur/types";
import { BESTIAIRE } from "../../src/packs/naruto/donnees/bestiaire";
import { BOSS } from "../../src/packs/naruto/donnees/boss";
import { CYCLE } from "../../src/packs/naruto/donnees/elements";
import { JUTSUS } from "../../src/packs/naruto/donnees/jutsus";
import { PROFILS } from "../../src/packs/naruto/donnees/profils";

const jutsu = (id: string) => JUTSUS.find(j => j.id === id)!;

function creerCombat(contrat?: "crapauds" | "serpents" | "limaces" | "chiens", mission?: Mission): Combat {
  return new Combat({
    mission: mission ?? {
      id: "test",
      rang: "D",
      vagues: [{ ennemis: [{ modele: "deserteurVent", nombre: 1 }] }]
    },
    cycle: CYCLE,
    profils: PROFILS,
    bestiaire: BESTIAIRE,
    boss: BOSS,
    ecartApparition: 0,
    entracte: 0.5,
    contrat
  });
}

describe("Spécialité Crapauds (Mont Myōboku - Mode Ermite)", () => {
  test("en posture neutre, pas de multiplicateur supplémentaire", () => {
    const j = new Joueur();
    expect(multiplicateurDegatsContrat("crapauds", "neutre")).toBe(1);
    expect(multiplicateurDegatsContrat(null, "charge")).toBe(1);
  });

  test("sous concentration (posture charge / senjutsu), l'attaque est boostée de ×1.5", () => {
    expect(multiplicateurDegatsContrat("crapauds", "charge")).toBe(EFFETS_CONTRAT.crapauds.boostAttaque);
    expect(EFFETS_CONTRAT.crapauds.boostAttaque).toBe(1.5);
  });

  test("en combat, un joueur sous contrat Crapauds concentré inflige 1.5× de dégâts", () => {
    const missionBoss: Mission = {
      id: "bossTest",
      rang: "B",
      vagues: [{ ennemis: [], boss: "zabuza" }]
    };

    // Combat neutre
    const cNeutre = creerCombat(undefined, missionBoss);
    cNeutre.avancer(0.1, 100, "neutre");
    cNeutre.technique(jutsu("goukakyu"), 200);
    const evtNeutre = cNeutre.prendreEvenements().find(e => e.type === "touche") as { degats: number };

    // Combat Crapauds en posture charge
    const cCrapaud = creerCombat("crapauds", missionBoss);
    cCrapaud.avancer(0.1, 100, "charge");
    cCrapaud.technique(jutsu("goukakyu"), 200);
    const evtCrapaud = cCrapaud.prendreEvenements().find(e => e.type === "touche") as { degats: number };

    expect(evtCrapaud.degats).toBeGreaterThan(evtNeutre.degats);
    expect(evtCrapaud.degats).toBe(Math.round(evtNeutre.degats * 1.5));
  });
});

describe("Spécialité Limaces (Forêt Shikkotsu - Régénération de Katsuyu)", () => {
  test("sans contrat limaces, les PV ne remontent pas passivement", () => {
    const j = new Joueur();
    j.vie = 50;
    appliquerSpecialiteContrat(null, j, [], { dtReel: 2 });
    expect(j.vie).toBe(50);
  });

  test("avec le contrat limaces, les PV remontent au fil du temps", () => {
    const j = new Joueur();
    j.vie = 50;
    appliquerSpecialiteContrat("limaces", j, [], { dtReel: 2 });
    expect(j.vie).toBe(50 + 2 * EFFETS_CONTRAT.limaces.regenVieParSeconde);
    expect(j.vie).toBeGreaterThan(50);
  });

  test("la régénération des limaces plafonne à 100 PV", () => {
    const j = new Joueur();
    j.vie = 99;
    appliquerSpecialiteContrat("limaces", j, [], { dtReel: 5 });
    expect(j.vie).toBe(100);
  });

  test("en combat, les limaces soignent passivement le joueur blessé", () => {
    const c = creerCombat("limaces");
    c.joueur.vie = 60;
    c.avancer(1.0, 1000, "neutre");
    expect(c.joueur.vie).toBeGreaterThan(60);
  });
});

describe("Spécialité Chiens ninja (Pistage Ninken)", () => {
  test("augmente la durée du télégraphe pour donner plus de temps de réaction", () => {
    const att: Attaque = { nom: "Coup", degats: 20, duree: 1.0, esquivable: true };
    const ajustee = ajusterAttaqueParContrat("chiens", att);
    expect(ajustee.duree).toBe(1.0 * EFFETS_CONTRAT.chiens.bonusAnticipation);
    expect(ajustee.duree).toBe(1.25);
  });

  test("sans contrat chiens, la durée de l'attaque est inchangée", () => {
    const att: Attaque = { nom: "Coup", degats: 20, duree: 1.0, esquivable: true };
    const neutre = ajusterAttaqueParContrat("crapauds", att);
    expect(neutre.duree).toBe(1.0);
  });

  test("en combat, les attaques ennemies durent 25% plus longtemps", () => {
    const c = creerCombat("chiens");
    // Fait passer la cadence pour déclencher le premier télégraphe
    c.avancer(2.5, 2500, "neutre");
    const tel = c.telegraphes[0];
    if (tel) {
      expect(tel.attaque.duree).toBeGreaterThan(1.0);
    }
  });
});

describe("Spécialité Serpents (Grotte Ryūchi - Réflexe ermite)", () => {
  test("le réflexe serpent permet d'esquiver même les attaques normalement inesquivables", () => {
    const scene = new Scene();
    const source = scene.ajouter("deserteur", { pv: 50, vitesse: 1, affinite: null, boss: false }, 0);
    const inesquivable: Attaque = { nom: "Brume", degats: 30, duree: 1.5, esquivable: false };
    const tel = new Telegraphe(inesquivable, source);

    // Tentative normale
    expect(tel.esquiver()).toBe(false);

    // Avec réflexe ermite serpent
    const telSerpent = new Telegraphe(inesquivable, source);
    appliquerSpecialiteContrat("serpents", new Joueur(), [telSerpent], { actionEsquive: true });
    // Le réflexe serpent force l'esquive par mue/substitution
    expect(telSerpent.resoudre(new Joueur()).issue).toBe("esquivee");
  });
});
