// Le format d'une session rejouable.
//
// C'est le socle de tout le plan : sans lui, aucun seuil de geste ne se règle sans
// une webcam et un corps devant. Une session est une suite d'images, chacune portant
// ce que le reconnaisseur a vu et ce que le lecteur de posture a mesuré.

import { deserialiser, serialiser, VERSION_SESSION } from "../../src/moteur/rejeu/format";
import type { Session } from "../../src/moteur/rejeu/format";
import type { Point3, Posture } from "../../src/moteur/types";

const point = (x: number, y: number, z = 0, visibilite = 0.9): Point3 => ({ x, y, z, visibilite });

// Des valeurs deja a trois decimales : l'aller-retour est volontairement avec perte,
// et le verifier sur des valeurs plus precises testerait l'arrondi, pas l'aller-retour.
const posture = (horodatage: number): Posture => ({
  horodatage,
  points: Array.from({ length: 33 }, (_, i) => point(i / 1000, (i * 2) / 1000))
});

const session = (images = 3): Session => ({
  version: VERSION_SESSION,
  nom: "essai",
  largeur: 1280,
  hauteur: 720,
  images: Array.from({ length: images }, (_, i) => ({
    t: i * 100,
    detection: i === 1 ? { jeton: "tigre", score: 0.82, boite: { x1: 1, y1: 2, x2: 3, y2: 4 } } : null,
    posture: posture(i * 100)
  }))
});

test("une session se sérialise et se relit à l'identique", () => {
  const avant = session();
  const apres = deserialiser(serialiser(avant));

  expect(apres).toEqual(avant);
});

test("une session d'une version inconnue est refusée, avec les deux versions nommées", () => {
  const future = serialiser({ ...session(), version: 99 } as Session);

  expect(() => deserialiser(future)).toThrow(/99/);
  expect(() => deserialiser(future)).toThrow(new RegExp(String(VERSION_SESSION)));
});

test("du JSON invalide est refusé sans laisser remonter l'erreur brute", () => {
  // « Unexpected end of JSON input » ne dit rien à qui dépose un fichier.
  expect(() => deserialiser("{")).toThrow(/session/i);
  expect(() => deserialiser("null")).toThrow(/session/i);
  expect(() => deserialiser("[]")).toThrow(/session/i);
});

test("une session vide est valide", () => {
  const vide = { ...session(0) };

  expect(deserialiser(serialiser(vide)).images).toEqual([]);
});

test("les points sont arrondis à trois décimales", () => {
  // 33 points × 4 champs × des milliers d'images : la précision complète quadruple le
  // poids du fichier pour une information que personne ne lit.
  const precise: Session = {
    ...session(1),
    images: [
      {
        t: 0,
        detection: null,
        posture: { horodatage: 0, points: [point(0.123456789, 0.987654321, 0.5555555, 0.7777777)] }
      }
    ]
  };

  const texte = serialiser(precise);
  expect(texte).not.toContain("0.123456789");

  const relu = deserialiser(texte).images[0]!.posture!.points[0]!;
  expect(relu.x).toBe(0.123);
  expect(relu.y).toBe(0.988);
});
