// Le seul test de bout en bout : il tourne dans un vrai navigateur, avec une caméra
// factice. Il ne vérifie pas le jeu, il vérifie que tout est branché — ce qu'aucun
// test unitaire ne peut dire.

import { expect, test } from "@playwright/test";

test("le dojo démarre, charge le modèle et dessine", async ({ page }) => {
  const erreurs: string[] = [];
  page.on("pageerror", e => erreurs.push(e.message));

  await page.goto("/");
  await page.getByRole("button", { name: /caméra|camera/i }).click();

  await expect(page.locator("#scene")).toBeVisible();
  await page.waitForFunction(() => window.kagami?.pret === true, null, { timeout: 45_000 });

  expect(erreurs).toEqual([]);
});

test("l'encyclopédie liste les 14 signes et les 52 jutsus", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /encyclopédie|encyclopedia/i }).first().click();

  await expect(page.locator("#listeSignes .fiche-signe")).toHaveCount(14);

  await page.getByRole("tab", { name: /jutsu/i }).click();
  await expect(page.locator("#listeJutsus .fiche-jutsu")).toHaveCount(52);
});

test("la page bascule en anglais", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^EN$/ }).click();

  await expect(page.getByRole("button", { name: /open the camera/i })).toBeVisible();
});
