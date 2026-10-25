// Les deux postures.
//
// C'est la mécanique centrale du plan. Elle résout un problème technique — les mains
// servent à la fois aux signes et aux coups — mais elle le résout avec la règle de
// l'œuvre : former des sceaux prend du temps et laisse ouvert. C'est précisément pour
// ça que les ninjas s'interrompent mutuellement en pleine incantation.

import { MachineAPostures } from "../../src/moteur/corps/postures";
import type { Attitude } from "../../src/moteur/corps/postures";
import { REPERE } from "../../src/moteur/corps/posture";
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

/** Mains jointes devant la poitrine. */
const CONCENTRATION: Corps = { poignetG: P(0.48, 0.4), poignetD: P(0.52, 0.4) };
/** Garde haute, coudes serrés. */
const COMBAT: Corps = {
  poignetG: P(0.46, 0.19), poignetD: P(0.54, 0.19),
  coudeG: P(0.44, 0.37), coudeD: P(0.56, 0.37)
};

/** Maintient une pose assez longtemps pour que la machine la retienne. */
function tenir(m: MachineAPostures, c: Corps, duree: number, depuis = 0): Attitude {
  let derniere: Attitude = "neutre";
  for (let t = 0; t <= duree; t += 1000 / 60) derniere = m.observer(corps(c, depuis + t), depuis + t);
  return derniere;
}

test("mains rapprochées devant la poitrine donne concentration", () => {
  expect(tenir(new MachineAPostures(), CONCENTRATION, 400)).toBe("concentration");
});

test("garde haute donne combat", () => {
  expect(tenir(new MachineAPostures(), COMBAT, 400)).toBe("combat");
});

test("bras le long du corps donne neutre", () => {
  expect(tenir(new MachineAPostures(), {}, 400)).toBe("neutre");
});

test("une posture doit tenir avant de basculer", () => {
  // Review Focus 2 : une image isolée de combat au milieu d'une incantation ne doit
  // pas interrompre l'enchaînement.
  const m = new MachineAPostures({ tenue: 220 });
  tenir(m, CONCENTRATION, 400);

  const apresUneImage = m.observer(corps(COMBAT, 420), 420);
  expect(apresUneImage).toBe("concentration");

  const apresLaTenue = tenir(m, COMBAT, 300, 420);
  expect(apresLaTenue).toBe("combat");
});

test("l'hystérésis empêche le clignotement à la frontière", () => {
  // Une pose qui oscille autour du seuil ne doit pas produire une bascule par image.
  const m = new MachineAPostures({ tenue: 220 });
  const changements: string[] = [];
  const observee = new MachineAPostures({
    tenue: 220,
    surChangement: (avant, apres) => changements.push(`${avant}>${apres}`)
  });

  for (let i = 0; i < 60; i++) {
    const t = i * (1000 / 60);
    const pose = i % 2 ? CONCENTRATION : COMBAT;
    m.observer(corps(pose, t), t);
    observee.observer(corps(pose, t), t);
  }

  // une seconde d'oscillation à 60 Hz : au plus une bascule par tenue
  expect(changements.length).toBeLessThanOrEqual(5);
});

test("surChangement est appelé une fois par bascule, avec l'avant et l'après", () => {
  const vus: [Attitude, Attitude][] = [];
  const m = new MachineAPostures({ tenue: 200, surChangement: (a, b) => vus.push([a, b]) });

  tenir(m, CONCENTRATION, 400);
  tenir(m, COMBAT, 400, 400);

  expect(vus).toEqual([
    ["neutre", "concentration"],
    ["concentration", "combat"]
  ]);
});

test("une posture nulle tend vers neutre, sans à-coup", () => {
  // Personne devant la caméra : on ne reste pas bloqué en combat.
  const m = new MachineAPostures({ tenue: 200 });
  tenir(m, COMBAT, 400);

  let derniere: Attitude = "combat";
  for (let t = 400; t <= 800; t += 1000 / 60) derniere = m.observer(null, t);

  expect(derniere).toBe("neutre");
});

test("depuis indique depuis quand la posture tient", () => {
  const m = new MachineAPostures({ tenue: 200 });
  tenir(m, CONCENTRATION, 600);

  expect(m.courante).toBe("concentration");
  expect(m.depuis).toBeGreaterThan(0);
});
