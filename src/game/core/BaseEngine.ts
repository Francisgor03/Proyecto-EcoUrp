import type { WasteTypeId, WrongBinFeedback } from "@/game/config/wasteTypes";
import type { PowerUpId, PowerUpStatus } from "@/game/config/powerUps";
import type { GameModeId } from "@/game/config/gameModes";

export type GamePhase = "menu" | "playing" | "game-over";
export type GameOverReason = "time" | "lives" | "manual";

export interface TutorialRuntime {
  blockSpawns: boolean;
  freezeTimer: boolean;
}

export interface GameSummary {
  mode: GameModeId;
  score: number;
  accuracy: number;
  durationMs: number;
  correct: number;
  wrong: number;
  missed: number;
  bestStreak: number;
  reason: GameOverReason;
}

export interface GameStateSnapshot {
  phase: GamePhase;
  mode: GameModeId;
  selectedType: WasteTypeId;
  score: number;
  correct: number;
  lives: number | null;
  timerMs: number | null;
  durationMs: number;
  wrongPauseMs: number;
  manualPaused: boolean;
  powerUps: PowerUpStatus[];
  summary: GameSummary | null;
  tutorial: TutorialRuntime | null;
}

export interface GameStateBridge {
  getState: () => GameStateSnapshot;
  onFrameTick: (deltaMs: number) => GameStateSnapshot;
  onSelectWasteType: (type: WasteTypeId) => GameStateSnapshot;
  onCorrectCatch: () => GameStateSnapshot;
  onWrongCatch: (feedback: WrongBinFeedback) => GameStateSnapshot;
  onMissedWaste: () => GameStateSnapshot;
  onPowerUpCollected: (id: PowerUpId) => GameStateSnapshot;
  onForceGameOver: (reason: GameOverReason) => GameStateSnapshot;
  onBirdRescue?: () => GameStateSnapshot;
  onObstacleHit?: () => GameStateSnapshot;
}

export interface BaseEngine {
  startRound(): void;
  stopRound(): void;
  resize(width: number, height: number): void;
  destroy(): void;
}
