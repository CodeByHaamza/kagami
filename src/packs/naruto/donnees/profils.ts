// Le profil de combat de chaque technique du pack : son rang canon, son élément dans
// le cycle, et son rôle en arcade.
//
// Ce ne sont pas des réglages : ce sont des faits de l'œuvre (spec §9.3), sourcés sur
// les databooks via la Narutopedia. Quand un jutsu n'a pas de rang officiel publié
// (les dōjutsu du Mangekyō, les kekkei genkai du Mokuton, ou certaines variantes), son
// rang vaut `null` et le moteur déduit la puissance du nombre de signes.
//
// Les douze techniques marquées `dojo` sont des démonstrations tournées vers le joueur
// (elles déforment son écran, le grisent ou l'enferment) : elles restent jouables au
// Dojo et n'ont pas d'effet en arcade tant qu'une variante offensive n'existe pas.

import type { ProfilCombat, Rang, Role } from "../../../moteur/types";
import type { ElementNaruto } from "./elements";
import type { JUTSUS } from "./jutsus";

export type IdJutsu = (typeof JUTSUS)[number]["id"];
export type IdTaijutsu =
  | "konohaSenpuu"
  | "shishiRendan"
  | "gatsuuga"
  | "kaiten"
  | "omoteRenge"
  | "hakkeRokujuuyonShou"
  | "hachimon";

const p = (
  rang: Rang | null,
  element: ElementNaruto | null,
  role: Role = "attaque"
): ProfilCombat => ({ rang, element, role });

export const PROFILS = {
  // ---- Katon ----
  goukakyu: p("C", "feu"),
  housenka: p("C", "feu"),
  ryuuka: p("C", "feu"),
  karyuuendan: p("B", "feu"),
  haisekishou: p("B", "feu"),
  goukamekkyaku: p("B", "feu"),

  // ---- Suiton ----
  mizurappa: p("C", "eau"),
  suikoudan: p("B", "eau"),
  suiryuudan: p("B", "eau"),
  suijinheki: p("B", "eau", "defense"),
  daibakufu: p("A", "eau"),
  kirigakure: p("D", "eau", "utilitaire"),
  suidanha: p("A", "eau"),

  // ---- Raiton ----
  chidori: p("A", "foudre"),
  jinraisen: p("C", "foudre"),
  kirin: p("S", "foudre"),

  // ---- Fūton ----
  daitoppa: p("C", "vent"),
  shinkuugyoku: p(null, "vent"),
  shinkuuha: p("B", "vent"),
  kamaitachi: p("C", "vent"),
  reppuushou: p("C", "vent"),
  rasenshuriken: p("S", "vent"),

  // ---- Doton ----
  tsuiga: p("B", "terre"),
  doryuudan: p("C", "terre"),
  doryuuheki: p("B", "terre", "defense"),
  doryuusou: p(null, "terre"),

  // ---- Mokuton : hors cycle, et tourné vers le joueur ----
  shichuurou: p(null, null, "dojo"),
  shichuuka: p(null, null, "dojo"),
  jukaikoutan: p(null, null, "dojo"),

  // ---- Ninjutsu ----
  rasengan: p("A", null),
  bunshin: p("E", null, "utilitaire"),
  kawarimi: p("E", null, "defense"),
  henge: p("E", null, "dojo"),
  shunshin: p("D", null, "utilitaire"),
  kagemane: p("B", null),
  harijizou: p(null, null, "defense"),
  shurikenkagebunshin: p("A", null),

  // ---- Kuchiyose, Kinjutsu, Fūinjutsu, Iryō, Genjutsu, Dōjutsu ----
  kuchiyose: p("C", null),
  gamaguchi: p("A", null, "dojo"),
  rashoumon: p("B", null, "defense"),
  edotensei: p("S", null, "dojo"),
  shikifuujin: p("S", null, "dojo"),
  fuujahouin: p("A", null, "dojo"),
  chakuranomesu: p(null, null),
  shousen: p("A", null, "dojo"),
  narakumi: p("D", null, "dojo"),
  jubakusatsu: p("B", null, "dojo"),
  tsukuyomi: p(null, null, "dojo"),
  izanagi: p("S", null, "defense"),
  amaterasu: p("S", "feu"),
  kamui: p(null, null),
  susanoo: p(null, null, "defense"),

  // ---- Taijutsu ----
  konohaSenpuu: p("D", null),
  shishiRendan: p("C", null),
  gatsuuga: p(null, null),
  kaiten: p("B", null, "defense"),
  omoteRenge: p("B", null),
  hakkeRokujuuyonShou: p(null, null),
  hachimon: p(null, null)
} as const satisfies Readonly<Record<IdJutsu | IdTaijutsu, ProfilCombat>>;
