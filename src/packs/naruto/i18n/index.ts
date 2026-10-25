// Le point d'entree i18n du pack : il verse ses deux dictionnaires dans le moteur.
//
// Le moteur ne connait aucune chaine ; c'est le pack qui les apporte, ce qui permet a
// un deuxieme anime d'ajouter les siennes sans toucher au moteur.

import { enregistrer } from "../../../moteur/ui/i18n";
import { FR } from "./fr";
import { EN } from "./en";

export { FR, EN };

export function enregistrerTextes(): void {
  enregistrer("fr", FR);
  enregistrer("en", EN);
}
