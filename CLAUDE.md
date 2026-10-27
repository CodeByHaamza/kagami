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
| `src/moteur/` | générique : entrée, corps, grammaire, scène, jeu, rendu, rejeu, son, i18n, stockage |
| `src/packs/naruto/` | Kata : données, reconnaisseur, effets, silhouettes à l'encre, textes |
| `src/app/` | le câblage, et rien d'autre |
| `public/modeles/` | les modèles, suivis par Git LFS |
| `public/mediapipe/` | recopié depuis `node_modules` par `scripts/preparer.mjs`, pas versionné |
| `docs/superpowers/` | la conception et les plans |

## Le corps

Deux entrées lisent la même caméra : le reconnaisseur de signes, et le lecteur de
posture (MediaPipe Pose Landmarker, 33 points). Elles ne tournent **jamais en même
temps** — c'est `src/moteur/entree/ordonnanceur.ts` qui arbitre, selon la posture :

| Posture | Ce qui écoute | Comment on y entre |
| --- | --- | --- |
| **concentration** | les signes de mains | poignets joints devant le corps |
| **combat** | les gestes du corps | poignets au-dessus des épaules, ou garde |
| **neutre** | rien | tout le reste |

La règle fait deux choses à la fois. Techniquement, elle libère le temps machine que
trois modèles ne peuvent pas se partager, et elle lève l'ambiguïté entre un signe et un
coup — les deux se font avec les mains. Mais c'est aussi la règle de l'œuvre : former
des sceaux prend du temps et laisse ouvert. **Toute bascule de posture vide
l'enchaînement en cours**, dans les deux sens ; sinon un jutsu partirait tout seul au
retour.

Les gestes sont un **second alphabet pour la même grammaire** : la classe `Sequence`
assemble `JetonCorps` exactement comme elle assemble des signes. Le taijutsu et les
armes en sortent sans une ligne de grammaire en plus.

Toutes les mesures du corps sont normalisées **en largeurs d'épaules**
(`src/moteur/corps/reperes.ts`) : un seuil vaut pareil à un mètre de la caméra et à
trois, pour une grande personne et pour une petite.

### Les seuils, et le banc

Les seuils de gestes vivent à deux endroits : `SEUILS` dans `corps/reperes.ts` (ce qui
définit une posture) et `REGLAGES_PAR_DEFAUT` dans `corps/gestes.ts` (ce qui définit un
mouvement). **Ce sont des points de départ, pas des mesures.**

On ne les règle pas en bougeant devant une webcam jusqu'à ce que ça marche : ça n'est
ni reproductible ni mesurable. On les règle au **banc de rejeu**, qui s'ouvre avec
`?banc` dans l'adresse :

```text
http://localhost:5173/?banc
```

Il enregistre ce que la caméra montre, le rend en fichier `.json`, et rejoue ce fichier
**à la place de la caméra** — le moteur ne voit pas la différence. Le panneau affiche en
direct la posture, le dernier geste, le dernier jeton validé, l'immobilité et la
fiabilité des points. C'est en lisant ces nombres qu'on décide d'un seuil.

### Essayer sans caméra sur la machine

`npm run dev:reseau` sert l'appli en HTTPS sur le réseau local, pour l'ouvrir depuis un
téléphone. Le certificat est auto-signé : le téléphone prévient une fois. En clair sur
une adresse `192.168.x.x`, `getUserMedia` n'existe pas — ce n'est pas l'appli qui
refuse, c'est la règle du contexte sûr.

## L'arcade

Les règles du combat vivent dans `src/moteur/jeu/` et `src/moteur/scene/` : elles ne
connaissent aucun anime. Tout ce qui est propre à Naruto — le cycle des cinq éléments,
le rang et le rôle de chaque technique, le bestiaire, les cinq boss, les cinq missions
de rang D à S — vient par `src/packs/naruto/donnees/`.

- **Rang, élément et rôle** (`donnees/profils.ts`) sont des **faits de l'œuvre**, pas
  des réglages. Un jutsu sans rang publié dans les databooks vaut `null`, et la
  puissance se déduit alors du nombre de signes. Les douze techniques qui déforment
  l'écran du joueur ou l'enferment sont marquées `dojo` : en arcade elles sont refusées
  sans retirer de chakra.
- **Le barème** (`BAREME` dans `jeu/degats.ts`), les réglages du joueur
  (`REGLAGES_JOUEUR` dans `jeu/joueur.ts`) et le facteur du **ralenti d'incantation**
  (`RALENTI_PAR_DEFAUT = 0.35` dans `jeu/horloge.ts`) sont des points de départ
  regroupés. Le ralenti est un paramètre du **mode**, jamais de la grammaire : le Dojo
  n'en a pas, et les constantes de détection tournent toujours en temps réel.

## La progression, les examens et la fiche ninja

La progression suit rigoureusement le canon de l'œuvre (§9.8–§9.11) :

- **Échelle canonique** : Académie → Genin → Chūnin → Jōnin → Kage.
  L'ANBU n'est pas un grade mais une unité d'élite débloquée à partir du rang Jōnin.
- **Déblocages par grade** (`src/moteur/progression/progression.ts`) :
  chaque grade ouvre l'accès aux techniques et aux missions du rang correspondant.
- **Passage de grade** :
  - *Académie → Genin* : Examen de sortie Bunshin no Jutsu.
  - *Genin → Chūnin* : Examen Chūnin (vitesse Shunshin et maîtrise élémentaire Gōkakyū) après réussite de la mission de rang C.
  - *Chūnin → Jōnin* : Recommandation (8 jutsus maîtrisés + mission rang B réussie).
  - *Jōnin → Kage* : Recommandation suprême (mission de rang S réussie).
- **Contrats d'invocation** (`src/moteur/jeu/contrat.ts`) :
  - *Crapauds* : Mode Ermite Myōboku (boost attaque ×1.5 sous concentration).
  - *Serpents* : Réflexe ermite Ryūchi (mue/substitution esquivant toute attaque).
  - *Limaces* : Forêt Shikkotsu (régénération vitale passive).
  - *Chiens ninja* : Pistage ninken (télégraphes ennemis ralentis / anticipés).
- **Chrono du Dojo** (`src/moteur/jeu/chrono.ts`) :
  chronométrage au centième de seconde de l'exécution des mudras pour battre ses records personnels.
- **Sauvegarde v2** (`src/moteur/stockage/sauvegarde.ts`) :
  migration automatique et transparente des données v1 vers v2 (fiche ninja, grade, missions, examens, records).

## Ajouter quelque chose

Un jutsu, un effet, un geste, un pack : voir [CONTRIBUTING.md](CONTRIBUTING.md).

Les réglages de détection (seuil `0.6`, deux confirmations, oubli à 4 s, tenue à 2,5 s,
attente à 1,5 s, palier de charge à 4 s) sont calés finement contre le bruit du modèle.
**Ne pas y toucher sans mesurer** : ils sont la différence entre une appli jouable et
une appli frustrante.
