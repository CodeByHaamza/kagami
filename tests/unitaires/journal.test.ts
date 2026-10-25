// Le journal de bord : il survit a un rechargement, parce qu'un telephone a court de
// memoire tue l'onglet et le recharge, emportant la console avec lui.
//
// Chaque test repart d'un module neuf : le journal lit le stockage a l'import, ce qui
// est exactement ce qu'on veut verifier (« ce que la page d'avant avait ecrit »).

export {}; // fait de ce fichier un module : sans cela ses declarations sont globales

const CLE = "kagami.journal";

type Journal = typeof import("../../src/moteur/debug/journal");

/** Recharge le module, comme le ferait un rechargement de page. */
async function recharger(): Promise<Journal> {
  vi.resetModules();
  return import("../../src/moteur/debug/journal");
}

/** Un localStorage en memoire, avec la possibilite de le faire echouer. */
function stockageFactice(options: { enPanne?: boolean } = {}) {
  const donnees = new Map<string, string>();
  return {
    donnees,
    getItem: (c: string) => {
      if (options.enPanne) throw new DOMException("refusé", "SecurityError");
      return donnees.get(c) ?? null;
    },
    setItem: (c: string, v: string) => {
      if (options.enPanne) throw new DOMException("quota", "QuotaExceededError");
      donnees.set(c, v);
    },
    removeItem: (c: string) => void donnees.delete(c),
    clear: () => donnees.clear(),
    key: () => null,
    length: 0
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", stockageFactice());
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("une entrée notée se retrouve dans le texte du journal", async () => {
  const journal = await recharger();
  journal.noter("jutsu", "goukakyu lancé");

  expect(journal.texteDuJournal()).toContain("[jutsu] goukakyu lancé");
});

test("le journal garde les entrées entre deux chargements de page", async () => {
  const avant = await recharger();
  avant.noter("page", "première visite");

  // la page se recharge : nouveau module, meme stockage
  const apres = await recharger();
  expect(apres.texteDuJournal()).toContain("première visite");
});

test("le journal se tronque au-delà de sa limite", async () => {
  const journal = await recharger();
  for (let i = 0; i < 450; i++) journal.noter("essai", `ligne ${i}`);

  const lignes = journal.texteDuJournal().split("\n");
  expect(lignes).toHaveLength(400);
  // ce sont les plus anciennes qui partent
  expect(journal.texteDuJournal()).not.toContain("ligne 0 ");
  expect(journal.texteDuJournal()).toContain("ligne 449");
});

test("vider le journal efface aussi ce qui est stocké", async () => {
  const journal = await recharger();
  journal.noter("essai", "à effacer");
  journal.viderJournal();

  expect(journal.texteDuJournal()).toBe("");
  const apres = await recharger();
  expect(apres.texteDuJournal()).toBe("");
});

test("noter ne jette pas si localStorage est indisponible", async () => {
  // Review Focus 4, versant journal : navigation privée, quota plein, cookies bloqués.
  vi.stubGlobal("localStorage", stockageFactice({ enPanne: true }));
  const journal = await recharger();

  expect(() => journal.noter("essai", "sans stockage")).not.toThrow();
  // il reste utilisable en mémoire pour la session en cours
  expect(journal.texteDuJournal()).toContain("sans stockage");
});

test("chaque ligne porte une heure et un type", async () => {
  const journal = await recharger();
  journal.noter("ALERTE", "quelque chose");

  expect(journal.texteDuJournal()).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3} \[ALERTE\] quelque chose$/);
});

test("la clé de stockage porte le nom du projet", async () => {
  const journal = await recharger();
  journal.noter("essai", "x");

  expect([...(localStorage as unknown as ReturnType<typeof stockageFactice>).donnees.keys()]).toContain(
    CLE
  );
});
