"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";

export default function PerfilPage() {
  const router = useRouter();
  const {
    session,
    user,
    loading,
    isConfigured,
    connectionChecked,
    connectionError,
    signOut,
  } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [draftName, setDraftName] = useState("");
  const [saving, setSaving] = useState(false);
  const [score, setScore] = useState(null);
  const [status, setStatus] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (!loading && isConfigured && !session) {
      router.replace("/login?next=/perfil");
    }
  }, [loading, session, isConfigured, router]);

  useEffect(() => {
    if (!user || !supabase) return;

    let isMounted = true;
    async function loadProfile() {
      setProfileLoading(true);
      setStatus("");

      const [{ data: profileData }, { data: scoreData }] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        supabase
          .from("ecourp_tacho_scores")
          .select("max_score")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (!isMounted) return;

      const name = profileData?.display_name?.trim() || "";
      setDisplayName(name);
      setDraftName(name);
      setScore(scoreData?.max_score ?? 0);
      setProfileLoading(false);
      setProfileLoaded(true);
    }

    loadProfile().catch(() => {
      if (!isMounted) return;
      setProfileLoading(false);
      setStatus("No se pudo cargar tu perfil.");
      setProfileLoaded(true);
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const createdAt = useMemo(() => {
    const raw = user?.created_at;
    if (!raw) return "";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [user]);

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-eco-emerald-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-amber-200 bg-amber-50/90 p-8 text-center text-sm text-amber-900 shadow-sm">
          <p className="font-medium">Configuracion pendiente</p>
          <p className="mt-2 text-amber-800/90">
            Crea un archivo <code className="rounded bg-amber-100 px-1">.env.local</code> con las
            variables de Supabase y reinicia el servidor de desarrollo.
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
          <p className="text-sm font-medium text-eco-emerald-800">Verificando tu sesion…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-eco-emerald-100/70 via-eco-emerald-50 to-eco-emerald-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
              Mi cuenta
            </p>
            <h1 className="text-2xl font-bold text-eco-emerald-950 sm:text-3xl">
              Tu perfil EcoURP
            </h1>
            <p className="mt-2 text-sm text-eco-emerald-700">
              Administra tu nombre, revisa tu progreso y confirma que tu sesion esta activa.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-eco-emerald-300 bg-white px-4 py-2 text-sm font-medium text-eco-emerald-800 shadow-sm hover:bg-eco-emerald-50"
            >
              ← Inicio
            </Link>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.replace("/login");
              }}
              className="rounded-full border border-eco-emerald-300 bg-eco-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-eco-emerald-700"
            >
              Cerrar sesion
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-eco-emerald-200 bg-white/95 p-8 shadow-lg shadow-eco-emerald-900/5">
            <div>
              <h2 className="text-lg font-semibold text-eco-emerald-900">Datos personales</h2>
              <p className="mt-1 text-sm text-eco-emerald-700">
                Estos datos se muestran en tu menu y en la plataforma.
              </p>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
                  Correo
                </p>
                <p className="mt-2 rounded-2xl border border-eco-emerald-100 bg-eco-emerald-50/70 px-4 py-3 text-sm font-medium text-eco-emerald-900">
                  {user?.email}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
                  Creada el
                </p>
                <p className="mt-2 rounded-2xl border border-eco-emerald-100 bg-eco-emerald-50/70 px-4 py-3 text-sm font-medium text-eco-emerald-900">
                  {createdAt || "-"}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
                Nombre para mostrar
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="Tu nombre"
                  className="w-full flex-1 rounded-2xl border border-eco-emerald-200 bg-white px-4 py-3 text-sm text-eco-emerald-900 shadow-sm outline-none transition focus:border-eco-emerald-500 focus:ring-2 focus:ring-eco-emerald-200"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!supabase || !user) return;
                    setSaving(true);
                    setStatus("");
                    const { error } = await supabase.from("profiles").upsert({
                      id: user.id,
                      display_name: draftName.trim() || null,
                    });
                    if (error) {
                      setStatus("No se pudo guardar el nombre. Verifica la tabla profiles.");
                    } else {
                      setDisplayName(draftName.trim());
                      setStatus("Nombre actualizado.");
                    }
                    setSaving(false);
                  }}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-2xl bg-eco-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-eco-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
              {status ? (
                <p className="mt-2 text-xs font-medium text-eco-emerald-700">{status}</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-eco-emerald-200 bg-white/95 p-8 shadow-lg shadow-eco-emerald-900/5">
            <h2 className="text-lg font-semibold text-eco-emerald-900">Resumen</h2>
            <p className="mt-1 text-sm text-eco-emerald-700">
              Tu progreso y actividad reciente.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-eco-emerald-100 bg-eco-emerald-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
                  Nombre actual
                </p>
                <p className="mt-2 text-lg font-semibold text-eco-emerald-900">
                  {profileLoaded
                    ? displayName || user?.email?.split("@")[0] || "EcoURP"
                    : "Cargando…"}
                </p>
              </div>

              <div className="rounded-2xl border border-eco-lime-200 bg-eco-lime-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
                  Maximo puntaje
                </p>
                <p className="mt-2 text-2xl font-bold text-eco-emerald-900">
                  {profileLoading ? "…" : score ?? 0}
                </p>
                <p className="mt-1 text-xs text-eco-emerald-700">
                  Sigue jugando para mejorar tu record.
                </p>
              </div>

              <div className="rounded-2xl border border-eco-emerald-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
                  Estado de la sesion
                </p>
                <p className="mt-2 text-sm font-semibold text-eco-emerald-900">
                  Sesion activa
                </p>
                <p className="mt-1 text-xs text-eco-emerald-700">
                  Tu cuenta esta verificada y lista para seguir aprendiendo.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
