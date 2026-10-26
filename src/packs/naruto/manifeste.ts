// Le manifeste du pack Kata (Naruto).
//
// C'est le seul point par lequel le moteur apprend quelque chose d'un anime : son
// alphabet de jetons, son catalogue de techniques, ses effets, son reconnaisseur et ses
// textes. Un deuxième anime sera un dossier voisin avec un manifeste du même type, et
// le moteur n'aura pas à bouger.

import type { Pack } from "../../moteur/types";
import { CLASSES, FAMILLES, SIGNE_KAI, SIGNES, type SigneNaruto } from "./donnees/signes";
import { JUTSUS } from "./donnees/jutsus";
import { EFFETS_NARUTO } from "./effets";
import { EFFETS_CORPS } from "./effets/corps";
import { TAIJUTSU } from "./donnees/taijutsu";
import { ARMES } from "./donnees/armes";
import { CYCLE, ELEMENTS } from "./donnees/elements";
import { PROFILS } from "./donnees/profils";
import { BESTIAIRE } from "./donnees/bestiaire";
import { BOSS } from "./donnees/boss";
import { MISSIONS } from "./donnees/missions";
import { DetecteurDeSignes } from "./entree/detecteurSignes";
import { enregistrerTextes } from "./i18n";

export { CLASSES, FAMILLES, SIGNES, type SigneNaruto };
export { TAIJUTSU, ARMES, CYCLE, ELEMENTS, PROFILS, BESTIAIRE, BOSS, MISSIONS };

export const PACK_KATA: Pack<SigneNaruto> = {
  id: "kata",
  nom: "Kata",
  jetons: Object.keys(SIGNES) as SigneNaruto[],
  techniques: JUTSUS,
  effets: { ...EFFETS_NARUTO, ...EFFETS_CORPS },
  taijutsu: TAIJUTSU,
  armes: ARMES,
  cycle: CYCLE,
  profils: PROFILS,
  bestiaire: BESTIAIRE,
  boss: BOSS,
  missions: MISSIONS,
  modele: "/modeles/yolox_nano_with_post.onnx",
  reconnaisseur: () => new DetecteurDeSignes(),
  jetonKai: SIGNE_KAI
};

/** À appeler une fois au démarrage : verse les textes du pack dans le moteur. */
export { enregistrerTextes };
