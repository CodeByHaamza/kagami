// Le cadrage : la video remplit l'ecran quitte a deborder, et elle est en miroir quand
// la camera est de face. Ces maths etaient melees a l'etat du module dans la version
// d'origine ; sorties en fonctions pures, elles se verifient.

import { BoucleDeRendu, calculerCadre, versEcran } from "../../src/moteur/rendu/cadre";

const fenetre = { l: 800, h: 600 };

test("le cadre couvre la fenêtre en conservant le rapport de la vidéo", () => {
  const cadre = calculerCadre(fenetre, { largeur: 1280, hauteur: 720 }, 1);

  // Math.max : la video deborde plutot que de laisser des bandes noires.
  expect(cadre.echelle).toBeCloseTo(Math.max(800 / 1280, 600 / 720));
  expect(cadre.largeur).toBeGreaterThanOrEqual(fenetre.l);
  expect(cadre.hauteur).toBeGreaterThanOrEqual(fenetre.h);
});

test("le cadre est centré, donc son décalage est négatif ou nul", () => {
  const cadre = calculerCadre(fenetre, { largeur: 1280, hauteur: 720 }, 1);

  expect(cadre.x).toBeLessThanOrEqual(0);
  expect(cadre.y).toBeLessThanOrEqual(0);
  expect(cadre.x).toBeCloseTo((fenetre.l - cadre.largeur) / 2);
  expect(cadre.y).toBeCloseTo((fenetre.h - cadre.hauteur) / 2);
});

test("une vidéo de taille 0 renvoie un cadre neutre, sans NaN", () => {
  // Review Focus 3 : au premier rendu, videoWidth vaut 0 tant que readyState < 2.
  // La version d'origine divisait par ces valeurs.
  const cadre = calculerCadre(fenetre, { largeur: 0, hauteur: 0 }, 1);

  for (const valeur of Object.values(cadre)) expect(Number.isFinite(valeur)).toBe(true);
  expect(cadre.echelle).toBe(1);
  expect(cadre.largeur).toBe(fenetre.l);
  expect(cadre.hauteur).toBe(fenetre.h);
});

test("un changement de taille de vidéo recalcule l'échelle", () => {
  // Review Focus 5 : on bascule de la camera frontale vers la camera arriere en
  // pleine partie, et les dimensions changent.
  const avant = calculerCadre(fenetre, { largeur: 1280, hauteur: 720 }, 1);
  const apres = calculerCadre(fenetre, { largeur: 640, hauteur: 480 }, 1);

  expect(apres.echelle).not.toBeCloseTo(avant.echelle);
  expect(apres.echelle).toBeCloseTo(Math.max(800 / 640, 600 / 480));
});

test("la densité de pixels agrandit le canvas sans changer les coordonnées CSS", () => {
  const simple = calculerCadre(fenetre, { largeur: 1280, hauteur: 720 }, 1);
  const retina = calculerCadre(fenetre, { largeur: 1280, hauteur: 720 }, 2);

  expect(retina.toileLargeur).toBe(simple.toileLargeur * 2);
  expect(retina.toileHauteur).toBe(simple.toileHauteur * 2);
  // on dessine ensuite en pixels CSS : le reste du cadre ne bouge pas
  expect(retina.echelle).toBeCloseTo(simple.echelle);
  expect(retina.x).toBeCloseTo(simple.x);
});

test("versEcran inverse l'axe X en caméra frontale", () => {
  const cadre = calculerCadre(fenetre, { largeur: 1280, hauteur: 720 }, 1);
  const video = { largeur: 1280 };

  const gauche = versEcran(cadre, video, true, 0, 100);
  const droite = versEcran(cadre, video, true, 1280, 100);

  expect(gauche.x).toBeGreaterThan(droite.x);
  expect(gauche.y).toBeCloseTo(droite.y);
});

test("versEcran n'inverse pas l'axe X avec la caméra arrière", () => {
  const cadre = calculerCadre(fenetre, { largeur: 1280, hauteur: 720 }, 1);
  const video = { largeur: 1280 };

  const gauche = versEcran(cadre, video, false, 0, 100);
  const droite = versEcran(cadre, video, false, 1280, 100);

  expect(gauche.x).toBeLessThan(droite.x);
});

test("versEcran place le centre de la vidéo au centre de l'écran", () => {
  const cadre = calculerCadre(fenetre, { largeur: 1280, hauteur: 720 }, 1);
  const centre = versEcran(cadre, { largeur: 1280 }, false, 640, 360);

  expect(centre.x).toBeCloseTo(fenetre.l / 2);
  expect(centre.y).toBeCloseTo(fenetre.h / 2);
});

describe("BoucleDeRendu", () => {
  /** Un ordonnanceur manuel : on avance image par image, sans requestAnimationFrame. */
  function ordonnanceurManuel() {
    let suite: ((temps: number) => void) | null = null;
    return {
      planifier: (cb: (temps: number) => void) => {
        suite = cb;
      },
      annuler: () => {
        suite = null;
      },
      image(temps: number) {
        const cb = suite;
        suite = null;
        cb?.(temps);
      },
      get enCours() {
        return suite !== null;
      }
    };
  }

  test("le dt est plafonné pour qu'un onglet en arrière-plan ne fasse pas sauter les effets", () => {
    const o = ordonnanceurManuel();
    const dts: number[] = [];
    const boucle = new BoucleDeRendu(dt => dts.push(dt), o);

    boucle.demarrer(0);
    o.image(16.7); // une image normale
    o.image(10_000); // retour d'arriere-plan : 10 secondes d'un coup

    expect(dts[0]).toBeCloseTo(0.0167, 3);
    expect(dts[1]).toBe(0.05);
  });

  test("arrêter empêche l'image suivante", () => {
    const o = ordonnanceurManuel();
    let images = 0;
    const boucle = new BoucleDeRendu(() => images++, o);

    boucle.demarrer(0);
    o.image(16.7);
    boucle.arreter();

    expect(o.enCours).toBe(false);
    expect(images).toBe(1);
  });

  test("la secousse la plus forte de l'image gagne, puis retombe", () => {
    const o = ordonnanceurManuel();
    const forces: number[] = [];
    const boucle = new BoucleDeRendu(() => forces.push(boucle.prendreSecousse()), o);

    boucle.demarrer(0);
    boucle.secouer(5);
    boucle.secouer(12);
    boucle.secouer(3);
    o.image(16.7);
    o.image(33.4);

    expect(forces[0]).toBe(12);
    expect(forces[1]).toBe(0);
  });
});
