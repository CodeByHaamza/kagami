# Kagami — moteur de jeu « gestes d'anime à la webcam »

## Document de conception · pack n°1 : Kata (Naruto)

**Date :** 2026-10-24
**Auteur :** CodeByHaamza
**État :** relu par un constructeur indépendant, questions bloquantes tranchées

---

## 1. Intention

Tu fais les signes de Naruto devant ta webcam, un modèle d'IA les reconnaît, et le bon
enchaînement lance un jutsu dessiné par-dessus ton image. Ça existe déjà : c'est le l'exercice d'origine
du dépôt scolaire `le dépôt scolaire d'origine`, 52 jutsus, ça marche.

Ce projet en fait **autre chose** :

1. un vrai dépôt à soi, propre, testé, avec un README qui donne envie ;
2. un **jeu** par-dessus la démo technique — vagues d'ennemis, boss, taijutsu, armes,
   progression, déblocages, cosmétiques ;
3. un **moteur réutilisable**, parce que Naruto n'est que le premier anime. DBZ, JJK,
   peut-être JoJo viendront ensuite, et il ne faudra pas tout réécrire.

Le « pourquoi » est double et il faut le garder en tête à chaque arbitrage :

- **Un pote reçoit le lien, teste trois signes, rigole.** Donc : ça doit marcher en
  moins de 30 secondes, sans compte, sans tutoriel, et le premier jutsu réussi doit
  être spectaculaire. Ce public joue la **démo en ligne** (§6).
- **Un fan de Naruto revient plusieurs fois pour débloquer des trucs.** Donc : il faut
  une progression qui tient sur plusieurs sessions, et une raison de rejouer une
  mission déjà finie. Ce public joue **en local**, sans contrainte de poids.

Ces deux publics ne demandent pas la même chose. La réponse est de ne jamais mettre la
profondeur sur le chemin du premier jutsu : le **Dojo** (mode libre, l'appli actuelle)
reste l'écran d'entrée, l'arcade est une porte à côté.

## 2. Objectifs

- Extraire `CartoTD4/Ninjutsu` dans un dépôt indépendant, sans les traces du contexte
  scolaire, et le remettre au propre (TypeScript, build, tests, outillage).
- **Faire du corps une manette** : aujourd'hui seules les mains comptent, et seulement
  pour former des signes. Demain tu frappes, tu gardes, tu esquives, tu lances.
- Ajouter un **mode arcade** : vagues d'ennemis, boss aux patterns lisibles, missions
  de difficulté croissante.
- Ajouter une **progression** : grades ninja, examens, jutsus débloqués, kekkei genkai,
  dōjutsu, invocations, mode ermite, cosmétiques.
- Rester **fidèle à Naruto** partout où c'est possible : les grades, les rangs de
  mission et de jutsu, le cycle élémentaire, les enchaînements de signes, les boss, les
  voies d'ermite, les armes.
- Séparer un **moteur générique** d'un **pack Naruto**, pour que le deuxième anime soit
  un dossier de plus et pas une réécriture.
- Deux READMEs soignés et animés : un pour le projet, un pour le pack Naruto.

## 3. Non-objectifs

- Pas de multijoueur, pas de serveur, pas de compte. Tout est local.
- Pas de monétisation, pas d'analytics, pas de télémétrie.
- Pas de deuxième pack d'anime dans ce lot de travail. On prépare la place, on ne la
  remplit pas.
- Pas de support mobile prioritaire. Il existe déjà (mode dégradé) et on ne le casse
  pas volontairement, mais il ne contraint plus les décisions. L'ajout de la lecture de
  posture le rendra probablement inutilisable sur téléphone bas de gamme : arbitrage
  accepté.

## 4. Anti-objectifs

Ce qui ferait rater le projet même s'il marche techniquement :

- **Un écran de menus avant de pouvoir faire un signe.** Si un pote doit créer un
  personnage avant de lancer une boule de feu, c'est raté.
- **Un HUD qui mange l'image.** On vient voir sa propre tête avec du feu autour.
- **Des kanji sans traduction.** Le style japonais est voulu, mais un kanji seul n'est
  pas lisible pour la majorité des joueurs : il est toujours accompagné du nom en clair.
  *(Décision explicite du propriétaire.)*
- **Du faux Naruto.** Des grades inventés, un cycle élémentaire inversé, des
  enchaînements au hasard : un fan le voit en dix secondes.
- **Des gestes qui ne répondent pas.** Pire que tout : faire le signe, ou le coup, et
  que rien ne se passe sans savoir pourquoi. Tout geste reconnu donne un retour
  immédiat, même raté.
- **Un combat qui se joue comme un bouton.** Si lancer un jutsu applique des dégâts sans
  que viser, esquiver ou placer l'effet ne veuille jamais rien dire, l'arcade n'est
  qu'une liste de raccourcis. C'est ce que la décision §9.2 empêche.
- **Un moteur générique théorique.** L'abstraction doit sortir du code existant, pas
  d'un schéma.
- **Le nom et l'école du propriétaire dans le dépôt.** C'est un projet perso :
  `CodeByHaamza` partout. Ni le nom civil du propriétaire, ni sa mention de formation, ni le
  numéro de l'exercice d'origine ne doivent apparaître dans le dépôt.

---

## 5. L'existant : ce qu'on reprend

Source : `CodeByHaamza/le dépôt scolaire d'origine`, dossier `CartoTD4/Ninjutsu`, dernier commit `e3d86b4`.
Environ 2 200 lignes de JavaScript, modules ES natifs, aucun build, aucun test.

| Fichier | Lignes | Ce que ça fait | Sort |
| --- | --- | --- | --- |
| `js/detection.js` | 59 | YOLOX-Nano ONNX → le signe vu | devient un **reconnaisseur de jetons** du pack |
| `js/sequence.js` | 118 | signes validés → jutsu | devient la **grammaire** du moteur |
| `js/effets/*.js` | ~1 100 | 52 effets canvas 2D | passent au pack, contrat **étendu** (§9.2) |
| `js/donnees.js` | 16 Ko | 14 signes, 52 jutsus, familles | devient le **catalogue**, à **enrichir** (§9.3) |
| `js/main.js` | 607 | caméra, rendu, UI, stockage, encyclopédie, entraînement | **à casser** en plusieurs modules |
| `js/silhouette.js` | 105 | détourage MediaPipe | moteur (générique) |
| `js/son.js` | 267 | sons synthétisés Web Audio + fichiers | moteur + sons du pack |
| `js/rasengan.js` | 124 | sphère Three.js | pack Naruto |
| `js/journal.js` | 113 | journal de bord anti-crash | moteur, en mode debug |
| `js/encyclopedie.js` | 55 | listes de signes et jutsus | moteur + données du pack |

**Ce qui est déjà bon et qu'il ne faut pas « améliorer » :**

- Le **contrat d'effet** (`depart` / `fond` / `derriere` / `personne` / `devant`) est
  bien pensé : il laisse un effet se glisser entre le décor et la personne détourée.
  On le conserve **et on l'étend** (§9.2) ; on ne le remplace pas.
- La **validation d'un signe** (deux images d'affilée, seuil 0,6, oubli au bout de 4 s)
  est réglée finement contre le bruit du modèle. Ne pas y toucher sans mesurer.
- Le mécanisme d'**attente** (`ATTENTE = 1500 ms`) qui gère le fait que le Rasengan est
  le début du Rasenshuriken. Il est subtil et correct.
- Le **chargement paresseux** : le détourage et la scène 3D ne se chargent qu'au premier
  jutsu qui en a besoin. À conserver pour le Dojo. **En arcade, la silhouette et la
  posture sont chargées d'avance**, pendant l'écran de calibration (§10.3) — c'est là
  que le chargement est gratuit.

**Ce qui est à corriger :**

- `main.js` fait dix métiers. C'est la seule vraie dette.
- Aucun typage : 52 jutsus × 14 signes × 52 effets reliés par des chaînes, sans filet.
- Aucun test.
- Les en-têtes de tous les fichiers portent le nom civil et la mention de formation.
- Tout est en français en dur dans le code et le HTML.

**Ce qui n'existe pas du tout** et qu'il faut construire : toute lecture du corps (§7.4),
toute notion de cible et de collision (§9.2), toute donnée de rang et d'élément (§9.3),
tout visuel d'ennemi (§9.5).

---

## 6. Contraintes

### Deux cibles de build

| Cible | Pour qui | Contraintes |
| --- | --- | --- |
| **Local** (`npm run dev`) | le fan qui progresse, et le développement | aucune contrainte de poids ; Pose Landmarker *full* possible ; c'est la cible de référence |
| **Démo en ligne** (build statique) | le pote qui reçoit le lien | poids surveillé, Pose Landmarker *lite*, HTTPS obligatoire (`getUserMedia` l'exige), modèles servis depuis le site |

Les deux sortent du même code : ce qui change est un profil de build (quel modèle de
posture, quelle qualité par défaut). **Ce n'est pas deux applications.** La démo en
ligne peut dégrader, jamais diverger.

### Le reste

- **Le navigateur fait tout.** Pas de backend. Les modèles tournent en WASM / WebGL.
- **Le modèle de signes est spécifique à Naruto.** YOLOX-Nano entraîné sur 14 signes
  de mains (`Kazuhito00/NARUTO-HandSignDetection`, MIT). Il ne resservira pas pour DBZ
  ou JJK : c'est le point qui dicte l'architecture (§7).
- **Budget d'inférence.** Trois modèles tourneront ensemble : signes (YOLOX, ~4 Mo),
  détourage (~250 Ko), **posture (Pose Landmarker, ~10 à 14 Mo)**. Ils ne peuvent pas
  tourner tous à pleine cadence : le partage du temps est traité en §7.5.
- **Dépendances.** Aujourd'hui onnxruntime, Three.js, MediaPipe et la police viennent
  toutes de CDN. Elles passent en dépendances npm bundlées, pour que le jeu démarre
  hors ligne et que les versions soient figées.
- **Licences.** Détection MIT, MediaPipe Apache 2.0, Three.js MIT. Naruto appartient à
  Masashi Kishimoto / Shueisha : projet de fan, non officiel, non commercial, mention
  obligatoire dans les deux READMEs. **Aucun asset officiel** dans le dépôt.
- **Français et anglais** dès le début, français par défaut.
- **Pas de date de rendu.** Le projet s'étale, il doit donc rester reprenable.

---

## 7. Architecture : un moteur, des packs

### 7.1 L'idée

La chaîne actuelle est déjà la bonne, il suffit de lui ajouter une deuxième voie
d'entrée et une scène.

```text
         ┌─ reconnaisseur de jetons ─→ jetons ─→ grammaire ─→ technique ─┐
caméra ──┤                                                               ├─→ scène ─→ rendu
         └─ lecteur de posture ──────→ posture, gestes ──→ action ───────┘     ↑
                                                                          ennemis, combat
```

Seules deux cases sont propres à Naruto : le **reconnaisseur de jetons** et le
**catalogue**. Tout le reste est indépendant de l'anime.

Le deuxième anime changera la nature des jetons : DBZ et JJK ne se jouent pas aux signes
de mains mais aux **poses du corps**. D'où le vocabulaire « jetons » plutôt que « signes
de mains » — et d'où le fait que le lecteur de posture ajouté ici n'est pas du périmètre
en plus : **c'est l'entrée principale du pack n°2, construite d'avance.**

### 7.2 Découpage des dossiers

```text
/
├─ README.md                    ← le projet Kata (multi-anime), animé
├─ CLAUDE.md
├─ docs/superpowers/specs/
├─ src/
│  ├─ moteur/                   ← rien de spécifique à un anime
│  │  ├─ entree/                ← caméra, ordonnanceur, interfaces Reconnaisseur + Posture
│  │  ├─ grammaire/             ← jetons → technique
│  │  ├─ corps/                 ← postures, gestes, esquive, immobilité
│  │  ├─ scene/                 ← entités, positions, cibles, collisions
│  │  ├─ rendu/                 ← boucle d'affichage, contrat d'effet, cadre, secousse
│  │  ├─ silhouette/
│  │  ├─ son/
│  │  ├─ jeu/                   ← arcade : vagues, combat, dégâts, boss, ralenti
│  │  ├─ progression/           ← grades, examens, déblocages, sauvegarde
│  │  ├─ ui/                    ← HUD, encyclopédie, écrans, i18n
│  │  ├─ capture/               ← enregistreur de clip
│  │  ├─ rejeu/                 ← banc de rejeu sans webcam (§11)
│  │  └─ debug/
│  ├─ packs/naruto/
│  │  ├─ README.md              ← le README « parchemin », animé
│  │  ├─ manifeste.ts
│  │  ├─ entree/                ← le reconnaisseur YOLOX des 14 signes
│  │  ├─ donnees/               ← signes, jutsus, armes, clans, ennemis, boss, missions
│  │  ├─ effets/                ← les 52 effets + les nouveaux
│  │  ├─ assets/                ← SVG des signes, silhouettes d'ennemis, bandeaux, sons
│  │  └─ i18n/
│  └─ app/
├─ tests/
└─ public/modeles/
```

Règle de dépendance, à faire respecter par le linter : **`moteur/` n'importe jamais rien
de `packs/`.** L'inverse est permis. C'est la seule règle d'architecture qui compte, et
la seule qui se vérifie automatiquement.

### 7.3 Le manifeste d'un pack

Forme exacte laissée au constructeur ; doit couvrir : `id` / `nom` / `theme`,
`reconnaisseur()`, `jetons`, `techniques`, `gestes`, `effets`, `cycleElementaire`,
`echelleDeGrades`, `bestiaire`, `boss`, `missions`, `i18n`.

### 7.4 Les entrées

```text
interface Reconnaisseur {            // propre au pack
  charger(): Promise<void>
  reconnaitre(image, l, h): Promise<Detection | null>   // { jeton, score, boite }
}

interface LecteurDePosture {         // générique, moteur
  charger(): Promise<void>
  lire(image, horodatage): Posture | null   // 33 points 3D + dérivés
}
```

Le `Reconnaisseur` Naruto est l'actuel `detection.js`, renommé et typé.

Le `LecteurDePosture` est **nouveau** : **MediaPipe Pose Landmarker**
(`@mediapipe/tasks-vision`), 33 points 3D, `detectForVideo`, `delegate: "GPU"` avec repli
CPU. *lite* (~10,6 Mo) pour la démo en ligne, *full* (~14 Mo) en local si la mesure le
justifie.

Pourquoi il est indispensable : le détourage ne donne qu'un **masque** personne / fond.
On peut en tirer « il a bougé à gauche », pas « bras resserrés sur la poitrine » ni
« il vient de lancer un direct ».

**Pas besoin d'un quatrième modèle pour le bandeau AR.** Les points 0 à 10 du Pose
Landmarker couvrent le nez, les yeux et les oreilles : de quoi placer et orienter un
bandeau sur le front. Un `FaceLandmarker` serait du luxe.

**Le cadrage** doit servir les deux usages à la fois : les signes veulent les mains
visibles à hauteur de poitrine, l'esquive veut te voir bouger latéralement. Cadrage de
référence : **buste complet, bras écartés dans le cadre, à ~1,5 m de la caméra.**
L'écran de calibration (§10.3) sert précisément à l'obtenir, et c'est le cadrage sur
lequel tous les seuils de gestes sont réglés.

### 7.5 Le partage du temps entre les modèles

- Le **lecteur de posture** tourne à cadence fixe et prioritaire (viser 20–30 Hz) : il
  porte l'esquive et la garde, qui doivent être immédiates.
- Le **reconnaisseur de signes** ne tourne **que** en posture de concentration (§7.7).
  Hors de cette posture il est en pause, ce qui libère beaucoup de temps machine. Sa
  cadence actuelle (12 Hz, `ECART_DETECTION = 80 ms`) reste la base.
- Le **détourage** reste paresseux dans le Dojo, préchargé en arcade.

Cette règle fait d'une pierre deux coups : le budget machine **et** la confusion entre
les gestes (§7.7).

### 7.6 La grammaire

L'actuelle classe `Sequence`, généralisée : elle ne connaît plus les jutsus mais des
**techniques** ayant chacune une ou deux séquences de jetons, ou un jeton à tenir. Les
constantes de réglage deviennent des paramètres du pack, avec les valeurs actuelles par
défaut — elles sont bien réglées, elles ne changent pas sans mesure.

#### Les signes tenus : une règle à paliers

Problème relevé à la relecture, et il est réel : `shunshin` **est déjà** « Tigre tenu
2,5 s », et « mains jointes » est le **premier signe du Rasengan**. Affecter le Tigre à
la charge de chakra et les mains jointes au mode ermite casserait trois jutsus existants
(`shunshin`, `rasengan`, `rasenshuriken`), et quatre autres jutsus sont des signes tenus
(`kagemane` = Rat, `rashoumon` = Serpent, `goukamekkyaku` = Cheval).

Règle unique, qui ne casse rien :

| Durée de tenue | Ce qui se passe |
| --- | --- |
| < 2,5 s, puis un autre signe | enchaînement normal (le Rasengan part de là) |
| 2,5 s | le jutsu à tenir correspondant, s'il existe (Shunshin, Kagemane, Rashōmon, Gōka Mekkyaku) |
| au-delà de **4 s** | **charge** : chakra pour le Tigre, mode ermite pour les mains jointes |

Tu continues simplement à tenir au lieu de relâcher. C'est lisible à l'écran (la jauge
démarre, visiblement), ça n'enlève aucun jutsu, et ça se teste. `Sequence.signeTenu()`
renvoie donc un palier, plus un booléen.

### 7.7 Les deux postures

Les mains servent à la fois à former les signes et à frapper ou garder. Un direct serait
lu comme un signe raté, une garde aussi.

| Posture | Comment on la reconnaît | Ce qui est actif |
| --- | --- | --- |
| **Concentration** | mains rapprochées devant la poitrine | détecteur de signes ON, taijutsu OFF |
| **Combat** | mains hautes et écartées, garde ou frappe | taijutsu ON, détecteur de signes OFF |

Pourquoi c'est la bonne mécanique et pas un contournement : **c'est la règle de l'œuvre.**
Former des sceaux prend du temps et laisse ouvert — c'est précisément pour ça que les
ninjas s'interrompent mutuellement en pleine incantation. Le jeu hérite gratuitement de
la tension du manga.

La bascule doit être **visible** (teinte du HUD, bruitage discret) : le joueur doit
toujours savoir dans quel mode il est. Prévoir une **hystérésis** pour que l'indicateur
ne clignote pas à la frontière.

### 7.8 Le ralenti d'incantation

Mesuré sur le code existant : à 12 détections/s avec 2 confirmations par signe, un
Gōkakyū (6 signes) demande 3 à 4 secondes d'enchaînement parfait. Le Dragon d'eau de
Zabuza en demande 44. En face, les télégraphes de boss durent ~2 secondes.

Sans correction, seuls les jutsus de 2–3 signes seraient jouables en arcade et les deux
tiers du catalogue deviendraient décoratifs.

**Décision : entrer en posture de concentration ralentit le jeu** (~×0,35 sur les
ennemis, les projectiles et les télégraphes ; l'interface et le retour sur les signes
restent à vitesse normale).

Ce que ça donne :

- tout le catalogue redevient jouable, y compris les enchaînements longs ;
- le risque reste entier : pendant le ralenti tu ne peux **ni garder ni esquiver**, et
  un télégraphe lancé avant ton incantation continue d'avancer ;
- c'est un code visuel d'anime immédiatement lisible.

Le ralenti est un **paramètre du mode**, pas de la grammaire : le Dojo n'en a pas, et le
constructeur doit pouvoir le couper pour mesurer. Les constantes de détection, elles,
ne bougent pas.

---

## 8. Le corps comme manette

Tout ce qui suit repose sur le lecteur de posture. Chaque geste donne un retour
immédiat, même raté (anti-objectif §4).

| Geste | Lecture | Effet en jeu | Canon |
| --- | --- | --- | --- |
| **Frappe** | vitesse du poignet vers l'avant, bras qui se déplie | taijutsu : dégâts faibles, **sans chakra**, portée courte | oui |
| **Garde** | poignets près du visage, coudes serrés — position de boxe | réduit fortement les dégâts tant qu'elle est tenue ; ni frappe ni incantation possibles | oui |
| **Lancer** | mouvement de bras au-dessus de l'épaule, vers l'avant | kunai / shuriken, gratuits, à distance | oui, enseigné à l'Académie |
| **Esquive** | déplacement latéral du centre de masse, seuil calibré | évite une attaque télégraphiée | oui |
| **Immobilité** | variance des points proche de zéro | charge le mode ermite (§9.8) | oui — l'énergie naturelle exige l'immobilité |
| **Concentration** | signe tenu au-delà de 4 s (§7.6) | recharge le chakra | oui, le Tigre est le sceau de concentration |

### 8.1 Les armes

Elles règlent un problème réel : **jauge de chakra vide, tu ne dois pas rester planté.**
Elles sont donc gratuites.

- **Shuriken** — lancer simple, dégâts faibles, cadence rapide.
- **Kunai** — plus de dégâts, plus lent.
- **Parchemin explosif** (起爆札, *kibaku fuda*) — se **colle à un kunai** avant le
  lancer : dégâts de zone à l'impact, avec un délai. Le combo canon par excellence.
  Ressource limitée par mission, pas gratuite.
- **Shuriken Kage Bunshin** — déblocable : un shuriken lancé se démultiplie.

### 8.2 Le Kawarimi, bouton panique

La **permutation** (l'effet `permutation` existe déjà) : enchaînement court, esquive une
attaque garantie, coût en chakra élevé. Technique défensive de base de l'œuvre, et
sortie de secours quand on a mal lu un pattern.

### 8.3 Le taijutsu : une grammaire, deux alphabets

Le catalogue actuel ne contient **aucun taijutsu**. C'est le plus gros manque de contenu,
et c'est la famille qui exploite nativement le lecteur de posture : elle ne demande
**aucun signe**.

La grammaire (§7.6) travaille sur des **jetons**, pas sur des signes de mains. Un geste
du corps est donc un jeton, et une technique de taijutsu est une séquence — même classe
`Sequence`, deuxième alphabet. Les tests de grammaire couvrent le taijutsu sans une
ligne de plus.

**Les jetons corporels**, lisibles sur les 33 points :

`directG` · `directD` · `crochet` · `paume` · `coupDePied` · `rotation` · `garde` ·
`saut` · `accroupi` · `brasCroises`

**Les techniques :**

| Technique | Enchaînement | Note |
| --- | --- | --- |
| **Konoha Senpū** | coupDePied + coupDePied | Lee |
| **Shishi Rendan** | direct + direct + coupDePied + coupDePied | Sasuke |
| **Gatsūga** | rotation **tenue** | Kiba |
| **Hakkeshō Kaiten** | rotation + garde | Neji — **défense** déclenchée au corps |
| **Omote Renge** | saut + coupDePied | Lee |
| **Hakke Rokujūyon Shō** | 8 paumes en moins de 3 s | Neji — **cadence**, pas séquence |
| **Huit Portes** | brasCroises tenus, une porte par palier | voir plus bas |

**Trois conséquences pour le constructeur :**

1. Le 64 Poings introduit un **troisième mode** à côté de « séquence » et « tenue » :
   la **cadence** (N jetons en T secondes). Petite extension de la grammaire.
2. Les jetons corporels sont **plus bruités** que le détecteur de signes. Même
   discipline qu'aujourd'hui : fenêtre de confirmation, fenêtre de combo (~1,2 s avant
   remise à zéro), hystérésis. Les seuils se règlent au banc de rejeu (§11).
3. Aucune ambiguïté avec les signes grâce aux deux postures (§7.7) : les jetons
   corporels ne comptent qu'en **posture de combat**, les signes qu'en **concentration**.

**Les Huit Portes** (Hachimon) sont l'ultime du taijutsu : Kaimon (Ouverture), Kyūmon
(Repos), Seimon (Vie), Shōmon (Blessure), Tomon (Limite), Keimon (Vue), Kyōmon
(Merveille), Shimon (Mort). Le game design sort du canon : **chaque porte ouverte inflige
des dégâts au joueur**, et la huitième tue. C'est le pari le plus tendu du jeu.

Le taijutsu est aussi la vraie réponse au « chakra vide », bien plus que les shuriken.

---

## 9. Le pack Naruto : le contenu

### 9.1 Le cycle élémentaire

Vérifié sur la Narutopedia. Chaque élément bat le suivant dans le sens horaire :

```text
Feu (火) ▶ Vent (風) ▶ Foudre (雷) ▶ Terre (土) ▶ Eau (水) ▶ Feu
```

Le Feu bat le Vent et perd contre l'Eau ; le Vent bat la Foudre et perd contre le Feu ;
la Foudre bat la Terre et perd contre le Vent ; la Terre bat l'Eau et perd contre la
Foudre ; l'Eau bat le Feu et perd contre la Terre.

Chaque ennemi a une affinité. Taper avec l'élément fort fait très mal, avec l'élément
faible il encaisse. C'est ce qui empêche de gagner en répétant Gōkakyū.

### 9.2 Comment un jutsu touche — le point structurant

Les 52 effets actuels sont plein écran et centrés sur le joueur : ils reçoivent
`{ t, l, h, main, video, personne, dessinerCadre, secouer }` et **ne connaissent ni
cible, ni position d'ennemi, ni collision**.

**Décision : les dégâts s'appliquent à l'impact, avec une migration progressive.**

1. Le moteur gagne une couche `scene/` : les ennemis sont des **entités** avec une
   position à l'écran, une boîte, des PV. Ils sont dessinés dans le même canvas 2D,
   au moment `derriere` du contrat d'effet — donc derrière ta silhouette, ce qui donne
   gratuitement la profondeur (tu es au premier plan, ils arrivent derrière).
2. Le contrat d'effet est **étendu, pas remplacé** : un effet peut désormais déclarer
   une **zone d'impact** et un **instant d'impact**. Les effets qui ne les déclarent pas
   gardent exactement le comportement actuel.
3. Un effet sans zone déclarée applique ses dégâts **au lancement**, à tout ce qui est à
   portée. C'est l'état de départ des 52 effets : **l'arcade est jouable dès le premier
   jour**, sans avoir rouvert un seul fichier d'effet.
4. On convertit ensuite les effets un par un, en commençant par les jutsus phares
   (Rasengan, Chidori, Gōkakyū, les murs défensifs). Chaque conversion améliore le jeu
   sans rien casser.

**Le ciblage est automatique** (ce qui est dans la zone est touché), sauf pour les
effets qui suivent la main — `main` existe déjà dans le contexte et donne la seule
donnée spatiale fiable. Le Rasengan se place donc là où est ta main, naturellement.

### 9.3 Les données à produire : rang, élément, rôle

`donnees.js` ne contient **ni rang, ni élément, ni coût** — seulement un `type`. Or les
dégâts reposent sur le rang canon et le cycle élémentaire. Il faut donc enrichir les
52 entrées. **Ce ne sont pas des valeurs à régler en jouant : ce sont des faits de
l'œuvre**, et l'anti-objectif « du faux Naruto » s'applique.

Trois champs à ajouter, sourcés sur la Narutopedia, avec le champ `source` déjà présent
dans les données (`"anime"` / `"appli"`) :

- **`rang`** : E, D, C, B, A, S. Pour les jutsus sans rang publié → `null`, et la
  puissance se déduit du nombre de signes.
- **`element`** : l'un des cinq, ou `null`. Une vingtaine de jutsus n'appartiennent à
  aucun (Ninjutsu, Genjutsu, Fūinjutsu, Iryō, Dōjutsu) : **multiplicateur neutre ×1**,
  hors cycle, ni forts ni faibles contre quoi que ce soit. Le **Mokuton** est traité
  pareil : hors cycle, neutre.
- **`role`** : `attaque` / `defense` / `utilitaire` / `dojo`. Indispensable, parce que
  le catalogue actuel est une **démonstration tournée vers soi**, pas un arsenal :
  `tsukuyomi`, `visionEnfer` et `arbre` déforment l'écran **du joueur** ; `edoTensei`
  grise **la silhouette du joueur** ; `estomac` et `prisonDeBois` **enferment le
  joueur** ; `henge`, `maison`, `foret`, `soin`, `sceau`, `shinigami` n'ont aucun sens
  offensif. Ceux-là sont marqués `dojo` et n'apparaissent pas en arcade tant qu'une
  variante offensive n'a pas été écrite.

### 9.4 Les genjutsus en arcade

Quand **Itachi** lance un genjutsu sur toi, la pénalité doit rendre le « Kai ! » vital.
Décision : pendant l'illusion, **les signes sont bloqués** (tu ne peux plus incanter) et
le **chakra fuit**. Seul le Bélier passe — c'est exactement le Kai de l'anime, et la
mécanique existe déjà (`SIGNE_KAI`, `rompreGenjutsu`).

Les effets de genjutsu existants se réutilisent tels quels pour la déformation d'écran :
c'est le seul cas où un effet « tourné vers le joueur » est exactement ce qu'il faut.

### 9.5 Le bestiaire et son visuel

**Décision : silhouettes à l'encre** (style *sumi-e*), pour les mobs comme pour les boss.
Chacun est reconnaissable à sa carrure et à **un attribut** : l'épée de Zabuza, le
manteau Akatsuki, le masque ANBU, l'argile de Deidara.

Pourquoi : peu d'assets, animable en SVG, cohérent avec l'habillage parchemin du HUD, et
aucune question de ressemblance avec des personnages protégés dans un dépôt public.

Quatre états par entité : apparition, télégraphe, touché, mort.

Les ennemis, canon :

- **Zetsu blancs** — l'armée de clones identiques de la Quatrième Guerre. Le mob parfait.
- **Genin et Chūnin déserteurs** — les vagues basses, une affinité chacun.
- **ANBU Racine** — plus rapides, en groupe, forcent la garde.
- **Edo Tensei** — ressuscités : ils se reforment une fois. **Attention :** l'effet
  `edoTensei` existant s'applique au joueur et ne fournit rien pour un ennemi qui se
  reforme. C'est un **nouvel effet à écrire**, pas un effet à réutiliser.

### 9.6 Les boss

| Mission | Boss | Pourquoi lui |
| --- | --- | --- |
| Rang C | **Zabuza Momochi** | Suiton + brume : l'effet `brume` existe, le brouillard cache les ennemis |
| Rang B | **Kisame Hoshigaki** | absorbe le chakra : force à sortir les armes gratuites |
| Rang B+ | **Deidara** | explosions à distance : apprend l'esquive au corps |
| Rang A | **Itachi Uchiha** | Katon + genjutsu : le « Kai ! » devient vital (§9.4) |
| Rang S | **Madara Uchiha** | tous les éléments, enchaîne les patterns des précédents |

**Pattern lisible** : le boss télégraphie pendant ~2 secondes, l'élément est affiché en
clair, et il y a quatre réponses — esquiver au corps, garder, contrer avec un jutsu
défensif, ou surpasser avec l'élément fort. Jamais d'attaque non annoncée.

**À prévoir** : les attaques de boss n'existent dans aucun des 52 effets (seul `brume`
sert vraiment Zabuza). C'est un lot d'effets **nouveaux**, à chiffrer à part.

### 9.7 Les missions d'arcade

Rangs canon (D à S) :

| Rang | Vagues | Boss | Accessible à partir de |
| --- | --- | --- | --- |
| D | 3 | — | Genin |
| C | 5 | 1 (vague 5) | Genin |
| B | 10 | 2 (vagues 5 et 10) | Chūnin |
| A | 15 | 3 | Jōnin |
| S | 20 | 4 + final | Jōnin |

Le boss de la vague 5 d'une mission de rang B est **le même** que celui du rang C : tu le
retrouves plus fort, tu sais déjà le lire. Une partie de rang C vise **5 à 6 minutes**.

### 9.8 Grades, examens, déblocages

Échelle canon : **Académie → Genin → Chūnin → Jōnin → Kage**. L'**ANBU n'est pas un
grade** : c'est une unité d'élite recrutée parmi les Jōnin et Chūnin confirmés. Elle
devient une **voie parallèle** débloquée au Jōnin, avec ses missions et le masque animal.

Monter de grade se fait en deux temps : **remplir une condition en arcade**, ce qui ouvre
le droit de passer l'examen, puis **passer l'examen à l'Académie** — un écran dédié, des
jutsus précis à exécuter, chronométré, sans ennemi.

Les examens suivent l'œuvre :

- **Académie → Genin** : le **Bunshin no jutsu**. C'est littéralement l'examen de sortie,
  celui que Naruto rate trois fois.
- **Genin → Chūnin** : l'**examen Chūnin**, en épreuves — précision, vitesse, combat.
- **Chūnin → Jōnin** : pas d'examen dans l'œuvre, c'est une **recommandation** — donc un
  palmarès à atteindre, pas une épreuve.
- **Jōnin → Kage** : une mission de rang S réussie.

Chaque grade **ouvre des jutsus**, répartis selon leur rang canon (§9.3).

### 9.9 Le clan, la fiche ninja, le contrat

**Pas de clans canon à choisir** (demande explicite). Le joueur appartient à un clan
**inventé**, le sien.

La fiche se remplit une fois, en trois questions, **au premier clic sur Arcade** — jamais
au lancement, pour ne pas barrer la route du premier jutsu : ton nom de ninja et le nom
de ton clan (libres), ton village (Konoha, Suna, Kiri, Iwa, Kumo — détermine le bandeau),
ton contrat d'invocation.

Prétexte de lore, assumé : ton clan n'a pas une affinité, il a l'**adaptation** — il
apprend ce qu'il voit. Ça explique qu'un seul personnage finisse avec toutes les
techniques, sans écraser un clan canon.

### 9.10 Le contrat décide de la voie — et des variantes du mode ermite

Vérifié : Jiraiya a appris le senjutsu au **mont Myōboku** auprès de **Fukasaku et
Shima**, et c'est lui qui y envoie Naruto — l'« examen de Jiraiya » est donc exact.
Orochimaru et Kabuto ont appris le leur à la **grotte Ryūchi**, auprès du Sage Serpent
Blanc. En revanche **aucun ermite des limaces n'est confirmé dans le manga** : ni Tsunade
ni Sakura n'y parviennent.

Plutôt que d'inventer, chaque contrat ouvre une spécialité différente, toutes fondées
dans l'œuvre :

| Contrat | Lieu | Ce que ça ouvre | Canon |
| --- | --- | --- | --- |
| **Crapauds** | Mont Myōboku | Mode Ermite des Crapauds — **examen de Jiraiya** | oui |
| **Serpents** | Grotte Ryūchi | Mode Ermite des Serpents — examen du Sage Serpent Blanc | oui |
| **Limaces** | Forêt Shikkotsu | pas de mode ermite → **spécialité soin** (Katsuyu se divise et soigne) | oui |
| **Chiens ninja** | — | pas de mode ermite → **pistage** : ils voient à travers la brume de Zabuza | oui, c'est l'usage de Kakashi |

Chaque contrat devient un vrai choix de build, et refaire une partie avec un autre change
réellement la façon de jouer.

### 9.11 Kekkei genkai, dōjutsu, invocations

Tous **débloquables**, jamais disponibles au départ.

- **Dōjutsu** : Sharingan → Mangekyō Sharingan → **Rinnegan** → **Rinne Sharingan**.
  Les deux derniers sont les déblocages de toute fin, explicitement demandés.
- **Kekkei genkai** : Mokuton, Hyōton, et les autres au choix du constructeur.
- **Invocations** : jauge Kuchiyose qui se remplit en enchaînant des jutsus ; pleine,
  les signes de Kuchiyose font venir ton invocation, qui se bat ~15 secondes.

### 9.12 Cosmétiques

Règle : **ça se voit sur la caméra**, sinon ça ne sert à rien.

- le **bandeau du village** posé en AR sur ton front, suivant ta tête (§7.4) ;
- la **couleur de ton chakra** et l'aura autour de ta silhouette ;
- le **masque ANBU** (animal) ;
- le **titre** affiché sous ton nom.

Tout est redessiné en SVG pour le projet. Les symboles de village sont des glyphes
simples, les masques ANBU aussi. Aucun fichier tiré de l'anime.

### 9.13 La refonte des créatures — dette à rembourser

Audit des 52 effets : **onze d'entre eux reposent sur un emoji** comme élément central.

| Effet | Emoji | Jutsu |
| --- | --- | --- |
| `metamorphose` | 🦊 | Henge |
| `invocation` | 🐸 | Gamabunta |
| `chiens` | 🐕 | les ninken de Kakashi |
| `requin` | 🦈 | Suikōdan |
| `dragonDeFeu`, `dragonDEau`, `dragonDeTerre`, `kirin` | 🐉 | **le même dragon quatre fois**, différencié par un simple `hue-rotate` |
| `porte`, `shinigami` | 👹 | Rashōmon, Shiki Fūjin |
| `foret` | 🌳 | Mokuton |

Autrement dit, **toutes les créatures du jeu sont des emoji**, et ça tombe précisément
sur les jutsus les plus spectaculaires du catalogue. Signalé explicitement par le
propriétaire comme décevant.

**Ça ne coûte presque rien à réparer** : c'est le même atelier que les silhouettes à
l'encre des ennemis (§9.5). Les quatre dragons deviennent quatre créatures réellement
distinctes, dessinées dans le même style que Zabuza et les Zetsu. Un seul chantier
graphique couvre les ennemis **et** les créatures.

Priorité : les quatre dragons d'abord (c'est le raccourci le plus visible), puis
Gamabunta, les ninken, le requin, le renard, Rashōmon, le Shinigami, les arbres.

### 9.14 Le contenu à ajouter

Validé en bloc par le propriétaire. À étaler sur la progression, pas à livrer d'un coup.

**Taijutsu** (§8.3) — prioritaire : rentabilise le lecteur de posture, ne demande aucun
signe, et répond au problème du chakra vide.

**Rééquilibrer les éléments.** Le catalogue est déséquilibré : 7 Suiton contre
3 Raiton et 4 Doton, alors que le cycle élémentaire force à varier.

- *Raiton* : Raikiri, Chidori Nagashi (décharge circulaire — anti-nuée), Chidori Senbon,
  Raiton no Yoroi (armure du Raikage), Gian.
- *Doton* : Shinjū Zanshu (enterre l'ennemi jusqu'au cou), Yomi Numa (marais de Jiraiya,
  immobilise une vague entière), Doryū Taiga, Iwa Yado Kuzushi.
- *Katon* : Gōryūka, Hibashiri, Zukokku.

**Le Rinnegan** — demandé explicitement, et aujourd'hui les 5 dōjutsu du catalogue sont
tous Sharingan. Le Rinnegan n'a **aucune technique**. Or c'est idéal contre des vagues :

- *Shinra Tensei* — repousse tout ; *Banshō Ten'in* — attire une cible hors du groupe ;
- *Chibaku Tensei* — aspire plusieurs ennemis dans une sphère de roche ;
- *Gedō : Rinne Tensei* — tu reviens une fois après ta mort.
- Puis **Rinne Sharingan → Mugen Tsukuyomi** au tout dernier palier.

**Kekkei genkai** — contenu de fin, combinaisons de natures vérifiées :

| Kekkei genkai | Natures | Porteur canon |
| --- | --- | --- |
| Hyōton (Glace) | Eau + Vent | Haku, clan Yuki |
| Shakuton (Calcination) | Feu + Vent | Pakura |
| Yōton (Lave) | Feu + Terre | Rōshi, Mei |
| Futton (Vapeur) | Feu + Eau | Mei |
| Ranton (Orage) | Foudre + Eau | Darui |
| Jiton (Magnétisme) | Terre + Vent | Troisième Kazekage |
| Bakuton (Explosion) | Terre + Foudre | Deidara, Gari |
| **Jinton (Poussière)** | Terre + Vent + Feu | Ōnoki — **kekkei tōta**, trois natures |
| Shikotsumyaku | — | Kimimaro ; du taijutsu, pas de l'élémentaire |

Le Jinton est le dernier déblocage avant les dōjutsu : trois natures, c'est explicitement
au-dessus du reste dans l'œuvre.

**Hiden de clan** — `ombre` (Kagemane) existe déjà ; il manque le reste du trio :
Baika no Jutsu (Akimichi), Shintenshin (Yamanaka — tu contrôles un ennemi, qui tape ses
alliés), Kikaichū (Aburame — les insectes drainent le chakra).

**L'ultime absolu** : **Bijūdama** via le mode Kurama, tout en haut de l'arbre, après le
Rinnegan.

**Ordre recommandé :** taijutsu → Rinnegan → Raiton et Doton → hiden de clan → kekkei
genkai → Bijūdama.

---

## 10. Interface

### 10.1 Le HUD d'arcade — validé en maquette

**Style « parchemin »** : jauges en rouleaux, compteur de vagues en sceau, kanji dans
l'habillage. Avec une correction explicite du propriétaire :

> les kanji sont stylés mais si on ne sait pas les lire…

Donc **jamais de kanji seul** : 命 est toujours accompagné de « Vie / Life », 気 de
« Chakra », 口 de « Invocation / Summon », et le sceau de vague affiche « 3/5 » en
chiffres arabes. Le kanji décore, il n'informe jamais tout seul.

Jauges : vie, chakra, invocation. Plus l'indicateur de **posture** (§7.7) et le stock
d'armes.

### 10.2 Le guide de signes — validé en maquette

**Le défilé à trois** : le signe que tu viens de valider (à gauche, estompé, coché),
celui à faire maintenant (au centre, en grand, surligné), le suivant (à droite, petit).
Ça défile à chaque validation.

Le problème que ça résout, formulé par le propriétaire : *« quand on veut faire un jutsu
on dit le signe mais on oublie le visuel »*. L'appli écrit « Tigre » et décrit la
position en texte ; personne ne forme un signe à partir d'une phrase.

**Les images sont des dessins SVG faits pour le projet** (validé contre les photos) :
14 illustrations, même style, fond transparent, lisibles en clair comme en sombre,
animables. Aucun problème de licence.

Voir le signe suivant permet d'anticiper, donc d'enchaîner vite : c'est ce qui transforme
les jutsus longs en plaisir plutôt qu'en corvée.

### 10.3 La calibration

Avant la première partie d'arcade : on voit tes mains ? assez de lumière ? tout le buste
dans le cadre ? recule un peu ? Elle obtient le cadrage de référence (§7.4), **et** c'est
pendant cet écran qu'on précharge la posture et le détourage.

### 10.4 L'enregistreur de clip

« Garder les 10 dernières secondes », via `MediaRecorder` sur le canvas existant. Deux
usages : les READMEs animés ont besoin de vraies images de jeu, et le pote qui teste
trois signes aura envie d'envoyer le clip.

### 10.5 Le chrono du Dojo

Tu choisis un jutsu, tu l'exécutes le plus vite possible, ton record est gardé.
Rejouabilité quasi gratuite, et le meilleur entraînement possible pour l'arcade.

### 10.6 Langues

Français par défaut, anglais complet. Les noms japonais (kanji, romaji) ne se traduisent
pas : seuls les noms communs et les descriptions existent en deux versions.

### 10.7 Structure des écrans

```text
Accueil
├── Dojo            ← le mode libre actuel : caméra, tu fais ce que tu veux, + chrono
├── Arcade          ← missions D à S  (→ fiche ninja au premier passage, puis calibration)
├── Académie        ← examens de passage de grade
├── Encyclopédie    ← les 14 signes, les 52 jutsus, les armes, ce que tu as découvert
└── Fiche ninja     ← grade, clan, village, contrat, cosmétiques, progression
```

Le Dojo est l'entrée par défaut : un pote clique « Ouvrir la caméra » et fait un signe.

---

## 11. Qualité et outillage

- **Vite** pour le build et le serveur de dev, avec deux profils (§6).
- **TypeScript strict.** Les identifiants d'effets et de jetons deviennent des types
  fermés — une faute de frappe ne compile plus. Noms de variables **en français**, comme
  le code existant.
- **Le banc de rejeu** (`moteur/rejeu/`) est un **composant obligatoire, à construire
  tôt** : il rejoue des détections et des points de posture enregistrés, sans webcam.
  Sans lui, aucun équilibrage ni débogage de l'arcade n'est possible sans que le
  propriétaire se mette devant la caméra, et aucun geste n'est testable. Il faut donc
  aussi un petit enregistreur de sessions (signes + posture + horodatage) et un corpus
  des 14 signes.
- **Vitest** sur la logique pure :
  - la grammaire (validation d'un jeton, séquences, variantes, **paliers de tenue**,
    attente, oubli) ;
  - la **machine à postures** (hystérésis comprise) et la reconnaissance de gestes,
    sur des séquences de points rejouées ;
  - le combat (cycle élémentaire, dégâts, zones d'impact, coût en chakra, garde, armes) ;
  - la progression (conditions de grade, déblocages, sauvegarde et migration) ;
  - **l'intégrité des données** : chaque technique pointe un effet qui existe, n'utilise
    que des jetons connus, a un `role` et un `element` renseignés, n'a pas de séquence
    vide ; aucune séquence n'est le préfixe d'une autre d'une façon qui rendrait un jutsu
    inatteignable. Avec 52 enchaînements, ce test attrapera de vraies régressions.
- **Playwright**, un test de fumée : la page charge avec une fausse webcam
  (`--use-fake-device-for-media-stream`, alimentée par le corpus), les modèles se
  chargent, le canvas se dessine.
- **ESLint + Prettier**, avec la règle d'import qui interdit `moteur/ → packs/`.
- **Pas de test des effets visuels.** Coût élevé, valeur faible.

### Fichiers de dépôt à produire

- `.gitignore` — Node, build, `.superpowers/`.
- **Les modèles** (~4 Mo ONNX, ~250 Ko tflite, ~11 Mo posture) : commités en **Git LFS**.
  Un script de post-install serait plus léger, mais casserait le « clone et ça marche ».
  *(Appel du concepteur.)*
- `CLAUDE.md` — français dans le code, règle moteur/packs, où ajouter un jutsu, comment
  lancer les tests, **interdiction du nom civil** et de toute attribution Claude dans
  les commits.
- `LICENSE` — MIT pour le code, mention claire que Naruto ne l'est pas.
- `CONTRIBUTING.md` — court : comment ajouter un jutsu, comment ajouter un pack.
- CI GitHub Actions : lint + tests à chaque push.

Un `AGENTS.md` séparé n'est pas nécessaire : `CLAUDE.md` suffit tant qu'il n'y a qu'un
agent, et un fichier de plus qui dit la même chose finira désynchronisé. *(Appel du
concepteur — à contredire si d'autres outils que Claude Code sont utilisés.)*

---

## 12. Les deux READMEs

**README racine (Kata)** : le moteur, l'idée « les gestes de ton anime devant ta
webcam », la liste des packs (Kata disponible ; DBZ, JJK, JoJo envisagés), le lien
vers la démo en ligne, comment lancer en local, la pile technique, la feuille de route.
Ton neutre, pas naruto-centré.

**README du pack (Kata)** : habillage Naruto assumé — parchemin, kanji toujours
doublés du nom lisible (même règle que le HUD), les 14 signes, le tableau des 52 jutsus
par famille, le diagramme du cycle élémentaire, les boss, les grades, les contrats.

**Comment on anime ça**, par ordre de préférence :

1. **SVG animés** (CSS ou SMIL **dans** le fichier SVG) — bannière, cycle élémentaire qui
   tourne, enchaînement de signes qui défile. Léger, net, compatible clair/sombre via
   `prefers-color-scheme` dans le SVG.
2. **GIF / APNG enregistrés depuis le vrai jeu** via l'enregistreur de clip (§10.4).

Point à **vérifier et pas à supposer** : GitHub nettoie les SVG affichés dans un README
et bloque les scripts. Les animations CSS et SMIL passent généralement, pas toujours.
Pousser un SVG de test sur une branche et **regarder le rendu réel** avant de construire
les cinq autres. Sinon, repli sur l'APNG.

---

## 13. Nommage — validé

- **Projet / moteur : `Kagami`** (型, la forme codifiée des arts martiaux). Court, japonais,
  ne dit pas « Naruto », marche pour n'importe quel anime.
- **Pack Naruto : `Kata`**.

---

## 14. Ce qui est laissé au constructeur

- Toutes les **valeurs chiffrées** : PV, dégâts par rang, coûts en chakra, seuils de
  détection des gestes, facteur exact du ralenti, durée des télégraphes, vitesse des
  vagues, courbe d'XP. À régler en jouant — avec le banc de rejeu, pas à la main.
- Le **style graphique précis** des 14 signes SVG, des silhouettes d'ennemis et des
  cosmétiques.
- La **forme exacte** du type `Manifeste` et des interfaces du moteur.
- Le choix **lite / full** du Pose Landmarker par profil de build, en mesurant.
- La **composition de chaque vague** et les patterns détaillés de chaque boss.
- L'**ordre de conversion** des 52 effets vers les zones d'impact.
- Le choix `localStorage` / IndexedDB et la migration des clés `ninjutsu-*` existantes.

## 15. Décisions prises par le concepteur

Les quatre premières ont été validées explicitement par le propriétaire ; les suivantes
sont des appels du concepteur, à contredire librement.

**Validées :**

1. Dégâts **à l'impact**, avec migration progressive depuis « au lancement » (§9.2).
2. **Ralenti** du jeu pendant l'incantation (§7.8).
3. **Deux cibles** : local sans contrainte + démo en ligne allégée (§6).
4. Ennemis et boss en **silhouettes à l'encre** (§9.5).
4 bis. **Taijutsu** exécuté par jetons corporels, sur la même grammaire que les signes
   (§8.3), avec le troisième mode « cadence » pour le 64 Poings.
4 ter. **Refonte des créatures** emoji (§9.13) et **liste de contenu à ajouter** (§9.14),
   validées en bloc.

**Appels du concepteur :**

5. Règle à paliers pour les signes tenus (2,5 s → jutsu existant ; > 4 s → charge), qui
   résout la collision avec `shunshin` et le Rasengan sans supprimer de jutsu (§7.6).
6. Points 0–10 du Pose Landmarker pour le bandeau AR, pas de `FaceLandmarker` (§7.4).
7. Non-élémentaires et Mokuton → multiplicateur neutre, hors cycle (§9.3).
8. Champ `role` sur chaque jutsu ; les jutsus tournés vers le joueur sont `dojo` et
   n'entrent pas en arcade sans variante offensive (§9.3).
9. Genjutsu ennemi → signes bloqués + fuite de chakra, seul le Bélier passe (§9.4).
10. Banc de rejeu obligatoire et construit tôt (§11).
11. Modèles en **Git LFS** plutôt qu'un script de post-install (§11).
12. Rangs de mission D à S mappés sur 3 / 5 / 10 / 15 / 20 vagues (§9.7).
13. Boss : Zabuza, Kisame, Deidara, Itachi, Madara (§9.6).
14. Examens calqués sur l'œuvre ; contrat limaces → soin et chiens → pistage **au lieu
    d'inventer** un mode ermite non canon (§9.8, §9.10).
15. Un seul `CLAUDE.md`, pas d'`AGENTS.md`. Pas de monorepo.
16. Fiche ninja à l'entrée en arcade, jamais avant le Dojo (§9.9).

## 16. Plus tard, hors périmètre

- Le deuxième pack (DBZ, JJK, JoJo) — on prépare la place, on ne la remplit pas.
- Un éventuel entraînement de modèle maison.
- Le partage de score, le multijoueur.
