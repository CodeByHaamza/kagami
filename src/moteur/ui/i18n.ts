// L'internationalisation.
//
// Francais par defaut, anglais complet. Les noms japonais (kanji, romaji) ne passent
// pas par ici : ils ne se traduisent pas et restent dans les donnees du pack.
//
// Le moteur ne connait aucune chaine : un pack enregistre ses dictionnaires, et le test
// de parite des cles empeche qu'une langue prenne du retard sur l'autre.

import type { Langue } from "../types";

export type Dictionnaire = Readonly<Record<string, string>>;

/** Ce qu'on peut glisser dans une chaine : `{faits}` sera remplace. */
export type Valeurs = Readonly<Record<string, string | number>>;

const dictionnaires: Record<Langue, Record<string, string>> = { fr: {}, en: {} };

let courante: Langue = "fr";

/**
 * La langue a utiliser. Sans argument, celle en cours ; avec une etiquette de langue
 * (`navigator.language`), celle qu'on en deduit, francais par defaut.
 */
export function langue(etiquette?: string): Langue {
  if (etiquette === undefined) return courante;
  return etiquette.toLowerCase().startsWith("en") ? "en" : "fr";
}

export function changerLangue(l: Langue): void {
  courante = l;
}

/** Ajoute les chaines d'un pack au dictionnaire d'une langue. */
export function enregistrer(l: Langue, dictionnaire: Dictionnaire): void {
  Object.assign(dictionnaires[l], dictionnaire);
}

/**
 * La chaine traduite. Si la cle manque, renvoie la cle elle-meme : une etiquette
 * bizarre a l'ecran se voit et se corrige, une exception en plein jutsu non.
 */
export function t(cle: string, valeurs?: Valeurs): string {
  const brut = dictionnaires[courante][cle] ?? dictionnaires.fr[cle] ?? cle;
  if (!valeurs) return brut;
  return brut.replace(/\{(\w+)\}/g, (entier, nom: string) =>
    nom in valeurs ? String(valeurs[nom]) : entier
  );
}

/** Pour les tests : repart d'un etat vierge. */
export function reinitialiser(): void {
  dictionnaires.fr = {};
  dictionnaires.en = {};
  courante = "fr";
}
