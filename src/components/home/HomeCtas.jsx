"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export default function HomeCtas({ className = "" }) {
  const { session, loading, isConfigured } = useAuth();
  const showAccess = !loading && isConfigured && !session;

  return (
    <div className={className}>
      <a
        href="#reciclaje"
        className="inline-flex items-center justify-center rounded-2xl bg-eco-lime-400 px-10 py-4 text-base font-bold text-eco-emerald-950 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-eco-lime-300 hover:shadow-xl active:scale-95"
      >
        Conocer mas
      </a>
      <Link
        href="/game"
        className="inline-flex items-center justify-center rounded-2xl border-2 border-border bg-card px-10 py-4 text-base font-semibold text-foreground shadow-lg transition-all duration-300 hover:scale-105 hover:bg-surface-raised hover:shadow-xl active:scale-95"
      >
        Probar el juego
      </Link>
      {showAccess ? (
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-2xl bg-primary px-10 py-4 text-base font-semibold text-primary-foreground shadow-lg transition-all duration-300 hover:scale-105 hover:opacity-90 hover:shadow-xl active:scale-95"
        >
          Entrar a la plataforma
        </Link>
      ) : null}
    </div>
  );
}

export function FooterAccessLink() {
  const { session, loading, isConfigured } = useAuth();
  const showAccess = !loading && isConfigured && !session;

  if (!showAccess) return null;

  return (
    <Link
      href="/login"
      className="font-medium text-primary underline-offset-2 hover:text-foreground hover:underline"
    >
      Acceso docentes y alumnado
    </Link>
  );
}
