// Les tests de progression, de la fiche ninja, de l'Académie et du chrono du Dojo.

import { expect, test } from "@playwright/test";

test("créer et consulter sa fiche ninja", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Kata/ }).click();

  // Ouvre la fiche ninja depuis l'accueil
  await page.locator("#btnFicheNinjaAccueil").click();
  await expect(page.locator("#ficheNinja")).toBeVisible();

  // Première fois : le formulaire est actif
  await page.locator("#inputNinjaNom").fill("Haamza");
  await page.locator("#inputNinjaClan").fill("Kagami");
  await page.locator("#selectNinjaVillage").selectOption("konoha");
  await page.locator("#selectNinjaContrat").selectOption("crapauds");
  await page.locator("#btnEnregistrerFiche").click();

  // La vue affiche les informations enregistrées
  await expect(page.locator("#ficheNom")).toHaveText("Haamza");
  await expect(page.locator("#ficheClan")).toHaveText("Kagami");
  await expect(page.locator("#ficheGrade")).toContainText(/Académie|Academy/);

  // Fermer la fiche
  await page.locator("#btnFermerFiche").click();
  await expect(page.locator("#ficheNinja")).toBeHidden();
});

test("l'Académie présente l'examen correspondant au grade", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Kata/ }).click();

  await page.locator("#btnAcademie").click();
  await expect(page.locator("#academie")).toBeVisible();
  await expect(page.locator("#academieExamenNom")).toContainText(/Genin/);
  await expect(page.locator("#btnLancerExamen")).toBeVisible();

  await page.locator("#btnFermerAcademie").click();
  await expect(page.locator("#academie")).toBeHidden();
});

test("le mode arcade verrouille les missions supérieures au grade de départ", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Kata/ }).click();

  await page.locator("#btnArcade").click();
  await expect(page.locator("#missions")).toBeVisible();

  // À l'académie, seul le rang D est accessible
  const boutonRangD = page.locator('#listeMissions [data-mission="rangD"]');
  const boutonRangC = page.locator('#listeMissions [data-mission="rangC"]');
  const boutonRangS = page.locator('#listeMissions [data-mission="rangS"]');

  await expect(boutonRangD).not.toHaveClass(/verrouillee/);
  await expect(boutonRangC).toHaveClass(/verrouillee/);
  await expect(boutonRangS).toHaveClass(/verrouillee/);

  await page.locator("#btnFermerMissions").click();
});

test("l'entraînement au Dojo affiche le chronomètre et l'emplacement de record", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Kata/ }).click();

  // Ouvre l'encyclopédie puis lance l'entraînement d'un jutsu
  await page.locator("#btnEncycloAccueil").click();
  await page.locator('[data-onglet="jutsus"]').click();
  await page.locator('#listeJutsus button').first().click();

  // Le panneau guide s'ouvre avec le chrono
  await expect(page.locator("#guide")).toBeVisible();
  await expect(page.locator("#guideChrono")).toBeVisible();
  await expect(page.locator("#btnFinGuide")).toBeVisible();

  await page.locator("#btnFinGuide").click();
  await expect(page.locator("#guide")).toBeHidden();
});
