import js from "@eslint/js";
import tseslint from "typescript-eslint";

// La regle d'architecture du projet : le moteur est generique, un pack est specifique
// a un anime. Un pack peut dependre du moteur ; le moteur ne doit jamais dependre d'un pack,
// sinon ajouter un deuxieme anime demanderait de rouvrir le moteur.
const MOTEUR_VERS_PACK = {
  regex: "(^|/)packs/",
  message:
    "Le moteur ne doit jamais importer un pack. Ce dont il a besoin passe par le manifeste du pack."
};

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".superpowers/**",
      "playwright-report/**",
      "test-results/**",
      "public/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/moteur/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [MOTEUR_VERS_PACK] }]
    }
  }
);
