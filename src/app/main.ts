// Kagami — le point d'entrée.
//
// Il assemble le moteur et un pack, et ne contient que du câblage : la caméra alimente
// le reconnaisseur, les jetons validés forment un enchaînement, l'enchaînement reconnu
// lance un effet, et la boucle de rendu dessine la vidéo plus les effets.
//
// Deux boucles tournent en parallèle :
//  - la détection, aussi vite que le modèle le permet (12 fois par seconde au plus) ;
//  - l'affichage, à chaque image de l'écran.

// La police est empaquetee avec le reste : servie depuis un CDN, elle est bloquee par
// l'en-tete COEP de l'image de production, et les kanji retombent sur une police systeme.
import "@fontsource/yuji-syuku/400.css";
import "../packs/naruto/assets/style.css";

import { Camera, ErreurCamera } from "../moteur/entree/camera";
import { analyserEclairage, verifierCadrage } from "../moteur/entree/calibration";
import { Ordonnanceur } from "../moteur/entree/ordonnanceur";
import { PostureMediaPipe } from "../moteur/corps/posture";
import { LecteurDeGestes, type JetonCorps } from "../moteur/corps/gestes";
import { MachineAPostures, type Attitude } from "../moteur/corps/postures";
import { fiable, immobilite } from "../moteur/corps/reperes";
import { Arcade } from "./arcade";
import { Academie } from "./academie";
import { EcranFicheNinja } from "./ficheNinja";
import { Banc } from "./banc";
import { ChronometreDojo } from "../moteur/jeu/chrono";
import { Sequence } from "../moteur/grammaire/sequence";
import { BoucleDeRendu, calculerCadre, dessinerCadre, versEcran } from "../moteur/rendu/cadre";
import { Effets } from "../moteur/rendu/effets";
import { Silhouette } from "../moteur/silhouette/silhouette";
import { activerSon, couperSon, crier, jouer } from "../moteur/son/son";
import { afficherJetons, afficherTechniques, listeFamilles } from "../moteur/ui/encyclopedie";
import { changerLangue, langue, t } from "../moteur/ui/i18n";
import { charger, enregistrer, type Sauvegarde } from "../moteur/stockage/sauvegarde";
import {
  battre,
  demarrerJournal,
  memoire,
  noter,
  surveillerWebGL,
  texteDuJournal,
  viderJournal
} from "../moteur/debug/journal";
import type { Cadre } from "../moteur/rendu/cadre";
import type { ContexteEffet, Image, Langue, Posture, Technique } from "../moteur/types";
import { choisirPack, type EntreePack } from "./portail";
import { PACK_KATA, SIGNES, FAMILLES, TAIJUTSU, ARMES, enregistrerTextes } from "../packs/naruto/manifeste";
import { IMAGES_SIGNES } from "../packs/naruto/assets/signes";
import type { SigneNaruto } from "../packs/naruto/manifeste";
import { Rasengan3D } from "../packs/naruto/effets/rasengan";

demarrerJournal();
enregistrerTextes();

declare global {
  interface Window {
    kagami?: { pret: boolean };
  }
}
window.kagami = { pret: false };

const el = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

/** Ce que le portail propose. Un seul pack est écrit ; les autres montrent la suite. */
const PACKS: readonly EntreePack[] = [
  { id: "kata", kanji: "型", nom: "Kata", anime: "Naruto", disponible: true },
  { id: "ki", kanji: "気", nom: "Ki", anime: "Dragon Ball", disponible: false },
  { id: "ju", kanji: "呪", nom: "Jujutsu", anime: "Jujutsu Kaisen", disponible: false },
  { id: "ha", kanji: "波", nom: "Hamon", anime: "JoJo", disponible: false }
];

const video = el<HTMLVideoElement>("video");
const toile = el<HTMLCanvasElement>("scene");
const ctx = toile.getContext("2d")!;

// Un téléphone qui manque de mémoire tue l'onglet et le recharge : on y dessine en
// résolution normale, et le détourage passe par le processeur.
const TELEPHONE = matchMedia("(pointer: coarse)").matches;
const PIXELS = TELEPHONE ? 1 : Math.min(window.devicePixelRatio || 1, 2);
// le détourage ajoute un modèle et un contexte graphique : pas sous 4 Go
const appareil = navigator as Navigator & { deviceMemory?: number };
const DETOURAGE = !(appareil.deviceMemory && appareil.deviceMemory < 4);

const OUBLI_NORMAL = 4000;
const OUBLI_GUIDE = 10_000;
const ECART_DETECTION = 80;

const camera = new Camera();
const detecteur = PACK_KATA.reconnaisseur();
const sequence = new Sequence(PACK_KATA.techniques, { oubli: OUBLI_NORMAL });
const silhouette = new Silhouette();
const effets = new Effets(PACK_KATA.effets);

// Le corps : un second flux d'entree, et un second alphabet pour la meme grammaire.
const posture = new PostureMediaPipe();
const gestes = new LecteurDeGestes();
const corps = new Sequence<JetonCorps>(TAIJUTSU, {
  // Le lecteur de gestes emet un evenement deja confirme, pas un flux bruite ; et deux
  // coups de pied d'affilee sont bien deux coups.
  confirmations: 1,
  repetitions: true
});
let armeChoisie = 0;
const stocks = new Map(ARMES.map(a => [a.id, a.stock]));
let rasengan: Rasengan3D | null = null; // la scène 3D n'est créée qu'au premier Rasengan

let sauvegarde: Sauvegarde = charger();
const chrono = new ChronometreDojo();

const arcade = new Arcade({
  demarrerCamera: async () => {
    if (!window.kagami?.pret) await demarrer();
  },
  reinitialiserStocks: () => {
    for (const a of ARMES) stocks.set(a.id, a.stock);
    montrerArme();
  },
  annoncer: texte => message(texte),
  getGrade: () => sauvegarde.progression.grade,
  getContrat: () => sauvegarde.fiche?.contrat ?? null,
  onVictoireMission: (id, rang) => {
    if (!sauvegarde.progression.missionsReussies.includes(id)) {
      sauvegarde.progression.missionsReussies.push(id);
    }
    const cleRang = `rang${rang}`;
    if (!sauvegarde.progression.missionsReussies.includes(cleRang)) {
      sauvegarde.progression.missionsReussies.push(cleRang);
    }
    enregistrer(sauvegarde);
  }
});

const ficheNinja = new EcranFicheNinja({
  getFiche: () => sauvegarde.fiche,
  getGrade: () => sauvegarde.progression.grade,
  getMissionsReussies: () => sauvegarde.progression.missionsReussies,
  getExamensPasses: () => sauvegarde.progression.examensPasses,
  onSauvegarder: fiche => {
    sauvegarde = { ...sauvegarde, fiche };
    enregistrer(sauvegarde);
    message(t("fiche.titre") + " " + t("fiche.enregistrer"));
  }
});

const academie = new Academie({
  getProgression: () => sauvegarde.progression,
  getNombreJutsus: () => sauvegarde.entraines.length,
  demarrerCamera: async () => {
    if (!window.kagami?.pret) await demarrer();
  },
  onPromotion: (grade, examenId) => {
    sauvegarde.progression.grade = grade;
    if (!sauvegarde.progression.examensPasses.includes(examenId)) {
      sauvegarde.progression.examensPasses.push(examenId);
    }
    enregistrer(sauvegarde);
  },
  annoncer: texte => message(texte)
});
let cadre: Cadre = calculerCadre({ l: innerWidth, h: innerHeight }, { largeur: 0, hauteur: 0 }, PIXELS);
let derniere: { jeton: SigneNaruto; score: number; boite: DOMRectInit & { x1: number; y1: number; x2: number; y2: number } ; temps: number } | null = null;
let guide: Technique<SigneNaruto> | null = null;
let enAttente: { technique: Technique<SigneNaruto>; depuis: number } | null = null;
let familleChoisie = "";

// `charger()` renvoie toujours un objet complet : sans ce drapeau, la langue du
// navigateur ne serait jamais consultee et un anglophone recevrait du francais.
changerLangue(sauvegarde.premiereVisite ? langue(navigator.language) : sauvegarde.langue);

// ---- l'interface, traduite ----

function appliquerTextes(): void {
  for (const noeud of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    noeud.textContent = t(noeud.dataset.i18n!, { total: PACK_KATA.techniques.length });
  }
  for (const noeud of document.querySelectorAll<HTMLElement>("[data-i18n-titre]")) {
    noeud.title = t(noeud.dataset.i18nTitre!);
  }
  // Un bouton dont le contenu est un emoji s'annonce « 📜 » : le nom accessible vient
  // du contenu avant le title. Il lui faut donc un aria-label explicite.
  for (const noeud of document.querySelectorAll<HTMLElement>("[data-i18n-aria]")) {
    noeud.setAttribute("aria-label", t(noeud.dataset.i18nAria!));
  }
  document.documentElement.lang = langue();
  el("btnFr").setAttribute("aria-pressed", String(langue() === "fr"));
  el("btnEn").setAttribute("aria-pressed", String(langue() === "en"));
  familleChoisie = t("encyclo.tous");
  majBilan();
}

function basculerLangue(l: Langue): void {
  changerLangue(l);
  sauvegarde = { ...sauvegarde, langue: l };
  enregistrer(sauvegarde);
  appliquerTextes();
  if (!el("encyclo").hidden) ouvrirEncyclopedie();
}

let minuteurMessage = 0;

function message(texte: string, duree = 3500): void {
  const m = el("message");
  m.textContent = texte;
  m.hidden = false;
  // Sans annuler le precedent, deux messages rapproches se coupent l'un l'autre.
  clearTimeout(minuteurMessage);
  minuteurMessage = window.setTimeout(() => (m.hidden = true), duree);
}

function etat(texte: string): void {
  el("etat").textContent = texte;
}

// ---- le rendu ----

function mains(): { x: number; y: number; r: number } {
  if (derniere && performance.now() - derniere.temps < 1500) {
    const a = versEcran(cadre, { largeur: video.videoWidth }, camera.deFace, derniere.boite.x1, derniere.boite.y1);
    const b = versEcran(cadre, { largeur: video.videoWidth }, camera.deFace, derniere.boite.x2, derniere.boite.y2);
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      r: Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) / 2
    };
  }
  return { x: cadre.l / 2, y: cadre.h * 0.62, r: Math.min(cadre.l, cadre.h) * 0.12 };
}

function contexte(temps: number, dt: number): ContexteEffet {
  return {
    temps,
    dt,
    t: 0,
    l: cadre.l,
    h: cadre.h,
    main: mains(),
    video,
    couverture: silhouette.pret ? () => silhouette.couverture(video) as Image : null,
    dessinerCadre: (c, image, decalage, zoom) =>
      dessinerCadre(c, cadre, image, camera.deFace, decalage, zoom),
    secouer: force => rendu.secouer(force),
    jouer
  };
}

const rendu = new BoucleDeRendu((dt, temps) => {
  if (video.readyState < 2) return;

  cadre = calculerCadre(
    { l: innerWidth, h: innerHeight },
    { largeur: video.videoWidth, hauteur: video.videoHeight },
    PIXELS
  );
  if (toile.width !== cadre.toileLargeur || toile.height !== cadre.toileHauteur) {
    toile.width = cadre.toileLargeur;
    toile.height = cadre.toileHauteur;
  }
  ctx.setTransform(PIXELS, 0, 0, PIXELS, 0, 0); // on dessine ensuite en pixels CSS

  const e = contexte(temps, dt);
  const force = rendu.prendreSecousse();

  ctx.save();
  ctx.translate((Math.random() - 0.5) * force * 2, (Math.random() - 0.5) * force * 2);
  ctx.fillStyle = "#000";
  ctx.fillRect(-30, -30, cadre.l + 60, cadre.h + 60);

  dessinerCadre(ctx, cadre, video, camera.deFace);
  effets.appeler("fond", ctx, e);
  // la personne détourée, seulement si un effet en a besoin
  if (silhouette.pret && (effets.besoinSilhouette() || arcade.actif)) {
    e.personne = (silhouette.decouper(video, temps) ?? undefined) as Image | undefined;
  }
  arcade.avancer(dt, temps, ordonnanceur.posture);
  arcade.dessiner(ctx, cadre.l, cadre.h, temps);
  if (academie.enExamen) academie.avancer(dt);
  if (guide && chrono.actif) {
    el("guideChrono").textContent = `${(chrono.tempsEcoule(temps) / 1000).toFixed(2)}s`;
  }
  effets.appeler("derriere", ctx, e);
  const remplacee = effets.appeler("personne", ctx, e);
  if (e.personne && !remplacee) dessinerCadre(ctx, cadre, e.personne, camera.deFace);
  effets.appeler("devant", ctx, e);
  effets.dessinerParticules(ctx);
  if ((el<HTMLInputElement>("voirDetection")).checked) dessinerDetection();
  ctx.restore();

  effets.avancer(dt, temps);
  if (rasengan?.actif) rasengan.placer(e.main.x, e.main.y);
});

function dessinerDetection(): void {
  if (!derniere || performance.now() - derniere.temps > 400) return;
  const taille = { largeur: video.videoWidth };
  const a = versEcran(cadre, taille, camera.deFace, derniere.boite.x1, derniere.boite.y1);
  const b = versEcran(cadre, taille, camera.deFace, derniere.boite.x2, derniere.boite.y2);
  ctx.strokeStyle = "rgba(249, 115, 22, 0.9)";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 6]);
  ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
  ctx.setLineDash([]);
}

// ---- la détection ----

// Le banc s'intercale entre les capteurs et l'ordonnanceur : il peut enregistrer ce
// qui passe, ou remplacer la camera par un fichier. Il est la meme chose dans les deux
// cas, qu'il soit affiche ou non — un seul chemin de code, donc un seul a deboguer.
const banc = new Banc<SigneNaruto>({
  posture: t => (video.readyState < 2 ? null : posture.lire(video, t)),
  signe: () =>
    video.readyState < 2
      ? Promise.resolve(null)
      : detecteur.reconnaitre(video, video.videoWidth, video.videoHeight),
  taille: () => ({ largeur: video.videoWidth, hauteur: video.videoHeight }),
  jetonConnu: jeton => jeton in SIGNES,
  surBascule: () => viderGrammaires()
});

/** Le corps vu a l'instant, et la fenetre courte dont l'immobilite se calcule. */
let postureCourante: Posture | null = null;
const histoirePosture: Posture[] = [];
/** Un tiers de seconde a 60 images : assez pour juger, assez court pour reagir. */
const IMAGES_IMMOBILITE = 20;

let dernierGeste: JetonCorps | null = null;
let dernierJetonValide: SigneNaruto | null = null;

const ordonnanceur = new Ordonnanceur<SigneNaruto, JetonCorps>({
  ecartSignes: ECART_DETECTION,
  lirePosture: t => {
    postureCourante = banc.lirePosture(t);
    if (postureCourante) {
      histoirePosture.push(postureCourante);
      if (histoirePosture.length > IMAGES_IMMOBILITE) histoirePosture.shift();
    } else {
      histoirePosture.length = 0;
    }
    return postureCourante;
  },
  reconnaitreSigne: () => banc.reconnaitreSigne(),
  lireGeste: (p, t) => gestes.observer(p, t),
  machine: new MachineAPostures({ surChangement: (_, apres) => montrerPosture(apres) }),
  surJeton: vue => traiter(vue),
  surGeste: geste => traiterGeste(geste)
});

/**
 * Lever les mains pour se defendre abandonne l'enchainement en cours : sans ca, il
 * reprendrait plus tard en plein milieu et un jutsu partirait tout seul. Un rejeu qui
 * commence ou se termine fait pareil, pour la meme raison.
 */
function viderGrammaires(): void {
  sequence.vider();
  corps.vider();
  enAttente = null;
  dernierRendu = "";
  afficherEnchainement();
}

ordonnanceur.surViderSequence = viderGrammaires;

// Le panneau du banc est un outil de developpement : il ne s'affiche que si on le
// demande, pour qu'un joueur ne tombe jamais dessus.
if (new URLSearchParams(location.search).has("banc")) banc.monter();

/** La boucle du corps et des signes. L'ordonnanceur decide qui ecoute. */
async function boucleEntree(): Promise<void> {
  while (window.kagami?.pret) {
    await ordonnanceur.image();
    banc.rafraichir({
      attitude: ordonnanceur.posture,
      geste: dernierGeste,
      jeton: dernierJetonValide,
      immobilite: immobilite(histoirePosture),
      fiabilite: postureCourante ? fiable(postureCourante) : false
    });
    await new Promise(suite => requestAnimationFrame(() => suite(null)));
  }
}

function montrerPosture(attitude: Attitude): void {
  el("posture").dataset.attitude = attitude;
  el("postureNom").textContent = t(`posture.${attitude}`);
  el("armes").hidden = attitude !== "combat";
}

/** Un geste du corps : il nourrit la grammaire corporelle, ou lance une arme. */
function traiterGeste(geste: JetonCorps): void {
  const maintenant = performance.now();
  dernierGeste = geste;
  arcade.geste(geste);

  if (geste === "lancer") {
    lancerArme(maintenant);
    return;
  }

  corps.ajouter({ jeton: geste, score: 1, boite: { x1: 0, y1: 0, x2: 0, y2: 0 } }, maintenant);
  const fini = corps.techniqueTerminee(maintenant);
  if (fini) {
    corps.vider();
    declencher(fini.technique as unknown as Technique<SigneNaruto>, maintenant);
  }
}

/** L'arme selectionnee part. Gratuite : c'est tout l'interet quand le chakra manque. */
function lancerArme(maintenant: number): void {
  const arme = ARMES[armeChoisie];
  if (!arme) return;

  const reste = stocks.get(arme.id);
  if (reste !== null && reste !== undefined && reste <= 0) {
    message(t("arme.vide", { nom: t(`arme.${arme.id}.nom`) }));
    return;
  }
  if (reste !== null && reste !== undefined) stocks.set(arme.id, reste - 1);

  effets.lancer(arme.effet, contexte(maintenant, 0));
  arcade.arme(arme, maintenant);
  jouer("shuriken");
  montrerArme();
}

function montrerArme(): void {
  const arme = ARMES[armeChoisie];
  if (!arme) return;
  const reste = stocks.get(arme.id);
  el("armeKanji").textContent = arme.kanji;
  el("armeNom").textContent = t(`arme.${arme.id}.nom`);
  el("armeStock").textContent =
    reste === null || reste === undefined ? t("arme.gratuite") : t("arme.stock", { reste });
}

function traiter(vue: Awaited<ReturnType<typeof detecteur.reconnaitre>>): void {
  const maintenant = performance.now();
  if (vue && vue.score >= 0.5) derniere = { ...vue, temps: maintenant };
  montrerJetonVu(vue);

  const jeton = sequence.ajouter(vue, maintenant);
  if (jeton) jetonValide(jeton);

  // une technique finie attendait une suite qui n'est pas venue : on la lance
  if (enAttente && maintenant - enAttente.depuis > sequence.reglages.attente) {
    const technique = enAttente.technique;
    enAttente = null;
    declencher(technique, maintenant);
  }

  const tenu = sequence.jetonTenu(maintenant);
  montrerTenu(tenu);
  if (tenu?.palier === "charge") {
    arcade.charger(ECART_DETECTION / 1000);
  }
  if (tenu?.technique && tenu.palier === "tenue" && tenu.part >= 1) {
    declencher(tenu.technique, maintenant);
  }

  afficherEnchainement();
}

function jetonValide(jeton: SigneNaruto): void {
  const maintenant = performance.now();
  dernierJetonValide = jeton;

  // « Kai ! » : le Bélier rompt un genjutsu, comme dans l'anime
  if (jeton === PACK_KATA.jetonKai && (effets.genjutsuActif() || arcade.sousIllusion)) {
    effets.rompreGenjutsu(contexte(maintenant, 0));
    arcade.kai();
    jouer("kai");
    sequence.vider();
    message(t("message.kai"));
    return;
  }

  jouer("signe", sequence.historique.length);
  navigator.vibrate?.(25);
  sauvegarde.compteurs[jeton] = (sauvegarde.compteurs[jeton] ?? 0) + 1;
  photographier(jeton);
  enregistrer(sauvegarde);

  enAttente = null;
  const fini = sequence.techniqueTerminee();
  if (fini?.attendre) enAttente = { technique: fini.technique, depuis: maintenant };
  else if (fini) declencher(fini.technique, maintenant);
}

function declencher(technique: Technique<SigneNaruto>, maintenant: number): void {
  sequence.vider();
  enAttente = null;
  if (academie.enExamen) academie.validerTechnique(technique.id);
  if (!arcade.technique(technique, maintenant)) return;

  const e = contexte(maintenant, 0);
  const def = effets.lancer(technique.effet, e);
  if (!def) return;
  noter("jutsu", `${technique.id} (effet ${technique.effet}) · JS ${memoire()}`);

  if (def.rasengan3d) lancerRasengan(e);

  // le détourage ne se charge qu'au premier effet qui en a besoin
  if (def.silhouette && DETOURAGE && !silhouette.pret && !silhouette.enChargement) {
    message(t("silhouette.chargement"));
    silhouette
      .charger(TELEPHONE ? "CPU" : "GPU")
      .then(() => noter("détourage", "prêt · JS " + memoire()))
      .catch((erreur: Error) => noter("ERREUR", "détourage indisponible : " + erreur.message));
  }

  jouer("jutsu");
  if (def.sonDepart) jouer(def.sonDepart);
  if (def.son) setTimeout(() => jouer(def.son!), 250);
  crier(technique);
  banniere(technique);

  if (!sauvegarde.decouvertes.includes(technique.id)) {
    sauvegarde.decouvertes.push(technique.id);
    enregistrer(sauvegarde);
    message(t("decouverte.nouveau", { nom: t(`jutsu.${technique.id}.nom`) }));
    majBilan();
  }
  if (guide?.id === technique.id) {
    if (!sauvegarde.entraines.includes(technique.id)) {
      sauvegarde.entraines.push(technique.id);
      enregistrer(sauvegarde);
    }
    bravo(technique);
  }
}

/** La scène 3D n'est créée qu'au premier jutsu qui en a besoin. */
function lancerRasengan(e: ContexteEffet): void {
  if (!rasengan) {
    rasengan = new Rasengan3D(el("calque3d"), PIXELS);
    surveillerWebGL(rasengan.renderer.domElement, "Rasengan 3D");
  }
  rasengan.lancer(e.main.x, e.main.y, Math.max(e.main.r * 0.9, 40));
}

/** Garde la photo la plus sûre de chaque jeton, pour l'encyclopédie. */
function photographier(jeton: SigneNaruto): void {
  if (!derniere || derniere.jeton !== jeton) return;
  const ancienne = sauvegarde.photos[jeton];
  if (ancienne && ancienne.score >= derniere.score) return;

  const { x1, y1, x2, y2 } = derniere.boite;
  const l = Math.abs(x2 - x1);
  const h = Math.abs(y2 - y1);
  if (!(l > 0 && h > 0)) return;

  const vignette = document.createElement("canvas");
  vignette.width = 120;
  vignette.height = Math.round((120 * h) / l);
  vignette
    .getContext("2d")!
    .drawImage(video, Math.min(x1, x2), Math.min(y1, y2), l, h, 0, 0, vignette.width, vignette.height);
  try {
    sauvegarde.photos[jeton] = { image: vignette.toDataURL("image/webp", 0.7), score: derniere.score };
  } catch {
    // canvas « sali » (jamais avec getUserMedia, mais on ne perd pas le jutsu pour ça)
  }
}

// ---- ce qu'on montre pendant le jeu ----

/** En dessous, c'est du bruit : l'afficher ferait clignoter la jauge a 12 Hz. */
const SEUIL_AFFICHAGE = 0.5;
/** On laisse le panneau a l'ecran un instant apres la derniere detection. */
const REMANENCE = 600;

let derniereVue = 0;

function montrerJetonVu(vue: { jeton: SigneNaruto; score: number } | null): void {
  const bloc = el("signeVu");

  if (vue && vue.score >= SEUIL_AFFICHAGE) {
    derniereVue = performance.now();
    bloc.classList.add("visible");
    el("vuKanji").textContent = SIGNES[vue.jeton].kanji;
    el("vuNom").textContent = t(`signe.${vue.jeton}.nom`);
    el("vuScore").style.width = Math.round(vue.score * 100) + "%";
    return;
  }
  if (performance.now() - derniereVue > REMANENCE) bloc.classList.remove("visible");
}

function montrerTenu(tenu: { part: number } | null): void {
  // `.tenu:empty` est masque par la feuille de style : c'est le texte qui le fait
  // apparaitre, pas une largeur.
  el("vuTenu").textContent = tenu ? t("signe.tenir", { part: Math.round(tenu.part * 100) }) : "";
}

/** Les plus recentes seulement : au-dela, les pastilles grimpent sur l'ecran. */
const PASTILLES_VISIBLES = 10;

let dernierRendu = "";

function afficherEnchainement(): void {
  // La boucle de detection appelle ceci 12 fois par seconde. Sans ce memo, on
  // reecrirait trois innerHTML a chaque fois, qu'il y ait du nouveau ou non.
  const cle = sequence.historique.join(">") + "|" + (guide?.id ?? "");
  if (cle === dernierRendu) return;
  dernierRendu = cle;

  el("historique").innerHTML = sequence.historique
    .slice(-PASTILLES_VISIBLES)
    .map(j => `<span class="pastille"><b>${SIGNES[j].kanji}</b></span>`)
    .join("");

  const cours = sequence.enCours();
  el("enCours").innerHTML = cours
    .map(
      c =>
        `<p>${t(`jutsu.${c.technique.id}.nom`)} <b>${c.fait}/${c.total}</b> → ` +
        `${c.prochain ? SIGNES[c.prochain].kanji : ""}</p>`
    )
    .join("");

  if (guide) majGuide();
}

/** Les signes du jutsu en cours d'entrainement : faits, a faire, et le prochain. */
function majGuide(): void {
  if (!guide) return;
  const p = sequence.progression(guide);
  el("guideSuite").innerHTML = guide.signes
    .map((s, i) => {
      const etat = i < p.fait ? " fait" : i === p.fait ? " suivant" : "";
      return `<span class="pastille${etat}"><b>${SIGNES[s].kanji}</b>${t(`signe.${s}.nom`)}</span>`;
    })
    .join("");
  el("guideProchain").textContent = p.prochain
    ? t("guide.prochain", { signe: t(`signe.${p.prochain}.nom`) })
    : "";
}

/** Doit correspondre a la duree de l'animation `banniere` de la feuille de style. */
const DUREE_BANNIERE = 3200;
let minuteurBanniere = 0;

function banniere(technique: Technique<SigneNaruto>): void {
  const b = el("banniere");
  b.querySelector(".type")!.textContent = technique.type;
  b.querySelector(".kanji")!.textContent = technique.kanji;
  b.querySelector(".nom")!.textContent = t(`jutsu.${technique.id}.nom`);

  b.classList.remove("visible");
  void b.offsetWidth; // redemarre l'animation
  b.classList.add("visible");
  clearTimeout(minuteurBanniere);
  minuteurBanniere = window.setTimeout(() => b.classList.remove("visible"), DUREE_BANNIERE);
}

// ---- l'encyclopédie ----

function donneesEncyclopedie() {
  return {
    jetons: SIGNES,
    techniques: PACK_KATA.techniques,
    familles: FAMILLES,
    illustrations: IMAGES_SIGNES,
    photos: sauvegarde.photos,
    compteurs: sauvegarde.compteurs,
    decouvertes: sauvegarde.decouvertes,
    entraines: sauvegarde.entraines
  };
}

function majBilan(): void {
  el("bilan").textContent = t("decouverte.compte", {
    faits: sauvegarde.decouvertes.length,
    total: PACK_KATA.techniques.length
  });
}

function ouvrirEncyclopedie(): void {
  el("encyclo").hidden = false;
  afficherJetons(el("listeSignes"), donneesEncyclopedie());
  afficherFamilles();
  afficherJutsus();
  majBilan();
}

function afficherFamilles(): void {
  el("familles").innerHTML = listeFamilles(FAMILLES)
    .map(f => `<button type="button" data-famille="${f}">${f}</button>`)
    .join("");
  for (const bouton of el("familles").querySelectorAll<HTMLButtonElement>("button")) {
    bouton.addEventListener("click", () => {
      familleChoisie = bouton.dataset.famille!;
      afficherJutsus();
    });
  }
}

function afficherJutsus(): void {
  afficherTechniques(el("listeJutsus"), donneesEncyclopedie(), familleChoisie, technique => {
    void ouvrirEntrainement(technique);
  });
}

function choisirOnglet(nom: string): void {
  el("listeSignes").hidden = nom !== "signes";
  el("panneauJutsus").hidden = nom !== "jutsus";
  for (const onglet of document.querySelectorAll<HTMLElement>("[data-onglet]")) {
    onglet.setAttribute("aria-selected", String(onglet.dataset.onglet === nom));
  }
}

// ---- démarrage ----

async function demarrer(): Promise<void> {
  const bouton = el<HTMLButtonElement>("btnDemarrer");
  bouton.disabled = true;
  try {
    etat(t("accueil.ouverture"));
    void activerSon();

    const flux = await camera.ouvrir(true);
    video.srcObject = flux;
    await video.play();

    etat(t("modele.chargement"));
    await detecteur.charger(PACK_KATA.modele);

    el("accueil").hidden = true;
    rendu.demarrer();
    window.kagami = { pret: true };
    montrerPosture("neutre");
    montrerArme();
    void boucleEntree();
    // Le modele de posture est lourd : on le charge apres le demarrage, et son echec
    // ne doit rien empecher — l'appli reste jouable aux signes seuls.
    posture
      .charger()
      .then(() => noter("posture", "lecteur de posture prêt"))
      .catch((erreur: Error) => {
        noter("ERREUR", erreur.message);
        message(t("posture.indisponible"));
      });
    noter("page", "jeu démarré");
  } catch (erreur) {
    bouton.disabled = false;
    if (erreur instanceof ErreurCamera) etat(t(`camera.${erreur.code}`));
    else etat(t("modele.erreur"));
    noter("ERREUR", "démarrage : " + (erreur as Error).message);
  }
}

// ---- l'entraînement ----

async function ouvrirEntrainement(technique: Technique<SigneNaruto>): Promise<void> {
  guide = technique;
  sequence.reglages.oubli = OUBLI_GUIDE;
  sequence.vider();
  dernierRendu = "";

  el("guideType").textContent = technique.type;
  el("guideKanji").textContent = technique.kanji;
  el("guideNom").textContent = t(`jutsu.${technique.id}.nom`);
  el("guideTexte").textContent = t(`jutsu.${technique.id}.texte`);

  const record = sauvegarde.progression.recordsDojo[technique.id];
  el("guideChrono").textContent = "0.00s";
  el("guideRecord").textContent = record ? `Record : ${(record / 1000).toFixed(2)}s` : "";
  chrono.demarrer(technique.id, performance.now());

  const panneau = el("guide");
  panneau.hidden = false;
  panneau.classList.remove("entre");
  void panneau.offsetWidth; // redémarre le fondu
  panneau.classList.add("entre");

  el("encyclo").hidden = true;
  majGuide();

  // Depuis l'accueil la caméra n'est pas encore ouverte : sans ça, le panneau
  // d'entraînement s'affiche derrière un écran d'accueil toujours là.
  if (!window.kagami?.pret) await demarrer();
  // Puis on montre à quoi ressemble le jutsu visé : on apprend mieux une cible qu'on
  // a vue une fois.
  if (window.kagami?.pret) apercu(technique);
}

function fermerEntrainement(): void {
  guide = null;
  chrono.reinitialiser();
  sequence.reglages.oubli = OUBLI_NORMAL;
  el("guide").hidden = true;
}

/** Joue l'effet du jutsu visé, sans l'enregistrer comme réussi. */
function apercu(technique: Technique<SigneNaruto>): void {
  const e = contexte(performance.now(), 0);
  const def = effets.lancer(technique.effet, e);
  if (def?.rasengan3d) lancerRasengan(e);
  jouer("jutsu");
  banniere(technique);
}

let minuteurBravo = 0;

/** Le retour quand un jutsu part pendant l'entraînement. */
function bravo(technique: Technique<SigneNaruto>): void {
  const panneau = el("bravo");
  el("bravoQuoi").textContent = t(`jutsu.${technique.id}.nom`);
  let texteCompte = t("guide.maitrises", {
    faits: sauvegarde.entraines.length,
    total: PACK_KATA.techniques.length
  });

  if (chrono.actif && guide?.id === technique.id) {
    const res = chrono.arreter(technique.id, performance.now(), sauvegarde.progression.recordsDojo);
    if (res.reussi) {
      if (res.estNouveauRecord) {
        sauvegarde.progression.recordsDojo[technique.id] = res.dureeMs;
        enregistrer(sauvegarde);
        texteCompte += " · " + t("chrono.recordBattu");
      }
      el("guideChrono").textContent = `${(res.dureeMs / 1000).toFixed(2)}s`;
      el("guideRecord").textContent = `Record : ${(sauvegarde.progression.recordsDojo[technique.id]! / 1000).toFixed(2)}s`;
    }
  }

  el("bravoCompte").textContent = texteCompte;

  panneau.hidden = false;
  panneau.classList.remove("visible");
  void panneau.offsetWidth;
  panneau.classList.add("visible");

  clearTimeout(minuteurBravo);
  minuteurBravo = window.setTimeout(() => {
    panneau.classList.remove("visible");
    panneau.hidden = true;
  }, 2600);
}

function ouvrirCalibration(): void {
  let statEclairage: "sombre" | "bon" | "eblouissant" = "bon";
  try {
    if (toile.width > 0 && toile.height > 0) {
      const data = ctx.getImageData(0, 0, Math.min(100, toile.width), Math.min(100, toile.height));
      statEclairage = analyserEclairage(data.data).statut;
    }
  } catch {
    // Si la caméra n'a pas encore dessiné, garde le statut bon par défaut
  }

  const statCadrage = verifierCadrage(ordonnanceur.corpsPret ? 0.38 : null).statut;

  el("calibEclairage").textContent = t(`calibration.${statEclairage}`);
  el("calibDistance").textContent = t(statCadrage === "absent" ? "posture.neutre" : `calibration.${statCadrage}`);

  let conseil = t("calibration.conseil.parfait");
  if (statEclairage === "sombre") {
    conseil = t("calibration.conseil.sombre");
  } else if (statCadrage === "tropPres") {
    conseil = t("calibration.conseil.tropPres");
  } else if (statCadrage === "tropLoin") {
    conseil = t("calibration.conseil.tropLoin");
  }
  el("calibConseil").textContent = conseil;

  el("calibration").hidden = false;
}

// ---- les boutons ----

el("btnDemarrer").addEventListener("click", () => void demarrer());
el("btnArcade").addEventListener("click", () => arcade.ouvrirChoix());
el("btnFicheNinja").addEventListener("click", () => ficheNinja.ouvrir());
el("btnFicheNinjaAccueil").addEventListener("click", () => ficheNinja.ouvrir());
el("btnCalibration").addEventListener("click", () => ouvrirCalibration());
el("btnFermerCalibration").addEventListener("click", () => (el("calibration").hidden = true));
el("btnAcademie").addEventListener("click", () => academie.ouvrir());
el("btnFermerMissions").addEventListener("click", () => arcade.fermerChoix());
el("btnQuitterArcade").addEventListener("click", () => arcade.quitter());
el("btnRetourDojo").addEventListener("click", () => arcade.quitter());
el("btnFr").addEventListener("click", () => basculerLangue("fr"));
el("btnEn").addEventListener("click", () => basculerLangue("en"));
el("btnEncyclo").addEventListener("click", ouvrirEncyclopedie);
el("btnEncycloAccueil").addEventListener("click", ouvrirEncyclopedie);
el("btnFermerEncyclo").addEventListener("click", () => (el("encyclo").hidden = true));
el("btnCamera").addEventListener("click", () => void basculerCamera());
el("btnSon").addEventListener("click", () => {
  const bouton = el("btnSon");
  const muet = bouton.getAttribute("aria-pressed") !== "true";
  bouton.setAttribute("aria-pressed", String(muet));
  bouton.textContent = muet ? "🔇" : "🔊";
  couperSon(muet);
});
el("btnFinGuide").addEventListener("click", fermerEntrainement);
el("btnApercu").addEventListener("click", () => {
  if (guide) apercu(guide);
});
el("btnJournal").addEventListener("click", () => {
  el("journal").hidden = false;
  el("journalTexte").textContent = texteDuJournal();
});
el("btnFermerJournal").addEventListener("click", () => (el("journal").hidden = true));
el("btnViderJournal").addEventListener("click", () => {
  viderJournal();
  el("journalTexte").textContent = "";
});
el("btnCopierJournal").addEventListener("click", () => {
  void navigator.clipboard.writeText(texteDuJournal());
});
for (const onglet of document.querySelectorAll<HTMLElement>("[data-onglet]")) {
  onglet.addEventListener("click", () => choisirOnglet(onglet.dataset.onglet!));
}

async function basculerCamera(): Promise<void> {
  const avant = camera.deFace;
  try {
    video.srcObject = await camera.basculer();
    await video.play();
  } catch {
    // Pas de seconde camera : l'ancien flux est deja coupe, il faut le rouvrir,
    // sinon l'ecran reste noir pour de bon.
    message(t("camera.aucuneAutre"));
    try {
      video.srcObject = await camera.ouvrir(avant);
      await video.play();
    } catch (erreur) {
      etat(t(`camera.${erreur instanceof ErreurCamera ? erreur.code : "inconnue"}`));
    }
  }
}

// Un onglet en arriere-plan qui garde la camera est le premier que le telephone ferme.
document.addEventListener("visibilitychange", () => {
  if (!window.kagami?.pret) return;
  if (document.hidden) {
    camera.fermer();
    rendu.arreter();
    ordonnanceur.arreter();
  } else {
    void camera
      .ouvrir()
      .then(flux => {
        video.srcObject = flux;
        rendu.demarrer();
        return video.play();
      })
      .catch(() => message(t("camera.inconnue")));
  }
});

// Changer d'arme : une touche, en attendant que le plan 3 decide d'un geste.
addEventListener("keydown", e => {
  if (e.key !== "a" && e.key !== "A") return;
  armeChoisie = (armeChoisie + 1) % ARMES.length;
  montrerArme();
});

battre(() =>
  (window.kagami?.pret ? "en jeu" : "accueil") +
  ", effets : " + (effets.actifs.map(a => a.nom).join(" ") || "aucun") +
  ", particules : " + effets.particules.liste.length +
  ", JS " + memoire()
);

appliquerTextes();

// Le portail d'abord : on choisit son anime, puis le pack prend la main.
void choisirPack(el("listePacks"), PACKS).then(pack => {
  noter("page", `pack choisi : ${pack.id}`);
  el("portail").hidden = true;
  el("accueil").hidden = false;
});
