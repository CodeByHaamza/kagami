# Contribuer à Kagami

Trois choses qu'on peut ajouter : une technique, un effet, ou un pack d'anime entier.
Les trois passent par les mêmes règles.

## Les règles du dépôt

- **Le moteur ne connaît aucun anime.** `src/moteur/` n'importe jamais rien de
  `src/packs/`. ESLint le refuse, et un test le vérifie.
- **Le code est en français** : noms de variables, de fonctions, commentaires. C'est la
  langue du projet, pas celle de l'interface (qui est traduite).
- **Rien ne part sans test.** On écrit le test, on le regarde échouer, puis on écrit le
  code. Les effets visuels font exception : ils sont couverts par un test qui vérifie
  qu'ils ne jettent pas, pas par un test de rendu.
- **Les versions sont épinglées.** Pas de `^` dans `package.json`.
- **Aucun asset tiré d'une œuvre.** Tout est redessiné ou libre de droits.

## Ajouter une technique

1. Une entrée dans `src/packs/<pack>/donnees/jutsus.ts`. Le type impose son
   identifiant, son enchaînement de jetons et le nom de son effet — une faute de frappe
   ne compile pas.
2. Son nom et sa description dans `i18n/fr.ts` **et** `i18n/en.ts`. Un test refuse
   qu'une clé existe d'un seul côté.
3. Son effet dans `effets/`, s'il n'existe pas déjà.
4. `npm test` : le test d'intégrité vérifie que son enchaînement n'est identique à
   aucun autre — deux techniques avec la même suite en rendraient une injouable.

Les enchaînements doivent venir de l'œuvre. Quand il n'en existe pas (le Rasengan n'a
pas de signes dans l'anime), on l'invente et on le marque `source: "appli"`.

## Ajouter un effet

Un effet est un objet qui peut se dessiner à quatre moments : `fond` juste après la
vidéo, `derriere` entre le décor et la personne détourée, `personne` pour la remplacer,
`devant` par-dessus tout. C'est ce découpage qui permet à un clone de passer derrière
toi et à une boule de feu de passer devant.

```ts
monEffet: {
  duree: 2.5,
  son: "feu",
  depart(etat, e, particules) { /* une fois au lancement */ },
  devant(ctx, e, etat, particules) { /* à chaque image */ }
}
```

`e.t` est le temps écoulé depuis le début de l'effet, `e.main` la position des mains.
Le dessin se fait en pixels CSS : la densité d'écran est déjà appliquée.

## Ajouter un geste du corps

Un geste est un **jeton**, exactement comme un signe de mains : une fois qu'il existe,
la grammaire l'assemble sans rien savoir de plus. L'ajouter se fait en quatre endroits,
tous dans `src/moteur/corps/`.

1. Son nom dans le type `JetonCorps` (`gestes.ts`). Le compilateur se charge du reste :
   une technique qui le réclame sans qu'il existe ne compile pas.
2. Sa **mesure**, dans `reperes.ts`, si elle n'y est pas. Ce sont des fonctions pures
   sur une posture, et elles se normalisent **en largeurs d'épaules** — un seuil doit
   valoir pareil à un mètre de la caméra et à trois, pour une grande personne et pour
   une petite. Jamais de pixels, jamais de coordonnées brutes.
3. Sa **reconnaissance**, dans `LecteurDeGestes.chercher()`. L'ordre des tests compte :
   le premier qui répond gagne. La garde passe avant les frappes parce qu'un bras qui
   se détend depuis une garde n'est pas un direct.
4. Son **verrou**, dans `relacherLesVerrous()`. Sans lui le geste se redéclenche à
   chaque image tant que la pose dure. Un geste n'est de nouveau disponible qu'après un
   retour à l'état de départ.

Le test va avec, dans `tests/unitaires/gestes.test.ts`, et il pèse **des deux côtés** :
un cas qui déclenche, et au moins un qui ne doit pas. Un jeu de gestes qui part quand
on se gratte est plus insupportable qu'un jeu qui demande de s'y reprendre à deux fois
— la moitié des tests du fichier vérifient que *rien* ne se passe.

> **Les seuils ne se devinent pas.** Ceux qui existent sont des points de départ. On les
> règle au banc de rejeu (`?banc` dans l'adresse) : il enregistre une session, la
> rejoue à la place de la caméra, et affiche la posture, le dernier geste, l'immobilité
> et la fiabilité des points. On compare des nombres, pas des impressions.

Pour qu'un geste déclenche quelque chose, il faut ensuite une technique qui le
consomme : une entrée dans `donnees/taijutsu.ts` du pack, avec son effet et ses textes,
selon les mêmes règles qu'un jutsu.

## Ajouter un pack d'anime

Un pack est un dossier sous `src/packs/` avec un `manifeste.ts` qui déclare son
alphabet de jetons, son catalogue, ses effets, son reconnaisseur et ses textes.

Le point dur n'est pas le catalogue, c'est **l'entrée** : le modèle de Kata reconnaît
14 signes de mains et ne resservira pas. Un pack basé sur les poses du corps fournira
son propre `Reconnaisseur`, avec la même interface.

## Les commandes

```bash
npm test           # tests unitaires et vérification des types
npm run test:e2e   # tests dans un vrai navigateur (démarrer npm run dev à côté)
npm run lint
npm run build
npm run dev:reseau # HTTPS sur le réseau local, pour essayer depuis un téléphone
```

Pas de webcam sur la machine ? `npm run dev:reseau` sert l'appli en HTTPS : on l'ouvre
depuis un téléphone et on accepte l'avertissement du certificat auto-signé une fois. En
clair sur une adresse `192.168.x.x`, `getUserMedia` n'existe pas — c'est la règle du
contexte sûr, pas un bug de l'appli.
