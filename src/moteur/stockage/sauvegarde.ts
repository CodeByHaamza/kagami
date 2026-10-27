// Ce que le joueur garde d'une visite à l'autre.
//
// Version 2 : intègre la fiche ninja (clan, village, contrat d'invocation) et la
// progression (grade, missions réussies, examens passés, records du Dojo).
// Les sauvegardes v1 et les clés historiques ninjutsu-* sont migrées automatiquement
// sans perte de données.
//
// Tous les accès sont protégés : en navigation privée, avec les cookies bloqués ou le
// quota plein, `localStorage` jette au lieu de répondre. L'appli doit continuer à
// tourner, simplement sans se souvenir.

import type { Langue } from "../types";

export const VERSION = 2;

const CLE = `kagami.v${VERSION}`;

/** Les clés de la version d'origine, reprises une fois puis effacées. */
const ANCIENNES = {
  decouvertes: "ninjutsu-decouverts",
  compteurs: "ninjutsu-compteurs",
  photos: "ninjutsu-photos"
} as const;

export type Grade = "academie" | "genin" | "chunin" | "jonin" | "kage";
export type Village = "konoha" | "suna" | "kiri" | "iwa" | "kumo";
export type Contrat = "crapauds" | "serpents" | "limaces" | "chiens";

export interface FicheNinja {
  nom: string;
  clan: string;
  village: Village;
  contrat: Contrat;
}

export interface Progression {
  grade: Grade;
  missionsReussies: string[];
  examensPasses: string[];
  recordsDojo: Record<string, number>;
}

export const PROGRESSION_PAR_DEFAUT: Progression = {
  grade: "academie",
  missionsReussies: [],
  examensPasses: [],
  recordsDojo: {}
};

export interface Photo {
  image: string;
  score: number;
}

export interface Sauvegarde {
  version: number;
  /**
   * Vrai tant que rien n'a jamais ete enregistre. C'est ce qui permet de consulter la
   * langue du navigateur une seule fois, au tout premier lancement : sans ce drapeau,
   * `charger()` renvoyant toujours un objet complet, le defaut `fr` gagnerait toujours.
   */
  premiereVisite: boolean;
  /** Les identifiants des techniques déjà réussies. */
  decouvertes: string[];
  /** Celles réussies en entraînement, c'est-à-dire volontairement et à la demande. */
  entraines: string[];
  /** Combien de fois chaque jeton a été validé. */
  compteurs: Record<string, number>;
  /** La meilleure photo prise de chaque jeton. */
  photos: Record<string, Photo>;
  langue: Langue;
  fiche: FicheNinja | null;
  progression: Progression;
}

export const PAR_DEFAUT: Sauvegarde = {
  version: VERSION,
  premiereVisite: true,
  decouvertes: [],
  entraines: [],
  compteurs: {},
  photos: {},
  langue: "fr",
  fiche: null,
  progression: PROGRESSION_PAR_DEFAUT
};

const copieParDefaut = (): Sauvegarde => ({
  ...structuredClone(PAR_DEFAUT),
  progression: structuredClone(PROGRESSION_PAR_DEFAUT)
});

function lireBrut(cle: string): unknown {
  try {
    const texte = localStorage.getItem(cle);
    return texte === null ? null : JSON.parse(texte);
  } catch {
    // stockage refusé, ou contenu illisible : on repart de zéro
    return null;
  }
}

function ecrireBrut(cle: string, valeur: unknown): void {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    // stockage plein ou interdit : tant pis, la partie en cours marche quand même
  }
}

function oublier(cle: string): void {
  try {
    localStorage.removeItem(cle);
  } catch {
    // rien à faire : la clé restera, sans conséquence
  }
}

const estObjet = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Migre une sauvegarde v1 vers la v2. */
function migrerDepuisV1(): Sauvegarde | null {
  const v1 = lireBrut("kagami.v1");
  if (!estObjet(v1)) return null;

  const reprise: Sauvegarde = {
    ...copieParDefaut(),
    version: VERSION,
    premiereVisite: v1.premiereVisite === true,
    decouvertes: Array.isArray(v1.decouvertes) ? (v1.decouvertes as string[]) : [],
    entraines: Array.isArray(v1.entraines) ? (v1.entraines as string[]) : [],
    compteurs: estObjet(v1.compteurs) ? (v1.compteurs as Record<string, number>) : {},
    photos: estObjet(v1.photos) ? (v1.photos as Record<string, Photo>) : {},
    langue: v1.langue === "en" ? "en" : "fr",
    fiche: null,
    progression: structuredClone(PROGRESSION_PAR_DEFAUT)
  };

  ecrireBrut(CLE, reprise);
  oublier("kagami.v1");
  return reprise;
}

/** Reprend les trois clés de la version d'origine, puis les efface. */
function migrerDepuisAncien(): Sauvegarde | null {
  const decouvertes = lireBrut(ANCIENNES.decouvertes);
  const compteurs = lireBrut(ANCIENNES.compteurs);
  const photos = lireBrut(ANCIENNES.photos);
  if (decouvertes === null && compteurs === null && photos === null) return null;

  const reprise: Sauvegarde = {
    ...copieParDefaut(),
    premiereVisite: false,
    decouvertes: Array.isArray(decouvertes) ? (decouvertes as string[]) : [],
    compteurs: estObjet(compteurs) ? (compteurs as Record<string, number>) : {},
    photos: estObjet(photos) ? (photos as Record<string, Photo>) : {}
  };

  ecrireBrut(CLE, reprise);
  for (const ancienne of Object.values(ANCIENNES)) oublier(ancienne);
  return reprise;
}

/**
 * La sauvegarde du joueur. Toujours un objet complet : une sauvegarde partielle,
 * illisible, ou écrite par une version plus récente retombe sur les valeurs par défaut
 * plutôt que de laisser l'appli manipuler des champs qu'elle ne comprend pas.
 */
export function charger(): Sauvegarde {
  const brut = lireBrut(CLE);

  if (estObjet(brut)) {
    if (brut.version !== VERSION) return copieParDefaut();
    return {
      ...copieParDefaut(),
      ...(brut as Partial<Sauvegarde>),
      progression: {
        ...structuredClone(PROGRESSION_PAR_DEFAUT),
        ...(estObjet(brut.progression) ? brut.progression : {})
      },
      version: VERSION
    };
  }

  return migrerDepuisV1() ?? migrerDepuisAncien() ?? copieParDefaut();
}

export function enregistrer(sauvegarde: Sauvegarde): void {
  ecrireBrut(CLE, { ...sauvegarde, version: VERSION, premiereVisite: false });
}
