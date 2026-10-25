// Les règles du dépôt, vérifiées plutôt que recommandées.
//
// Ce projet est personnel : il ne doit porter que le pseudo GitHub, jamais le nom civil
// ni la mention universitaire dont le code d'origine est truffé. Une relecture à l'œil
// laisse passer ce genre de chose ; un test non.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const ICI = "tests/unitaires/depot.test.ts";

/** Les fichiers suivis par git, chemins relatifs à la racine. */
const versionnes = (): string[] =>
  execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);

/** Les fichiers dont on lit le contenu : du texte, pas des binaires ni du verrou npm. */
const lisibles = (): string[] =>
  versionnes().filter(
    f =>
      f !== ICI &&
      f !== "package-lock.json" &&
      !f.startsWith("public/modeles/") &&
      /\.(ts|tsx|js|mjs|cjs|json|md|html|css|yml|yaml|txt|gitattributes|gitignore|dockerignore)$|^Dockerfile|^\.|CLAUDE|LICENSE|CONTRIBUTING/.test(
        f
      )
  );

test("aucun fichier versionné ne porte le nom civil ni la mention universitaire", () => {
  const interdits = /karrouchi|\bhamza\b|BUT\s*INFO|BUT\s*3|\bTD4\b|\bR506\b/i;
  const fautifs: string[] = [];

  for (const fichier of lisibles()) {
    let contenu: string;
    try {
      contenu = readFileSync(fichier, "utf8");
    } catch {
      continue; // binaire ou illisible : rien à vérifier
    }
    const ligne = contenu.split("\n").findIndex(l => interdits.test(l));
    if (ligne >= 0) fautifs.push(`${fichier}:${ligne + 1}`);
  }

  expect(fautifs).toEqual([]);
});

test("le pack Naruto ne s'appelle plus ShinobiCam nulle part", () => {
  // Le nom a changé en cours de route : le projet est Kagami, le pack est Kata.
  const fautifs = lisibles().filter(f => {
    try {
      return /shinobicam/i.test(readFileSync(f, "utf8"));
    } catch {
      return false;
    }
  });
  expect(fautifs).toEqual([]);
});

test("aucun commit de la branche ne porte d'attribution Claude", () => {
  const messages = execFileSync("git", ["log", "--format=%B"], { encoding: "utf8" });
  expect(messages).not.toMatch(/co-authored-by/i);
  expect(messages).not.toMatch(/claude\.com\/claude-code/i);
  expect(messages).not.toMatch(/🤖/);
});

test("chaque dépendance est épinglée à une version exacte", () => {
  const paquet = JSON.parse(readFileSync("package.json", "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const flottantes = Object.entries({ ...paquet.dependencies, ...paquet.devDependencies })
    .filter(([, version]) => /^[\^~]|[x*]/.test(version))
    .map(([nom, version]) => `${nom}@${version}`);

  expect(flottantes).toEqual([]);
});

test("les modèles sont suivis par Git LFS", () => {
  const attributs = readFileSync(".gitattributes", "utf8");
  expect(attributs).toMatch(/\*\.onnx\s+filter=lfs/);
  expect(attributs).toMatch(/\*\.tflite\s+filter=lfs/);
});

test("les fichiers WebAssembly de MediaPipe ne sont pas versionnés", () => {
  // 40 Mo que npm fournit déjà : scripts/preparer.mjs les recopie.
  expect(versionnes().filter(f => f.startsWith("public/mediapipe/"))).toEqual([]);
});

test("le dépôt porte les documents qu'on attend d'un projet public", () => {
  const attendus = [
    "README.md",
    "LICENSE",
    "CONTRIBUTING.md",
    "CLAUDE.md",
    "Dockerfile",
    "compose.yaml",
    ".dockerignore",
    "src/packs/naruto/README.md"
  ];
  const presents = new Set(versionnes());
  expect(attendus.filter(f => !presents.has(f))).toEqual([]);
});

test("la licence dit que Naruto n'est pas sous licence MIT", () => {
  const licence = readFileSync("LICENSE", "utf8");
  expect(licence).toMatch(/MIT/);
  expect(licence).toMatch(/Kishimoto/i);
});

test("aucune feuille de style n'a de commentaire de bloc non fermé", () => {
  // Un commentaire ouvert et jamais fermé avale la règle qui suit. Sur l'hôte Windows,
  // Vite retombe sur un minifieur permissif qui laisse passer ; lightningcss, dans
  // l'image Docker, refuse — et c'est lui qui a raison. Le cas s'est produit : tout le
  // bloc :root a été avalé pendant un nettoyage d'en-têtes, sans que rien ne le dise.
  //
  // Les fichiers TypeScript n'ont pas besoin de ce test : tsc refuse déjà de compiler
  // un commentaire non fermé.
  const desequilibres = versionnes()
    .filter(f => f.endsWith(".css"))
    .filter(f => {
      const c = readFileSync(f, "utf8");
      return c.split("/*").length !== c.split("*/").length;
    });
  expect(desequilibres).toEqual([]);
});
