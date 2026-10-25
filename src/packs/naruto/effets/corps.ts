// Les effets du taijutsu et des armes.
//
// Ils se dessinent presque tous **autour de la personne** plutôt qu'au centre de
// l'écran : un coup part de toi, il n'apparaît pas devant toi. C'est ce qui les
// distingue visuellement des ninjutsu, et ça tombe bien, c'est aussi ce qu'ils sont.

import type { Effet } from "../../../moteur/types";
import {
  enveloppe,
  emettre,
  FEU,
  FOUDRE,
  CENDRE,
  TERRE,
  hasard,
  lisse,
  teinte,
  TOUR,
  vignette
} from "./outils";

/** Un trait de vitesse : ce qui dit « ça va vite » sans rien dessiner de précis. */
function trait(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  longueur: number,
  angle: number,
  alpha: number
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle) * longueur, y + Math.sin(angle) * longueur);
  ctx.stroke();
  ctx.restore();
}

export const EFFETS_CORPS = {
  // ---- le taijutsu ----

  /** Konoha Senpū : un croissant qui balaie, à hauteur de jambe. */
  ouragan: {
    duree: 0.9,
    son: "vent",
    devant(ctx, e) {
      const p = lisse(e.t / 0.6);
      const r = Math.min(e.l, e.h) * 0.42;
      ctx.save();
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = "#cfe9ff";
      ctx.lineWidth = Math.max(6, e.l * 0.012);
      ctx.beginPath();
      ctx.arc(e.l / 2, e.h * 0.72, r, -0.2 + p * TOUR, 0.9 + p * TOUR);
      ctx.stroke();
      ctx.restore();
    }
  },

  /** Shishi Rendan : quatre impacts qui montent, un par coup. */
  lionCombo: {
    duree: 1.4,
    son: "boum",
    depart(s) {
      s.impacts = [0, 0.18, 0.4, 0.62];
    },
    devant(ctx, e, s) {
      for (const [i, depart] of (s.impacts as number[]).entries()) {
        const t = e.t - depart;
        if (t < 0 || t > 0.5) continue;
        const p = t / 0.5;
        const y = e.h * (0.62 - i * 0.1);
        ctx.save();
        ctx.globalAlpha = 1 - p;
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = "#fff3d0";
        ctx.beginPath();
        ctx.arc(e.main.x, y, Math.min(e.l, e.h) * 0.05 * (1 + p * 2), 0, TOUR);
        ctx.fill();
        ctx.restore();
      }
      e.secouer(6);
    }
  },

  /** Gatsūga : une toupie, et de la poussière. */
  crocsLacerants: {
    duree: 1.8,
    son: "vent",
    devant(ctx, e, _s, P) {
      const angle = e.t * 26;
      for (let i = 0; i < 3; i++) {
        trait(
          ctx,
          e.l / 2,
          e.h * 0.55,
          Math.min(e.l, e.h) * 0.3,
          angle + (i * TOUR) / 3,
          enveloppe(e.t, 1.8)
        );
      }
      emettre(e.dt, 50, () =>
        P.ajouter({
          x: e.l / 2 + hasard(-60, 60),
          y: e.h * 0.8,
          vx: hasard(-180, 180),
          vy: hasard(-140, -40),
          ay: 220,
          taille: hasard(10, 22),
          duree: hasard(0.6, 1.1),
          couleurs: TERRE,
          mode: "source-over"
        })
      );
      e.secouer(4);
    }
  },

  /** Hakkeshō Kaiten : un dôme de chakra qui repousse. */
  rotationCeleste: {
    duree: 1.6,
    son: "chakra",
    devant(ctx, e) {
      const p = lisse(e.t / 0.35) * (1 - lisse((e.t - 1.1) / 0.5));
      const r = Math.min(e.l, e.h) * 0.46 * p;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.3 * p;
        ctx.strokeStyle = "#8fd0ff";
        ctx.lineWidth = 4 + i * 3;
        ctx.beginPath();
        ctx.ellipse(e.l / 2, e.h * 0.55, r, r * (0.9 - i * 0.08), e.t * 4, 0, TOUR);
        ctx.stroke();
      }
      ctx.restore();
    }
  },

  /** Omote Renge : la montée, puis l'impact au sol. */
  lotusInitial: {
    duree: 2,
    son: "boum",
    devant(ctx, e, _s, P) {
      if (e.t < 1) {
        // les bandages qui s'enroulent, suggérés par des arcs
        ctx.save();
        ctx.globalAlpha = 1 - e.t;
        ctx.strokeStyle = "#e9e3d4";
        ctx.lineWidth = 5;
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.arc(e.l / 2, e.h * (0.3 + i * 0.07), 40 + i * 6, e.t * 6 + i, e.t * 6 + i + 2.2);
          ctx.stroke();
        }
        ctx.restore();
        return;
      }
      const p = (e.t - 1) / 1;
      teinte(ctx, e, "#2a1a0e", 0.3 * (1 - p));
      emettre(e.dt, 120, () =>
        P.ajouter({
          x: e.l / 2 + hasard(-140, 140),
          y: e.h * 0.9,
          vx: hasard(-260, 260),
          vy: hasard(-320, -80),
          ay: 420,
          taille: hasard(12, 30),
          duree: hasard(0.5, 1),
          couleurs: TERRE,
          mode: "source-over"
        })
      );
      e.secouer(16 * (1 - p));
    }
  },

  /** Hakke Rokujūyon Shō : soixante-quatre impacts, de plus en plus vite. */
  soixanteQuatrePoings: {
    duree: 2.6,
    son: "boum",
    depart(s) {
      s.coups = Array.from({ length: 28 }, (_, i) => ({
        t: Math.pow(i / 28, 1.6) * 2,
        x: hasard(-0.12, 0.12),
        y: hasard(-0.18, 0.18)
      }));
    },
    devant(ctx, e, s) {
      for (const coup of s.coups as { t: number; x: number; y: number }[]) {
        const t = e.t - coup.t;
        if (t < 0 || t > 0.22) continue;
        const p = t / 0.22;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 1 - p;
        ctx.fillStyle = "#dff1ff";
        ctx.beginPath();
        ctx.arc(
          e.l * (0.5 + coup.x),
          e.h * (0.5 + coup.y),
          Math.min(e.l, e.h) * 0.028 * (1 + p),
          0,
          TOUR
        );
        ctx.fill();
        ctx.restore();
      }
      e.secouer(3);
    }
  },

  /** Les Huit Portes : la vapeur monte, et le rouge gagne à chaque porte. */
  huitPortes: {
    duree: 6,
    son: "chakra",
    sonDepart: "boum",
    devant(ctx, e, _s, P) {
      const force = enveloppe(e.t, 6, 0.8, 1.2);
      vignette(ctx, e, "#8a0f0f", 0.7 * force);
      teinte(ctx, e, "#ff2a2a", 0.12 * force);
      emettre(e.dt, 70, () =>
        P.ajouter({
          x: e.l / 2 + hasard(-110, 110),
          y: e.h * hasard(0.45, 0.85),
          vx: hasard(-40, 40),
          vy: hasard(-200, -90),
          taille: hasard(16, 40),
          croissance: 26,
          duree: hasard(0.8, 1.4),
          couleurs: CENDRE,
          mode: "source-over",
          alpha: 0.5
        })
      );
      e.secouer(5 * force);
    }
  },

  // ---- les armes ----

  shurikenLance: {
    duree: 0.7,
    son: "shuriken",
    devant(ctx, e) {
      const p = Math.min(e.t / 0.55, 1);
      const x = e.main.x + (e.l * 0.9 - e.main.x) * p;
      const y = e.main.y + (e.h * 0.35 - e.main.y) * p;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(e.t * 40);
      ctx.strokeStyle = "#cfd6e0";
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos((i * TOUR) / 4) * 16, Math.sin((i * TOUR) / 4) * 16);
        ctx.stroke();
      }
      ctx.restore();
    }
  },

  kunaiLance: {
    duree: 0.7,
    son: "shuriken",
    devant(ctx, e) {
      const p = Math.min(e.t / 0.5, 1);
      const x = e.main.x + (e.l * 0.92 - e.main.x) * p;
      const y = e.main.y + (e.h * 0.4 - e.main.y) * p;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(e.h * 0.4 - e.main.y, e.l * 0.92 - e.main.x));
      ctx.fillStyle = "#b9c2cf";
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-10, -6);
      ctx.lineTo(-10, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#3a2a1a";
      ctx.fillRect(-20, -3, 12, 6);
      ctx.restore();
    }
  },

  /** Le combo canon : le parchemin part avec le kunai, puis tout saute. */
  parcheminExplosif: {
    duree: 1.6,
    son: "boum",
    sonDepart: "shuriken",
    depart(s, e) {
      s.cible = { x: e.l * 0.78, y: e.h * 0.42 };
    },
    devant(ctx, e, s, P) {
      const cible = s.cible as { x: number; y: number };

      if (e.t < 0.5) {
        const p = e.t / 0.5;
        ctx.save();
        ctx.translate(e.main.x + (cible.x - e.main.x) * p, e.main.y + (cible.y - e.main.y) * p);
        ctx.rotate(e.t * 12);
        ctx.fillStyle = "#e9e0c8";
        ctx.fillRect(-7, -11, 14, 22);
        ctx.fillStyle = "#9a1b1b";
        ctx.font = "12px serif";
        ctx.textAlign = "center";
        ctx.fillText("爆", 0, 5);
        ctx.restore();
        return;
      }

      // le délai : le parchemin est posé, il n'a pas encore sauté
      if (e.t < 0.75) return;

      const p = (e.t - 0.75) / 0.85;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = "#ffd36b";
      ctx.beginPath();
      ctx.arc(cible.x, cible.y, Math.min(e.l, e.h) * 0.3 * p, 0, TOUR);
      ctx.fill();
      ctx.restore();

      emettre(e.dt, 160, () =>
        P.ajouter({
          x: cible.x,
          y: cible.y,
          vx: hasard(-460, 460),
          vy: hasard(-460, 260),
          ay: 320,
          frein: 1.4,
          taille: hasard(10, 26),
          duree: hasard(0.4, 0.9),
          couleurs: FEU
        })
      );
      e.secouer(22 * (1 - p));
    }
  },

  /** Le retour visuel d'une garde qui encaisse. */
  garde: {
    duree: 0.5,
    son: "signe",
    devant(ctx, e) {
      const p = e.t / 0.5;
      ctx.save();
      ctx.globalAlpha = (1 - p) * 0.8;
      ctx.strokeStyle = FOUDRE[1]!;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(e.l / 2, e.h * 0.45, Math.min(e.l, e.h) * (0.2 + p * 0.08), 0, TOUR);
      ctx.stroke();
      ctx.restore();
    }
  }
} satisfies Readonly<Record<string, Effet>>;
