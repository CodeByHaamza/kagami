// Le combat : ce qui assemble la scène, l'horloge, le joueur, les télégraphes et le
// déroulement de la mission.
//
// C'est la seule pièce que l'appli manipule. Les deux grammaires existantes continuent
// de reconnaître les signes et les gestes ; quand une technique sort, l'appli la passe
// à `combat.technique()`, qui dit si elle part ou pourquoi elle est refusée.

import type { Attitude } from "../corps/postures";
import { Scene, type Entite } from "../scene/scene";
import type {
  ArmeDuPack,
  Attaque,
  Mission,
  ModeleBoss,
  ModeleEnnemi,
  ProfilCombat,
  Technique
} from "../types";
import { coutChakra, multiplicateur, puissance } from "./degats";
import { HorlogeDeJeu } from "./horloge";
import { Joueur } from "./joueur";
import { DeroulementMission, type EtatMission } from "./mission";
import { Telegraphe, type IssueTelegraphe } from "./telegraphe";

export type RaisonRefus = "dojo" | "chakra" | "illusion" | "termine";

export type ResultatTechnique =
  | { ok: true; touches: number; morts: number; cout: number }
  | { ok: false; raison: RaisonRefus };

export type ResultatArme =
  | { ok: true; touches: number; morts: number }
  | { ok: false; raison: "termine" | "aucuneCible" };

export type EvenementCombat =
  | { type: "touche"; entite: Entite; degats: number; multiplicateur: number }
  | { type: "mort"; entite: Entite }
  | { type: "telegraphe"; telegraphe: Telegraphe }
  | { type: "impact"; issue: IssueTelegraphe; degats: number }
  | { type: "vague"; numero: number; total: number }
  | { type: "victoire" }
  | { type: "defaite" }
  | { type: "refus"; raison: RaisonRefus };

export interface OptionsCombat {
  mission: Mission;
  cycle: readonly string[];
  profils: Readonly<Record<string, ProfilCombat>>;
  bestiaire: Readonly<Record<string, ModeleEnnemi>>;
  boss: Readonly<Record<string, ModeleBoss>>;
  ecartApparition?: number;
  entracte?: number;
  ralentiActif?: boolean;
}

/** Profondeur minimale pour qu'un coup au corps (taijutsu) atteigne sa cible. */
const PORTEE_TAIJUTSU = 0.55;
/** Seuil de dégâts qui marque une arme comme explosive (dégâts de zone). */
const SEUIL_ARME_ZONE = 25;

export class Combat {
  readonly scene = new Scene();
  readonly joueur = new Joueur();
  readonly horloge: HorlogeDeJeu;
  readonly deroulement: DeroulementMission;

  private readonly cycle: readonly string[];
  private readonly profils: Readonly<Record<string, ProfilCombat>>;
  private readonly bestiaire: Readonly<Record<string, ModeleEnnemi>>;
  private readonly boss: Readonly<Record<string, ModeleBoss>>;

  private readonly enVol: Telegraphe[] = [];
  private readonly attenteAttaque = new Map<number, number>();
  private readonly indicePattern = new Map<number, number>();
  private readonly fileEvenements: EvenementCombat[] = [];
  private derniereVague = 1;

  constructor(options: OptionsCombat) {
    this.cycle = options.cycle;
    this.profils = options.profils;
    this.bestiaire = options.bestiaire;
    this.boss = options.boss;
    this.horloge = new HorlogeDeJeu({ actif: options.ralentiActif ?? true });
    this.deroulement = new DeroulementMission(options.mission, {
      ecartApparition: options.ecartApparition,
      entracte: options.entracte
    });
  }

  get etat(): EtatMission {
    return this.deroulement.etat;
  }

  get telegraphes(): readonly Telegraphe[] {
    return this.enVol;
  }

  prendreEvenements(): EvenementCombat[] {
    return this.fileEvenements.splice(0, this.fileEvenements.length);
  }

  avancer(dtReel: number, maintenant: number, attitude: Attitude): void {
    this.mettreAJourMission(0);
    if (this.etat === "victoire" || this.etat === "defaite") return;

    const dtJeu = this.horloge.avancer(dtReel, attitude);
    this.joueur.avancer(dtReel);

    // 1. Entrées de la vague en cours.
    const entrees = this.deroulement.apparitions(dtJeu);
    for (const [i, a] of entrees.entries()) this.faireEntrer(a.modele, a.boss, i, entrees.length, maintenant);

    // 2. Déplacement des entités et avancement des télégraphes déjà en vol.
    // On avance les télégraphes AVANT de déclencher ceux de cette image : un télégraphe
    // créé à l'instant T ne doit pas consommer le pas de temps qui l'a fait naître.
    this.scene.avancer(dtJeu, maintenant);
    for (let i = this.enVol.length - 1; i >= 0; i--) {
      const tel = this.enVol[i]!;
      if (tel.annule) {
        this.enVol.splice(i, 1);
        continue;
      }
      tel.avancer(dtJeu);
      if (tel.arrive) {
        this.enVol.splice(i, 1);
        const r = tel.resoudre(this.joueur);
        if (tel.source.etat === "telegraphe") {
          tel.source.etat = "approche";
          tel.source.depuis = maintenant;
        }
        this.fileEvenements.push({ type: "impact", issue: r.issue, degats: r.degats });
      }
    }

    // 3. Nouvelles attaques ennemies.
    for (const e of this.scene.vivantes()) this.cadencerAttaque(e, dtJeu, maintenant);

    this.mettreAJourMission(dtJeu);
  }

  technique(t: Technique, maintenant: number): ResultatTechnique {
    if (this.etat === "victoire" || this.etat === "defaite") {
      return { ok: false, raison: "termine" };
    }

    const estTaijutsu = t.type === "Taijutsu";
    if (!estTaijutsu && this.joueur.illusion) {
      this.fileEvenements.push({ type: "refus", raison: "illusion" });
      return { ok: false, raison: "illusion" };
    }

    const profil: ProfilCombat = this.profils[t.id] ?? { rang: null, element: null, role: "attaque" };
    if (profil.role === "dojo") {
      this.fileEvenements.push({ type: "refus", raison: "dojo" });
      return { ok: false, raison: "dojo" };
    }

    const jetonsSignes = estTaijutsu ? 0 : t.signes.length;
    const cout = coutChakra(profil, jetonsSignes);
    if (!this.joueur.depenser(cout)) {
      this.fileEvenements.push({ type: "refus", raison: "chakra" });
      return { ok: false, raison: "chakra" };
    }

    if (profil.role === "defense") {
      for (const tel of this.enVol) tel.contrer();
      return { ok: true, touches: 0, morts: 0, cout };
    }

    if (profil.role === "utilitaire") {
      for (const tel of this.enVol) tel.esquiver();
      return { ok: true, touches: 0, morts: 0, cout };
    }

    const base = puissance(profil, Math.max(1, t.signes.length));
    const cibles = estTaijutsu ? this.scene.aPortee(PORTEE_TAIJUTSU) : this.scene.vivantes();

    let morts = 0;
    for (const c of cibles) {
      const m = multiplicateur(profil.element, c.affinite, this.cycle);
      const degats = Math.round(base * m);
      const tuer = this.scene.toucher(c, degats, maintenant);
      this.fileEvenements.push({ type: "touche", entite: c, degats, multiplicateur: m });
      if (tuer) {
        morts++;
        this.fileEvenements.push({ type: "mort", entite: c });
      }
    }

    this.joueur.invocation = Math.min(100, this.joueur.invocation + cibles.length * 8);
    this.nettoyerTelegraphes();
    this.mettreAJourMission();
    return { ok: true, touches: cibles.length, morts, cout };
  }

  arme(a: ArmeDuPack, maintenant: number): ResultatArme {
    if (this.etat === "victoire" || this.etat === "defaite") {
      return { ok: false, raison: "termine" };
    }
    const principale = this.scene.plusProche();
    if (!principale) return { ok: false, raison: "aucuneCible" };

    const cibles = a.degats >= SEUIL_ARME_ZONE ? this.scene.vivantes() : [principale];
    let morts = 0;
    for (const c of cibles) {
      const degats = c === principale ? a.degats : Math.round(a.degats * 0.6);
      const tuer = this.scene.toucher(c, degats, maintenant);
      this.fileEvenements.push({ type: "touche", entite: c, degats, multiplicateur: 1 });
      if (tuer) {
        morts++;
        this.fileEvenements.push({ type: "mort", entite: c });
      }
    }

    this.nettoyerTelegraphes();
    this.mettreAJourMission();
    return { ok: true, touches: cibles.length, morts };
  }

  esquive(): boolean {
    let auMoinsUne = false;
    for (const tel of this.enVol) {
      if (tel.esquiver()) auMoinsUne = true;
    }
    return auMoinsUne;
  }

  garde(tenue: boolean): void {
    this.joueur.garde = tenue;
  }

  kai(): boolean {
    if (!this.joueur.illusion) return false;
    this.joueur.rompre();
    return true;
  }

  charger(dt: number): void {
    this.joueur.charger(dt);
  }

  private faireEntrer(
    idModele: string,
    estBoss: boolean,
    rang: number,
    total: number,
    maintenant: number
  ): void {
    const def = estBoss ? this.boss[idModele] : this.bestiaire[idModele];
    if (!def) return;

    const x = total <= 1 ? 0.5 : 0.22 + ((rang % 3) * 0.56) / 2;
    const entite = this.scene.ajouter(
      idModele,
      {
        pv: def.pv,
        vitesse: def.vitesse,
        affinite: def.affinite,
        boss: estBoss,
        seReforme: def.seReforme,
        x
      },
      maintenant
    );
    this.attenteAttaque.set(entite.id, def.cadence);
    this.indicePattern.set(entite.id, 0);
  }

  private cadencerAttaque(e: Entite, dtJeu: number, maintenant: number): void {
    const def = e.boss ? this.boss[e.modele] : this.bestiaire[e.modele];
    if (!def) return;

    const reste = (this.attenteAttaque.get(e.id) ?? def.cadence) - dtJeu;
    if (reste > 0) {
      this.attenteAttaque.set(e.id, reste);
      return;
    }

    this.attenteAttaque.set(e.id, def.cadence);
    let attaque: Attaque;
    if ("attaques" in def) {
      const i = this.indicePattern.get(e.id) ?? 0;
      attaque = def.attaques[i % def.attaques.length]!;
      this.indicePattern.set(e.id, i + 1);
    } else {
      attaque = def.attaque;
    }

    e.etat = "telegraphe";
    e.depuis = maintenant;
    const tel = new Telegraphe(attaque, e);
    this.enVol.push(tel);
    this.fileEvenements.push({ type: "telegraphe", telegraphe: tel });
  }

  private nettoyerTelegraphes(): void {
    for (let i = this.enVol.length - 1; i >= 0; i--) {
      if (this.enVol[i]!.annule) this.enVol.splice(i, 1);
    }
  }

  private mettreAJourMission(dtJeu = 0): void {
    const avantEtat = this.deroulement.etat;
    this.deroulement.avancer(dtJeu, this.scene, this.joueur);

    if (this.deroulement.vagueCourante !== this.derniereVague) {
      this.derniereVague = this.deroulement.vagueCourante;
      this.fileEvenements.push({
        type: "vague",
        numero: this.derniereVague,
        total: this.deroulement.total
      });
    }

    if (avantEtat !== "victoire" && this.deroulement.etat === "victoire") {
      this.enVol.length = 0;
      this.fileEvenements.push({ type: "victoire" });
    } else if (avantEtat !== "defaite" && this.deroulement.etat === "defaite") {
      this.enVol.length = 0;
      this.fileEvenements.push({ type: "defaite" });
    }
  }
}
