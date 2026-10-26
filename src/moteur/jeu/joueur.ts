// Le joueur en arcade.
//
// Trois jauges de 0 à 100 — vie, chakra, invocation — plus deux états : la garde (qui
// réduit fortement les dégâts tant qu'elle est tenue) et l'illusion (le genjutsu
// d'Itachi : signes bloqués, chakra qui fuit, seul le « Kai ! » passe — spec §9.4).

export const REGLAGES_JOUEUR = {
  max: 100,
  /** Part des dégâts qui traverse la garde. 0,25 = les trois quarts sont absorbés. */
  facteurGarde: 0.25,
  /** Régénération naturelle du chakra, en points par seconde. */
  regenChakra: 3,
  /** Charge volontaire (Tigre tenu au palier charge), en points par seconde. */
  chargeChakra: 28,
  /** Fuite de chakra sous genjutsu ennemi, en points par seconde. */
  fuiteIllusion: 12
} as const;

export class Joueur {
  vie: number = REGLAGES_JOUEUR.max;
  chakra: number = REGLAGES_JOUEUR.max;
  invocation = 0;
  garde = false;
  illusion = false;

  get vaincu(): boolean {
    return this.vie <= 0;
  }

  /** Débite `cout` points de chakra si la jauge le permet ; sinon ne touche à rien. */
  depenser(cout: number): boolean {
    if (cout <= 0) return true;
    if (this.chakra < cout) return false;
    this.chakra = Math.max(0, this.chakra - cout);
    return true;
  }

  /** Retire du chakra (Samehada de Kisame), plafonné à zéro. */
  drainer(quantite: number): void {
    this.chakra = Math.max(0, this.chakra - Math.max(0, quantite));
  }

  /** Applique des dégâts en tenant compte de la garde, et renvoie ce qui a été retiré. */
  encaisser(degats: number): number {
    const brut = Math.max(0, degats);
    const effectif = Math.round(this.garde ? brut * REGLAGES_JOUEUR.facteurGarde : brut);
    const avant = this.vie;
    this.vie = Math.max(0, this.vie - effectif);
    return avant - this.vie;
  }

  /** Recharge active : appelée quand le joueur tient le signe de concentration. */
  charger(dt: number): void {
    if (this.illusion) return;
    this.chakra = Math.min(REGLAGES_JOUEUR.max, this.chakra + REGLAGES_JOUEUR.chargeChakra * dt);
  }

  envouter(): void {
    this.illusion = true;
  }

  /** « Kai ! » : gratuit, même à zéro de chakra. */
  rompre(): void {
    this.illusion = false;
  }

  avancer(dt: number): void {
    if (this.illusion) {
      this.chakra = Math.max(0, this.chakra - REGLAGES_JOUEUR.fuiteIllusion * dt);
      return;
    }
    this.chakra = Math.min(REGLAGES_JOUEUR.max, this.chakra + REGLAGES_JOUEUR.regenChakra * dt);
  }
}
