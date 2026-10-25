// Les 52 effets du pack Kata (Naruto), rassembles.
//
// Le type force le dictionnaire a couvrir exactement les effets que le catalogue
// reference : un nom en trop ou en moins ne compile pas.

import type { Effet } from "../../../moteur/types";
import type { EffetNaruto } from "../donnees/jutsus";
import { FEUX } from "./feu";
import { EAUX } from "./eau";
import { FOUDRES } from "./foudre";
import { VENTS } from "./vent";
import { TERRES } from "./terre";
import { CHAKRAS } from "./chakra";
import { NINJUTSUS } from "./ninjutsu";
import { GENJUTSUS } from "./genjutsu";

export const EFFETS_NARUTO = {
  ...FEUX,
  ...EAUX,
  ...FOUDRES,
  ...VENTS,
  ...TERRES,
  ...CHAKRAS,
  ...NINJUTSUS,
  ...GENJUTSUS
} as Readonly<Record<EffetNaruto | "kai", Effet>>;
