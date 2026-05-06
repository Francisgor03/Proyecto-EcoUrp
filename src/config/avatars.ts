export type UserStats = {
  totalGames: number;
  maxScore: number;
  modesPlayed: string[];
};

export type Avatar = {
  id: string;
  emoji: string;
  name: string;
  unlockCondition: string;
  unlockCheck: (stats: UserStats) => boolean;
};

export const DEFAULT_AVATAR_ID = "sprout";
export const ALL_GAME_MODES = ["easy", "normal", "hard", "timed", "zen"] as const;

function normalizeModes(modes: string[]): string[] {
  const uniqueModes = new Set<string>();

  modes.forEach((mode) => {
    if (typeof mode !== "string") return;
    const normalized = mode.trim().toLowerCase();
    if (!normalized) return;
    uniqueModes.add(normalized);
  });

  return Array.from(uniqueModes);
}

export const AVATARS: Avatar[] = [
  {
    id: "sprout",
    emoji: "🌱",
    name: "Brote",
    unlockCondition: "Siempre libre",
    unlockCheck: () => true,
  },
  {
    id: "earth",
    emoji: "🌍",
    name: "Guardián",
    unlockCondition: "Siempre libre",
    unlockCheck: () => true,
  },
  {
    id: "turtle",
    emoji: "🐢",
    name: "Tortuga",
    unlockCondition: "Siempre libre",
    unlockCheck: () => true,
  },
  {
    id: "leaf",
    emoji: "🌿",
    name: "Hoja",
    unlockCondition: "Siempre libre",
    unlockCheck: () => true,
  },
  {
    id: "panda",
    emoji: "🐼",
    name: "Panda Eco",
    unlockCondition: "Jugar 5 partidas",
    unlockCheck: (stats) => stats.totalGames >= 5,
  },
  {
    id: "star",
    emoji: "⭐",
    name: "Eco Master",
    unlockCondition: "Superar 100 puntos",
    unlockCheck: (stats) => stats.maxScore > 100,
  },
  {
    id: "eagle",
    emoji: "🦅",
    name: "Águila",
    unlockCondition: "Completar modo difícil",
    unlockCheck: (stats) => normalizeModes(stats.modesPlayed).includes("hard"),
  },
  {
    id: "trophy",
    emoji: "🏆",
    name: "Campeón",
    unlockCondition: "Jugar todos los modos",
    unlockCheck: (stats) => {
      const playedModes = new Set(normalizeModes(stats.modesPlayed));
      return ALL_GAME_MODES.every((mode) => playedModes.has(mode));
    },
  },
];

export function isValidAvatarId(avatarId: string | null | undefined): avatarId is string {
  if (typeof avatarId !== "string") return false;
  return AVATARS.some((avatar) => avatar.id === avatarId);
}

export function getAvatarById(avatarId: string | null | undefined): Avatar {
  if (isValidAvatarId(avatarId)) {
    return AVATARS.find((avatar) => avatar.id === avatarId) ?? AVATARS[0];
  }
  return AVATARS[0];
}

export function getNormalizedModes(modes: string[]): string[] {
  return normalizeModes(modes);
}
