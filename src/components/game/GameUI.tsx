"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { AnimatePresence, motion, type MotionProps } from "framer-motion";
import { WASTE_TYPES, type WasteTypeId } from "@/game/config/wasteTypes";
import { getStreakMultiplier, type GameState } from "@/game/useGameState";

interface GameUIProps {
  state: GameState;
  onSelectType: (type: WasteTypeId) => void;
  onDismissFeedback: () => void;
  onTogglePause: () => void;
  onEndGame: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  layout?: "overlay" | "stacked";
  onToggleMusic?: () => void;
  isMusicMuted?: boolean;
}

type AnimatedButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof MotionProps> &
  MotionProps & {
    children: ReactNode;
  };

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
  onEndGame,
  onToggleFullscreen,
  isFullscreen = false,
  layout = "overlay",
  onToggleMusic,
  isMusicMuted = false,
}: GameUIProps) {
  const streakMultiplier = getStreakMultiplier(state.streak);
  const streakToneClass = getStreakTone(streakMultiplier);
  const pauseLabel = "Pausa";
  const livesLabel = state.lives === null ? "INF" : state.lives;
  const timerLabel = formatTimer(state.timerMs);
  const pauseButtonClassName = state.manualPaused
    ? "flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200/70 bg-emerald-500/25 text-emerald-50 shadow-lg shadow-emerald-900/20 backdrop-blur-sm transition hover:bg-emerald-500/35"
    : "flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/55 text-white shadow-lg shadow-black/30 backdrop-blur-sm transition hover:bg-black/70";
  const fullscreenAvailable = Boolean(onToggleFullscreen);
  const fullscreenToggleClassName = fullscreenAvailable
    ? isFullscreen
      ? "bg-emerald-500/90"
      : "bg-slate-200/70"
    : "bg-slate-200/40 opacity-60";

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
  const feedbackAnchorClassName =
    "pointer-events-none absolute bottom-24 left-1/2 w-full max-w-2xl -translate-x-1/2 px-2 opacity-0 sm:bottom-32 sm:px-0";

  return (
    <div className={containerClassName}>
      <div className="flex h-full flex-col justify-between">
        <div className="space-y-2">
          <div className="pointer-events-auto flex flex-wrap items-center gap-2">
            <AnimatedButton
              type="button"
              onClick={onTogglePause}
              className={pauseButtonClassName}
              aria-pressed={state.manualPaused}
              title={pauseLabel}
              aria-label={pauseLabel}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8 5h3v14H8V5zm5 0h3v14h-3V5z" />
              </svg>
            </AnimatedButton>

            {onToggleMusic && (
              <AnimatedButton
                type="button"
                onClick={onToggleMusic}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/55 text-white shadow-lg shadow-black/30 backdrop-blur-sm transition hover:bg-black/70"
                title={isMusicMuted ? "Activar música" : "Desactivar música"}
                aria-label={isMusicMuted ? "Activar música" : "Desactivar música"}
              >
                {isMusicMuted ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  </svg>
                )}
              </AnimatedButton>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3" data-tutorial="tutorial-hud-stats">
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
        </div>

        {!state.mode.startsWith("eco-villa") && (
          <div className="pointer-events-auto grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3" data-tutorial="tutorial-waste-selector">
            {WASTE_TYPES.map((waste) => {
              const selected = state.selectedType === waste.id;
              const buttonStyle = {
                backgroundColor: waste.colorHex,
                backgroundImage: `linear-gradient(160deg, ${waste.colorHex} 0%, ${waste.colorHex} 58%, rgba(255, 255, 255, 0.22) 100%)`,
              };

              return (
                <AnimatedButton
                  key={waste.id}
                  type="button"
                  onClick={() => onSelectType(waste.id)}
                  className={`group relative overflow-hidden rounded-2xl border border-white/35 px-3 py-3 text-left shadow-lg transition-all sm:px-4 sm:py-4 ${
                    selected
                      ? "ring-3 ring-white/80 ring-offset-2 ring-offset-transparent scale-[1.03] shadow-2xl"
                      : "opacity-90 hover:opacity-100 hover:shadow-xl"
                  }`}
                  style={buttonStyle}
                  aria-pressed={selected}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-white/0 to-black/20 opacity-80" />
                  <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/25 blur-2xl" />
                  <div className="relative z-10 flex h-full items-center justify-center text-center">
                    <span className="text-sm font-extrabold text-white drop-shadow-sm sm:text-base">
                      {waste.label}
                    </span>
                  </div>
                </AnimatedButton>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {state.manualPaused ? (
          <motion.div
            className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 rounded-3xl bg-black/40 backdrop-blur-[2px]" />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="relative w-full max-w-md rounded-3xl border border-border bg-card/95 p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-6"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">Pausa</p>
              <h3 className="mt-2 text-xl font-black text-foreground sm:text-2xl">Juego en pausa</h3>

              <div className="mt-4 grid gap-3">
                <AnimatedButton
                  type="button"
                  onClick={onTogglePause}
                  className="w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg"
                >
                  Reanudar
                </AnimatedButton>
                <AnimatedButton
                  type="button"
                  onClick={onEndGame}
                  className="w-full rounded-2xl border border-rose-200/70 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-700 shadow-lg shadow-rose-900/10"
                >
                  Terminar partida
                </AnimatedButton>
              </div>

              <div className="mt-4 rounded-2xl border border-border bg-surface-raised/70 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                  Configuracion
                </p>
                <div className="mt-3 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Pantalla completa</p>
                      <p className="text-xs text-muted-foreground">
                        {isFullscreen ? "Activada" : "Desactivada"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onToggleFullscreen}
                      disabled={!fullscreenAvailable}
                      role="switch"
                      aria-checked={isFullscreen}
                      aria-label="Pantalla completa"
                      className={`relative h-8 w-14 rounded-full border border-border transition ${fullscreenToggleClassName}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                          isFullscreen ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {onToggleMusic && (
                    <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Música de fondo</p>
                        <p className="text-xs text-muted-foreground">
                          {isMusicMuted ? "Desactivada" : "Activada"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onToggleMusic}
                        role="switch"
                        aria-checked={!isMusicMuted}
                        aria-label="Música de fondo"
                        className={`relative h-8 w-14 rounded-full border border-border transition ${
                          !isMusicMuted ? "bg-emerald-500/90" : "bg-slate-200/70"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                            !isMusicMuted ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div
        className={feedbackAnchorClassName}
        data-tutorial="tutorial-wrong-feedback"
        aria-hidden="true"
      />

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
