// Effets des jutsus ultimes : Rinnegan, Senjutsu, Hyōton et Hiden.

import { emettre, hasard, lisse, enveloppe, TOUR, teinte } from "./outils";
import type { Effet } from "../../../moteur/types";

export const ULTIMES = {
  // Shinra Tensei : onde répulsive gravitationnelle suprême
  shinraTensei: {
    duree: 2.5,
    son: "boum",
    devant(ctx, e) {
      const p = lisse(e.t / 1.2);
      const rMax = Math.hypot(e.l, e.h) * 0.65;
      const r = p * rMax;

      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, " + (1 - p) * 0.9 + ")";
      ctx.lineWidth = Math.max(4, (1 - p) * 32);
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 24;

      ctx.beginPath();
      ctx.arc(e.main.x, e.main.y, r, 0, Math.PI * 2);
      ctx.stroke();

      // Deuxième onde concentrique
      if (p > 0.2) {
        const p2 = (p - 0.2) / 0.8;
        ctx.strokeStyle = "rgba(186, 230, 253, " + (1 - p2) * 0.7 + ")";
        ctx.lineWidth = Math.max(2, (1 - p2) * 16);
        ctx.beginPath();
        ctx.arc(e.main.x, e.main.y, p2 * rMax, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      teinte(ctx, e, "#ffffff", (1 - p) * 0.35);
      e.secouer(14 * (1 - p));
    }
  },

  // Banshō Ten'in : onde attractive gravitationnelle
  banshoTenin: {
    duree: 2.2,
    son: "vent",
    devant(ctx, e, s, P) {
      const a = enveloppe(e.t, 2.2, 0.4, 0.4);
      // Lignes de force convergeant vers le point focal
      emettre(e.dt, 180, () => {
        const angle = hasard(0, TOUR);
        const dist = hasard(Math.min(e.l, e.h) * 0.3, Math.min(e.l, e.h) * 0.6);
        P.ajouter({
          x: e.main.x + Math.cos(angle) * dist,
          y: e.main.y + Math.sin(angle) * dist,
          vx: -Math.cos(angle) * 300,
          vy: -Math.sin(angle) * 300,
          taille: hasard(4, 9),
          duree: 0.5,
          couleurs: ["#a855f7", "#6366f1"],
          mode: "lighter"
        });
      });
      teinte(ctx, e, "#312e81", 0.15 * a);
      e.secouer(4 * a);
    }
  },

  // Chibaku Tensei : création d'un satellite gravitationnel
  chibakuTensei: {
    duree: 6.0,
    son: "terre",
    devant(ctx, e, s, P) {
      const p = Math.min(1, e.t / 4.5);
      const x = e.l / 2;
      const y = e.h * 0.25 - p * e.h * 0.05;
      const r = Math.min(e.l, e.h) * (0.05 + 0.22 * p);

      // Orbe noir d'attraction
      ctx.save();
      ctx.fillStyle = "#09090b";
      ctx.strokeStyle = "#8b5cf6";
      ctx.lineWidth = 6;
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Roches polygonales aspirées
      emettre(e.dt, 140, () => {
        const angle = hasard(0, TOUR);
        const dist = hasard(r * 1.5, r * 3.5);
        P.ajouter({
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist,
          vx: -Math.cos(angle) * 220,
          vy: -Math.sin(angle) * 220,
          taille: hasard(8, 20),
          duree: 0.7,
          couleurs: ["#57534e", "#78716c", "#292524"],
          mode: "source-over"
        });
      });
      ctx.restore();

      teinte(ctx, e, "#18181b", 0.25 * p);
      e.secouer(p * 8);
    }
  },

  // Senpō : Chō Ōdama Rasengan (Rasengan géant du Mode Ermite)
  senjutsuRasengan: {
    duree: 4.0,
    son: "rasengan",
    devant(ctx, e, s, P) {
      const p = Math.min(1, e.t / 1.5);
      const rayon = Math.min(e.l, e.h) * (0.15 + 0.32 * p);

      ctx.save();
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 40;

      // Cœur de chakra tourbillonnant
      const g = ctx.createRadialGradient(e.main.x, e.main.y, 0, e.main.x, e.main.y, rayon);
      g.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      g.addColorStop(0.4, "rgba(56, 189, 248, 0.85)");
      g.addColorStop(0.8, "rgba(14, 165, 233, 0.65)");
      g.addColorStop(1, "rgba(2, 132, 199, 0)");

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(e.main.x, e.main.y, rayon, 0, Math.PI * 2);
      ctx.fill();

      // Spire d'énergie naturelle senjutsu dorée
      ctx.strokeStyle = "rgba(250, 204, 21, 0.75)";
      ctx.lineWidth = 5;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(
          e.main.x,
          e.main.y,
          rayon * (0.8 + 0.1 * i),
          rayon * 0.35,
          e.t * 6 + (i * Math.PI) / 4,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
      ctx.restore();

      // Particules de vent et senjutsu
      emettre(e.dt, 200, () => {
        const a = hasard(0, TOUR);
        P.ajouter({
          x: e.main.x + Math.cos(a) * rayon * 0.8,
          y: e.main.y + Math.sin(a) * rayon * 0.8,
          vx: Math.cos(a) * hasard(60, 180),
          vy: Math.sin(a) * hasard(60, 180),
          taille: hasard(6, 14),
          duree: 0.5,
          couleurs: ["#bae6fd", "#fef08a"],
          mode: "lighter"
        });
      });

      e.secouer(6 * p);
    }
  },

  // Makyō Hyōshō : Miroirs démoniaques de glace (Haku)
  miroirsGlace: {
    duree: 5.0,
    son: "eau",
    devant(ctx, e, s, P) {
      const a = enveloppe(e.t, 5.0, 0.8, 0.8);
      const nbMiroirs = 7;
      const rayonDôme = Math.min(e.l, e.h) * 0.45;

      ctx.save();
      ctx.fillStyle = "rgba(224, 242, 254, " + 0.45 * a + ")";
      ctx.strokeStyle = "rgba(186, 230, 253, " + 0.9 * a + ")";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 15;

      for (let i = 0; i < nbMiroirs; i++) {
        const angle = (i / nbMiroirs) * Math.PI + Math.PI;
        const mx = e.l / 2 + Math.cos(angle) * rayonDôme;
        const my = e.h * 0.55 + Math.sin(angle) * rayonDôme * 0.4;
        const lMiroir = rayonDôme * 0.28;
        const hMiroir = rayonDôme * 0.65;

        ctx.fillRect(mx - lMiroir / 2, my - hMiroir / 2, lMiroir, hMiroir);
        ctx.strokeRect(mx - lMiroir / 2, my - hMiroir / 2, lMiroir, hMiroir);
      }
      ctx.restore();

      // Salve d'aiguilles de glace senbon
      emettre(e.dt, 160, () => {
        P.ajouter({
          x: hasard(e.l * 0.2, e.l * 0.8),
          y: hasard(e.h * 0.3, e.h * 0.7),
          vx: hasard(-200, 200),
          vy: hasard(300, 700),
          taille: hasard(4, 8),
          croissance: 15,
          duree: 0.4,
          couleurs: ["#ffffff", "#e0f2fe"],
          mode: "lighter"
        });
      });
      teinte(ctx, e, "#0284c7", 0.15 * a);
    }
  },

  // Kikaichū no Jutsu : Nuée d'insectes destructeurs du clan Aburame
  nueeInsectes: {
    duree: 4.5,
    son: "fumee",
    devant(ctx, e, s, P) {
      const a = enveloppe(e.t, 4.5, 0.6, 0.6);
      emettre(e.dt, 260, () => {
        const angle = hasard(0, TOUR);
        const r = hasard(40, Math.min(e.l, e.h) * 0.45);
        P.ajouter({
          x: e.l / 2 + Math.cos(angle) * r,
          y: e.h * 0.55 + Math.sin(angle) * r,
          vx: hasard(-120, 120),
          vy: hasard(-120, 120),
          taille: hasard(3, 6),
          duree: hasard(0.8, 1.5),
          couleurs: ["#1c1917", "#292524", "#0c0a09"],
          mode: "source-over"
        });
      });
      teinte(ctx, e, "#1c1917", 0.18 * a);
    }
  }
} as const satisfies Readonly<Record<string, Effet>>;
