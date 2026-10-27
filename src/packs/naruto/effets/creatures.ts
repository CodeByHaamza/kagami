// Dessins vectoriels et calligraphiques des créatures du pack Naruto (§9.13).
//
// Remplace définitivement les 11 émojis du prototype par de véritables créatures
// dessinées au canvas avec les codes graphiques de l'encre sumi-e et du manga.

import type { Contexte2D } from "../../../moteur/types";

export interface OptionsCreature {
  rotation?: number;
  miroir?: boolean;
  alpha?: number;
  couleurAura?: string | null;
}

/** Dessine l'un des 4 dragons mythiques selon son affinité élémentaire. */
export function dessinerDragon(
  ctx: Contexte2D,
  element: "feu" | "eau" | "terre" | "foudre",
  x: number,
  y: number,
  taille: number,
  options: OptionsCreature = {}
): void {
  const { rotation = 0, miroir = false, alpha = 1, couleurAura = null } = options;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  if (miroir) ctx.scale(-1, 1);
  ctx.globalAlpha = alpha;

  if (couleurAura) {
    ctx.shadowColor = couleurAura;
    ctx.shadowBlur = taille * 0.25;
  }

  // Couleurs et textures par élément
  let couleurCorps = "#ea580c";
  let couleurLueur = "#ffedd5";
  let couleurCorne = "#7c2d12";
  if (element === "eau") {
    couleurCorps = "#0284c7";
    couleurLueur = "#e0f2fe";
    couleurCorne = "#0369a1";
  } else if (element === "terre") {
    couleurCorps = "#78350f";
    couleurLueur = "#fef3c7";
    couleurCorne = "#451a03";
  } else if (element === "foudre") {
    couleurCorps = "#38bdf8";
    couleurLueur = "#ffffff";
    couleurCorne = "#1e3a8a";
  }

  // Crâne et museau du dragon
  ctx.fillStyle = couleurCorps;
  ctx.strokeStyle = couleurLueur;
  ctx.lineWidth = Math.max(2, taille * 0.03);

  ctx.beginPath();
  ctx.moveTo(-taille * 0.4, -taille * 0.1);
  ctx.quadraticCurveTo(-taille * 0.1, -taille * 0.35, taille * 0.25, -taille * 0.2); // front
  ctx.quadraticCurveTo(taille * 0.45, -taille * 0.15, taille * 0.48, taille * 0.05); // truffe
  ctx.lineTo(taille * 0.35, taille * 0.12); // mâchoire supérieure
  ctx.quadraticCurveTo(taille * 0.15, taille * 0.05, 0, taille * 0.18); // palais
  ctx.lineTo(taille * 0.3, taille * 0.32); // mâchoire inférieure ouverte
  ctx.quadraticCurveTo(-taille * 0.1, taille * 0.28, -taille * 0.35, taille * 0.15); // gorge
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cornes de dragon oriental
  ctx.fillStyle = couleurCorne;
  ctx.beginPath();
  ctx.moveTo(-taille * 0.15, -taille * 0.28);
  ctx.quadraticCurveTo(-taille * 0.35, -taille * 0.55, -taille * 0.52, -taille * 0.45);
  ctx.quadraticCurveTo(-taille * 0.32, -taille * 0.38, -taille * 0.1, -taille * 0.22);
  ctx.fill();
  ctx.stroke();

  // Dents acérées
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 4; i++) {
    const dx = taille * (0.08 + i * 0.07);
    ctx.beginPath();
    ctx.moveTo(dx, taille * 0.02);
    ctx.lineTo(dx + taille * 0.03, taille * 0.1);
    ctx.lineTo(dx - taille * 0.03, taille * 0.1);
    ctx.fill();
  }

  // Œil féroce
  ctx.fillStyle = couleurLueur;
  ctx.beginPath();
  ctx.arc(taille * 0.05, -taille * 0.12, taille * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(taille * 0.06, -taille * 0.12, taille * 0.025, 0, Math.PI * 2);
  ctx.fill();

  // Moustaches / barbillons sinueux
  ctx.strokeStyle = couleurLueur;
  ctx.lineWidth = Math.max(1.5, taille * 0.02);
  ctx.beginPath();
  ctx.moveTo(taille * 0.35, taille * 0.05);
  ctx.bezierCurveTo(taille * 0.5, taille * 0.2, taille * 0.35, taille * 0.45, taille * 0.6, taille * 0.5);
  ctx.stroke();

  ctx.restore();
}

/** Dessine la silhouette menaçante de Kyūbi (renard à neuf queues). */
export function dessinerKyuubi(
  ctx: Contexte2D,
  x: number,
  y: number,
  taille: number,
  options: OptionsCreature = {}
): void {
  const { alpha = 1, couleurAura = "#f97316" } = options;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;

  if (couleurAura) {
    ctx.shadowColor = couleurAura;
    ctx.shadowBlur = taille * 0.3;
  }

  // Oreilles de démon renard
  ctx.fillStyle = "#ea580c";
  ctx.strokeStyle = "#431407";
  ctx.lineWidth = Math.max(2, taille * 0.03);

  // Oreille gauche
  ctx.beginPath();
  ctx.moveTo(-taille * 0.25, -taille * 0.1);
  ctx.lineTo(-taille * 0.38, -taille * 0.5);
  ctx.lineTo(-taille * 0.08, -taille * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Oreille droite
  ctx.beginPath();
  ctx.moveTo(taille * 0.25, -taille * 0.1);
  ctx.lineTo(taille * 0.38, -taille * 0.5);
  ctx.lineTo(taille * 0.08, -taille * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tête et museau anguleux
  ctx.beginPath();
  ctx.moveTo(0, taille * 0.32); // museau
  ctx.lineTo(-taille * 0.28, -taille * 0.05); // joue gauche
  ctx.lineTo(-taille * 0.15, -taille * 0.25); // front gauche
  ctx.lineTo(taille * 0.15, -taille * 0.25); // front droit
  ctx.lineTo(taille * 0.28, -taille * 0.05); // joue droite
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Yeux rouges sanglants aux pupilles fendues
  ctx.fillStyle = "#ef4444";
  for (const cote of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cote * taille * 0.12, -taille * 0.04, taille * 0.07, taille * 0.03, cote * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000000";
    ctx.fillRect(cote * taille * 0.12 - 1.5, -taille * 0.07, 3, taille * 0.06);
    ctx.fillStyle = "#ef4444";
  }

  // Babines et crocs
  ctx.strokeStyle = "#431407";
  ctx.beginPath();
  ctx.moveTo(-taille * 0.12, taille * 0.15);
  ctx.quadraticCurveTo(0, taille * 0.22, taille * 0.12, taille * 0.15);
  ctx.stroke();

  ctx.restore();
}

/** Dessine Gamabunta, le grand crapaud du mont Myōboku. */
export function dessinerCrapaud(
  ctx: Contexte2D,
  x: number,
  y: number,
  taille: number,
  options: OptionsCreature = {}
): void {
  const { alpha = 1 } = options;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;

  // Corps robuste et verruqueux de crapaud ninja
  ctx.fillStyle = "#b91c1c"; // rouge brique
  ctx.strokeStyle = "#450a0a";
  ctx.lineWidth = Math.max(3, taille * 0.03);

  ctx.beginPath();
  ctx.ellipse(0, taille * 0.1, taille * 0.46, taille * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Yeux jaunes dorés globuleux horizontaux
  for (const cote of [-1, 1]) {
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(cote * taille * 0.25, -taille * 0.2, taille * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pupille horizontale caractéristique des crapauds
    ctx.fillStyle = "#000000";
    ctx.fillRect(cote * taille * 0.25 - taille * 0.07, -taille * 0.215, taille * 0.14, taille * 0.03);
  }

  // Cicatrice de Gamabunta sur l'œil gauche
  ctx.strokeStyle = "#450a0a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-taille * 0.35, -taille * 0.32);
  ctx.lineTo(-taille * 0.18, -taille * 0.08);
  ctx.stroke();

  // Pipe japonaise (kiseru) géante fumante
  ctx.fillStyle = "#a16207";
  ctx.beginPath();
  ctx.moveTo(taille * 0.05, taille * 0.1);
  ctx.lineTo(taille * 0.42, taille * 0.02);
  ctx.lineTo(taille * 0.44, -taille * 0.12);
  ctx.lineTo(taille * 0.37, -taille * 0.11);
  ctx.lineTo(taille * 0.35, 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/** Dessine les chiens ninja (Ninken de Kakashi). */
export function dessinerChienNinja(
  ctx: Contexte2D,
  x: number,
  y: number,
  taille: number,
  options: OptionsCreature = {}
): void {
  const { miroir = false, alpha = 1 } = options;
  ctx.save();
  ctx.translate(x, y);
  if (miroir) ctx.scale(-1, 1);
  ctx.globalAlpha = alpha;

  ctx.fillStyle = "#78350f";
  ctx.strokeStyle = "#1c1917";
  ctx.lineWidth = Math.max(2, taille * 0.03);

  // Tête et oreilles tombantes
  ctx.beginPath();
  ctx.ellipse(0, 0, taille * 0.3, taille * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Oreilles ninken
  ctx.beginPath();
  ctx.ellipse(-taille * 0.22, -taille * 0.12, taille * 0.1, taille * 0.18, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Museau
  ctx.fillStyle = "#d97706";
  ctx.beginPath();
  ctx.ellipse(taille * 0.18, taille * 0.05, taille * 0.14, taille * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Truffe
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(taille * 0.28, taille * 0.02, taille * 0.04, 0, Math.PI * 2);
  ctx.fill();

  // Bandeau frontal ninja miniature
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(-taille * 0.1, -taille * 0.22, taille * 0.22, taille * 0.08);
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(-taille * 0.05, -taille * 0.21, taille * 0.12, taille * 0.06);

  ctx.restore();
}

/** Dessine le requin de chakra d'eau (Suikōdan no Jutsu de Kisame). */
export function dessinerRequin(
  ctx: Contexte2D,
  x: number,
  y: number,
  taille: number,
  options: OptionsCreature = {}
): void {
  const { miroir = false, alpha = 1, rotation = 0 } = options;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  if (miroir) ctx.scale(-1, 1);
  ctx.globalAlpha = alpha;

  ctx.shadowColor = "#38bdf8";
  ctx.shadowBlur = taille * 0.2;

  // Corps profilé translucide d'eau
  ctx.fillStyle = "rgba(14, 165, 233, 0.75)";
  ctx.strokeStyle = "#bae6fd";
  ctx.lineWidth = Math.max(2, taille * 0.03);

  ctx.beginPath();
  ctx.moveTo(taille * 0.48, 0); // museau pointu
  ctx.quadraticCurveTo(taille * 0.2, -taille * 0.22, -taille * 0.15, -taille * 0.14); // dos
  ctx.lineTo(-taille * 0.45, -taille * 0.28); // queue haute
  ctx.lineTo(-taille * 0.35, 0); // fourche queue
  ctx.lineTo(-taille * 0.48, taille * 0.25); // queue basse
  ctx.quadraticCurveTo(-taille * 0.1, taille * 0.15, taille * 0.2, taille * 0.18); // ventre
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Aileron dorsal menaçant
  ctx.beginPath();
  ctx.moveTo(0, -taille * 0.18);
  ctx.lineTo(-taille * 0.12, -taille * 0.42);
  ctx.lineTo(-taille * 0.05, -taille * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Nageoire pectorale
  ctx.beginPath();
  ctx.moveTo(taille * 0.12, taille * 0.08);
  ctx.lineTo(0, taille * 0.32);
  ctx.lineTo(taille * 0.02, taille * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Branchies et œil perçant
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(taille * 0.32, -taille * 0.05, taille * 0.035, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** Dessine l'arche monumentale démoniaque de Rashōmon. */
export function dessinerRashoumon(
  ctx: Contexte2D,
  x: number,
  y: number,
  largeur: number,
  hauteur: number
): void {
  ctx.save();
  ctx.translate(x, y);

  // Piliers de pierre sombre
  ctx.fillStyle = "#1e1e24";
  ctx.strokeStyle = "#e11d48";
  ctx.lineWidth = 3;

  const demiL = largeur * 0.5;
  // Pilier gauche
  ctx.fillRect(-demiL, -hauteur * 0.5, largeur * 0.18, hauteur);
  ctx.strokeRect(-demiL, -hauteur * 0.5, largeur * 0.18, hauteur);

  // Pilier droit
  ctx.fillRect(demiL - largeur * 0.18, -hauteur * 0.5, largeur * 0.18, hauteur);
  ctx.strokeRect(demiL - largeur * 0.18, -hauteur * 0.5, largeur * 0.18, hauteur);

  // Toit pagode japonais imposant
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.moveTo(-demiL * 1.25, -hauteur * 0.5);
  ctx.quadraticCurveTo(0, -hauteur * 0.65, demiL * 1.25, -hauteur * 0.5);
  ctx.lineTo(demiL * 1.1, -hauteur * 0.42);
  ctx.quadraticCurveTo(0, -hauteur * 0.52, -demiL * 1.1, -hauteur * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Masque Oni démoniaque central
  ctx.fillStyle = "#991b1b";
  ctx.beginPath();
  ctx.ellipse(0, -hauteur * 0.1, largeur * 0.22, hauteur * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Yeux et cornes du démon Oni
  ctx.fillStyle = "#fef08a";
  ctx.beginPath();
  ctx.arc(-largeur * 0.08, -hauteur * 0.15, largeur * 0.035, 0, Math.PI * 2);
  ctx.arc(largeur * 0.08, -hauteur * 0.15, largeur * 0.035, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** Dessine le Shinigami (Dieu de la mort du Shiki Fūjin). */
export function dessinerShinigami(
  ctx: Contexte2D,
  x: number,
  y: number,
  taille: number,
  options: OptionsCreature = {}
): void {
  const { alpha = 1 } = options;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;

  ctx.shadowColor = "#a855f7";
  ctx.shadowBlur = taille * 0.25;

  // Cheveux blancs spectrals ébouriffés
  ctx.fillStyle = "#f1f5f9";
  ctx.beginPath();
  ctx.arc(0, -taille * 0.1, taille * 0.32, Math.PI, Math.PI * 2);
  ctx.lineTo(taille * 0.45, -taille * 0.4);
  ctx.lineTo(taille * 0.25, -taille * 0.2);
  ctx.lineTo(0, -taille * 0.5);
  ctx.lineTo(-taille * 0.25, -taille * 0.2);
  ctx.lineTo(-taille * 0.45, -taille * 0.4);
  ctx.closePath();
  ctx.fill();

  // Visage violacé terrifiant
  ctx.fillStyle = "#581c87";
  ctx.strokeStyle = "#c084fc";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, taille * 0.22, taille * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Dague rituelle serrée entre les dents
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(-taille * 0.25, taille * 0.08, taille * 0.5, taille * 0.04);
  ctx.strokeRect(-taille * 0.25, taille * 0.08, taille * 0.5, taille * 0.04);

  // Yeux noirs sans fond
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(-taille * 0.08, -taille * 0.04, taille * 0.04, 0, Math.PI * 2);
  ctx.arc(taille * 0.08, -taille * 0.04, taille * 0.04, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** Dessine les racines et arbres géants du Mokuton (Jukai Kōtan). */
export function dessinerArbreMokuton(
  ctx: Contexte2D,
  x: number,
  y: number,
  hauteur: number,
  pousse: number
): void {
  ctx.save();
  ctx.translate(x, y);

  const h = hauteur * Math.min(1, pousse);
  ctx.fillStyle = "#3f2008"; // écorce boisée sombre
  ctx.strokeStyle = "#166534"; // feuillage
  ctx.lineWidth = Math.max(3, hauteur * 0.04);

  // Tronc tortueux
  ctx.beginPath();
  ctx.moveTo(-hauteur * 0.1, 0);
  ctx.quadraticCurveTo(-hauteur * 0.18, -h * 0.45, -hauteur * 0.05, -h * 0.8);
  ctx.lineTo(0, -h);
  ctx.lineTo(hauteur * 0.06, -h * 0.78);
  ctx.quadraticCurveTo(hauteur * 0.15, -h * 0.45, hauteur * 0.1, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Feuillage verdoyant supérieur
  ctx.fillStyle = "#15803d";
  ctx.beginPath();
  ctx.arc(0, -h, hauteur * 0.25 * pousse, 0, Math.PI * 2);
  ctx.arc(-hauteur * 0.15, -h * 0.9, hauteur * 0.18 * pousse, 0, Math.PI * 2);
  ctx.arc(hauteur * 0.15, -h * 0.9, hauteur * 0.18 * pousse, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
