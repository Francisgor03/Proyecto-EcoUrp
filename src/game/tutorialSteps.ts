export type TutorialStep = {
  id: string;
  title: string;
  body: string;
  target?: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  phase?: "menu" | "playing";
  interaction?: "free" | "lock";
  dimmer?: "strong" | "soft" | "none";
};

export const MENU_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "menu-modes",
    title: "Selecciona un modo",
    body: "Cada modo cambia velocidad, vidas y tiempo. Toca una tarjeta para elegir.",
    target: "tutorial-mode-cards",
    placement: "top",
    phase: "menu",
    interaction: "lock",
    dimmer: "strong",
  },
  {
    id: "menu-start",
    title: "Inicia la partida",
    body: "Cuando estes listo, inicia el juego. El tutorial continuara en pantalla.",
    target: "tutorial-start-button",
    placement: "top",
    phase: "menu",
    interaction: "lock",
    dimmer: "strong",
  },
];

export const GAME_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "game-controls",
    title: "Mueve el tacho",
    body: "Usa flechas o A/D para moverte y cambia el tipo con 1-4 o con los botones de colores.",
    target: "tutorial-game-canvas",
    placement: "top",
    phase: "playing",
    interaction: "free",
    dimmer: "soft",
  },
  {
    id: "game-hud",
    title: "Puntaje, racha y tiempo",
    body: "Los aciertos suman puntos y la racha sube el multiplicador. Aqui ves vidas y tiempo restante.",
    target: "tutorial-hud-stats",
    placement: "bottom",
    phase: "playing",
    interaction: "free",
    dimmer: "soft",
  },
  {
    id: "game-powerups",
    title: "Power-ups",
    body: "Reloj de arena ralentiza la caida, escudo evita perder vida y rayo te hace mas rapido.",
    target: "tutorial-powerups",
    placement: "right",
    phase: "playing",
    interaction: "free",
    dimmer: "soft",
  },
  {
    id: "game-feedback",
    title: "Feedback educativo",
    body: "Si fallas, veras un aviso con el motivo y el tacho correcto.",
    target: "tutorial-wrong-feedback",
    placement: "top",
    phase: "playing",
    interaction: "free",
    dimmer: "soft",
  },
  {
    id: "game-ready",
    title: "Listo para jugar",
    body: "Cuando termines el tutorial, iniciaremos una cuenta regresiva para empezar.",
    placement: "center",
    phase: "playing",
    interaction: "free",
    dimmer: "soft",
  },
];
