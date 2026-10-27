# Kagami — Plan 4 : la progression, les examens, la fiche ninja et le chrono

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner au joueur une progression durable et fidèle à Naruto : créer sa fiche ninja (clan, village, contrat d'invocation avec sa spécialité), gravir les échelons canoniques (Académie → Genin → Chūnin → Jōnin → Kage) en passant de vrais examens, débloquer les rangs de jutsus et de missions, et chronométrer ses exploits au Dojo.

**Architecture:** 
- `src/moteur/stockage/sauvegarde.ts` passe en version 2 avec migration transparente depuis la v1 (fiche ninja, grade, missions réussies, examens réussis, records au chrono).
- `src/moteur/progression/` gère les règles canoniques de passage de grade, les conditions de déblocage des jutsus par rang, et les examens de l'Académie.
- `src/moteur/jeu/contrat.ts` applique les effets passifs et actifs des quatre contrats d'invocation (Crapauds, Serpents, Limaces, Chiens).
- `src/moteur/jeu/chrono.ts` gère le chronométrage précis d'exécution au Dojo.
- L'interface s'enrichit de l'écran Fiche Ninja, de l'écran Académie et du chrono au Dojo sans jamais encombrer le premier lancement.

**Tech Stack:** TypeScript strict · Vitest · Playwright — aucune dépendance nouvelle.

**Spec:** [`docs/superpowers/specs/2026-10-24-moteur-anime-webcam-design.md`](../specs/2026-10-24-moteur-anime-webcam-design.md)
(§9.8 grades, examens, déblocages, §9.9 fiche ninja et clan, §9.10 contrats d'invocation et mode ermite, §9.11 déblocages, §10.5 chrono du Dojo, §10.7 écrans)

**Plan précédent :** [plan 3](2026-10-26-03-arcade.md), terminé.

## Global Constraints

- **Conventions [`CLAUDE.md`](../../../CLAUDE.md)** : code en français, `moteur/` n'importe JAMAIS rien de `packs/`, interface 100% traduite (i18n parité fr/en), aucune mention de nom civil ni d'attribution IA dans les commits.
- **Rétrocompatibilité totale** : aucune perte des données v1 lors du chargement.
- **Accessibilité du Dojo immédiate** : le joueur peut toujours tester sans créer de compte ni remplir de formulaire. La fiche ninja est demandée à l'entrée en Arcade ou accessible via le menu.
- **Respect du canon** : les examens et déblocages respectent scrupuleusement l'œuvre.

---

### Task 1 : Sauvegarde v2 et migration

**Files:**
- Modify: `src/moteur/stockage/sauvegarde.ts`
- Modify: `tests/unitaires/sauvegarde.test.ts`

**Interfaces:**
- Produces:
  `type Grade = "academie" | "genin" | "chunin" | "jonin" | "kage"` ;
  `type Village = "konoha" | "suna" | "kiri" | "iwa" | "kumo"` ;
  `type Contrat = "crapauds" | "serpents" | "limaces" | "chiens"` ;
  `interface FicheNinja { nom: string; clan: string; village: Village; contrat: Contrat }` ;
  `interface Progression { grade: Grade; missionsReussies: string[]; examensPasses: string[]; recordsDojo: Record<string, number> }` ;
  `Sauvegarde` enrichi de `fiche: FicheNinja | null` et `progression: Progression` ;
  Migration v1 → v2 automatique.

- [x] **Step 1 : tests de la sauvegarde v2 et de la migration v1**
- [x] **Step 2 : implémenter la sauvegarde v2**
- [x] **Step 3 : vérifier les tests** (`npm test -- sauvegarde`)
- [x] **Step 4 : commit** — `Sauvegarde v2 : fiche ninja, progression et records du Dojo`

---

### Task 2 : Règles de progression et déblocages des jutsus

**Files:**
- Create: `src/moteur/progression/progression.ts`
- Test: `tests/unitaires/progression.test.ts`

**Interfaces:**
- Produces:
  `estTechniqueDisponible(techniqueId, grade, profils): boolean` ;
  `estMissionAccessible(missionRang, grade): boolean` ;
  `gradesOrdre: readonly Grade[]` ;
  `progressionSuivante(progression): { prochainGrade?: Grade; type: "examen" | "recommandation"; prerequisRempli: boolean }`.

- [x] **Step 1 : tests unitaires d'éligibilité et de filtrage par grade**
- [x] **Step 2 : implémenter les règles canoniques de progression**
- [x] **Step 3 : vérifier les tests** (`npm test -- progression`)
- [x] **Step 4 : commit** — `Règles de progression et déblocages canoniques par grade`

---

### Task 3 : Spécialités des contrats d'invocation en combat

**Files:**
- Create: `src/moteur/jeu/contrat.ts`
- Modify: `src/moteur/jeu/combat.ts`
- Test: `tests/unitaires/contrat.test.ts`

**Interfaces:**
- Produces:
  `appliquerSpecialiteContrat(contrat, joueur, telegraphes, options)` :
  - Crapauds : Mode Ermite (boost attaque ×1.5 sous charge).
  - Serpents : Réflexe ermite (fenêtre d'esquive étendue).
  - Limaces : Régénération vitale accrue.
  - Chiens : Pistage ninken (télégraphes ralentis / anticipés).

- [x] **Step 1 : tests de chaque spécialité de contrat**
- [x] **Step 2 : implémenter et brancher dans `Combat`**
- [x] **Step 3 : vérifier les tests** (`npm test -- contrat combat`)
- [x] **Step 4 : commit** — `Les spécialités des quatre contrats d'invocation en combat`

---

### Task 4 : Les examens de l'Académie

**Files:**
- Create: `src/moteur/jeu/examen.ts`
- Create: `src/packs/naruto/donnees/examens.ts`
- Test: `tests/unitaires/examen.test.ts`

**Interfaces:**
- Produces:
  `interface EpreuveExamen { id: string; nom: string; techniqueId: string; tempsMax: number }` ;
  `interface ExamenDefinition { id: string; gradeCible: Grade; epreuves: readonly EpreuveExamen[] }` ;
  `class SessionExamen` : suit le temps, vérifie la technique réalisée, valide l'étape ou constate l'échec.

- [x] **Step 1 : tests du déroulement d'un examen**
- [x] **Step 2 : implémenter le gestionnaire d'examen et les définitions Naruto (Bunshin, etc.)**
- [x] **Step 3 : vérifier les tests** (`npm test -- examen`)
- [x] **Step 4 : commit** — `Les examens de l'Académie pour le passage de grade`

---

### Task 5 : Le Chrono du Dojo

**Files:**
- Create: `src/moteur/jeu/chrono.ts`
- Modify: `tests/unitaires/chrono.test.ts`

**Interfaces:**
- Produces:
  `class ChronometreDojo` :
  - `demarrer(techniqueId, temps)`
  - `arreter(temps): { dureeMs: number; estNouveauRecord: boolean }`
  - `reinitialiser()`

- [x] **Step 1 : tests unitaires du chronomètre**
- [x] **Step 2 : implémenter `chrono.ts`**
- [x] **Step 3 : vérifier les tests** (`npm test -- chrono`)
- [x] **Step 4 : commit** — `Chronomètre du Dojo et suivi des records d'exécution`

---

### Task 6 : Interface utilisateur, HUD, écrans et câblage

**Files:**
- Create: `src/app/ficheNinja.ts`
- Create: `src/app/academie.ts`
- Modify: `index.html`
- Modify: `src/app/main.ts`
- Modify: `src/packs/naruto/assets/style.css`
- Modify: `src/packs/naruto/i18n/{fr,en}.ts`
- Create: `tests/e2e/progression.spec.ts`

- [ ] **Step 1 : ajouter l'écran Fiche Ninja (nom, clan, village, contrat)**
- [ ] **Step 2 : ajouter l'écran Académie (passage d'examen)**
- [ ] **Step 3 : intégrer le chrono et affichage des records dans le Dojo / entraînement**
- [ ] **Step 4 : conditionner l'accès aux missions d'arcade selon le grade**
- [ ] **Step 5 : tests e2e Playwright**
- [ ] **Step 6 : commit** — `Interface : écran Fiche Ninja, Académie et chrono du Dojo`

---

### Task 7 : Documentation et synchronisation

**Files:**
- Modify: `CLAUDE.md`, `README.md`, `src/packs/naruto/README.md`, `docs/superpowers/specs/2026-10-24-moteur-anime-webcam-design.md`

- [ ] **Step 1 : mettre à jour les tables de progression, badges et roadmap**
- [ ] **Step 2 : commit** — `Documentation du plan 4 : progression, examens et fiche ninja`
