// L'encyclopédie : les jetons (avec ta photo dès que tu en réussis un) et les techniques.
//
// Générique : elle ne connaît ni Naruto ni aucun autre anime. Tout ce qu'elle affiche
// lui est passé par le pack, et tous ses libellés passent par l'i18n.

import type { Technique } from "../types";
import { t } from "./i18n";

/** Ce qu'il faut savoir d'un jeton pour l'afficher : le reste est dans l'i18n. */
export interface JetonAffichable {
  kanji: string;
  romaji: string;
}

/** La photo prise automatiquement la première fois qu'un jeton est réussi. */
export interface Photo {
  image: string;
  score: number;
}

export interface DonneesEncyclopedie<J extends string> {
  jetons: Readonly<Record<J, JetonAffichable>>;
  techniques: readonly Technique<J>[];
  /** Le type d'une technique vers sa famille d'affichage. */
  familles: Readonly<Record<string, string>>;
  photos: Readonly<Partial<Record<J, Photo>>>;
  /** Une illustration de reference par jeton, quand le pack en fournit une. */
  illustrations?: Readonly<Record<string, string>>;
  compteurs: Readonly<Partial<Record<J, number>>>;
  decouvertes: readonly string[];
  /** Celles réussies en entraînement : une maîtrise, pas un coup de chance. */
  entraines?: readonly string[];
}

const echapper = (s: string): string =>
  s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

/** Un jeton en petit : son kanji et son nom. */
export function pastille<J extends string>(
  jetons: Readonly<Record<J, JetonAffichable>>,
  id: J,
  classe = ""
): string {
  const j = jetons[id];
  return `<span class="pastille ${classe}"><b>${j.kanji}</b>${echapper(t(`signe.${id}.nom`))}</span>`;
}

export function afficherJetons<J extends string>(
  conteneur: HTMLElement,
  d: DonneesEncyclopedie<J>
): void {
  const ids = Object.keys(d.jetons) as J[];
  conteneur.innerHTML = ids
    .map(id => {
      const j = d.jetons[id];
      const photo = d.photos[id];
      const n = d.compteurs[id] ?? 0;
      const nom = echapper(t(`signe.${id}.nom`));
      const bilan =
        n === 0
          ? t("encyclo.jamaisReussi")
          : t("encyclo.reussi", { fois: n }) +
            (photo ? " " + t("encyclo.photo", { score: Math.round(photo.score * 100) }) : "");
      // Ta propre photo d'abord — c'est la plus parlante —, sinon l'illustration de
      // reference, sinon le kanji.
      const illustration = d.illustrations?.[id];
      const vignette = photo
        ? `<img src="${echapper(photo.image)}" alt="${nom}">`
        : illustration
          ? `<img src="${echapper(illustration)}" alt="${nom}" class="reference">`
          : `<span>${j.kanji}</span>`;

      return (
        `<article class="fiche-signe">` +
        `<div class="vignette">${vignette}</div>` +
        `<div><h3><span class="kanji">${j.kanji}</span> ${nom} <small>${echapper(j.romaji)}</small></h3>` +
        `<p>${echapper(t(`signe.${id}.position`))}</p>` +
        `<p class="discret">${echapper(bilan)}</p></div>` +
        `</article>`
      );
    })
    .join("");
}

/** Les familles, dans l'ordre des boutons de filtre. */
export function listeFamilles(familles: Readonly<Record<string, string>>): string[] {
  return [t("encyclo.tous"), ...new Set(Object.values(familles))];
}

export function afficherTechniques<J extends string>(
  conteneur: HTMLElement,
  d: DonneesEncyclopedie<J>,
  famille: string,
  surEntrainer: (technique: Technique<J>) => void
): void {
  const tous = t("encyclo.tous");
  const liste = d.techniques.filter(
    tech => famille === tous || d.familles[tech.type] === famille
  );

  conteneur.innerHTML = liste
    .map(tech => {
      const decouverte = d.decouvertes.includes(tech.id);
      const maitrisee = d.entraines?.includes(tech.id) ?? false;
      const suite = tech.tenir
        ? `<p class="discret">${echapper(t("encyclo.unSeulSigne"))}</p>` +
          `<div class="suite">${pastille(d.jetons, tech.signes[0]!)}</div>`
        : `<div class="suite">${tech.signes.map(s => pastille(d.jetons, s)).join("")}</div>`;

      return (
        `<article class="fiche-jutsu${decouverte ? " decouvert" : ""}${maitrisee ? " maitrise" : ""}">` +
        `<p class="type">${echapper(tech.type)}` +
        (maitrisee
          ? ` · <b>${echapper(t("encyclo.maitrise"))}</b>`
          : decouverte
            ? ` · <b>${echapper(t("encyclo.decouvert"))}</b>`
            : "") +
        `</p>` +
        `<h3 class="kanji">${tech.kanji}</h3>` +
        `<p class="nom">${echapper(tech.romaji)} · ${echapper(t(`jutsu.${tech.id}.nom`))}</p>` +
        `<p>${echapper(t(`jutsu.${tech.id}.texte`))}</p>` +
        suite +
        (tech.variante
          ? `<p class="discret">${echapper(t("encyclo.variante"))} ${tech.variante.map(s => d.jetons[s].kanji).join(" ")}</p>`
          : "") +
        (tech.source === "appli"
          ? `<p class="discret">${echapper(t("encyclo.inventee"))}</p>`
          : "") +
        `<button type="button" data-technique="${echapper(tech.id)}">` +
        `${echapper(t("encyclo.entrainer"))}${tech.tenir ? "" : ` (${tech.signes.length})`}</button>` +
        `</article>`
      );
    })
    .join("");

  for (const bouton of conteneur.querySelectorAll<HTMLButtonElement>("button[data-technique]")) {
    bouton.addEventListener("click", () => {
      const trouvee = d.techniques.find(tech => tech.id === bouton.dataset.technique);
      if (trouvee) surEntrainer(trouvee);
    });
  }
}
