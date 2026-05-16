"use client";

import { useEffect, useRef, useState } from "react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;

    if (!wrapper || !canvas) {
      return;
    }

    let disposed = false;
    let pixiApp: Application | null = null;
    let resizeObserver: ResizeObserver | null = null;

    setIsLoading(true);
    setLoadError(null);

    void (async () => {
      try {
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

        if (!disposed) {
          setIsLoading(false);
        }
      } catch (error) {
        console.warn("[Eco-Catch] No se pudieron cargar los recursos:", error);
        if (!disposed) {
          setLoadError("No se pudo cargar el juego.");
          setIsLoading(false);
        }
      }
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
      aria-busy={isLoading}
    >
      <canvas ref={canvasRef} className="h-full w-full touch-none" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.48),_transparent_54%)]" />
      {isLoading ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-b from-eco-emerald-100/90 via-white/70 to-eco-lime-50/90 backdrop-blur-sm">
          <div
            className="flex max-w-xs flex-col items-center rounded-3xl border border-eco-emerald-200/70 bg-white/85 px-6 py-5 text-center shadow-lg shadow-eco-emerald-900/10"
            role="status"
            aria-live="polite"
          >
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-eco-emerald-200/70 border-t-eco-emerald-500 animate-spin" />
              <div className="absolute inset-2 flex items-center justify-center rounded-full bg-eco-emerald-50">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 text-eco-emerald-600" fill="currentColor">
                  <path d="M12 3c4.4 0 7 3.6 7 7.7 0 4-3.2 7.3-7.1 7.3-3.8 0-6.9-3.1-6.9-7 0-3.6 2.7-6.3 7-8zm-1.7 4.2c-1.4 1.7-1.8 3.2-1.8 4.5 0 2.1 1.8 3.8 4 3.8 2.1 0 3.8-1.7 3.8-3.8 0-2.6-1.8-4.6-4.7-6.3-.2.8-.6 1.4-1.3 1.8z" />
                </svg>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">Cargando Eco-Catch</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {loadError ?? "Preparando recursos del juego..."}
            </p>
            {!loadError ? (
              <div className="mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-eco-emerald-200/60">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-eco-emerald-400 via-eco-lime-400 to-eco-emerald-500" />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
