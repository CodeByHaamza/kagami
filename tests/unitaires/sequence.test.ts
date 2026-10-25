// La grammaire : des jetons bruyants vus par la camera jusqu'a une technique.
//
// Le modele se trompe d'une image a l'autre, donc un jeton n'est valide que s'il est vu
// sur plusieurs images d'affilee. Ces reglages sont regles finement contre ce bruit :
// les tests ci-dessous verrouillent le comportement exact de la version d'origine.

import { Sequence } from "../../src/moteur/grammaire/sequence";
import type { Detection, Technique } from "../../src/moteur/types";

type S = "mains" | "tigre" | "oiseau" | "serpent" | "cheval" | "rat";

const technique = (
  id: string,
  signes: readonly S[],
  extra: Partial<Technique<S>> = {}
): Technique<S> => ({
  id,
  type: "Ninjutsu",
  kanji: "印",
  romaji: id,
  signes,
  effet: id,
  source: "anime",
  ...extra
});

// Le cas reel qui rend le mecanisme d'attente necessaire : le Rasengan est le debut
// du Rasenshuriken.
const RASENGAN = technique("rasengan", ["mains", "tigre"]);
const RASENSHURIKEN = technique("rasenshuriken", ["mains", "tigre", "oiseau"]);
const MUR = technique("mur", ["serpent", "tigre"], { variante: ["rat", "tigre"] });
const SHUNSHIN = technique("shunshin", ["cheval"], { tenir: true });

const CATALOGUE = [RASENGAN, RASENSHURIKEN, MUR, SHUNSHIN];

const vu = (jeton: S, score = 0.9): Detection<S> => ({
  jeton,
  score,
  boite: { x1: 0, y1: 0, x2: 10, y2: 10 }
});

/** Pousse un jeton jusqu'a sa validation (deux images d'affilee) et renvoie le resultat. */
function valider(s: Sequence<S>, jeton: S, t: number): S | null {
  s.ajouter(vu(jeton), t);
  return s.ajouter(vu(jeton), t + 1);
}

/** Enchaine plusieurs jetons, une image de plus entre chacun. */
function enchainer(s: Sequence<S>, jetons: readonly S[], depart = 1000): void {
  jetons.forEach((jeton, i) => valider(s, jeton, depart + i * 100));
}

test("une détection sous le seuil est ignorée", () => {
  const s = new Sequence(CATALOGUE);
  expect(s.ajouter(vu("tigre", 0.59), 0)).toBeNull();
  expect(s.ajouter(vu("tigre", 0.59), 1)).toBeNull();
  expect(s.historique).toEqual([]);
});

test("un jeton n'est validé qu'à la deuxième image", () => {
  const s = new Sequence(CATALOGUE);
  expect(s.ajouter(vu("tigre"), 0)).toBeNull();
  expect(s.ajouter(vu("tigre"), 10)).toBe("tigre");
});

test("le même jeton tenu n'est pas ajouté deux fois", () => {
  const s = new Sequence(CATALOGUE);
  s.ajouter(vu("tigre"), 0);
  s.ajouter(vu("tigre"), 10);
  expect(s.ajouter(vu("tigre"), 20)).toBeNull();
  expect(s.historique).toEqual(["tigre"]);
});

test("le même jeton deux fois de suite n'entre pas dans l'historique", () => {
  const s = new Sequence(CATALOGUE);
  valider(s, "tigre", 0);
  s.ajouter(vu("serpent"), 100); // coupe la tenue sans etre valide
  expect(valider(s, "tigre", 200)).toBeNull();
  expect(s.historique).toEqual(["tigre"]);
});

test("l'historique est vidé après 4000 ms sans jeton", () => {
  const s = new Sequence(CATALOGUE);
  valider(s, "mains", 0);
  expect(s.historique).toEqual(["mains"]);
  valider(s, "tigre", 5000);
  expect(s.historique).toEqual(["tigre"]);
});

test("une séquence complète déclenche la technique", () => {
  const s = new Sequence(CATALOGUE);
  enchainer(s, ["mains", "tigre"]);
  expect(s.techniqueTerminee()?.technique.id).toBe("rasengan");
});

test("la variante déclenche aussi la technique", () => {
  const s = new Sequence(CATALOGUE);
  enchainer(s, ["rat", "tigre"]);
  expect(s.techniqueTerminee()?.technique.id).toBe("mur");
});

test("la technique la plus longue gagne quand deux correspondent", () => {
  const s = new Sequence(CATALOGUE);
  enchainer(s, ["mains", "tigre", "oiseau"]);
  expect(s.techniqueTerminee()?.technique.id).toBe("rasenshuriken");
});

test("attendre vaut true quand la séquence est le préfixe d'une plus longue", () => {
  const s = new Sequence(CATALOGUE);
  enchainer(s, ["mains", "tigre"]);
  const fini = s.techniqueTerminee();
  expect(fini?.technique.id).toBe("rasengan");
  expect(fini?.attendre).toBe(true);
});

test("attendre vaut false quand aucune technique ne prolonge la séquence", () => {
  const s = new Sequence(CATALOGUE);
  enchainer(s, ["serpent", "tigre"]);
  const fini = s.techniqueTerminee();
  expect(fini?.technique.id).toBe("mur");
  expect(fini?.attendre).toBe(false);
});

test("jetonTenu renvoie part = 0 puis 1 après 2500 ms", () => {
  const s = new Sequence(CATALOGUE);
  s.ajouter(vu("cheval"), 1000);
  s.ajouter(vu("cheval"), 1010);
  expect(s.jetonTenu(1010)?.technique?.id).toBe("shunshin");
  expect(s.jetonTenu(1010)?.part).toBe(0);
  s.ajouter(vu("cheval"), 3510);
  expect(s.jetonTenu(3510)?.part).toBe(1);
});

test("jetonTenu ne renvoie rien si l'historique contient plus d'un jeton", () => {
  const s = new Sequence(CATALOGUE);
  valider(s, "mains", 1000);
  s.ajouter(vu("cheval"), 1100);
  s.ajouter(vu("cheval"), 1110);
  expect(s.jetonTenu(1110)).toBeNull();
});

test("progression donne fait, total et le prochain jeton", () => {
  const s = new Sequence(CATALOGUE);
  enchainer(s, ["mains"]);
  expect(s.progression(RASENSHURIKEN)).toEqual({ fait: 1, total: 3, prochain: "tigre" });
});

test("enCours trie les techniques entamées par avancement décroissant", () => {
  const s = new Sequence(CATALOGUE);
  enchainer(s, ["mains", "tigre"]);
  const cours = s.enCours();
  expect(cours[0]?.technique.id).toBe("rasenshuriken");
  expect(cours[0]?.fait).toBe(2);
  expect(cours.every(c => c.fait > 0 && c.fait < c.total)).toBe(true);
});

test("l'historique est plafonné à 60 jetons", () => {
  const s = new Sequence(CATALOGUE);
  const alterne: S[] = Array.from({ length: 80 }, (_, i) => (i % 2 ? "serpent" : "rat"));
  enchainer(s, alterne);
  expect(s.historique.length).toBe(60);
});

test("les réglages par défaut sont ceux de la version d'origine", () => {
  const s = new Sequence(CATALOGUE);
  expect(s.reglages).toEqual({
    seuil: 0.6,
    confirmations: 2,
    oubli: 4000,
    tenir: 2500,
    attente: 1500
  });
});

// ---- les paliers de tenue, et la cadence (plan 2) ----

/**
 * Tient un jeton de `de` a `a`, a la cadence reelle de la boucle de detection (12 Hz).
 * Sauter le temps d'un coup declencherait l'oubli, ce qui n'arrive jamais en vrai :
 * tant qu'on tient le signe, le detecteur le revoit douze fois par seconde.
 */
function maintenir(s: Sequence<S>, jeton: S, de: number, a: number): void {
  for (let t = de; t <= a; t += 80) s.ajouter(vu(jeton), t);
}

const CHARGE = technique("charge", ["cheval"], { tenir: true });
const RAFALE = technique("rafale", [], { cadence: { nombre: 8, dans: 3000 }, jeton: "tigre" });

test("un jeton tenu 2,5 s donne le palier « tenue »", () => {
  // La tenue part de la DEUXIEME image confirmee, pas de la premiere : il faut donc
  // tenir un peu plus que 2,5 s apres le premier contact.
  const s = new Sequence([CHARGE]);
  maintenir(s, "cheval", 1000, 3700);

  const tenu = s.jetonTenu(3700);
  expect(tenu?.technique?.id).toBe("charge");
  expect(tenu?.palier).toBe("tenue");
  expect(tenu?.part).toBe(1);
});

test("le même jeton tenu au-delà de 4 s passe au palier « charge »", () => {
  // La règle qui préserve shunshin : on continue à tenir au lieu de relâcher.
  const s = new Sequence([CHARGE]);
  maintenir(s, "cheval", 1000, 5100);

  expect(s.jetonTenu(5100)?.palier).toBe("charge");
});

test("un jeton sans technique à tenir atteint quand même le palier charge", () => {
  // Charger le chakra ne demande pas qu'un jutsu existe pour ce signe.
  const s = new Sequence([RASENGAN]);
  maintenir(s, "tigre", 0, 4200);

  const tenu = s.jetonTenu(4200);
  expect(tenu?.palier).toBe("charge");
  expect(tenu?.technique).toBeNull();
});

test("huit jetons en moins de 3 s déclenchent la technique à cadence", () => {
  const s = new Sequence([RAFALE]);
  for (let i = 0; i < 8; i++) {
    s.ajouter(vu("tigre"), i * 200);
    s.ajouter(vu("tigre"), i * 200 + 10);
    s.ajouter(vu("serpent"), i * 200 + 20); // casse la répétition
    s.ajouter(vu("serpent"), i * 200 + 30);
  }

  expect(s.techniqueTerminee()?.technique.id).toBe("rafale");
});

test("sept jetons ne déclenchent pas la technique à cadence", () => {
  const s = new Sequence([RAFALE]);
  for (let i = 0; i < 7; i++) {
    s.ajouter(vu("tigre"), i * 200);
    s.ajouter(vu("tigre"), i * 200 + 10);
    s.ajouter(vu("serpent"), i * 200 + 20);
    s.ajouter(vu("serpent"), i * 200 + 30);
  }

  expect(s.techniqueTerminee()).toBeNull();
});

test("huit jetons étalés sur plus de 3 s ne la déclenchent pas", () => {
  const s = new Sequence([RAFALE], { oubli: 60_000 });
  for (let i = 0; i < 8; i++) {
    s.ajouter(vu("tigre"), i * 600);
    s.ajouter(vu("tigre"), i * 600 + 10);
    s.ajouter(vu("serpent"), i * 600 + 20);
    s.ajouter(vu("serpent"), i * 600 + 30);
  }

  expect(s.techniqueTerminee()).toBeNull();
});

test("une technique à cadence n'interfère pas avec les enchaînements", () => {
  const s = new Sequence([...CATALOGUE, RAFALE]);
  enchainer(s, ["mains", "tigre"]);

  expect(s.techniqueTerminee()?.technique.id).toBe("rasengan");
});
