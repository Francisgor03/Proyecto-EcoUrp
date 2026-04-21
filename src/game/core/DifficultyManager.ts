import { getGameMode, type GameModeConfig, type GameModeId } from "@/game/config/gameModes";

export interface DifficultySnapshot {
  mode: GameModeId;
  spawnMs: number;
  fallSpeed: number;
  lives: number;
  infiniteLives: boolean;
  timeLimitMs: number | null;
}

/**
 * Gestiona ajustes dinamicos de dificultad segun modo, tiempo y puntaje.
 */
export class DifficultyManager {
  private baseMode: GameModeConfig;

  public constructor(initialMode: GameModeId) {
    this.baseMode = getGameMode(initialMode);
  }

  public setMode(mode: GameModeId): void {
    this.baseMode = getGameMode(mode);
  }

  public getCurrent(elapsedMs: number, score: number): DifficultySnapshot {
    const safeElapsed = Math.max(0, elapsedMs);
    const safeScore = Math.max(0, score);

    const timeProgress = Math.min(1, safeElapsed / 90000);
    const scoreProgress = Math.min(1, safeScore / 90);
    const blendedProgress = timeProgress * 0.55 + scoreProgress * 0.45;

    const rampCeilingByMode: Record<GameModeId, number> = {
      easy: 0.24,
      normal: 0.38,
      hard: 0.5,
      timed: 0.42,
      zen: 0.18,
    };

    const ramp = blendedProgress * rampCeilingByMode[this.baseMode.id];

    const spawnMs = Math.max(460, Math.round(this.baseMode.spawnMs * (1 - ramp * 0.48)));
    const fallSpeed = Math.max(110, this.baseMode.fallSpeed * (1 + ramp * 0.62));

    return {
      mode: this.baseMode.id,
      spawnMs,
      fallSpeed,
      lives: this.baseMode.lives,
      infiniteLives: this.baseMode.infiniteLives,
      timeLimitMs: this.baseMode.timeLimitMs,
    };
  }
}
