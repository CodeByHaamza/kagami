// Le banc de rejeu, dans le navigateur.
//
// C'est l'outil qui rend les seuils de gestes réglables : sans lui, « est-ce qu'un
// saut est détecté ? » se vérifie en sautant devant une webcam jusqu'à ce que ça
// marche — pas reproductible, pas mesurable. Ces tests prouvent la boucle entière :
// enregistrer, relire un fichier, et voir le moteur réagir à une session exactement
// comme il réagirait à un corps.
//
// La caméra factice de Playwright ne montre aucun corps : tout ce que le moteur lit
// ici ne peut donc venir que du fichier déposé. C'est ce qui rend ces tests honnêtes.

import { expect, test, type Page } from "@playwright/test";
import { REPERE } from "../../src/moteur/corps/posture";
import { VERSION_SESSION, type ImageSession, type Session } from "../../src/moteur/rejeu/format";
import type { Detection, Point3, Posture } from "../../src/moteur/types";

// ---- de quoi fabriquer un corps synthétique ----

const P = (x: number, y: number, visibilite = 0.95): Point3 => ({ x, y, z: 0, visibilite });

type Corps = Partial<Record<keyof typeof REPERE, Point3>>;

/** Debout, bras le long du corps. Les mêmes valeurs que les tests unitaires du corps. */
const REPOS: Record<keyof typeof REPERE, Point3> = {
  nez: P(0.5, 0.15),
  epauleG: P(0.4, 0.3),
  epauleD: P(0.6, 0.3),
  coudeG: P(0.38, 0.45),
  coudeD: P(0.62, 0.45),
  poignetG: P(0.39, 0.42),
  poignetD: P(0.61, 0.42),
  hancheG: P(0.44, 0.6),
  hancheD: P(0.56, 0.6),
  genouG: P(0.44, 0.78),
  genouD: P(0.56, 0.78),
  chevilleG: P(0.44, 0.95),
  chevilleD: P(0.56, 0.95)
};

/** Poignets joints devant le ventre : la posture de concentration. */
const MAINS_JOINTES: Corps = { poignetG: P(0.48, 0.42), poignetD: P(0.52, 0.42) };

/**
 * Poignets au-dessus des épaules, coudes ouverts : la posture de combat, mais pas la
 * garde — les mains sont trop loin du visage pour ça, et les deux bras restent repliés.
 */
const MAINS_HAUTES: Corps = {
  poignetG: P(0.3, 0.2),
  poignetD: P(0.7, 0.2),
  coudeG: P(0.32, 0.34),
  coudeD: P(0.68, 0.34)
};

/** Une posture complète : 33 points, dont seuls les treize nommés sont crédibles. */
function corps(remplacements: Corps, horodatage: number, montee = 0): Posture {
  const points: Point3[] = Array.from({ length: 33 }, () => P(0, 0, 0.1));
  for (const [nom, indice] of Object.entries(REPERE)) {
    const cle = nom as keyof typeof REPERE;
    const p = remplacements[cle] ?? REPOS[cle];
    // `montee` soulève tout le corps d'un bloc : c'est comme ça qu'on saute sans
    // changer la moindre autre mesure.
    points[indice] = P(p.x, p.y - montee, p.visibilite);
  }
  return { horodatage, points };
}

// ---- la session de démonstration ----

const PAS = 1000 / 60;
/** 0,4 largeur d'épaules : au-dessus du seuil de saut, qui est à 0,35. */
const SAUT = 0.08;

const TIGRE: Detection = {
  jeton: "tigre",
  score: 0.92,
  boite: { x1: 100, y1: 100, x2: 200, y2: 200 }
};

/**
 * Une session qui raconte, dans l'ordre : on se met en garde, on saute, on redescend
 * les bras, puis on joint les mains et on forme le Tigre.
 *
 * L'ordre compte. Chaque bascule de posture vide la grammaire — c'est voulu — donc le
 * signe vient en dernier, quand plus rien ne viendra l'effacer. Et le corps ne
 * redescend jamais de son saut : la descente serait lue comme un « accroupi » et
 * écraserait le geste qu'on veut observer.
 */
function sessionDeDemonstration(): Session {
  const images: ImageSession[] = [];

  const phase = (
    debut: number,
    fin: number,
    pose: Corps,
    detection: Detection | null,
    montee = 0
  ): void => {
    for (let t = debut; t < fin; t += PAS) {
      images.push({ t, detection, posture: corps(pose, t, montee) });
    }
  };

  phase(0, 400, {}, null); // debout : neutre, le temps que la machine se cale
  phase(400, 1100, MAINS_HAUTES, null); // mains hautes : combat
  for (let t = 1100; t < 1250; t += PAS) {
    // le saut, interpolé : le corps monte de 0,4 largeur d'épaules en 150 ms
    images.push({ t, detection: null, posture: corps(MAINS_HAUTES, t, (SAUT * (t - 1100)) / 150) });
  }
  phase(1250, 1900, MAINS_HAUTES, null, SAUT); // en l'air, tenu
  phase(1900, 2500, {}, null, SAUT); // bras baissés : neutre
  phase(2500, 5000, MAINS_JOINTES, TIGRE, SAUT); // mains jointes : concentration, Tigre

  return { version: VERSION_SESSION, nom: "démonstration", largeur: 640, hauteur: 480, images };
}

// ---- le parcours commun ----

/** Le portail s'ouvre en premier : on entre dans Kata, puis on démarre la caméra. */
async function enJeu(page: Page): Promise<void> {
  await page.goto("/?banc");
  await page.getByRole("button", { name: /Kata/ }).click();
  await page.locator("#btnDemarrer").click();
  await page.waitForFunction(() => window.kagami?.pret === true, null, { timeout: 45_000 });
}

/** Dépose la session de démonstration dans le banc. */
async function deposer(page: Page): Promise<void> {
  await page.setInputFiles("#bancFichier", {
    name: "demonstration.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(sessionDeDemonstration()))
  });
}

// ---- les tests ----

test("le banc n'apparaît qu'avec ?banc dans l'adresse", async ({ page }) => {
  // C'est un outil de développement, pas une fonctionnalité du jeu : un joueur ne
  // doit jamais tomber dessus.
  await page.goto("/");
  await expect(page.locator("#banc")).toBeHidden();

  await page.goto("/?banc");
  await expect(page.locator("#banc")).toBeVisible();
});

test("enregistrer puis arrêter propose le téléchargement d'un fichier de session", async ({
  page
}) => {
  await enJeu(page);

  await page.locator("#bancEnregistrer").click();
  await expect(page.locator("#bancEtat")).toHaveText("enregistrement");

  const telechargement = page.waitForEvent("download");
  await page.locator("#bancArreter").click();
  const fichier = await telechargement;

  expect(fichier.suggestedFilename()).toMatch(/\.json$/);
  await expect(page.locator("#bancEtat")).toHaveText("prêt");
});

test("déposer un fichier de session le rejoue à la place de la caméra", async ({ page }) => {
  await enJeu(page);
  await deposer(page);

  await expect(page.locator("#bancEtat")).toHaveText("rejeu");

  // La caméra factice ne montre aucun corps : une posture de combat ne peut donc
  // venir que du fichier.
  await expect(page.locator("#posture")).toHaveAttribute("data-attitude", "combat", {
    timeout: 15_000
  });
  await expect(page.locator("#bancPosture")).toHaveText("combat");
});

test("pendant le rejeu, les jetons et les gestes se déclenchent comme en direct", async ({
  page
}) => {
  await enJeu(page);
  await deposer(page);

  // Le signe : il traverse l'ordonnanceur, la grammaire et ses deux confirmations.
  // L'enchaînement n'existe que tant que la posture de concentration tient.
  await expect(page.locator("#historique")).toContainText("寅", { timeout: 25_000 });

  // Le geste : il traverse le lecteur de posture et la machine à postures.
  await expect(page.locator("#bancGeste")).toHaveText("saut");
  await expect(page.locator("#bancJeton")).toHaveText("tigre");
});
