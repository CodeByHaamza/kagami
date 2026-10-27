// Tests unitaires du moteur de cosmétiques en réalité augmentée.

import {
  estimerPoseTete,
  dessinerCosmetiqueAR,
  dessinerBandeau,
  dessinerMasqueAnbu
} from "../../src/moteur/rendu/cosmetiques";
import type { Contexte2D, Posture } from "../../src/moteur/types";

function creerContexteFactice(): Contexte2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    roundRect: vi.fn(),
    createLinearGradient: vi.fn().mockReturnValue({
      addColorStop: vi.fn()
    })
  } as unknown as Contexte2D;
}

describe("estimerPoseTete", () => {
  test("retourne null si la posture est nulle ou incomplète", () => {
    expect(estimerPoseTete(null, 640, 480)).toBeNull();
    expect(estimerPoseTete({ points: [], horodatage: 0 }, 640, 480)).toBeNull();
  });

  test("calcule la position et la largeur du front à partir des repères", () => {
    // 33 points simulés avec yeux et oreilles
    const points = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibilite: 0.9 }));
    points[0] = { x: 0.5, y: 0.35, z: 0, visibilite: 0.95 }; // Nez
    points[2] = { x: 0.45, y: 0.3, z: 0, visibilite: 0.95 }; // Oeil G
    points[5] = { x: 0.55, y: 0.3, z: 0, visibilite: 0.95 }; // Oeil D
    points[7] = { x: 0.4, y: 0.3, z: 0, visibilite: 0.95 }; // Oreille G
    points[8] = { x: 0.6, y: 0.3, z: 0, visibilite: 0.95 }; // Oreille D

    const pose = estimerPoseTete({ points, horodatage: 100 }, 640, 480);
    expect(pose).not.toBeNull();
    if (pose) {
      expect(pose.x).toBeCloseTo(320, 0);
      expect(pose.y).toBeLessThan(480 * 0.35); // Au-dessus du nez
      expect(pose.largeur).toBeGreaterThan(50);
      expect(pose.angle).toBeCloseTo(0, 1);
    }
  });
});

describe("dessin cosmétiques", () => {
  test("ne dessine rien si cosmétique est 'aucun'", () => {
    const ctx = creerContexteFactice();
    const posture: Posture = {
      points: Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibilite: 0.9 })),
      horodatage: 0
    };
    dessinerCosmetiqueAR(ctx, posture, { largeur: 640, hauteur: 480, cosmetique: "aucun" });
    expect(ctx.save).not.toHaveBeenCalled();
  });

  test("dessine le bandeau de Konoha sans erreur", () => {
    const ctx = creerContexteFactice();
    dessinerBandeau(ctx, 320, 100, 120, 0, "konoha");
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  test("dessine le masque ANBU sans erreur", () => {
    const ctx = creerContexteFactice();
    dessinerMasqueAnbu(ctx, 320, 150, 140, 160, 0);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });
});
