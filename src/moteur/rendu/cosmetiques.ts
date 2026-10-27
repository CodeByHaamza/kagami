// Rendu des cosmétiques en réalité augmentée (bandeaux de village et masques ANBU).
//
// Projeté sur le visage à partir des repères faciaux et crâniens de MediaPipe Pose
// (repères 0, 1–8). Le tracé respecte le style graphique calligraphique / estampe.

import type { Contexte2D, Point3, Posture } from "../types";

export type VillageBandeau = "konoha" | "suna" | "kiri" | "iwa" | "kumo";

export type CosmetiqueNinja =
  | "aucun"
  | "bandeau_konoha"
  | "bandeau_suna"
  | "bandeau_kiri"
  | "bandeau_iwa"
  | "bandeau_kumo"
  | "masque_anbu";

export interface PoseTete {
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
  angle: number;
}

/**
 * Détermine la position, la taille et l'orientation du front ou du visage
 * d'après les repères de posture du joueur (oreilles, yeux, nez).
 */
export function estimerPoseTete(
  posture: Posture | null,
  largeurEcran: number,
  hauteurEcran: number
): PoseTete | null {
  if (!posture || !posture.points || posture.points.length < 9) return null;

  const nez = posture.points[0];
  const oeilG = posture.points[2];
  const oeilD = posture.points[5];
  const oreilleG = posture.points[7];
  const oreilleD = posture.points[8];

  if (!nez || !oeilG || !oeilD) return null;

  // Calcul du centre et de l'écartement de référence
  let ptA: Point3 = oeilG;
  let ptB: Point3 = oeilD;
  let facteurLargeur = 2.4;

  if (oreilleG && oreilleD && (oreilleG.visibilite ?? 1) > 0.3 && (oreilleD.visibilite ?? 1) > 0.3) {
    ptA = oreilleG;
    ptB = oreilleD;
    facteurLargeur = 1.35;
  }

  const ax = ptA.x * largeurEcran;
  const ay = ptA.y * hauteurEcran;
  const bx = ptB.x * largeurEcran;
  const by = ptB.y * hauteurEcran;

  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);
  if (dist < 10) return null;

  const angle = Math.atan2(dy, dx);
  const centreX = (ax + bx) / 2;
  const centreY = (ay + by) / 2;

  // Décalage perpendiculaire vers le front (au-dessus des yeux/nez)
  const normX = -Math.sin(angle);
  const normY = Math.cos(angle);

  // Le nez aide à caler la hauteur du visage
  const hauteurVisage = dist * 1.5;
  const frontX = centreX - normX * (dist * 0.45);
  const frontY = centreY - normY * (dist * 0.45);

  return {
    x: frontX,
    y: frontY,
    largeur: dist * facteurLargeur,
    hauteur: hauteurVisage,
    angle
  };
}

/**
 * Dessine un bandeau frontal avec plaque métallique et symbole de village gravé.
 */
export function dessinerBandeau(
  ctx: Contexte2D,
  x: number,
  y: number,
  largeur: number,
  angle: number,
  village: VillageBandeau
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const hauteurTissu = largeur * 0.36;
  const largeurPlaque = largeur * 0.62;
  const hauteurPlaque = hauteurTissu * 0.72;

  // 1. Tissu noué (bleu nuit shinobi)
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.roundRect(-largeur / 2, -hauteurTissu / 2, largeur, hauteurTissu, 4);
  ctx.fill();

  // 2. Plaque d'acier brossé
  const gradient = ctx.createLinearGradient(0, -hauteurPlaque / 2, 0, hauteurPlaque / 2);
  gradient.addColorStop(0, "#cbd5e1");
  gradient.addColorStop(0.5, "#94a3b8");
  gradient.addColorStop(1, "#64748b");
  ctx.fillStyle = gradient;
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = Math.max(1.5, largeur * 0.015);
  ctx.beginPath();
  ctx.roundRect(-largeurPlaque / 2, -hauteurPlaque / 2, largeurPlaque, hauteurPlaque, 6);
  ctx.fill();
  ctx.stroke();

  // 3. Rivets aux 4 coins
  ctx.fillStyle = "#334155";
  const rOffsetL = largeurPlaque * 0.42;
  const rOffsetH = hauteurPlaque * 0.32;
  const rayonRivet = Math.max(1.5, hauteurPlaque * 0.08);
  for (const dx of [-rOffsetL, rOffsetL]) {
    for (const dy of [-rOffsetH, rOffsetH]) {
      ctx.beginPath();
      ctx.arc(dx, dy, rayonRivet, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. Emblème gravé du village
  ctx.fillStyle = "#0f172a";
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = Math.max(2, hauteurPlaque * 0.12);
  ctx.lineCap = "round";

  dessinerEmbleme(ctx, village, hauteurPlaque * 0.4);

  ctx.restore();
}

function dessinerEmbleme(ctx: Contexte2D, village: VillageBandeau, rayon: number): void {
  ctx.beginPath();
  if (village === "konoha") {
    // Spirale de feuille Konoha
    ctx.arc(0, 0, rayon * 0.6, 0, Math.PI * 1.5, false);
    ctx.moveTo(0, -rayon * 0.6);
    ctx.lineTo(rayon * 0.8, -rayon * 0.9);
    ctx.stroke();
  } else if (village === "suna") {
    // Sablier Suna
    ctx.moveTo(-rayon * 0.5, -rayon * 0.6);
    ctx.lineTo(rayon * 0.5, -rayon * 0.6);
    ctx.lineTo(-rayon * 0.5, rayon * 0.6);
    ctx.lineTo(rayon * 0.5, rayon * 0.6);
    ctx.closePath();
    ctx.stroke();
  } else if (village === "kiri") {
    // 4 vagues Kiri
    for (let i = -1; i <= 1; i += 0.66) {
      const y = i * rayon * 0.4;
      ctx.moveTo(-rayon * 0.6, y);
      ctx.quadraticCurveTo(-rayon * 0.2, y - rayon * 0.2, 0, y);
      ctx.quadraticCurveTo(rayon * 0.2, y + rayon * 0.2, rayon * 0.6, y);
    }
    ctx.stroke();
  } else if (village === "iwa") {
    // Rochers Iwa
    ctx.moveTo(-rayon * 0.5, rayon * 0.5);
    ctx.lineTo(0, -rayon * 0.6);
    ctx.lineTo(rayon * 0.5, rayon * 0.5);
    ctx.closePath();
    ctx.stroke();
  } else if (village === "kumo") {
    // Nuage Kumo
    ctx.arc(-rayon * 0.25, 0, rayon * 0.35, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(rayon * 0.15, -rayon * 0.15, rayon * 0.4, Math.PI, Math.PI * 2);
    ctx.arc(rayon * 0.35, rayon * 0.1, rayon * 0.3, 0, Math.PI);
    ctx.stroke();
  }
}

/**
 * Dessine un masque ANBU calligraphié sur l'intégralité du visage.
 */
export function dessinerMasqueAnbu(
  ctx: Contexte2D,
  x: number,
  y: number,
  largeur: number,
  hauteur: number,
  angle: number
): void {
  ctx.save();
  ctx.translate(x, y + hauteur * 0.2);
  ctx.rotate(angle);

  const w = largeur * 0.75;
  const h = hauteur * 1.1;

  // 1. Fond porcelaine blanche
  ctx.fillStyle = "#f8fafc";
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = Math.max(2, w * 0.02);

  ctx.beginPath();
  // Oreille gauche féline
  ctx.moveTo(-w * 0.4, -h * 0.4);
  ctx.lineTo(-w * 0.48, -h * 0.58);
  ctx.lineTo(-w * 0.2, -h * 0.48);
  // Sommet crâne
  ctx.quadraticCurveTo(0, -h * 0.52, w * 0.2, -h * 0.48);
  // Oreille droite féline
  ctx.lineTo(w * 0.48, -h * 0.58);
  ctx.lineTo(w * 0.4, -h * 0.4);
  // Joue et menton fuselé
  ctx.quadraticCurveTo(w * 0.5, 0, w * 0.35, h * 0.35);
  ctx.quadraticCurveTo(0, h * 0.55, -w * 0.35, h * 0.35);
  ctx.quadraticCurveTo(-w * 0.5, 0, -w * 0.4, -h * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 2. Fentes des yeux noires stylisées
  ctx.fillStyle = "#09090b";
  for (const cote of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cote * w * 0.22, -h * 0.06, w * 0.12, h * 0.05, cote * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Peintures de guerre rouges (encre carmin ANBU)
  ctx.strokeStyle = "#dc2626";
  ctx.fillStyle = "#dc2626";
  ctx.lineWidth = Math.max(2.5, w * 0.035);

  // Moustaches / flammes sur les joues
  for (const cote of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cote * w * 0.1, h * 0.08);
    ctx.quadraticCurveTo(cote * w * 0.3, h * 0.04, cote * w * 0.45, h * 0.14);
    ctx.moveTo(cote * w * 0.08, h * 0.16);
    ctx.quadraticCurveTo(cote * w * 0.28, h * 0.14, cote * w * 0.42, h * 0.24);
    ctx.stroke();

    // Pointe sur les oreilles
    ctx.beginPath();
    ctx.moveTo(cote * w * 0.35, -h * 0.45);
    ctx.lineTo(cote * w * 0.45, -h * 0.55);
    ctx.lineTo(cote * w * 0.25, -h * 0.48);
    ctx.fill();
  }

  // Symbole frontal rouge
  ctx.beginPath();
  ctx.arc(0, -h * 0.28, w * 0.06, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Projette le cosmétique choisi sur le joueur en exploitant sa posture MediaPipe.
 */
export function dessinerCosmetiqueAR(
  ctx: Contexte2D,
  posture: Posture | null,
  options: {
    largeur: number;
    hauteur: number;
    cosmetique: CosmetiqueNinja;
  }
): void {
  if (options.cosmetique === "aucun" || !posture) return;

  const pose = estimerPoseTete(posture, options.largeur, options.hauteur);
  if (!pose) return;

  if (options.cosmetique === "masque_anbu") {
    dessinerMasqueAnbu(ctx, pose.x, pose.y, pose.largeur, pose.hauteur, pose.angle);
    return;
  }

  const village = options.cosmetique.replace("bandeau_", "") as VillageBandeau;
  dessinerBandeau(ctx, pose.x, pose.y, pose.largeur, pose.angle, village);
}
