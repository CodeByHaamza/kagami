// Le banc de rejeu : il remplace la caméra.
//
// Sans lui, régler un seuil de geste demande de se mettre devant une webcam et de
// bouger jusqu'à ce que ça marche — ce qui n'est ni reproductible ni mesurable. Avec
// lui, on rejoue la même session autant de fois qu'on veut et on compare des nombres.

import { EnregistreurDeSession, LecteurDeSession, MAX_IMAGES } from "../../src/moteur/rejeu/lecteur";
import { deserialiser, serialiser, VERSION_SESSION } from "../../src/moteur/rejeu/format";
import type { Session } from "../../src/moteur/rejeu/format";
import type { Posture } from "../../src/moteur/types";

const posture = (horodatage: number): Posture => ({
  horodatage,
  points: Array.from({ length: 33 }, (_, i) => ({ x: i / 1000, y: 0, z: 0, visibilite: 0.9 }))
});

/** Une session dont les images sont espacées de `pas` millisecondes. */
const session = (nombre: number, pas = 100): Session => ({
  version: VERSION_SESSION,
  nom: "essai",
  largeur: 1280,
  hauteur: 720,
  images: Array.from({ length: nombre }, (_, i) => ({
    t: i * pas,
    detection: null,
    posture: posture(i * pas)
  }))
});

test("avancer rend les images franchies, dans l'ordre", () => {
  const lecteur = new LecteurDeSession(session(3));

  const rendues = lecteur.avancer(0.15); // 150 ms : les images à 0 et 100
  expect(rendues.map(i => i.t)).toEqual([0, 100]);
});

test("avancer ne rend jamais deux fois la même image", () => {
  const lecteur = new LecteurDeSession(session(3));

  const premier = lecteur.avancer(0.15).map(i => i.t);
  const second = lecteur.avancer(0.15).map(i => i.t);

  expect(premier).toEqual([0, 100]);
  expect(second).toEqual([200]);
});

test("la vitesse double avance deux fois plus vite", () => {
  const lecteur = new LecteurDeSession(session(5), { vitesse: 2 });

  // 150 ms réelles valent 300 ms de session : l'image estampillée 300 est atteinte.
  expect(lecteur.avancer(0.15).map(i => i.t)).toEqual([0, 100, 200, 300]);
  // la même durée à vitesse normale n'en aurait rendu que deux
  expect(new LecteurDeSession(session(5)).avancer(0.15).map(i => i.t)).toEqual([0, 100]);
});

test("fini passe à vrai après la dernière image", () => {
  const lecteur = new LecteurDeSession(session(2));

  expect(lecteur.fini).toBe(false);
  lecteur.avancer(1);
  expect(lecteur.fini).toBe(true);
  expect(lecteur.avancer(1)).toEqual([]);
});

test("rembobiner permet de rejouer depuis le début", () => {
  const lecteur = new LecteurDeSession(session(2));
  lecteur.avancer(1);

  lecteur.rembobiner();

  expect(lecteur.fini).toBe(false);
  expect(lecteur.avancer(1).map(i => i.t)).toEqual([0, 100]);
});

test("l'enregistreur rend une session relisible par le lecteur", () => {
  // L'aller-retour complet : c'est lui qui prouve que le banc est utilisable.
  const enregistreur = new EnregistreurDeSession("ma session", 640, 480);
  enregistreur.capturer(0, null, posture(0));
  enregistreur.capturer(100, { jeton: "tigre", score: 0.9, boite: { x1: 0, y1: 0, x2: 1, y2: 1 } }, posture(100));
  enregistreur.capturer(200, null, posture(200));

  const relue = deserialiser(serialiser(enregistreur.terminer()));
  const rejouees = new LecteurDeSession(relue).avancer(1);

  expect(rejouees).toHaveLength(3);
  expect(rejouees[1]?.detection?.jeton).toBe("tigre");
  expect(relue.nom).toBe("ma session");
});

test("l'enregistreur oublie les plus anciennes images, pas les récentes", () => {
  // Une session qui tourne pendant dix minutes ne doit pas saturer la mémoire ; et ce
  // qui intéresse, c'est toujours ce qui vient de se passer.
  const enregistreur = new EnregistreurDeSession("longue", 640, 480);
  for (let i = 0; i < MAX_IMAGES + 50; i++) enregistreur.capturer(i * 33, null, posture(i * 33));

  const finale = enregistreur.terminer();
  expect(finale.images).toHaveLength(MAX_IMAGES);
  expect(finale.images[finale.images.length - 1]?.t).toBe((MAX_IMAGES + 49) * 33);
});

test("l'horodatage des images rejouées part de zéro, quelle que soit la session", () => {
  // Une session enregistrée à `performance.now() = 184932` doit se rejouer comme si
  // elle commençait maintenant, sinon tous les calculs de durée sont faux.
  const decalee: Session = {
    ...session(2),
    images: session(2).images.map(i => ({ ...i, t: i.t + 184_932 }))
  };

  expect(new LecteurDeSession(decalee).avancer(1).map(i => i.t)).toEqual([0, 100]);
});
