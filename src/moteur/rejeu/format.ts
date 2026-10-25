// Le format d'une session rejouable.
//
// Une session est ce que la camera a montre pendant un moment : pour chaque image, le
// jeton que le reconnaisseur a vu et les points que le lecteur de posture a mesures.
// La rejouer revient a remettre exactement la meme chose devant le moteur, autant de
// fois qu'on veut, sans camera et sans corps.
//
// C'est ce qui rend les seuils de gestes reglables : on compare des nombres au lieu de
// deviner en bougeant devant un ecran.

import type { Detection, Point3, Posture } from "../types";

export const VERSION_SESSION = 1;

/** Au-dela, la precision ne sert plus qu'a quadrupler le poids du fichier. */
const DECIMALES = 3;

export interface ImageSession {
  /** Millisecondes depuis le debut de la session. */
  t: number;
  detection: Detection | null;
  posture: Posture | null;
}

export interface Session {
  version: number;
  nom: string;
  /** La resolution de la camera au moment de l'enregistrement, pour le contexte. */
  largeur: number;
  hauteur: number;
  images: readonly ImageSession[];
}

const arrondir = (v: number): number => Number(v.toFixed(DECIMALES));

const allegerPoint = (p: Point3): Point3 => ({
  x: arrondir(p.x),
  y: arrondir(p.y),
  z: arrondir(p.z),
  visibilite: arrondir(p.visibilite)
});

const allegerPosture = (p: Posture | null): Posture | null =>
  p && { horodatage: p.horodatage, points: p.points.map(allegerPoint) };

export function serialiser(session: Session): string {
  return JSON.stringify({
    ...session,
    images: session.images.map(i => ({ ...i, posture: allegerPosture(i.posture) }))
  });
}

/**
 * Relit une session. Toute entree qui n'en est pas une leve une erreur qui parle de
 * session : « Unexpected end of JSON input » ne dit rien a qui depose un fichier.
 */
export function deserialiser(texte: string): Session {
  let brut: unknown;
  try {
    brut = JSON.parse(texte);
  } catch {
    throw new Error("Ce fichier n'est pas une session : il n'est meme pas du JSON valide.");
  }

  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) {
    throw new Error("Ce fichier n'est pas une session.");
  }

  const s = brut as Partial<Session>;
  if (s.version !== VERSION_SESSION) {
    throw new Error(
      `Session de version ${String(s.version)}, alors que cette version de l'appli lit ` +
        `la version ${VERSION_SESSION}.`
    );
  }
  if (!Array.isArray(s.images)) throw new Error("Cette session n'a pas d'images.");

  return {
    version: VERSION_SESSION,
    nom: s.nom ?? "sans nom",
    largeur: s.largeur ?? 0,
    hauteur: s.hauteur ?? 0,
    images: s.images
  };
}
