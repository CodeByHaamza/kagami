// Tests unitaires de l'enregistreur vidéo WebM.

import { EnregistreurVideo } from "../../src/moteur/media/enregistreur";

describe("EnregistreurVideo", () => {
  let enregistreur: EnregistreurVideo;

  beforeEach(() => {
    enregistreur = new EnregistreurVideo();
  });

  test("renvoie false si captureStream n'est pas supporté", () => {
    const canvasFactice = {} as unknown as HTMLCanvasElement;
    expect(enregistreur.demarrer(canvasFactice)).toBe(false);
    expect(enregistreur.enregistre).toBe(false);
  });

  test("gère le démarrage et l'arrêt avec un faux MediaRecorder", async () => {
    const dataHandlers: ((ev: { data: Blob }) => void)[] = [];
    const listeners: Record<string, (() => void)[]> = {};
    let onstopCb: (() => void) | null = null;

    class MockMediaRecorder {
      static isTypeSupported = vi.fn().mockReturnValue(true);
      state = "recording";
      start = vi.fn();
      stop = vi.fn().mockImplementation(() => {
        if (onstopCb) onstopCb();
        listeners["stop"]?.forEach(cb => cb());
      });
      addEventListener = vi.fn().mockImplementation((ev: string, cb: () => void) => {
        listeners[ev] = listeners[ev] || [];
        listeners[ev].push(cb);
      });
      set ondataavailable(cb: (ev: { data: Blob }) => void) {
        dataHandlers.push(cb);
      }
      set onstop(cb: () => void) {
        onstopCb = cb;
      }
    }

    vi.stubGlobal("MediaRecorder", MockMediaRecorder);

    const canvasFactice = {
      captureStream: vi.fn().mockReturnValue({})
    } as unknown as HTMLCanvasElement;

    const demarre = enregistreur.demarrer(canvasFactice, { dureeMaxMs: 5000 });
    expect(demarre).toBe(true);
    expect(enregistreur.enregistre).toBe(true);

    // Simule une tranche de données
    const tranche = new Blob(["video-chunk"], { type: "video/webm" });
    for (const h of dataHandlers) {
      h({ data: tranche });
    }

    const blob = await enregistreur.arreter();
    expect(enregistreur.enregistre).toBe(false);
    expect(enregistreur.clipDisponible).toBe(true);
    expect(blob).not.toBeNull();

    vi.unstubAllGlobals();
  });
});
