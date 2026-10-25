// Le taijutsu : les techniques qui se font au corps, sans aucun signe.
//
// C'est la famille que le catalogue d'origine n'avait pas, et c'est celle qui exploite
// nativement le lecteur de posture. C'est aussi la vraie reponse au chakra vide : on
// peut toujours frapper.
//
// La grammaire est la meme que pour les signes — un second alphabet, rien de plus.

import type { Technique } from "../../../moteur/types";
import type { JetonCorps } from "../../../moteur/corps/gestes";

const t = (
  id: string,
  kanji: string,
  romaji: string,
  signes: readonly JetonCorps[],
  effet: string,
  options: Partial<Technique<JetonCorps>> = {}
): Technique<JetonCorps> => ({
  id,
  type: "Taijutsu",
  kanji,
  romaji,
  signes,
  effet,
  source: "anime",
  ...options
});

export const TAIJUTSU: readonly Technique<JetonCorps>[] = [
  t("konohaSenpuu", "木ノ葉旋風", "Konoha Senpū", ["coupDePied", "coupDePied"], "ouragan"),

  t(
    "shishiRendan",
    "獅子連弾",
    "Shishi Rendan",
    ["directG", "directD", "coupDePied", "coupDePied"],
    "lionCombo"
  ),

  // Kiba tourne sur lui-meme : une rotation tenue, pas un enchainement.
  t("gatsuuga", "牙通牙", "Gatsūga", ["rotation"], "crocsLacerants", { tenir: true }),

  // Neji tourne en gardant : une defense declenchee au corps, et non aux signes.
  t("kaiten", "八卦掌回天", "Hakkeshō Kaiten", ["rotation", "garde"], "rotationCeleste"),

  t("omoteRenge", "表蓮華", "Omote Renge", ["saut", "coupDePied"], "lotusInitial"),

  // Une rafale, pas une suite : huit frappes en trois secondes, les deux bras melanges.
  t("hakkeRokujuuyonShou", "八卦六十四掌", "Hakke Rokujūyon Shō", [], "soixanteQuatrePoings", {
    cadence: { nombre: 8, dans: 3000, parmi: ["directG", "directD"] }
  }),

  // Les Huit Portes : bras croises, tenus. Chaque palier ouvre une porte de plus, et
  // chacune coute de la vie — c'est le canon, et c'est le pari du jeu.
  t("hachimon", "八門遁甲", "Hachimon Tonkō", ["brasCroises"], "huitPortes", { tenir: true })
];

/**
 * Les noms des Huit Portes, dans l'ordre. La huitieme tue : elle n'est pas jouable
 * avant que le plan 4 ait une progression a laquelle l'accrocher.
 */
export const PORTES = [
  { id: "kaimon", kanji: "開門", romaji: "Kaimon" },
  { id: "kyuumon", kanji: "休門", romaji: "Kyūmon" },
  { id: "seimon", kanji: "生門", romaji: "Seimon" },
  { id: "shoumon", kanji: "傷門", romaji: "Shōmon" },
  { id: "tomon", kanji: "杜門", romaji: "Tomon" },
  { id: "keimon", kanji: "景門", romaji: "Keimon" },
  { id: "kyoumon", kanji: "驚門", romaji: "Kyōmon" },
  { id: "shimon", kanji: "死門", romaji: "Shimon" }
] as const;
