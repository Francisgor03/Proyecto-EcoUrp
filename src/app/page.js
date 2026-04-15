import Link from "next/link";
import HomeHeader from "@/components/navigation/HomeHeader";

export const metadata = {
  title: "EcoURP | Inicio",
  description:
    "Plataforma educativa sobre reciclaje: aprende, juega y cuida el planeta.",
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <HomeHeader />

      <main className="flex-1">
        <section className="border-b border-eco-emerald-100 bg-gradient-to-b from-eco-emerald-100/60 via-eco-emerald-50 to-eco-emerald-50 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 inline-flex rounded-full border border-eco-emerald-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-eco-emerald-700 shadow-sm">
                Educación ambiental
              </p>
              <h1 className="text-balance text-3xl font-extrabold tracking-tight text-eco-emerald-950 sm:text-4xl lg:text-5xl">
                Aprende a reciclar con juegos y retos pensados para tu aula
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-eco-emerald-800 sm:text-lg">
                EcoURP es un espacio donde estudiantes y docentes exploran el ciclo de los
                materiales, practican la separación en origen y consolidan hábitos sostenibles.
              </p>
              <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
                <a
                  href="#reciclaje"
                  className="inline-flex items-center justify-center rounded-2xl bg-eco-lime-400 px-8 py-3.5 text-sm font-bold text-eco-emerald-950 shadow-md transition hover:bg-eco-lime-300"
                >
                  Conocer más
                </a>
                <Link
                  href="/juego"
                  className="inline-flex items-center justify-center rounded-2xl border-2 border-eco-emerald-600 bg-white px-8 py-3.5 text-sm font-semibold text-eco-emerald-800 shadow-sm transition hover:bg-eco-emerald-50"
                >
                  Probar el juego
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-eco-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-eco-emerald-700"
                >
                  Entrar a la plataforma
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          id="reciclaje"
          className="scroll-mt-20 px-4 py-14 sm:px-6 sm:py-16 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-eco-emerald-900 sm:text-3xl">
                ¿Por qué importa el reciclaje?
              </h2>
              <p className="mt-4 text-pretty text-eco-emerald-800">
                [Placeholder] El reciclaje reduce la extracción de materias primas, ahorra energía
                y disminuye la cantidad de residuos que llegan a vertederos. Cuando se hace bien,
                los envases y papel pueden volver a la cadena productiva en forma de nuevos
                productos.
              </p>
            </div>

            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Menos presión al planeta",
                  body: "[Placeholder] Reutilizar materiales alarga la vida útil de los recursos naturales y reduce emisiones asociadas a la fabricación desde cero.",
                  accent: "bg-eco-emerald-100 text-eco-emerald-800",
                },
                {
                  title: "Comunidades más limpias",
                  body: "[Placeholder] Una buena gestión de residuos mejora la salud pública y el entorno urbano, con menos acumulación y mejor calidad del aire y del suelo.",
                  accent: "bg-eco-lime-200 text-eco-emerald-900",
                },
                {
                  title: "Educación que transforma",
                  body: "[Placeholder] Aprender en el aula a separar y valorizar residuos genera ciudadanía activa y decisiones responsables en el hogar y el trabajo.",
                  accent: "bg-eco-emerald-200 text-eco-emerald-900",
                },
              ].map((card) => (
                <li
                  key={card.title}
                  className="flex flex-col rounded-3xl border border-eco-emerald-100 bg-white p-6 shadow-sm ring-1 ring-eco-emerald-100/60"
                >
                  <span
                    className={`mb-4 inline-flex w-fit rounded-2xl px-3 py-1 text-xs font-bold ${card.accent}`}
                  >
                    EcoURP
                  </span>
                  <h3 className="text-lg font-semibold text-eco-emerald-900">{card.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-eco-emerald-700">
                    {card.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="separacion"
          className="scroll-mt-20 border-t border-eco-emerald-100 bg-white/70 px-4 py-14 sm:px-6 sm:py-16 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
              <div className="rounded-3xl border border-eco-emerald-200 bg-gradient-to-br from-eco-emerald-100 to-eco-lime-100 p-8 shadow-inner sm:p-10">
                <h2 className="text-2xl font-bold text-eco-emerald-900 sm:text-3xl">
                  Separación en origen
                </h2>
                <p className="mt-4 text-eco-emerald-800">
                  [Placeholder] Separar en casa o en la escuela es el primer paso para que papel,
                  vidrio, metal y plástico reciclables lleguen limpios a las plantas. Consulta
                  siempre las normas de tu municipio: los colores del contenedor pueden variar.
                </p>
              </div>
              <div className="space-y-6 rounded-3xl border border-eco-emerald-100 bg-eco-emerald-50/50 p-8 sm:p-10">
                <h3 className="text-lg font-semibold text-eco-emerald-900">Tips rápidos</h3>
                <ul className="space-y-4 text-sm text-eco-emerald-800">
                  <li className="flex gap-3 rounded-2xl bg-white/80 p-4 shadow-sm">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-eco-lime-300 text-sm font-bold text-eco-emerald-900">
                      1
                    </span>
                    <span>
                      [Placeholder] Enjuaga ligeramente los envases de comida para evitar olores y
                      plagas; no hace falta que queden perfectos.
                    </span>
                  </li>
                  <li className="flex gap-3 rounded-2xl bg-white/80 p-4 shadow-sm">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-eco-lime-300 text-sm font-bold text-eco-emerald-900">
                      2
                    </span>
                    <span>
                      [Placeholder] Compacta cartones y botellas cuando sea seguro: caben más
                      materiales en el mismo contenedor y se optimiza el transporte.
                    </span>
                  </li>
                  <li className="flex gap-3 rounded-2xl bg-white/80 p-4 shadow-sm">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-eco-lime-300 text-sm font-bold text-eco-emerald-900">
                      3
                    </span>
                    <span>
                      [Placeholder] Evita mezclar residuos orgánicos o sucios con reciclables; una
                      pizza entera en el papel puede arruinar todo el lote.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-eco-emerald-200 bg-eco-emerald-100/40 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center text-sm text-eco-emerald-800 sm:flex-row sm:text-left">
          <p>© {new Date().getFullYear()} EcoURP. Plataforma educativa de reciclaje.</p>
          <Link
            href="/login"
            className="font-medium text-eco-emerald-700 underline-offset-2 hover:text-eco-emerald-900 hover:underline"
          >
            Acceso docentes y alumnado
          </Link>
        </div>
      </footer>
    </div>
  );
}
