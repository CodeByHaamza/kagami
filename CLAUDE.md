# Conventions de Kagami

Kagami est un moteur : ta webcam devient une glace où tu te vois avec les pouvoirs de
ton anime. Chaque anime est un **pack**. Le premier, **Kata** (型), couvre Naruto.

## La règle qui compte

**`src/moteur/` n'importe jamais rien de `src/packs/`.** L'inverse est permis.

C'est la seule règle d'architecture du projet, et la seule qui se vérifie
automatiquement : ESLint la refuse (`no-restricted-imports`) et
`tests/unitaires/architecture.test.ts` le prouve. Tout ce que le moteur sait d'un anime
lui arrive par le manifeste du pack.

## La langue

- **Le code est en français** : variables, fonctions, commentaires. Le code d'origine
  l'était, et le garder évite un mélange illisible.
- **L'interface est traduite.** Aucune chaîne visible en dur : tout passe par `t()`.
  Une clé ajoutée en français doit l'être en anglais — un test le vérifie.
- Les kanji et les romaji ne se traduisent pas : ils restent dans `donnees/`.

## L'identité du dépôt

Ce projet est personnel. Il porte **`CodeByHaamza`**, jamais le nom civil du
propriétaire, jamais sa mention de formation, jamais les identifiants du dépôt scolaire
dont le code vient. `tests/unitaires/depot.test.ts` refuse toute réapparition, et c'est
le seul fichier qui a le droit d'épeler les chaînes interdites.

**Les messages de commit ne portent aucune attribution Claude** : pas de
`Co-Authored-By`, pas de 🤖, pas de lien. Le test vérifie l'historique de la branche.

## Les tests

On écrit le test, on le regarde échouer, puis on écrit le code.

| Quoi | Où | Comment |
| --- | --- | --- |
| logique pure | `tests/unitaires/` | Vitest |
| types | `tests/unitaires/*.test-d.ts` | `expectTypeOf` |
| les 52 effets | `effets-naruto.test.ts` | lancés 60 images sur un contexte 2D espion |
| bout en bout | `tests/e2e/` | Playwright, caméra factice |

Pas de test de rendu visuel : coût élevé, valeur faible. Le test des effets vérifie
qu'aucun ne jette et qu'aucune particule ne part en `NaN`, ce qui attrape les vraies
régressions d'un portage.

`npm run test:e2e` suppose que `npm run dev` tourne déjà : Playwright n'arrive pas à
démarrer Vite lui-même sur Windows.

## Où mettre quoi

| | |
| --- | --- |
| `src/moteur/` | générique : entrée, grammaire, rendu, son, i18n, stockage |
| `src/packs/naruto/` | Kata : données, reconnaisseur, effets, textes |
| `src/app/` | le câblage, et rien d'autre |
| `public/modeles/` | les modèles, suivis par Git LFS |
| `public/mediapipe/` | recopié depuis `node_modules` par `scripts/preparer.mjs`, pas versionné |
| `docs/superpowers/` | la conception et les plans |

## Ajouter quelque chose

Un jutsu, un effet, un pack : voir [CONTRIBUTING.md](CONTRIBUTING.md).

Les réglages de détection (seuil `0.6`, deux confirmations, oubli à 4 s, tenue à 2,5 s,
attente à 1,5 s) sont calés finement contre le bruit du modèle. **Ne pas y toucher sans
mesurer** : ils sont la différence entre une appli jouable et une appli frustrante.
