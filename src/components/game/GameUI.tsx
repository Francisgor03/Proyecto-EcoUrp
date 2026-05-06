"use client";

import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { gsap } from "gsap";
import { WASTE_TYPES, type WasteTypeId } from "@/game/config/wasteTypes";
import type { GameState } from "@/game/useGameState";

interface GameUIProps {
  state: GameState;
  onSelectType: (type: WasteTypeId) => void;
  onDismissFeedback: () => void;
  layout?: "overlay" | "stacked";
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
      gsap.to(element, { scale: 1.06, y: -2, duration: 0.18, ease: "power2.out" });
    };

    const handleLeave = () => {
      gsap.to(element, { scale: 1, y: 0, duration: 0.2, ease: "power2.out" });
    };

    const handleDown = () => {
      gsap.to(element, { scale: 0.94, duration: 0.12, ease: "power2.out" });
    };

    const handleUp = () => {
      gsap.to(element, { scale: 1.02, duration: 0.16, ease: "power2.out" });
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

export default function GameUI({ state, onSelectType, onDismissFeedback, layout = "overlay" }: GameUIProps) {
  const scoreRef = useRef<HTMLDivElement | null>(null);
  const livesRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<HTMLDivElement | null>(null);
  const feedbackRef = useRef<HTMLDivElement | null>(null);

  const isOverlay = layout === "overlay";
  const containerClassName = isOverlay
    ? "pointer-events-none absolute inset-0 z-20 p-2 pb-6 sm:p-4 sm:pb-8"
    : "pointer-events-none relative z-20 mt-3 px-2 pb-3";
  const feedbackWrapperClassName = isOverlay
    ? "pointer-events-auto absolute bottom-24 left-1/2 w-full max-w-2xl -translate-x-1/2 px-2 sm:bottom-32 sm:px-0"
    : "pointer-events-auto mt-3 w-full";
  const feedbackCardClassName = isOverlay
    ? "rounded-2xl border border-rose-200 bg-white/95 p-3 shadow-2xl shadow-rose-900/10 backdrop-blur sm:p-5"
    : "rounded-2xl border border-rose-200 bg-white/95 p-3 shadow-xl shadow-rose-900/10 backdrop-blur";

  useEffect(() => {
    if (scoreRef.current) {
      gsap.fromTo(scoreRef.current, { scale: 1.08 }, { scale: 1, duration: 0.26, ease: "power2.out" });
    }
  }, [state.score]);

  useEffect(() => {
    if (livesRef.current) {
      gsap.fromTo(livesRef.current, { y: -3 }, { y: 0, duration: 0.24, ease: "power2.out" });
    }
  }, [state.lives]);

  useEffect(() => {
    if (timerRef.current) {
      gsap.fromTo(timerRef.current, { opacity: 0.65 }, { opacity: 1, duration: 0.22, ease: "power2.out" });
    }
  }, [state.timerMs]);

  useEffect(() => {
    const panel = feedbackRef.current;
    if (!panel || !state.wrongFeedback) {
      return;
    }

    gsap.fromTo(
      panel,
      { autoAlpha: 0, y: 18, scale: 0.96 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.38, ease: "power3.out" },
    );
  }, [state.wrongFeedback]);

  return (
    <div className={containerClassName}>
      <div className="flex h-full flex-col justify-between">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <div
            ref={scoreRef}
            className="rounded-2xl border border-eco-emerald-200/80 bg-white/84 px-2.5 py-2 text-eco-emerald-900 shadow-md backdrop-blur-sm sm:px-4 sm:py-3"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-eco-emerald-600 sm:text-xs">Puntos</p>
            <p className="mt-1 text-lg font-black sm:text-2xl">{state.score}</p>
          </div>

          <div
            ref={livesRef}
            className="rounded-2xl border border-eco-emerald-200/80 bg-white/84 px-2.5 py-2 text-eco-emerald-900 shadow-md backdrop-blur-sm sm:px-4 sm:py-3"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-eco-emerald-600 sm:text-xs">Vidas</p>
            <p className="mt-1 text-lg font-black sm:text-2xl">{state.lives === null ? "INF" : state.lives}</p>
          </div>

          <div className="rounded-2xl border border-eco-emerald-200/80 bg-white/84 px-2.5 py-2 text-eco-emerald-900 shadow-md backdrop-blur-sm sm:px-4 sm:py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-eco-emerald-600 sm:text-xs">Racha</p>
            <p className="mt-1 text-lg font-black sm:text-2xl">{state.streak}</p>
          </div>

          <div
            ref={timerRef}
            className="rounded-2xl border border-eco-emerald-200/80 bg-white/84 px-2.5 py-2 text-eco-emerald-900 shadow-md backdrop-blur-sm sm:px-4 sm:py-3"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-eco-emerald-600 sm:text-xs">Tiempo</p>
            <p className="mt-1 text-lg font-black sm:text-2xl">{formatTimer(state.timerMs)}</p>
          </div>
        </div>

        <div className="pointer-events-auto grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {WASTE_TYPES.map((waste) => {
            const selected = state.selectedType === waste.id;

            return (
              <AnimatedButton
                key={waste.id}
                type="button"
                onClick={() => onSelectType(waste.id)}
                className={`rounded-2xl px-3 py-3 text-center shadow-lg transition-all sm:px-4 sm:py-4 ${
                  selected
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

      {state.wrongFeedback ? (
        <div ref={feedbackRef} className={feedbackWrapperClassName}>
          <div className={feedbackCardClassName}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-rose-700 sm:text-sm">{state.wrongFeedback.title}</p>
                <p className="mt-1 text-xs text-rose-900 sm:text-sm">
                  Residuo: <span className="font-semibold">{state.wrongFeedback.residuo}</span> | Elegiste: {" "}
                  <span className="font-semibold">{state.wrongFeedback.tachoElegido}</span>
                </p>
              </div>
              <AnimatedButton
                type="button"
                onClick={onDismissFeedback}
                className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-bold text-rose-700"
              >
                {state.wrongPauseMs > 0 ? "Continuar" : "Cerrar"}
              </AnimatedButton>
            </div>

            {state.wrongPauseMs > 0 ? (
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-rose-700">
                Reanudando en {formatPauseCountdown(state.wrongPauseMs)}
              </p>
            ) : null}

            <p className="mt-3 text-xs leading-relaxed text-rose-800 sm:text-sm">{state.wrongFeedback.body}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
