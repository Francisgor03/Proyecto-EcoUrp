"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import GameUI from "@/components/game/GameUI";
import GameOverModal from "@/components/game/GameOverModal";
import { GAME_MODES, type GameModeId } from "@/game/config/gameModes";
import { useGameState } from "@/game/useGameState";

const GameCanvas = dynamic(() => import("@/components/game/GameCanvas"), {
  ssr: false,
});

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

function AnimatedButton({ children, className = "", ...props }: AnimatedButtonProps) {
  return (
    <motion.button
      className={className}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 520, damping: 32 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export default function GamePage() {
  const router = useRouter();
  const { session, loading, isConfigured } = useAuth();

  const { state, actions, bridge } = useGameState("normal");

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const viewportControls = useAnimationControls();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(async () => {
    const element = viewportRef.current;
    if (!element) return;

    try {
      if (!document.fullscreenElement) {
        await element.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen not supported or denied
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!loading && isConfigured && !session) {
      router.replace("/login?next=/game");
    }
  }, [isConfigured, loading, router, session]);

  useEffect(() => {
    viewportControls.set({ opacity: 0, y: 18 });
    void viewportControls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.46, ease: "easeOut" },
    });
  }, [state.phase, viewportControls]);

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-background px-3 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 text-center text-sm text-foreground shadow-sm sm:p-8">
          <p className="font-medium text-amber-600">Configuracion pendiente</p>
          <p className="mt-2 text-muted-foreground">
            Crea un archivo <code className="rounded bg-surface-raised px-1">.env.local</code> con las variables
            de Supabase y reinicia el servidor de desarrollo.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-2xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-background px-3 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-3xl border border-border bg-card/90 p-6 text-center shadow-sm sm:p-10">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" />
          <p className="text-sm font-medium text-muted-foreground">Verificando tu sesion...</p>
        </div>
      </div>
    );
  }

  const handleModeSelect = (mode: GameModeId) => {
    actions.selectMode(mode);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-eco-emerald-100)_0%,_var(--color-eco-emerald-50)_44%,_var(--color-eco-lime-50)_100%)] px-3 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">EcoURP</p>
            <h1 className="text-2xl font-black text-foreground sm:text-4xl">Eco-Catch</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AnimatedButton
              type="button"
              onClick={toggleFullscreen}
              className="rounded-full border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm sm:px-4"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0v4m0-4h4m6 6l5 5m0 0v-4m0 4h-4M9 15l-5 5m0 0v-4m0 4h4m6-6l5-5m0 0v4m0-4h-4" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
                </svg>
              )}
              <span className="ml-1.5 hidden sm:inline">{isFullscreen ? "Salir" : "Pantalla completa"}</span>
            </AnimatedButton>
          </div>
        </div>

        <motion.div
          ref={viewportRef}
          className={`relative ${isFullscreen ? "flex flex-col bg-gradient-to-b from-eco-emerald-900 to-eco-emerald-950" : ""}`}
          initial={{ opacity: 0, y: 18 }}
          animate={viewportControls}
        >
          <GameCanvas state={state} bridge={bridge} isFullscreen={isFullscreen} />

          {isFullscreen && (
            <button
              type="button"
              onClick={toggleFullscreen}
              className="absolute top-3 right-3 z-50 flex items-center gap-1.5 rounded-full border border-white/30 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm transition-opacity hover:bg-black/70"
              title="Salir de pantalla completa (Esc)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0v4m0-4h4m6 6l5 5m0 0v-4m0 4h-4M9 15l-5 5m0 0v-4m0 4h4m6-6l5-5m0 0v4m0-4h-4" />
              </svg>
              Esc
            </button>
          )}

          {state.phase === "playing" ? (
            <>
              <div className="hidden sm:block">
                <GameUI
                  state={state}
                  onSelectType={actions.setSelectedType}
                  onDismissFeedback={actions.clearWrongFeedback}
                  onTogglePause={actions.togglePause}
                  layout="overlay"
                />
              </div>
              <div className="sm:hidden">
                <GameUI
                  state={state}
                  onSelectType={actions.setSelectedType}
                  onDismissFeedback={actions.clearWrongFeedback}
                  onTogglePause={actions.togglePause}
                  layout="stacked"
                />
              </div>

              {state.mode === "zen" && (
                <div className="absolute top-2 right-2 z-40 sm:top-3 sm:right-14">
                  <AnimatedButton
                    type="button"
                    onClick={actions.endGame}
                    className="flex items-center gap-1.5 rounded-full border border-rose-300/50 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-md backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
                    </svg>
                    Terminar partida
                  </AnimatedButton>
                </div>
              )}
            </>
          ) : null}

          <AnimatePresence>
            {state.phase === "menu" ? (
              <motion.div
                key={`menu-${state.mode}`}
                className="absolute inset-0 z-30 flex items-start justify-center overflow-y-auto overscroll-contain p-3 sm:items-center sm:p-8"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.44, ease: "easeOut" }}
              >
                <div className="w-full max-w-3xl max-h-[82dvh] overflow-y-auto rounded-3xl border border-border bg-card/90 p-5 shadow-2xl shadow-black/10 backdrop-blur-md sm:max-h-none sm:overflow-visible sm:p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Selecciona modo</p>
                  <h2 className="mt-2 text-2xl font-black text-foreground sm:text-3xl">Atrapa y clasifica residuos</h2>
                  <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                    Controles: mover con flechas o A/D, cambiar tipo con teclas 1-4 o botones en pantalla.
                    En mobile, arrastra horizontalmente para mover el tacho.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {GAME_MODES.map((mode) => {
                      const selected = mode.id === state.mode;

                      return (
                        <AnimatedButton
                          key={mode.id}
                          type="button"
                          onClick={() => handleModeSelect(mode.id)}
                          className={`rounded-2xl border p-3 text-left shadow-md sm:p-4 ${
                            selected
                              ? "border-primary bg-accent"
                              : "border-border bg-card"
                          }`}
                        >
                          <p className="text-xs font-bold uppercase tracking-widest text-primary">{mode.label}</p>
                          <p className="mt-2 text-xs text-muted-foreground sm:text-sm">{mode.description}</p>
                          <p className="mt-3 text-xs font-semibold text-muted-foreground">
                            Spawn: {mode.spawnMs}ms | Velocidad: {mode.fallSpeed}
                          </p>
                        </AnimatedButton>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <AnimatedButton
                      type="button"
                      onClick={() => actions.startGame(state.mode)}
                      className="w-full rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md sm:py-3"
                    >
                      Iniciar partida
                    </AnimatedButton>
                    <Link
                      href="/ranking"
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground sm:py-3"
                    >
                      Ver ranking
                    </Link>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <GameOverModal
            open={state.phase === "game-over"}
            summary={state.summary}
            saveStatus={state.saveStatus}
            saveMessage={state.saveMessage}
            onReplay={() => actions.startGame(state.mode)}
            onBackToMenu={actions.returnToMenu}
          />
        </motion.div>
      </div>
    </div>
  );
}
