// Rendu des cosmétiques en réalité augmentée (bandeaux de village et masques ANBU).
//
// Projeté sur le front et le visage à partir des repères MediaPipe Pose (repères 0, 1–8).
// Le rendu utilise des dégradés métalliques 3D brossés, biseaux ciselés, rivets d'acier
// et tissu shinobi texturé pour un rendu manga semi-réaliste haute fidélité.

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

export interface OptionsCosmetiqueAR {
  largeur: number;
  hauteur: number;
  cosmetique: CosmetiqueNinja;
  projeter?: (pt: Point3) => { x: number; y: number };
}

/**
 * Détermine la position, la taille et l'orientation du front ou du visage
 * d'après les repères de posture du joueur (oreilles, yeux, nez),
 * en tenant compte de la projection écran et de l'effet miroir éventuel.
 */
export function estimerPoseTete(
  posture: Posture | null,
  largeurEcran: number,
  hauteurEcran: number,
  projeter?: (pt: Point3) => { x: number; y: number }
): PoseTete | null {
  if (!posture || !posture.points || posture.points.length < 9) return null;

  const nez = posture.points[0];
  const oeilG = posture.points[2];
  const oeilD = posture.points[5];
  const oreilleG = posture.points[7];
  const oreilleD = posture.points[8];

  if (!nez || !oeilG || !oeilD) return null;

  const conv = projeter ?? ((pt: Point3) => ({ x: pt.x * largeurEcran, y: pt.y * hauteurEcran }));

  const pNez = conv(nez);
  const pOeilG = conv(oeilG);
  const pOeilD = conv(oeilD);

  // Centre médian des yeux
  const centreYeuxX = (pOeilG.x + pOeilD.x) / 2;
  const centreYeuxY = (pOeilG.y + pOeilD.y) / 2;

  // Vecteur entre les yeux (qui s'adapte à l'inclinaison et au miroir)
  const dx = pOeilD.x - pOeilG.x;
  const dy = pOeilD.y - pOeilG.y;
  const distYeux = Math.hypot(dx, dy);
  if (distYeux < 5) return null;

  const angle = Math.atan2(dy, dx);

  // Vecteur orienté du nez vers les yeux (direction du haut du visage)
  const vHautX = centreYeuxX - pNez.x;
  const vHautY = centreYeuxY - pNez.y;
  const distNezYeux = Math.hypot(vHautX, vHautY);

  let frontX: number;
  let frontY: number;

  if (distNezYeux > 8) {
    // Le front se cale à environ 1.35x la distance nez-yeux au-dessus des yeux
    const facteurFront = 1.35;
    frontX = centreYeuxX + vHautX * facteurFront;
    frontY = centreYeuxY + vHautY * facteurFront;
  } else {
    // Repli géométrique perpendiculaire à l'axe des yeux
    const normX = -Math.sin(angle);
    const normY = Math.cos(angle);
    frontX = centreYeuxX + normX * (distYeux * 0.65);
    frontY = centreYeuxY - Math.abs(normY) * (distYeux * 0.65);
  }

  let largeur = distYeux * 2.5;
  if (oreilleG && oreilleD && (oreilleG.visibilite ?? 1) > 0.25 && (oreilleD.visibilite ?? 1) > 0.25) {
    const pOreilleG = conv(oreilleG);
    const pOreilleD = conv(oreilleD);
    const distOreilles = Math.hypot(pOreilleD.x - pOreilleG.x, pOreilleD.y - pOreilleG.y);
    if (distOreilles > distYeux) {
      largeur = distOreilles * 1.35;
    }
  }

  const hauteurVisage = distYeux * 3.0;

  return {
    x: frontX,
    y: frontY,
    largeur,
    hauteur: hauteurVisage,
    angle
  };
}

/**
 * Dessine un bandeau frontal réaliste avec tissu shinobi plissé,
 * plaque d'acier brossé en relief 3D, rivets chromés et emblème gravé en creux.
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

  const hauteurTissu = largeur * 0.38;
  const largeurPlaque = largeur * 0.64;
  const hauteurPlaque = hauteurTissu * 0.72;

  // 1. Tissu noué (bleu nuit shinobi profond avec texture de plis)
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;

  ctx.fillStyle = "#090d16";
  ctx.beginPath();
  ctx.roundRect(-largeur / 2 - 12, -hauteurTissu / 2, largeur + 24, hauteurTissu, 4);
  ctx.fill();
  ctx.restore();

  // Coutures et reflets du tissu
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-largeur / 2, -hauteurTissu / 2 + 2);
  ctx.lineTo(largeur / 2, -hauteurTissu / 2 + 2);
  ctx.moveTo(-largeur / 2, hauteurTissu / 2 - 2);
  ctx.lineTo(largeur / 2, hauteurTissu / 2 - 2);
  ctx.stroke();

  // 2. Ombre portée sous la plaque métallique
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.beginPath();
  ctx.roundRect(-largeurPlaque / 2, -hauteurPlaque / 2 + 3, largeurPlaque, hauteurPlaque, 6);
  ctx.fill();
  ctx.restore();

  // 3. Plaque d'acier brossé 3D (dégradé incurvé)
  const gradPlaque = ctx.createLinearGradient(0, -hauteurPlaque / 2, 0, hauteurPlaque / 2);
  gradPlaque.addColorStop(0, "#f8fafc");
  gradPlaque.addColorStop(0.15, "#cbd5e1");
  gradPlaque.addColorStop(0.5, "#94a3b8");
  gradPlaque.addColorStop(0.85, "#64748b");
  gradPlaque.addColorStop(1, "#334155");

  ctx.fillStyle = gradPlaque;
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = Math.max(1.8, largeurPlaque * 0.015);
  ctx.beginPath();
  ctx.roundRect(-largeurPlaque / 2, -hauteurPlaque / 2, largeurPlaque, hauteurPlaque, 6);
  ctx.fill();
  ctx.stroke();

  // Biseau intérieur gravé
  ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(
    -largeurPlaque / 2 + 2.5,
    -hauteurPlaque / 2 + 2.5,
    largeurPlaque - 5,
    hauteurPlaque - 5,
    4
  );
  ctx.stroke();

  // 4. Les 6 rivets canoniques d'acier (3 à gauche, 3 à droite)
  const offsetLX = largeurPlaque * 0.44;
  const rayonRivet = Math.max(2, hauteurPlaque * 0.075);
  const positionsY = [-hauteurPlaque * 0.32, 0, hauteurPlaque * 0.32];

  for (const dx of [-offsetLX, offsetLX]) {
    for (const dy of positionsY) {
      // Cavité d'ombre
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(dx, dy + 0.5, rayonRivet, 0, Math.PI * 2);
      ctx.fill();

      // Dôme métallique
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.arc(dx, dy, rayonRivet * 0.85, 0, Math.PI * 2);
      ctx.fill();

      // Reflet spéculaire
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(dx - rayonRivet * 0.25, dy - rayonRivet * 0.25, rayonRivet * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 5. Emblème gravé en creux avec double relief
  const rayonEmbleme = hauteurPlaque * 0.36;

  // Relief supérieur (lumière blanche sous l'entaille)
  ctx.save();
  ctx.translate(0, 1);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.lineWidth = Math.max(2, hauteurPlaque * 0.11);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  dessinerEmbleme(ctx, village, rayonEmbleme);
  ctx.restore();

  // Entaille profonde noire d'encre
  ctx.strokeStyle = "#090d16";
  ctx.fillStyle = "#090d16";
  ctx.lineWidth = Math.max(2, hauteurPlaque * 0.11);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  dessinerEmbleme(ctx, village, rayonEmbleme);

  ctx.restore();
}

function dessinerEmbleme(ctx: Contexte2D, village: VillageBandeau, rayon: number): void {
  ctx.beginPath();
  if (village === "konoha") {
    // Spirale de feuille Konoha canonique avec pointe et encoche
    ctx.arc(0, 0, rayon * 0.58, 0.3, Math.PI * 1.6, false);
    ctx.moveTo(0, -rayon * 0.58);
    ctx.lineTo(rayon * 0.75, -rayon * 0.85);
    ctx.moveTo(-rayon * 0.45, rayon * 0.35);
    ctx.lineTo(-rayon * 0.75, rayon * 0.65);
    ctx.stroke();
  } else if (village === "suna") {
    // Sablier Suna stylisé
    ctx.moveTo(-rayon * 0.55, -rayon * 0.65);
    ctx.lineTo(rayon * 0.55, -rayon * 0.65);
    ctx.lineTo(-rayon * 0.55, rayon * 0.65);
    ctx.lineTo(rayon * 0.55, rayon * 0.65);
    ctx.closePath();
    ctx.stroke();
  } else if (village === "kiri") {
    // 4 vagues parallèles d'eau brumeuse
    for (const i of [-0.6, -0.2, 0.2, 0.6]) {
      const y = i * rayon * 0.7;
      ctx.moveTo(-rayon * 0.65, y);
      ctx.quadraticCurveTo(-rayon * 0.2, y - rayon * 0.25, 0, y);
      ctx.quadraticCurveTo(rayon * 0.2, y + rayon * 0.25, rayon * 0.65, y);
    }
    ctx.stroke();
  } else if (village === "iwa") {
    // Rochers angulaires Iwa
    ctx.moveTo(-rayon * 0.6, rayon * 0.55);
    ctx.lineTo(-rayon * 0.2, -rayon * 0.65);
    ctx.lineTo(0.1, -rayon * 0.1);
    ctx.lineTo(0.3, -rayon * 0.4);
    ctx.lineTo(rayon * 0.65, rayon * 0.55);
    ctx.closePath();
    ctx.stroke();
  } else if (village === "kumo") {
    // Double nuage stylisé Kumo
    ctx.arc(-rayon * 0.22, 0, rayon * 0.32, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(rayon * 0.16, -rayon * 0.14, rayon * 0.38, Math.PI, Math.PI * 2);
    ctx.arc(rayon * 0.32, rayon * 0.1, rayon * 0.28, 0, Math.PI);
    ctx.stroke();
  }
}

/**
 * Dessine un masque ANBU félin haute résolution en porcelaine sculptée.
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
  ctx.translate(x, y + hauteur * 0.22);
  ctx.rotate(angle);

  const w = largeur * 0.78;
  const h = hauteur * 1.15;

  // 1. Ombre portée sous le masque
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;

  // 2. Coque en porcelaine ivoire avec léger dégradé 3D
  const gradMasque = ctx.createRadialGradient(0, -h * 0.1, w * 0.1, 0, 0, h * 0.6);
  gradMasque.addColorStop(0, "#ffffff");
  gradMasque.addColorStop(0.7, "#f1f5f9");
  gradMasque.addColorStop(1, "#cbd5e1");

  ctx.fillStyle = gradMasque;
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = Math.max(2.5, w * 0.025);

  ctx.beginPath();
  // Oreille féline gauche
  ctx.moveTo(-w * 0.4, -h * 0.4);
  ctx.lineTo(-w * 0.48, -h * 0.6);
  ctx.lineTo(-w * 0.2, -h * 0.48);
  // Courbe supérieure crânienne
  ctx.quadraticCurveTo(0, -h * 0.53, w * 0.2, -h * 0.48);
  // Oreille féline droite
  ctx.lineTo(w * 0.48, -h * 0.6);
  ctx.lineTo(w * 0.4, -h * 0.4);
  // Pommettes et menton fuselé
  ctx.quadraticCurveTo(w * 0.52, 0, w * 0.36, h * 0.36);
  ctx.quadraticCurveTo(0, h * 0.56, -w * 0.36, h * 0.36);
  ctx.quadraticCurveTo(-w * 0.52, 0, -w * 0.4, -h * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 3. Fentes d'yeux noires évasées
  ctx.fillStyle = "#05070a";
  for (const cote of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cote * w * 0.22, -h * 0.06, w * 0.12, h * 0.045, cote * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Contour rouge biseauté autour de l'œil
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = Math.max(2, w * 0.02);
    ctx.stroke();
  }

  // 4. Peintures de guerre rouges (encre carmin ANBU)
  ctx.strokeStyle = "#dc2626";
  ctx.fillStyle = "#dc2626";
  ctx.lineWidth = Math.max(3, w * 0.04);
  ctx.lineCap = "round";

  // Moustaches félines courbes sur les joues
  for (const cote of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cote * w * 0.12, h * 0.08);
    ctx.quadraticCurveTo(cote * w * 0.32, h * 0.03, cote * w * 0.45, h * 0.14);
    ctx.moveTo(cote * w * 0.1, h * 0.18);
    ctx.quadraticCurveTo(cote * w * 0.3, h * 0.15, cote * w * 0.42, h * 0.25);
    ctx.stroke();

    // Peinture triangulaire carmin dans les oreilles
    ctx.beginPath();
    ctx.moveTo(cote * w * 0.36, -h * 0.46);
    ctx.lineTo(cote * w * 0.45, -h * 0.56);
    ctx.lineTo(cote * w * 0.26, -h * 0.49);
    ctx.closePath();
    ctx.fill();
  }

  // Symbole frontal rouge carmin (flamme ANBU)
  ctx.beginPath();
  ctx.arc(0, -h * 0.28, w * 0.065, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Projette le cosmétique choisi sur le joueur en exploitant sa posture MediaPipe.
 */
export function dessinerCosmetiqueAR(
  ctx: Contexte2D,
  posture: Posture | null,
  options: OptionsCosmetiqueAR
): void {
  if (options.cosmetique === "aucun" || !posture) return;

  const pose = estimerPoseTete(posture, options.largeur, options.hauteur, options.projeter);
  if (!pose) return;

  if (options.cosmetique === "masque_anbu") {
    dessinerMasqueAnbu(ctx, pose.x, pose.y, pose.largeur, pose.hauteur, pose.angle);
    return;
  }

  const village = options.cosmetique.replace("bandeau_", "") as VillageBandeau;
  dessinerBandeau(ctx, pose.x, pose.y, pose.largeur, pose.angle, village);
}
