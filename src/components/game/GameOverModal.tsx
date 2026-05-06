"use client";

import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { gsap } from "gsap";
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
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const element = buttonRef.current;
    if (!element) {
      return;
    }

    const handleEnter = () => {
      gsap.to(element, { scale: 1.05, y: -2, duration: 0.16, ease: "power2.out" });
    };

    const handleLeave = () => {
      gsap.to(element, { scale: 1, y: 0, duration: 0.18, ease: "power2.out" });
    };

    const handleDown = () => {
      gsap.to(element, { scale: 0.95, duration: 0.1, ease: "power2.out" });
    };

    const handleUp = () => {
      gsap.to(element, { scale: 1.02, duration: 0.15, ease: "power2.out" });
    };

    element.addEventListener("mouseenter", handleEnter);
    element.addEventListener("mouseleave", handleLeave);
    element.addEventListener("mousedown", handleDown);
    element.addEventListener("mouseup", handleUp);
    element.addEventListener("focus", handleEnter);
    element.addEventListener("blur", handleLeave);

    return () => {
      element.removeEventListener("mouseenter", handleEnter);
      element.removeEventListener("mouseleave", handleLeave);
      element.removeEventListener("mousedown", handleDown);
      element.removeEventListener("mouseup", handleUp);
      element.removeEventListener("focus", handleEnter);
      element.removeEventListener("blur", handleLeave);
    };
  }, []);

  return (
    <button ref={buttonRef} className={className} {...props}>
      {children}
    </button>
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
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const card = cardRef.current;

    if (!overlay || !card || !open) {
      return;
    }

    gsap.fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.22, ease: "power2.out" });
    gsap.fromTo(
      card,
      { autoAlpha: 0, y: 36, scale: 0.94 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.52, ease: "power3.out" },
    );
  }, [open]);

  if (!open || !summary) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ecourp-game-over-title"
    >
      <div
        ref={cardRef}
        className="w-full max-w-xl rounded-3xl border border-border bg-card p-5 shadow-2xl shadow-black/20 sm:p-8"
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
      </div>
    </div>
  );
}
