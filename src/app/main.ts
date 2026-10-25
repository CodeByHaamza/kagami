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

import { BoucleDeDetection, Camera, ErreurCamera } from "../moteur/entree/camera";
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
import type { ContexteEffet, Image, Langue, Technique } from "../moteur/types";
import { PACK_KATA, SIGNES, FAMILLES, enregistrerTextes } from "../packs/naruto/manifeste";
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
let rasengan: Rasengan3D | null = null; // la scène 3D n'est créée qu'au premier Rasengan

let sauvegarde: Sauvegarde = charger();
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
  if (silhouette.pret && effets.besoinSilhouette()) {
    e.personne = (silhouette.decouper(video, temps) ?? undefined) as Image | undefined;
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

const detection = new BoucleDeDetection({
  ecart: ECART_DETECTION,
  surErreur: erreur => noter("ERREUR", "détection : " + (erreur as Error).message)
});

async function detecterUneFois(): Promise<void> {
  if (video.readyState < 2) return;
  const vue = await detecteur.reconnaitre(video, video.videoWidth, video.videoHeight);
  traiter(vue);
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
  if (tenu && tenu.part >= 1) declencher(tenu.technique, maintenant);

  afficherEnchainement();
}

function jetonValide(jeton: SigneNaruto): void {
  const maintenant = performance.now();

  // « Kai ! » : le Bélier rompt un genjutsu, comme dans l'anime
  if (jeton === PACK_KATA.jetonKai && effets.genjutsuActif()) {
    effets.rompreGenjutsu(contexte(maintenant, 0));
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

  const e = contexte(maintenant, 0);
  const def = effets.lancer(technique.effet, e);
  if (!def) return;
  noter("jutsu", `${technique.id} (effet ${technique.effet}) · JS ${memoire()}`);

  if (def.rasengan3d) {
    if (!rasengan) {
      rasengan = new Rasengan3D(el("calque3d"), PIXELS);
      surveillerWebGL(rasengan.renderer.domElement, "Rasengan 3D");
    }
    rasengan.lancer(e.main.x, e.main.y, Math.max(e.main.r * 0.9, 40));
  }

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
    message(t("guide.reussi", { nom: t(`jutsu.${technique.id}.nom`) }));
  }
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
      const etat = i < p.fait ? " fait" : i === p.fait ? " prochain" : "";
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
    photos: sauvegarde.photos,
    compteurs: sauvegarde.compteurs,
    decouvertes: sauvegarde.decouvertes
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
    guide = technique;
    sequence.reglages.oubli = OUBLI_GUIDE;
    sequence.vider();
    dernierRendu = "";
    el("guide").hidden = false;
    el("guideNom").textContent = t(`jutsu.${technique.id}.nom`);
    el("encyclo").hidden = true;
    majGuide();
    // Depuis l'accueil la camera n'est pas encore ouverte : sans ca, le panneau
    // d'entrainement s'affiche derriere un ecran d'accueil toujours la.
    if (!window.kagami?.pret) void demarrer();
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
    void detection.demarrer(detecterUneFois);
    window.kagami = { pret: true };
    noter("page", "jeu démarré");
  } catch (erreur) {
    bouton.disabled = false;
    if (erreur instanceof ErreurCamera) etat(t(`camera.${erreur.code}`));
    else etat(t("modele.erreur"));
    noter("ERREUR", "démarrage : " + (erreur as Error).message);
  }
}

// ---- les boutons ----

el("btnDemarrer").addEventListener("click", () => void demarrer());
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
el("btnFinGuide").addEventListener("click", () => {
  guide = null;
  sequence.reglages.oubli = OUBLI_NORMAL;
  el("guide").hidden = true;
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

battre(() =>
  (window.kagami?.pret ? "en jeu" : "accueil") +
  ", effets : " + (effets.actifs.map(a => a.nom).join(" ") || "aucun") +
  ", particules : " + effets.particules.liste.length +
  ", JS " + memoire()
);

appliquerTextes();
