import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "EcoURP | Iniciar sesión",
  description: "Accede a EcoURP con tu cuenta.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-eco-emerald-100/70 via-eco-emerald-50 to-eco-emerald-50 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto flex w-full max-w-md flex-col">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 self-start rounded-xl px-2 py-2 text-sm font-medium text-eco-emerald-800 transition hover:bg-white/60"
        >
          <span aria-hidden>←</span> Volver al inicio
        </Link>

        <div className="overflow-hidden rounded-3xl border border-eco-emerald-200/80 bg-white/95 p-8 shadow-xl shadow-eco-emerald-900/5 backdrop-blur-sm sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-eco-emerald-600 text-2xl font-bold text-white shadow-md">
              E
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-eco-emerald-950 sm:text-3xl">
              Bienvenido de nuevo
            </h1>
            <p className="mt-2 text-sm text-eco-emerald-700">
              Ingresa con el correo y contraseña de tu cuenta EcoURP.
            </p>
          </div>

          <Suspense fallback={<div>Cargando formulario...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-eco-emerald-600">
          Al continuar, aceptas el uso de autenticación segura proporcionada por Supabase. Activa el
          proveedor Email en el panel de tu proyecto si aún no lo has hecho.
        </p>
      </div>
    </div>
  );
}

