"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!supabase) {
      setError(
        "Supabase no está configurado. Añade NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local."
      );
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : authError.message
      );
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (!supabase) {
    return (
      <div
        className="rounded-2xl border border-amber-200 bg-amber-50/90 p-6 text-center text-sm text-amber-900 shadow-sm"
        role="alert"
      >
        <p className="font-medium">Configuración pendiente</p>
        <p className="mt-2 text-amber-800/90">
          Crea un archivo <code className="rounded bg-amber-100 px-1">.env.local</code> con las
          variables de Supabase y reinicia el servidor de desarrollo.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-5"
      noValidate
    >
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-eco-emerald-800">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-eco-emerald-200 bg-white px-4 py-3 text-eco-emerald-950 shadow-sm outline-none transition placeholder:text-eco-emerald-400 focus:border-eco-emerald-500 focus:ring-2 focus:ring-eco-emerald-200"
          placeholder="tu@correo.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-eco-emerald-800">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-eco-emerald-200 bg-white px-4 py-3 text-eco-emerald-950 shadow-sm outline-none transition placeholder:text-eco-emerald-400 focus:border-eco-emerald-500 focus:ring-2 focus:ring-eco-emerald-200"
          placeholder="••••••••"
        />
      </div>

      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-eco-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-eco-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eco-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Entrando…" : "Iniciar sesión"}
      </button>

      <p className="text-center text-sm text-eco-emerald-700">
        ¿Aún no tienes cuenta? Pide acceso en tu centro educativo.
        <span className="mt-3 block">
          <Link
            href="/"
            className="font-medium text-eco-emerald-600 underline-offset-2 hover:text-eco-emerald-800 hover:underline"
          >
            ← Volver al inicio
          </Link>
        </span>
      </p>
    </form>
  );
}
