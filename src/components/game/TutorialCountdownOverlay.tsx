"use client";

import { AnimatePresence, motion } from "framer-motion";

interface TutorialCountdownOverlayProps {
  value: number | null;
  open: boolean;
}

export default function TutorialCountdownOverlay({ value, open }: TutorialCountdownOverlayProps) {
  if (!open || value === null) {
    return null;
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[170] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" aria-hidden="true" />
          <div className="relative flex flex-col items-center gap-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">Listo para jugar</p>
            <motion.div
              key={value}
              className="text-6xl font-black text-white drop-shadow"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {value}
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
