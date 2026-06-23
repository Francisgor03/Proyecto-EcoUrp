import React from "react";

export default function EcoVillaInfo() {
  return (
    <section id="eco-villa" className="scroll-mt-24 border-t border-border bg-surface-raised/30 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Title Section */}
        <div className="mb-10 text-center sm:mb-12">
          <p className="mb-3 inline-flex rounded-full border border-eco-emerald-200 bg-eco-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-eco-emerald-800 shadow-sm dark:border-eco-emerald-900/40 dark:bg-eco-emerald-950/40 dark:text-eco-emerald-300 sm:mb-4 sm:px-4 sm:text-xs">
            Humedales de Lima
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl flex items-center justify-center gap-2">
            Protegiendo los Pantanos de Villa 🌿
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Descubre el propósito detrás de Eco-Villa y por qué tu misión de limpieza es fundamental para la conservación de este santuario natural.
          </p>
        </div>

        {/* Informative Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
          {/* Card 1: El Problema */}
          <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-8">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/5 blur-2xl transition-all duration-300 group-hover:scale-150" />
            <div className="flex flex-col gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-2xl text-amber-600 dark:text-amber-400">
                ⚠️
              </div>
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                  Impacto Crítico
                </span>
                <h3 className="text-lg font-bold text-foreground sm:text-xl">
                  El Problema Ambiental
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Los canales y lagunas de los Pantanos de Villa en Chorrillos (Lima, Perú) son refugios críticos de biodiversidad, albergando decenas de especies de plantas, peces y reptiles nativos. Sin embargo, sufren por la constante acumulación de basura y residuos plásticos de un solo uso arrastrados por canales alimentadores urbanos. Esta contaminación bloquea el ingreso de luz solar, reduce el oxígeno en el agua y asfixia el ecosistema acuático, poniendo en grave riesgo a la flora local y a cientos de especies de aves migratorias (que viajan desde Norteamérica) y que dependen de estas aguas para alimentarse y descansar.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Propósito */}
          <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-8">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-eco-emerald-500/5 blur-2xl transition-all duration-300 group-hover:scale-150" />
            <div className="flex flex-col gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-eco-emerald-500/10 text-2xl text-eco-emerald-600 dark:text-eco-emerald-400">
                🛶
              </div>
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-eco-emerald-600 dark:text-eco-emerald-400 mb-1">
                  Acción y Concientización
                </span>
                <h3 className="text-lg font-bold text-foreground sm:text-xl">
                  ¿Cómo ayuda Eco-Villa?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Inspirado en la conservación activa, Eco-Villa te pone al mando de un tradicional bote de totora, un patrimonio cultural peruano construido con fibras naturales. Tu misión de limpieza consiste en navegar y recolectar plásticos, vidrios y papeles antes de que alcancen las zonas de anidación. Esta experiencia gamificada busca concientizar a los estudiantes sobre el impacto real de los microplásticos y demostrar que las acciones directas de limpieza, combinadas con hábitos de separación en origen, son esenciales para recuperar nuestros ecosistemas y proteger la biodiversidad de Lima.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
