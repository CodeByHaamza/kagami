// Le banc de rejeu : enregistrer une session, puis la rejouer à la place de la caméra.
//
// C'est l'outil qui rend les seuils de gestes réglables. Sans lui, « est-ce qu'un
// direct est détecté ? » se vérifie en se mettant devant une webcam et en bougeant
// jusqu'à ce que ça marche — pas reproductible, pas mesurable, pas testable en
// intégration continue. Avec lui, la même session se rejoue à l'identique, et on
// compare des nombres.

import type { Detection, Posture } from "../types";
import type { ImageSession, Session } from "./format";
import { VERSION_SESSION } from "./format";

/**
 * Environ trois minutes à 30 images par seconde. Au-delà, une session qui tourne en
 * arrière-plan saturerait la mémoire, et ce qui intéresse est toujours la fin.
 */
export const MAX_IMAGES = 5400;

export interface OptionsLecture {
  /** 1 = temps réel, 2 = deux fois plus vite, 0.5 = au ralenti. */
  vitesse?: number;
}

/**
 * Rejoue une session. `avancer` rend les images franchies depuis le dernier appel,
 * exactement comme une boucle de détection en recevrait de la caméra.
 */
export class LecteurDeSession {
  private readonly images: readonly ImageSession[];
  private readonly vitesse: number;
  private horloge = 0;
  private suivante = 0;

  constructor(session: Session, options: OptionsLecture = {}) {
    this.vitesse = options.vitesse ?? 1;
    // Une session enregistrée à `performance.now() = 184932` doit se rejouer comme si
    // elle commençait maintenant : sans ce recalage, toutes les durées sont fausses.
    const origine = session.images[0]?.t ?? 0;
    this.images = session.images.map(i => ({ ...i, t: i.t - origine }));
  }

  get fini(): boolean {
    return this.suivante >= this.images.length;
  }

  /** De 0 à 1 : où on en est dans la session. */
  get position(): number {
    return this.images.length ? this.suivante / this.images.length : 1;
  }

  avancer(dt: number): ImageSession[] {
    this.horloge += dt * 1000 * this.vitesse;

    const franchies: ImageSession[] = [];
    while (this.suivante < this.images.length && this.images[this.suivante]!.t <= this.horloge) {
      franchies.push(this.images[this.suivante]!);
      this.suivante++;
    }
    return franchies;
  }

  rembobiner(): void {
    this.horloge = 0;
    this.suivante = 0;
  }
}

/** Capte ce que la caméra montre, pour pouvoir le rejouer plus tard. */
export class EnregistreurDeSession {
  private readonly capturees: ImageSession[] = [];

  constructor(
    private readonly nom: string,
    private readonly largeur: number,
    private readonly hauteur: number
  ) {}

  get images(): number {
    return this.capturees.length;
  }

  capturer(t: number, detection: Detection | null, posture: Posture | null): void {
    this.capturees.push({ t, detection, posture });
    if (this.capturees.length > MAX_IMAGES) this.capturees.shift();
  }

  terminer(): Session {
    return {
      version: VERSION_SESSION,
      nom: this.nom,
      largeur: this.largeur,
      hauteur: this.hauteur,
      images: [...this.capturees]
    };
  }
}
