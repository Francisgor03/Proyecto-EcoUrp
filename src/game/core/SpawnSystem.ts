import { WASTE_IDS, type WasteTypeId } from "@/game/config/wasteTypes";

export interface SpawnSystemConfig {
  width: number;
  paddingX: number;
  getCurrentSpawnMs: () => number;
  onSpawn: (type: WasteTypeId, x: number) => void;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Controla el ritmo de aparicion de residuos durante la partida.
 */
export class SpawnSystem {
  private width: number;
  private readonly paddingX: number;
  private readonly getCurrentSpawnMs: () => number;
  private readonly onSpawn: (type: WasteTypeId, x: number) => void;

  private cooldownMs = 0;
  private paused = false;

  public constructor(config: SpawnSystemConfig) {
    this.width = config.width;
    this.paddingX = config.paddingX;
    this.getCurrentSpawnMs = config.getCurrentSpawnMs;
    this.onSpawn = config.onSpawn;
  }

  public update(deltaMs: number): void {
    if (this.paused) {
      return;
    }

    this.cooldownMs -= deltaMs;

    while (this.cooldownMs <= 0) {
      this.spawnOnce();

      const spawnBase = this.getCurrentSpawnMs();
      const variance = spawnBase * (Math.random() * 0.32 - 0.16);
      this.cooldownMs += Math.max(340, spawnBase + variance);
    }
  }

  public forceSpawn(): void {
    if (this.paused) {
      return;
    }

    this.spawnOnce();
    this.cooldownMs = Math.max(250, this.getCurrentSpawnMs() * 0.55);
  }

  public reset(): void {
    this.cooldownMs = 0;
  }

  public setPaused(value: boolean): void {
    this.paused = value;
  }

  public setWidth(width: number): void {
    this.width = width;
  }

  private spawnOnce(): void {
    const type = WASTE_IDS[randomInt(0, WASTE_IDS.length - 1)];
    const minX = this.paddingX;
    const maxX = this.width - this.paddingX;
    const x = randomInt(minX, maxX);

    this.onSpawn(type, x);
  }
}
