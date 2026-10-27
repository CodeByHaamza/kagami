// Module de diagnostic de calibration : éclairage et distance (§10.3).
//
// Permet de vérifier les conditions de détection (mains et buste visibles, luminosité)
// avant d'entamer une session de combat d'arcade ou d'entraînement intense.

export type StatutEclairage = "sombre" | "bon" | "eblouissant";
export type StatutCadrage = "tropPres" | "tropLoin" | "bon" | "absent";

export interface DiagnosticEclairage {
  luminosite: number;
  statut: StatutEclairage;
}

export interface DiagnosticCadrage {
  statut: StatutCadrage;
}

/** Calcule la luminance relative moyenne d'un tampon de pixels RGBA. */
export function analyserEclairage(pixels: Uint8ClampedArray): DiagnosticEclairage {
  if (pixels.length < 4) {
    return { luminosite: 0, statut: "sombre" };
  }

  let somme = 0;
  const totalPixels = Math.floor(pixels.length / 4);

  // Échantillonnage régulier pour garder l'analyse ultra rapide (< 1 ms)
  const pas = Math.max(1, Math.floor(totalPixels / 500));
  let echantillons = 0;

  for (let i = 0; i < pixels.length; i += pas * 4) {
    const r = pixels[i] ?? 0;
    const g = pixels[i + 1] ?? 0;
    const b = pixels[i + 2] ?? 0;
    // Formule standard ITU-R BT.601
    somme += 0.299 * r + 0.587 * g + 0.114 * b;
    echantillons++;
  }

  const luminosite = Math.round(somme / Math.max(1, echantillons));
  let statut: StatutEclairage = "bon";
  if (luminosite < 50) {
    statut = "sombre";
  } else if (luminosite > 220) {
    statut = "eblouissant";
  }

  return { luminosite, statut };
}

/** Évalue la distance du joueur par rapport à la largeur normale de ses épaules. */
export function verifierCadrage(largeurEpaulesNormalisee: number | null): DiagnosticCadrage {
  if (largeurEpaulesNormalisee === null) {
    return { statut: "absent" };
  }

  if (largeurEpaulesNormalisee > 0.65) {
    return { statut: "tropPres" };
  }
  if (largeurEpaulesNormalisee < 0.18) {
    return { statut: "tropLoin" };
  }

  return { statut: "bon" };
}
