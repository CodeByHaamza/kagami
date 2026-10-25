// Le corps, vu du navigateur.
//
// Les tests unitaires du plan 2 travaillent tous sur des points synthétiques : aucun
// ne vérifie que l'ensemble est branché, ni que le joueur voit dans quelle posture il
// est. C'est ce que ces deux tests font — et c'est la leçon du plan 1, dont trois
// défauts critiques sont passés parce que rien ne regardait l'écran.

import { expect, test } from "@playwright/test";

/** Le portail s'ouvre en premier : on entre dans Kata, puis on démarre la caméra. */
async function enJeu(page: import("@playwright/test").Page): Promise<string[]> {
  const erreurs: string[] = [];
  page.on("pageerror", e => erreurs.push(e.message));

  await page.goto("/");
  await page.getByRole("button", { name: /Kata/ }).click();
  await page.locator("#btnDemarrer").click();
  await page.waitForFunction(() => window.kagami?.pret === true, null, { timeout: 45_000 });
  return erreurs;
}

test("l'indicateur de posture est visible et annonce une attitude connue", async ({ page }) => {
  // Le joueur doit toujours savoir dans quelle posture il est : c'est elle qui décide
  // si ce sont ses signes ou ses coups qui comptent.
  await enJeu(page);

  const indicateur = page.locator("#posture");
  await expect(indicateur).toBeVisible();

  const attitude = await indicateur.getAttribute("data-attitude");
  expect(["neutre", "concentration", "combat"]).toContain(attitude);
  await expect(page.locator("#postureNom")).not.toBeEmpty();
});

test("l'appli reste jouable quand le modèle de posture ne charge pas", async ({ page }) => {
  // Review Focus 1, de bout en bout : 14 Mo qui ne viennent pas ne doivent pas
  // empêcher de faire des signes.
  await page.route("**/pose_landmarker*.task", route => route.abort());

  const erreurs = await enJeu(page);

  // le jeu tourne quand même
  await expect(page.locator("#scene")).toBeVisible();
  expect(erreurs).toEqual([]);

  // et l'encyclopédie reste utilisable
  await page.locator("#btnEncyclo").click();
  await expect(page.locator("#listeSignes .fiche-signe")).toHaveCount(14);
});

test("aucune erreur de page au démarrage avec le corps branché", async ({ page }) => {
  const erreurs = await enJeu(page);
  await page.waitForTimeout(2000); // laisse tourner la boucle d'entrée

  expect(erreurs).toEqual([]);
});
