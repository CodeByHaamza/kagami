// Les écrans de l'application : accueil, encyclopédie, journal.
//
// Un écran est une section du document ; en montrer un cache les autres. Rien de plus :
// l'application est assez petite pour que ça suffise, et un routeur serait du poids
// sans contrepartie.

export type NomEcran = "accueil" | "encyclopedie" | "journal" | "jeu";

export class Ecrans {
  private courant: NomEcran = "accueil";

  constructor(private readonly elements: Readonly<Record<NomEcran, HTMLElement | null>>) {}

  get visible(): NomEcran {
    return this.courant;
  }

  montrer(nom: NomEcran): void {
    this.courant = nom;
    for (const [cle, element] of Object.entries(this.elements)) {
      if (!element) continue;
      element.hidden = cle !== nom;
    }
  }

  /** « jeu » n'est pas un panneau : c'est l'absence de panneau par-dessus la caméra. */
  fermerTout(): void {
    this.montrer("jeu");
  }
}
