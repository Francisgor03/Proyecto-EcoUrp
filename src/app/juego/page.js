import Link from "next/link";
import GameContainer from "@/components/game/GameContainer";

export const metadata = {
  title: "EcoURP | Juego del tacho",
  description: "Clasifica residuos en el tacho correcto.",
};

export default function JuegoPage() {
  return (
    <div className="min-h-screen bg-eco-emerald-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-eco-emerald-900 sm:text-3xl">Juego del tacho</h1>
          <Link
            href="/"
            className="rounded-full border border-eco-emerald-300 bg-white px-4 py-2 text-sm font-medium text-eco-emerald-800 shadow-sm hover:bg-eco-emerald-50"
          >
            ← Inicio
          </Link>
        </div>
        <GameContainer />
        <p className="mt-4 text-center text-xs text-eco-emerald-600 sm:text-left">
          PC: teclas 1–4 cambian el tacho; flechas o A/D mueven. Móvil: botones inferiores.
        </p>
      </div>
    </div>
  );
}
