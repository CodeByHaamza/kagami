// Resout un fichier de public/ en tenant compte du prefixe de deploiement.
//
// En local l'appli vit a la racine, mais sur GitHub Pages elle est servie
// sous /kagami/. Les chemins ecrits en dur comme "/modeles/x.task" y
// renvoyaient 404 : le navigateur allait les chercher a la racine du
// domaine, ou il n'y a rien.
//
// import.meta.env.BASE_URL vaut "/" en developpement et la valeur de `base`
// de vite.config au build. Il se termine toujours par une barre oblique.

/** Transforme "modeles/x.task" (ou "/modeles/x.task") en chemin servable. */
export function actif(chemin: string): string {
  return import.meta.env.BASE_URL + chemin.replace(/^\/+/, "");
}
