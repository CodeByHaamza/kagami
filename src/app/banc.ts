// Le banc de rejeu, branché dans l'appli.
//
// Le moteur sait enregistrer et rejouer une session depuis la tâche 2, mais seuls les
// tests s'en servaient : impossible, depuis l'appli, de capturer trente secondes de
// mouvement et de les repasser. Sans ça les seuils de gestes se règlent en bougeant
// devant une webcam jusqu'à ce que ça marche, ce qui n'est ni reproductible ni
// mesurable.
//
// Le banc fait deux choses, et rien d'autre :
//  - il s'intercale entre les capteurs et l'ordonnanceur, et peut remplacer la caméra
//    par un fichier ;
//  - il affiche les nombres que le moteur calcule, pour qu'on règle les seuils en les
//    lisant plutôt qu'en les devinant.
//
// C'est un outil de développement : il n'apparaît qu'avec `?banc` dans l'adresse, et
// ses étiquettes ne passent pas par `t()`. Les traduire coûterait une douzaine de clés
// dans les deux langues pour un panneau que seul le propriétaire du dépôt verra.

import type { Detection, Posture } from "../moteur/types";
import { serialiser, type Session } from "../moteur/rejeu/format";
import { EnregistreurDeSession, LecteurDeSession } from "../moteur/rejeu/lecteur";

/** Ce que le panneau affiche. Le moteur les calcule ; le banc ne fait que les montrer. */
export interface LectureBanc {
  attitude: string;
  geste: string | null;
  jeton: string | null;
  immobilite: number;
  fiabilite: boolean;
}

export interface PiecesBanc<J extends string = string> {
  /** La source vive de postures : la caméra, quand le banc ne rejoue rien. */
  posture: (horodatage: number) => Posture | null;
  /** La source vive de signes. */
  signe: () => Promise<Detection<J> | null>;
  /** La taille de l'image, pour l'en-tête de la session enregistrée. */
  taille: () => { largeur: number; hauteur: number };
  /** Un jeton que ce pack sait lire. Une session d'un autre pack en contient d'autres. */
  jetonConnu: (jeton: string) => boolean;
  /** Vider les grammaires : un rejeu ne doit pas hériter d'un demi-enchaînement. */
  surBascule?: () => void;
  maintenant?: () => number;
}

const el = <T extends HTMLElement>(id: string): T | null => document.getElementById(id) as T | null;

export class Banc<J extends string = string> {
  private readonly p: PiecesBanc<J>;

  private enregistreur: EnregistreurDeSession | null = null;
  private lecteur: LecteurDeSession | null = null;

  /** La dernière détection vive, pour l'attacher à chaque image enregistrée. */
  private derniereVive: Detection<J> | null = null;
  /** La détection de l'image rejouée en cours, qui ne doit compter qu'une fois. */
  private detectionRejeu: Detection<J> | null = null;
  private postureRejeu: Posture | null = null;
  private derniereHorloge = 0;

  private monte = false;
  private dernierAffichage = "";

  constructor(pieces: PiecesBanc<J>) {
    this.p = pieces;
  }

  /** Un rejeu est en cours : les capteurs sont débranchés. */
  get actif(): boolean {
    return this.lecteur !== null;
  }

  get enregistre(): boolean {
    return this.enregistreur !== null;
  }

  // ---- les deux sources, vues par l'ordonnanceur ----

  /**
   * La posture de cette image. En rejeu, elle vient du fichier ; la dernière image
   * franchie est tenue jusqu'à la suivante, exactement comme une caméra tient son
   * image entre deux rafraîchissements.
   */
  lirePosture(horodatage: number): Posture | null {
    if (this.lecteur) {
      const ecart = this.derniereHorloge ? (horodatage - this.derniereHorloge) / 1000 : 0;
      this.derniereHorloge = horodatage;

      const franchies = this.lecteur.avancer(ecart);
      const derniere = franchies.at(-1);
      if (derniere) {
        this.postureRejeu = derniere.posture;
        this.detectionRejeu = this.filtrer(derniere.detection);
      } else if (this.lecteur.fini) {
        // Plus rien ne vient : la session est finie, on rend la main aux capteurs.
        this.finirRejeu();
        return null;
      }
      return this.postureRejeu;
    }

    const p = this.p.posture(horodatage);
    this.enregistreur?.capturer(horodatage, this.derniereVive, p);
    return p;
  }

  /**
   * Le signe de cette image. En rejeu, chaque détection enregistrée ne compte qu'une
   * fois : la rendre à chaque appel la ferait confirmer par la grammaire alors qu'une
   * seule image l'a vraiment vue.
   */
  async reconnaitreSigne(): Promise<Detection<J> | null> {
    if (this.lecteur) {
      const vue = this.detectionRejeu;
      this.detectionRejeu = null;
      return vue;
    }

    this.derniereVive = await this.p.signe();
    return this.derniereVive;
  }

  // ---- enregistrer, rejouer ----

  enregistrer(): void {
    const { largeur, hauteur } = this.p.taille();
    const horodatage = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    this.enregistreur = new EnregistreurDeSession(horodatage, largeur, hauteur);
    this.majEtat();
  }

  arreter(): Session {
    const session = (this.enregistreur ?? new EnregistreurDeSession("vide", 0, 0)).terminer();
    this.enregistreur = null;
    this.majEtat();
    return session;
  }

  rejouer(session: Session): void {
    this.lecteur = new LecteurDeSession(session);
    this.derniereHorloge = 0;
    this.postureRejeu = null;
    this.detectionRejeu = null;
    this.p.surBascule?.();
    this.majEtat();
  }

  /** Rendre la main aux capteurs, que la session soit finie ou interrompue. */
  finirRejeu(): void {
    if (!this.lecteur) return;
    this.lecteur = null;
    this.postureRejeu = null;
    this.detectionRejeu = null;
    this.p.surBascule?.();
    this.majEtat();
  }

  /**
   * Une session enregistrée avec un autre pack contient des jetons que ce
   * reconnaisseur ne connaît pas. Les laisser passer ferait planter l'affichage sur
   * un `SIGNES[jeton]` indéfini : on les ignore, le reste de la session se rejoue.
   */
  private filtrer(detection: Detection | null): Detection<J> | null {
    if (!detection) return null;
    return this.p.jetonConnu(detection.jeton) ? (detection as Detection<J>) : null;
  }

  // ---- le panneau ----

  /** Monte le panneau. Sans cet appel le banc existe mais ne se voit pas. */
  monter(): void {
    const panneau = el("banc");
    if (!panneau) return;
    panneau.hidden = false;
    this.monte = true;

    el<HTMLButtonElement>("bancEnregistrer")?.addEventListener("click", () => this.enregistrer());
    el<HTMLButtonElement>("bancArreter")?.addEventListener("click", () => this.telecharger());

    const fichier = el<HTMLInputElement>("bancFichier");
    fichier?.addEventListener("change", () => {
      const f = fichier.files?.[0];
      if (f) void this.ouvrir(f);
    });

    // On dépose aussi un fichier directement sur le panneau : c'est le geste naturel
    // quand on a une session sous la main.
    panneau.addEventListener("dragover", e => {
      e.preventDefault();
      panneau.classList.add("survol");
    });
    panneau.addEventListener("dragleave", () => panneau.classList.remove("survol"));
    panneau.addEventListener("drop", e => {
      e.preventDefault();
      panneau.classList.remove("survol");
      const f = e.dataTransfer?.files[0];
      if (f) void this.ouvrir(f);
    });

    this.majEtat();
  }

  /** Les valeurs lues en direct. Appelé à chaque image de la boucle d'entrée. */
  rafraichir(lecture: LectureBanc): void {
    if (!this.monte) return;

    // Soixante écritures DOM par seconde pour des valeurs qui ne bougent pas : le
    // mémo coûte une concaténation et épargne tout le reste.
    const cle = [
      lecture.attitude,
      lecture.geste,
      lecture.jeton,
      lecture.immobilite.toFixed(2),
      lecture.fiabilite
    ].join("|");
    if (cle === this.dernierAffichage) return;
    this.dernierAffichage = cle;

    ecrire("bancPosture", lecture.attitude);
    ecrire("bancGeste", lecture.geste ?? "—");
    ecrire("bancJeton", lecture.jeton ?? "—");
    ecrire("bancImmobilite", lecture.immobilite.toFixed(2));
    ecrire("bancFiabilite", lecture.fiabilite ? "oui" : "non");
  }

  private async ouvrir(fichier: File): Promise<void> {
    try {
      const { deserialiser } = await import("../moteur/rejeu/format");
      this.rejouer(deserialiser(await fichier.text()));
    } catch (erreur) {
      ecrire("bancEtat", (erreur as Error).message);
    }
  }

  private telecharger(): void {
    const session = this.arreter();
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(new Blob([serialiser(session)], { type: "application/json" }));
    lien.download = `session-${session.nom}.json`;
    lien.click();
    // Révoqué plus tard : le navigateur lit encore l'objet pendant le clic.
    setTimeout(() => URL.revokeObjectURL(lien.href), 10_000);
  }

  private majEtat(): void {
    if (!this.monte) return;
    ecrire("bancEtat", this.lecteur ? "rejeu" : this.enregistreur ? "enregistrement" : "prêt");
    const arreter = el<HTMLButtonElement>("bancArreter");
    if (arreter) arreter.disabled = !this.enregistreur;
    const enregistrer = el<HTMLButtonElement>("bancEnregistrer");
    if (enregistrer) enregistrer.disabled = this.enregistreur !== null;
  }
}

function ecrire(id: string, valeur: string): void {
  const noeud = el(id);
  if (noeud) noeud.textContent = valeur;
}
