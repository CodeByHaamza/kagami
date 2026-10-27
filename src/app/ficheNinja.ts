// L'écran Fiche Ninja (§9.8, §9.9, §10.7).
//
// Permet au joueur de renseigner son nom, son clan (inventé), son village
// et son contrat d'invocation (Crapauds, Serpents, Limaces, Chiens),
// et de consulter son grade et son palmarès.

import type { Contrat, FicheNinja, Grade, Village } from "../moteur/stockage/sauvegarde";
import { t } from "../moteur/ui/i18n";

const el = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

export interface OptionsFicheNinja {
  getFiche: () => FicheNinja | null;
  getGrade: () => Grade;
  getMissionsReussies: () => readonly string[];
  getExamensPasses: () => readonly string[];
  onSauvegarder: (fiche: FicheNinja) => void;
}

export class EcranFicheNinja {
  constructor(private readonly options: OptionsFicheNinja) {
    this.cabler();
  }

  ouvrir(): void {
    const fiche = this.options.getFiche();
    if (!fiche) {
      this.montrerFormulaire();
    } else {
      this.montrerVue(fiche);
    }
    el("ficheNinja").hidden = false;
  }

  fermer(): void {
    el("ficheNinja").hidden = true;
  }

  montrerFormulaire(): void {
    const fiche = this.options.getFiche();
    const inputNom = el<HTMLInputElement>("inputNinjaNom");
    const inputClan = el<HTMLInputElement>("inputNinjaClan");
    const selectVillage = el<HTMLSelectElement>("selectNinjaVillage");
    const selectContrat = el<HTMLSelectElement>("selectNinjaContrat");

    inputNom.value = fiche?.nom ?? "";
    inputClan.value = fiche?.clan ?? "";
    selectVillage.value = fiche?.village ?? "konoha";
    selectContrat.value = fiche?.contrat ?? "crapauds";

    el("ficheNinjaVue").hidden = true;
    el("ficheNinjaForm").hidden = false;
  }

  montrerVue(fiche: FicheNinja): void {
    const grade = this.options.getGrade();
    const missions = this.options.getMissionsReussies();
    const examens = this.options.getExamensPasses();

    el("ficheGrade").textContent = t(`grade.${grade}`);
    el("ficheNom").textContent = fiche.nom;
    el("ficheClan").textContent = fiche.clan;
    el("ficheVillage").textContent = t(`village.${fiche.village}`);
    el("ficheContrat").textContent = t(`contrat.${fiche.contrat}`);
    el("ficheMissions").textContent = String(missions.length);
    el("ficheExamens").textContent = String(examens.length);

    el("ficheNinjaForm").hidden = true;
    el("ficheNinjaVue").hidden = false;
  }

  private cabler(): void {
    el("btnFermerFiche").addEventListener("click", () => this.fermer());
    el("btnModifierFiche").addEventListener("click", () => this.montrerFormulaire());
    el("btnAnnulerFiche").addEventListener("click", () => {
      const fiche = this.options.getFiche();
      if (fiche) {
        this.montrerVue(fiche);
      } else {
        this.fermer();
      }
    });

    const form = el<HTMLFormElement>("ficheNinjaForm");
    form.addEventListener("submit", ev => {
      ev.preventDefault();
      const nom = el<HTMLInputElement>("inputNinjaNom").value.trim();
      const clan = el<HTMLInputElement>("inputNinjaClan").value.trim();
      const village = el<HTMLSelectElement>("selectNinjaVillage").value as Village;
      const contrat = el<HTMLSelectElement>("selectNinjaContrat").value as Contrat;

      if (!nom || !clan) return;

      const nouvelleFiche: FicheNinja = { nom, clan, village, contrat };
      this.options.onSauvegarder(nouvelleFiche);
      this.montrerVue(nouvelleFiche);
    });
  }
}

