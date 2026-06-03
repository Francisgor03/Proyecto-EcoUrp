"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useAnimationControls, type MotionProps } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import GameUI from "@/components/game/GameUI";
import GameOverModal from "@/components/game/GameOverModal";
import GameTutorialOverlay from "@/components/game/GameTutorialOverlay";
import TutorialCountdownOverlay from "@/components/game/TutorialCountdownOverlay";
import PowerUpHUD from "@/components/game/PowerUpHUD";
import { GAME_MODES, type GameModeId } from "@/game/config/gameModes";
import { getPowerUpDefinition, POWER_UP_IDS } from "@/game/config/powerUps";
import { GAME_TUTORIAL_STEPS, MENU_TUTORIAL_STEPS } from "@/game/tutorialSteps";
import { buildWrongBinFeedback, useGameState } from "@/game/useGameState";
import { useGameTutorial } from "@/hooks/useGameTutorial";

const GameCanvas = dynamic(() => import("@/components/game/GameCanvas"), {
  ssr: false,
});

type AnimatedButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof MotionProps> &
  MotionProps & {
    children: ReactNode;
  };

function AnimatedButton({ children, className = "", ...props }: AnimatedButtonProps) {
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

export default function GamePage() {
  const router = useRouter();
  const { session, loading, isConfigured } = useAuth();

  const { state, actions, bridge } = useGameState("normal");
  const {
    isOpen: isTutorialOpen,
    stepIndex: tutorialStepIndex,
    entryPoint: tutorialEntryPoint,
    hasSeen: tutorialHasSeen,
    ready: tutorialReady,
    start: startTutorial,
    next: nextTutorial,
    prev: prevTutorial,
    skip: skipTutorial,
    finish: finishTutorial,
  } = useGameTutorial();
  const tutorialAutoStartRef = useRef(false);
  const tutorialAdvanceRef = useRef(false);
  const [tutorialProgress, setTutorialProgress] = useState({
    modeSelected: false,
    moved: false,
    typeChanged: false,
  });
  const lastSelectedTypeRef = useRef(state.selectedType);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const isCountdownActive = countdownValue !== null;
  const tutorialSteps =
    tutorialEntryPoint === "menu"
      ? MENU_TUTORIAL_STEPS.concat(GAME_TUTORIAL_STEPS)
      : GAME_TUTORIAL_STEPS;
  const activeTutorialStep = tutorialSteps[tutorialStepIndex];
  const activeTutorialStepId = activeTutorialStep?.id;
  const canTutorialPrev =
    tutorialStepIndex > 0 &&
    !(state.phase === "playing" && tutorialSteps[tutorialStepIndex - 1]?.phase === "menu");
  const tutorialNextDisabled =
    activeTutorialStepId === "menu-modes"
      ? !tutorialProgress.modeSelected
      : activeTutorialStepId === "menu-start"
        ? true
        : activeTutorialStepId === "game-controls"
          ? !(tutorialProgress.moved && tutorialProgress.typeChanged)
          : false;
  const tutorialPowerUps = useMemo(() => {
    return POWER_UP_IDS.map((id) => {
      const definition = getPowerUpDefinition(id);
      return {
        id,
        remainingMs: definition.durationMs,
        durationMs: definition.durationMs,
      };
    });
  }, []);
  const emptyPowerUps = useMemo(() => [], []);
  const tutorialFeedback = useMemo(() => buildWrongBinFeedback("plastic", "paper"), []);

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

  useEffect(() => {
    if (tutorialAutoStartRef.current) {
      return;
    }

    if (!tutorialReady || tutorialHasSeen || isTutorialOpen) {
      return;
    }

    if (state.phase !== "playing" || state.roundId < 1) {
      return;
    }

    tutorialAutoStartRef.current = true;
    startTutorial("auto");
  }, [isTutorialOpen, startTutorial, state.phase, state.roundId, tutorialHasSeen, tutorialReady]);

  useEffect(() => {
    if (!isTutorialOpen) {
      return;
    }

    setTutorialProgress({
      modeSelected: false,
      moved: false,
      typeChanged: false,
    });
  }, [isTutorialOpen, tutorialEntryPoint]);

  useEffect(() => {
    if (!tutorialAdvanceRef.current || state.phase !== "playing") {
      return;
    }

    if (!isTutorialOpen) {
      tutorialAdvanceRef.current = false;
      return;
    }

    tutorialAdvanceRef.current = false;
    nextTutorial();
  }, [isTutorialOpen, nextTutorial, state.phase]);

  useEffect(() => {
    const shouldBlockSpawns = (isTutorialOpen || isCountdownActive) && state.phase === "playing";
    if (!shouldBlockSpawns) {
      actions.setTutorialState(null);
      return;
    }

    actions.setTutorialState({
      blockSpawns: true,
      freezeTimer: true,
    });
  }, [actions, isCountdownActive, isTutorialOpen, state.phase]);

  useEffect(() => {
    if (!isTutorialOpen || state.phase !== "playing") {
      actions.setTutorialPowerUps(emptyPowerUps);
      return;
    }

    if (activeTutorialStepId === "game-powerups") {
      actions.setTutorialPowerUps(tutorialPowerUps);
      return;
    }

    actions.setTutorialPowerUps(emptyPowerUps);
  }, [actions, activeTutorialStepId, emptyPowerUps, isTutorialOpen, state.phase, tutorialPowerUps]);

  useEffect(() => {
    if (!isTutorialOpen || state.phase !== "playing") {
      actions.setTutorialFeedback(null);
      return;
    }

    if (activeTutorialStepId === "game-feedback") {
      actions.setTutorialFeedback(tutorialFeedback);
      return;
    }

    actions.setTutorialFeedback(null);
  }, [actions, activeTutorialStepId, isTutorialOpen, state.phase, tutorialFeedback]);

  useEffect(() => {
    if (!isTutorialOpen || activeTutorialStepId !== "game-controls") {
      lastSelectedTypeRef.current = state.selectedType;
      return;
    }

    if (state.selectedType !== lastSelectedTypeRef.current) {
      lastSelectedTypeRef.current = state.selectedType;
      setTutorialProgress((previous) => ({
        ...previous,
        typeChanged: true,
      }));
    }
  }, [activeTutorialStepId, isTutorialOpen, state.selectedType]);

  useEffect(() => {
    if (!isTutorialOpen || activeTutorialStepId !== "game-controls") {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "arrowleft" || key === "arrowright" || key === "a" || key === "d") {
        setTutorialProgress((previous) => ({
          ...previous,
          moved: true,
        }));
      }
    };

    const handlePointerMove = () => {
      setTutorialProgress((previous) => ({
        ...previous,
        moved: true,
      }));
    };

    const target = document.querySelector<HTMLElement>("[data-tutorial=\"tutorial-game-canvas\"]");
    window.addEventListener("keydown", handleKey);
    target?.addEventListener("pointermove", handlePointerMove);

    return () => {
      window.removeEventListener("keydown", handleKey);
      target?.removeEventListener("pointermove", handlePointerMove);
    };
  }, [activeTutorialStepId, isTutorialOpen]);

  useEffect(() => {
    if (countdownValue === null) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCountdownValue((current) => {
        if (current === null) {
          return null;
        }

        if (current <= 1) {
          return null;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [countdownValue]);

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
    if (isTutorialOpen && activeTutorialStepId === "menu-modes") {
      setTutorialProgress((previous) => ({
        ...previous,
        modeSelected: true,
      }));
    }
  };

  const handleStartGame = () => {
    if (isTutorialOpen || (tutorialReady && !tutorialHasSeen)) {
      actions.setTutorialState({
        blockSpawns: true,
        freezeTimer: true,
      });
    }
    actions.startGame(state.mode);
    if (isTutorialOpen && activeTutorialStepId === "menu-start") {
      tutorialAdvanceRef.current = true;
    }
  };

  const startCountdown = useCallback(() => {
    setCountdownValue(3);
  }, []);

  const handleTutorialFinish = useCallback(() => {
    finishTutorial();
    if (state.phase === "playing") {
      startCountdown();
    }
  }, [finishTutorial, startCountdown, state.phase]);

  const handleTutorialSkip = useCallback(() => {
    skipTutorial();
    if (state.phase === "playing") {
      startCountdown();
    }
  }, [skipTutorial, startCountdown, state.phase]);

  const handleTutorialNext = () => {
    if (!isTutorialOpen) {
      return;
    }

    if (tutorialNextDisabled) {
      return;
    }

    const nextIndex = tutorialStepIndex + 1;
    if (nextIndex >= tutorialSteps.length) {
      handleTutorialFinish();
      return;
    }

    const nextStep = tutorialSteps[nextIndex];
    if (nextStep?.phase === "playing" && state.phase !== "playing") {
      tutorialAdvanceRef.current = true;
      actions.setTutorialState({
        blockSpawns: true,
        freezeTimer: true,
      });
      actions.startGame(state.mode);
      return;
    }

    nextTutorial();
  };

  const handleTutorialPrev = () => {
    if (!canTutorialPrev) {
      return;
    }

    prevTutorial();
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

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-tutorial="tutorial-mode-cards">
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
                      onClick={handleStartGame}
                      className="w-full rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md sm:py-3"
                      data-tutorial="tutorial-start-button"
                    >
                      Iniciar partida
                    </AnimatedButton>
                    <AnimatedButton
                      type="button"
                      onClick={() => startTutorial("menu")}
                      className="w-full rounded-2xl border border-emerald-200/70 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-md sm:py-3"
                    >
                      Tutorial
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

          <GameTutorialOverlay
            open={isTutorialOpen}
            steps={tutorialSteps}
            stepIndex={tutorialStepIndex}
            canPrev={canTutorialPrev}
            nextDisabled={tutorialNextDisabled}
            recalcKey={`${state.phase}-${state.roundId}-${isFullscreen}`}
            onNext={handleTutorialNext}
            onPrev={handleTutorialPrev}
            onSkip={handleTutorialSkip}
            onFinish={handleTutorialFinish}
          />

          <TutorialCountdownOverlay open={isCountdownActive} value={countdownValue} />
        </motion.div>
      </div>
    </div>
  );
}
