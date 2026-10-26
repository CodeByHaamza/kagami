// Les silhouettes à l'encre (*sumi-e*) du bestiaire et des boss (spec §9.5).
//
// Provisoires en attendant le plan 5 : chacune se reconnaît à sa carrure et à **un
// attribut** (l'épée de Zabuza, Samehada de Kisame, le manteau Akatsuki, le masque ANBU,
// l'argile de Deidara, l'éventail de Madara), et réagit aux quatre états.

import type { Contexte2D, DessinEntite } from "../../../moteur/types";
import type { IdEnnemi } from "../donnees/bestiaire";
import type { IdBoss } from "../donnees/boss";

interface OptionsSilhouette {
  encre: string;
  accent: string;
  largeurEpaules: number;
  attribut: (ctx: Contexte2D, taille: number, t: number) => void;
}

function creerSilhouette(opts: OptionsSilhouette): DessinEntite {
  return (ctx, entite, x, y, taille, t) => {
    const respiration = Math.sin(t * 3) * taille * 0.015;
    let alpha = 0.92;
    let decalageX = 0;
    let echelleY = 1;

    if (entite.etat === "apparition") {
      alpha = 0.55;
      echelleY = 0.85;
    } else if (entite.etat === "touche") {
      decalageX = Math.sin(t * 50) * taille * 0.06;
    } else if (entite.etat === "mort") {
      alpha = 0.28;
      echelleY = 0.55;
    }

    ctx.save();
    ctx.translate(x + decalageX, y + respiration);
    ctx.scale(1, echelleY);
    ctx.globalAlpha = alpha;

    // Aura de boss ou de télégraphe.
    if (entite.boss || entite.etat === "telegraphe") {
      ctx.strokeStyle = opts.accent;
      ctx.lineWidth = entite.etat === "telegraphe" ? 4 : 2;
      ctx.beginPath();
      ctx.arc(0, -taille * 0.1, taille * 0.48, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Buste à l'encre.
    const l = taille * opts.largeurEpaules;
    ctx.fillStyle = entite.etat === "touche" ? "#fff7ed" : opts.encre;
    ctx.strokeStyle = opts.accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-l * 0.55, taille * 0.38);
    ctx.quadraticCurveTo(-l * 0.65, -taille * 0.12, -l * 0.25, -taille * 0.22);
    ctx.lineTo(l * 0.25, -taille * 0.22);
    ctx.quadraticCurveTo(l * 0.65, -taille * 0.12, l * 0.55, taille * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tête.
    ctx.beginPath();
    ctx.arc(0, -taille * 0.36, taille * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Attribut distinctif.
    opts.attribut(ctx, taille, t);

    ctx.restore();
  };
}

function bandeauDeserteur(couleur: string): OptionsSilhouette["attribut"] {
  return (ctx, taille) => {
    ctx.strokeStyle = couleur;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-taille * 0.13, -taille * 0.38);
    ctx.lineTo(taille * 0.18, -taille * 0.38);
    ctx.stroke();
  };
}

export const DESSINS_ENCRE: Readonly<Record<IdEnnemi | IdBoss, DessinEntite>> = {
  zetsu: creerSilhouette({
    encre: "#1f2421",
    accent: "#bbf7d0",
    largeurEpaules: 0.42,
    attribut(ctx, taille) {
      // Collerette végétale.
      ctx.strokeStyle = "#86efac";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -taille * 0.32, taille * 0.2, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
  }),

  deserteurFeu: creerSilhouette({
    encre: "#181312",
    accent: "#f97316",
    largeurEpaules: 0.46,
    attribut: bandeauDeserteur("#f97316")
  }),

  deserteurVent: creerSilhouette({
    encre: "#121816",
    accent: "#6ee7b7",
    largeurEpaules: 0.46,
    attribut: bandeauDeserteur("#6ee7b7")
  }),

  deserteurFoudre: creerSilhouette({
    encre: "#12161c",
    accent: "#7dd3fc",
    largeurEpaules: 0.46,
    attribut: bandeauDeserteur("#7dd3fc")
  }),

  deserteurTerre: creerSilhouette({
    encre: "#1a1612",
    accent: "#d6a760",
    largeurEpaules: 0.48,
    attribut: bandeauDeserteur("#d6a760")
  }),

  deserteurEau: creerSilhouette({
    encre: "#111720",
    accent: "#38bdf8",
    largeurEpaules: 0.46,
    attribut: bandeauDeserteur("#38bdf8")
  }),

  anbuRacine: creerSilhouette({
    encre: "#141418",
    accent: "#e2e8f0",
    largeurEpaules: 0.44,
    attribut(ctx, taille) {
      // Masque blanc et tantō dans le dos.
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.arc(0, -taille * 0.36, taille * 0.11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(taille * 0.1, -taille * 0.5);
      ctx.lineTo(taille * 0.32, -taille * 0.1);
      ctx.stroke();
    }
  }),

  edoTensei: creerSilhouette({
    encre: "#1c1917",
    accent: "#a8a29e",
    largeurEpaules: 0.47,
    attribut(ctx, taille) {
      // Fissures de cendre sur le visage et le torse.
      ctx.strokeStyle = "#d6d3d1";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-taille * 0.08, -taille * 0.42);
      ctx.lineTo(taille * 0.05, -taille * 0.28);
      ctx.moveTo(-taille * 0.12, -taille * 0.05);
      ctx.lineTo(taille * 0.14, taille * 0.12);
      ctx.stroke();
    }
  }),

  zabuza: creerSilhouette({
    encre: "#0f172a",
    accent: "#38bdf8",
    largeurEpaules: 0.56,
    attribut(ctx, taille) {
      // Kubikiribōchō : la grande lame à encoche en diagonale.
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.moveTo(taille * 0.18, -taille * 0.55);
      ctx.lineTo(taille * 0.42, -taille * 0.48);
      ctx.lineTo(taille * 0.22, taille * 0.28);
      ctx.lineTo(taille * 0.08, taille * 0.22);
      ctx.closePath();
      ctx.fill();
    }
  }),

  kisame: creerSilhouette({
    encre: "#0c1926",
    accent: "#0ea5e9",
    largeurEpaules: 0.62,
    attribut(ctx, taille) {
      // Samehada : masse bandée massive sur l'épaule.
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(-taille * 0.34, -taille * 0.18, taille * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
  }),

  deidara: creerSilhouette({
    encre: "#181316",
    accent: "#fbbf24",
    largeurEpaules: 0.48,
    attribut(ctx, taille, t) {
      // Oiseaux d'argile blanche qui tournent autour de lui.
      ctx.fillStyle = "#fef3c7";
      for (const cote of [-1, 1]) {
        const ox = cote * taille * 0.36;
        const oy = -taille * 0.25 + Math.sin(t * 4 + cote) * taille * 0.04;
        ctx.beginPath();
        ctx.arc(ox, oy, taille * 0.06, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }),

  itachi: creerSilhouette({
    encre: "#110d12",
    accent: "#dc2626",
    largeurEpaules: 0.5,
    attribut(ctx, taille) {
      // Nuage rouge d'Akatsuki sur le manteau et éclat du Sharingan.
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(0, taille * 0.04, taille * 0.08, 0, Math.PI * 2);
      ctx.arc(-taille * 0.04, -taille * 0.36, taille * 0.025, 0, Math.PI * 2);
      ctx.arc(taille * 0.04, -taille * 0.36, taille * 0.025, 0, Math.PI * 2);
      ctx.fill();
    }
  }),

  madara: creerSilhouette({
    encre: "#1c0b0e",
    accent: "#f43f5e",
    largeurEpaules: 0.62,
    attribut(ctx, taille) {
      // Gunbai (éventail de guerre) dans le dos et crinière hérissée.
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(taille * 0.32, -taille * 0.12, taille * 0.18, 0, Math.PI * 2);
      ctx.stroke();
    }
  })
};
