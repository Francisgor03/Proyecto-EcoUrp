export const ACHIEVEMENTS = [
  {
    id: "first_session",
    title: "Primer paso",
    description: "Tu primera partida registrada.",
    requirement: "Juega tu primera partida.",
    tooltip: [
      "Juega una partida completa.",
      "Se desbloquea al terminar tu primera sesion.",
    ],
    iconText: "A1",
  },
  {
    id: "five_sessions",
    title: "Eco constante",
    description: "Cinco partidas completadas.",
    requirement: "Completa 5 partidas.",
    tooltip: [
      "Completa 5 partidas en total.",
      "Cada partida cuenta, sin importar el modo.",
    ],
    iconText: "A2",
  },
  {
    id: "normal_50",
    title: "Racha normal",
    description: "Supera 50 puntos en modo Normal.",
    requirement: "Consigue 50 puntos en modo Normal.",
    tooltip: [
      "Consigue 50 puntos en modo Normal.",
      "El puntaje se mide al finalizar la partida.",
    ],
    iconText: "A3",
  },
  {
    id: "score_100",
    title: "Centenario",
    description: "Supera 100 puntos en cualquier modo.",
    requirement: "Consigue 100 puntos en cualquier modo.",
    tooltip: [
      "Consigue 100 puntos en cualquier modo.",
      "Puedes lograrlo en Normal, Dificil o Contrarreloj.",
    ],
    iconText: "A4",
  },
  {
    id: "modes_3",
    title: "Explorador",
    description: "Juega 3 modos distintos.",
    requirement: "Juega 3 modos distintos.",
    tooltip: [
      "Completa partidas en 3 modos distintos.",
      "Elige los modos desde el menu de inicio.",
    ],
    iconText: "A5",
  },
];

export const ACHIEVEMENT_IDS = ACHIEVEMENTS.reduce((acc, achievement) => {
  acc[achievement.id] = achievement.id;
  return acc;
}, {});
