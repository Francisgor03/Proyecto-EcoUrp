"use client";

import dynamic from "next/dynamic";

const GameCanvas = dynamic(() => import("./GameCanvas"), { ssr: false });

/**
 * Monta Phaser solo en el cliente (evita acceso a `window` durante SSR).
 */
export default function GameContainer({ className = "", wrapperClassName = "", gameMode, ...rest }) {
  return (
    <div
      className={
        wrapperClassName ||
        "w-full max-w-5xl overflow-hidden rounded-3xl border border-eco-emerald-200 bg-eco-emerald-950/5 shadow-lg shadow-eco-emerald-900/10"
      }
    >
      <GameCanvas className={className} gameMode={gameMode} {...rest} />
    </div>
  );
}
