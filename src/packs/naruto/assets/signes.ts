// Les images de reference des signes, resolues par Vite.
//
// `import.meta.glob` donne des URL avec empreinte, valides quelle que soit la base du
// site — un chemin absolu comme `/signes/tigre.webp` casserait sous un sous-chemin.
//
// Douze signes sur quatorze : la planche d'origine ne couvre que le zodiaque. Gassho et
// Mizunoe n'ont pas d'image, l'encyclopedie retombe alors sur le kanji.

const fichiers = import.meta.glob<string>("./signes/*.webp", {
  eager: true,
  query: "?url",
  import: "default"
});

/** L'URL de l'image d'un signe, ou undefined s'il n'en a pas. */
export const IMAGES_SIGNES: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(fichiers).map(([chemin, url]) => [
    chemin.replace("./signes/", "").replace(".webp", ""),
    url
  ])
);
