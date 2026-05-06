"use client";

import { useEffect, useRef } from "react";
import { Application } from "pixi.js";
import { GameEngine } from "@/game/core/GameEngine";
import { preloadGameAssets } from "@/game/utils/assetLoader";
import type { GameState } from "@/game/useGameState";
import type { GameStateBridge } from "@/game/core/GameEngine";

export interface GameCanvasProps {
  state: GameState;
  bridge: GameStateBridge;
  isFullscreen?: boolean;
  className?: string;
}

export default function GameCanvas({ state, bridge, isFullscreen = false, className = "" }: GameCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;

    if (!wrapper || !canvas) {
      return;
    }

    let disposed = false;
    let pixiApp: Application | null = null;
    let resizeObserver: ResizeObserver | null = null;

    void (async () => {
      const loadedAssets = await preloadGameAssets();
      if (disposed) {
        return;
      }

      pixiApp = new Application();
      await pixiApp.init({
        canvas,
        antialias: true,
        backgroundAlpha: 0,
        resizeTo: wrapper,
      });

      if (disposed) {
        pixiApp.destroy();
        return;
      }

      const engine = new GameEngine({
        app: pixiApp,
        assets: loadedAssets,
        bridge,
      });

      engineRef.current = engine;
      engine.resize(pixiApp.renderer.width, pixiApp.renderer.height);

      resizeObserver = new ResizeObserver(() => {
        if (!pixiApp || !engineRef.current) {
          return;
        }

        pixiApp.renderer.resize(wrapper.clientWidth, wrapper.clientHeight);
        engineRef.current.resize(pixiApp.renderer.width, pixiApp.renderer.height);
      });

      resizeObserver.observe(wrapper);
    })();

    return () => {
      disposed = true;

      resizeObserver?.disconnect();

      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }

      if (pixiApp) {
        pixiApp.destroy();
      }
    };
  }, [bridge]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }

    if (state.phase === "playing") {
      engine.startRound();
      return;
    }

    engine.stopRound();
  }, [state.phase]);

  const wrapperClassName = isFullscreen
    ? `relative w-full h-screen flex-1 overscroll-contain overflow-hidden bg-gradient-to-b from-eco-emerald-100 to-eco-emerald-50 ${className}`
    : `relative w-full min-h-[min(68dvh,600px)] overscroll-contain overflow-hidden rounded-2xl border border-eco-emerald-200/80 bg-gradient-to-b from-eco-emerald-100 to-eco-emerald-50 shadow-xl shadow-eco-emerald-900/10 sm:min-h-[min(84dvh,820px)] sm:rounded-3xl ${className}`;

  return (
    <div
      ref={wrapperRef}
      className={wrapperClassName}
      style={{ touchAction: "none" }}
      aria-label="Canvas Eco-Catch con Pixi"
    >
      <canvas ref={canvasRef} className="h-full w-full touch-none" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.48),_transparent_54%)]" />
    </div>
  );
}
