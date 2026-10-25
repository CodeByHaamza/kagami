// L'ordonnanceur : qui écoute quoi, et quand.
//
// C'est la règle qui fait d'une pierre deux coups. Elle libère du temps machine — trois
// modèles ne peuvent pas tourner à pleine cadence ensemble — et elle lève l'ambiguïté
// entre un signe et un coup, puisque les deux se font avec les mains.

import { Ordonnanceur } from "../../src/moteur/entree/ordonnanceur";
import { MachineAPostures } from "../../src/moteur/corps/postures";
import { REPERE } from "../../src/moteur/corps/posture";
import type { JetonCorps } from "../../src/moteur/corps/gestes";
import type { Point3, Posture } from "../../src/moteur/types";

const P = (x: number, y: number, visibilite = 0.95): Point3 => ({ x, y, z: 0, visibilite });

type Corps = Partial<Record<keyof typeof REPERE, Point3>>;

const REPOS: Record<keyof typeof REPERE, Point3> = {
  nez: P(0.5, 0.15),
  epauleG: P(0.4, 0.3), epauleD: P(0.6, 0.3),
  coudeG: P(0.38, 0.45), coudeD: P(0.62, 0.45),
  poignetG: P(0.37, 0.6), poignetD: P(0.63, 0.6),
  hancheG: P(0.44, 0.6), hancheD: P(0.56, 0.6),
  genouG: P(0.44, 0.78), genouD: P(0.56, 0.78),
  chevilleG: P(0.44, 0.95), chevilleD: P(0.56, 0.95)
};

function corps(remplacements: Corps = {}, horodatage = 0): Posture {
  const points: Point3[] = Array.from({ length: 33 }, () => P(0, 0, 0.1));
  for (const [nom, indice] of Object.entries(REPERE)) {
    const cle = nom as keyof typeof REPERE;
    points[indice] = remplacements[cle] ?? REPOS[cle];
  }
  return { horodatage, points };
}

const CONCENTRATION: Corps = { poignetG: P(0.48, 0.4), poignetD: P(0.52, 0.4) };
const COMBAT: Corps = {
  poignetG: P(0.46, 0.19), poignetD: P(0.54, 0.19),
  coudeG: P(0.44, 0.37), coudeD: P(0.56, 0.37)
};

/** Monte un ordonnanceur dont toutes les pièces sont observables. */
function monter() {
  const appels = { signes: 0, posture: 0 };
  const gestes: JetonCorps[] = [];
  const jetons: unknown[] = [];
  let horloge = 0;

  const o = new Ordonnanceur({
    maintenant: () => horloge,
    lirePosture: () => {
      appels.posture++;
      return corps(pose, horloge);
    },
    reconnaitreSigne: () => {
      appels.signes++;
      return Promise.resolve(null);
    },
    lireGeste: () => {
      const g = prochainGeste;
      prochainGeste = null;
      return g;
    },
    machine: new MachineAPostures({ tenue: 200 }),
    surGeste: g => gestes.push(g),
    surJeton: j => jetons.push(j)
  });

  let pose: Corps = {};
  let prochainGeste: JetonCorps | null = null;

  return {
    appels,
    gestes,
    jetons,
    ordonnanceur: o,
    poser(c: Corps) {
      pose = c;
    },
    /** Le lecteur de gestes rendra ce jeton à la prochaine image où il est consulté. */
    geste(g: JetonCorps | null) {
      prochainGeste = g;
    },
    /** Fait tourner l'ordonnanceur pendant `duree` ms, à 60 images par seconde. */
    async tourner(duree: number) {
      const fin = horloge + duree;
      while (horloge < fin) {
        horloge += 1000 / 60;
        await o.image();
      }
    }
  };
}

test("le reconnaisseur de signes ne tourne qu'en posture de concentration", async () => {
  const b = monter();

  b.poser(COMBAT);
  await b.tourner(600);
  const enCombat = b.appels.signes;

  b.poser(CONCENTRATION);
  await b.tourner(600);

  expect(enCombat).toBe(0);
  expect(b.appels.signes).toBeGreaterThan(0);
});

test("le lecteur de posture tourne dans les deux postures", async () => {
  // Il est prioritaire : c'est lui qui porte l'esquive et la garde, qui doivent être
  // immédiates.
  const b = monter();

  b.poser(COMBAT);
  await b.tourner(400);
  const enCombat = b.appels.posture;

  b.poser(CONCENTRATION);
  await b.tourner(400);

  expect(enCombat).toBeGreaterThan(0);
  expect(b.appels.posture).toBeGreaterThan(enCombat);
});

test("les gestes ne comptent qu'en posture de combat", async () => {
  const b = monter();

  // le lecteur de gestes voit un direct, mais on est en train d'incanter
  b.poser(CONCENTRATION);
  await b.tourner(400);
  b.geste("directG");
  await b.tourner(100);
  expect(b.gestes).toEqual([]);

  // le même geste, en combat cette fois
  b.geste(null);
  b.poser(COMBAT);
  await b.tourner(400);
  b.geste("directG");
  await b.tourner(100);
  expect(b.gestes).toEqual(["directG"]);
});

test("basculer en combat au milieu d'un enchaînement vide la séquence", async () => {
  // Review Focus 4 : lever les mains pour se défendre doit annuler proprement. Sinon
  // l'enchaînement reprendrait plus tard en plein milieu, et un jutsu partirait seul.
  const b = monter();
  b.poser(CONCENTRATION);
  await b.tourner(600);

  const vide = [] as string[];
  b.ordonnanceur.surViderSequence = () => vide.push("vide");

  b.poser(COMBAT);
  await b.tourner(600);

  expect(vide).toEqual(["vide"]);
});

test("revenir en concentration ne ressuscite pas l'enchaînement abandonné", async () => {
  const b = monter();
  const vidages: string[] = [];

  b.poser(CONCENTRATION);
  await b.tourner(600);
  b.ordonnanceur.surViderSequence = () => vidages.push("vide");

  b.poser(COMBAT);
  await b.tourner(600);
  b.poser(CONCENTRATION);
  await b.tourner(600);

  // une fois en entrant en combat, une fois en revenant : on repart toujours de zéro
  expect(vidages).toHaveLength(2);
});

test("arrêter coupe tout", async () => {
  const b = monter();
  b.poser(CONCENTRATION);
  await b.tourner(400);

  b.ordonnanceur.arreter();
  const avant = { ...b.appels };
  await b.tourner(400);

  expect(b.appels).toEqual(avant);
});
