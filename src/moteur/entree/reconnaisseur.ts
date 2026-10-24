// L'interface d'entree du moteur.
//
// Le type vit dans moteur/types.ts parce que `Pack` le reference ; ce module le
// re-exporte pour que les packs aient un point d'import naturel, et porte la taille
// d'entree attendue, commune a tous les reconnaisseurs en vision.

export type { Detection, Image, Reconnaisseur } from "../types";
