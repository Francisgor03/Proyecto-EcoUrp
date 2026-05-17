export const POWER_UP_IDS = ["hourglass", "shield", "lightning"] as const;

export type PowerUpId = (typeof POWER_UP_IDS)[number];

export interface PowerUpDefinition {
  id: PowerUpId;
  label: string;
  durationMs: number | null;
  colorHex: string;
  colorNumber: number;
  iconPath: string;
}

export interface PowerUpStatus {
  id: PowerUpId;
  remainingMs: number | null;
  durationMs: number | null;
}

const POWER_UP_DEFINITIONS: Record<PowerUpId, PowerUpDefinition> = {
  hourglass: {
    id: "hourglass",
    label: "Reloj de arena",
    durationMs: 15000,
    colorHex: "#f59e0b",
    colorNumber: 0xf59e0b,
    iconPath: "M6 2h12v4c0 2-2 3-4 4 2 1 4 2 4 4v4H6v-4c0-2 2-3 4-4-2-1-4-2-4-4V2zm3 4c0 1.2 1.2 2 3 3 1.8-1 3-1.8 3-3V4H9v2zm0 12v2h6v-2c0-1.2-1.2-2-3-3-1.8 1-3 1.8-3 3z",
  },
  shield: {
    id: "shield",
    label: "Escudo",
    durationMs: null,
    colorHex: "#3b82f6",
    colorNumber: 0x3b82f6,
    iconPath: "M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z",
  },
  lightning: {
    id: "lightning",
    label: "Rayo",
    durationMs: 15000,
    colorHex: "#facc15",
    colorNumber: 0xfacc15,
    iconPath: "M13 2L4 14h6l-1 8 9-12h-6l1-8z",
  },
};

export const POWER_UPS = POWER_UP_IDS.map((id) => POWER_UP_DEFINITIONS[id]);

export const POWER_UP_DROP_CHANCE = 0.1;
export const POWER_UP_SLOW_MULTIPLIER = 0.6;
export const POWER_UP_SPEED_MULTIPLIER = 1.4;

export function getPowerUpDefinition(id: PowerUpId): PowerUpDefinition {
  return POWER_UP_DEFINITIONS[id];
}
