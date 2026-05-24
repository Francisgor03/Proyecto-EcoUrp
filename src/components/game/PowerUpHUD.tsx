"use client";

import { AnimatePresence, motion } from "framer-motion";
import { getPowerUpDefinition, type PowerUpStatus } from "@/game/config/powerUps";

interface PowerUpHUDProps {
  powerUps: PowerUpStatus[];
}

function getPowerUpProgress(powerUp: PowerUpStatus): number {
  if (powerUp.remainingMs === null || powerUp.durationMs === null) {
    return 1;
  }

  return Math.max(0, Math.min(1, powerUp.remainingMs / powerUp.durationMs));
}

export default function PowerUpHUD({ powerUps }: PowerUpHUDProps) {
  const hasPowerUps = powerUps.length > 0;
  const wrapperClassName = `pointer-events-none absolute left-3 top-1/2 z-30 flex min-h-[48px] min-w-[120px] -translate-y-1/2 flex-col gap-2 sm:left-4 ${
    hasPowerUps ? "" : "opacity-0"
  }`;

  return (
    <div className={wrapperClassName} data-tutorial="tutorial-powerups" aria-hidden={!hasPowerUps}>
      <AnimatePresence>
        {hasPowerUps
          ? powerUps.map((powerUp) => {
              const definition = getPowerUpDefinition(powerUp.id);
              const progress = getPowerUpProgress(powerUp);

              return (
                <motion.div
                  key={powerUp.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex items-center gap-2"
                  title={definition.label}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 shadow-md"
                    style={{ backgroundColor: definition.colorHex }}
                    aria-label={definition.label}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor" aria-hidden="true">
                      <path d={definition.iconPath} />
                    </svg>
                  </div>
                  <div className="relative h-2.5 w-24 overflow-hidden rounded-full border border-white/50 bg-black/35 backdrop-blur-sm">
                    <div
                      className="h-full rounded-full transition-[width] duration-200"
                      style={{ width: `${Math.round(progress * 100)}%`, backgroundColor: definition.colorHex }}
                    />
                  </div>
                </motion.div>
              );
            })
          : null}
      </AnimatePresence>
    </div>
  );
}
