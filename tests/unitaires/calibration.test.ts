// Tests unitaires du module de calibration de caméra et d'éclairage.

import { analyserEclairage, verifierCadrage } from "../../src/moteur/entree/calibration";

describe("analyserEclairage", () => {
  test("détecte une image trop sombre", () => {
    // Pixels presque noirs
    const pixels = new Uint8ClampedArray([10, 10, 10, 255, 20, 20, 20, 255]);
    const diag = analyserEclairage(pixels);
    expect(diag.statut).toBe("sombre");
    expect(diag.luminosite).toBeLessThan(50);
  });

  test("détecte un éclairage optimal", () => {
    // Pixels bien éclairés (~128)
    const pixels = new Uint8ClampedArray([120, 130, 140, 255, 110, 125, 130, 255]);
    const diag = analyserEclairage(pixels);
    expect(diag.statut).toBe("bon");
    expect(diag.luminosite).toBeGreaterThanOrEqual(50);
    expect(diag.luminosite).toBeLessThanOrEqual(220);
  });

  test("détecte une image éblouissante / surexposée", () => {
    // Pixels quasi blancs
    const pixels = new Uint8ClampedArray([250, 245, 255, 255, 240, 250, 248, 255]);
    const diag = analyserEclairage(pixels);
    expect(diag.statut).toBe("eblouissant");
    expect(diag.luminosite).toBeGreaterThan(220);
  });
});

describe("verifierCadrage", () => {
  test("signale si le joueur est trop près de la webcam", () => {
    expect(verifierCadrage(0.75).statut).toBe("tropPres");
  });

  test("signale si le joueur est trop loin de la webcam", () => {
    expect(verifierCadrage(0.12).statut).toBe("tropLoin");
  });

  test("valide une distance optimale", () => {
    expect(verifierCadrage(0.40).statut).toBe("bon");
  });

  test("gère l'absence de détection du corps", () => {
    expect(verifierCadrage(null).statut).toBe("absent");
  });
});

