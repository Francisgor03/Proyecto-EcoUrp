"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GameRoundSummary, ScoreSaveStatus } from "@/game/useGameState";

interface GameOverModalProps {
  open: boolean;
  summary: GameRoundSummary | null;
  saveStatus: ScoreSaveStatus;
  saveMessage: string | null;
  onReplay: () => void;
  onBackToMenu: () => void;
}

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

function AnimatedButton({ children, className = "", ...props }: AnimatedButtonProps) {
  return (
    <motion.button
      className={className}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 520, damping: 32 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

export default function GameOverModal({
  open,
  summary,
  saveStatus,
  saveMessage,
  onReplay,
  onBackToMenu,
}: GameOverModalProps) {
  if (!summary) {
    return null;
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ecourp-game-over-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <motion.div
            className="w-full max-w-xl rounded-3xl border border-border bg-card p-5 shadow-2xl shadow-black/20 sm:p-8"
            initial={{ opacity: 0, y: 36, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.52, ease: "easeOut" }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Partida terminada</p>
            <h2 id="ecourp-game-over-title" className="mt-2 text-2xl font-black text-foreground sm:text-3xl">
              Eco-Catch
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Resumen de tu rendimiento final.</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-surface-raised/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Score</p>
                <p className="mt-1 text-xl font-black text-foreground sm:text-2xl">{summary.score}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Precision</p>
                <p className="mt-1 text-xl font-black text-foreground sm:text-2xl">{summary.accuracy.toFixed(1)}%</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Duracion</p>
                <p className="mt-1 text-lg font-black text-foreground sm:text-xl">
                  {formatDuration(summary.durationMs)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Racha maxima</p>
                <p className="mt-1 text-lg font-black text-foreground sm:text-xl">{summary.bestStreak}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-surface-raised/60 p-4 text-sm text-muted-foreground">
              <p>
                Aciertos: <span className="font-semibold">{summary.correct}</span> | Errores: {" "}
                <span className="font-semibold">{summary.wrong + summary.missed}</span>
              </p>
              <p className="mt-1">Modo: <span className="font-semibold capitalize">{summary.mode}</span></p>
            </div>

            <p className="mt-4 text-xs font-medium text-muted-foreground">
              {saveStatus === "error" ? saveMessage ?? "" : "Resultado guardado"}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <AnimatedButton
                type="button"
                onClick={onReplay}
                className="w-full rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md"
              >
                Jugar de nuevo
              </AnimatedButton>
              <AnimatedButton
                type="button"
                onClick={onBackToMenu}
                className="w-full rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground"
              >
                Volver al menu
              </AnimatedButton>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
