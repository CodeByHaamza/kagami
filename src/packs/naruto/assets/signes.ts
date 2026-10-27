// Les images de reference des signes, resolues par Vite.
//
// `import.meta.glob` donne des URL avec empreinte, valides quelle que soit la base du
// site — un chemin absolu comme `/signes/tigre.webp` casserait sous un sous-chemin.
//
// 14 signes complets : les 12 du zodiaque en .webp, et Gassho (mains) + Mizunoe en .svg.

const fichiers = import.meta.glob<string>("./signes/*.{webp,svg}", {
  eager: true,
  query: "?url",
  import: "default"
});

/** L'URL de l'image d'un signe, ou undefined s'il n'en a pas. */
export const IMAGES_SIGNES: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(fichiers).flatMap(([chemin, url]) => {
    const cle = chemin.replace("./signes/", "").replace(/\.(webp|svg)$/, "");
    if (cle === "gassho") {
      return [
        ["gassho", url],
        ["mains", url]
      ];
    }
    return [[cle, url]];
  })
);
