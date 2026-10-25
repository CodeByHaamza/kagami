// La caméra et la boucle de détection.
//
// Review Focus 1 : une caméra refusée est le cas d'échec le plus courant de l'appli,
// et c'est celui qui doit expliquer ce qui se passe plutôt que de laisser un écran
// noir. getUserMedia jette des DOMException aux noms obscurs : on les traduit en codes
// stables, que l'interface sait présenter.

import { BoucleDeDetection, Camera, ErreurCamera } from "../../src/moteur/entree/camera";

/** Une piste vidéo factice, qui note si on l'a arrêtée. */
function piste() {
  return { arretee: false, stop(this: { arretee: boolean }) { this.arretee = true; } };
}

function fluxFactice() {
  const pistes = [piste(), piste()];
  return { pistes, getTracks: () => pistes } as unknown as MediaStream & {
    pistes: ReturnType<typeof piste>[];
  };
}

function mediaFactice(reponse: () => Promise<MediaStream>) {
  const appels: MediaStreamConstraints[] = [];
  return {
    appels,
    media: {
      getUserMedia: (c: MediaStreamConstraints) => {
        appels.push(c);
        return reponse();
      }
    } as unknown as MediaDevices
  };
}

const erreurDom = (nom: string) => () => Promise.reject(new DOMException("refus", nom));

test("une permission refusée donne un code stable, pas une DOMException brute", async () => {
  const { media } = mediaFactice(erreurDom("NotAllowedError"));
  const camera = new Camera(media);

  await expect(camera.ouvrir(true)).rejects.toBeInstanceOf(ErreurCamera);
  await expect(camera.ouvrir(true)).rejects.toMatchObject({ code: "permission" });
});

test("l'absence de caméra a son propre code", async () => {
  const { media } = mediaFactice(erreurDom("NotFoundError"));
  const camera = new Camera(media);

  await expect(camera.ouvrir(true)).rejects.toMatchObject({ code: "absente" });
});

test("une caméra déjà occupée a son propre code", async () => {
  const { media } = mediaFactice(erreurDom("NotReadableError"));
  const camera = new Camera(media);

  await expect(camera.ouvrir(true)).rejects.toMatchObject({ code: "occupee" });
});

test("un contexte non sécurisé est signalé avant même d'appeler getUserMedia", async () => {
  // Sur http://, navigator.mediaDevices n'existe pas : sans ce cas, l'appli jetterait
  // un « cannot read property getUserMedia of undefined ».
  const camera = new Camera(undefined);

  await expect(camera.ouvrir(true)).rejects.toMatchObject({ code: "nonSecurise" });
});

test("une erreur inconnue reste signalée, avec sa cause", async () => {
  const { media } = mediaFactice(() => Promise.reject(new Error("bizarre")));
  const camera = new Camera(media);

  const erreur = await camera.ouvrir(true).then(
    () => null,
    (e: unknown) => e as ErreurCamera
  );
  expect(erreur?.code).toBe("inconnue");
  expect(erreur?.cause).toBeInstanceOf(Error);
});

test("la caméra frontale est demandée en mode user, l'arrière en environment", async () => {
  const flux = fluxFactice();
  const { media, appels } = mediaFactice(() => Promise.resolve(flux));
  const camera = new Camera(media);

  await camera.ouvrir(true);
  await camera.ouvrir(false);

  expect((appels[0]?.video as MediaTrackConstraints).facingMode).toBe("user");
  expect((appels[1]?.video as MediaTrackConstraints).facingMode).toBe("environment");
});

test("fermer arrête toutes les pistes du flux", async () => {
  const flux = fluxFactice();
  const { media } = mediaFactice(() => Promise.resolve(flux));
  const camera = new Camera(media);

  await camera.ouvrir(true);
  camera.fermer();

  expect(flux.pistes.every(p => p.arretee)).toBe(true);
});

test("basculer ferme l'ancien flux avant d'en ouvrir un nouveau", async () => {
  // Review Focus 5 : changer de caméra en pleine partie. Sans fermeture, la caméra
  // précédente reste allumée et le téléphone chauffe.
  const premier = fluxFactice();
  const second = fluxFactice();
  let tour = 0;
  const { media } = mediaFactice(() => Promise.resolve(tour++ === 0 ? premier : second));
  const camera = new Camera(media);

  await camera.ouvrir(true);
  await camera.basculer();

  expect(premier.pistes.every(p => p.arretee)).toBe(true);
  expect(second.pistes.some(p => p.arretee)).toBe(false);
  expect(camera.deFace).toBe(false);
});

describe("BoucleDeDetection", () => {
  const attendre = () => new Promise(suite => setTimeout(suite, 0));

  test("la boucle respecte l'écart minimum entre deux détections", async () => {
    const instants: number[] = [];
    let horloge = 0;
    const boucle = new BoucleDeDetection({
      ecart: 80,
      maintenant: () => horloge,
      attendre: ms => {
        horloge += ms;
        return Promise.resolve();
      },
      visible: () => true
    });

    let tours = 0;
    void boucle.demarrer(() => {
      instants.push(horloge);
      if (++tours >= 3) boucle.arreter();
      return Promise.resolve();
    });
    for (let i = 0; i < 20; i++) await attendre();

    expect(instants).toEqual([0, 80, 160]);
  });

  test("la boucle ne détecte pas quand l'onglet est caché", async () => {
    let horloge = 0;
    let detections = 0;
    let tours = 0;
    const boucle = new BoucleDeDetection({
      ecart: 80,
      maintenant: () => horloge,
      attendre: ms => {
        horloge += ms;
        if (++tours >= 5) boucle.arreter();
        return Promise.resolve();
      },
      visible: () => false
    });

    void boucle.demarrer(() => {
      detections++;
      return Promise.resolve();
    });
    for (let i = 0; i < 20; i++) await attendre();

    expect(detections).toBe(0);
  });

  test("une détection qui échoue n'arrête pas la boucle", async () => {
    let horloge = 0;
    let tours = 0;
    const erreurs: unknown[] = [];
    const boucle = new BoucleDeDetection({
      ecart: 10,
      maintenant: () => horloge,
      attendre: ms => {
        horloge += ms;
        if (++tours >= 3) boucle.arreter();
        return Promise.resolve();
      },
      visible: () => true,
      surErreur: e => erreurs.push(e)
    });

    void boucle.demarrer(() => Promise.reject(new Error("le modèle a hoqueté")));
    for (let i = 0; i < 20; i++) await attendre();

    expect(erreurs.length).toBeGreaterThan(1);
  });
});
