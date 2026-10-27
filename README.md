<div align="center">

<img src="docs/images/banniere.svg" alt="Kagami — les gestes de ton anime, reconnus à la webcam" width="760">

### Tu formes les signes devant ta caméra. Une IA les reconnaît. La technique part à l'écran.

<br>

<a href="https://github.com/CodeByHaamza/kagami/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/CodeByHaamza/kagami/ci.yml?branch=main&style=for-the-badge&label=CI&labelColor=14141f&color=6fcf7f" alt="CI"></a>
<img src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=for-the-badge&labelColor=14141f" alt="TypeScript strict">
<img src="https://img.shields.io/badge/tests-438-6fcf7f?style=for-the-badge&labelColor=14141f" alt="438 tests">
<img src="https://img.shields.io/badge/PWA-offline-e8963c?style=for-the-badge&labelColor=14141f" alt="PWA">
<img src="https://img.shields.io/badge/licence-MIT-9a7aff?style=for-the-badge&labelColor=14141f" alt="MIT">

</div>

---

## ⚡ Présentation

**Kagami** (鏡, « le miroir ») transforme ta caméra en miroir interactif manga. Grâce à l'intelligence artificielle en temps réel directement dans ton navigateur :
- **58 techniques ninjas canoniques** (Katon, Suiton, Doton, Raiton, Fūton, Rinnegan, Senjutsu, Hyōton, Hiden).
- **Entraînement guidé interactif** : illustrations visuelles haute définition des mains, description exacte du placement des doigts et chronomètre au centième de seconde.
- **Mode Arcade & Survie Infinie** : affronte les déserteurs, les escouades de l'Anbu Racine et les boss légendaires (*Zabuza, Kisame, Deidara, Itachi, Madara*).
- **Cosmétiques en Réalité Augmentée** : bandeaux frontaux en acier brossé 3D gravés des 5 grands villages (*Konoha, Suna, Kiri, Iwa, Kumo*) et masque félin ANBU d'infiltration projetés sur ton visage.
- **Enregistreur de clips vidéo WebM (`⏺`)** : capture directe à 30 FPS pour immortaliser et partager tes jutsus en un clic.
- **100% Local & Sécurisé** : aucune image ne quitte ton appareil. Aucun serveur externe, fonctionnement hors-ligne (PWA).

<div align="center">

| | Pack | Univers | Contenu | Statut |
| :---: | --- | --- | --- | :---: |
| 型 | [**Kata**](src/packs/naruto/) | Naruto | 14 signes, 58 jutsus, 7 taijutsu, 3 armes, Arcade 5 rangs + Survie | **Prêt à l'emploi** |
| 気 | — | Dragon Ball | Poses du corps, montée d'aura ki | Envisagé |
| 呪 | — | Jujutsu Kaisen | Signes de mains, extension du territoire | Envisagé |

</div>

---

## 🚀 Démarrage rapide

### 1. Installation

```bash
git clone https://github.com/CodeByHaamza/kagami.git
cd kagami
git lfs pull     # télécharge les poids de reconnaissance YOLOX et MediaPipe
npm install
```

### 2. Lancer l'application

#### Option A — Sur ton PC (avec webcam)

```bash
npm run dev
```
Ouvre ensuite [http://localhost:5173](http://localhost:5173) dans Chrome, Edge ou Firefox.

#### Option B — Directement sur ton iPhone / Smartphone (idéal si ton PC n'a pas de caméra)

Kagami embarque un serveur HTTPS local automatique (obligatoire pour que Safari et iOS autorisent l'accès à la caméra) :

```bash
npm run dev:reseau
```
1. Le terminal t'affiche l'adresse réseau locale, par exemple : `https://192.168.1.XX:5173/` ou `https://172.20.10.7:5173/`.
2. Ouvre **Safari** sur ton iPhone connecté au même Wi-Fi ou partage de connexion.
3. Clique sur **« Avancé »** puis **« Continuer vers le site »** (certificat HTTPS local).
4. Autorise l'accès à la caméra : l'application tourne en plein écran !

#### Option C — Utiliser l'iPhone comme webcam pour le PC

Installe l'application gratuite **Camo** (ou **DroidCam**) sur ton iPhone et ton PC. Dès que l'iPhone est branché en USB, lance `npm run dev` sur ton PC et sélectionne la caméra Camo.

#### Option D — Mode banc de test sans caméra

Pour explorer l'interface, les jutsus et le son sans allumer de caméra :
```text
http://localhost:5173/?banc
```

---

## 🎮 Modes de jeu & Fonctionnalités

```text
               ┌─ Dojo (Entraînement guidé, chrono & records)
               ├─ Académie (Examens de passage de grade : Genin → Kage)
KAGAMI ────────┼─ Arcade (Missions canoniques Rangs D à S)
               ├─ Survie Infinie (Le Gouffre Ninja : marathon de boss)
               └─ Fiche Ninja & AR (Bandeaux de village, masques ANBU)
```

### 🥋 1. Le Dojo (Entraînement guidé)
- Clique sur l'**Encyclopédie (📜)** ou choisis un jutsu.
- L'entraînement affiche le nom et le kanji de la technique **sans déclencher l'effet à l'avance**.
- **Aide visuelle dynamique** :
  - **Illustration du prochain signe** : affiche le dessin exact des mains à former.
  - **Description gestuelle** : instructions anatomiques précises pour positionner tes doigts.
  - **Frise de séquence** : les pastilles avancent et s'illuminent au fur et à mesure que tu formes les signes.
- **Chronomètre au centième** : bats tes records de vitesse d'incantation et enregistre tes performances dans ta sauvegarde locale.

### ⚔️ 2. L'Arcade & Le Gouffre Ninja (Survie Infinie)
- **Missions Rangs D à S** : franchis les vagues d'ennemis (Zetsu, ninjas déserteurs des 5 éléments, Anbu Racine, ninjas réincarnés Edo Tensei).
- **Survie Infinie (∞)** : affronte des vagues procédurales infinies avec des boss récurrents de plus en plus redoutables (*Zabuza, Kisame, Deidara, Itachi, Madara*).
- **Système de combat complet** :
  - *Attaque* : jutsus élémentaires et coups au corps (Directs, Balayages, Rafales).
  - *Défense & Esquive* : posture de garde, esquives latérales corporelles, saut.
  - *Rupture d'illusion* : signe du Bélier (*« Kai ! »*) pour dissiper les genjutsu d'Itachi.

### 忍 3. Fiche Ninja & Cosmétiques en Réalité Augmentée
- Personnalise ton ninja : nom, clan, village caché (*Konoha, Suna, Kiri, Iwa, Kumo*) et contrat d'invocation (*Crapauds, Serpents, Limaces, Chiens*).
- **Cosmétiques AR verrouillés sur le visage** :
  - Bandeaux frontaux 3D avec plaque métallique brossée, 6 rivets chromés et emblème gravé.
  - Masque de porcelaine ANBU avec peintures de guerre félines carmin.
  - La projection compense l'effet miroir de la caméra et s'adapte en temps réel à l'orientation et à la distance de ta tête.

### ⏺ 4. Enregistreur de clips vidéo
- Clique sur le bouton **`⏺`** dans la barre supérieure pour lancer l'enregistrement de ton écran.
- Exécute tes plus beaux enchaînements : l'enregistrement se coupe automatiquement au bout de quelques secondes ou sur un second clic, et télécharge instantanément un clip vidéo **WebM** fluide prêt à être partagé.

---

## 🧠 Comment ça marche sous le capot

```text
         ┌─ Reconnaissance de signes (YOLOX-Nano) ──→ Jetons ──┐
Caméra ──┤                                                     ├─→ Scène ─→ Rendu Canvas 2D
         └─ Lecture de posture (MediaPipe Pose, 33 pts) ─→ Gestes ─┘
```

1. **Deux postures pour deux usages** :
   - 🧘 **Concentration (印)** : poignets joints devant la poitrine $\rightarrow$ le reconnaisseur de signes de main écoute.
   - 🥋 **Combat (戦)** : poignets hauts ou garde levée $\rightarrow$ le moteur de taijutsu et d'esquive prend le relais.
2. **Cloisonnement architectural strict** : le moteur générique (`src/moteur/`) n'importe jamais de pack spécifique (`src/packs/`).
3. **Accélération matérielle** : inférence WebAssembly SIMD multi-threadée, détourage par WebGL/Canvas et PWA avec Service Worker hors-ligne.

---

## 🛠️ Commandes développeur

```bash
npm run dev        # Lance le serveur local Vite (http://localhost:5173)
npm run dev:reseau # Lance le serveur en HTTPS sur le réseau local pour mobile
npm test           # Exécute les 438 tests unitaires Vitest + typage TypeScript strict
npm run test:e2e   # Exécute les 26 tests end-to-end Playwright
npm run lint       # Vérification du code avec ESLint
npm run build      # Build de production statique dans dist/
```

---

## 🗺️ Feuille de route

- [x] **1** — extraction, TypeScript, tests, séparation moteur / packs
- [x] **2** — lecture du corps : postures, taijutsu, armes, banc de rejeu
- [x] **3** — arcade : vagues, boss, cycle élémentaire, HUD parchemin, ralenti d'incantation
- [x] **4** — progression : grades, examens, fiche ninja, contrats d'invocation, chrono du Dojo
- [x] **5** — contenu et assets : signes dessinés, silhouettes à l'encre, nouveaux jutsus
- [x] **6** — finition : cosmétiques AR, enregistreur de clip, PWA hors-ligne

---

## 📜 Licence & Crédits

- Code source sous [Licence MIT](LICENSE) — Copyright (c) 2026 **CodeByHaamza**.
- L'univers et les œuvres dont s'inspire le pack Kata appartiennent à leurs auteurs respectifs : **NARUTO © Masashi Kishimoto / Shueisha**. Projet de fan, non officiel et à vocation non commerciale.
- Modèle de signes : [NARUTO-HandSignDetection](https://github.com/Kazuhito00/NARUTO-HandSignDetection) (Kazuhito Takahashi, MIT).
- Vision & Posture : [MediaPipe Solutions](https://ai.google.dev/edge/mediapipe) (Google, Apache 2.0).

---

<div align="center">

<a href="https://github.com/CodeByHaamza">
  <img src="https://github.com/CodeByHaamza.png" width="84" alt="CodeByHaamza" style="border-radius:50%">
</a>

### Conçu avec passion par [CodeByHaamza](https://github.com/CodeByHaamza)

<a href="https://github.com/CodeByHaamza"><img src="https://img.shields.io/badge/GitHub-CodeByHaamza-14141f?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
<a href="https://github.com/CodeByHaamza/kagami/stargazers"><img src="https://img.shields.io/github/stars/CodeByHaamza/kagami?style=for-the-badge&labelColor=14141f&color=e8963c" alt="Étoiles"></a>

</div>
