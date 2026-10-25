# Kagami — Plan 1 : extraction, outillage et séparation moteur / pack

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le dépôt `kata` existe, typé, testé, buildé, et le pack Kata y fait
**exactement** ce que fait l'appli actuelle — pas une fonctionnalité de plus.

**Architecture:** Portage à comportement constant du dossier `Ninjutsu` du dépôt scolaire vers
TypeScript strict + Vite, découpé en `src/moteur/` (générique) et `src/packs/naruto/`
(spécifique), avec une règle de lint qui interdit `moteur/ → packs/`. `main.js`
(607 lignes, dix métiers) est cassé en modules à responsabilité unique. Aucun
changement de comportement : c'est le filet qui rend les plans suivants sûrs.

**Tech Stack:** TypeScript 5 strict · Vite 7 · Vitest 3 · Playwright · ESLint 9 +
Prettier · onnxruntime-web 1.29 · @mediapipe/tasks-vision · three 0.186 · Git LFS

**Spec:** [`docs/superpowers/specs/2026-10-24-moteur-anime-webcam-design.md`](../specs/2026-10-24-moteur-anime-webcam-design.md)

**Source à porter:** le dossier `Ninjutsu` du dépôt scolaire d'origine (commit
`e3d86b4`). Le dossier est en lecture seule : on lit, on ne modifie jamais la source.

## Global Constraints

- **TypeScript strict** (`"strict": true`, `noUncheckedIndexedAccess`). Les noms de
  variables, fonctions et commentaires restent **en français**, comme le code source.
- **Aucune mention du nom civil.** Ni le nom civil du propriétaire, ni sa mention de
  formation, ni les identifiants du dépôt scolaire d'origine ne doivent apparaître dans
  le dépôt. Les en-têtes de la source les portent tous : à nettoyer au portage. La liste
  exacte des chaînes interdites vit dans `tests/unitaires/depot.test.ts`, qui en est le
  seul endroit légitime. Signature : `CodeByHaamza`.
- **Aucune attribution Claude** dans les messages de commit : pas de `Co-Authored-By`,
  pas de 🤖, pas de lien.
- **`src/moteur/` n'importe jamais rien de `src/packs/`.** Vérifié par ESLint et par un
  test.
- **Comportement constant.** Ce plan ne change aucune valeur de réglage : seuil `0.6`,
  `CONFIRMATIONS = 2`, `OUBLI = 4000`, `TENIR = 2500`, `ATTENTE = 1500`,
  `ECART_DETECTION = 80`. Toute divergence est un bug.
- **Dépendances bundlées**, plus de CDN : onnxruntime-web, three, @mediapipe/tasks-vision
  et la police passent en paquets npm à version exacte.
- **Modèles en Git LFS** : `public/modeles/*.onnx`, `*.tflite`.
- **Français par défaut, anglais complet.** Aucune chaîne visible en dur dans le code.

## Review Focus

Cinq cas que la spec implique, qu'aucune tâche n'exerce spontanément, et qui casseraient
l'appli chez un utilisateur. Chacun reçoit son test dans la tâche propriétaire.

1. **Caméra refusée ou absente** (`getUserMedia` rejette : permission refusée, pas de
   webcam, onglet non sécurisé). L'écran d'accueil doit afficher un message
   compréhensible et rester utilisable, pas un écran noir. → Tâche 11.
2. **Modèle introuvable** (LFS non tiré, 404 sur le `.onnx`). Message clair qui dit quoi
   faire, pas un chargement infini. → Tâche 5.
3. **Vidéo de taille 0** au premier rendu (`videoWidth === 0` avant `readyState >= 2`).
   `calculerCadre` divise par ces valeurs : doit renvoyer un cadre neutre sans NaN. →
   Tâche 8.
4. **`localStorage` indisponible** (navigation privée, stockage plein, cookies bloqués).
   La source protège chaque accès par try/catch ; la sauvegarde typée doit conserver ce
   comportement et démarrer sur des valeurs par défaut. → Tâche 12.
5. **Changement de caméra ou redimensionnement en pleine session.** Le cadre, le miroir
   et le canvas doivent se recalculer sans fuite de contexte ni effet figé. → Tâche 8.

---

## Structure des fichiers

Le dépôt est initialisé **sur place** dans `C:\Users\tasda\Documents\Projets\Perso\Kata`
(qui contient déjà `docs/`). Le dépôt GitHub distant s'appellera `kata` ; le nom du
dossier local n'a pas d'importance.

```text
/
├─ package.json · tsconfig.json · vite.config.ts · vitest.config.ts
├─ eslint.config.js · .prettierrc · .gitignore · .gitattributes
├─ .github/workflows/ci.yml
├─ CLAUDE.md · LICENSE · CONTRIBUTING.md · README.md
├─ index.html
├─ public/modeles/{yolox_nano_with_post.onnx, selfie_segmenter.tflite, LICENSE.txt}
├─ src/
│  ├─ app/
│  │  ├─ main.ts                     point d'entrée : assemble moteur + pack
│  │  └─ ecrans.ts                   accueil, encyclopédie, journal (DOM)
│  ├─ moteur/
│  │  ├─ types.ts                    Jeton, Detection, Technique, Effet, Pack
│  │  ├─ entree/camera.ts            ouverture, changement, miroir
│  │  ├─ entree/reconnaisseur.ts     interface Reconnaisseur
│  │  ├─ entree/boucle.ts            boucle de détection cadencée
│  │  ├─ grammaire/sequence.ts       jetons → technique
│  │  ├─ rendu/cadre.ts              maths de cadrage (pur)
│  │  ├─ rendu/boucle.ts             requestAnimationFrame, composition
│  │  ├─ rendu/effets.ts             classe Effets + contrat
│  │  ├─ silhouette/silhouette.ts    détourage MediaPipe
│  │  ├─ son/son.ts                  Web Audio + fichiers
│  │  ├─ ui/encyclopedie.ts · ui/i18n.ts
│  │  ├─ stockage/sauvegarde.ts      versionnée, avec migration
│  │  └─ debug/journal.ts
│  └─ packs/naruto/
│     ├─ manifeste.ts
│     ├─ entree/detecteurSignes.ts   YOLOX + pretraitement.ts (pur)
│     ├─ donnees/signes.ts · donnees/jutsus.ts
│     ├─ effets/{index,outils,feu,eau,foudre,vent,terre,chakra,ninjutsu,genjutsu}.ts
│     ├─ effets/rasengan.ts          scène Three.js
│     └─ i18n/{fr.ts,en.ts}
└─ tests/
   ├─ unitaires/…  └─ e2e/fumee.spec.ts
```

---

### Task 1 : Squelette du dépôt et règle d'architecture

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`,
  `eslint.config.js`, `.prettierrc`, `.gitignore`, `.gitattributes`,
  `.github/workflows/ci.yml`, `index.html` (vide, remplie en Tâche 13)
- Test: `tests/unitaires/architecture.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces: les scripts npm `dev`, `build`, `test`, `test:e2e`, `lint`, `typecheck`.

- [ ] **Step 1 : `git init`, puis écrire le test d'architecture qui échoue**

```ts
// tests/unitaires/architecture.test.ts
import { ESLint } from "eslint";

test("un import de moteur/ vers packs/ est refusé", async () => {
  const eslint = new ESLint({ overrideConfigFile: "eslint.config.js" });
  const [resultat] = await eslint.lintText(
    `import { JUTSUS } from "../../packs/naruto/donnees/jutsus";\nexport const x = JUTSUS;\n`,
    { filePath: "src/moteur/grammaire/interdit.ts" }
  );
  expect(resultat.errorCount).toBeGreaterThan(0);
  expect(JSON.stringify(resultat.messages)).toMatch(/no-restricted-imports/);
});

test("un import de packs/ vers moteur/ est autorisé", async () => {
  const eslint = new ESLint({ overrideConfigFile: "eslint.config.js" });
  const [resultat] = await eslint.lintText(
    `import type { Jeton } from "../../moteur/types";\nexport type J = Jeton;\n`,
    { filePath: "src/packs/naruto/donnees/signes.ts" }
  );
  expect(resultat.errorCount).toBe(0);
});
```

- [ ] **Step 2 : lancer et vérifier l'échec**

Run: `npm test -- architecture`
Expected: FAIL — `eslint.config.js` n'existe pas.

- [ ] **Step 3 : écrire les fichiers d'outillage**

`package.json` : `"type": "module"`, versions exactes (pas de `^`) pour
`onnxruntime-web@1.29.0`, `three@0.186.1`, `@mediapipe/tasks-vision`.
`tsconfig.json` : `strict`, `noUncheckedIndexedAccess`, `moduleResolution: "bundler"`.
`eslint.config.js` : règle `no-restricted-imports` avec un `patterns` qui refuse
`**/packs/**` dans les fichiers sous `src/moteur/`, via un bloc `files: ["src/moteur/**"]`.
`.gitattributes` : `*.onnx filter=lfs diff=lfs merge=lfs -text` et idem `*.tflite`.
`.gitignore` : `node_modules/`, `dist/`, `.superpowers/`, `test-results/`,
`playwright-report/`.
`ci.yml` : `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, avec
`lfs: true` sur `actions/checkout`.

- [ ] **Step 4 : lancer et vérifier le succès**

Run: `npm run lint && npm run typecheck && npm test -- architecture`
Expected: PASS, 2 tests.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "Squelette du dépôt : TypeScript strict, Vite, Vitest, ESLint, CI

La règle qui interdit à moteur/ d'importer packs/ est vérifiée par un test."
```

---

### Task 2 : Les types du moteur

**Files:**
- Create: `src/moteur/types.ts`
- Test: `tests/unitaires/types.test-d.ts`

**Interfaces:**
- Produces: `Jeton` (alias de `string`, restreint par pack), `Detection`,
  `Technique`, `ContexteEffet`, `Effet`, `MomentEffet`, `Langue`, `Pack`.

- [ ] **Step 1 : écrire les tests de types qui échouent**

Avec `expectTypeOf` de Vitest. Assertions à écrire :
- `Technique` exige `id`, `signes: readonly Jeton[]`, `effet: string` ; `variante` et
  `tenir` sont optionnels.
- `Effet` exige `duree: number` et accepte les quatre moments optionnels
  (`fond`, `derriere`, `personne`, `devant`) plus `depart`.
- `Pack["techniques"]` est `readonly Technique[]`.
- Une `Technique` sans `id` ne compile pas.

- [ ] **Step 2 : lancer et vérifier l'échec**

Run: `npm test -- types` · Expected: FAIL — `src/moteur/types.ts` introuvable.

- [ ] **Step 3 : écrire `src/moteur/types.ts`**

Signatures à poser, reprises de la source (`js/effets/index.js` en-tête pour le contrat
d'effet, `js/donnees.js` pour la technique) :

```ts
export type Langue = "fr" | "en";
export interface Detection<J extends string = string> {
  jeton: J; score: number; boite: { x1: number; y1: number; x2: number; y2: number };
}
export interface Technique<J extends string = string> {
  id: string; type: string; kanji: string; romaji: string;
  signes: readonly J[]; variante?: readonly J[]; tenir?: boolean;
  effet: string; source: "anime" | "appli";
}
export type MomentEffet = "fond" | "derriere" | "personne" | "devant";
```

`ContexteEffet` porte exactement les champs que `contexte()` construit en
`js/main.js:177-185` : `temps, dt, t, l, h, main {x,y,r}, video, personne?, couverture,
dessinerCadre, secouer, jouer`. `Effet` déclare `duree`, `son`, `depart?`, les quatre
moments, et les options `silhouette?`, `genjutsu?`, `rasengan3d?`, `sonDepart?`.

- [ ] **Step 4 : vérifier**

Run: `npm run typecheck && npm test -- types` · Expected: PASS

- [ ] **Step 5 : commit**

```bash
git add src/moteur/types.ts tests/unitaires/types.test-d.ts
git commit -m "Types du moteur : jeton, détection, technique, contrat d'effet"
```

---

### Task 3 : La grammaire (jetons → technique)

Le cœur du projet, et de la logique pure : c'est la tâche qui mérite le plus de tests.
Source : `js/sequence.js` (118 lignes). Comportement **identique**.

**Files:**
- Create: `src/moteur/grammaire/sequence.ts`
- Test: `tests/unitaires/sequence.test.ts`

**Interfaces:**
- Consumes: `Technique`, `Detection` (Tâche 2).
- Produces:
  `class Sequence<J extends string>` avec
  `constructor(techniques: readonly Technique<J>[], reglages?: Partial<Reglages>)`,
  `ajouter(d: Detection<J> | null, maintenant: number): J | null`,
  `vider(): void`,
  `techniqueTerminee(): { technique: Technique<J>; attendre: boolean } | null`,
  `jetonTenu(maintenant: number): { technique: Technique<J>; part: number } | null`,
  `progression(t: Technique<J>): { fait: number; total: number; prochain: J | undefined }`,
  `enCours(nombre?: number): Array<{ technique; fait; total; prochain }>`,
  et `historique: readonly J[]`.
  `interface Reglages { seuil: number; confirmations: number; oubli: number; tenir: number; attente: number }`
  avec les défauts `0.6 / 2 / 4000 / 2500 / 1500`.

- [ ] **Step 1 : écrire la suite de tests qui échoue**

Un jeu de techniques de test minimal, plus les cas réels. Tests à écrire :

- `une détection sous le seuil est ignorée` — score `0.59` → `ajouter` renvoie `null`.
- `un jeton n'est validé qu'à la deuxième image` — deux appels identiques, le premier
  renvoie `null`, le second le jeton.
- `le même jeton tenu n'est pas ajouté deux fois` — trois appels, un seul jeton rendu.
- `le même jeton deux fois de suite n'entre pas dans l'historique` — reproduit la garde
  de `js/sequence.js` : `detection.signe === dernier` → `null`.
- `l'historique est vidé après 4000 ms sans jeton`.
- `une séquence complète déclenche la technique`.
- `la variante déclenche aussi la technique`.
- `la technique la plus longue gagne quand deux correspondent`.
- `attendre vaut true quand la séquence est le préfixe d'une plus longue` — le cas réel
  Rasengan `["mains","tigre"]` / Rasenshuriken `["mains","tigre","oiseau"]`.
- `jetonTenu renvoie part = 0 puis 1 après 2500 ms`.
- `jetonTenu ne renvoie rien si l'historique contient plus d'un jeton`.
- `progression donne fait, total et le prochain jeton`.
- `enCours trie les techniques entamées par avancement décroissant`.
- `l'historique est plafonné à 60 jetons`.

- [ ] **Step 2 : lancer et vérifier l'échec**

Run: `npm test -- sequence` · Expected: FAIL — module introuvable.

- [ ] **Step 3 : porter `js/sequence.js` en TypeScript**

Traduction directe. Les trois fonctions internes (`enchainements`, `avancement`) et la
classe gardent leur logique à l'identique ; seuls les noms `jutsu` → `technique` et
`signe` → `jeton` changent. Les constantes deviennent le paramètre `reglages`.

- [ ] **Step 4 : vérifier**

Run: `npm test -- sequence` · Expected: PASS, 14 tests.

- [ ] **Step 5 : commit**

```bash
git add src/moteur/grammaire tests/unitaires/sequence.test.ts
git commit -m "Grammaire : portage de Sequence en TypeScript, comportement identique"
```

---

### Task 4 : Les données du pack et le test d'intégrité

**Files:**
- Create: `src/packs/naruto/donnees/signes.ts`, `src/packs/naruto/donnees/jutsus.ts`
- Test: `tests/unitaires/donnees-naruto.test.ts`

**Interfaces:**
- Consumes: `Technique` (Tâche 2).
- Produces: `type SigneNaruto` (union fermée des 14 clés), `SIGNES`, `CLASSES`,
  `SIGNE_KAI`, `FAMILLES`, `JUTSUS: readonly Technique<SigneNaruto>[]`,
  `type EffetNaruto` (union fermée des noms d'effets).

- [ ] **Step 1 : écrire le test d'intégrité qui échoue**

Ce test est le filet de tout le projet. Assertions :

- `il y a 52 jutsus et 14 signes`.
- `chaque jutsu n'utilise que des signes connus` — y compris dans `variante`.
- `aucun jutsu n'a de séquence vide`.
- `chaque identifiant de jutsu est unique`.
- `chaque jutsu à tenir n'a qu'un seul signe`.
- `aucune séquence n'est strictement identique à celle d'un autre jutsu` — sinon l'un
  des deux est inatteignable.
- `CLASSES a 15 entrées et l'indice 13 est null` — l'ordre des classes du modèle YOLOX.
- `chaque signe de CLASSES non nul existe dans SIGNES`.
- `SIGNE_KAI est un signe connu`.
- `chaque type de jutsu a une famille dans FAMILLES`.

- [ ] **Step 2 : lancer et vérifier l'échec**

Run: `npm test -- donnees-naruto` · Expected: FAIL — modules introuvables.

- [ ] **Step 3 : porter `js/donnees.js`**

Copie fidèle des 52 jutsus et 14 signes, **sans changer une valeur**. `SigneNaruto`
est dérivé de `SIGNES` par `keyof typeof SIGNES`. Les en-têtes de commentaire sont
réécrits sans le nom civil ; la note sur l'origine des données (Narutopedia,
`jutsu.csv`) est conservée, c'est une mention de source.

- [ ] **Step 4 : vérifier**

Run: `npm test -- donnees-naruto` · Expected: PASS, 10 tests.

- [ ] **Step 5 : commit**

```bash
git add src/packs/naruto/donnees tests/unitaires/donnees-naruto.test.ts
git commit -m "Pack Naruto : 14 signes et 52 jutsus typés, avec test d'intégrité"
```

---

### Task 5 : Le reconnaisseur YOLOX

**Files:**
- Create: `src/moteur/entree/reconnaisseur.ts` (interface),
  `src/packs/naruto/entree/pretraitement.ts` (pur),
  `src/packs/naruto/entree/detecteurSignes.ts`
- Test: `tests/unitaires/pretraitement.test.ts`

**Interfaces:**
- Consumes: `Detection`, `CLASSES`, `SigneNaruto`.
- Produces: `interface Reconnaisseur<J>` avec `charger(url: string): Promise<void>` et
  `reconnaitre(image, largeur, hauteur): Promise<Detection<J> | null>` ;
  `enPlansBGR(pixels: Uint8ClampedArray, taille: number, sortie: Float32Array): void` ;
  `meilleureDetection(donnees: Float32Array, lignes: number, ratio: number, classes): Detection | null` ;
  `class DetecteurDeSignes implements Reconnaisseur<SigneNaruto>`.

Le découpage sort les deux parties calculables de la partie qui exige le modèle.

- [ ] **Step 1 : écrire les tests qui échouent**

- `enPlansBGR sépare les plans dans l'ordre bleu, vert, rouge` — un damier RVBA de 2×2
  connu, on vérifie les trois plans de la `Float32Array`, valeurs de 0 à 255 non
  normalisées (le modèle a été entraîné sur des images OpenCV).
- `meilleureDetection garde la détection au meilleur score`.
- `meilleureDetection ignore la classe 13 (Unknown)` — `CLASSES[13]` vaut `null`.
- `meilleureDetection remet la boîte à l'échelle de la vidéo` — ratio `0.5` → les
  coordonnées doublent.
- `meilleureDetection renvoie null si aucune ligne n'est exploitable`.
- `charger propage une erreur lisible si le modèle est introuvable` — **Review Focus 2** :
  `charger("/modeles/absent.onnx")` rejette avec un message contenant `modèle`, pas une
  erreur brute d'onnxruntime.

- [ ] **Step 2 : lancer et vérifier l'échec**

Run: `npm test -- pretraitement` · Expected: FAIL

- [ ] **Step 3 : porter `js/detection.js`**

La logique de `detecter()` est découpée : préparation du carré gris 416×416 (fond
`rgb(114,114,114)`, image en haut à gauche, sans déformation) dans le détecteur,
conversion des plans et lecture des lignes `[lot, classe, score, x1, y1, x2, y2]` dans
les deux fonctions pures. `ort` devient un import npm, plus une globale.

- [ ] **Step 4 : vérifier**

Run: `npm test -- pretraitement` · Expected: PASS, 6 tests.

- [ ] **Step 5 : commit**

```bash
git add src/moteur/entree/reconnaisseur.ts src/packs/naruto/entree tests/unitaires/pretraitement.test.ts
git commit -m "Reconnaisseur YOLOX typé, prétraitement sorti en fonctions pures testées"
```

---

### Task 6 : Le contrat d'effet et la classe Effets

**Files:**
- Create: `src/moteur/rendu/effets.ts`
- Test: `tests/unitaires/effets.test.ts`

**Interfaces:**
- Consumes: `Effet`, `ContexteEffet`, `MomentEffet`.
- Produces: `class Effets` avec `lancer(nom, e): Effet | null`, `besoinSilhouette()`,
  `genjutsuActif()`, `rompreGenjutsu(e)`, `appeler(moment, ctx, e): boolean`,
  `avancer(dt, temps)`, `dessinerParticules(ctx)`, `actifs: readonly EffetActif[]`.
  Le dictionnaire d'effets est **injecté au constructeur** (c'est ce qui rend la classe
  générique et utilisable par un autre pack).

- [ ] **Step 1 : écrire les tests qui échouent**

Avec des effets factices qui notent leurs appels :

- `lancer renvoie la définition et met l'effet dans actifs`.
- `lancer un nom inconnu renvoie null sans jeter`.
- `depart est appelé une fois au lancement`.
- `appeler n'invoque que le moment demandé`.
- `appeler renvoie true si un effet a dessiné la personne`.
- `avancer retire les effets expirés` — après `duree * 1000` ms.
- `besoinSilhouette est vrai seulement si un effet actif la demande`.
- `rompreGenjutsu termine les genjutsus et lance l'effet kai`.
- `e.t est le temps écoulé en secondes depuis le début de l'effet`.

- [ ] **Step 2 : lancer et vérifier l'échec** — Run: `npm test -- effets`

- [ ] **Step 3 : porter `js/effets/index.js`**

Portage direct. Seul changement : `EFFETS` n'est plus un import figé mais un paramètre
du constructeur.

- [ ] **Step 4 : vérifier** — Run: `npm test -- effets` · Expected: PASS, 9 tests.

- [ ] **Step 5 : commit**

```bash
git add src/moteur/rendu/effets.ts tests/unitaires/effets.test.ts
git commit -m "Contrat d'effet et classe Effets : dictionnaire injecté, moteur générique"
```

---

### Task 7 : Portage des 52 effets

Mécanique mais volumineux (~1 100 lignes). Le gate est un test qui les exécute tous.

**Files:**
- Create: `src/packs/naruto/effets/{outils,feu,eau,foudre,vent,terre,chakra,ninjutsu,genjutsu,index}.ts`,
  `src/packs/naruto/effets/rasengan.ts`
- Test: `tests/unitaires/effets-naruto.test.ts`

**Interfaces:**
- Consumes: `Effet`, `ContexteEffet` ; `Effets` (Tâche 6) ; `JUTSUS` (Tâche 4).
- Produces: `EFFETS_NARUTO: Record<EffetNaruto, Effet>`, `class Rasengan3D`.

- [ ] **Step 1 : écrire le test de bout en bout des 52 effets, qui échoue**

Le test le plus rentable du plan :

- `chaque effet référencé par un jutsu existe dans EFFETS_NARUTO` — ferme la boucle
  avec la Tâche 4.
- `les 52 effets se lancent et tournent 60 images sans jeter` — pour chaque nom, un
  `OffscreenCanvas` 640×480, `lancer()` puis 60 appels aux quatre moments avec un
  contexte factice (`main`, `video` et `personne` remplacés par un canvas uni).
  Vérifie aussi qu'aucun ne produit `NaN` dans ses particules.
- `aucun effet n'a une durée nulle ou négative`.
- `chaque effet qui déclare rasengan3d a bien un son`.

- [ ] **Step 2 : lancer et vérifier l'échec** — Run: `npm test -- effets-naruto`

- [ ] **Step 3 : porter les neuf fichiers d'effets et `rasengan.js`**

Traduction fichier par fichier, en gardant les noms et les constantes. `three` devient
un import npm. Les emoji restent tels quels : **leur remplacement est le plan 5**, ce
plan ne change aucun comportement.

- [ ] **Step 4 : vérifier** — Run: `npm test -- effets-naruto` · Expected: PASS, 55 assertions.

- [ ] **Step 5 : commit**

```bash
git add src/packs/naruto/effets tests/unitaires/effets-naruto.test.ts
git commit -m "Portage des 52 effets et de la scène 3D du Rasengan

Un test lance chaque effet sur 60 images pour garantir qu'aucun ne jette."
```

---

### Task 8 : Le cadrage et la boucle de rendu

**Files:**
- Create: `src/moteur/rendu/cadre.ts`, `src/moteur/rendu/boucle.ts`
- Test: `tests/unitaires/cadre.test.ts`

**Interfaces:**
- Produces:
  `calculerCadre(fenetre: {l,h}, video: {largeur,hauteur}, pixels: number): Cadre` (pur),
  `versEcran(cadre: Cadre, video: {largeur}, deFace: boolean, x, y): {x,y}` (pur),
  `dessinerCadre(ctx, cadre, image, deFace, decalage?, zoom?): void`,
  `class BoucleDeRendu` avec `demarrer()`, `arreter()`, `surImage(cb)`.

- [ ] **Step 1 : écrire les tests qui échouent**

- `le cadre couvre la fenêtre en conservant le rapport` — vidéo 1280×720 dans une
  fenêtre 800×600 : l'échelle est `Math.max(800/1280, 600/720)`, la vidéo déborde.
- `le cadre est centré` — `x` et `y` sont négatifs ou nuls, symétriques.
- **Review Focus 3** : `une vidéo de taille 0 renvoie un cadre neutre` —
  `calculerCadre({l:800,h:600},{largeur:0,hauteur:0},1)` ne produit **aucun NaN** et
  renvoie `echelle: 1`.
- `versEcran inverse l'axe X en caméra frontale` et `ne l'inverse pas de dos`.
- **Review Focus 5** : `un changement de taille de vidéo recalcule l'échelle` — deux
  appels successifs avec des dimensions différentes donnent deux cadres cohérents.
- `la densité de pixels multiplie la taille du canvas sans changer les coordonnées CSS`.

- [ ] **Step 2 : lancer et vérifier l'échec** — Run: `npm test -- cadre`

- [ ] **Step 3 : porter `js/main.js:119-217`**

Les maths de `calculerCadre`, `dessinerCadre` et `versEcran` sortent en fonctions pures
prenant le cadre en paramètre au lieu de lire un état de module. `BoucleDeRendu`
encapsule le `requestAnimationFrame`, le `dt` plafonné à `0.05`, la secousse et l'ordre
de composition (vidéo → fond → derrière → personne → devant → particules).

Ajout pour la Review Focus 3 : si `video.largeur` ou `video.hauteur` vaut 0, renvoyer
le cadre neutre sans diviser.

- [ ] **Step 4 : vérifier** — Run: `npm test -- cadre` · Expected: PASS, 7 tests.

- [ ] **Step 5 : commit**

```bash
git add src/moteur/rendu tests/unitaires/cadre.test.ts
git commit -m "Cadrage sorti en fonctions pures et boucle de rendu isolée

Un cadre neutre est renvoyé tant que la vidéo n'a pas de dimensions."
```

---

### Task 9 : Silhouette, son et journal

Trois portages à faible logique, regroupés : aucun ne justifie son propre gate.

**Files:**
- Create: `src/moteur/silhouette/silhouette.ts`, `src/moteur/son/son.ts`,
  `src/moteur/debug/journal.ts`
- Test: `tests/unitaires/son.test.ts`, `tests/unitaires/journal.test.ts`

**Interfaces:**
- Produces: `class Silhouette` (`charger(delegue: "CPU"|"GPU")`, `pret`, `enChargement`,
  `decouper(video, temps)`, `couverture(video)`) ; `activerSon()`, `couperSon(oui)`,
  `jouer(nom, ...options)`, `crier(technique)` ; `noter(type, texte)`,
  `texteDuJournal()`, `viderJournal()`, `memoire()`, `battre(etat)`,
  `demarrerJournal()`, `surveillerWebGL(canvas, nom)`.

- [ ] **Step 1 : écrire les tests qui échouent**

- `jouer sur un nom inconnu ne jette pas`.
- `couperSon(true) empêche toute lecture` — avec un `AudioContext` espionné.
- `le son est silencieux tant que activerSon n'a pas été appelé` — règle des navigateurs :
  pas de son sans geste utilisateur.
- `le journal garde les entrées entre deux chargements` — `localStorage` simulé.
- `le journal se tronque au-delà de sa limite`.
- `noter ne jette pas si localStorage est indisponible` — `setItem` qui lance.

- [ ] **Step 2 : lancer et vérifier l'échec** — Run: `npm test -- son journal`

- [ ] **Step 3 : porter `js/silhouette.js`, `js/son.js`, `js/journal.js`**

`@mediapipe/tasks-vision` devient un import npm. Le reste est une traduction directe.

- [ ] **Step 4 : vérifier** — Run: `npm test -- son journal` · Expected: PASS, 6 tests.

- [ ] **Step 5 : commit**

```bash
git add src/moteur/silhouette src/moteur/son src/moteur/debug tests/unitaires/son.test.ts tests/unitaires/journal.test.ts
git commit -m "Portage du détourage, du son et du journal de bord"
```

---

### Task 10 : Internationalisation

**Files:**
- Create: `src/moteur/ui/i18n.ts`, `src/packs/naruto/i18n/fr.ts`,
  `src/packs/naruto/i18n/en.ts`
- Test: `tests/unitaires/i18n.test.ts`

**Interfaces:**
- Produces: `type Cle = keyof typeof fr` ; `t(cle: Cle, valeurs?: Record<string,string|number>): string` ;
  `langue(): Langue` ; `changerLangue(l: Langue): void`. Détection initiale sur
  `navigator.language`, repli `fr`.

- [ ] **Step 1 : écrire les tests qui échouent**

- `les dictionnaires fr et en ont exactement les mêmes clés` — le test qui empêche la
  dérive.
- `aucune valeur n'est vide`.
- `t interpole les valeurs nommées` — `t("decouverts", {n: 3, total: 52})`.
- `t renvoie la clé si la traduction manque, sans jeter`.
- `la langue par défaut est le français quand navigator.language est inconnu`.
- `les noms japonais ne sont pas traduits` — les clés `kanji` et `romaji` d'un même
  jutsu sont identiques en fr et en.

- [ ] **Step 2 : lancer et vérifier l'échec** — Run: `npm test -- i18n`

- [ ] **Step 3 : écrire le module et les deux dictionnaires**

Les chaînes viennent de `index.html` et des `message(...)` de `js/main.js`. Les
descriptions des 52 jutsus et des 14 positions de signes entrent dans les dictionnaires ;
`kanji` et `romaji` restent dans les données (Tâche 4), pas dans l'i18n.

- [ ] **Step 4 : vérifier** — Run: `npm test -- i18n` · Expected: PASS, 6 tests.

- [ ] **Step 5 : commit**

```bash
git add src/moteur/ui/i18n.ts src/packs/naruto/i18n tests/unitaires/i18n.test.ts
git commit -m "Internationalisation français / anglais, avec test de parité des clés"
```

---

### Task 11 : Caméra et écrans

**Files:**
- Create: `src/moteur/entree/camera.ts`, `src/moteur/entree/boucle.ts`,
  `src/moteur/ui/encyclopedie.ts`, `src/app/ecrans.ts`
- Test: `tests/unitaires/camera.test.ts`

**Interfaces:**
- Consumes: `t` (Tâche 10), `Reconnaisseur` (Tâche 5), `Sequence` (Tâche 3).
- Produces: `class Camera` (`ouvrir(deFace: boolean): Promise<MediaStream>`,
  `basculer()`, `fermer()`, `deFace: boolean`) ;
  `class BoucleDeDetection` (`demarrer(cb)`, `arreter()`, `ecart: number`) ;
  `afficherSignes`, `afficherJutsus`, `LISTE_FAMILLES`, `pastille`.

- [ ] **Step 1 : écrire les tests qui échouent**

**Review Focus 1**, le plus important de la liste :

- `une permission refusée donne un message traduit` — `getUserMedia` rejette avec
  `NotAllowedError` → `Camera.ouvrir` rejette avec une erreur dont le `code` vaut
  `"permission"` et dont le message passe par `t()`.
- `l'absence de caméra donne un code distinct` — `NotFoundError` → `code: "absente"`.
- `un contexte non sécurisé est signalé` — `navigator.mediaDevices` indéfini →
  `code: "nonSecurise"`.
- `fermer arrête toutes les pistes du flux`.
- `basculer ferme l'ancien flux avant d'en ouvrir un nouveau` — **Review Focus 5**.
- `la boucle de détection respecte l'écart minimum de 80 ms`.
- `la boucle ne détecte pas quand l'onglet est caché`.

- [ ] **Step 2 : lancer et vérifier l'échec** — Run: `npm test -- camera`

- [ ] **Step 3 : porter `js/main.js:104-118, 244-262` et `js/encyclopedie.js`**

`ouvrirCamera` devient une classe qui traduit les `DOMException` de `getUserMedia` en
erreurs à code stable, au lieu de laisser remonter l'erreur brute. `ecrans.ts` regroupe
l'ouverture et la fermeture des panneaux (accueil, encyclopédie, journal) qui étaient
éparpillées dans `main.js`.

- [ ] **Step 4 : vérifier** — Run: `npm test -- camera` · Expected: PASS, 7 tests.

- [ ] **Step 5 : commit**

```bash
git add src/moteur/entree src/moteur/ui/encyclopedie.ts src/app/ecrans.ts tests/unitaires/camera.test.ts
git commit -m "Caméra, boucle de détection et écrans sortis de main.js

Les erreurs de getUserMedia deviennent des codes stables et traduits."
```

---

### Task 12 : Sauvegarde versionnée

**Files:**
- Create: `src/moteur/stockage/sauvegarde.ts`
- Test: `tests/unitaires/sauvegarde.test.ts`

**Interfaces:**
- Produces: `interface Sauvegarde { version: number; photos; compteurs; decouverts; langue }` ;
  `charger(): Sauvegarde` ; `enregistrer(s: Sauvegarde): void` ;
  `migrer(brut: unknown): Sauvegarde`. Clé unique `kata.v1`.

- [ ] **Step 1 : écrire les tests qui échouent**

- `une sauvegarde absente donne les valeurs par défaut`.
- **La migration des clés existantes** : `ninjutsu-photos`, `ninjutsu-compteurs` et
  `ninjutsu-decouverts` présentes → elles sont reprises dans `kata.v1` et les anciennes
  clés sont supprimées.
- `une sauvegarde d'une version future n'écrase pas les valeurs par défaut`.
- `du JSON invalide ne jette pas et donne les valeurs par défaut`.
- **Review Focus 4** : `localStorage indisponible` — `getItem` et `setItem` qui lancent
  (navigation privée, quota plein) → `charger()` renvoie les défauts et `enregistrer()`
  ne jette pas.

- [ ] **Step 2 : lancer et vérifier l'échec** — Run: `npm test -- sauvegarde`

- [ ] **Step 3 : écrire le module**

Remplace les fonctions `lire`/`ecrire` de `js/main.js:83-101`, en conservant leur
protection par try/catch. Une seule clé versionnée au lieu de trois, pour que les plans
suivants (progression, fiche ninja) puissent étendre le schéma proprement.

- [ ] **Step 4 : vérifier** — Run: `npm test -- sauvegarde` · Expected: PASS, 5 tests.

- [ ] **Step 5 : commit**

```bash
git add src/moteur/stockage tests/unitaires/sauvegarde.test.ts
git commit -m "Sauvegarde versionnée, avec migration des anciennes clés ninjutsu-*"
```

---

### Task 13 : Le manifeste, le câblage et le test de fumée

La tâche qui rend le tout exécutable.

**Files:**
- Create: `src/packs/naruto/manifeste.ts`, `src/app/main.ts`, `index.html`,
  `tests/e2e/fumee.spec.ts`, `playwright.config.ts`
- Copy: `public/modeles/*` depuis la source (via Git LFS)

**Interfaces:**
- Consumes: tout ce qui précède.
- Produces: `PACK_NARUTO: Pack<SigneNaruto>`, et une application qui démarre.

- [ ] **Step 1 : écrire le test de fumée qui échoue**

```ts
// tests/e2e/fumee.spec.ts — Chromium lancé avec --use-fake-device-for-media-stream
test("le dojo démarre, charge le modèle et dessine", async ({ page }) => {
  const erreurs: string[] = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: /caméra|camera/i }).click();
  await expect(page.locator("#scene")).toBeVisible();
  await page.waitForFunction(() => (window as any).kata?.pret === true, { timeout: 30_000 });
  expect(erreurs).toEqual([]);
});

test("l'encyclopédie liste les 14 signes et les 52 jutsus", async ({ page }) => { /* … */ });
test("la page bascule en anglais", async ({ page }) => { /* … */ });
```

- [ ] **Step 2 : lancer et vérifier l'échec**

Run: `npm run test:e2e` · Expected: FAIL — pas d'`index.html`.

- [ ] **Step 3 : écrire le manifeste, `main.ts` et `index.html`**

`manifeste.ts` assemble `SIGNES`, `JUTSUS`, `EFFETS_NARUTO`, le reconnaisseur et les
dictionnaires. `main.ts` instancie le moteur avec ce manifeste et branche les boutons ;
il expose `window.kata = { pret }` pour le test. `index.html` est repris de la source,
sans la barre « retour aux exercices », sans l'`importmap` ni les `<script>` CDN (tout
est bundlé), avec les textes passés par `data-i18n`.

- [ ] **Step 4 : vérifier**

Run: `npm run build && npm run test:e2e` · Expected: PASS, 3 tests.
Puis lancer `npm run dev` et vérifier à la main qu'un Gōkakyū part comme avant.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "Manifeste du pack Naruto, câblage de l'application et test de fumée

L'application fait de nouveau exactement ce que faisait la version d'origine."
```

---

### Task 14 : Documents du dépôt et garde anti-nom civil

**Files:**
- Create: `CLAUDE.md`, `LICENSE`, `CONTRIBUTING.md`, `README.md`,
  `src/packs/naruto/README.md`
- Test: `tests/unitaires/depot.test.ts`

**Interfaces:**
- Consumes: rien.

- [ ] **Step 1 : écrire la garde qui échoue**

- `aucun fichier versionné ne contient le nom civil ni la mention universitaire` —
  parcourt la sortie de `git ls-files` et cherche, sans tenir compte de la casse :
  la liste des chaînes interdites. Échoue en nommant les fichiers fautifs. Le test
  s'exclut lui-même, puisqu'il est le seul fichier qui a le droit de les épeler.
- `aucun message de commit de la branche ne contient Co-Authored-By ni claude.com`.
- `chaque dépendance de package.json est épinglée à une version exacte`.
- `.gitattributes déclare les modèles en LFS`.

- [ ] **Step 2 : lancer et vérifier l'échec**

Run: `npm test -- depot`
Expected: FAIL — les en-têtes portés aux tâches 3 à 9 contiennent encore la mention.

- [ ] **Step 3 : nettoyer les en-têtes et écrire les documents**

Repasser sur tous les fichiers portés. `README.md` racine reste **minimal** à ce stade
(titre, à quoi ça sert, comment lancer) : le README animé est le plan 6.
`CLAUDE.md` contient : français dans le code, la règle `moteur/ → packs/`, comment
ajouter un jutsu, les commandes de test, l'interdiction du nom civil et de toute
attribution Claude dans les commits. `LICENSE` est MIT, avec la mention que Naruto
appartient à Masashi Kishimoto / Shueisha et que le projet est un travail de fan non
officiel. Les crédits du modèle de détection (MIT) et de MediaPipe (Apache 2.0) sont
conservés.

- [ ] **Step 4 : vérifier**

Run: `npm run lint && npm run typecheck && npm test && npm run test:e2e`
Expected: PASS sur toute la suite.

- [ ] **Step 5 : commit et première poussée**

```bash
git add -A
git commit -m "Documents du dépôt et nettoyage des en-têtes

Un test refuse désormais toute réapparition du nom civil ou de la mention scolaire."
git branch -M main
```

---

## Les plans suivants

Chacun produit du logiciel qui marche seul, et s'appuie sur celui-ci.

| Plan | Contenu | Dépend de |
| --- | --- | --- |
| **2 — Lecture du corps** | **le banc de rejeu d'abord** (§11 : obligatoire, sans lui aucun geste n'est réglable), puis Pose Landmarker, deux postures, jetons corporels, règle à paliers des signes tenus, taijutsu, armes (§7.4, §7.6, §7.7, §8) | 1 |
| **3 — Arcade** | couche `scene/`, ennemis, vagues, dégâts à l'impact, ralenti, boss (§7.8, §9.2, §9.5–9.7) | 1, 2 |
| **4 — Progression** | grades, examens, fiche ninja, contrats, déblocages, cosmétiques (§9.8–9.12) | 3 |
| **5 — Contenu et assets** | 14 signes SVG, silhouettes d'encre, refonte des créatures emoji, nouveaux jutsus (§9.13, §9.14, §10.2) | 3 |
| **6 — Finition** | READMEs animés, démo en ligne, enregistreur de clip, calibration, chrono du Dojo (§6, §10.3–10.5, §12) | 5 |
