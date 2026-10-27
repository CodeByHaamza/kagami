// Le test de bout en bout : il tourne dans un vrai navigateur, avec une caméra
// factice. Il ne vérifie pas le jeu, il vérifie que tout est branché — ce qu'aucun
// test unitaire ne peut dire.

import { expect, test, type Page } from "@playwright/test";

/** Le portail s'ouvre en premier : on choisit Kata, puis le pack prend la main. */
async function entrerDansKata(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: /Kata/ }).click();
  await expect(page.locator("#accueil")).toBeVisible();
}

test("le portail propose les packs, un seul est jouable", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#listePacks button")).toHaveCount(4);
  await expect(page.locator("#listePacks button:not([disabled])")).toHaveCount(1);
  await expect(page.locator("#listePacks button:not([disabled])")).toContainText("Kata");
});

test("le dojo démarre, charge le modèle et dessine", async ({ page }) => {
  const erreurs: string[] = [];
  page.on("pageerror", e => erreurs.push(e.message));

  await entrerDansKata(page);
  await page.locator("#btnDemarrer").click();

  await expect(page.locator("#scene")).toBeVisible();
  await page.waitForFunction(() => window.kagami?.pret === true, null, { timeout: 45_000 });

  expect(erreurs).toEqual([]);
});

test("l'encyclopédie liste les 14 signes et les 58 jutsus", async ({ page }) => {
  await entrerDansKata(page);
  await page.locator("#btnEncycloAccueil").click();

  await expect(page.locator("#listeSignes .fiche-signe")).toHaveCount(14);

  await page.getByRole("tab", { name: /jutsu/i }).click();
  await expect(page.locator("#listeJutsus .fiche-jutsu")).toHaveCount(58);
});

test("la page bascule en anglais", async ({ page }) => {
  await entrerDansKata(page);
  await page.getByRole("button", { name: /^EN$/ }).click();

  await expect(page.getByRole("button", { name: /open the camera/i })).toBeVisible();
});
