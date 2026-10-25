// Le test le plus rentable du portage : il lance les 52 effets et les fait tourner.
//
// Un portage de ~1 100 lignes de dessin canvas ne se relit pas a l'oeil. Ce qu'on peut
// verifier, c'est qu'aucun effet ne jette et qu'aucun ne produit de NaN : c'est ce qui
// attrape les vraies regressions d'un portage mecanique.
//
// Le contexte 2D est un espion, pas un vrai canvas : on ne teste pas le rendu (cout
// eleve, valeur faible), on teste que le code s'execute de bout en bout.

import { Effets } from "../../src/moteur/rendu/effets";
import type { Contexte2D, ContexteEffet, MomentEffet } from "../../src/moteur/types";
import { EFFETS_NARUTO } from "../../src/packs/naruto/effets";
import { JUTSUS } from "../../src/packs/naruto/donnees/jutsus";

const MOMENTS: readonly MomentEffet[] = ["fond", "derriere", "personne", "devant"];

/** Un contexte 2D qui accepte tout et ne dessine rien. */
function contexteEspion(): Contexte2D {
  const degrade = { addColorStop: () => {} };
  const etat: Record<string | symbol, unknown> = {};

  const proxy = new Proxy(etat, {
    get(cible, prop) {
      if (prop === "canvas") return { width: 640, height: 480 };
      if (prop === "createRadialGradient" || prop === "createLinearGradient") return () => degrade;
      if (prop === "createPattern") return () => null;
      if (prop === "measureText") return () => ({ width: 42 });
      if (prop === "getImageData") {
        return () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 });
      }
      if (prop in cible) return cible[prop];
      return () => undefined;
    },
    set(cible, prop, valeur) {
      cible[prop] = valeur;
      return true;
    }
  });
  return proxy as unknown as Contexte2D;
}

/** Une image factice : les effets ne font que la passer a drawImage. */
const image = { width: 640, height: 480 } as unknown as CanvasImageSource;

function contexte(temps: number): ContexteEffet {
  return {
    temps,
    dt: 1 / 60,
    t: 0,
    l: 640,
    h: 480,
    main: { x: 320, y: 300, r: 70 },
    video: image,
    personne: image,
    couverture: () => image,
    dessinerCadre: () => {},
    secouer: () => {},
    jouer: () => {}
  };
}

// sprite() et les effets fabriquent des canvas hors ecran ; Node n'en a pas.
beforeAll(() => {
  class ToileFactice {
    width: number;
    height: number;
    constructor(l = 1, h = 1) {
      this.width = l;
      this.height = h;
    }
    getContext(): Contexte2D {
      return contexteEspion();
    }
  }
  vi.stubGlobal("OffscreenCanvas", ToileFactice);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

test("chaque effet référencé par un jutsu existe dans EFFETS_NARUTO", () => {
  const manquants = JUTSUS.map(j => j.effet).filter(nom => !(nom in EFFETS_NARUTO));
  expect(manquants).toEqual([]);
});

test("aucun effet défini n'est orphelin", () => {
  // L'inverse : un effet que plus aucun jutsu ne reference est du code mort.
  const references = new Set<string>(JUTSUS.map(j => j.effet));
  references.add("kai"); // joue a la rupture d'illusion, sans jutsu attitre
  const orphelins = Object.keys(EFFETS_NARUTO).filter(nom => !references.has(nom));
  expect(orphelins).toEqual([]);
});

test("aucun effet n'a une durée nulle ou négative", () => {
  const fautifs = Object.entries(EFFETS_NARUTO)
    .filter(([, def]) => !(def.duree > 0))
    .map(([nom]) => nom);
  expect(fautifs).toEqual([]);
});

test("chaque effet qui déclare rasengan3d a bien un son", () => {
  const muets = Object.entries(EFFETS_NARUTO)
    .filter(([, def]) => def.rasengan3d && !def.son)
    .map(([nom]) => nom);
  expect(muets).toEqual([]);
});

describe("les effets tournent 60 images sans jeter", () => {
  for (const [nom, def] of Object.entries(EFFETS_NARUTO)) {
    test(nom, () => {
      const effets = new Effets(EFFETS_NARUTO);
      const ctx = contexteEspion();

      expect(effets.lancer(nom, contexte(1000))).toBe(def);

      for (let image = 0; image < 60; image++) {
        const e = contexte(1000 + image * 16.7);
        for (const moment of MOMENTS) effets.appeler(moment, ctx, e);
        effets.dessinerParticules(ctx);
        effets.avancer(1 / 60, e.temps);
      }

      const fautives = effets.particules.liste.filter(
        p => !Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.taille)
      );
      expect(fautives).toEqual([]);
    });
  }
});
