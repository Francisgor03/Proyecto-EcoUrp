import React from "react";

export default function EcoVillaInfo() {
  return (
    <section className="border-t border-border bg-gradient-to-b from-transparent via-eco-emerald-50/10 to-eco-emerald-50/30 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Title Section */}
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl flex items-center justify-center gap-2">
            Protegiendo los Pantanos de Villa <span className="animate-pulse">🌿</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Descubre el propósito detrás de Eco-Villa y por qué tu misión de limpieza es fundamental.
          </p>
        </div>

        {/* Informative Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
          {/* Card 1: El Problema */}
          <div className="group relative overflow-hidden rounded-3xl border border-amber-200/50 bg-amber-50/30 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-amber-300/60 dark:border-amber-900/30 dark:bg-amber-950/10 sm:p-8">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl transition-all duration-300 group-hover:scale-150" />
            <div className="flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                ⚠️
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-950 dark:text-amber-200 sm:text-xl">
                  El Problema Ambiental
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-amber-900/80 dark:text-amber-400/80 sm:text-base">
                  Los canales y lagunas de los Pantanos de Villa en Lima, Perú, sufren por la constante acumulación de basura y residuos flotantes. Esta contaminación asfixia el ecosistema acuático, poniendo en grave riesgo a la flora local y a cientos de aves migratorias que dependen de estas aguas.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Propósito */}
          <div className="group relative overflow-hidden rounded-3xl border border-eco-emerald-200/50 bg-eco-emerald-50/20 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-eco-emerald-300/60 dark:border-eco-emerald-950/30 dark:bg-eco-emerald-950/10 sm:p-8">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-eco-emerald-400/10 blur-2xl transition-all duration-300 group-hover:scale-150" />
            <div className="flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-eco-emerald-100 text-2xl text-eco-emerald-700 dark:bg-eco-emerald-950 dark:text-eco-emerald-400">
                🛶
              </div>
              <div>
                <h3 className="text-lg font-bold text-eco-emerald-950 dark:text-eco-emerald-200 sm:text-xl">
                  ¿Cómo ayuda Eco-Villa?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-eco-emerald-900/80 dark:text-eco-emerald-400/80 sm:text-base">
                  A bordo de un tradicional bote de totora, navegarás por las aguas del humedal con la misión de recolectar toda la basura que interrumpe el ecosistema. Esta experiencia busca concientizar sobre el daño de los residuos y demostrar que, con esfuerzo, podemos limpiar nuestro entorno y proteger la biodiversidad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
