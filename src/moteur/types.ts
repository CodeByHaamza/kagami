// Les types du moteur.
//
// Le moteur ne connait aucun anime : il manipule des *jetons* (une unite reconnue par
// la camera) et des *techniques* (une suite de jetons qui declenche un effet). Pour
// Naruto un jeton est un signe de main ; pour un autre pack ce sera une pose du corps.
//
// Le contrat d'effet reprend celui de la version d'origine sans le changer : un effet
// peut se dessiner a quatre moments, ce qui lui permet de se glisser entre le decor et
// la personne detouree.

/** Les langues de l'interface. Les noms japonais (kanji, romaji) ne se traduisent pas. */
export type Langue = "fr" | "en";

/** Une unite reconnue par la camera. Chaque pack restreint ce type a son alphabet. */
export type Jeton = string;

/** Ce que la camera peut dessiner : la video, un canvas, une image. */
export type Image = CanvasImageSource;

/** Un contexte 2D, du canvas affiche ou d'un canvas hors ecran. */
export type Contexte2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

// ---- l'entree ----

/** Ce que le reconnaisseur a vu sur une image. La boite est en pixels de la video. */
export interface Detection<J extends string = string> {
  jeton: J;
  score: number;
  boite: { x1: number; y1: number; x2: number; y2: number };
}

/**
 * Transforme une image de la camera en un jeton. Propre a chaque pack : pour Naruto
 * c'est un YOLOX entraine sur 14 signes de mains, inutilisable pour un autre anime.
 */
export interface Reconnaisseur<J extends string = string> {
  charger(url: string): Promise<void>;
  reconnaitre(image: Image, largeur: number, hauteur: number): Promise<Detection<J> | null>;
}

// ---- le corps ----

/**
 * Un point du corps vu par le lecteur de posture, en **fraction de l'image** : x et y
 * vont de 0 a 1. Garder des fractions rend toutes les mesures independantes de la
 * resolution de la camera.
 */
export interface Point3 {
  x: number;
  y: number;
  /** La profondeur relative, dans la meme unite que x. */
  z: number;
  /** La confiance du modele sur ce point, de 0 a 1. */
  visibilite: number;
}

/** Le corps a un instant donne : les 33 points du modele, et quand ils ont ete lus. */
export interface Posture {
  points: readonly Point3[];
  /** L'horloge du navigateur, en millisecondes. */
  horodatage: number;
}

// ---- les techniques ----

/**
 * Une technique : une suite de jetons qui declenche un effet.
 * `variante` est une seconde suite acceptee ; `tenir` marque les techniques qui n'ont
 * qu'un jeton, a maintenir au lieu d'enchainer.
 *
 * Le nom courant et la description ne sont pas ici : ils se traduisent, donc ils vivent
 * dans les dictionnaires i18n, indexes par `id`. Kanji et romaji restent, eux ne se
 * traduisent pas.
 */
export interface Technique<J extends string = string> {
  id: string;
  type: string;
  kanji: string;
  romaji: string;
  signes: readonly J[];
  variante?: readonly J[];
  tenir?: boolean;
  /**
   * Un troisieme mode, a cote de « sequence » et « tenue » : N repetitions du meme
   * jeton dans un laps de temps. C'est ce qui rend une rafale jouissive a faire —
   * le 64 Poings du Hakke n'est pas un enchainement, c'est une cadence.
   */
  cadence?: { nombre: number; dans: number };
  /** Le jeton que la cadence compte. Ignore pour les autres modes. */
  jeton?: J;
  effet: string;
  source: "anime" | "appli";
}

// ---- les particules ----

export type ModeComposition = "lighter" | "source-over";

export interface Particule {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ay: number;
  taille: number;
  croissance: number;
  frein: number;
  duree: number;
  age: number;
  alpha: number;
  mode: ModeComposition;
  rotation: number;
  vrot: number;
  couleurs?: readonly string[];
  texte?: string;
}

/** Les champs sans valeur par defaut a la naissance d'une particule. */
export type NouvelleParticule = Pick<Particule, "x" | "y" | "taille" | "duree"> &
  Partial<Omit<Particule, "x" | "y" | "taille" | "duree">>;

export interface Particules {
  readonly liste: readonly Particule[];
  ajouter(p: NouvelleParticule): void;
  avancer(dt: number): void;
  dessiner(ctx: Contexte2D): void;
}

// ---- les effets ----

/**
 * L'etat propre a une instance d'effet, cree vide a son lancement. Chaque effet y range
 * ce qu'il veut : le contenu varie d'un effet a l'autre et n'est pas verifiable ici.
 * C'est la seule echappatoire au typage strict du projet, et elle est volontairement
 * confinee a cette ligne.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EtatEffet = Record<string, any>;

/** Les quatre moments ou un effet peut dessiner, dans l'ordre de composition. */
export type MomentEffet = "fond" | "derriere" | "personne" | "devant";

/** Tout ce dont un effet a besoin pour se dessiner sur une image. */
export interface ContexteEffet {
  /** L'horloge du navigateur, en millisecondes. */
  temps: number;
  /** Le temps ecoule depuis l'image precedente, en secondes, plafonne. */
  dt: number;
  /** Le temps ecoule depuis le debut de cet effet, en secondes. */
  t: number;
  /** La largeur et la hauteur de l'ecran, en pixels CSS. */
  l: number;
  h: number;
  /** Ou sont les mains a l'ecran, et leur rayon. */
  main: { x: number; y: number; r: number };
  video: Image;
  /** La personne detouree, si le detourage est pret et qu'un effet l'a demandee. */
  personne?: Image;
  /** De quoi cacher la personne, ou null si le detourage n'est pas disponible. */
  couverture: (() => Image) | null;
  /** Redessine une image a la place de la video, miroir et cadre deja appliques. */
  dessinerCadre: (ctx: Contexte2D, image: Image, decalage?: number, zoom?: number) => void;
  /** Secoue toute l'image ; la force la plus forte de l'image gagne. */
  secouer: (force: number) => void;
  jouer: (nom: string, ...options: readonly number[]) => void;
}

/**
 * Un moment de dessin. Renvoyer `true` depuis `personne` signale que l'effet a dessine
 * lui-meme la personne, et que le moteur ne doit pas la redessiner par-dessus.
 */
export type FonctionMoment = (
  ctx: Contexte2D,
  e: ContexteEffet,
  etat: EtatEffet,
  particules: Particules
) => boolean | void;

export interface Effet {
  /** Combien de temps l'effet vit, en secondes. */
  duree: number;
  son?: string;
  /** Un son de plus, joue au lancement. */
  sonDepart?: string;
  /** L'effet a besoin de la personne detouree. */
  silhouette?: boolean;
  /** L'effet est une illusion : le jeton « Kai » la rompt. */
  genjutsu?: boolean;
  /** L'effet utilise la scene 3D. */
  rasengan3d?: boolean;
  depart?: (etat: EtatEffet, e: ContexteEffet, particules: Particules) => void;
  fond?: FonctionMoment;
  derriere?: FonctionMoment;
  personne?: FonctionMoment;
  devant?: FonctionMoment;
}

// ---- le pack ----

/**
 * Un pack d'anime : son alphabet de jetons, son catalogue de techniques, ses effets et
 * le reconnaisseur qui lit la camera. C'est le seul point par lequel le moteur apprend
 * quelque chose d'un anime.
 */
export interface Pack<J extends string = string> {
  id: string;
  nom: string;
  jetons: readonly J[];
  techniques: readonly Technique<J>[];
  effets: Readonly<Record<string, Effet>>;
  /** Le chemin du modele de reconnaissance, servi depuis public/. */
  modele: string;
  reconnaisseur: () => Reconnaisseur<J>;
  /** Le jeton qui rompt une illusion, s'il y en a un. */
  jetonKai?: J;
}
