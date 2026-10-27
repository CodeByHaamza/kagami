// Le câblage du mode arcade et de son HUD « parchemin » (spec §10.1).
//
// Comme le reste de `src/app/`, ce fichier ne contient aucune règle de combat : tout
// vit dans `src/moteur/jeu/combat.ts`. Il ouvre l'écran de choix de mission, instancie
// `Combat`, rafraîchit les trois jauges et le sceau de vague, et traduit les évènements
// du combat en sons et en messages.

import type { Attitude } from "../moteur/corps/postures";
import { Combat } from "../moteur/jeu/combat";
import { creerMissionSurvie } from "../moteur/jeu/survie";
import { estMissionAccessible } from "../moteur/progression/progression";
import { dessinerScene } from "../moteur/rendu/scene";
import { jouer } from "../moteur/son/son";
import type { Contrat, Grade } from "../moteur/stockage/sauvegarde";
import type { ArmeDuPack, Contexte2D, Mission, Technique } from "../moteur/types";
import { t } from "../moteur/ui/i18n";
import {
  BESTIAIRE,
  BOSS,
  CYCLE,
  DESSINS_ENCRE,
  ELEMENTS,
  MISSIONS,
  PROFILS,
  type ElementNaruto
} from "../packs/naruto/manifeste";

const el = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

export interface PontArcade {
  demarrerCamera: () => Promise<void>;
  reinitialiserStocks: () => void;
  annoncer: (texte: string) => void;
  getGrade?: () => Grade;
  getContrat?: () => Contrat | null;
  onVictoireMission?: (missionId: string, rang: string) => void;
}

export class Arcade {
  private combat: Combat | null = null;
  private missionEnCours: Mission | null = null;

  constructor(private readonly pont: PontArcade) {}

  get actif(): boolean {
    return this.combat !== null;
  }

  get sousIllusion(): boolean {
    return this.combat?.joueur.illusion ?? false;
  }

  monter(): void {
    const grade = this.pont.getGrade?.() ?? "academie";
    const conteneur = el("listeMissions");
    conteneur.innerHTML = MISSIONS.map(m => {
      const accessible = estMissionAccessible(m.rang, grade);
      const classeVerrouillee = accessible ? "" : " verrouillee";
      const disabled = accessible ? "" : " disabled";
      return (
        `<button type="button" class="fiche-mission${classeVerrouillee}" data-mission="${m.id}"${disabled}>` +
        `<span class="rang-sceau">${m.rang}</span>` +
        `<span class="mission-corps">` +
        `<b>${t(`mission.${m.id}.nom`)}</b>` +
        `<small>${t("arcade.vagues", { n: m.vagues.length })}</small>` +
        `</span>` +
        `</button>`
      );
    }).join("");

    for (const b of conteneur.querySelectorAll<HTMLButtonElement>("[data-mission]:not([disabled])")) {
      b.addEventListener("click", () => {
        const mission = MISSIONS.find(m => m.id === b.dataset.mission);
        if (mission) void this.lancer(mission);
      });
    }

    const btnSurvie = document.getElementById("btnSurvieInfinie");
    if (btnSurvie) {
      btnSurvie.addEventListener("click", () => {
        void this.lancer(creerMissionSurvie(50));
      });
    }
  }

  ouvrirChoix(): void {
    this.monter();
    el("missions").hidden = false;
  }

  fermerChoix(): void {
    el("missions").hidden = true;
  }

  async lancer(mission: Mission): Promise<void> {
    this.fermerChoix();
    this.missionEnCours = mission;
    this.combat = new Combat({
      mission,
      cycle: CYCLE,
      profils: PROFILS,
      bestiaire: BESTIAIRE,
      boss: BOSS,
      contrat: this.pont.getContrat?.() ?? null
    });
    this.pont.reinitialiserStocks();
    el("hudArcade").hidden = false;
    el("finMission").hidden = true;
    this.rafraichirHud();

    await this.pont.demarrerCamera();
  }

  quitter(): void {
    this.combat = null;
    this.missionEnCours = null;
    el("hudArcade").hidden = true;
    el("finMission").hidden = true;
  }

  avancer(dt: number, temps: number, attitude: Attitude): void {
    if (!this.combat) return;
    this.combat.avancer(dt, temps, attitude);
    this.consommerEvenements();
    this.rafraichirHud();
  }

  dessiner(ctx: Contexte2D, largeur: number, hauteur: number, temps: number): void {
    if (!this.combat) return;
    dessinerScene(ctx, {
      scene: this.combat.scene,
      telegraphes: this.combat.telegraphes,
      dessins: DESSINS_ENCRE,
      largeur,
      hauteur,
      temps,
      nomElement: element => {
        if (!element || !(element in ELEMENTS)) return "";
        const def = ELEMENTS[element as ElementNaruto];
        return `${def.kanji} · ${t(`element.${element}`)}`;
      }
    });
  }

  /**
   * Transmet une technique reconnue au combat. Renvoie `false` si le combat la refuse
   * (technique `dojo`, chakra insuffisant, illusion) : l'effet visuel ne doit alors pas
   * partir.
   */
  technique(technique: Technique, maintenant: number): boolean {
    if (!this.combat) return true;
    const r = this.combat.technique(technique, maintenant);
    this.consommerEvenements();
    this.rafraichirHud();
    return r.ok;
  }

  arme(arme: ArmeDuPack, maintenant: number): void {
    if (!this.combat) return;
    this.combat.arme(arme, maintenant);
    this.consommerEvenements();
    this.rafraichirHud();
  }

  geste(jeton: string): void {
    if (!this.combat) return;
    this.combat.garde(jeton === "garde");
    if (jeton === "esquiveG" || jeton === "esquiveD" || jeton === "saut") {
      if (this.combat.esquive()) this.pont.annoncer(t("arcade.esquive"));
    }
    this.rafraichirHud();
  }

  charger(dt: number): void {
    if (!this.combat) return;
    this.combat.charger(dt);
    this.rafraichirHud();
  }

  kai(): boolean {
    if (!this.combat) return false;
    const rompu = this.combat.kai();
    this.rafraichirHud();
    return rompu;
  }

  private consommerEvenements(): void {
    if (!this.combat) return;
    for (const ev of this.combat.prendreEvenements()) {
      if (ev.type === "refus") {
        this.pont.annoncer(t(`arcade.refus.${ev.raison}`));
      } else if (ev.type === "impact" && ev.issue === "encaissee" && ev.degats > 0) {
        jouer("boum");
      } else if (ev.type === "victoire") {
        if (this.missionEnCours) {
          this.pont.onVictoireMission?.(this.missionEnCours.id, this.missionEnCours.rang);
        }
        this.afficherFin(true);
      } else if (ev.type === "defaite") {
        this.afficherFin(false);
      }
    }
  }

  private afficherFin(victoire: boolean): void {
    const panneau = el("finMission");
    el("finSceau").textContent = victoire ? "勝" : "敗";
    el("finTitre").textContent = t(victoire ? "arcade.victoire" : "arcade.defaite");
    panneau.hidden = false;
  }

  private rafraichirHud(): void {
    if (!this.combat) return;
    const { joueur, deroulement } = this.combat;
    el("jaugeVie").style.width = `${Math.round(joueur.vie)}%`;
    el("jaugeChakra").style.width = `${Math.round(joueur.chakra)}%`;
    el("jaugeInvocation").style.width = `${Math.round(joueur.invocation)}%`;
    el("sceauVague").textContent = `${deroulement.vagueCourante}/${deroulement.total}`;
    el("hudArcade").classList.toggle("illusion", joueur.illusion);
  }
}
