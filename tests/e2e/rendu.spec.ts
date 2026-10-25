// Ce que seul un vrai navigateur peut dire.
//
// Les tests unitaires ne voient ni le DOM ni la feuille de style : le contexte 2D des
// tests d'effets est un espion, et il accepte tout. Trois défauts critiques sont passés
// par ce trou — une feuille de style cassée qui affichait l'encyclopédie par-dessus le
// bouton de démarrage, et une bannière de jutsu qui ne s'affichait plus.
//
// Ces tests ne comparent pas des pixels : une comparaison d'images diverge d'une
// machine à l'autre et finit désactivée. Ils vérifient des faits — une variable de
// thème qui se résout, un bouton réellement cliquable, un panneau réellement caché.

import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(400);
});

test("la feuille de style est appliquée, pas avalée par un commentaire", async ({ page }) => {
  // Un commentaire non fermé avale les règles qui suivent, sans erreur nulle part :
  // les variables de thème se résolvent alors à la chaîne vide.
  const theme = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      fond: s.getPropertyValue("--fond").trim(),
      orange: s.getPropertyValue("--orange").trim(),
      texte: s.getPropertyValue("--texte").trim(),
      boxSizing: getComputedStyle(document.body).boxSizing
    };
  });

  expect(theme.fond).not.toBe("");
  expect(theme.orange).not.toBe("");
  expect(theme.texte).not.toBe("");
  expect(theme.boxSizing).toBe("border-box");
});

test("l'attribut hidden cache vraiment, même un écran en display:flex", async ({ page }) => {
  // `.ecran { display: flex }` l'emporte sur la règle du navigateur si `[hidden]` perd
  // son !important. L'encyclopédie se retrouve alors affichée par-dessus l'accueil.
  for (const id of ["encyclo", "journal", "accueil"]) {
    await expect(page.locator(`#${id}`)).toBeHidden();
  }
});

test("le bouton de démarrage reçoit vraiment le clic, rien ne le recouvre", async ({ page }) => {
  await page.getByRole("button", { name: /Kata/ }).click();

  const bouton = page.getByRole("button", { name: /ouvrir la caméra|open the camera/i });
  await expect(bouton).toBeVisible();

  // L'élément au centre du bouton doit être le bouton lui-même, ou un de ses enfants.
  const auDessus = await bouton.evaluate(el => {
    const r = el.getBoundingClientRect();
    const dessus = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return dessus === el || el.contains(dessus);
  });
  expect(auDessus).toBe(true);
});

test("au chargement, seul le portail est visible", async ({ page }) => {
  const visibles = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>(".ecran")]
      .filter(e => !e.hidden && getComputedStyle(e).display !== "none")
      .map(e => e.id)
  );
  expect(visibles).toEqual(["portail"]);
});

test("l'écran ouvert est bien celui qui reçoit les clics", async ({ page }) => {
  // Les panneaux se superposent volontairement — le fond est translucide et flouté.
  // Ce qui compte n'est donc pas qu'un seul soit visible, mais lequel est au-dessus :
  // c'est en recouvrant le bouton de démarrage que l'encyclopédie rendait l'appli
  // inutilisable.
  await page.getByRole("button", { name: /Kata/ }).click();
  await page.locator("#btnEncycloAccueil").click();

  const dessus = await page.evaluate(() => {
    const au = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    return au?.closest(".ecran")?.id ?? null;
  });
  expect(dessus).toBe("encyclo");
});

test("la bannière du jutsu s'affiche quand un jutsu part", async ({ page }) => {
  // Elle posait une classe que la feuille de style ne connaissait pas : le nom du
  // jutsu, qui est le retour principal de l'appli, ne s'affichait jamais.
  await page.getByRole("button", { name: /Kata/ }).click();
  await page.locator("#btnEncycloAccueil").click();
  await page.getByRole("tab", { name: /jutsu/i }).click();
  await page.locator("#listeJutsus button[data-technique]").first().click();

  await page.waitForFunction(() => window.kagami?.pret === true, null, { timeout: 45_000 });

  const banniere = page.locator("#banniere");
  await expect(banniere).toHaveClass(/visible/);
  const opacite = await banniere.evaluate(el => Number(getComputedStyle(el).opacity));
  expect(opacite).toBeGreaterThan(0);
  await expect(banniere.locator(".nom")).not.toBeEmpty();
});

test("la fiche d'entraînement montre le jutsu visé et le prochain signe", async ({ page }) => {
  await page.getByRole("button", { name: /Kata/ }).click();
  await page.locator("#btnEncycloAccueil").click();
  await page.getByRole("tab", { name: /jutsu/i }).click();
  await page.locator("#listeJutsus button[data-technique]").first().click();
  await page.waitForFunction(() => window.kagami?.pret === true, null, { timeout: 45_000 });

  await expect(page.locator("#guideKanji")).not.toBeEmpty();
  await expect(page.locator("#guideTexte")).not.toBeEmpty();
  // exactement une pastille marquée comme le signe à faire
  await expect(page.locator("#guideSuite .pastille.suivant")).toHaveCount(1);
});

test("aucune clé de traduction brute n'apparaît à l'écran", async ({ page }) => {
  // `t()` renvoie la clé quand elle manque : une étiquette comme « camera.occupee »
  // s'affiche alors telle quelle au lieu d'une phrase.
  await page.getByRole("button", { name: /Kata/ }).click();

  const texte = await page.locator("#accueil").innerText();
  expect(texte).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\b(?![^(]*\))/);
});

test("les illustrations des signes se chargent", async ({ page }) => {
  await page.getByRole("button", { name: /Kata/ }).click();
  await page.locator("#btnEncycloAccueil").click();

  const cassees = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLImageElement>("#listeSignes img")]
      .filter(i => !i.complete || i.naturalWidth === 0)
      .map(i => i.src)
  );
  expect(cassees).toEqual([]);
});
