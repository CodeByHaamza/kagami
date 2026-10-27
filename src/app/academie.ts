// L'écran Académie de Konoha et le passage d'examens (§9.8, §10.7).

import { SessionExamen } from "../moteur/jeu/examen";
import { statutProgression } from "../moteur/progression/progression";
import type { Grade, Progression } from "../moteur/stockage/sauvegarde";
import { jouer } from "../moteur/son/son";
import { t } from "../moteur/ui/i18n";
import { EXAMENS_NARUTO } from "../packs/naruto/donnees/examens";

const el = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

export interface OptionsAcademie {
  getProgression: () => Progression;
  getNombreJutsus: () => number;
  demarrerCamera: () => Promise<void>;
  onPromotion: (grade: Grade, examenId: string) => void;
  annoncer: (texte: string) => void;
}

export class Academie {
  private session: SessionExamen | null = null;

  constructor(private readonly options: OptionsAcademie) {
    this.cabler();
  }

  get enExamen(): boolean {
    return this.session !== null && this.session.etat === "enCours";
  }

  ouvrir(): void {
    this.rafraichir();
    el("academie").hidden = false;
  }

  fermer(): void {
    el("academie").hidden = true;
  }

  rafraichir(): void {
    const prog = this.options.getProgression();
    const nbJutsus = this.options.getNombreJutsus();
    const statut = statutProgression(prog, nbJutsus);

    const nomElem = el("academieExamenNom");
    const descElem = el("academieExamenDesc");
    const epreuvesElem = el("academieEpreuves");
    const statutElem = el("academieStatut");
    const btnLancer = el<HTMLButtonElement>("btnLancerExamen");

    epreuvesElem.innerHTML = "";

    if (statut.type === "examen" && statut.examenId) {
      const examen = EXAMENS_NARUTO.find(e => e.id === statut.examenId);
      if (examen) {
        nomElem.textContent = examen.nom;
        descElem.textContent = t(`grade.vers.${examen.gradeCible}`);

        epreuvesElem.innerHTML = examen.epreuves
          .map(
            ep =>
              `<div class="epreuve-item">` +
              `<b>${ep.nom}</b> · <span>${ep.tempsMax}s</span>` +
              `<p>${ep.description ?? ""}</p>` +
              `</div>`
          )
          .join("");

        if (statut.prerequisRempli) {
          statutElem.textContent = t("academie.pret");
          btnLancer.hidden = false;
        } else {
          statutElem.textContent = t("academie.conditionsNonRemplies");
          btnLancer.hidden = true;
        }
        return;
      }
    }

    if (prog.grade === "kage") {
      nomElem.textContent = t("academie.kageTitre");
      descElem.textContent = t("academie.kageDesc");
      statutElem.textContent = "";
      btnLancer.hidden = true;
      return;
    }

    // Recommandation Jōnin ou Kage
    nomElem.textContent = t("academie.recommandationTitre");
    descElem.textContent = t(`academie.recommandation.${prog.grade}`);
    statutElem.textContent = statut.prerequisRempli
      ? t("academie.recommandationPrete")
      : t("academie.recommandationEnAttente");
    btnLancer.hidden = true;
  }

  async commencer(): Promise<void> {
    const prog = this.options.getProgression();
    const statut = statutProgression(prog, this.options.getNombreJutsus());
    if (statut.type !== "examen" || !statut.examenId || !statut.prerequisRempli) return;

    const examen = EXAMENS_NARUTO.find(e => e.id === statut.examenId);
    if (!examen) return;

    this.fermer();
    this.session = new SessionExamen(examen);
    await this.options.demarrerCamera();

    el("hudExamen").hidden = false;
    this.majHudExamen();
  }

  quitterExamen(): void {
    this.session = null;
    el("hudExamen").hidden = true;
  }

  avancer(dt: number): void {
    const session = this.session;
    if (!session || session.etat !== "enCours") return;
    session.avancer(dt);
    this.majHudExamen();

    const etat = session.etat as string;
    if (etat === "echoue") {
      jouer("boum");
      this.options.annoncer(t("academie.echecTemps"));
      this.quitterExamen();
      this.ouvrir();
    }
  }

  validerTechnique(techniqueId: string): boolean {
    const session = this.session;
    if (!session || session.etat !== "enCours") return false;
    const ok = session.validerTechnique(techniqueId);
    if (ok) {
      jouer("jutsu");
      const etat = session.etat as string;
      if (etat === "reussi") {
        const cible = session.definition.gradeCible;
        const exId = session.definition.id;
        this.options.onPromotion(cible, exId);
        this.options.annoncer(t("academie.succesPromotion", { grade: t(`grade.${cible}`) }));
        this.quitterExamen();
        this.ouvrir();
      } else {
        this.majHudExamen();
      }
    }
    return ok;
  }

  private majHudExamen(): void {
    if (!this.session) return;
    const courante = this.session.epreuveCourante;
    if (courante) {
      el("examenTitre").textContent = courante.nom;
      el("examenChrono").textContent = `${this.session.tempsRestantEpreuve.toFixed(1)}s`;
    }
  }

  private cabler(): void {
    el("btnFermerAcademie").addEventListener("click", () => this.fermer());
    el("btnLancerExamen").addEventListener("click", () => void this.commencer());
    el("btnQuitterExamen").addEventListener("click", () => this.quitterExamen());
  }
}
