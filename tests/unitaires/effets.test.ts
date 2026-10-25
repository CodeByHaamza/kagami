// Le contrat d'effet, qui est la bonne idee de la version d'origine : un effet peut se
// dessiner a quatre moments, ce qui lui permet de se glisser entre le decor et la
// personne detouree. On le conserve tel quel, on le type, et on injecte le dictionnaire
// d'effets pour que la classe soit utilisable par n'importe quel pack.

import { Effets } from "../../src/moteur/rendu/effets";
import { Particules } from "../../src/moteur/rendu/particules";
import type { ContexteEffet, Effet, MomentEffet } from "../../src/moteur/types";

const contexte = (temps: number): ContexteEffet => ({
  temps,
  dt: 1 / 60,
  t: 0,
  l: 800,
  h: 600,
  main: { x: 400, y: 380, r: 60 },
  video: {} as CanvasImageSource,
  couverture: null,
  dessinerCadre: () => {},
  secouer: () => {},
  jouer: () => {}
});

const ctx = {} as CanvasRenderingContext2D & { save(): void; restore(): void };
ctx.save = () => {};
ctx.restore = () => {};

describe("Effets", () => {
  test("lancer renvoie la définition et met l'effet dans actifs", () => {
    const feu: Effet = { duree: 2 };
    const effets = new Effets({ feu });

    expect(effets.lancer("feu", contexte(1000))).toBe(feu);
    expect(effets.actifs.map(a => a.nom)).toEqual(["feu"]);
  });

  test("lancer un nom inconnu renvoie null sans jeter", () => {
    const effets = new Effets({});
    expect(effets.lancer("inexistant", contexte(0))).toBeNull();
    expect(effets.actifs).toHaveLength(0);
  });

  test("depart est appelé une fois au lancement, avec un état vide", () => {
    const appels: object[] = [];
    const effets = new Effets({
      feu: { duree: 2, depart: etat => appels.push(etat) }
    });

    effets.lancer("feu", contexte(0));
    expect(appels).toHaveLength(1);
    expect(appels[0]).toEqual({});
  });

  test("appeler n'invoque que le moment demandé", () => {
    const vus: MomentEffet[] = [];
    const effets = new Effets({
      feu: {
        duree: 2,
        fond: () => void vus.push("fond"),
        derriere: () => void vus.push("derriere"),
        personne: () => void vus.push("personne"),
        devant: () => void vus.push("devant")
      }
    });
    effets.lancer("feu", contexte(0));

    effets.appeler("derriere", ctx, contexte(100));
    expect(vus).toEqual(["derriere"]);
  });

  test("appeler renvoie true si un effet a dessiné la personne", () => {
    const effets = new Effets({
      remplace: { duree: 2, personne: () => true },
      passif: { duree: 2, personne: () => undefined }
    });

    effets.lancer("passif", contexte(0));
    expect(effets.appeler("personne", ctx, contexte(10))).toBe(false);

    effets.lancer("remplace", contexte(0));
    expect(effets.appeler("personne", ctx, contexte(10))).toBe(true);
  });

  test("l'état de chaque effet lui est propre et persiste entre les images", () => {
    const effets = new Effets({
      feu: {
        duree: 2,
        depart: etat => {
          etat.compte = 0;
        },
        devant: (_c, _e, etat) => {
          etat.compte += 1;
        }
      }
    });
    effets.lancer("feu", contexte(0));

    effets.appeler("devant", ctx, contexte(10));
    effets.appeler("devant", ctx, contexte(20));
    expect(effets.actifs[0]?.etat.compte).toBe(2);
  });

  test("e.t est le temps écoulé en secondes depuis le début de l'effet", () => {
    const temps: number[] = [];
    const effets = new Effets({ feu: { duree: 5, devant: (_c, e) => void temps.push(e.t) } });
    effets.lancer("feu", contexte(1000));

    effets.appeler("devant", ctx, contexte(1000));
    effets.appeler("devant", ctx, contexte(2500));
    expect(temps).toEqual([0, 1.5]);
  });

  test("avancer retire les effets expirés", () => {
    const effets = new Effets({ court: { duree: 1 }, long: { duree: 10 } });
    effets.lancer("court", contexte(0));
    effets.lancer("long", contexte(0));

    effets.avancer(0.016, 2000);
    expect(effets.actifs.map(a => a.nom)).toEqual(["long"]);
  });

  test("un effet expiré n'est plus appelé", () => {
    let appels = 0;
    const effets = new Effets({ court: { duree: 1, devant: () => void appels++ } });
    effets.lancer("court", contexte(0));

    effets.appeler("devant", ctx, contexte(2000));
    expect(appels).toBe(0);
  });

  test("besoinSilhouette est vrai seulement si un effet actif la demande", () => {
    const effets = new Effets({
      simple: { duree: 5 },
      clone: { duree: 5, silhouette: true }
    });

    effets.lancer("simple", contexte(0));
    expect(effets.besoinSilhouette()).toBe(false);

    effets.lancer("clone", contexte(0));
    expect(effets.besoinSilhouette()).toBe(true);
  });

  test("rompreGenjutsu termine les genjutsus et lance l'effet kai", () => {
    const effets = new Effets({
      tsukuyomi: { duree: 100, genjutsu: true },
      feu: { duree: 100 },
      kai: { duree: 1 }
    });
    effets.lancer("tsukuyomi", contexte(0));
    effets.lancer("feu", contexte(0));
    expect(effets.genjutsuActif()).toBe(true);

    effets.rompreGenjutsu(contexte(500));
    effets.avancer(0.016, 501);

    expect(effets.genjutsuActif()).toBe(false);
    expect(effets.actifs.map(a => a.nom).sort()).toEqual(["feu", "kai"]);
  });
});

describe("Particules", () => {
  const née = (p: Partial<Parameters<Particules["ajouter"]>[0]> = {}) => ({
    x: 0,
    y: 0,
    taille: 10,
    duree: 1,
    ...p
  });

  test("ajouter applique les valeurs par défaut", () => {
    const P = new Particules();
    P.ajouter(née());
    expect(P.liste[0]).toMatchObject({ vx: 0, vy: 0, ay: 0, alpha: 1, mode: "lighter", age: 0 });
  });

  test("avancer déplace la particule selon sa vitesse et la gravité", () => {
    const P = new Particules();
    P.ajouter(née({ vx: 100, vy: 0, ay: 200 }));

    P.avancer(0.5);
    const p = P.liste[0]!;
    expect(p.x).toBeCloseTo(50);
    expect(p.vy).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(50);
    expect(p.age).toBeCloseTo(0.5);
  });

  test("avancer retire les particules dont la durée est écoulée", () => {
    const P = new Particules();
    P.ajouter(née({ duree: 0.5 }));
    P.avancer(0.6);
    expect(P.liste).toHaveLength(0);
  });

  test("avancer retire les particules devenues trop petites", () => {
    const P = new Particules();
    P.ajouter(née({ taille: 10, croissance: -100, duree: 10 }));
    P.avancer(0.5);
    expect(P.liste).toHaveLength(0);
  });

  test("ajouter plafonne le nombre de particules", () => {
    const P = new Particules();
    for (let i = 0; i < 4000; i++) P.ajouter(née());
    expect(P.liste.length).toBeLessThanOrEqual(3001);
  });
});
