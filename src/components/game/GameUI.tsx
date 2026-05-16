"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WASTE_TYPES, type WasteTypeId } from "@/game/config/wasteTypes";
import { getStreakMultiplier, type GameState } from "@/game/useGameState";

interface GameUIProps {
  state: GameState;
  onSelectType: (type: WasteTypeId) => void;
  onDismissFeedback: () => void;
  onTogglePause: () => void;
  layout?: "overlay" | "stacked";
}

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

function AnimatedButton({ children, className = "", ...props }: AnimatedButtonProps) {
  return (
    <motion.button
      className={className}
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 520, damping: 32 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

function formatTimer(timerMs: number | null): string {
  if (timerMs === null) {
    return "Sin limite";
  }

  const seconds = Math.max(0, Math.ceil(timerMs / 1000));
  return `${seconds}s`;
}

function formatPauseCountdown(pauseMs: number): string {
  const seconds = Math.max(0, Math.ceil(pauseMs / 1000));
  return `${seconds}s`;
}

function getStreakTone(multiplier: number): string {
  if (multiplier >= 5) return "text-rose-500";
  if (multiplier >= 3) return "text-orange-500";
  if (multiplier >= 2) return "text-yellow-500";
  return "text-slate-400";
}

export default function GameUI({
  state,
  onSelectType,
  onDismissFeedback,
  onTogglePause,
  layout = "overlay",
}: GameUIProps) {
  const streakMultiplier = getStreakMultiplier(state.streak);
  const streakToneClass = getStreakTone(streakMultiplier);
  const pauseLabel = state.manualPaused ? "Reanudar" : "Pausa";
  const livesLabel = state.lives === null ? "INF" : state.lives;
  const timerLabel = formatTimer(state.timerMs);

  const isOverlay = layout === "overlay";
  const containerClassName = isOverlay
    ? "pointer-events-none absolute inset-0 z-20 p-2 pb-6 sm:p-4 sm:pb-8"
    : "pointer-events-none relative z-20 mt-3 px-2 pb-3";
  const feedbackWrapperClassName = isOverlay
    ? "pointer-events-auto absolute bottom-24 left-1/2 w-full max-w-2xl -translate-x-1/2 px-2 sm:bottom-32 sm:px-0"
    : "pointer-events-auto mt-3 w-full";
  const feedbackCardClassName = isOverlay
    ? "rounded-2xl border border-rose-200/70 bg-card/95 p-3 shadow-2xl shadow-rose-900/10 backdrop-blur dark:border-rose-400/40 dark:bg-rose-950/70 sm:p-5"
    : "rounded-2xl border border-rose-200/70 bg-card/95 p-3 shadow-xl shadow-rose-900/10 backdrop-blur dark:border-rose-400/40 dark:bg-rose-950/70";

  return (
    <div className={containerClassName}>
      <div className="pointer-events-auto absolute left-3 top-3 z-30">
        <AnimatedButton
          type="button"
          onClick={onTogglePause}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-card/85 text-foreground shadow-md backdrop-blur-sm hover:bg-card"
          aria-pressed={state.manualPaused}
          title={pauseLabel}
          aria-label={pauseLabel}
        >
          {state.manualPaused ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5h3v14H8V5zm5 0h3v14h-3V5z" />
            </svg>
          )}
        </AnimatedButton>
      </div>
      <div className="flex h-full flex-col justify-between">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <motion.div
            key={`score-${state.score}`}
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
            className="rounded-2xl border border-border/80 bg-card/85 px-2.5 py-2 text-foreground shadow-md backdrop-blur-sm sm:px-4 sm:py-3"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:text-xs">Puntos</p>
            <p className="mt-1 text-lg font-black sm:text-2xl">{state.score}</p>
          </motion.div>

          <motion.div
            key={`lives-${livesLabel}`}
            initial={{ y: -3 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="rounded-2xl border border-border/80 bg-card/85 px-2.5 py-2 text-foreground shadow-md backdrop-blur-sm sm:px-4 sm:py-3"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:text-xs">Vidas</p>
            <p className="mt-1 text-lg font-black sm:text-2xl">{livesLabel}</p>
          </motion.div>

          <div className="rounded-2xl border border-border/80 bg-card/85 px-2.5 py-2 text-foreground shadow-md backdrop-blur-sm sm:px-4 sm:py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:text-xs">Racha</p>
            <p className="mt-1 flex items-center gap-2 text-lg font-black sm:text-2xl">
              <span className={streakToneClass}>{state.streak}</span>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold sm:text-sm ${streakToneClass}`}>
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor">
                  <path d="M12 2c2.5 3.5 3 5.6 2 7.6 1.7-.3 3.6-2 3.6-4.8 2.6 2.3 4 5.4 4 8 0 5-4.2 9.2-9.6 9.2S2.4 17.8 2.4 12.8c0-3.4 1.7-6.6 4.6-8.7-.4 2.7.8 4.9 2.7 5.6C9 7.1 9.8 4.9 12 2z" />
                </svg>
                x{streakMultiplier}
              </span>
            </p>
          </div>

          <motion.div
            key={`timer-${timerLabel}`}
            initial={{ opacity: 0.65 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="rounded-2xl border border-border/80 bg-card/85 px-2.5 py-2 text-foreground shadow-md backdrop-blur-sm sm:px-4 sm:py-3"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:text-xs">Tiempo</p>
            <p className="mt-1 text-lg font-black sm:text-2xl">{timerLabel}</p>
          </motion.div>
        </div>

        <div className="pointer-events-auto grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {WASTE_TYPES.map((waste) => {
            const selected = state.selectedType === waste.id;

            return (
              <AnimatedButton
                key={waste.id}
                type="button"
                onClick={() => onSelectType(waste.id)}
                className={`rounded-2xl px-3 py-3 text-center shadow-lg transition-all sm:px-4 sm:py-4 ${selected
                    ? "ring-3 ring-white/80 ring-offset-2 ring-offset-transparent scale-105 shadow-xl"
                    : "opacity-80 hover:opacity-100 hover:shadow-xl"
                  }`}
                style={{ backgroundColor: waste.colorHex }}
                aria-pressed={selected}
              >
                <p className="text-sm font-extrabold text-white drop-shadow-sm sm:text-base">
                  {waste.label}
                </p>
              </AnimatedButton>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {state.wrongFeedback ? (
          <motion.div
            className={feedbackWrapperClassName}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.38, ease: "easeOut" }}
          >
            <div className={feedbackCardClassName}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-200 sm:text-sm">
                    {state.wrongFeedback.title}
                  </p>
                  <p className="mt-1 text-xs text-rose-900 dark:text-rose-100 sm:text-sm">
                    Residuo: <span className="font-semibold">{state.wrongFeedback.residuo}</span> | Elegiste: {" "}
                    <span className="font-semibold">{state.wrongFeedback.tachoElegido}</span>
                  </p>
                </div>
                <AnimatedButton
                  type="button"
                  onClick={onDismissFeedback}
                  className="rounded-full border border-rose-200/70 bg-card px-3 py-1 text-xs font-bold text-rose-700 dark:border-rose-400/40 dark:bg-rose-950/60 dark:text-rose-100"
                >
                  {state.wrongPauseMs > 0 ? "Continuar" : "Cerrar"}
                </AnimatedButton>
              </div>

              {state.wrongPauseMs > 0 ? (
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-200">
                  Reanudando en {formatPauseCountdown(state.wrongPauseMs)}
                </p>
              ) : null}

              <p className="mt-3 text-xs leading-relaxed text-rose-800 dark:text-rose-100 sm:text-sm">
                {state.wrongFeedback.body}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
