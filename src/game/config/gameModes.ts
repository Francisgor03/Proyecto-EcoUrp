export const GAME_MODE_IDS = [
  "easy",
  "normal",
  "hard",
  "timed",
  "zen",
  "eco-villa",
  "eco-villa-easy",
  "eco-villa-normal",
  "eco-villa-hard"
] as const;

export type GameModeId = (typeof GAME_MODE_IDS)[number];

/**
 * Indica si un modo usa mecánicas horizontales (Eco-Villa) en lugar
 * de las verticales clásicas (Eco-Catch).
 */
export function isHorizontalMode(mode: GameModeId): boolean {
  return mode.startsWith("eco-villa");
}

export interface GameModeConfig {
  id: GameModeId;
  label: string;
  description: string;
  spawnMs: number;
  fallSpeed: number;
  lives: number;
  timeLimitMs: number | null;
  infiniteLives: boolean;
}

const GAME_MODE_CONFIG_MAP: Record<GameModeId, GameModeConfig> = {
  easy: {
    id: "easy",
    label: "Facil",
    description: "Ritmo suave para practicar separacion y controles.",
    spawnMs: 2100,
    fallSpeed: 180,
    lives: 5,
    timeLimitMs: null,
    infiniteLives: false,
  },
  normal: {
    id: "normal",
    label: "Normal",
    description: "Equilibrio entre velocidad y precision para el uso diario.",
    spawnMs: 1800,
    fallSpeed: 220,
    lives: 3,
    timeLimitMs: null,
    infiniteLives: false,
  },
  hard: {
    id: "hard",
    label: "Dificil",
    description: "Mayor exigencia visual y de reflejos para jugadores avanzados.",
    spawnMs: 1200,
    fallSpeed: 280,
    lives: 3,
    timeLimitMs: null,
    infiniteLives: false,
  },
  timed: {
    id: "timed",
    label: "Contrarreloj",
    description: "Sesenta segundos para maximizar puntaje y precision.",
    spawnMs: 1500,
    fallSpeed: 240,
    lives: 3,
    timeLimitMs: 60000,
    infiniteLives: false,
  },
  zen: {
    id: "zen",
    label: "Zen",
    description: "Modo aprendizaje sin limite de vidas ni presion.",
    spawnMs: 2000,
    fallSpeed: 200,
    lives: Number.MAX_SAFE_INTEGER,
    timeLimitMs: null,
    infiniteLives: true,
  },
  "eco-villa": {
    id: "eco-villa",
    label: "Eco-Villa",
    description: "Navega por los canales de los Pantanos de Villa en tu balsa de totora.",
    spawnMs: 1900,
    // En modo horizontal, fallSpeed se reutiliza como velocidad de drift (px/s).
    fallSpeed: 200,
    lives: 3,
    timeLimitMs: null,
    infiniteLives: false,
  },
  "eco-villa-easy": {
    id: "eco-villa-easy",
    label: "Fácil",
    description: "Navegación lenta con menos residuos y obstáculos.",
    spawnMs: 2500,
    fallSpeed: 140,
    lives: 5,
    timeLimitMs: null,
    infiniteLives: false,
  },
  "eco-villa-normal": {
    id: "eco-villa-normal",
    label: "Normal",
    description: "Velocidad estándar y flujo moderado de residuos y troncos.",
    spawnMs: 1900,
    fallSpeed: 200,
    lives: 3,
    timeLimitMs: null,
    infiniteLives: false,
  },
  "eco-villa-hard": {
    id: "eco-villa-hard",
    label: "Difícil",
    description: "Corriente rápida, muchos obstáculos y mayor velocidad de reacción.",
    spawnMs: 1300,
    fallSpeed: 260,
    lives: 3,
    timeLimitMs: null,
    infiniteLives: false,
  },
};

export const GAME_MODES = GAME_MODE_IDS.map((modeId) => GAME_MODE_CONFIG_MAP[modeId]);

export function getGameMode(mode: GameModeId): GameModeConfig {
  return GAME_MODE_CONFIG_MAP[mode];
}

export function resolveGameMode(mode: string | null | undefined): GameModeConfig {
  if (!mode) {
    return GAME_MODE_CONFIG_MAP.normal;
  }

  if (GAME_MODE_IDS.includes(mode as GameModeId)) {
    return GAME_MODE_CONFIG_MAP[mode as GameModeId];
  }

  return GAME_MODE_CONFIG_MAP.normal;
}
