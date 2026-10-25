// Le portail : le premier écran du projet, où l'on choisit son anime.
//
// Il est générique. Il ne connaît aucun pack : on lui passe une liste, il l'affiche et
// prévient quand on en choisit un. C'est ce qui permettra d'ajouter DBZ ou JJK sans
// rouvrir ce fichier.

import { t } from "../moteur/ui/i18n";

export interface EntreePack {
  id: string;
  /** Le kanji affiché sur la tuile. */
  kanji: string;
  nom: string;
  /** L'anime dont le pack s'inspire. */
  anime: string;
  /** Un pack annoncé mais pas encore écrit n'est pas choisissable. */
  disponible: boolean;
}

/**
 * Remplit le portail et renvoie une promesse résolue avec le pack choisi.
 * Un pack indisponible est affiché quand même : c'est la feuille de route, visible.
 */
export function choisirPack(conteneur: HTMLElement, packs: readonly EntreePack[]): Promise<EntreePack> {
  conteneur.innerHTML = packs
    .map(
      pack =>
        `<button type="button" class="pack${pack.disponible ? " pret" : ""}" data-pack="${pack.id}"` +
        `${pack.disponible ? "" : " disabled"}>` +
        `<span class="kanji">${pack.kanji}</span>` +
        `<span class="nom">${pack.nom}</span>` +
        `<span class="anime">${pack.anime}</span>` +
        `<span class="etat">${t(pack.disponible ? "portail.pret" : "portail.bientot")}</span>` +
        `</button>`
    )
    .join("");

  return new Promise(resoudre => {
    for (const bouton of conteneur.querySelectorAll<HTMLButtonElement>("button[data-pack]")) {
      bouton.addEventListener("click", () => {
        const choisi = packs.find(p => p.id === bouton.dataset.pack);
        if (choisi?.disponible) resoudre(choisi);
      });
    }
  });
}
