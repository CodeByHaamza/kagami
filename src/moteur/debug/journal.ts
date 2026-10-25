// Le journal de bord : ce qui se passe dans l'appli, gardé même si la page se recharge.
//
// Un téléphone qui manque de mémoire tue l'onglet puis le recharge : tout ce qui était
// en mémoire est perdu, y compris la console. Ce journal est donc écrit dans le
// localStorage, et un "battement" toutes les 5 secondes permet de savoir, au
// chargement suivant, si la page précédente s'est arrêtée brutalement.

interface Battement {
  temps: number;
  etat: string;
  visible: boolean;
  propre: boolean;
}

/** `deviceMemory` n'est pas standard : Chrome l'expose, les autres non. */
const appareil = navigator as Navigator & { deviceMemory?: number };

const CLE = "kagami.journal";
const CLE_BATTEMENT = "kagami.battement";
const MAX = 400; // lignes gardées

function lire<T>(cle: string, defaut: T): T {
  try {
    const brut = localStorage.getItem(cle);
    return brut === null ? defaut : ((JSON.parse(brut) as T) ?? defaut);
  } catch {
    return defaut;
  }
}

function ecrire(cle: string, valeur: unknown): void {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    // stockage plein ou interdit : le journal reste au moins dans la console
  }
}

const lignes = lire<string[]>(CLE, []);

export function noter(type: string, texte: string): void {
  const heure = new Date().toLocaleTimeString("fr-FR") + "." + String(Date.now() % 1000).padStart(3, "0");
  const ligne = heure + " [" + type + "] " + texte;
  lignes.push(ligne);
  if (lignes.length > MAX) lignes.splice(0, lignes.length - MAX);
  ecrire(CLE, lignes);
  console.log(ligne);
}

export function texteDuJournal(): string {
  return lignes.join("\n");
}

export function viderJournal(): void {
  lignes.length = 0;
  ecrire(CLE, lignes);
}

// la mémoire utilisée par le JavaScript (Chrome seulement), en Mo
export function memoire(): string {
  const m = (performance as Performance & {
    memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
  }).memory;
  return m ? Math.round(m.usedJSHeapSize / 1e6) + "/" + Math.round(m.jsHeapSizeLimit / 1e6) + " Mo" : "inconnue";
}

// ---- le battement ----
// etat() renvoie un petit texte sur ce que fait l'appli à cet instant

let etatActuel: () => string = () => "";
let quittee = false; // la page a été quittée proprement : on ne bat plus

export function battre(etat?: () => string): void {
  if (etat) etatActuel = etat;
  if (quittee) return;
  ecrire(CLE_BATTEMENT, { temps: Date.now(), etat: etatActuel(), visible: !document.hidden, propre: false });
}

// à appeler une fois, au chargement de la page
export function demarrerJournal(): void {
  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const precedent = lire<Battement | null>(CLE_BATTEMENT, null);
  noter("page", "chargée (" + (navigation ? navigation.type : "?") + ")"
    + ((document as Document & { wasDiscarded?: boolean }).wasDiscarded ? ", l'onglet avait été JETÉ par le navigateur (manque de mémoire en arrière-plan)" : "")
    + " · " + navigator.userAgent.replace(/^Mozilla\/5\.0 /, "")
    + " · mémoire de l'appareil " + (appareil.deviceMemory ? appareil.deviceMemory + " Go" : "inconnue")
    + " · écran " + innerWidth + "x" + innerHeight + " x" + devicePixelRatio);

  // la page d'avant battait encore il y a peu et n'a pas été quittée proprement : elle a planté
  if (precedent && !precedent.propre && Date.now() - precedent.temps < 60000) {
    noter("ALERTE", "la page précédente s'est arrêtée brutalement " + Math.round((Date.now() - precedent.temps) / 1000)
      + " s avant ce chargement, " + (precedent.visible ? "pendant qu'on l'utilisait" : "en arrière-plan")
      + ". Dernier état : " + precedent.etat);
  }

  battre();
  setInterval(() => battre(), 5000);
  // "pagehide" arrive AVANT le dernier "visibilitychange" : sans le drapeau "quittee",
  // ce dernier battement effaçait le "propre" et chaque rechargement passait pour un plantage
  addEventListener("pagehide", () => {
    noter("page", "quittée");
    ecrire(CLE_BATTEMENT, { temps: Date.now(), etat: etatActuel(), visible: false, propre: true });
    quittee = true;
  });
  // la page revient du cache du navigateur (bouton retour) : elle bat à nouveau
  addEventListener("pageshow", (e: PageTransitionEvent) => {
    if (e.persisted) {
      quittee = false;
      noter("page", "revenue du cache");
      battre();
    }
  });
  addEventListener("error", (e: ErrorEvent) => noter("ERREUR", e.message + " (" + (e.filename || "").split("/").pop() + ":" + e.lineno + ")"));
  addEventListener("unhandledrejection", (e: PromiseRejectionEvent) =>
    noter("ERREUR", "promesse rejetée : " + (e.reason?.message ?? String(e.reason)))
  );
  document.addEventListener("visibilitychange", () => {
    noter("page", document.hidden ? "passée en arrière-plan" : "revenue au premier plan");
    battre();
  });
}

// prévient si un canvas WebGL perd son contexte (le GPU a été réinitialisé)
export function surveillerWebGL(canvas: HTMLCanvasElement, nom: string): void {
  canvas.addEventListener("webglcontextlost", () => noter("ALERTE", "contexte WebGL perdu : " + nom));
  canvas.addEventListener("webglcontextrestored", () => noter("info", "contexte WebGL rétabli : " + nom));
}
