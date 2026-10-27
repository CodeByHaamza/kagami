// Enregistreur de clips vidéo WebM pour immortaliser les jutsus (§10.4).
//
// Capture le flux du canvas de jeu avec MediaRecorder à 30 images par seconde
// et génère un fichier WebM téléchargeable.

export interface OptionsEnregistrement {
  dureeMaxMs?: number;
  fps?: number;
  nomFichier?: string;
  onFin?: (blob: Blob) => void;
}

export class EnregistreurVideo {
  private mediaRecorder: MediaRecorder | null = null;
  private fragments: Blob[] = [];
  private dernierBlob: Blob | null = null;
  private minuteur: ReturnType<typeof setTimeout> | null = null;
  private actif = false;

  get enregistre(): boolean {
    return this.actif;
  }

  get clipDisponible(): boolean {
    return this.dernierBlob !== null;
  }

  get dernierClip(): Blob | null {
    return this.dernierBlob;
  }

  /**
   * Démarre l'enregistrement du canvas.
   */
  demarrer(canvas: HTMLCanvasElement, options: OptionsEnregistrement = {}): boolean {
    if (this.actif) return false;
    if (typeof canvas.captureStream !== "function") return false;
    if (typeof MediaRecorder === "undefined") return false;

    try {
      const fps = options.fps ?? 30;
      const flux = canvas.captureStream(fps);
      this.fragments = [];

      let mimeType = "video/webm;codecs=vp9";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
      }

      this.mediaRecorder = new MediaRecorder(flux, { mimeType });
      this.mediaRecorder.ondataavailable = ev => {
        if (ev.data && ev.data.size > 0) {
          this.fragments.push(ev.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        if (this.fragments.length > 0) {
          this.dernierBlob = new Blob(this.fragments, { type: "video/webm" });
          options.onFin?.(this.dernierBlob);
        }
      };

      this.mediaRecorder.start(100); // Découpage toutes les 100ms
      this.actif = true;

      const dureeMax = options.dureeMaxMs ?? 7000;
      this.minuteur = setTimeout(() => {
        void this.arreter();
      }, dureeMax);

      return true;
    } catch {
      this.actif = false;
      return false;
    }
  }

  /**
   * Arrête l'enregistrement et résout vers le Blob WebM final.
   */
  async arreter(): Promise<Blob | null> {
    if (!this.actif || !this.mediaRecorder) return this.dernierBlob;

    if (this.minuteur) {
      clearTimeout(this.minuteur);
      this.minuteur = null;
    }

    this.actif = false;

    return new Promise(resolve => {
      if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        resolve(this.dernierBlob);
        return;
      }

      this.mediaRecorder.addEventListener(
        "stop",
        () => {
          resolve(this.dernierBlob);
        },
        { once: true }
      );

      this.mediaRecorder.stop();
    });
  }

  /**
   * Déclenche le téléchargement du dernier clip enregistré dans le navigateur.
   */
  telecharger(nomFichier = "Kagami_Jutsu_clip.webm"): boolean {
    if (!this.dernierBlob || typeof document === "undefined") return false;

    const url = URL.createObjectURL(this.dernierBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomFichier;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  }
}
