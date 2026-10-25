<div align="center">

<img src="docs/images/banniere.svg" alt="Kagami — les gestes de ton anime, reconnus à la webcam" width="760">

### Tu fais le geste devant ta caméra. Une IA le reconnaît. La technique part à l'écran.

<br>

<a href="https://github.com/CodeByHaamza/kagami/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/CodeByHaamza/kagami/ci.yml?branch=main&style=for-the-badge&label=CI&labelColor=14141f&color=6fcf7f" alt="CI"></a>
<img src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=for-the-badge&labelColor=14141f" alt="TypeScript strict">
<img src="https://img.shields.io/badge/tests-205-6fcf7f?style=for-the-badge&labelColor=14141f" alt="205 tests">
<img src="https://img.shields.io/badge/licence-MIT-9a7aff?style=for-the-badge&labelColor=14141f" alt="MIT">

</div>

---

## Ce que c'est

**Kagami** (鏡, « le miroir ») est un moteur : ta webcam devient une glace où tu te vois
avec les pouvoirs. Il ne connaît aucun anime — il sait lire des **jetons** (un geste
reconnu), les assembler en **techniques**, et dessiner l'effet par-dessus ton image.

Chaque anime est un **pack** : son modèle de reconnaissance, son catalogue, ses effets,
ses textes. Ajouter un anime, c'est ajouter un dossier, pas rouvrir le moteur.

<div align="center">

| | Pack | Anime | Ce qu'on y fait | État |
| :---: | --- | --- | --- | :---: |
| 型 | [**Kata**](src/packs/naruto/) | Naruto | les 14 signes de mains, 52 jutsus | **disponible** |
| 気 | — | Dragon Ball | poses du corps, montée de ki | envisagé |
| 呪 | — | Jujutsu Kaisen | gestes, extension du territoire | envisagé |
| 波 | — | JoJo | poses | envisagé |

</div>

## Essayer

```bash
git clone https://github.com/CodeByHaamza/kagami.git
cd kagami
git lfs pull     # les modèles de reconnaissance sont suivis par Git LFS
npm install
npm run dev      # puis http://localhost:5173
```

Il faut une webcam et un navigateur récent. La caméra exige `https` ou `localhost` :
c'est une règle des navigateurs, pas du projet. Rien ne sort de ta machine — ton image
ne quitte jamais l'onglet.

Avec Docker :

```bash
docker compose up dev            # développement, http://localhost:5173
docker compose up --build web    # version construite, http://localhost:8080
```

## Comment ça marche

```text
         ┌─ reconnaisseur de jetons ─→ jetons ─→ grammaire ─→ technique ─┐
caméra ──┤                                                               ├─→ scène ─→ rendu
         └─ lecteur de posture ──────→ posture, gestes ──→ action ───────┘
```

Deux boucles tournent en parallèle : la **détection** (12 fois par seconde au plus, le
modèle est le facteur limitant) et l'**affichage** (à chaque image de l'écran). Un jeton
n'est validé que s'il est vu sur deux images d'affilée — le modèle se trompe d'une image
à l'autre, et sans ce filtre rien ne serait jouable.

Seules deux pièces sont propres à un anime : le reconnaisseur et le catalogue. Une règle
de lint interdit à `src/moteur/` d'importer quoi que ce soit de `src/packs/`, et un test
la vérifie.

<div align="center">
<img src="docs/images/enchainement.svg" alt="Un enchaînement de six signes qui déclenche la boule de feu suprême" width="660">
<br><sub>Six signes à la suite, chacun tenu une demi-seconde. Le curseur avance quand le modèle valide.</sub>
</div>

## La pile

| Quoi | Avec quoi |
| --- | --- |
| Reconnaissance des signes | [YOLOX-Nano](https://github.com/Kazuhito00/NARUTO-HandSignDetection) via onnxruntime-web (WebAssembly) |
| Détourage de la personne | [MediaPipe Image Segmenter](https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter) |
| Effets | Canvas 2D, et Three.js pour le Rasengan |
| Build et tests | Vite · TypeScript strict · Vitest · Playwright |

Tout tourne dans le navigateur. Pas de serveur, pas de compte, aucune donnée qui sorte.

## Développer

```bash
npm run dev        # serveur de développement
npm test           # 205 tests unitaires + vérification des types
npm run test:e2e   # test de fumée dans un vrai navigateur (démarrer npm run dev à côté)
npm run lint       # ESLint, dont la règle moteur ↛ packs
npm run build      # sortie statique dans dist/
```

Pour ajouter un jutsu, un effet ou un pack entier : [CONTRIBUTING.md](CONTRIBUTING.md).
Les conventions du dépôt sont dans [CLAUDE.md](CLAUDE.md).

## Feuille de route

- [x] **1** — extraction, TypeScript, tests, séparation moteur / packs
- [ ] **2** — lecture du corps : postures, taijutsu, armes, banc de rejeu
- [ ] **3** — arcade : vagues, boss, dégâts à l'impact, ralenti d'incantation
- [ ] **4** — progression : grades, examens, fiche ninja, invocations
- [ ] **5** — contenu et assets : signes dessinés, silhouettes à l'encre, nouveaux jutsus
- [ ] **6** — finition : démo en ligne, enregistreur de clip, README avec de vraies images de jeu

La conception complète est dans [`docs/superpowers/specs/`](docs/superpowers/specs/),
les plans dans [`docs/superpowers/plans/`](docs/superpowers/plans/).

## Licence et crédits

Le code est sous [licence MIT](LICENSE). Les œuvres dont s'inspirent les packs ne le sont
pas : **NARUTO © Masashi Kishimoto / Shueisha**. Projet de fan, non officiel, non
commercial.

> ⚠️ Les illustrations des douze signes sont découpées d'une planche de captures de
> l'anime, à titre de **référence provisoire**. Elles doivent être remplacées par nos
> propres visuels avant que le dépôt devienne public. Tout le reste — sons, effets,
> bannières — est fabriqué pour le projet.

- Modèle de détection : [NARUTO-HandSignDetection](https://github.com/Kazuhito00/NARUTO-HandSignDetection) de Kazuhito Takahashi, licence MIT
- Détourage : [MediaPipe](https://ai.google.dev/edge/mediapipe), licence Apache 2.0

---

<div align="center">

<a href="https://github.com/CodeByHaamza">
  <img src="https://github.com/CodeByHaamza.png" width="84" alt="CodeByHaamza" style="border-radius:50%">
</a>

### [CodeByHaamza](https://github.com/CodeByHaamza)

<a href="https://github.com/CodeByHaamza"><img src="https://img.shields.io/badge/GitHub-CodeByHaamza-14141f?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
<a href="https://github.com/CodeByHaamza/kagami/stargazers"><img src="https://img.shields.io/github/stars/CodeByHaamza/kagami?style=for-the-badge&labelColor=14141f&color=e8963c" alt="Étoiles"></a>

<sub>Si tu fais un Rasengan correct du premier coup, dis-le-moi.</sub>

</div>
