/**
 * Posición de spawn retornada por SpawnSystem.
 * En modo vertical (Eco-Catch): x aleatorio, y = -80 (fuera del canvas por arriba).
 * En modo horizontal (Eco-Villa): x = -80 (fuera del canvas por la izquierda),
 *   y aleatorio dentro del rango navegable.
 */
export interface SpawnPosition {
  x: number;
  y: number;
}

export interface SpawnSystemConfig {
  minX: number;
  maxX: number;
  minY?: number;
  maxY?: number;
  /** Si es true los elementos spawnan en el borde izquierdo y flotan hacia la derecha. */
  horizontal?: boolean;
  getCurrentSpawnMs: () => number;
  onSpawn: (pos: SpawnPosition) => void;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Controla el ritmo de aparición de residuos durante la partida.
 * Soporta tanto el eje vertical (Eco-Catch) como el horizontal (Eco-Villa).
 */
export class SpawnSystem {
  private spawnMinX: number;
  private spawnMaxX: number;
  private spawnMinY: number;
  private spawnMaxY: number;
  private readonly horizontal: boolean;
  private readonly getCurrentSpawnMs: () => number;
  private readonly onSpawn: (pos: SpawnPosition) => void;

  private cooldownMs = 0;
  private paused = false;

  public constructor(config: SpawnSystemConfig) {
    this.spawnMinX = config.minX;
    this.spawnMaxX = config.maxX;
    this.spawnMinY = config.minY ?? 0;
    this.spawnMaxY = config.maxY ?? 0;
    this.horizontal = config.horizontal ?? false;
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

  /** Actualiza los límites del eje principal (X para vertical, Y para horizontal). */
  public setBounds(minX: number, maxX: number, minY?: number, maxY?: number): void {
    this.spawnMinX = minX;
    this.spawnMaxX = maxX;
    if (minY !== undefined) this.spawnMinY = minY;
    if (maxY !== undefined) this.spawnMaxY = maxY;
  }

  private spawnOnce(): void {
    let pos: SpawnPosition;

    if (this.horizontal) {
      // Eco-Villa: spawn en borde derecho, altura aleatoria en zona navegable.
      const y = randomBetween(this.spawnMinY, this.spawnMaxY);
      pos = { x: this.spawnMaxX + 80, y };
    } else {
      // Eco-Catch: spawn fuera del canvas por arriba, x aleatorio.
      const x = randomInt(this.spawnMinX, this.spawnMaxX);
      pos = { x, y: -80 };
    }

    this.onSpawn(pos);
  }
}
