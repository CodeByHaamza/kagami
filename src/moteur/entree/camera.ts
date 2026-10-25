// La camera, et la boucle qui interroge le reconnaisseur.
//
// `getUserMedia` echoue de plusieurs facons et renvoie des DOMException aux noms
// obscurs (`NotAllowedError`, `OverconstrainedError`…). Les laisser remonter telles
// quelles donne un ecran noir sans explication, qui est le pire echec possible pour
// cette appli. On les traduit donc en codes stables, que l'interface sait presenter.

/** Pourquoi la camera n'a pas pu s'ouvrir. Correspond aux cles `camera.*` de l'i18n. */
export type CodeCamera = "permission" | "absente" | "occupee" | "nonSecurise" | "inconnue";

export class ErreurCamera extends Error {
  constructor(
    readonly code: CodeCamera,
    cause?: unknown
  ) {
    super(`camera: ${code}`, { cause });
    this.name = "ErreurCamera";
  }
}

function codeDe(erreur: unknown): CodeCamera {
  const nom = erreur instanceof DOMException ? erreur.name : "";
  if (nom === "NotAllowedError" || nom === "SecurityError") return "permission";
  if (nom === "NotFoundError" || nom === "OverconstrainedError") return "absente";
  if (nom === "NotReadableError" || nom === "AbortError") return "occupee";
  return "inconnue";
}

/** La resolution demandee ; le navigateur donne ce qu'il peut de plus proche. */
const IDEAL = { largeur: 1280, hauteur: 720 };

export class Camera {
  private flux: MediaStream | null = null;
  /** De face, l'image est affichee en miroir : on se voit comme dans une glace. */
  deFace = true;

  constructor(private readonly media: MediaDevices | undefined = globalThis.navigator?.mediaDevices) {}

  get actif(): boolean {
    return this.flux !== null;
  }

  async ouvrir(deFace = this.deFace): Promise<MediaStream> {
    // Sur http://, `mediaDevices` n'existe pas du tout.
    if (!this.media?.getUserMedia) throw new ErreurCamera("nonSecurise");

    this.fermer();
    this.deFace = deFace;
    try {
      this.flux = await this.media.getUserMedia({
        video: {
          facingMode: deFace ? "user" : "environment",
          width: { ideal: IDEAL.largeur },
          height: { ideal: IDEAL.hauteur }
        },
        audio: false
      });
      return this.flux;
    } catch (cause) {
      throw new ErreurCamera(codeDe(cause), cause);
    }
  }

  /** Passe de la camera frontale a l'arriere, et inversement. */
  basculer(): Promise<MediaStream> {
    return this.ouvrir(!this.deFace);
  }

  fermer(): void {
    this.flux?.getTracks().forEach(piste => piste.stop());
    this.flux = null;
  }
}

export interface ReglagesBoucle {
  /** Millisecondes au moins entre deux detections. */
  ecart: number;
  maintenant?: () => number;
  attendre?: (ms: number) => Promise<void>;
  /** L'onglet est-il au premier plan ? Inutile de faire chauffer le telephone sinon. */
  visible?: () => boolean;
  surErreur?: (erreur: unknown) => void;
}

/**
 * Interroge le reconnaisseur en boucle, a cadence bridee.
 *
 * Tout ce qui touche au temps est injectable : c'est ce qui permet de verifier la
 * cadence sans attendre de vraies millisecondes.
 */
export class BoucleDeDetection {
  private enMarche = false;
  private readonly ecart: number;
  private readonly maintenant: () => number;
  private readonly attendre: (ms: number) => Promise<void>;
  private readonly visible: () => boolean;
  private readonly surErreur: (erreur: unknown) => void;

  constructor(reglages: ReglagesBoucle) {
    this.ecart = reglages.ecart;
    this.maintenant = reglages.maintenant ?? (() => performance.now());
    this.attendre = reglages.attendre ?? (ms => new Promise(suite => setTimeout(suite, ms)));
    this.visible = reglages.visible ?? (() => !document.hidden);
    this.surErreur = reglages.surErreur ?? (() => {});
  }

  async demarrer(detecter: () => Promise<void>): Promise<void> {
    if (this.enMarche) return;
    this.enMarche = true;

    while (this.enMarche) {
      const debut = this.maintenant();
      if (this.visible()) {
        try {
          await detecter();
        } catch (erreur) {
          // Une detection ratee ne doit pas arreter la boucle : le modele hoquette
          // parfois, et l'appli doit s'en remettre toute seule.
          this.surErreur(erreur);
        }
      }
      if (!this.enMarche) break;
      await this.attendre(Math.max(0, this.ecart - (this.maintenant() - debut)));
    }
  }

  arreter(): void {
    this.enMarche = false;
  }
}
