// Le contrat entre main.ts et la feuille de style.
//
// Le contexte 2D espion des tests d'effets ne voit rien du DOM ni du CSS : une classe
// posée par le code mais absente de la feuille de style passe inaperçue jusqu'à ce
// qu'un humain regarde l'écran. C'est arrivé — la bannière de jutsu posait une classe
// « montre » que le CSS ne connaissait pas, et le nom du jutsu ne s'affichait plus.

import { readFileSync } from "node:fs";
import { EN } from "../../src/packs/naruto/i18n/en";
import { FR } from "../../src/packs/naruto/i18n/fr";

const main = readFileSync("src/app/main.ts", "utf8");
const banc = readFileSync("src/app/banc.ts", "utf8");
const arcade = readFileSync("src/app/arcade.ts", "utf8");
const ficheNinja = readFileSync("src/app/ficheNinja.ts", "utf8");
const academie = readFileSync("src/app/academie.ts", "utf8");
/** Tout ce qui touche au DOM du jeu : le cablage, l'arcade, la fiche ninja, l'académie et le banc. */
const code = [main, banc, arcade, ficheNinja, academie].join("\n");
const style = readFileSync("src/packs/naruto/assets/style.css", "utf8");
const camera = readFileSync("src/moteur/entree/camera.ts", "utf8");
const html = readFileSync("index.html", "utf8");

test("chaque classe posée par le code existe dans la feuille de style", () => {
  const posees = [...code.matchAll(/classList\.(?:add|toggle)\("([\w-]+)"\)/g)].map(m => m[1]!);
  const inconnues = [...new Set(posees)].filter(c => !style.includes(`.${c}`));
  expect(inconnues).toEqual([]);
});

test("chaque identifiant lu par le code existe dans la page", () => {
  // `el(...)` lit un nœud, `ecrire(...)` écrit dedans : les deux désignent un id.
  const lus = [...code.matchAll(/\b(?:el(?:<[^>]+>)?|ecrire)\("([\w]+)"/g)].map(m => m[1]!);
  const absents = [...new Set(lus)].filter(id => !new RegExp(`id="${id}"`).test(html));
  expect(absents).toEqual([]);
});

test("chaque code d'erreur caméra a une traduction dans les deux langues", () => {
  // Sinon l'écran d'accueil affiche la clé brute. Le cas le plus courant sur un poste
  // Windows est « occupee » : la webcam est déjà prise par Teams, Zoom ou OBS.
  const declaration = /export type CodeCamera =([^;]+);/.exec(camera)?.[1] ?? "";
  const codes = [...declaration.matchAll(/"(\w+)"/g)].map(m => m[1]!);

  expect(codes.length).toBeGreaterThan(0);
  const manquantes = codes.flatMap(code =>
    [
      ["fr", FR],
      ["en", EN]
    ]
      .filter(([, d]) => !(`camera.${code}` in (d as Record<string, string>)))
      .map(([l]) => `${l as string}:camera.${code}`)
  );
  expect(manquantes).toEqual([]);
});

test("aucune clé de traduction n'est définie sans être utilisée nulle part", () => {
  // Une clé orpheline est le signe d'un renommage à moitié fait — c'était le cas de
  // « camera.erreur », qui existait pendant que « camera.occupee » manquait.
  const sources = [
    "src/app/main.ts",
    "src/app/arcade.ts",
    "src/app/ficheNinja.ts",
    "src/app/academie.ts",
    "src/app/portail.ts",
    "src/moteur/ui/encyclopedie.ts"
  ]
    .map(f => readFileSync(f, "utf8"))
    .join("\n") + html;

  const orphelines = Object.keys(FR).filter(cle => {
    // construites a l'execution depuis un identifiant de donnees
    for (const prefixe of [
      "jutsu.",
      "signe.",
      "taijutsu.",
      "arme.",
      "posture.",
      "element.",
      "mission.",
      "arcade.refus.",
      "grade.",
      "village.",
      "contrat.",
      "academie.recommandation."
    ]) {
      if (cle.startsWith(prefixe)) return false;
    }
    if (/^camera\./.test(cle)) return false; // construites depuis le code d'erreur
    return !sources.includes(cle);
  });
  expect(orphelines).toEqual([]);
});
