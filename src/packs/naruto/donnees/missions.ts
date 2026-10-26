// Les cinq missions d'arcade, rangs canon D à S (spec §9.7).
//
// | Rang | Vagues | Boss                      |
// | D    | 3      | —                         |
// | C    | 5      | Zabuza (5)                |
// | B    | 10     | Zabuza (5), Kisame (10)   |
// | A    | 15     | Kisame (5), Deidara (10), Itachi (15) |
// | S    | 20     | Zabuza (4), Kisame (8), Deidara (12), Itachi (16), Madara (20) |

import type { Mission, Vague } from "../../../moteur/types";
import type { IdEnnemi } from "./bestiaire";
import type { IdBoss } from "./boss";

const v = (
  lots: readonly [IdEnnemi, number][],
  boss?: IdBoss
): Vague => ({
  ennemis: lots.map(([modele, nombre]) => ({ modele, nombre })),
  ...(boss ? { boss } : {})
});

export const MISSIONS: readonly Mission[] = [
  {
    id: "rangD",
    rang: "D",
    vagues: [
      v([["zetsu", 2]]),
      v([["zetsu", 2], ["deserteurFeu", 1]]),
      v([["deserteurFeu", 1], ["deserteurVent", 1], ["zetsu", 2]])
    ]
  },

  {
    id: "rangC",
    rang: "C",
    vagues: [
      v([["zetsu", 3]]),
      v([["deserteurEau", 2]]),
      v([["deserteurFeu", 1], ["deserteurEau", 1], ["zetsu", 2]]),
      v([["deserteurFoudre", 2], ["deserteurTerre", 1]]),
      v([["deserteurEau", 1]], "zabuza")
    ]
  },

  {
    id: "rangB",
    rang: "B",
    vagues: [
      v([["zetsu", 3], ["deserteurFeu", 1]]),
      v([["deserteurVent", 2], ["deserteurFoudre", 1]]),
      v([["anbuRacine", 2]]),
      v([["deserteurEau", 2], ["deserteurTerre", 2]]),
      v([["deserteurEau", 2]], "zabuza"),
      v([["anbuRacine", 2], ["zetsu", 2]]),
      v([["deserteurFeu", 2], ["deserteurVent", 2]]),
      v([["edoTensei", 1], ["deserteurTerre", 2]]),
      v([["anbuRacine", 3]]),
      v([["deserteurEau", 2]], "kisame")
    ]
  },

  {
    id: "rangA",
    rang: "A",
    vagues: [
      v([["deserteurFeu", 2], ["deserteurEau", 2]]),
      v([["anbuRacine", 2], ["deserteurVent", 1]]),
      v([["edoTensei", 1], ["zetsu", 3]]),
      v([["deserteurFoudre", 2], ["deserteurTerre", 2]]),
      v([["deserteurEau", 2]], "kisame"),
      v([["anbuRacine", 3]]),
      v([["edoTensei", 2]]),
      v([["deserteurTerre", 2], ["deserteurFoudre", 2]]),
      v([["anbuRacine", 2], ["edoTensei", 1]]),
      v([["deserteurTerre", 2]], "deidara"),
      v([["edoTensei", 2], ["deserteurFeu", 2]]),
      v([["anbuRacine", 3], ["deserteurVent", 1]]),
      v([["deserteurFeu", 2], ["deserteurFoudre", 2]]),
      v([["edoTensei", 2], ["anbuRacine", 2]]),
      v([["anbuRacine", 2]], "itachi")
    ]
  },

  {
    id: "rangS",
    rang: "S",
    vagues: [
      v([["zetsu", 4], ["deserteurFeu", 2]]),
      v([["anbuRacine", 3]]),
      v([["edoTensei", 2], ["deserteurEau", 2]]),
      v([["deserteurEau", 2]], "zabuza"),
      v([["deserteurVent", 2], ["deserteurFoudre", 2]]),
      v([["edoTensei", 2], ["anbuRacine", 2]]),
      v([["deserteurTerre", 3], ["zetsu", 2]]),
      v([["deserteurEau", 2]], "kisame"),
      v([["anbuRacine", 4]]),
      v([["edoTensei", 3]]),
      v([["deserteurFeu", 2], ["deserteurTerre", 2]]),
      v([["deserteurTerre", 2]], "deidara"),
      v([["edoTensei", 2], ["anbuRacine", 2]]),
      v([["deserteurFoudre", 3], ["deserteurVent", 2]]),
      v([["edoTensei", 3], ["zetsu", 2]]),
      v([["anbuRacine", 2]], "itachi"),
      v([["edoTensei", 3], ["anbuRacine", 2]]),
      v([["deserteurFeu", 2], ["deserteurVent", 2], ["deserteurFoudre", 2]]),
      v([["edoTensei", 4]]),
      v([["edoTensei", 2]], "madara")
    ]
  }
];
