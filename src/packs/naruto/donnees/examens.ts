// Définitions canoniques des examens de l'Académie de Konoha (§9.8).
//
// - Examen Genin : l'examen de sortie de l'Académie — Bunshin no Jutsu.
// - Examen Chūnin : épreuve d'aptitude — déplacement instantané (Shunshin) et maîtrise élémentaire (Gōkakyū).

import type { ExamenDefinition } from "../../../moteur/jeu/examen";

export const EXAMENS_NARUTO: readonly ExamenDefinition[] = [
  {
    id: "examenGenin",
    nom: "Examen de passage Genin",
    gradeCible: "genin",
    epreuves: [
      {
        id: "genin_bunshin",
        nom: "Clonage (Bunshin no Jutsu)",
        techniqueId: "bunshin",
        tempsMax: 10,
        description: "Exécute le Bunshin no Jutsu classique pour prouver ta maîtrise du chakra à l'Académie."
      }
    ]
  },
  {
    id: "examenChunin",
    nom: "Épreuve finale de l'Examen Chūnin",
    gradeCible: "chunin",
    epreuves: [
      {
        id: "chunin_shunshin",
        nom: "Vitesse et esquive (Shunshin no Jutsu)",
        techniqueId: "shunshin",
        tempsMax: 8,
        description: "Disparais instantanément en concentrant ton chakra."
      },
      {
        id: "chunin_elementaire",
        nom: "Démonstration élémentaire Katon (Gōkakyū)",
        techniqueId: "goukakyu",
        tempsMax: 8,
        description: "Enchaîne les six mudras de la boule de feu suprême avec rigueur et vélocité."
      }
    ]
  }
];
