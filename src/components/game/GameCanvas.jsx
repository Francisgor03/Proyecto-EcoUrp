"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Phaser from "phaser";
import { createPhaserGameConfig } from "@/game/PhaserConfig";
import { saveTachoHighScore } from "@/lib/saveTachoHighScore";
import { saveTachoSession } from "@/lib/saveTachoSession";

export default function GameCanvas({ className = "", gameMode = "normal" }) {
  const hostRef = useRef(null);
  const gameRef = useRef(null);
  const [wrongModal, setWrongModal] = useState(null);
  const [gameOverModal, setGameOverModal] = useState(null);

  const closeWrongModal = useCallback(() => {
    const game = gameRef.current;
    const resume = game?.registry?.get("tachoResumeWrong");
    if (typeof resume === "function") {
      resume();
    }
    setWrongModal(null);
  }, []);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const config = createPhaserGameConfig(el, { gameMode });
    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.registry.set("tachoGameMode", gameMode);

    game.registry.set("reactHandlers", {
      onWrongBin: (payload) => {
        setWrongModal(payload);
      },
      onGameOver: ({ score, summary }) => {
        console.info("[EcoURP] Game over, guardando puntaje:", {
          score,
          mode: summary?.mode || gameMode,
        });
        void saveTachoHighScore(score, summary?.mode || gameMode);
        void saveTachoSession({
          score,
          gameMode: summary?.mode || gameMode,
          durationMs: summary?.durationMs,
        });
        setGameOverModal({ score, summary });
      },
    });

    return () => {
      try {
        game.registry.remove("reactHandlers");
        game.registry.remove("tachoResumeWrong");
        game.registry.remove("tachoOpenMenu");
        game.destroy(true);
      } catch (e) {
        console.warn("[EcoURP] Al cerrar Phaser:", e);
      }
      gameRef.current = null;
      setWrongModal(null);
      setGameOverModal(null);
    };
  }, [gameMode]);

  const handleOpenMenu = useCallback(() => {
    const game = gameRef.current;
    const openMenu = game?.registry?.get("tachoOpenMenu");
    if (typeof openMenu === "function") {
      openMenu();
    }
    setGameOverModal(null);
  }, []);

  return (
    <>
      <div
        ref={hostRef}
        className={className}
        style={{ width: "100%", height: "100%", minHeight: "min(70vh, 600px)" }}
        aria-label="Área del juego Phaser"
      />

      {wrongModal ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tacho-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-eco-emerald-950/60 backdrop-blur-sm"
            aria-label="Cerrar fondo"
            onClick={closeWrongModal}
          />
          <div className="relative z-[101] w-full max-w-lg rounded-3xl border border-eco-emerald-200 bg-white p-6 shadow-2xl shadow-eco-emerald-900/20 sm:p-8">
            <h2
              id="tacho-modal-title"
              className="text-xl font-bold text-eco-emerald-900 sm:text-2xl"
            >
              {wrongModal.title}
            </h2>
            <p className="mt-2 text-sm font-semibold text-eco-emerald-800">
              Residuo: <span className="text-eco-emerald-950">{wrongModal.residuo}</span>
            </p>
            <p className="mt-1 text-sm text-eco-emerald-700">
              Elegiste el tacho de{" "}
              <span className="font-semibold text-red-700">{wrongModal.tachoElegido}</span>. El
              correcto era{" "}
              <span className="font-semibold text-eco-emerald-700">{wrongModal.tachoCorrecto}</span>
              .
            </p>
            <p className="mt-4 text-sm leading-relaxed text-eco-emerald-800">{wrongModal.body}</p>
            <button
              type="button"
              onClick={closeWrongModal}
              className="mt-6 w-full rounded-2xl bg-eco-emerald-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-eco-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eco-emerald-600 sm:w-auto sm:px-8"
            >
              Entendido, continuar
            </button>
          </div>
        </div>
      ) : null}

      {gameOverModal ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tacho-gameover-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-eco-emerald-950/60 backdrop-blur-sm"
            aria-label="Cerrar fondo"
            onClick={handleOpenMenu}
          />
          <div className="relative z-[101] w-full max-w-lg rounded-3xl border border-eco-emerald-200 bg-white p-6 shadow-2xl shadow-eco-emerald-900/20 sm:p-8">
            <h2
              id="tacho-gameover-title"
              className="text-xl font-bold text-eco-emerald-900 sm:text-2xl"
            >
              Partida terminada
            </h2>
            <p className="mt-2 text-sm text-eco-emerald-700">
              Tu puntaje final y estadisticas de la partida.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-eco-emerald-100 bg-eco-emerald-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
                  Puntaje
                </p>
                <p className="mt-2 text-2xl font-bold text-eco-emerald-900">
                  {gameOverModal.score}
                </p>
              </div>
              <div className="rounded-2xl border border-eco-emerald-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
                  Modo
                </p>
                <p className="mt-2 text-lg font-semibold text-eco-emerald-900">
                  {gameOverModal.summary?.modeLabel || "Normal"}
                </p>
              </div>
              <div className="rounded-2xl border border-eco-emerald-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
                  Aciertos
                </p>
                <p className="mt-2 text-lg font-semibold text-eco-emerald-900">
                  {gameOverModal.summary?.correct ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-eco-emerald-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
                  Errores
                </p>
                <p className="mt-2 text-lg font-semibold text-eco-emerald-900">
                  {(gameOverModal.summary?.wrong ?? 0) + (gameOverModal.summary?.missed ?? 0)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenMenu}
              className="mt-6 w-full rounded-2xl bg-eco-emerald-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-eco-emerald-700 sm:w-auto sm:px-8"
            >
              Jugar de nuevo
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
