// Les 52 jutsus : leur enchainement de signes et l'effet qu'ils declenchent.
//
// Les noms courants et les descriptions se traduisent : voir donnees/textes-fr.ts.
// Le Rasengan, le Rasenshuriken, Kirin et les techniques du Sharingan n'ont pas de
// signes dans l'anime : leurs enchainements sont inventes pour l'appli, marques
// source: "appli".

import type { Technique } from "../../../moteur/types";
import type { SigneNaruto } from "./signes";

export const JUTSUS = [
  { id: "goukakyu", type: "Katon", kanji: "火遁・豪火球の術", romaji: "Katon : Gōkakyū no jutsu", signes: ["serpent","belier","singe","sanglier","cheval","tigre"], effet: "bouleDeFeu", source: "anime", variante: ["serpent","tigre","singe","sanglier","cheval","tigre"] },
  { id: "housenka", type: "Katon", kanji: "火遁・鳳仙火の術", romaji: "Katon : Hōsenka no jutsu", signes: ["rat","tigre","chien","boeuf","lievre","tigre"], effet: "pluieDeFeu", source: "anime" },
  { id: "ryuuka", type: "Katon", kanji: "火遁・龍火の術", romaji: "Katon : Ryūka no jutsu", signes: ["serpent","dragon","lievre","tigre"], effet: "souffleDeFeu", source: "anime" },
  { id: "karyuuendan", type: "Katon", kanji: "火遁・火龍炎弾", romaji: "Katon : Karyū Endan", signes: ["belier","cheval","serpent","dragon","rat","boeuf","tigre"], effet: "dragonDeFeu", source: "anime" },
  { id: "haisekishou", type: "Katon", kanji: "火遁・灰積焼", romaji: "Katon : Haisekishō", signes: ["serpent","rat","serpent","tigre"], effet: "cendres", source: "anime" },
  { id: "goukamekkyaku", type: "Katon", kanji: "火遁・豪火滅却", romaji: "Katon : Gōka Mekkyaku", signes: ["cheval"], effet: "murDeFeu", source: "anime", tenir: true },
  { id: "mizurappa", type: "Suiton", kanji: "水遁・水喇叭", romaji: "Suiton : Mizurappa", signes: ["dragon","tigre","lievre"], effet: "jetDEau", source: "anime" },
  { id: "suikoudan", type: "Suiton", kanji: "水遁・水鮫弾の術", romaji: "Suiton : Suikōdan no jutsu", signes: ["tigre","boeuf","dragon","lievre","oiseau","dragon","belier"], effet: "requin", source: "anime" },
  { id: "suiryuudan", type: "Suiton", kanji: "水遁・水龍弾の術", romaji: "Suiton : Suiryūdan no jutsu", signes: ["boeuf","singe","lievre","rat","sanglier","oiseau","boeuf","cheval","oiseau","rat","tigre","chien","tigre","serpent","boeuf","belier","serpent","sanglier","belier","rat","mizunoe","singe","oiseau","dragon","oiseau","boeuf","cheval","belier","tigre","serpent","rat","singe","lievre","sanglier","dragon","belier","rat","boeuf","singe","oiseau","mizunoe","rat","sanglier","oiseau"], effet: "dragonDEau", source: "anime" },
  { id: "suijinheki", type: "Suiton", kanji: "水遁・水陣壁", romaji: "Suiton : Suijinheki", signes: ["tigre","serpent","rat","serpent","tigre"], effet: "murDEau", source: "anime" },
  { id: "daibakufu", type: "Suiton", kanji: "水遁・大瀑布の術", romaji: "Suiton : Daibakufu no jutsu", signes: ["tigre","boeuf","singe","lievre","belier","sanglier","boeuf","cheval","singe","tigre","chien","tigre","serpent","tigre","boeuf","singe","lievre","oiseau"], effet: "cascade", source: "anime" },
  { id: "kirigakure", type: "Suiton", kanji: "霧隠れの術", romaji: "Kirigakure no jutsu", signes: ["boeuf","serpent","belier"], effet: "brume", source: "anime" },
  { id: "suidanha", type: "Suiton", kanji: "水遁・水断波", romaji: "Suiton : Suidanha", signes: ["tigre","rat","cheval","serpent","dragon","mains"], effet: "jetTranchant", source: "anime" },
  { id: "chidori", type: "Raiton", kanji: "千鳥", romaji: "Chidori", signes: ["boeuf","lievre","singe"], effet: "chidori", source: "anime" },
  { id: "jinraisen", type: "Raiton", kanji: "雷遁・迅雷箭", romaji: "Raiton : Jinraisen", signes: ["belier","dragon","lievre"], effet: "flecheDeFoudre", source: "anime" },
  { id: "kirin", type: "Raiton", kanji: "麒麟", romaji: "Kirin", signes: ["dragon","singe","oiseau"], effet: "kirin", source: "appli" },
  { id: "daitoppa", type: "Fūton", kanji: "風遁・大突破", romaji: "Fūton : Daitoppa", signes: ["tigre","boeuf","chien","lievre","serpent"], effet: "bourrasque", source: "anime" },
  { id: "shinkuugyoku", type: "Fūton", kanji: "風遁・真空玉", romaji: "Fūton : Shinkūgyoku", signes: ["rat","lievre","chien"], effet: "spheresDAir", source: "anime" },
  { id: "shinkuuha", type: "Fūton", kanji: "風遁・真空波", romaji: "Fūton : Shinkūha", signes: ["rat","serpent","cheval","chien"], effet: "lameDeVent", source: "anime" },
  { id: "kamaitachi", type: "Fūton", kanji: "カマイタチの術", romaji: "Kamaitachi no jutsu", signes: ["serpent","dragon","oiseau"], effet: "faux", source: "anime" },
  { id: "reppuushou", type: "Fūton", kanji: "風遁・烈風掌", romaji: "Fūton : Reppūshō", signes: ["serpent","belier","sanglier","cheval","oiseau","mains"], effet: "rafale", source: "anime" },
  { id: "rasengan", type: "Ninjutsu", kanji: "螺旋丸", romaji: "Rasengan", signes: ["mains","tigre"], effet: "rasengan", source: "appli" },
  { id: "rasenshuriken", type: "Fūton", kanji: "風遁・螺旋手裏剣", romaji: "Fūton : Rasenshuriken", signes: ["mains","tigre","oiseau"], effet: "rasenshuriken", source: "appli" },
  { id: "tsuiga", type: "Doton", kanji: "口寄せ・土遁追牙の術", romaji: "Kuchiyose : Doton Tsuiga no jutsu", signes: ["tigre","serpent","dragon","chien"], effet: "chiens", source: "anime" },
  { id: "doryuudan", type: "Doton", kanji: "土遁・土龍弾", romaji: "Doton : Doryūdan", signes: ["belier","cheval","dragon"], effet: "dragonDeTerre", source: "anime" },
  { id: "doryuuheki", type: "Doton", kanji: "土遁・土流壁", romaji: "Doton : Doryūheki", signes: ["tigre","lievre","sanglier","chien"], effet: "murDeTerre", source: "anime", variante: ["belier","chien","boeuf","serpent"] },
  { id: "doryuusou", type: "Doton", kanji: "土遁・土流槍", romaji: "Doton : Doryūsō", signes: ["serpent","rat","oiseau"], effet: "pieux", source: "anime" },
  { id: "shichuurou", type: "Mokuton", kanji: "木遁・四柱牢の術", romaji: "Mokuton : Shichūrō no jutsu", signes: ["belier","boeuf","sanglier","serpent"], effet: "prisonDeBois", source: "anime" },
  { id: "shichuuka", type: "Mokuton", kanji: "木遁・四柱家の術", romaji: "Mokuton : Shichūka no jutsu", signes: ["serpent","rat","boeuf","belier","serpent"], effet: "maison", source: "anime" },
  { id: "jukaikoutan", type: "Mokuton", kanji: "木遁秘術・樹界降誕", romaji: "Mokuton Hijutsu : Jukai Kōtan", signes: ["tigre","serpent"], effet: "foret", source: "anime", variante: ["belier","serpent"] },
  { id: "bunshin", type: "Ninjutsu", kanji: "分身の術", romaji: "Bunshin no jutsu", signes: ["belier","serpent","tigre"], effet: "clones", source: "anime" },
  { id: "kawarimi", type: "Ninjutsu", kanji: "変わり身の術", romaji: "Kawarimi no jutsu", signes: ["tigre","sanglier","boeuf","chien","serpent"], effet: "permutation", source: "anime", variante: ["belier","sanglier","boeuf","chien","serpent"] },
  { id: "henge", type: "Ninjutsu", kanji: "変化の術", romaji: "Henge no jutsu", signes: ["chien","sanglier","belier"], effet: "metamorphose", source: "anime" },
  { id: "shunshin", type: "Ninjutsu", kanji: "瞬身の術", romaji: "Shunshin no jutsu", signes: ["tigre"], effet: "shunshin", source: "anime", tenir: true },
  { id: "kagemane", type: "Ninjutsu", kanji: "影真似の術", romaji: "Kagemane no jutsu", signes: ["rat"], effet: "ombre", source: "anime", tenir: true },
  { id: "harijizou", type: "Ninjutsu", kanji: "針地蔵", romaji: "Hari Jizō", signes: ["tigre","cheval","sanglier","belier","rat","serpent"], effet: "herisson", source: "anime" },
  { id: "shurikenkagebunshin", type: "Ninjutsu", kanji: "手裏剣影分身の術", romaji: "Shuriken Kage Bunshin no jutsu", signes: ["boeuf","chien","dragon","rat","chien","sanglier","serpent","tigre"], effet: "shuriken", source: "anime" },
  { id: "kuchiyose", type: "Kuchiyose", kanji: "口寄せの術", romaji: "Kuchiyose no jutsu", signes: ["sanglier","chien","oiseau","singe","belier"], effet: "invocation", source: "anime", variante: ["chien","sanglier","oiseau","singe","belier"] },
  { id: "gamaguchi", type: "Kuchiyose", kanji: "口寄せ・蝦蟇口縛り", romaji: "Kuchiyose : Gamaguchi Shibari", signes: ["serpent","sanglier","rat","dragon","sanglier","dragon","tigre"], effet: "estomac", source: "anime" },
  { id: "rashoumon", type: "Kuchiyose", kanji: "口寄せ・羅生門", romaji: "Kuchiyose : Rashōmon", signes: ["serpent"], effet: "porte", source: "anime", tenir: true },
  { id: "edotensei", type: "Kinjutsu", kanji: "口寄せ・穢土転生", romaji: "Kuchiyose : Edo Tensei", signes: ["tigre","serpent","chien","dragon","mains"], effet: "edoTensei", source: "anime" },
  { id: "shikifuujin", type: "Fūinjutsu", kanji: "屍鬼封尽", romaji: "Shiki Fūjin", signes: ["serpent","sanglier","belier","lievre","chien","rat","oiseau","cheval","serpent","mains"], effet: "shinigami", source: "anime" },
  { id: "fuujahouin", type: "Fūinjutsu", kanji: "封邪法印", romaji: "Fūja Hōin", signes: ["lievre","serpent","cheval","belier","oiseau","tigre","lievre","serpent","cheval","belier","oiseau","tigre","lievre","serpent","cheval","belier","oiseau","chien","rat"], effet: "sceau", source: "anime" },
  { id: "chakuranomesu", type: "Iryō ninjutsu", kanji: "チャクラのメス", romaji: "Chakura no Mesu", signes: ["tigre","cheval","lievre","rat","chien"], effet: "scalpel", source: "anime" },
  { id: "shousen", type: "Iryō ninjutsu", kanji: "掌仙術", romaji: "Shōsen jutsu", signes: ["boeuf","tigre"], effet: "soin", source: "anime" },
  { id: "narakumi", type: "Genjutsu", kanji: "魔幻・奈落見の術", romaji: "Magen : Narakumi no jutsu", signes: ["serpent","rat"], effet: "visionEnfer", source: "anime" },
  { id: "jubakusatsu", type: "Genjutsu", kanji: "魔幻・樹縛殺", romaji: "Magen : Jubaku Satsu", signes: ["chien","serpent","singe","boeuf","tigre"], effet: "arbre", source: "anime" },
  { id: "tsukuyomi", type: "Dōjutsu", kanji: "月読", romaji: "Tsukuyomi", signes: ["chien","serpent","oiseau"], effet: "tsukuyomi", source: "appli" },
  { id: "izanagi", type: "Dōjutsu", kanji: "イザナギ", romaji: "Izanagi", signes: ["lievre","sanglier","belier"], effet: "izanagi", source: "anime" },
  { id: "amaterasu", type: "Dōjutsu", kanji: "天照", romaji: "Amaterasu", signes: ["oiseau","serpent","chien"], effet: "amaterasu", source: "appli" },
  { id: "kamui", type: "Dōjutsu", kanji: "神威", romaji: "Kamui", signes: ["singe","rat","oiseau"], effet: "kamui", source: "appli" },
  { id: "susanoo", type: "Dōjutsu", kanji: "須佐能乎", romaji: "Susanoo", signes: ["tigre","dragon","oiseau","mains"], effet: "susanoo", source: "appli" }
] as const satisfies readonly Technique<SigneNaruto>[];

/**
 * Les noms d'effets que le catalogue reference. Derive des donnees, pas des effets :
 * le pack doit ensuite fournir exactement ces effets-la, ni plus ni moins.
 */
export type EffetNaruto = (typeof JUTSUS)[number]["effet"];
