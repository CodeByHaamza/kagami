// Ou la video se pose sur l'ecran, et la boucle d'affichage.
//
// La video remplit l'ecran quitte a etre rognee, et de face elle est en miroir : on se
// voit comme dans une glace. Ces maths etaient melees a l'etat du module dans la
// version d'origine ; ici elles sont pures, et c'est ce qui les rend verifiables.

import type { Contexte2D, Image } from "../types";

export interface Cadre {
  /** La taille de la fenetre, en pixels CSS. */
  l: number;
  h: number;
  /** Le facteur applique a la video pour couvrir la fenetre. */
  echelle: number;
  /** Le coin haut-gauche de la video a l'ecran ; negatif, puisqu'elle deborde. */
  x: number;
  y: number;
  /** La taille de la video une fois mise a l'echelle. */
  largeur: number;
  hauteur: number;
  /** La taille du canvas en vrais pixels, densite comprise. */
  toileLargeur: number;
  toileHauteur: number;
}

export interface TailleVideo {
  largeur: number;
  hauteur: number;
}

/**
 * Calcule le placement de la video pour qu'elle couvre la fenetre sans se deformer.
 *
 * Tant que la video n'a pas de dimensions (readyState < 2, au tout premier rendu),
 * renvoie un cadre neutre : la version d'origine divisait par zero a cet instant.
 */
export function calculerCadre(
  fenetre: { l: number; h: number },
  video: TailleVideo,
  pixels: number
): Cadre {
  const toileLargeur = Math.round(fenetre.l * pixels);
  const toileHauteur = Math.round(fenetre.h * pixels);

  if (!(video.largeur > 0) || !(video.hauteur > 0)) {
    return {
      l: fenetre.l,
      h: fenetre.h,
      echelle: 1,
      x: 0,
      y: 0,
      largeur: fenetre.l,
      hauteur: fenetre.h,
      toileLargeur,
      toileHauteur
    };
  }

  const echelle = Math.max(fenetre.l / video.largeur, fenetre.h / video.hauteur);
  const largeur = video.largeur * echelle;
  const hauteur = video.hauteur * echelle;

  return {
    l: fenetre.l,
    h: fenetre.h,
    echelle,
    x: (fenetre.l - largeur) / 2,
    y: (fenetre.h - hauteur) / 2,
    largeur,
    hauteur,
    toileLargeur,
    toileHauteur
  };
}

/** Un point de la video vers un point de l'ecran, miroir compris. */
export function versEcran(
  cadre: Cadre,
  video: { largeur: number },
  deFace: boolean,
  x: number,
  y: number
): { x: number; y: number } {
  return {
    x: cadre.x + (deFace ? video.largeur - x : x) * cadre.echelle,
    y: cadre.y + y * cadre.echelle
  };
}

/**
 * Dessine une image a la place de la video.
 *
 * `decalage` et `zoom` servent aux clones : le zoom garde le bas de l'image au meme
 * endroit, pour qu'ils aient les pieds au sol.
 */
export function dessinerCadre(
  ctx: Contexte2D,
  cadre: Cadre,
  image: Image,
  deFace: boolean,
  decalage = 0,
  zoom = 1
): void {
  const l = cadre.largeur * zoom;
  const h = cadre.hauteur * zoom;
  const x = cadre.x + (cadre.largeur - l) / 2 + decalage;
  const y = cadre.y + cadre.hauteur - h;

  ctx.save();
  if (deFace) {
    ctx.translate(x + l, y);
    ctx.scale(-1, 1);
    ctx.drawImage(image, 0, 0, l, h);
  } else {
    ctx.drawImage(image, x, y, l, h);
  }
  ctx.restore();
}

/** Au-dela, c'est que l'onglet etait en arriere-plan : les effets sauteraient. */
const DT_MAXIMAL = 0.05;

/** De quoi planifier l'image suivante ; injectable pour pouvoir tester la boucle. */
export interface Ordonnanceur {
  planifier(rappel: (temps: number) => void): void;
  annuler(): void;
}

const ordonnanceurNavigateur: Ordonnanceur = {
  planifier: rappel => {
    identifiant = requestAnimationFrame(rappel);
  },
  annuler: () => cancelAnimationFrame(identifiant)
};
let identifiant = 0;

/**
 * La boucle d'affichage. Elle ne connait rien au contenu : elle appelle `surImage`
 * avec un `dt` plafonne, et porte la secousse, qui est le seul etat partage entre les
 * effets et le rendu.
 */
export class BoucleDeRendu {
  private precedent = 0;
  private enMarche = false;
  private secousse = 0;

  constructor(
    private readonly surImage: (dt: number, temps: number) => void,
    private readonly ordonnanceur: Ordonnanceur = ordonnanceurNavigateur
  ) {}

  demarrer(maintenant = performance.now()): void {
    if (this.enMarche) return;
    this.enMarche = true;
    this.precedent = maintenant;
    this.planifier();
  }

  arreter(): void {
    this.enMarche = false;
    this.ordonnanceur.annuler();
  }

  /** Secoue toute l'image ; la force la plus forte de l'image gagne. */
  secouer(force: number): void {
    this.secousse = Math.max(this.secousse, force);
  }

  /** Lit la secousse de cette image et la remet a zero. */
  prendreSecousse(): number {
    const force = this.secousse;
    this.secousse = 0;
    return force;
  }

  private planifier(): void {
    this.ordonnanceur.planifier(temps => {
      if (!this.enMarche) return;
      const dt = Math.min((temps - this.precedent) / 1000, DT_MAXIMAL);
      this.precedent = temps;
      this.planifier();
      this.surImage(dt, temps);
    });
  }
}
