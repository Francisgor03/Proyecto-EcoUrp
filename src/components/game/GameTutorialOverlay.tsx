"use client";

import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TutorialStep } from "@/game/tutorialSteps";

interface GameTutorialOverlayProps {
  open: boolean;
  steps: TutorialStep[];
  stepIndex: number;
  canPrev?: boolean;
  nextDisabled?: boolean;
  recalcKey?: string | number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onFinish: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

const VIEWPORT_PADDING = 16;
const TOOLTIP_OFFSET = 14;

function resolveTargetRect(target?: string): TargetRect | null {
  if (!target || typeof document === "undefined") {
    return null;
  }

  const element = document.querySelector<HTMLElement>(`[data-tutorial="${target}"]`);
  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  if (rect.width <= 1 && rect.height <= 1) {
    return null;
  }

  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    right: rect.right,
    bottom: rect.bottom,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function GameTutorialOverlay({
  open,
  steps,
  stepIndex,
  canPrev,
  nextDisabled,
  recalcKey,
  onNext,
  onPrev,
  onSkip,
  onFinish,
}: GameTutorialOverlayProps) {
  const step = steps[stepIndex];
  const activeStep = step ?? steps[0];
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const isVisible = open && Boolean(activeStep);

  const updateTarget = useCallback(() => {
    setTargetRect(resolveTargetRect(activeStep?.target));
  }, [activeStep?.target]);

  useLayoutEffect(() => {
    if (!isVisible) {
      return;
    }

    updateTarget();
  }, [isVisible, updateTarget, recalcKey]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const handleResize = () => updateTarget();
    const handleScroll = () => updateTarget();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isVisible, updateTarget]);

  const totalSteps = steps.length;
  const isLastStep = stepIndex >= totalSteps - 1;
  const allowPrev = typeof canPrev === "boolean" ? canPrev : stepIndex > 0;
  const allowNext = !nextDisabled;
  const interaction = activeStep?.interaction ?? "free";
  const dimmer = activeStep?.dimmer ?? "strong";
  const shouldLock = interaction === "lock" && Boolean(targetRect);

  const tooltipStyle = useMemo(() => {
    if (!isVisible) {
      return {} as CSSProperties;
    }

    const placement = activeStep?.placement ?? "bottom";

    if (!targetRect || typeof window === "undefined") {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    let top = 0;
    let left = 0;
    let transform = "translate(-50%, 0)";

    switch (placement) {
      case "top":
        top = targetRect.top - TOOLTIP_OFFSET;
        left = targetRect.left + targetRect.width / 2;
        transform = "translate(-50%, -100%)";
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.left - TOOLTIP_OFFSET;
        transform = "translate(-100%, -50%)";
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.right + TOOLTIP_OFFSET;
        transform = "translate(0, -50%)";
        break;
      case "center":
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.left + targetRect.width / 2;
        transform = "translate(-50%, -50%)";
        break;
      case "bottom":
      default:
        top = targetRect.bottom + TOOLTIP_OFFSET;
        left = targetRect.left + targetRect.width / 2;
        transform = "translate(-50%, 0)";
        break;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (Number.isFinite(viewportWidth) && Number.isFinite(viewportHeight)) {
      left = clamp(left, VIEWPORT_PADDING, viewportWidth - VIEWPORT_PADDING);
      top = clamp(top, VIEWPORT_PADDING, viewportHeight - VIEWPORT_PADDING);
    }

    return {
      top,
      left,
      transform,
    };
  }, [activeStep?.placement, isVisible, targetRect]);

  const highlightStyle = targetRect
    ? {
        top: Math.max(0, targetRect.top - 6),
        left: Math.max(0, targetRect.left - 6),
        width: Math.max(0, targetRect.width + 12),
        height: Math.max(0, targetRect.height + 12),
      }
    : null;
  const viewportWidth = typeof window === "undefined" ? 0 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 0 : window.innerHeight;

  const overlayBaseClassName =
    dimmer === "none"
      ? "bg-transparent"
      : dimmer === "soft"
        ? "bg-black/30"
        : "bg-black/60";
  const overlayBlurClassName = dimmer === "strong" ? "backdrop-blur-[2px]" : "";
  const overlayBlockClassName = `pointer-events-auto absolute ${overlayBaseClassName} ${overlayBlurClassName}`.trim();

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          className="fixed inset-0 z-[160] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {shouldLock && targetRect ? (
            <>
              <div
                className={`${overlayBlockClassName} left-0 top-0 w-full`}
                style={{ height: Math.max(0, targetRect.top - 8) }}
                aria-hidden="true"
              />
              <div
                className={`${overlayBlockClassName} left-0 w-full`}
                style={{
                  top: targetRect.bottom + 8,
                  height: Math.max(0, viewportHeight - (targetRect.bottom + 8)),
                }}
                aria-hidden="true"
              />
              <div
                className={`${overlayBlockClassName} left-0`}
                style={{
                  top: Math.max(0, targetRect.top - 8),
                  width: Math.max(0, targetRect.left - 8),
                  height: Math.max(0, targetRect.height + 16),
                }}
                aria-hidden="true"
              />
              <div
                className={`${overlayBlockClassName} right-0`}
                style={{
                  top: Math.max(0, targetRect.top - 8),
                  width: Math.max(0, viewportWidth - (targetRect.right + 8)),
                  height: Math.max(0, targetRect.height + 16),
                }}
                aria-hidden="true"
              />
            </>
          ) : (
            <motion.div
              className={`absolute inset-0 ${overlayBaseClassName} ${overlayBlurClassName}`.trim()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              aria-hidden="true"
            />
          )}

          {highlightStyle ? (
            <motion.div
              className="pointer-events-none absolute rounded-3xl border-2 border-amber-200/90 bg-white/5 shadow-[0_0_0_6px_rgba(251,191,36,0.15)]"
              style={highlightStyle}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            />
          ) : null}

          <motion.div
            className="pointer-events-auto absolute z-20 w-[min(92vw,420px)] rounded-3xl border border-border bg-card/95 p-5 shadow-2xl shadow-black/30 backdrop-blur"
            style={tooltipStyle}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ecourp-tutorial-title"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">Tutorial</p>
            <h3 id="ecourp-tutorial-title" className="mt-2 text-xl font-black text-foreground">
              {activeStep?.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{activeStep?.body}</p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-muted-foreground">
                Paso {stepIndex + 1} de {totalSteps}
              </p>
              <button
                type="button"
                onClick={onSkip}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground"
              >
                Omitir
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onPrev}
                disabled={!allowPrev}
                className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                  allowPrev
                    ? "border-border bg-card text-foreground"
                    : "border-border/60 bg-card/40 text-muted-foreground"
                }`}
              >
                Atras
              </button>
              <button
                type="button"
                onClick={isLastStep ? onFinish : onNext}
                disabled={!allowNext}
                className={`rounded-2xl px-5 py-2 text-sm font-semibold shadow-lg transition ${
                  allowNext
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/50 text-primary-foreground/70"
                }`}
              >
                {isLastStep ? "Finalizar" : "Siguiente"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
