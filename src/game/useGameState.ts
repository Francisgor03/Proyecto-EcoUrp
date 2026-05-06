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
import type {
  GameOverReason,
  GameStateBridge,
  GameStateSnapshot,
  GameSummary,
} from "@/game/core/GameEngine";
import { supabase } from "@/lib/supabaseClient";
import { saveTachoSession } from "@/lib/saveTachoSession";
import { saveTachoHighScore } from "@/lib/saveTachoHighScore";

export type ScoreSaveStatus = "idle" | "saving" | "saved" | "error";

const WRONG_FEEDBACK_PAUSE_MS = 10000;

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
  };
}

function validateSummary(summary: GameSummary): PersistValidation {
  const safeCorrect = Math.max(0, Math.floor(summary.correct));
  const safeWrong = Math.max(0, Math.floor(summary.wrong));
  const safeMissed = Math.max(0, Math.floor(summary.missed));

  const derivedScore = safeCorrect;
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
    summary,
    saveStatus: "idle",
    saveMessage: null,
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
      wrongFeedback: null,
      summary: null,
      saveStatus: "idle",
      saveMessage: null,
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

          let next: GameState = {
            ...previous,
            durationMs: previous.durationMs + safeDelta,
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

          return {
            ...previous,
            score: previous.score + 1,
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

          const hasFiniteLives = previous.lives !== null;
          const nextLives = hasFiniteLives ? Math.max(0, (previous.lives ?? 0) - 1) : null;

          const nextState: GameState = {
            ...previous,
            wrong,
            streak: 0,
            lives: nextLives,
            accuracy,
            wrongPauseMs: WRONG_FEEDBACK_PAUSE_MS,
            wrongFeedback: feedback,
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

          const hasFiniteLives = previous.lives !== null;
          const nextLives = hasFiniteLives ? Math.max(0, (previous.lives ?? 0) - 1) : null;

          const nextState: GameState = {
            ...previous,
            missed,
            streak: 0,
            lives: nextLives,
            accuracy,
          };

          if (hasFiniteLives && (nextLives ?? 0) <= 0) {
            return completeRound(nextState, "lives");
          }

          return nextState;
        }),
      onForceGameOver: (reason) => applyState((previous) => completeRound(previous, reason)),
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
      endGame,
    }),
    [clearWrongFeedback, endGame, returnToMenu, selectMode, setSelectedType, startGame],
  );

  return {
    state,
    actions,
    bridge,
  };
}

export { buildWrongBinFeedback };
