export const GAME_MODE_IDS = ["easy", "normal", "hard", "timed", "zen"] as const;

export type GameModeId = (typeof GAME_MODE_IDS)[number];

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
