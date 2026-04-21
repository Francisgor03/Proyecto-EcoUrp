"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
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
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const element = buttonRef.current;
    if (!element) {
      return;
    }

    const handleEnter = () => {
      gsap.to(element, { scale: 1.05, y: -2, duration: 0.16, ease: "power2.out" });
    };

    const handleLeave = () => {
      gsap.to(element, { scale: 1, y: 0, duration: 0.18, ease: "power2.out" });
    };

    const handleDown = () => {
      gsap.to(element, { scale: 0.94, duration: 0.1, ease: "power2.out" });
    };

    const handleUp = () => {
      gsap.to(element, { scale: 1.02, duration: 0.15, ease: "power2.out" });
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

export default function GamePage() {
  const router = useRouter();
  const { session, loading, isConfigured, signOut } = useAuth();

  const { state, actions, bridge } = useGameState("normal");

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const menuOverlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loading && isConfigured && !session) {
      router.replace("/login?next=/game");
    }
  }, [isConfigured, loading, router, session]);

  useEffect(() => {
    if (!viewportRef.current) {
      return;
    }

    gsap.fromTo(
      viewportRef.current,
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.46, ease: "power3.out" },
    );
  }, [state.phase]);

  useEffect(() => {
    if (!menuOverlayRef.current || state.phase !== "menu") {
      return;
    }

    gsap.fromTo(
      menuOverlayRef.current,
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 0.44, ease: "power3.out" },
    );
  }, [state.phase, state.mode]);

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-eco-emerald-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-amber-200 bg-amber-50/90 p-8 text-center text-sm text-amber-900 shadow-sm">
          <p className="font-medium">Configuracion pendiente</p>
          <p className="mt-2 text-amber-800/90">
            Crea un archivo <code className="rounded bg-amber-100 px-1">.env.local</code> con las variables
            de Supabase y reinicia el servidor de desarrollo.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-2xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 shadow-sm"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-eco-emerald-50 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-3xl border border-eco-emerald-200 bg-white/90 p-10 text-center shadow-sm">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-eco-emerald-200 border-t-eco-emerald-600" />
          <p className="text-sm font-medium text-eco-emerald-800">Verificando tu sesion...</p>
        </div>
      </div>
    );
  }

  const handleModeSelect = (mode: GameModeId) => {
    actions.selectMode(mode);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#d1fae5_0%,_#ecfdf5_44%,_#f7fee7_100%)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-eco-emerald-600">EcoURP</p>
            <h1 className="text-2xl font-black text-eco-emerald-950 sm:text-4xl">Eco-Catch en Pixi.js</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-eco-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-eco-emerald-800 shadow-sm"
            >
              Inicio
            </Link>
            <AnimatedButton
              type="button"
              onClick={async () => {
                await signOut();
                router.replace("/login");
              }}
              className="rounded-full bg-eco-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Cerrar sesion
            </AnimatedButton>
          </div>
        </div>

        <div ref={viewportRef} className="relative">
          <GameCanvas state={state} bridge={bridge} />

          {state.phase === "playing" ? (
            <GameUI
              state={state}
              onSelectType={actions.setSelectedType}
              onDismissFeedback={actions.clearWrongFeedback}
            />
          ) : null}

          {state.phase === "menu" ? (
            <div
              ref={menuOverlayRef}
              className="absolute inset-0 z-30 flex items-center justify-center p-4 sm:p-8"
            >
              <div className="w-full max-w-3xl rounded-3xl border border-white/80 bg-white/88 p-5 shadow-2xl shadow-eco-emerald-900/15 backdrop-blur-md sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-eco-emerald-600">Selecciona modo</p>
                <h2 className="mt-2 text-3xl font-black text-eco-emerald-950">Atrapa y clasifica residuos</h2>
                <p className="mt-2 text-sm text-eco-emerald-700">
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
                        className={`rounded-2xl border p-4 text-left shadow-md ${
                          selected
                            ? "border-eco-emerald-500 bg-eco-emerald-100"
                            : "border-eco-emerald-100 bg-white"
                        }`}
                      >
                        <p className="text-xs font-bold uppercase tracking-widest text-eco-emerald-600">{mode.label}</p>
                        <p className="mt-2 text-sm text-eco-emerald-800">{mode.description}</p>
                        <p className="mt-3 text-xs font-semibold text-eco-emerald-700">
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
                    className="w-full rounded-2xl bg-eco-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md"
                  >
                    Iniciar partida
                  </AnimatedButton>
                  <Link
                    href="/ranking"
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-eco-emerald-300 bg-white px-5 py-3 text-sm font-semibold text-eco-emerald-800"
                  >
                    Ver ranking
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <GameOverModal
        open={state.phase === "game-over"}
        summary={state.summary}
        saveStatus={state.saveStatus}
        saveMessage={state.saveMessage}
        onReplay={() => actions.startGame(state.mode)}
        onBackToMenu={actions.returnToMenu}
      />
    </div>
  );
}
