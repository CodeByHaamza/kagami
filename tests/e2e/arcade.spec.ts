// Le mode arcade, vu du navigateur.
//
// Deux règles de la spec (§1, §4, §10.1) :
// - le Dojo reste l'entrée par défaut et ne montre aucune jauge ;
// - le HUD « parchemin » n'affiche jamais de kanji seul : 命 est accompagné de Vie,
//   気 de Chakra, 口 d'Invocation, et le sceau de vague affiche des chiffres arabes.

import { expect, test } from "@playwright/test";

test("le Dojo n'affiche pas le HUD d'arcade", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Kata/ }).click();
  await page.locator("#btnDemarrer").click();
  await page.waitForFunction(() => window.kagami?.pret === true, null, { timeout: 45_000 });

  await expect(page.locator("#hudArcade")).toBeHidden();
});

test("choisir une mission d'arcade affiche le HUD parchemin, les noms en clair et le sceau 1/3", async ({
  page
}) => {
  const erreurs: string[] = [];
  page.on("pageerror", e => erreurs.push(e.message));

  await page.goto("/");
  await page.getByRole("button", { name: /Kata/ }).click();
  await page.locator("#btnArcade").click();

  await expect(page.locator("#missions")).toBeVisible();
  await expect(page.locator("#listeMissions [data-mission]")).toHaveCount(5);

  await page.locator('#listeMissions [data-mission="rangD"]').click();
  await page.waitForFunction(() => window.kagami?.pret === true, null, { timeout: 45_000 });

  const hud = page.locator("#hudArcade");
  await expect(hud).toBeVisible();
  await expect(hud).toContainText("命");
  await expect(hud).toContainText(/Vie|Life/);
  await expect(hud).toContainText("気");
  await expect(hud).toContainText(/Chakra/);
  await expect(hud).toContainText("口");
  await expect(hud).toContainText(/Invocation|Summon/);
  await expect(page.locator("#sceauVague")).toHaveText("1/3");

  expect(erreurs).toEqual([]);
});
