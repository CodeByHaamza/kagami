// Les jetons corporels : frappe, garde, lancer, rotation, saut, esquive.
//
// Le risque ici n'est pas de rater un geste, c'est d'en voir partout. Un jeu de gestes
// qui se déclenche quand on se gratte est insupportable — plus qu'un jeu qui demande
// d'appuyer deux fois. Les tests ci-dessous pèsent autant du côté du silence que de la
// détection : la moitié d'entre eux vérifient que *rien* ne se passe.

import { LecteurDeGestes } from "../../src/moteur/corps/gestes";
import type { JetonCorps } from "../../src/moteur/corps/gestes";
import { REPERE } from "../../src/moteur/corps/posture";
import type { Point3, Posture } from "../../src/moteur/types";

const P = (x: number, y: number, visibilite = 0.95): Point3 => ({ x, y, z: 0, visibilite });

type Corps = Partial<Record<keyof typeof REPERE, Point3>>;

const REPOS: Record<keyof typeof REPERE, Point3> = {
  nez: P(0.5, 0.15),
  epauleG: P(0.4, 0.3),
  epauleD: P(0.6, 0.3),
  coudeG: P(0.38, 0.45),
  coudeD: P(0.62, 0.45),
  poignetG: P(0.39, 0.42),
  poignetD: P(0.61, 0.42),
  hancheG: P(0.44, 0.6),
  hancheD: P(0.56, 0.6),
  genouG: P(0.44, 0.78),
  genouD: P(0.56, 0.78),
  chevilleG: P(0.44, 0.95),
  chevilleD: P(0.56, 0.95)
};

function corps(remplacements: Corps = {}, horodatage = 0): Posture {
  const points: Point3[] = Array.from({ length: 33 }, () => P(0, 0, 0.1));
  for (const [nom, indice] of Object.entries(REPERE)) {
    const cle = nom as keyof typeof REPERE;
    points[indice] = remplacements[cle] ?? REPOS[cle];
  }
  return { horodatage, points };
}

/** Joue une suite de postures et rend tous les jetons produits. */
function jouer(
  lecteur: LecteurDeGestes,
  images: readonly { corps: Corps; t: number }[]
): JetonCorps[] {
  const sortis: JetonCorps[] = [];
  for (const i of images) {
    const j = lecteur.observer(corps(i.corps, i.t), i.t);
    if (j) sortis.push(j);
  }
  return sortis;
}

/** Interpole entre deux poses, sur `duree` millisecondes à 60 images par seconde. */
function mouvement(depart: Corps, arrivee: Corps, duree: number, depuis = 0) {
  const images: { corps: Corps; t: number }[] = [];
  const pas = 1000 / 60;
  for (let t = 0; t <= duree; t += pas) {
    const part = duree ? t / duree : 1;
    const c: Corps = {};
    for (const nom of new Set([...Object.keys(depart), ...Object.keys(arrivee)])) {
      const cle = nom as keyof typeof REPERE;
      const a = depart[cle] ?? REPOS[cle];
      const b = arrivee[cle] ?? REPOS[cle];
      c[cle] = P(a.x + (b.x - a.x) * part, a.y + (b.y - a.y) * part);
    }
    images.push({ corps: c, t: depuis + t });
  }
  return images;
}

/** Reste immobile au repos, assez longtemps pour relâcher les verrous. */
const repos = (duree: number, depuis = 0) => mouvement({}, {}, duree, depuis);

// ---- les frappes ----

const BRAS_REPLIE: Corps = { coudeG: P(0.36, 0.42), poignetG: P(0.44, 0.33) };
const BRAS_TENDU: Corps = { coudeG: P(0.28, 0.33), poignetG: P(0.14, 0.3) };

test("un bras qui se déplie vite donne un direct", () => {
  const lecteur = new LecteurDeGestes();
  const sortis = jouer(lecteur, mouvement(BRAS_REPLIE, BRAS_TENDU, 150));

  expect(sortis).toContain("directG");
});

test("le direct distingue la gauche de la droite", () => {
  const droite = jouer(
    new LecteurDeGestes(),
    mouvement(
      { coudeD: P(0.64, 0.42), poignetD: P(0.56, 0.33) },
      { coudeD: P(0.72, 0.33), poignetD: P(0.86, 0.3) },
      150
    )
  );

  expect(droite).toContain("directD");
  expect(droite).not.toContain("directG");
});

test("un mouvement lent ne déclenche aucune frappe", () => {
  // Review Focus 3 : le même déplacement, étalé sur deux secondes. Se gratter, boire,
  // régler sa chaise — rien de tout ça ne doit lancer un taijutsu.
  const lecteur = new LecteurDeGestes();
  const sortis = jouer(lecteur, mouvement(BRAS_REPLIE, BRAS_TENDU, 2000));

  expect(sortis).not.toContain("directG");
});

test("une frappe ne se redéclenche pas bras tendu immobile", () => {
  // Sans verrou, un bras laissé tendu pulserait à chaque image.
  const lecteur = new LecteurDeGestes();
  const sortis = jouer(lecteur, [
    ...mouvement(BRAS_REPLIE, BRAS_TENDU, 150),
    ...mouvement(BRAS_TENDU, BRAS_TENDU, 1500, 150)
  ]);

  expect(sortis.filter(j => j === "directG")).toHaveLength(1);
});

test("deux frappes séparées par un retour au repos en donnent deux", () => {
  const lecteur = new LecteurDeGestes();
  const sortis = jouer(lecteur, [
    ...mouvement(BRAS_REPLIE, BRAS_TENDU, 150),
    ...mouvement(BRAS_TENDU, BRAS_REPLIE, 200, 150),
    ...repos(250, 350),
    ...mouvement(BRAS_REPLIE, BRAS_TENDU, 150, 600)
  ]);

  expect(sortis.filter(j => j === "directG")).toHaveLength(2);
});

// ---- les autres gestes ----

const GARDE: Corps = {
  poignetG: P(0.46, 0.19), poignetD: P(0.54, 0.19),
  coudeG: P(0.44, 0.37), coudeD: P(0.56, 0.37)
};

test("une garde tenue donne le jeton garde, une seule fois", () => {
  const lecteur = new LecteurDeGestes();
  const sortis = jouer(lecteur, [...mouvement(GARDE, GARDE, 600)]);

  expect(sortis.filter(j => j === "garde")).toHaveLength(1);
});

test("un lancer part du bras armé au-dessus de l'épaule", () => {
  // Bras replié, poignet derrière la tête, puis détente vers l'avant. C'est le fait
  // de partir de haut avec un fouet descendant qui distingue un lancer d'un direct.
  const lecteur = new LecteurDeGestes();
  const sortis = jouer(
    lecteur,
    mouvement(
      { coudeD: P(0.74, 0.24), poignetD: P(0.56, 0.16) },
      { coudeD: P(0.74, 0.33), poignetD: P(0.9, 0.38) },
      180
    )
  );

  expect(sortis).toContain("lancer");
  expect(sortis).not.toContain("directD");
});

test("un lancer fonctionne aussi avec le bras gauche", () => {
  const lecteur = new LecteurDeGestes();
  const sortis = jouer(
    lecteur,
    mouvement(
      { coudeG: P(0.26, 0.24), poignetG: P(0.44, 0.16) },
      { coudeG: P(0.26, 0.33), poignetG: P(0.1, 0.38) },
      180
    )
  );

  expect(sortis).toContain("lancer");
  expect(sortis).not.toContain("directG");
});

test("tendre le bras sans mouvement descendant ne déclenche pas un lancer intempestif", () => {
  // Le poignet part haut mais reste à la même hauteur : c'est une détente droite/direct, pas un lancer de shuriken.
  const lecteur = new LecteurDeGestes();
  const sortis = jouer(
    lecteur,
    mouvement(
      { coudeD: P(0.7, 0.24), poignetD: P(0.6, 0.2) },
      { coudeD: P(0.8, 0.24), poignetD: P(0.95, 0.2) },
      150
    )
  );

  expect(sortis).not.toContain("lancer");
});

test("une rotation rapide des épaules donne rotation", () => {
  const lecteur = new LecteurDeGestes();
  const sortis = jouer(
    lecteur,
    mouvement(
      { epauleG: P(0.4, 0.3), epauleD: P(0.6, 0.3) },
      { epauleG: P(0.6, 0.3), epauleD: P(0.4, 0.3) },
      220
    )
  );

  expect(sortis).toContain("rotation");
});

test("un saut est détecté par la montée des hanches", () => {
  const lecteur = new LecteurDeGestes();
  const sortis = jouer(
    lecteur,
    mouvement({}, { hancheG: P(0.44, 0.46), hancheD: P(0.56, 0.46) }, 200)
  );

  expect(sortis).toContain("saut");
});

test("un déplacement latéral franc du torse donne une esquive, du bon côté", () => {
  const versLaGauche = jouer(
    new LecteurDeGestes(),
    mouvement(
      {},
      {
        epauleG: P(0.22, 0.3), epauleD: P(0.42, 0.3),
        hancheG: P(0.26, 0.6), hancheD: P(0.38, 0.6)
      },
      200
    )
  );

  expect(versLaGauche).toContain("esquiveG");
  expect(versLaGauche).not.toContain("esquiveD");
});

// ---- le silence ----

test("un corps au repos ne produit aucun geste sur une seconde", () => {
  // Le test qui attrape les seuils trop bas. S'il échoue, le jeu est injouable.
  const lecteur = new LecteurDeGestes();

  expect(jouer(lecteur, repos(1000))).toEqual([]);
});

test("aucun geste sur une posture non fiable, quel que soit le mouvement", () => {
  // Review Focus 2 : personne devant la caméra, ou à moitié hors cadre. Le modèle
  // rend alors des points inventés qui s'agitent.
  const flou = (c: Corps): Corps =>
    Object.fromEntries(
      Object.entries({ ...REPOS, ...c }).map(([n, p]) => [n, P(p.x, p.y, 0.15)])
    ) as Corps;

  const lecteur = new LecteurDeGestes();
  const sortis = jouer(
    lecteur,
    mouvement(BRAS_REPLIE, BRAS_TENDU, 150).map(i => ({ ...i, corps: flou(i.corps) }))
  );

  expect(sortis).toEqual([]);
});

test("une posture absente n'émet rien et ne casse rien", () => {
  const lecteur = new LecteurDeGestes();

  expect(lecteur.observer(null, 0)).toBeNull();
  expect(lecteur.observer(null, 100)).toBeNull();
});
