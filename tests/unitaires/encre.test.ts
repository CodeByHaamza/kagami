// Les silhouettes à l'encre et le rendu de la scène.
//
// Même principe que `effets-naruto.test.ts` : on fait tourner chaque silhouette 60
// images dans les quatre états (apparition, télégraphe, touché, mort) sur un contexte 2D
// espion, et on vérifie qu'aucune ne jette et que la scène dessine du fond vers l'avant.

import { Telegraphe } from "../../src/moteur/jeu/telegraphe";
import { dessinerScene } from "../../src/moteur/rendu/scene";
import { Scene, type EtatEntite } from "../../src/moteur/scene/scene";
import type { Contexte2D } from "../../src/moteur/types";
import { BESTIAIRE } from "../../src/packs/naruto/donnees/bestiaire";
import { BOSS } from "../../src/packs/naruto/donnees/boss";
import { DESSINS_ENCRE } from "../../src/packs/naruto/effets/encre";

const ETATS: readonly EtatEntite[] = ["apparition", "approche", "telegraphe", "touche", "mort"];

function contexteEspion(): { ctx: Contexte2D; textes: string[] } {
  const degrade = { addColorStop: () => {} };
  const textes: string[] = [];
  const etat: Record<string | symbol, unknown> = {};

  const proxy = new Proxy(etat, {
    get(cible, prop) {
      if (prop === "canvas") return { width: 640, height: 480 };
      if (prop === "createRadialGradient" || prop === "createLinearGradient") return () => degrade;
      if (prop === "fillText" || prop === "strokeText") {
        return (t: string) => {
          textes.push(String(t));
        };
      }
      if (prop in cible) return cible[prop];
      return () => undefined;
    },
    set(cible, prop, valeur) {
      cible[prop] = valeur;
      return true;
    }
  });
  return { ctx: proxy as unknown as Contexte2D, textes };
}

test("chaque modèle du bestiaire et des boss a un dessin à l'encre", () => {
  const modeles = [...Object.keys(BESTIAIRE), ...Object.keys(BOSS)];
  const manquants = modeles.filter(m => !(m in DESSINS_ENCRE));
  expect(manquants).toEqual([]);
});

describe("chaque silhouette tourne dans tous ses états sans jeter", () => {
  for (const [modele, dessiner] of Object.entries(DESSINS_ENCRE)) {
    test(modele, () => {
      const { ctx } = contexteEspion();
      for (const etat of ETATS) {
        for (let i = 0; i < 12; i++) {
          dessiner(
            ctx,
            { modele, etat, pv: 30, pvMax: 50, boss: modele in BOSS },
            320,
            260,
            110,
            i * 0.05
          );
        }
      }
    });
  }
});

test("dessinerScene trie du fond vers l'avant et affiche le nom de l'élément en clair", () => {
  const scene = new Scene();
  const devant = scene.ajouter("zabuza", { pv: 100, vitesse: 0.1, profondeur: 0.8, boss: true }, 0);
  const fond = scene.ajouter("zetsu", { pv: 28, vitesse: 0.1, profondeur: 0.2 }, 0);

  const ordre: string[] = [];
  const dessins = {
    zabuza: () => ordre.push("zabuza"),
    zetsu: () => ordre.push("zetsu")
  };

  const tel = new Telegraphe(
    { id: "suiryuudan", element: "eau", duree: 2, degats: 28, esquivable: false },
    devant
  );
  tel.avancer(1);

  const { ctx, textes } = contexteEspion();
  dessinerScene(ctx, {
    scene,
    telegraphes: [tel],
    dessins,
    largeur: 640,
    hauteur: 480,
    temps: 1000,
    nomElement: el => (el === "eau" ? "的水 · Eau" : "")
  });

  // `fond` est plus loin que `devant` : il est peint en premier, pour que `devant` le recouvre.
  expect(ordre).toEqual(["zetsu", "zabuza"]);
  expect(fond.profondeur).toBeLessThan(devant.profondeur);
  // Anti-objectif §4 et §9.6 : jamais de kanji seul sur un télégraphe.
  expect(textes.some(t => t.includes("Eau"))).toBe(true);
});
