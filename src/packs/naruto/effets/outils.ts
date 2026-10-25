// Les outils communs aux effets : particules, fumée, éclairs, dessins
// doc : https://developer.mozilla.org/fr/docs/Web/API/Canvas_API/Tutorial/Compositing

import type { Contexte2D, ContexteEffet, Particules } from "../../../moteur/types";

/** Un point de l'ecran, en pixels CSS : [x, y]. */
export type Point = [number, number];

export const hasard = (a: number, b: number): number => a + Math.random() * (b - a);
export const TOUR = Math.PI * 2;

// 0 avant 0, 1 après 1, et une transition douce entre les deux
export const lisse = (x: number): number => {
  x = Math.min(Math.max(x, 0), 1);
  return x * x * (3 - 2 * x);
};

// apparition sur "entree" secondes, disparition sur "sortie" secondes avant "duree"
export const enveloppe = (t: number, duree: number, entree = 0.3, sortie = 0.5): number => lisse(t / entree) * (1 - lisse((t - duree + sortie) / sortie));

// les couleurs d'une particule, de sa naissance à sa mort
export const FEU = ["#fffbe0", "#ffd36b", "#ff8c1a", "#e8440f", "#8a2208"];
export const EAU = ["#e8f9ff", "#8fdcff", "#3a9be8", "#1d63b5"];
export const FOUDRE = ["#ffffff", "#c8ebff", "#6cbcff"];
export const CHAKRA = ["#eaf7ff", "#8fd0ff"];
export const FUMEE = ["#eeeeee", "#c9c9c9", "#a0a0a0"];
export const TERRE = ["#a07850", "#7a5a3a"];
export const VIOLET = ["#f1e4ff", "#b06cff", "#5b1a99"];
export const CENDRE = ["#9a90a8", "#5d5568"];
export const NOIR = ["#2a0a33", "#120412", "#000000"];
export const VERT = ["#eaffea", "#7dff9a", "#1fae4b"];


// Les particules, le rond flou et la police emoji vivent dans le moteur : leur code ne
// connait aucun anime, et c'est la classe Effets qui possede l'instance de Particules.
export { POLICE_EMOJI, sprite, toileHorsEcran } from "../../../moteur/rendu/particules";
import { POLICE_EMOJI } from "../../../moteur/rendu/particules";

// crée "parSeconde" particules par seconde, quel que soit le nombre d'images par seconde
export function emettre(dt: number, parSeconde: number, creer: () => void): void {
  const n = parSeconde * dt;
  const entier = Math.floor(n) + (Math.random() < n % 1 ? 1 : 0);
  for (let i = 0; i < entier; i++) creer();
}

export function fumee(P: Particules, x: number, y: number, nombre: number, taille: number): void {
  for (let i = 0; i < nombre; i++) {
    const a = hasard(0, TOUR);
    const v = hasard(80, 380) * taille / 120;
    P.ajouter({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, frein: 2.5,
      taille: hasard(0.35, 0.8) * taille, croissance: taille * 0.5, duree: hasard(0.8, 1.4),
      couleurs: FUMEE, mode: "source-over", alpha: 0.9
    });
  }
}

// des feuilles qui tourbillonnent autour de (x, y)
export function feuilles(P: Particules, x: number, y: number, nombre: number, rayon: number, texte = "🍃"): void {
  for (let i = 0; i < nombre; i++) {
    const a = hasard(0, TOUR);
    const d = hasard(rayon * 0.3, rayon);
    P.ajouter({
      texte, mode: "source-over", x: x + Math.cos(a) * d, y: y + Math.sin(a) * d,
      vx: -Math.sin(a) * hasard(250, 450), vy: Math.cos(a) * hasard(250, 450) - 80,
      frein: 1.2, taille: hasard(10, 18), duree: hasard(1, 1.8), vrot: hasard(-8, 8)
    });
  }
}


// ---- petits dessins ----



export function emoji(
  ctx: Contexte2D,
  texte: string,
  x: number,
  y: number,
  taille: number,
  {
    rotation = 0,
    miroir = false,
    filtre = "none",
    alpha = 1,
    halo = null
  }: {
    rotation?: number;
    miroir?: boolean;
    filtre?: string;
    alpha?: number;
    halo?: string | null;
  } = {}
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  if (miroir) ctx.scale(-1, 1);
  ctx.globalAlpha = alpha;
  ctx.filter = filtre;
  if (halo) {
    ctx.shadowColor = halo;
    ctx.shadowBlur = taille * 0.2;
  }
  ctx.font = Math.round(taille) + "px " + POLICE_EMOJI;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(texte, 0, 0);
  ctx.restore();
}

export function kanji(
  ctx: Contexte2D,
  texte: string,
  x: number,
  y: number,
  taille: number,
  couleur: string,
  alpha = 1
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = Math.round(taille) + "px 'Yuji Syuku', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = couleur;
  ctx.fillText(texte, x, y);
  ctx.restore();
}

// un éclair (ou une fissure, une branche) : un segment qu'on casse en deux en
// décalant le milieu, plusieurs fois de suite
export function eclair(
  x: number,
  y: number,
  angle: number,
  longueur: number,
  rugosite = 0.4
): Point[] {
  let points: Point[] = [
    [x, y],
    [x + Math.cos(angle) * longueur, y + Math.sin(angle) * longueur]
  ];
  for (let etape = 0; etape < 5; etape++) {
    const nouveaux: Point[] = [points[0]!];
    for (let i = 1; i < points.length; i++) {
      const [ax, ay] = points[i - 1]!;
      const [bx, by] = points[i]!;
      const d = Math.hypot(bx - ax, by - ay) || 1;
      const decalage = (Math.random() - 0.5) * d * rugosite;
      // le milieu, poussé perpendiculairement au segment
      nouveaux.push([(ax + bx) / 2 - (by - ay) / d * decalage, (ay + by) / 2 + (bx - ax) / d * decalage], [bx, by]);
    }
    points = nouveaux;
  }
  return points;
}

// trace un chemin de points ; "part" (0 à 1) n'en trace que le début (pour le faire pousser)
export function tracer(ctx: Contexte2D, points: readonly Point[], part = 1): void {
  const n = Math.max(2, Math.round(points.length * part));
  ctx.beginPath();
  ctx.moveTo(points[0]![0], points[0]![1]);
  for (let i = 1; i < n && i < points.length; i++) ctx.lineTo(points[i]![0], points[i]![1]);
  ctx.stroke();
}

// un voile coloré sur les bords de l'écran (couleur en #rrggbb)
export function vignette(ctx: Contexte2D, e: ContexteEffet, couleur: string, force: number): void {
  const g = ctx.createRadialGradient(e.l / 2, e.h / 2, Math.min(e.l, e.h) * 0.3, e.l / 2, e.h / 2, Math.max(e.l, e.h) * 0.75);
  g.addColorStop(0, couleur + "00");
  g.addColorStop(1, couleur + Math.round(Math.min(Math.max(force, 0), 1) * 255).toString(16).padStart(2, "0"));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, e.l, e.h);
}

// une lumière colorée sur tout l'écran
export function teinte(ctx: Contexte2D, e: ContexteEffet, couleur: string, alpha: number): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = Math.max(alpha, 0);
  ctx.fillStyle = couleur;
  ctx.fillRect(0, 0, e.l, e.h);
  ctx.restore();
}

// une couche de couleur sur tout l'écran
export function voile(
  ctx: Contexte2D,
  e: ContexteEffet,
  couleur: string,
  alpha: number,
  mode: GlobalCompositeOperation = "source-over"
): void {
  ctx.save();
  ctx.globalCompositeOperation = mode;
  ctx.globalAlpha = Math.max(alpha, 0);
  ctx.fillStyle = couleur;
  ctx.fillRect(0, 0, e.l, e.h);
  ctx.restore();
}

// décale une bande horizontale de l'image déjà dessinée (vent, glitch)
export function decalerBande(
  ctx: Contexte2D,
  e: ContexteEffet,
  y: number,
  hauteur: number,
  dx: number
): void {
  const r = ctx.canvas.width / e.l; // pixels réels par pixel CSS
  ctx.drawImage(ctx.canvas, 0, y * r, ctx.canvas.width, hauteur * r, dx, y, e.l, hauteur);
}

// une pièce de bois (bûche, pilier) : un rectangle arrondi avec un dégradé et des veines
export function bois(
  ctx: Contexte2D,
  x: number,
  y: number,
  longueur: number,
  epaisseur: number,
  angle = 0
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const ecorce = ctx.createLinearGradient(0, -epaisseur / 2, 0, epaisseur / 2);
  ecorce.addColorStop(0, "#9a6634");
  ecorce.addColorStop(0.5, "#6e4220");
  ecorce.addColorStop(1, "#3f2410");
  ctx.fillStyle = ecorce;
  ctx.beginPath();
  ctx.roundRect(-longueur / 2, -epaisseur / 2, longueur, epaisseur, Math.min(epaisseur / 2, 12));
  ctx.fill();
  ctx.strokeStyle = "rgba(35, 18, 5, 0.5)";
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-longueur * 0.45, i * epaisseur * 0.15);
    ctx.bezierCurveTo(-longueur * 0.1, i * epaisseur * 0.15 + 3, longueur * 0.1, i * epaisseur * 0.15 - 3, longueur * 0.45, i * epaisseur * 0.15);
    ctx.stroke();
  }
  ctx.restore();
}

// une bûche vue de côté, avec le bout coupé et ses cernes
export function buche(ctx: Contexte2D, x: number, y: number, longueur: number, angle: number): void {
  const epaisseur = longueur * 0.3;
  bois(ctx, x, y, longueur, epaisseur, angle);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "#e2b77c";
  ctx.beginPath();
  ctx.ellipse(longueur / 2 - epaisseur * 0.1, 0, epaisseur * 0.2, epaisseur / 2, 0, 0, TOUR);
  ctx.fill();
  ctx.strokeStyle = "#a8743c";
  for (const r of [0.15, 0.3, 0.42]) {
    ctx.beginPath();
    ctx.ellipse(longueur / 2 - epaisseur * 0.1, 0, epaisseur * 0.4 * r, epaisseur * r, 0, 0, TOUR);
    ctx.stroke();
  }
  ctx.restore();
}

// l'œil Sharingan : iris rouge, pupille, et trois virgules (tomoe) qui tournent
export function sharingan(
  ctx: Contexte2D,
  x: number,
  y: number,
  r: number,
  angle: number,
  alpha: number
): void {
  if (r < 1 || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.fillStyle = "#c8102e";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TOUR);
  ctx.fill();
  ctx.strokeStyle = "#160000";
  ctx.lineWidth = r * 0.06;
  ctx.stroke();
  ctx.lineWidth = r * 0.025;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.58, 0, TOUR);
  ctx.stroke();
  ctx.fillStyle = "#0b0000";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.18, 0, TOUR);
  ctx.fill();
  ctx.rotate(angle);
  for (let i = 0; i < 3; i++) {
    ctx.rotate(TOUR / 3);
    ctx.beginPath();
    ctx.arc(r * 0.58, 0, r * 0.11, 0, TOUR);
    ctx.fill();
    ctx.beginPath(); // la queue de la virgule
    ctx.moveTo(r * 0.58 + r * 0.11, 0);
    ctx.quadraticCurveTo(r * 0.62, r * 0.28, r * 0.44, r * 0.3);
    ctx.quadraticCurveTo(r * 0.55, r * 0.15, r * 0.48, 0);
    ctx.fill();
  }
  ctx.restore();
}
