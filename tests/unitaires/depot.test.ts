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
  // Pas de \b autour de TD4 ni de R506 : « CartoTD4 » est précisément la forme sous
  // laquelle le chemin du dépôt d'origine réapparaîtrait, et une frontière de mot la
  // laisserait passer.
  const interdits = /karrouchi|\bhamza\b|BUT\s*INFO|BUT\s*3|TD4|R506/i;
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

test("la garde attrape le nom civil même collé à d'autres caractères", () => {
  // Le chemin du dépôt d'origine est « CartoTD4/Ninjutsu » : une frontière de mot
  // avant TD4 laisserait passer précisément la forme la plus probable.
  const interdits = /karrouchi|\bhamza\b|BUT\s*INFO|BUT\s*3|TD4|R506/i;

  for (const echantillon of ["CartoTD4/Ninjutsu", "R506bis", "Hamza", "BUT INFO 3", "karrouchi"]) {
    expect(interdits.test(echantillon)).toBe(true);
  }
  for (const innocent of ["standard", "butane", "TD40ctets"]) {
    expect(interdits.test(innocent)).toBe(innocent === "TD40ctets");
  }
});

test("aucun secret n'est versionné", () => {
  // On a manipulé une clé API fal pendant le développement. Une clé collée dans un
  // fichier de config « juste pour essayer » est la façon la plus banale d'en publier
  // une, et un dépôt privé ne protège de rien : il peut devenir public d'un clic.
  const motifs: readonly [string, RegExp][] = [
    ["clé fal", /\bfal_sk_[A-Za-z0-9_-]{8,}/],
    ["jeton GitHub", /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/],
    ["jeton GitHub (fin)", /\bgithub_pat_[A-Za-z0-9_]{20,}/],
    ["clé OpenAI", /\bsk-[A-Za-z0-9]{32,}/],
    ["clé AWS", /\bAKIA[0-9A-Z]{16}\b/],
    ["clé privée", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
    ["paire id:secret", /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[0-9a-f]{24,}/]
  ];

  const fautifs: string[] = [];
  for (const fichier of lisibles()) {
    let contenu: string;
    try {
      contenu = readFileSync(fichier, "utf8");
    } catch {
      continue;
    }
    for (const [quoi, motif] of motifs) {
      if (motif.test(contenu)) fautifs.push(`${fichier} : ${quoi}`);
    }
  }
  expect(fautifs).toEqual([]);
});

test("la feuille de route du README coche les plans terminés", () => {
  // Une case à cocher qui ment est la première chose qu'un lecteur remarque, et c'est
  // la seule partie du README qu'on oublie en finissant un plan.
  const readme = readFileSync("README.md", "utf8");
  expect(readme).toMatch(/- \[x\] \*\*1\*\* — extraction/);
  expect(readme).toMatch(/- \[x\] \*\*2\*\* — lecture du corps/);
});
