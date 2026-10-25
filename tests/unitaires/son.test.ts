// Le son : des fichiers s'ils existent, sinon des sons fabriques avec Web Audio.
//
// Ce qui se teste ici n'est pas le son produit mais les regles qui l'entourent : rien
// ne sort avant un geste de l'utilisateur (regle des navigateurs), rien ne sort en
// mode muet, et un nom inconnu ne fait pas tomber l'appli en plein jutsu.

export {}; // fait de ce fichier un module : sans cela ses declarations sont globales

type Son = typeof import("../../src/moteur/son/son");

async function recharger(): Promise<Son> {
  vi.resetModules();
  return import("../../src/moteur/son/son");
}

/** Un AudioContext factice qui note ce qu'on lui demande de jouer. */
/** Un AudioParam factice : toutes ses methodes existent et ne font rien. */
const parametre = () => ({
  value: 0,
  setValueAtTime: () => {},
  linearRampToValueAtTime: () => {},
  exponentialRampToValueAtTime: () => {},
  setTargetAtTime: () => {},
  cancelScheduledValues: () => {}
});

function audioFactice() {
  const demarrages: number[] = [];
  const noeud = (): Record<string, unknown> => {
    const n: Record<string, unknown> = {
      connect: (suivant: unknown) => suivant,
      start: (t: number) => demarrages.push(t),
      stop: () => {},
      gain: parametre(),
      frequency: parametre(),
      detune: parametre(),
      Q: parametre(),
      type: "sine",
      buffer: null
    };
    return n;
  };
  return {
    demarrages,
    currentTime: 0,
    sampleRate: 48_000,
    destination: {},
    state: "running",
    resume: () => Promise.resolve(),
    createGain: noeud,
    createOscillator: noeud,
    createBiquadFilter: noeud,
    createBufferSource: noeud,
    createBuffer: (_c: number, longueur: number) => ({
      getChannelData: () => new Float32Array(longueur)
    }),
    decodeAudioData: () => Promise.resolve({})
  };
}

let audio: ReturnType<typeof audioFactice>;

beforeEach(() => {
  audio = audioFactice();
  vi.stubGlobal(
    "AudioContext",
    class {
      constructor() {
        return audio;
      }
    }
  );
  vi.stubGlobal("fetch", () => Promise.resolve({ ok: false, status: 404 }));
  vi.stubGlobal("window", {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("le son est silencieux tant que activerSon n'a pas été appelé", async () => {
  // Les navigateurs n'autorisent le son qu'apres un geste de l'utilisateur.
  const son = await recharger();
  son.jouer("jutsu");

  expect(audio.demarrages).toHaveLength(0);
});

test("après activerSon, jouer produit quelque chose", async () => {
  const son = await recharger();
  await son.activerSon();
  son.jouer("jutsu");

  expect(audio.demarrages.length).toBeGreaterThan(0);
});

test("couperSon empêche toute lecture", async () => {
  const son = await recharger();
  await son.activerSon();
  son.couperSon(true);
  son.jouer("jutsu");

  expect(audio.demarrages).toHaveLength(0);
});

test("rétablir le son le rend de nouveau audible", async () => {
  const son = await recharger();
  await son.activerSon();
  son.couperSon(true);
  son.couperSon(false);
  son.jouer("jutsu");

  expect(audio.demarrages.length).toBeGreaterThan(0);
});

test("jouer un nom inconnu ne jette pas", async () => {
  const son = await recharger();
  await son.activerSon();

  expect(() => son.jouer("nimportequoi")).not.toThrow();
  expect(() => son.jouer("")).not.toThrow();
});

test("activerSon deux fois ne crée qu'un seul contexte audio", async () => {
  const son = await recharger();
  const premier = await son.activerSon();
  const second = await son.activerSon();

  expect(premier).toBe(second);
});

test("crier ne jette pas quand le navigateur n'a pas de synthèse vocale", async () => {
  const son = await recharger();
  await son.activerSon();

  expect(() =>
    son.crier({ kanji: "火遁", romaji: "Katon" })
  ).not.toThrow();
});
