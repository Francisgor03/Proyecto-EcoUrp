"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  type MotionProps,
} from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import GameUI from "@/components/game/GameUI";
import GameOverModal from "@/components/game/GameOverModal";
import PowerUpHUD from "@/components/game/PowerUpHUD";
import { useGameState } from "@/game/useGameState";

/**
 * Eco-Villa arranca directamente en modo "eco-villa":
 *  - Residuos flotan de izquierda a derecha (eje X).
 *  - La balsa (Collector) se mueve en 2D con W/S o ↑/↓ y A/D o ←/→.
 *  - Un residuo se pierde (y resta vida) cuando cruza el borde derecho.
 */
const GameCanvas = dynamic(() => import("@/components/game/GameCanvas"), {
  ssr: false,
});

// ── Animated button ──────────────────────────────────────────────────────────
type AnimatedButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  keyof MotionProps
> &
  MotionProps & {
    children: ReactNode;
  };

function AnimatedButton({
  children,
  className = "",
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.button
      className={className}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// ── Water wave background decoration ────────────────────────────────────────
function WaterBandOverlay() {
  return (
    <>
      {/* Top shore */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[15%] bg-gradient-to-b from-teal-900/40 to-transparent" />
      {/* Bottom shore */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[15%] bg-gradient-to-t from-teal-900/40 to-transparent" />
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function EcoVillaPage() {
  const router = useRouter();
  const { session, loading, isConfigured } = useAuth();

  // Inicializar el motor directamente en modo eco-villa.
  const { state, actions, bridge } = useGameState("eco-villa");

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
      router.replace("/login?next=/game/eco-villa");
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

  // ── Not configured ──────────────────────────────────────────────────────
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-background px-3 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 text-center text-sm text-foreground shadow-sm sm:p-8">
          <p className="font-medium text-amber-600">Configuracion pendiente</p>
          <p className="mt-2 text-muted-foreground">
            Crea un archivo{" "}
            <code className="rounded bg-surface-raised px-1">.env.local</code>{" "}
            con las variables de Supabase y reinicia el servidor de desarrollo.
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

  // ── Loading / unauthenticated ───────────────────────────────────────────
  if (loading || !session) {
    return (
      <div className="min-h-screen bg-background px-3 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-3xl border border-border bg-card/90 p-6 text-center shadow-sm sm:p-10">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Verificando tu sesion...
          </p>
        </div>
      </div>
    );
  }

  const handleStartGame = () => {
    actions.startGame("eco-villa");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-950 via-teal-900 to-cyan-950 px-3 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">

        {/* ── Header ── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
          <div>
            <Link
              href="/game"
              id="eco-villa-back-btn"
              className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:underline"
            >
              <svg
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Selección de juegos
            </Link>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
              EcoURP
            </p>
            <h1 className="text-2xl font-black text-white sm:text-4xl">
              Eco-Villa
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AnimatedButton
              type="button"
              onClick={toggleFullscreen}
              className="rounded-full border border-cyan-700/60 bg-teal-900/60 px-3 py-2 text-sm font-semibold text-cyan-200 shadow-sm backdrop-blur-sm sm:px-4"
              title={
                isFullscreen
                  ? "Salir de pantalla completa"
                  : "Pantalla completa"
              }
            >
              {isFullscreen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 inline-block"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 9L4 4m0 0v4m0-4h4m6 6l5 5m0 0v-4m0 4h-4M9 15l-5 5m0 0v-4m0 4h4m6-6l5-5m0 0v4m0-4h-4"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 inline-block"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5"
                  />
                </svg>
              )}
              <span className="ml-1.5 hidden sm:inline">
                {isFullscreen ? "Salir" : "Pantalla completa"}
              </span>
            </AnimatedButton>
          </div>
        </div>

        {/* ── Canvas viewport ── */}
        <motion.div
          ref={viewportRef}
          className={`relative ${isFullscreen ? "flex flex-col bg-gradient-to-b from-teal-900 to-cyan-950" : ""}`}
          initial={{ opacity: 0, y: 18 }}
          animate={viewportControls}
        >
          {/* Water shore bands overlay */}
          {state.phase === "playing" && <WaterBandOverlay />}

          <GameCanvas state={state} bridge={bridge} isFullscreen={isFullscreen} />

          {/* HUD — solo durante el juego */}
          {state.phase === "playing" ? (
            <>
              <PowerUpHUD powerUps={state.powerUps} />
              <div className="hidden sm:block">
                <GameUI
                  state={state}
                  onSelectType={actions.setSelectedType}
                  onDismissFeedback={actions.clearWrongFeedback}
                  onTogglePause={actions.togglePause}
                  onEndGame={actions.endGame}
                  onToggleFullscreen={toggleFullscreen}
                  isFullscreen={isFullscreen}
                  layout="overlay"
                />
              </div>
              <div className="sm:hidden">
                <GameUI
                  state={state}
                  onSelectType={actions.setSelectedType}
                  onDismissFeedback={actions.clearWrongFeedback}
                  onTogglePause={actions.togglePause}
                  onEndGame={actions.endGame}
                  onToggleFullscreen={toggleFullscreen}
                  isFullscreen={isFullscreen}
                  layout="stacked"
                />
              </div>
            </>
          ) : null}

          {/* ── Pantalla de inicio / menú ── */}
          <AnimatePresence>
            {state.phase === "menu" ? (
              <motion.div
                key="eco-villa-menu"
                className="absolute inset-0 z-30 flex items-start justify-center overflow-y-auto overscroll-contain p-3 sm:items-center sm:p-8"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.44, ease: "easeOut" }}
              >
                <div className="w-full max-w-xl rounded-3xl border border-cyan-700/60 bg-teal-900/80 p-5 shadow-2xl shadow-black/30 backdrop-blur-md sm:p-8">

                  {/* Game icon */}
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/20 text-4xl">
                      🛶
                    </div>
                  </div>

                  <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                    Pantanos de Villa
                  </p>
                  <h2 className="mt-2 text-center text-2xl font-black text-white sm:text-3xl">
                    Eco-Villa
                  </h2>
                  <p className="mt-3 text-center text-sm text-cyan-200/80">
                    Navega en tu balsa de totora por los canales y atrapa los
                    residuos antes de que lleguen a los nidos de las aves.
                  </p>

                  {/* Controls */}
                  <div className="mt-5 rounded-2xl border border-cyan-700/40 bg-teal-950/60 p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-widest text-cyan-400">
                      Controles
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm text-cyan-100/90">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-teal-800 px-2 py-1 font-mono text-xs font-bold text-white">
                          A / ←
                        </span>
                        <span className="text-xs text-cyan-200/70">Izquierda</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-teal-800 px-2 py-1 font-mono text-xs font-bold text-white">
                          D / →
                        </span>
                        <span className="text-xs text-cyan-200/70">Derecha</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-teal-800 px-2 py-1 font-mono text-xs font-bold text-white">
                          W / ↑
                        </span>
                        <span className="text-xs text-cyan-200/70">Arriba</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-teal-800 px-2 py-1 font-mono text-xs font-bold text-white">
                          S / ↓
                        </span>
                        <span className="text-xs text-cyan-200/70">Abajo</span>
                      </div>
                    </div>
                    <p className="mt-3 text-[11px] text-cyan-300/60">
                      📱 Mobile: arrastra el dedo horizontalmente para mover la
                      balsa.
                    </p>
                  </div>

                  {/* Mission reminder */}
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-950/40 p-3">
                    <span className="mt-0.5 text-lg">⚠️</span>
                    <p className="text-xs text-red-300/90">
                      Si un residuo cruza el borde derecho, llegó a los nidos
                      de las aves y <strong>perderás una vida</strong>.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <AnimatedButton
                      type="button"
                      id="eco-villa-start-btn"
                      onClick={handleStartGame}
                      className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-cyan-900/40 sm:py-3"
                    >
                      ▶ Navegar ahora
                    </AnimatedButton>
                    <Link
                      href="/ranking"
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-cyan-700/50 bg-teal-900/50 px-5 py-2.5 text-sm font-semibold text-cyan-200 sm:py-3"
                    >
                      Ver ranking
                    </Link>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* ── Game Over Modal ── */}
          <GameOverModal
            open={state.phase === "game-over"}
            summary={state.summary}
            saveStatus={state.saveStatus}
            saveMessage={state.saveMessage}
            onReplay={() => actions.startGame("eco-villa")}
            onBackToMenu={actions.returnToMenu}
          />
        </motion.div>
      </div>
    </div>
  );
}
