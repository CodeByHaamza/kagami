# Kagami — Plan 2 : la lecture du corps

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le corps devient une manette : tu frappes, tu gardes, tu esquives, tu lances —
et former des sceaux redevient un choix risqué, comme dans l'œuvre.

**Architecture:** Un second flux d'entrée (MediaPipe Pose Landmarker, 33 points) à côté
du reconnaisseur de signes. Une machine à deux postures arbitre lequel des deux écoute.
La grammaire existante travaille déjà sur des **jetons** : les gestes du corps en
deviennent un second alphabet, sans la rouvrir. Tout se teste sur des points rejoués.

**Tech Stack:** TypeScript strict · `@mediapipe/tasks-vision` (PoseLandmarker) · Vitest ·
Playwright — aucune dépendance nouvelle.

**Spec:** [`docs/superpowers/specs/2026-10-24-moteur-anime-webcam-design.md`](../specs/2026-10-24-moteur-anime-webcam-design.md)
(§7.4 les entrées, §7.5 le partage du temps, §7.6 la grammaire, §7.7 les deux postures,
§8 le corps comme manette)

**Plan précédent :** [plan 1](2026-10-24-01-extraction-moteur-kata.md), terminé.

## Global Constraints

- **Les conventions de [`CLAUDE.md`](../../../CLAUDE.md) s'appliquent** : français dans le
  code, `moteur/` n'importe jamais rien de `packs/`, aucune chaîne visible en dur,
  parité des clés fr/en, aucune attribution Claude dans les commits.
- **Aucun réglage de détection existant ne bouge** : seuil `0.6`, deux confirmations,
  oubli `4000`, tenue `2500`, attente `1500`, écart `80`. Les nouveaux seuils de gestes
  sont des constantes nommées et documentées, réglables sans toucher au code appelant.
- **Rien ne se règle à l'œil.** Le propriétaire n'a pas forcément une caméra sous la main
  quand ce plan s'exécute : **tout doit se tester sur des points de posture synthétiques
  ou rejoués**. Un seuil qui ne peut être validé que devant une webcam est livré avec sa
  valeur par défaut, son unité, et une ligne disant comment le régler au banc de rejeu.
- **Le pack Kata reste jouable à chaque commit.** Le taijutsu s'ajoute à côté des signes,
  il ne les remplace pas.
- **Budget d'inférence** : le lecteur de posture est prioritaire (viser 20–30 Hz), le
  reconnaisseur de signes ne tourne **qu'en posture de concentration**.

## Review Focus

Cinq cas que la spec implique, qu'aucune tâche n'exerce spontanément, et qui gâcheraient
l'expérience. Chacun reçoit son test dans la tâche propriétaire.

1. **Le modèle de posture ne charge pas** (14 Mo, réseau coupé, WebGL indisponible).
   L'appli doit rester jouable aux signes seuls, en le disant une fois, pas en boucle. →
   Tâche 3.
2. **Personne devant la caméra, ou corps partiellement hors cadre.** Les points arrivent
   avec une visibilité faible ; aucun geste ne doit se déclencher sur du bruit, et la
   posture ne doit pas osciller. → Tâches 4 et 5.
3. **Un geste brusque de la vie courante** — se gratter, boire, régler sa chaise — ne
   doit pas lancer un taijutsu. C'est le faux positif qui rend un jeu de gestes
   insupportable. → Tâche 5.
4. **La bascule entre postures en pleine incantation.** Lever les mains pour se défendre
   au milieu d'un enchaînement de six signes doit annuler proprement, pas laisser la
   grammaire dans un état bâtard. → Tâche 6.
5. **Deux techniques armées à la suite, trop vite.** Lancer deux kunai en une seconde,
   ou enchaîner un combo sans fenêtre de reset, ne doit ni dupliquer ni bloquer. →
   Tâche 8.

---

## Structure des fichiers

```text
src/moteur/
├─ rejeu/
│  ├─ enregistreur.ts        capte une session (jetons + posture + horodatage)
│  ├─ lecteur.ts             rejoue une session, à la place de la caméra
│  └─ format.ts              le type d'une session, et sa (dé)sérialisation
├─ corps/
│  ├─ posture.ts             LecteurDePosture : MediaPipe → 33 points normalisés
│  ├─ reperes.ts             les mesures pures tirées des points (pur, testable)
│  ├─ postures.ts            la machine à deux états, avec hystérésis
│  └─ gestes.ts              points → jetons corporels (frappe, garde, lancer…)
├─ grammaire/
│  └─ sequence.ts            MODIFIÉ : paliers de tenue, mode « cadence »
└─ entree/
   └─ ordonnanceur.ts        qui tourne quand, selon la posture

src/packs/naruto/
├─ donnees/taijutsu.ts       les techniques au corps, en jetons corporels
├─ donnees/armes.ts          shuriken, kunai, parchemin explosif
└─ effets/corps.ts           leurs effets

tests/unitaires/             un fichier par module ci-dessus
tests/donnees/sessions/      les sessions rejouées, versionnées
```

---

### Task 1 : Le format d'une session rejouable

Le socle : sans lui, rien de ce plan ne se teste.

**Files:**
- Create: `src/moteur/rejeu/format.ts`
- Modify: `src/moteur/types.ts` — ajouter `Point3` et `Posture`
- Test: `tests/unitaires/rejeu-format.test.ts`

**Interfaces:**
- Produces, dans `src/moteur/types.ts` (ce sont des types du moteur, pas du rejeu) :
  `interface Point3 { x: number; y: number; z: number; visibilite: number }` ;
  `interface Posture { points: readonly Point3[]; horodatage: number }`.
- Produces, dans `rejeu/format.ts` :
  `interface ImageSession { t: number; detection: Detection | null; posture: Posture | null }` ;
  `interface Session { version: number; nom: string; largeur: number; hauteur: number; images: readonly ImageSession[] }` ;
  `serialiser(s: Session): string` ; `deserialiser(texte: string): Session`.

- [ ] **Step 1 : écrire les tests qui échouent**

- `une session se sérialise et se relit à l'identique` — aller-retour sur une session de
  trois images, égalité stricte.
- `une session d'une version inconnue est refusée avec un message clair` — `version: 99`
  → l'erreur nomme la version attendue et celle trouvée.
- `du JSON invalide est refusé sans jeter d'erreur brute` — `deserialiser("{")` lance une
  `Error` dont le message parle de session, pas de `JSON.parse`.
- `une session vide est valide` — zéro image, pas d'exception.
- `les points sont arrondis à trois décimales à la sérialisation` — 33 points × 4 champs
  × des milliers d'images : la précision complète quadruple le poids pour rien.

- [ ] **Step 2 : lancer et vérifier l'échec** — `npm test -- rejeu-format` · FAIL, module introuvable.

- [ ] **Step 3 : écrire `src/moteur/rejeu/format.ts`**

`VERSION_SESSION = 1`. Le format est du JSON : lisible, diffable, et une session de
30 secondes tient en quelques centaines de kilo-octets une fois arrondie.

- [ ] **Step 4 : vérifier** — `npm test -- rejeu-format` · PASS, 5 tests.

- [ ] **Step 5 : commit**

```bash
git add src/moteur/rejeu/format.ts tests/unitaires/rejeu-format.test.ts
git commit -m "Format d'une session rejouable : jetons, posture, horodatage"
```

---

### Task 2 : Le banc de rejeu

Il remplace la caméra. C'est lui qui rend tout le reste du plan réglable sans webcam.

**Files:**
- Create: `src/moteur/rejeu/lecteur.ts`, `src/moteur/rejeu/enregistreur.ts`
- Create: `tests/donnees/sessions/synthetique.json`
- Test: `tests/unitaires/rejeu.test.ts`

**Interfaces:**
- Consumes: `Session`, `ImageSession` (Tâche 1).
- Produces:
  `class LecteurDeSession` — `constructor(session: Session, options?: { vitesse?: number })`,
  `avancer(dt: number): ImageSession[]` (les images franchies depuis le dernier appel),
  `rembobiner(): void`, `readonly fini: boolean`, `readonly position: number` ;
  `class EnregistreurDeSession` — `constructor(nom: string, largeur: number, hauteur: number)`,
  `capturer(t: number, detection, posture): void`, `terminer(): Session`,
  `readonly images: number`.

- [ ] **Step 1 : écrire les tests qui échouent**

- `avancer rend les images franchies, dans l'ordre` — une session à 0, 100, 200 ms ;
  `avancer(0.15)` rend les deux premières.
- `avancer ne rend jamais deux fois la même image`.
- `la vitesse double avance deux fois plus vite`.
- `fini passe à vrai après la dernière image`.
- `rembobiner permet de rejouer depuis le début`.
- `l'enregistreur rend une session relisible par le lecteur` — aller-retour complet :
  enregistrer trois images, sérialiser, désérialiser, rejouer, retrouver les trois.
- `l'enregistreur plafonne la durée d'une session` — au-delà de `MAX_IMAGES`, les plus
  anciennes sont oubliées, pas les récentes.

- [ ] **Step 2 : lancer et vérifier l'échec** — `npm test -- rejeu` · FAIL.

- [ ] **Step 3 : écrire les deux classes, et la session synthétique**

`tests/donnees/sessions/synthetique.json` est **fabriquée par le test lui-même** à la
première exécution si elle manque, puis versionnée : 60 images décrivant un corps au
repos, bras le long du corps. Elle sert de base neutre aux tâches 4 à 8, qui la
déforment pour fabriquer leurs gestes.

- [ ] **Step 4 : vérifier** — `npm test -- rejeu` · PASS, 7 tests.

- [ ] **Step 5 : commit**

```bash
git add src/moteur/rejeu tests/unitaires/rejeu.test.ts tests/donnees/sessions
git commit -m "Banc de rejeu : rejouer une session à la place de la caméra"
```

---

### Task 3 : Le lecteur de posture

**Files:**
- Create: `src/moteur/corps/posture.ts`
- Modify: `src/moteur/types.ts` — ajouter `LecteurDePosture`
- Test: `tests/unitaires/posture.test.ts`

**Interfaces:**
- Consumes: `Posture`, `Point3` (Tâche 1, dans `types.ts`).
- Produces:
  `interface LecteurDePosture { charger(): Promise<void>; lire(image, horodatage): Posture | null; readonly pret: boolean; readonly enEchec: boolean }` ;
  `class PostureMediaPipe implements LecteurDePosture` —
  `constructor(options?: { variante?: "lite" | "full"; fabrique?: FabriqueDePose })` ;
  `const REPERE: Readonly<Record<string, number>>` — les indices nommés des points qu'on
  utilise (`nez: 0`, `epauleG: 11`, `epauleD: 12`, `coudeG: 13`, `coudeD: 14`,
  `poignetG: 15`, `poignetD: 16`, `hancheG: 23`, `hancheD: 24`, `genouG: 25`,
  `genouD: 26`, `chevilleG: 27`, `chevilleD: 28`).

- [ ] **Step 1 : écrire les tests qui échouent**

- `lire renvoie null tant que le modèle n'est pas chargé`.
- `lire normalise les points en fraction de l'image` — un point MediaPipe à `x: 0.5`
  reste à `0.5` ; on ne multiplie pas par la largeur ici, les mesures de la tâche 4
  travaillent en fractions pour rester indépendantes de la résolution.
- **Review Focus 1** : `un échec de chargement laisse l'appli jouable` —
  `charger()` rejette, `pret` reste faux, `enEchec` passe vrai, et un second
  `charger()` **ne retente pas** (c'est le défaut relevé sur le détourage au plan 1 :
  14 Mo retéléchargés à chaque tentative).
- `l'échec porte un message qui nomme le modèle de posture`.
- `REPERE couvre les points dont les gestes ont besoin` — les treize indices existent et
  sont tous dans [0, 32].

- [ ] **Step 2 : lancer et vérifier l'échec** — `npm test -- posture` · FAIL.

- [ ] **Step 3 : écrire `posture.ts`**

`PoseLandmarker` de `@mediapipe/tasks-vision`, `runningMode: "VIDEO"`,
`delegate: "GPU"` avec repli CPU, modèle servi depuis `/modeles/pose_landmarker_lite.task`.
La fabrique est injectable, comme `DetecteurDeSignes` au plan 1 : c'est ce qui rend
l'échec testable sans télécharger le modèle.

Le fichier du modèle est ajouté à `public/modeles/` et suivi par Git LFS. S'il est
absent, le repli de la Review Focus 1 s'applique.

- [ ] **Step 4 : vérifier** — `npm test -- posture` · PASS, 5 tests.

- [ ] **Step 5 : commit**

```bash
git add src/moteur/corps/posture.ts src/moteur/types.ts tests/unitaires/posture.test.ts .gitattributes
git commit -m "Lecteur de posture : 33 points, repli propre si le modèle manque"
```

---

### Task 4 : Les mesures du corps

Le cœur calculable. Tout ce qui suit s'y appuie, et tout y est pur.

**Files:**
- Create: `src/moteur/corps/reperes.ts`
- Test: `tests/unitaires/reperes.test.ts`

**Interfaces:**
- Consumes: `Posture`, `Point3`, `REPERE` (Tâche 3).
- Produces, toutes pures, toutes en fractions de l'image :
  `largeurEpaules(p: Posture): number` — l'unité de référence du corps ;
  `mainsRapprochees(p: Posture): boolean` — poignets à moins de `SEUIL_MAINS` largeurs d'épaules ;
  `mainsHautes(p: Posture): boolean` — poignets au-dessus de la ligne des épaules ;
  `gardeHaute(p: Posture): boolean` — poignets près du visage **et** coudes serrés ;
  `extensionBras(p: Posture, cote: "g" | "d"): number` — 0 plié, 1 tendu ;
  `centreDeMasse(p: Posture): { x: number; y: number }` ;
  `immobilite(historique: readonly Posture[]): number` — 0 bouge, 1 statue ;
  `fiable(p: Posture, minimum?: number): boolean` — assez de points visibles pour décider.

- [ ] **Step 1 : écrire les tests qui échouent**

Un corps synthétique paramétrable (`corps({ poignetG: {...}, ... })`) sert de base.

- `largeurEpaules mesure la distance entre les deux épaules`.
- `mainsRapprochees est vrai quand les poignets se touchent, faux bras écartés`.
- `mainsHautes distingue les bras levés des bras le long du corps`.
- `gardeHaute exige les deux : poignets près du visage ET coudes serrés` — poignets hauts
  mais coudes écartés → faux.
- `extensionBras vaut ~1 bras tendu et ~0 bras replié`.
- `immobilite vaut 1 sur une suite de postures identiques` et `tombe quand ça bouge`.
- **Review Focus 2** : `fiable est faux quand les points clés sont peu visibles` —
  visibilité 0,2 sur les poignets → faux, et chaque mesure renvoie une valeur neutre
  plutôt que d'inventer.
- `toutes les mesures sont indépendantes de la résolution` — le même corps à deux
  échelles donne les mêmes résultats.

- [ ] **Step 2 : lancer et vérifier l'échec** — `npm test -- reperes` · FAIL.

- [ ] **Step 3 : écrire `reperes.ts`**

Toutes les distances sont divisées par `largeurEpaules` : c'est ce qui rend les seuils
valables pour un enfant comme pour un adulte, près ou loin de la caméra.

Seuils par défaut, à régler au banc de rejeu, en largeurs d'épaules :
`SEUIL_MAINS = 0.55`, `SEUIL_GARDE_VISAGE = 0.7`, `SEUIL_COUDES = 0.9`,
`VISIBILITE_MINIMALE = 0.5`.

- [ ] **Step 4 : vérifier** — `npm test -- reperes` · PASS, 8 tests.

- [ ] **Step 5 : commit**

```bash
git add src/moteur/corps/reperes.ts tests/unitaires/reperes.test.ts
git commit -m "Mesures du corps, en largeurs d'épaules : indépendantes de la distance"
```

---

### Task 5 : Les jetons corporels

**Files:**
- Create: `src/moteur/corps/gestes.ts`
- Test: `tests/unitaires/gestes.test.ts`

**Interfaces:**
- Consumes: les mesures (Tâche 4), `LecteurDeSession` (Tâche 2).
- Produces:
  `type JetonCorps = "directG" | "directD" | "crochet" | "paume" | "coupDePied" | "rotation" | "garde" | "saut" | "accroupi" | "brasCroises" | "esquiveG" | "esquiveD"` ;
  `class LecteurDeGestes` — `constructor(reglages?: Partial<ReglagesGestes>)`,
  `observer(p: Posture, maintenant: number): JetonCorps | null`,
  `readonly dernier: JetonCorps | null` ;
  `interface ReglagesGestes { vitesseFrappe: number; fenetreGeste: number; reposEntreGestes: number; visibiliteMinimale: number }`.

- [ ] **Step 1 : écrire les tests qui échouent**

Chaque geste est fabriqué comme une suite de postures interpolées, pas à la main.

- `un poignet qui accélère vers l'avant, bras qui se déplie, donne un direct`.
- `le direct distingue la gauche de la droite`.
- `une garde tenue donne le jeton garde, et une seule fois`.
- `une rotation rapide des épaules donne rotation`.
- `un saut est détecté par la montée des hanches`.
- `un déplacement latéral franc du torse donne esquiveG ou esquiveD` — l'esquive est
  détectée ici ; ce qu'on esquive appartient au plan 3.
- **Review Focus 3** : `un mouvement lent ne déclenche aucun geste` — le même
  déplacement de poignet étalé sur deux secondes au lieu de deux dixièmes → `null`.
  C'est le faux positif qui rendrait le jeu insupportable.
- **Review Focus 3 (bis)** : `un geste ne se redéclenche pas tant que le corps n'est pas
  revenu au repos` — `reposEntreGestes` empêche qu'un bras tendu immobile pulse.
- **Review Focus 2** : `aucun geste sur une posture non fiable` — visibilité faible →
  `null`, quel que soit le mouvement apparent.
- `la session synthétique au repos ne produit aucun geste sur 60 images` — le test de
  silence, celui qui attrape les seuils trop bas.

- [ ] **Step 2 : lancer et vérifier l'échec** — `npm test -- gestes` · FAIL.

- [ ] **Step 3 : écrire `gestes.ts`**

Chaque geste est une petite machine : une condition d'entrée sur les mesures, une
confirmation sur quelques images, puis un verrou jusqu'au retour au repos — le même
principe que les deux confirmations du détecteur de signes, pour la même raison.

Défauts : `vitesseFrappe = 1.8` largeurs d'épaules par seconde, `fenetreGeste = 250` ms,
`reposEntreGestes = 180` ms, `visibiliteMinimale = 0.5`.

- [ ] **Step 4 : vérifier** — `npm test -- gestes` · PASS, 9 tests.

- [ ] **Step 5 : commit**

```bash
git add src/moteur/corps/gestes.ts tests/unitaires/gestes.test.ts
git commit -m "Jetons corporels : frappe, garde, lancer, rotation, saut"
```

---

### Task 6 : Les deux postures

La mécanique centrale du plan : c'est elle qui fait hériter le jeu de la tension de l'œuvre.

**Files:**
- Create: `src/moteur/corps/postures.ts`
- Test: `tests/unitaires/postures.test.ts`

**Interfaces:**
- Consumes: les mesures (Tâche 4).
- Produces:
  `type Attitude = "concentration" | "combat" | "neutre"` ;
  `class MachineAPostures` — `constructor(reglages?: { tenue?: number })`,
  `observer(p: Posture | null, maintenant: number): Attitude`,
  `readonly courante: Attitude`, `readonly depuis: number` ;
  un rappel `surChangement(avant: Attitude, apres: Attitude): void` passé au constructeur.

  `Posture` désigne les 33 points ; `Attitude` désigne ce que le joueur est en train de
  faire. Deux choses différentes, deux noms différents.

- [ ] **Step 1 : écrire les tests qui échouent**

- `mains rapprochées devant la poitrine donne concentration`.
- `mains hautes et écartées donne combat`.
- `bras le long du corps donne neutre`.
- **Review Focus 2** : `une posture doit tenir avant de basculer` — une image isolée de
  combat au milieu de la concentration ne bascule pas ; il faut `tenue` millisecondes.
- `l'hystérésis empêche le clignotement à la frontière` — une posture oscillant juste
  autour du seuil ne produit pas plus d'un changement par `tenue`.
- `surChangement est appelé une fois par bascule, avec l'avant et l'après`.
- `une posture nulle (personne devant la caméra) tend vers neutre, sans à-coup`.

- [ ] **Step 2 : lancer et vérifier l'échec** — `npm test -- postures` · FAIL.

- [ ] **Step 3 : écrire `postures.ts`** — défaut `tenue = 220` ms.

- [ ] **Step 4 : vérifier** — `npm test -- postures` · PASS, 7 tests.

- [ ] **Step 5 : commit**

```bash
git add src/moteur/corps/postures.ts tests/unitaires/postures.test.ts
git commit -m "Machine à deux postures : concentration, combat, neutre"
```

---

### Task 7 : La grammaire apprend les paliers et la cadence

**Files:**
- Modify: `src/moteur/grammaire/sequence.ts`
- Modify: `tests/unitaires/sequence.test.ts`

**Interfaces:**
- Produces, en plus de l'existant :
  `jetonTenu(maintenant)` renvoie désormais `{ technique, part, palier } | null` avec
  `palier: "tenue" | "charge"` ;
  `interface Technique` gagne `cadence?: { nombre: number; dans: number }` — N jetons
  dans T millisecondes ;
  `techniqueTerminee()` reconnaît aussi les techniques à cadence.

- [ ] **Step 1 : écrire les tests qui échouent**

- `un jeton tenu 2,5 s donne le palier tenue, comme avant` — Shunshin reste jouable.
- `le même jeton tenu au-delà de 4 s passe au palier charge`.
- `le palier charge n'apparaît pas pour un jeton sans technique à tenir`.
- `huit paumes en moins de 3 s déclenchent la technique à cadence`.
- `sept paumes ne la déclenchent pas`.
- `huit paumes étalées sur 5 s ne la déclenchent pas`.
- `une technique à cadence n'interfère pas avec les séquences` — les 52 jutsus existants
  se déclenchent toujours à l'identique.

- [ ] **Step 2 : lancer et vérifier l'échec** — `npm test -- sequence` · FAIL sur les nouveaux.

- [ ] **Step 3 : étendre `sequence.ts`**

`PALIER_CHARGE = 4000` ms, après `TENIR = 2500`. La règle résout la collision relevée à
la conception : `shunshin` est déjà « Tigre tenu 2,5 s », et « mains jointes » ouvre le
Rasengan. On continue à tenir au lieu de relâcher — rien n'est retiré.

- [ ] **Step 4 : vérifier** — `npm test -- sequence` · PASS, 23 tests.

- [ ] **Step 5 : commit**

```bash
git add src/moteur/grammaire/sequence.ts tests/unitaires/sequence.test.ts
git commit -m "Grammaire : paliers de tenue et techniques à cadence"
```

---

### Task 8 : Le taijutsu et les armes

**Files:**
- Create: `src/packs/naruto/donnees/taijutsu.ts`, `src/packs/naruto/donnees/armes.ts`
- Create: `src/packs/naruto/effets/corps.ts`
- Modify: `src/packs/naruto/manifeste.ts`, `src/packs/naruto/effets/index.ts`
- Modify: `src/packs/naruto/i18n/{fr,en}.ts`
- Test: `tests/unitaires/taijutsu.test.ts`

**Interfaces:**
- Consumes: `JetonCorps` (Tâche 5), `Technique`, `cadence` (Tâche 7).
- Produces: `TAIJUTSU: readonly Technique<JetonCorps>[]` ; `ARMES: readonly Arme[]` ;
  `interface Arme { id: string; jeton: JetonCorps; cout: number; degats: number; stock: number | null }` ;
  `EFFETS_CORPS: Record<string, Effet>`.

Les techniques, telles que la conception les fixe :

| id | enchaînement | note |
| --- | --- | --- |
| `konohaSenpuu` | coupDePied + coupDePied | Lee |
| `shishiRendan` | directG + directD + coupDePied + coupDePied | Sasuke |
| `gatsuuga` | rotation **tenue** | Kiba |
| `kaiten` | rotation + garde | Neji, défensif |
| `omoteRenge` | saut + coupDePied | Lee |
| `hakkeRokujuuyonShou` | **cadence** : 8 paumes en 3 s | Neji |
| `hachimon` | brasCroises tenus, un palier par porte | les Huit Portes |

- [ ] **Step 1 : écrire les tests qui échouent**

- `chaque technique de taijutsu n'utilise que des jetons corporels connus`.
- `chaque technique pointe un effet qui existe`.
- `aucune séquence de taijutsu n'est identique à une autre`.
- `les armes ne coûtent pas de chakra` — c'est leur raison d'être : jauge vide, on peut
  encore agir.
- `le parchemin explosif a un stock limité, les shuriken non`.
- **Review Focus 5** : `deux lancers rapprochés produisent deux projectiles, pas un ni
  trois` — la fenêtre de reset des gestes ne doit ni avaler ni dupliquer.
- **Review Focus 5 (bis)** : `un stock épuisé ne bloque pas les autres armes`.
- `les Huit Portes infligent des dégâts au joueur, croissants par porte` — c'est le canon
  et c'est le pari du jeu.
- `les textes des nouvelles techniques existent en fr et en` (la garde de parité du
  plan 1 le vérifie déjà globalement ; ce test nomme les identifiants attendus).

- [ ] **Step 2 : lancer et vérifier l'échec** — `npm test -- taijutsu` · FAIL.

- [ ] **Step 3 : écrire les données, les effets et le câblage du manifeste**

Le manifeste gagne `taijutsu` et `armes` ; `Pack` est étendu en conséquence dans
`types.ts`. Les effets réutilisent les outils de dessin existants — pas de nouvelle
dépendance.

- [ ] **Step 4 : vérifier** — `npm test -- taijutsu` · PASS, 9 tests.

- [ ] **Step 5 : commit**

```bash
git add src/packs/naruto src/moteur/types.ts tests/unitaires/taijutsu.test.ts
git commit -m "Taijutsu et armes : sept techniques au corps, trois projectiles"
```

---

### Task 9 : L'ordonnanceur, et le câblage

Ce qui fait tenir l'ensemble, et le rend visible à l'écran.

**Files:**
- Create: `src/moteur/entree/ordonnanceur.ts`
- Modify: `src/app/main.ts`, `index.html`, `src/packs/naruto/assets/style.css`
- Test: `tests/unitaires/ordonnanceur.test.ts`, `tests/e2e/corps.spec.ts`

**Interfaces:**
- Consumes: `MachineAPostures` (6), `LecteurDeGestes` (5), `LecteurDePosture` (3),
  `Reconnaisseur` (plan 1), `BoucleDeDetection` (plan 1).
- Produces:
  `class Ordonnanceur` — `constructor(parties: { posture; gestes; machine; signes; reglages? })`,
  `demarrer(): void`, `arreter(): void`,
  les rappels `surJeton(j: SigneNaruto): void` et `surGeste(g: JetonCorps): void`.

- [ ] **Step 1 : écrire les tests qui échouent**

- `le reconnaisseur de signes ne tourne qu'en posture de concentration` — en combat,
  zéro appel. C'est la règle qui libère le temps machine **et** lève l'ambiguïté.
- `les gestes ne comptent qu'en posture de combat`.
- `le lecteur de posture tourne dans les deux postures` — il est prioritaire.
- **Review Focus 4** : `basculer en combat au milieu d'un enchaînement vide la séquence`
  — six signes entamés, les mains montent en garde : l'historique repart de zéro
  plutôt que de reprendre plus tard au milieu.
- **Review Focus 4 (bis)** : `revenir en concentration ne ressuscite pas l'enchaînement
  abandonné`.
- `arrêter coupe les deux boucles`.

Puis, dans `tests/e2e/corps.spec.ts`, en navigateur :

- `l'indicateur de posture est visible et change de classe` — il faut que le joueur sache
  dans quel mode il est, c'est une exigence explicite de la conception.
- `l'appli reste jouable aux signes quand le modèle de posture manque` — Review Focus 1
  vue de bout en bout.

- [ ] **Step 2 : lancer et vérifier l'échec** — `npm test -- ordonnanceur` · FAIL.

- [ ] **Step 3 : écrire l'ordonnanceur, puis le câbler**

`index.html` gagne l'indicateur de posture et le stock d'armes dans le HUD ; la feuille
de style les habille dans la veine parchemin existante ; `main.ts` remplace son appel
direct à `BoucleDeDetection` par l'ordonnanceur.

- [ ] **Step 4 : vérifier**

`npm test && npm run lint && npm run typecheck`, puis `npx playwright test` avec
`npm run dev` à côté. Et **regarder les captures** : la leçon du plan 1 est qu'aucun test
unitaire ne voit l'écran.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "Ordonnanceur : les signes en concentration, les gestes en combat"
```

---

### Task 10 : Le banc de rejeu dans l'appli

Sans ça, le banc n'est utilisable que depuis les tests, et le propriétaire ne peut pas
régler les seuils.

**Files:**
- Modify: `src/app/main.ts`, `index.html`
- Create: `src/app/banc.ts`
- Test: `tests/e2e/banc.spec.ts`

**Interfaces:**
- Consumes: `EnregistreurDeSession`, `LecteurDeSession` (Tâche 2), `Ordonnanceur` (9).
- Produces: `class Banc` — `enregistrer(): void`, `arreter(): Session`,
  `rejouer(s: Session): void`, `readonly actif: boolean`.

- [ ] **Step 1 : écrire les tests qui échouent**

- `le banc n'apparaît qu'avec ?banc dans l'adresse` — c'est un outil de développement,
  pas une fonctionnalité du jeu.
- `enregistrer puis arrêter propose le téléchargement d'un fichier de session`.
- `déposer un fichier de session le rejoue à la place de la caméra`.
- `pendant le rejeu, les jetons et les gestes se déclenchent comme en direct`.

- [ ] **Step 2 : lancer et vérifier l'échec** — `npx playwright test banc` · FAIL.

- [ ] **Step 3 : écrire `banc.ts` et son panneau**

Un panneau discret : enregistrer, arrêter, déposer un fichier, et les valeurs lues en
direct (posture courante, dernier geste, immobilité, fiabilité). C'est **ce panneau** qui
permet de régler les seuils de la tâche 5 en regardant des nombres plutôt qu'en devinant.

- [ ] **Step 4 : vérifier** — `npx playwright test banc` · PASS, 4 tests.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "Le banc de rejeu dans l'appli, derrière ?banc"
```

---

### Task 11 : La documentation suit

**Files:**
- Modify: `CLAUDE.md`, `README.md`, `src/packs/naruto/README.md`, `CONTRIBUTING.md`
- Modify: `docs/superpowers/specs/2026-10-24-moteur-anime-webcam-design.md` — cocher ce qui est fait

- [ ] **Step 1 : écrire la garde qui échoue**

Dans `tests/unitaires/depot.test.ts` : `le README annonce le plan 2 comme fait` — la
case `**2** — lecture du corps` de la feuille de route est cochée. Une case à cocher qui
ment est la première chose qu'un lecteur remarque.

- [ ] **Step 2 : lancer et vérifier l'échec** — `npm test -- depot` · FAIL.

- [ ] **Step 3 : mettre les documents à jour**

`CLAUDE.md` gagne la section « le corps » : les deux postures, où vivent les seuils,
comment lancer le banc. Les READMEs gagnent le taijutsu et les armes. `CONTRIBUTING.md`
explique comment ajouter un geste.

- [ ] **Step 4 : vérifier** — `npm test && npm run lint && npm run typecheck` · tout vert.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "Documentation du plan 2 : les postures, les gestes, le banc"
```

---

## Ce qui est laissé au constructeur

- **Toutes les valeurs de seuil.** Celles du plan sont des points de départ raisonnables,
  pas des mesures. Elles se règlent au banc de rejeu, sur de vraies sessions.
- Le **dessin** des effets de taijutsu et des armes.
- Le choix **lite / full** du Pose Landmarker, à faire en mesurant les images par seconde.
- La **forme exacte** du panneau du banc.

## Ce qui ne demande aucun travail

Le **Kawarimi** de la conception (§8.2) marche déjà : c'est un enchaînement de signes
court, que la grammaire du plan 1 reconnaît, et son effet `permutation` existe. Rien à
écrire — seul le plan 3 lui donnera un sens, quand il y aura une attaque à esquiver.

## Ce qui reste hors de ce plan

- Le **combat** : vagues, ennemis, dégâts, boss. C'est le plan 3, et il consomme ce plan.
- Le **mode ermite** et la **charge de chakra** : le palier `charge` existe après la
  tâche 7, mais ce qu'il remplit appartient au plan 4 (progression).
- Les **assets** : silhouettes, signes dessinés. Plan 5.
