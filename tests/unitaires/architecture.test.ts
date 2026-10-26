// La seule regle d'architecture du projet, et la seule qui se verifie automatiquement :
// le moteur est generique, il ne doit jamais dependre d'un pack d'anime.
// Voir docs/superpowers/specs/2026-10-24-moteur-anime-webcam-design.md, section 7.2.

import { ESLint } from "eslint";

// Le premier lintText charge ESLint, typescript-eslint et le compilateur TypeScript : à
// froid, pendant que vingt autres fichiers de test se disputent la machine, ça dépasse
// les 5 s par défaut de Vitest. Le test n'est pas lent, c'est son démarrage qui l'est.
const DEMARRAGE_ESLINT = 30_000;

test("un import de moteur/ vers packs/ est refusé", async () => {
  const eslint = new ESLint({ overrideConfigFile: "eslint.config.js" });
  const [resultat] = await eslint.lintText(
    `import { JUTSUS } from "../../packs/naruto/donnees/jutsus";\nexport const x = JUTSUS;\n`,
    { filePath: "src/moteur/grammaire/interdit.ts" }
  );
  expect(resultat!.errorCount).toBeGreaterThan(0);
  expect(JSON.stringify(resultat!.messages)).toMatch(/no-restricted-imports/);
}, DEMARRAGE_ESLINT);

test("un import de packs/ vers moteur/ est autorisé", async () => {
  const eslint = new ESLint({ overrideConfigFile: "eslint.config.js" });
  const [resultat] = await eslint.lintText(
    `import type { Jeton } from "../../moteur/types";\nexport type J = Jeton;\n`,
    { filePath: "src/packs/naruto/donnees/signes.ts" }
  );
  expect(resultat!.errorCount).toBe(0);
}, DEMARRAGE_ESLINT);
