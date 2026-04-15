"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login");
  const [profilePromptOpen, setProfilePromptOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [pendingUserId, setPendingUserId] = useState("");

  const isReset = mode === "reset";
  const isSignup = mode === "signup";

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
    if (nextMode === "reset") {
      setPassword("");
      setConfirmPassword("");
    }
  }

  function closeProfilePrompt() {
    setProfilePromptOpen(false);
    setProfileName("");
    setPendingUserId("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!supabase) {
      setError(
        "Supabase no está configurado. Añade NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local."
      );
      return;
    }

    const emailTrim = email.trim();
    if (!emailTrim) {
      setError("Ingresa un correo válido.");
      return;
    }

    if (!isReset) {
      if (!password) {
        setError("Ingresa tu contraseña.");
        return;
      }
      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
      if (isSignup && password !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isReset) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailTrim, {
          redirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
        });

        if (resetError) {
          setError(resetError.message);
          return;
        }

        setMessage("Te enviamos un correo para restablecer tu contraseña.");
        return;
      }

      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: emailTrim,
          password,
          options: {
            emailRedirectTo:
              typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (data?.user?.id) {
          setPendingUserId(data.user.id);
          setProfilePromptOpen(true);
        } else {
          setMessage("Cuenta creada. Revisa tu correo para confirmar el acceso.");
          setMode("login");
        }
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailTrim,
        password,
      });

      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "Correo o contraseña incorrectos."
            : authError.message
        );
        return;
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("ecourp_login_toast", "1");
      }

      router.push(nextUrl || "/");
      router.refresh();
    } finally {
      setLoading(false);
    }
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
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-eco-emerald-50 p-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`rounded-xl px-3 py-2 transition ${
            mode === "login"
              ? "bg-white text-eco-emerald-900 shadow-sm"
              : "text-eco-emerald-700 hover:bg-white/70"
          }`}
        >
          Ingresar
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`rounded-xl px-3 py-2 transition ${
            mode === "signup"
              ? "bg-white text-eco-emerald-900 shadow-sm"
              : "text-eco-emerald-700 hover:bg-white/70"
          }`}
        >
          Crear cuenta
        </button>
        <button
          type="button"
          onClick={() => switchMode("reset")}
          className={`rounded-xl px-3 py-2 transition ${
            mode === "reset"
              ? "bg-white text-eco-emerald-900 shadow-sm"
              : "text-eco-emerald-700 hover:bg-white/70"
          }`}
        >
          Recuperar
        </button>
      </div>

      {isReset ? (
        <p className="text-sm text-eco-emerald-700">
          Ingresa tu correo para enviarte el enlace de recuperación.
        </p>
      ) : null}
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

      {!isReset ? (
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-eco-emerald-800">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-eco-emerald-200 bg-white px-4 py-3 text-eco-emerald-950 shadow-sm outline-none transition placeholder:text-eco-emerald-400 focus:border-eco-emerald-500 focus:ring-2 focus:ring-eco-emerald-200"
            placeholder="••••••••"
          />
        </div>
      ) : null}

      {profilePromptOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-eco-emerald-950/30 px-4">
          <div className="w-full max-w-md rounded-3xl border border-eco-emerald-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-eco-emerald-900">
                  Elige tu nombre de perfil
                </h2>
                <p className="mt-1 text-sm text-eco-emerald-700">
                  Este nombre aparecera en la plataforma.
                </p>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => {
                  closeProfilePrompt();
                  setMessage("Cuenta creada. Revisa tu correo para confirmar el acceso.");
                  setMode("login");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-eco-emerald-600 transition hover:bg-eco-emerald-50"
              >
                ×
              </button>
            </div>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
              Nombre para mostrar
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
              placeholder="Ej: Ana, Equipo Verde"
              className="mt-2 w-full rounded-2xl border border-eco-emerald-200 bg-white px-4 py-3 text-sm text-eco-emerald-900 shadow-sm outline-none transition focus:border-eco-emerald-500 focus:ring-2 focus:ring-eco-emerald-200"
            />

            <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  closeProfilePrompt();
                  setMessage("Cuenta creada. Revisa tu correo para confirmar el acceso.");
                  setMode("login");
                }}
                className="rounded-full border border-eco-emerald-200 px-4 py-2 text-sm font-semibold text-eco-emerald-700 hover:bg-eco-emerald-50"
              >
                Omitir
              </button>
              <button
                type="button"
                disabled={profileSaving}
                onClick={async () => {
                  if (!supabase || !pendingUserId) return;
                  setProfileSaving(true);
                  const { error: profileError } = await supabase.from("profiles").upsert({
                    id: pendingUserId,
                    display_name: profileName.trim() || null,
                  });
                  setProfileSaving(false);

                  if (profileError) {
                    setError("No se pudo guardar el nombre de perfil.");
                    return;
                  }

                  closeProfilePrompt();
                  setMessage("Cuenta creada. Revisa tu correo para confirmar el acceso.");
                  setMode("login");
                }}
                className="rounded-full bg-eco-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-eco-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {profileSaving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isSignup ? (
        <div className="space-y-2">
          <label htmlFor="confirm" className="block text-sm font-medium text-eco-emerald-800">
            Repite la contraseña
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-eco-emerald-200 bg-white px-4 py-3 text-eco-emerald-950 shadow-sm outline-none transition placeholder:text-eco-emerald-400 focus:border-eco-emerald-500 focus:ring-2 focus:ring-eco-emerald-200"
            placeholder="••••••••"
          />
        </div>
      ) : null}

      {message ? (
        <p
          className="rounded-xl border border-eco-emerald-200 bg-eco-emerald-50 px-4 py-3 text-sm text-eco-emerald-800"
          role="status"
        >
          {message}
        </p>
      ) : null}

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
        {loading
          ? "Procesando…"
          : isReset
          ? "Enviar enlace"
          : isSignup
          ? "Crear cuenta"
          : "Iniciar sesión"}
      </button>

      <p className="text-center text-sm text-eco-emerald-700">
        ¿Aún no tienes cuenta? Usa la pestaña "Crear cuenta".
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
