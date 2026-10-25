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

## Ajouter un pack d'anime

Un pack est un dossier sous `src/packs/` avec un `manifeste.ts` qui déclare son
alphabet de jetons, son catalogue, ses effets, son reconnaisseur et ses textes.

Le point dur n'est pas le catalogue, c'est **l'entrée** : le modèle de Kata reconnaît
14 signes de mains et ne resservira pas. Un pack basé sur les poses du corps fournira
son propre `Reconnaisseur`, avec la même interface.

## Les commandes

```bash
npm test           # tests unitaires et vérification des types
npm run test:e2e   # test de fumée dans un navigateur (démarrer npm run dev à côté)
npm run lint
npm run build
```
