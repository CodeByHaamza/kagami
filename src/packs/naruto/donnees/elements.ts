// Les cinq natures de chakra du cycle élémentaire.
//
// Chaque élément bat le suivant dans l'ordre du tableau `CYCLE` (spec §9.1) :
// Feu (火) ▶ Vent (風) ▶ Foudre (雷) ▶ Terre (土) ▶ Eau (水) ▶ Feu.
//
// Les noms courants se traduisent dans `i18n/` (`element.feu`, etc.) : ici ne restent
// que le kanji et le romaji, et une teinte pour le télégraphe.

export type ElementNaruto = "feu" | "vent" | "foudre" | "terre" | "eau";

export const CYCLE: readonly ElementNaruto[] = ["feu", "vent", "foudre", "terre", "eau"];

export const ELEMENTS: Readonly<
  Record<ElementNaruto, { kanji: string; romaji: string; couleur: string }>
> = {
  feu: { kanji: "火", romaji: "Katon", couleur: "#f97316" },
  vent: { kanji: "風", romaji: "Fūton", couleur: "#6ee7b7" },
  foudre: { kanji: "雷", romaji: "Raiton", couleur: "#7dd3fc" },
  terre: { kanji: "土", romaji: "Doton", couleur: "#d6a760" },
  eau: { kanji: "水", romaji: "Suiton", couleur: "#38bdf8" }
};
