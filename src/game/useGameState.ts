"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getGameMode,
  resolveGameMode,
  type GameModeId,
} from "@/game/config/gameModes";
import {
  buildWrongBinFeedback,
  type WasteTypeId,
  type WrongBinFeedback,
} from "@/game/config/wasteTypes";
import {
  getPowerUpDefinition,
  type PowerUpId,
  type PowerUpStatus,
} from "@/game/config/powerUps";
import type {
  GameOverReason,
  GameStateBridge,
  GameStateSnapshot,
  GameSummary,
  TutorialRuntime,
} from "@/game/core/BaseEngine";
import { supabase } from "@/lib/supabaseClient";
import { saveTachoSession } from "@/lib/saveTachoSession";
import { saveTachoHighScore } from "@/lib/saveTachoHighScore";

export type ScoreSaveStatus = "idle" | "saving" | "saved" | "error";

const WRONG_FEEDBACK_PAUSE_MS = 10000;
const BASE_SCORE_PER_CATCH = 1;
const STREAK_THRESHOLDS = [10, 20, 40, 80];
const STREAK_MAX_MULTIPLIER = 1 + STREAK_THRESHOLDS.length;

export interface GameRoundSummary extends GameSummary {
  roundId: number;
}

export interface GameState extends GameStateSnapshot {
  roundId: number;
  correct: number;
  wrong: number;
  missed: number;
  streak: number;
  bestStreak: number;
  accuracy: number;
  wrongFeedback: WrongBinFeedback | null;
  saveStatus: ScoreSaveStatus;
  saveMessage: string | null;
  summary: GameRoundSummary | null;
}

export interface UseGameStateActions {
  selectMode: (mode: GameModeId) => void;
  startGame: (mode?: GameModeId) => void;
  returnToMenu: () => void;
  setSelectedType: (type: WasteTypeId) => void;
  clearWrongFeedback: () => void;
  togglePause: () => void;
  setManualPaused: (paused: boolean) => void;
  setTutorialState: (tutorial: TutorialRuntime | null) => void;
  setTutorialPowerUps: (powerUps: PowerUpStatus[]) => void;
  setTutorialFeedback: (feedback: WrongBinFeedback | null) => void;
  endGame: () => void;
}

export interface UseGameStateResult {
  state: GameState;
  actions: UseGameStateActions;
  bridge: GameStateBridge;
}

interface PersistValidation {
  score: number;
  mode: GameModeId;
  accuracy: number;
  durationMs: number;
}

interface PersistResult {
  ok: boolean;
  message: string;
}

function computeAccuracy(correct: number, wrong: number, missed: number): number {
  const attempts = Math.max(0, correct + wrong + missed);
  if (attempts === 0) {
    return 0;
  }

  const accuracy = (correct / attempts) * 100;
  return Number(accuracy.toFixed(2));
}

export function getStreakMultiplier(streak: number): number {
  const safeStreak = Math.max(0, Math.floor(streak));
  let multiplier = 1;

  for (const threshold of STREAK_THRESHOLDS) {
    if (safeStreak >= threshold) {
      multiplier += 1;
    } else {
      break;
    }
  }

  return Math.min(STREAK_MAX_MULTIPLIER, multiplier);
}

function computeScoreDelta(nextStreak: number): number {
  return BASE_SCORE_PER_CATCH * getStreakMultiplier(nextStreak);
}

function buildPowerUpStatus(id: PowerUpId): PowerUpStatus {
  const definition = getPowerUpDefinition(id);

  return {
    id,
    remainingMs: definition.durationMs,
    durationMs: definition.durationMs,
  };
}

function activatePowerUp(powerUps: PowerUpStatus[], id: PowerUpId): PowerUpStatus[] {
  const existingIndex = powerUps.findIndex((powerUp) => powerUp.id === id);
  const definition = getPowerUpDefinition(id);

  if (definition.durationMs === null && existingIndex !== -1) {
    return powerUps;
  }

  const nextStatus = buildPowerUpStatus(id);

  if (existingIndex === -1) {
    return [...powerUps, nextStatus];
  }

  const nextPowerUps = powerUps.slice();
  nextPowerUps[existingIndex] = nextStatus;
  return nextPowerUps;
}

function tickPowerUps(powerUps: PowerUpStatus[], deltaMs: number): PowerUpStatus[] {
  if (powerUps.length === 0) {
    return powerUps;
  }

  let changed = false;
  const nextPowerUps: PowerUpStatus[] = [];

  for (const powerUp of powerUps) {
    if (powerUp.remainingMs === null || powerUp.durationMs === null) {
      nextPowerUps.push(powerUp);
      continue;
    }

    const remainingMs = Math.max(0, powerUp.remainingMs - deltaMs);
    if (remainingMs <= 0) {
      changed = true;
      continue;
    }

    if (remainingMs !== powerUp.remainingMs) {
      changed = true;
    }

    nextPowerUps.push({
      ...powerUp,
      remainingMs,
    });
  }

  return changed ? nextPowerUps : powerUps;
}

function consumeShield(powerUps: PowerUpStatus[]): { powerUps: PowerUpStatus[]; consumed: boolean } {
  const shieldIndex = powerUps.findIndex((powerUp) => powerUp.id === "shield");

  if (shieldIndex === -1) {
    return {
      powerUps,
      consumed: false,
    };
  }

  return {
    powerUps: powerUps.filter((_, index) => index !== shieldIndex),
    consumed: true,
  };
}

function createInitialState(mode: GameModeId = "normal"): GameState {
  return {
    phase: "menu",
    roundId: 0,
    mode,
    selectedType: "plastic",
    score: 0,
    lives: null,
    timerMs: null,
    durationMs: 0,
    wrongPauseMs: 0,
    manualPaused: false,
    powerUps: [],
    correct: 0,
    wrong: 0,
    missed: 0,
    streak: 0,
    bestStreak: 0,
    accuracy: 0,
    wrongFeedback: null,
    saveStatus: "idle",
    saveMessage: null,
    summary: null,
    tutorial: null,
  };
}

function validateSummary(summary: GameSummary): PersistValidation {
  const safeCorrect = Math.max(0, Math.floor(summary.correct));
  const safeWrong = Math.max(0, Math.floor(summary.wrong));
  const safeMissed = Math.max(0, Math.floor(summary.missed));

  const derivedScore = safeCorrect * BASE_SCORE_PER_CATCH * STREAK_MAX_MULTIPLIER;
  const rawScore = Number.isFinite(summary.score) ? Math.floor(summary.score) : 0;
  const score = Math.max(0, Math.min(rawScore, derivedScore));

  const durationMs = Number.isFinite(summary.durationMs)
    ? Math.max(0, Math.floor(summary.durationMs))
    : 0;

  const mode = resolveGameMode(summary.mode).id;
  const accuracy = computeAccuracy(safeCorrect, safeWrong, safeMissed);

  return {
    score,
    mode,
    accuracy,
    durationMs,
  };
}

async function persistRoundSummary(summary: GameSummary): Promise<PersistResult> {
  const validated = validateSummary(summary);

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase no esta configurado en este entorno.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      message: "No hay sesion activa para guardar el resultado.",
    };
  }

  const createdAt = new Date().toISOString();

  const { error: insertError } = await supabase.from("ecourp_tacho_scores").insert({
    user_id: user.id,
    score: validated.score,
    mode: validated.mode,
    accuracy: validated.accuracy,
    duration: validated.durationMs,
    created_at: createdAt,
  });

  if (insertError) {
    const { error: legacyInsertError } = await supabase.from("ecourp_tacho_scores").insert({
      user_id: user.id,
      score: validated.score,
      mode: validated.mode,
      accuracy: validated.accuracy,
      duration_ms: validated.durationMs,
      created_at: createdAt,
    });

    if (legacyInsertError) {
      console.warn("[EcoURP] No se pudo guardar score final:", legacyInsertError.message);
    }
  }

  await Promise.all([
    saveTachoSession({
      score: validated.score,
      gameMode: validated.mode,
      durationMs: validated.durationMs,
    }),
    saveTachoHighScore(validated.score, validated.mode),
  ]);

  return {
    ok: true,
    message: "Puntaje y sesion guardados correctamente.",
  };
}

function buildSummary(current: GameState, reason: GameOverReason): GameRoundSummary {
  return {
    roundId: current.roundId,
    mode: current.mode,
    score: current.score,
    accuracy: current.accuracy,
    durationMs: current.durationMs,
    correct: current.correct,
    wrong: current.wrong,
    missed: current.missed,
    bestStreak: current.bestStreak,
    reason,
  };
}

function completeRound(current: GameState, reason: GameOverReason): GameState {
  if (current.phase === "game-over") {
    return current;
  }

  const summary = buildSummary(current, reason);

  return {
    ...current,
    phase: "game-over",
    timerMs: current.timerMs !== null ? Math.max(0, current.timerMs) : null,
    wrongPauseMs: 0,
    manualPaused: false,
    summary,
    saveStatus: "idle",
    saveMessage: null,
    tutorial: null,
  };
}

export function useGameState(initialMode: GameModeId = "normal"): UseGameStateResult {
  const [state, setState] = useState<GameState>(() => createInitialState(initialMode));
  const stateRef = useRef<GameState>(state);

  const applyState = useCallback((updater: (previous: GameState) => GameState): GameState => {
    const next = updater(stateRef.current);
    stateRef.current = next;
    setState(next);
    return next;
  }, []);

  const selectMode = useCallback(
    (mode: GameModeId) => {
      applyState((previous) => {
        if (previous.phase === "playing") {
          return previous;
        }

        return {
          ...previous,
          mode,
        };
      });
    },
    [applyState],
  );

  const startGame = useCallback(
    (requestedMode?: GameModeId) => {
      applyState((previous) => {
        const mode = requestedMode ?? previous.mode;
        const modeConfig = getGameMode(mode);

        return {
          phase: "playing",
          roundId: previous.roundId + 1,
          mode,
          selectedType: "plastic",
          score: 0,
          lives: modeConfig.infiniteLives ? null : modeConfig.lives,
          timerMs: modeConfig.timeLimitMs,
          durationMs: 0,
          wrongPauseMs: 0,
          manualPaused: false,
          powerUps: [],
          correct: 0,
          wrong: 0,
          missed: 0,
          streak: 0,
          bestStreak: 0,
          accuracy: 0,
          wrongFeedback: null,
          saveStatus: "idle",
          saveMessage: null,
          summary: null,
          tutorial: previous.tutorial,
        };
      });
    },
    [applyState],
  );

  const returnToMenu = useCallback(() => {
    applyState((previous) => ({
      ...previous,
      phase: "menu",
      wrongPauseMs: 0,
      manualPaused: false,
      powerUps: [],
      wrongFeedback: null,
      summary: null,
      saveStatus: "idle",
      saveMessage: null,
      tutorial: null,
    }));
  }, [applyState]);

  const setSelectedType = useCallback(
    (type: WasteTypeId) => {
      applyState((previous) => ({
        ...previous,
        selectedType: type,
      }));
    },
    [applyState],
  );

  const clearWrongFeedback = useCallback(() => {
    applyState((previous) => ({
      ...previous,
      wrongPauseMs: 0,
      wrongFeedback: null,
    }));
  }, [applyState]);

  const togglePause = useCallback(() => {
    applyState((previous) => {
      if (previous.phase !== "playing") {
        return previous;
      }

      return {
        ...previous,
        manualPaused: !previous.manualPaused,
      };
    });
  }, [applyState]);

  const setManualPaused = useCallback(
    (paused: boolean) => {
      applyState((previous) => {
        if (previous.phase !== "playing") {
          return previous;
        }

        if (previous.manualPaused === paused) {
          return previous;
        }

        return {
          ...previous,
          manualPaused: paused,
        };
      });
    },
    [applyState],
  );

  const setTutorialState = useCallback(
    (tutorial: TutorialRuntime | null) => {
      applyState((previous) => {
        const previousTutorial = previous.tutorial;
        const sameTutorial =
          (previousTutorial?.blockSpawns ?? false) === (tutorial?.blockSpawns ?? false) &&
          (previousTutorial?.freezeTimer ?? false) === (tutorial?.freezeTimer ?? false);

        if (sameTutorial) {
          return previous;
        }

        return {
          ...previous,
          tutorial,
        };
      });
    },
    [applyState],
  );

  const setTutorialPowerUps = useCallback(
    (powerUps: PowerUpStatus[]) => {
      applyState((previous) => {
        if (previous.powerUps === powerUps) {
          return previous;
        }

        return {
          ...previous,
          powerUps,
        };
      });
    },
    [applyState],
  );

  const setTutorialFeedback = useCallback(
    (feedback: WrongBinFeedback | null) => {
      applyState((previous) => {
        if (previous.wrongFeedback === feedback && previous.wrongPauseMs === 0) {
          return previous;
        }

        return {
          ...previous,
          wrongFeedback: feedback,
          wrongPauseMs: 0,
        };
      });
    },
    [applyState],
  );

  const endGame = useCallback(() => {
    applyState((previous) => completeRound(previous, "manual"));
  }, [applyState]);

  const bridge = useMemo<GameStateBridge>(
    () => ({
      getState: () => stateRef.current,
      onFrameTick: (deltaMs) =>
        applyState((previous) => {
          if (previous.phase !== "playing") {
            return previous;
          }

          const safeDelta = Math.max(0, deltaMs);

          if (previous.wrongPauseMs > 0) {
            const wrongPauseMs = Math.max(0, previous.wrongPauseMs - safeDelta);

            return {
              ...previous,
              wrongPauseMs,
              wrongFeedback: wrongPauseMs === 0 ? null : previous.wrongFeedback,
            };
          }

          if (previous.manualPaused) {
            return previous;
          }

          if (previous.tutorial?.freezeTimer) {
            return previous;
          }

          let next: GameState = {
            ...previous,
            durationMs: previous.durationMs + safeDelta,
            powerUps: tickPowerUps(previous.powerUps, safeDelta),
          };

          if (next.timerMs !== null) {
            const timerMs = Math.max(0, next.timerMs - safeDelta);
            next = {
              ...next,
              timerMs,
            };

            if (timerMs <= 0) {
              return completeRound(next, "time");
            }
          }

          return next;
        }),
      onSelectWasteType: (type) =>
        applyState((previous) => ({
          ...previous,
          selectedType: type,
        })),
      onCorrectCatch: () =>
        applyState((previous) => {
          if (previous.phase !== "playing") {
            return previous;
          }

          const correct = previous.correct + 1;
          const streak = previous.streak + 1;
          const bestStreak = Math.max(previous.bestStreak, streak);
          const wrong = previous.wrong;
          const missed = previous.missed;
          const accuracy = computeAccuracy(correct, wrong, missed);
          const scoreDelta = computeScoreDelta(streak);

          return {
            ...previous,
            score: previous.score + scoreDelta,
            correct,
            streak,
            bestStreak,
            accuracy,
            wrongPauseMs: 0,
            wrongFeedback: null,
          };
        }),
      onWrongCatch: (feedback) =>
        applyState((previous) => {
          if (previous.phase !== "playing") {
            return previous;
          }

          const wrong = previous.wrong + 1;
          const correct = previous.correct;
          const missed = previous.missed;
          const accuracy = computeAccuracy(correct, wrong, missed);

          const shieldState = consumeShield(previous.powerUps);
          const shieldConsumed = shieldState.consumed;

          const hasFiniteLives = previous.lives !== null;
          const nextLives = hasFiniteLives
            ? shieldConsumed
              ? previous.lives
              : Math.max(0, (previous.lives ?? 0) - 1)
            : null;

          const nextState: GameState = {
            ...previous,
            wrong,
            streak: shieldConsumed ? previous.streak : 0,
            lives: nextLives,
            accuracy,
            wrongPauseMs: shieldConsumed ? 0 : WRONG_FEEDBACK_PAUSE_MS,
            wrongFeedback: shieldConsumed ? null : feedback,
            powerUps: shieldState.powerUps,
          };

          if (hasFiniteLives && (nextLives ?? 0) <= 0) {
            return completeRound(nextState, "lives");
          }

          return nextState;
        }),
      onMissedWaste: () =>
        applyState((previous) => {
          if (previous.phase !== "playing") {
            return previous;
          }

          const missed = previous.missed + 1;
          const correct = previous.correct;
          const wrong = previous.wrong;
          const accuracy = computeAccuracy(correct, wrong, missed);

          const shieldState = consumeShield(previous.powerUps);
          const shieldConsumed = shieldState.consumed;

          const hasFiniteLives = previous.lives !== null;
          const nextLives = hasFiniteLives
            ? shieldConsumed
              ? previous.lives
              : Math.max(0, (previous.lives ?? 0) - 1)
            : null;

          const nextState: GameState = {
            ...previous,
            missed,
            streak: shieldConsumed ? previous.streak : 0,
            lives: nextLives,
            accuracy,
            powerUps: shieldState.powerUps,
          };

          if (hasFiniteLives && (nextLives ?? 0) <= 0) {
            return completeRound(nextState, "lives");
          }

          return nextState;
        }),
      onPowerUpCollected: (id) =>
        applyState((previous) => {
          if (previous.phase !== "playing") {
            return previous;
          }

          const nextPowerUps = activatePowerUp(previous.powerUps, id);
          if (nextPowerUps === previous.powerUps) {
            return previous;
          }

          return {
            ...previous,
            powerUps: nextPowerUps,
          };
        }),
      onForceGameOver: (reason) => applyState((previous) => completeRound(previous, reason)),
      onBirdRescue: () =>
        applyState((previous) => {
          if (previous.phase !== "playing") {
            return previous;
          }

          const correct = previous.correct + 1;
          const streak = previous.streak + 1;
          const bestStreak = Math.max(previous.bestStreak, streak);
          const wrong = previous.wrong;
          const missed = previous.missed;
          const accuracy = computeAccuracy(correct, wrong, missed);
          
          const modeConfig = getGameMode(previous.mode);
          const hasFiniteLives = previous.lives !== null;
          const nextLives = hasFiniteLives
            ? Math.min(modeConfig.lives, (previous.lives ?? 0) + 1)
            : null;

          return {
            ...previous,
            score: previous.score + 5,
            correct,
            streak,
            bestStreak,
            lives: nextLives,
            accuracy,
            wrongPauseMs: 0,
            wrongFeedback: null,
          };
        }),
      onObstacleHit: () =>
        applyState((previous) => {
          if (previous.phase !== "playing") {
            return previous;
          }

          const wrong = previous.wrong + 1;
          const correct = previous.correct;
          const missed = previous.missed;
          const accuracy = computeAccuracy(correct, wrong, missed);

          const shieldState = consumeShield(previous.powerUps);
          const shieldConsumed = shieldState.consumed;

          const hasFiniteLives = previous.lives !== null;
          const nextLives = hasFiniteLives
            ? shieldConsumed
              ? previous.lives
              : Math.max(0, (previous.lives ?? 0) - 1)
            : null;

          const nextState: GameState = {
            ...previous,
            wrong,
            streak: shieldConsumed ? previous.streak : 0,
            lives: nextLives,
            accuracy,
            powerUps: shieldState.powerUps,
          };

          if (hasFiniteLives && (nextLives ?? 0) <= 0) {
            return completeRound(nextState, "lives");
          }

          return nextState;
        }),
    }),
    [applyState],
  );

  useEffect(() => {
    if (state.phase !== "game-over" || !state.summary || state.saveStatus !== "idle") {
      return;
    }

    const summary = state.summary;
    let cancelled = false;

    applyState((previous) => {
      if (previous.summary?.roundId !== summary.roundId) {
        return previous;
      }

      return {
        ...previous,
        saveStatus: "saving",
        saveMessage: "Resultado guardado",
      };
    });

    void (async () => {
      const result = await persistRoundSummary(summary);

      if (cancelled) {
        return;
      }

      applyState((previous) => {
        if (previous.summary?.roundId !== summary.roundId) {
          return previous;
        }

        return {
          ...previous,
          saveStatus: result.ok ? "saved" : "error",
          saveMessage: result.ok ? "Resultado guardado" : result.message,
        };
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [applyState, state.phase, state.saveStatus, state.summary]);

  const actions = useMemo<UseGameStateActions>(
    () => ({
      selectMode,
      startGame,
      returnToMenu,
      setSelectedType,
      clearWrongFeedback,
      togglePause,
      setManualPaused,
      setTutorialState,
      setTutorialPowerUps,
      setTutorialFeedback,
      endGame,
    }),
    [
      clearWrongFeedback,
      endGame,
      returnToMenu,
      selectMode,
      setSelectedType,
      startGame,
      togglePause,
      setManualPaused,
      setTutorialState,
      setTutorialPowerUps,
      setTutorialFeedback,
    ],
  );

  return {
    state,
    actions,
    bridge,
  };
}

export { buildWrongBinFeedback };
