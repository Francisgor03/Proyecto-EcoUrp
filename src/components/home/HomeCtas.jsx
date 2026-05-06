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
        className="inline-flex items-center justify-center rounded-2xl bg-eco-lime-400 px-8 py-3.5 text-sm font-bold text-eco-emerald-950 shadow-md transition hover:bg-eco-lime-300"
      >
        Conocer mas
      </a>
      <Link
        href="/game"
        className="inline-flex items-center justify-center rounded-2xl border-2 border-border bg-card px-8 py-3.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-surface-raised"
      >
        Probar el juego
      </Link>
      {showAccess ? (
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90"
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
