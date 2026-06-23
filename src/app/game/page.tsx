"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";

// ── Animated card wrapper ────────────────────────────────────────────────────
function GameCard({
  href,
  delay = 0,
  children,
}: {
  href: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.52, ease: "easeOut", delay }}
      whileHover={{ y: -6, scale: 1.015 }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-eco-emerald-900/10 transition-shadow hover:shadow-2xl hover:shadow-eco-emerald-900/20"
    >
      {children}
    </motion.div>
  );
}

// ── SVG icons ────────────────────────────────────────────────────────────────
function EcoCatchIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-full w-full"
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Campus sky */}
      <rect width="64" height="64" rx="16" fill="#d1fae5" />
      {/* Sun */}
      <circle cx="50" cy="14" r="7" fill="#fde68a" />
      {/* Building */}
      <rect x="8" y="28" width="20" height="22" rx="2" fill="#6ee7b7" />
      <rect x="12" y="32" width="4" height="5" rx="1" fill="#fff" />
      <rect x="20" y="32" width="4" height="5" rx="1" fill="#fff" />
      <rect x="14" y="40" width="8" height="10" rx="1" fill="#a7f3d0" />
      {/* Tree */}
      <ellipse cx="42" cy="32" rx="8" ry="9" fill="#34d399" />
      <rect x="40" y="40" width="4" height="7" rx="1" fill="#065f46" />
      {/* Recycling bin */}
      <rect x="24" y="42" width="16" height="10" rx="2" fill="#10b981" />
      {/* Recycle arrows */}
      <path
        d="M30 39l2-4 2 4"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Falling waste */}
      <rect x="20" y="20" width="6" height="6" rx="1" fill="#fca5a5" />
      <rect x="36" y="14" width="5" height="5" rx="1" fill="#93c5fd" />
    </svg>
  );
}

function EcoVillaIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-full w-full"
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sky / water */}
      <rect width="64" height="64" rx="16" fill="#cffafe" />
      {/* Water */}
      <rect x="0" y="38" width="64" height="26" rx="12" fill="#67e8f9" />
      {/* Reeds / totora */}
      <rect x="6" y="26" width="3" height="18" rx="1.5" fill="#4ade80" />
      <ellipse cx="7.5" cy="25" rx="4" ry="2.5" fill="#22c55e" />
      <rect x="55" y="22" width="3" height="22" rx="1.5" fill="#4ade80" />
      <ellipse cx="56.5" cy="21" rx="4" ry="2.5" fill="#22c55e" />
      {/* Raft (balsa) */}
      <rect x="14" y="36" width="36" height="8" rx="4" fill="#a16207" />
      <rect x="16" y="33" width="32" height="5" rx="2" fill="#ca8a04" />
      {/* Bird */}
      <path
        d="M44 18 Q47 15 50 18"
        stroke="#1e40af"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M38 22 Q41 19 44 22"
        stroke="#1e40af"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Pollution bubble */}
      <circle cx="48" cy="42" r="5" fill="#fca5a5" opacity="0.8" />
      <text x="45.5" y="45" fontSize="6" fill="#dc2626" fontWeight="bold">
        ✕
      </text>
      {/* Paddle */}
      <rect x="30" y="30" width="2" height="12" rx="1" fill="#92400e" />
      <ellipse cx="31" cy="29" rx="3" ry="2" fill="#b45309" />
    </svg>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function GameSelectorPage() {
  const router = useRouter();
  const { session, loading, isConfigured } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && isConfigured && !session) {
      router.replace("/login?next=/game");
    }
  }, [isConfigured, loading, router, session]);

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

  // ── Game selector ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-eco-emerald-100)_0%,_var(--color-eco-emerald-50)_44%,_var(--color-eco-lime-50)_100%)] px-3 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-3 flex items-center gap-2"
        >
          <Link
            href="/"
            id="back-to-home-btn"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {/* Arrow left icon */}
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Volver al Inicio
          </Link>
        </motion.div>

        {/* ── Title block ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: "easeOut", delay: 0.05 }}
          className="mb-10 text-center sm:mb-14"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            EcoURP · Minijuegos
          </p>
          <h1 className="mt-2 text-3xl font-black text-foreground sm:text-5xl">
            Elige tu Aventura
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
            Aprende sobre reciclaje y cuidado ambiental jugando. Selecciona un
            minijuego para comenzar.
          </p>

          {/* Decorative leaf strip */}
          <div className="mt-5 flex items-center justify-center gap-2" aria-hidden="true">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-eco-emerald-300" />
            <span className="text-eco-emerald-500">🌿</span>
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-eco-emerald-300" />
          </div>
        </motion.div>

        {/* ── Cards grid ── */}
        <div className="grid gap-6 sm:grid-cols-2">

          {/* ── Card 1: Eco-Catch ── */}
          <GameCard href="/game/eco-catch" delay={0.1}>
            {/* Illustration area */}
            <div className="relative h-52 overflow-hidden bg-gradient-to-br from-eco-emerald-100 via-eco-lime-50 to-eco-emerald-200 sm:h-60">
              {/* Animated background particles */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-eco-emerald-300/20"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-10 -left-6 h-36 w-36 rounded-full bg-eco-lime-300/25"
              />

              {/* Icon */}
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="h-36 w-36 drop-shadow-lg sm:h-44 sm:w-44">
                  <EcoCatchIcon />
                </div>
              </div>

              {/* Badge */}
              <span className="absolute left-4 top-4 rounded-full bg-eco-emerald-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow">
                Disponible
              </span>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <div className="mb-1 flex items-center gap-2">
                {/* Recycle icon */}
                <svg className="h-4 w-4 text-eco-emerald-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.65 6.35A8 8 0 1 0 19.73 14H17.6a6 6 0 1 1-1.77-5.37L14 10h6V4l-2.35 2.35Z" />
                </svg>
                <h2 className="text-xl font-black text-foreground">Eco-Catch</h2>
              </div>

              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Atrapa los residuos que caen en el campus universitario y
                clasifícalos correctamente en sus respectivos tachos.
              </p>

              {/* Feature pills */}
              <div className="mt-4 flex flex-wrap gap-2">
                {["Clasificación", "Reflejos", "Campus URP"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-eco-emerald-200 bg-eco-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-eco-emerald-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-5">
                <Link
                  href="/game/eco-catch"
                  id="play-eco-catch-btn"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-md shadow-eco-emerald-500/30 transition-all hover:brightness-110 hover:shadow-lg active:scale-95"
                >
                  {/* Play icon */}
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Jugar Eco-Catch
                </Link>
              </div>
            </div>
          </GameCard>

          {/* ── Card 2: Eco-Villa ── */}
          <GameCard href="/game/eco-villa" delay={0.2}>
            {/* Illustration area */}
            <div className="relative h-52 overflow-hidden bg-gradient-to-br from-cyan-100 via-sky-50 to-teal-100 sm:h-60">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-cyan-300/20"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-10 -left-6 h-36 w-36 rounded-full bg-teal-300/25"
              />

              {/* Water wave animation */}
              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-r from-cyan-300/40 via-sky-200/50 to-cyan-300/40 blur-sm"
              />

              {/* Icon */}
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="h-36 w-36 drop-shadow-lg sm:h-44 sm:w-44">
                  <EcoVillaIcon />
                </div>
              </div>

              {/* Badge */}
              <span className="absolute left-4 top-4 rounded-full bg-sky-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow">
                Próximamente
              </span>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <div className="mb-1 flex items-center gap-2">
                {/* Wave icon */}
                <svg className="h-4 w-4 text-cyan-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21H5.71C6.66 19.07 7.96 17.2 10 16c3.93-2.14 7.38-.77 9.31-.16C20.68 16.22 21 16 21 16s-1.7-5.19-4-8z" />
                </svg>
                <h2 className="text-xl font-black text-foreground">Eco-Villa</h2>
              </div>

              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Navega por los canales de los Pantanos de Villa en tu balsa de
                totora y detén la contaminación urbana antes de que llegue a
                las aves.
              </p>

              {/* Feature pills */}
              <div className="mt-4 flex flex-wrap gap-2">
                {["Navegación", "Ecosistemas", "Pantanos de Villa"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-5">
                <Link
                  href="/game/eco-villa"
                  id="play-eco-villa-btn"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-cyan-500/30 transition-all hover:brightness-110 hover:shadow-lg active:scale-95"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Jugar Eco-Villa
                </Link>
              </div>
            </div>
          </GameCard>
        </div>

        {/* ── Footer links ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground"
        >
          <Link
            href="/ranking"
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card/70 px-3 py-1.5 font-semibold transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {/* Trophy icon */}
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 2v2H5A1 1 0 0 0 4 5v3a4 4 0 0 0 4 4h.08A5 5 0 0 0 12 16a5 5 0 0 0 3.92-4H16a4 4 0 0 0 4-4V5a1 1 0 0 0-1-1h-2V2H7zm9 4h2v2a2 2 0 0 1-2 2v-4zM6 6V8a2 2 0 0 1-2-2V6h2zm5 12H9v-1h6v1h-2v3h-2v-3z" />
            </svg>
            Ver Ranking
          </Link>
          <Link
            href="/perfil"
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card/70 px-3 py-1.5 font-semibold transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {/* User icon */}
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" />
            </svg>
            Mi Perfil
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
