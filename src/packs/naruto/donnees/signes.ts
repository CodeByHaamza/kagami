// Les 14 signes de mains reconnus par le modele, et l'ordre de ses classes.
//
// Les noms courants et la description de chaque position se traduisent : ils sont dans
// donnees/textes-fr.ts, pas ici. Kanji et romaji restent, eux ne se traduisent pas.
//
// Source des noms et des enchainements : Narutopedia (naruto.fandom.com), plus quelques
// variantes du fichier jutsu.csv du projet NARUTO-HandSignDetection.

/** Les 12 signes du zodiaque chinois, plus deux signes speciaux. */
export const SIGNES = {
  rat: { kanji: "子", romaji: "Ne" },
  boeuf: { kanji: "丑", romaji: "Ushi" },
  tigre: { kanji: "寅", romaji: "Tora" },
  lievre: { kanji: "卯", romaji: "U" },
  dragon: { kanji: "辰", romaji: "Tatsu" },
  serpent: { kanji: "巳", romaji: "Mi" },
  cheval: { kanji: "午", romaji: "Uma" },
  belier: { kanji: "未", romaji: "Hitsuji" },
  singe: { kanji: "申", romaji: "Saru" },
  oiseau: { kanji: "酉", romaji: "Tori" },
  chien: { kanji: "戌", romaji: "Inu" },
  sanglier: { kanji: "亥", romaji: "I" },
  mains: { kanji: "祈", romaji: "Gasshō" },
  mizunoe: { kanji: "壬", romaji: "Mizunoe" }
} as const satisfies Readonly<Record<string, { kanji: string; romaji: string }>>;

export type SigneNaruto = keyof typeof SIGNES;

/**
 * L'ordre des classes du modele YOLOX (labels.csv sans la premiere ligne « None »).
 * La classe 13, « Unknown », n'est pas un signe.
 */
export const CLASSES: readonly (SigneNaruto | null)[] = ["rat","boeuf","tigre","lievre","dragon","serpent","cheval","belier","singe","oiseau","chien","sanglier","mains",null,"mizunoe"];

/** Le signe qui rompt un genjutsu (« Kai ! »), comme dans l'anime. */
export const SIGNE_KAI: SigneNaruto = "belier";

/** La famille d'une technique, pour trier l'encyclopedie. */
export const FAMILLES = {
  "Katon": "Feu",
  "Suiton": "Eau",
  "Raiton": "Foudre",
  "Fūton": "Vent",
  "Doton": "Terre",
  "Mokuton": "Bois",
  "Ninjutsu": "Ninjutsu",
  "Kuchiyose": "Ninjutsu",
  "Iryō ninjutsu": "Ninjutsu",
  "Fūinjutsu": "Ninjutsu",
  "Kinjutsu": "Ninjutsu",
  "Genjutsu": "Genjutsu",
  "Dōjutsu": "Sharingan",
  "Senjutsu": "Ermite",
  "Hyōton": "Glace",
  "Hiden": "Clan"
} as const satisfies Readonly<Record<string, string>>;
