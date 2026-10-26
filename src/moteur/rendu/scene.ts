// Le rendu de la scène d'arcade : les entités et les télégraphes, peints au moment
// `derriere` (entre la vidéo et la personne détourée) pour que la profondeur vienne
// gratuitement (spec §9.2).

import type { Telegraphe } from "../jeu/telegraphe";
import type { Entite, Scene } from "../scene/scene";
import type { Contexte2D, DessinEntite } from "../types";

export interface ParametresRenduScene {
  scene: Scene;
  telegraphes: readonly Telegraphe[];
  dessins: Readonly<Record<string, DessinEntite>>;
  largeur: number;
  hauteur: number;
  temps: number;
  /** Traduit un identifiant d'élément en chaîne affichable (« 水 · Eau »). */
  nomElement: (element: string | null) => string;
}

function projeter(
  e: Entite,
  largeur: number,
  hauteur: number
): { x: number; y: number; taille: number } {
  const echelle = 0.55 + e.profondeur * 0.65;
  const base = Math.min(largeur, hauteur) * (e.boss ? 0.34 : 0.25);
  return {
    x: largeur * (0.15 + e.x * 0.7),
    y: hauteur * (0.46 + e.profondeur * 0.26),
    taille: base * echelle
  };
}

function dessinerBarreVie(ctx: Contexte2D, e: Entite, x: number, y: number, taille: number): void {
  if (e.etat === "mort") return;
  const l = taille * (e.boss ? 0.95 : 0.7);
  const h = e.boss ? 7 : 5;
  const gauche = x - l / 2;
  const haut = y - taille * 0.68;
  const part = Math.max(0, Math.min(1, e.pv / Math.max(1, e.pvMax)));

  ctx.save();
  ctx.fillStyle = "rgba(15, 12, 10, 0.78)";
  ctx.fillRect(gauche - 1, haut - 1, l + 2, h + 2);
  ctx.fillStyle = e.boss ? "#dc2626" : "#ea580c";
  ctx.fillRect(gauche, haut, l * part, h);
  ctx.restore();
}

function dessinerTelegraphe(
  ctx: Contexte2D,
  tel: Telegraphe,
  x: number,
  y: number,
  taille: number,
  nomElement: (el: string | null) => string
): void {
  const part = tel.part;
  const rayon = taille * (0.95 - part * 0.45);
  const couleur = tel.attaque.genjutsu
    ? "#c084fc"
    : tel.attaque.esquivable
      ? "#fb923c"
      : "#ef4444";

  ctx.save();
  ctx.strokeStyle = couleur;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y - taille * 0.15, Math.max(12, rayon), 0, Math.PI * 2);
  ctx.stroke();

  // Anneau intérieur de référence : quand le cercle extérieur le rejoint, le coup part.
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - taille * 0.15, Math.max(8, taille * 0.5), 0, Math.PI * 2);
  ctx.stroke();

  const etiquette = nomElement(tel.attaque.element);
  if (etiquette) {
    ctx.globalAlpha = 0.95;
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.fillStyle = "#fff7ed";
    ctx.textAlign = "center";
    ctx.fillText(etiquette, x, y - taille * 0.78);
  }
  ctx.restore();
}

export function dessinerScene(ctx: Contexte2D, p: ParametresRenduScene): void {
  const triees = [...p.scene.toutes].sort((a, b) => a.profondeur - b.profondeur);
  const tSec = p.temps / 1000;

  for (const e of triees) {
    const dessin = p.dessins[e.modele];
    const { x, y, taille } = projeter(e, p.largeur, p.hauteur);
    ctx.save();
    dessin?.(ctx, e, x, y, taille, tSec);
    ctx.restore();
    dessinerBarreVie(ctx, e, x, y, taille);
  }

  for (const tel of p.telegraphes) {
    if (tel.annule) continue;
    const { x, y, taille } = projeter(tel.source, p.largeur, p.hauteur);
    dessinerTelegraphe(ctx, tel, x, y, taille, p.nomElement);
  }
}
