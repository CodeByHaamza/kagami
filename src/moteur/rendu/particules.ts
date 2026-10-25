// Les particules : la matiere de tous les effets, et le seul endroit du rendu qui
// manipule des milliers d'objets par image.
//
// Une particule est un rond flou : une petite image dessinee une fois, puis reutilisee
// des milliers de fois (bien plus rapide qu'un degrade par particule). Avec `texte`,
// c'est un emoji qui tourne sur lui-meme.
//
// Rien ici ne connait d'anime : c'est pour ca que la classe vit dans le moteur et non
// dans un pack, et que la classe Effets en possede l'instance.

import type {
  Contexte2D,
  NouvelleParticule,
  Particule,
  Particules as InterfaceParticules
} from "../types";

/** Au-dela, on arrete d'en ajouter : le telephone ne suit plus. */
const MAXIMUM = 3000;

/** En dessous de ce rayon une particule ne se voit plus, on la retire. */
const TAILLE_MINIMALE = 0.5;

export const POLICE_EMOJI =
  "'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";

const spritesEnCache = new Map<string, CanvasImageSource>();

/**
 * Un canvas hors ecran. Passe par OffscreenCanvas quand il existe, ce qui evite de
 * dependre du DOM : les effets restent executables hors d'un navigateur.
 */
export function toileHorsEcran(largeur: number, hauteur = largeur): OffscreenCanvas | HTMLCanvasElement {
  return typeof OffscreenCanvas === "function"
    ? new OffscreenCanvas(largeur, hauteur)
    : Object.assign(document.createElement("canvas"), { width: largeur, height: hauteur });
}

/** Le rond flou d'une couleur, dessine une seule fois puis garde en cache. */
export function sprite(couleur: string): CanvasImageSource {
  const deja = spritesEnCache.get(couleur);
  if (deja) return deja;

  const toile = toileHorsEcran(64);
  const ctx = toile.getContext("2d") as Contexte2D;
  const degrade = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  degrade.addColorStop(0, couleur);
  degrade.addColorStop(0.4, couleur + "aa");
  degrade.addColorStop(1, couleur + "00");
  ctx.fillStyle = degrade;
  ctx.fillRect(0, 0, 64, 64);

  spritesEnCache.set(couleur, toile);
  return toile;
}

export class Particules implements InterfaceParticules {
  private particules: Particule[] = [];

  get liste(): readonly Particule[] {
    return this.particules;
  }

  ajouter(p: NouvelleParticule): void {
    if (this.particules.length > MAXIMUM) return;
    this.particules.push({
      vx: 0,
      vy: 0,
      ay: 0,
      croissance: 0,
      frein: 0,
      alpha: 1,
      mode: "lighter",
      age: 0,
      rotation: 0,
      vrot: 0,
      ...p
    });
  }

  avancer(dt: number): void {
    for (const p of this.particules) {
      p.age += dt;
      const frein = Math.exp(-p.frein * dt);
      p.vx *= frein;
      p.vy = p.vy * frein + p.ay * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.taille += p.croissance * dt;
      p.rotation += p.vrot * dt;
    }
    this.particules = this.particules.filter(p => p.age < p.duree && p.taille > TAILLE_MINIMALE);
  }

  dessiner(ctx: Contexte2D): void {
    // la matiere (fumee, eau, feuilles) d'abord, la lumiere (feu, foudre) par-dessus
    for (const mode of ["source-over", "lighter"] as const) {
      ctx.globalCompositeOperation = mode;
      for (const p of this.particules) {
        if (p.mode !== mode) continue;
        const f = p.age / p.duree;
        ctx.globalAlpha = p.alpha * (1 - f);

        if (p.texte) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.font = Math.round(p.taille * 2) + "px " + POLICE_EMOJI;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.texte, 0, 0);
          ctx.restore();
        } else if (p.couleurs?.length) {
          const i = Math.min(p.couleurs.length - 1, Math.floor(f * p.couleurs.length));
          ctx.drawImage(sprite(p.couleurs[i]!), p.x - p.taille, p.y - p.taille, p.taille * 2, p.taille * 2);
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
}
