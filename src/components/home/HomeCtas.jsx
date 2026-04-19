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
        href="/juego"
        className="inline-flex items-center justify-center rounded-2xl border-2 border-eco-emerald-600 bg-white px-8 py-3.5 text-sm font-semibold text-eco-emerald-800 shadow-sm transition hover:bg-eco-emerald-50"
      >
        Probar el juego
      </Link>
      {showAccess ? (
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-2xl bg-eco-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-eco-emerald-700"
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
      className="font-medium text-eco-emerald-700 underline-offset-2 hover:text-eco-emerald-900 hover:underline"
    >
      Acceso docentes y alumnado
    </Link>
  );
}
