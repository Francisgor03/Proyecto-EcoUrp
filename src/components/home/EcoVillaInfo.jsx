"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function EcoVillaInfo() {
  const [activeTab, setActiveTab] = useState("problem");

  const tabConfig = {
    problem: {
      title: "El Problema Ambiental en el Humedal",
      subtitle: "Crisis de Residuos",
      badge: "Crisis de Residuos",
      icon: "⚠️",
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      glowColor: "bg-amber-500/5",
      statColor: "text-amber-600 dark:text-amber-400",
      description:
        "Los canales y lagunas de los Pantanos de Villa en Chorrillos (Lima, Perú) son refugios críticos de biodiversidad, albergando decenas de especies de plantas, peces y reptiles nativos. Sin embargo, sufren por la constante acumulación de basura y residuos plásticos de un solo uso arrastrados por canales alimentadores urbanos. Esta contaminación bloquea el ingreso de luz solar, reduce el oxígeno en el agua y asfixia el ecosistema acuático, poniendo en grave riesgo a la flora local y a cientos de especies de aves migratorias (que viajan desde Norteamérica) y que dependen de estas aguas para alimentarse y descansar.",
      stats: [
        { value: "21k Toneladas", label: "De basura diaria generada en el Perú" },
        { value: "2.72%", label: "De residuos reaprovechables reciclados" },
        { value: "150+", label: "Especies de aves amenazadas por plástico" },
      ],
    },
    mission: {
      title: "Navegación Sostenible con Eco-Villa",
      subtitle: "Conservación Activa",
      badge: "Conservación Activa",
      icon: "🛶",
      badgeClass: "bg-eco-emerald-500/10 text-eco-emerald-600 dark:text-eco-emerald-400 border-eco-emerald-500/20",
      glowColor: "bg-eco-emerald-500/5",
      statColor: "text-eco-emerald-600 dark:text-eco-emerald-400",
      description:
        "Inspirado en la conservación activa, Eco-Villa te pone al mando de un tradicional bote de totora, un patrimonio cultural peruano construido con fibras naturales del humedal. Tu misión de limpieza consiste en navegar y recolectar plásticos, vidrios y papeles antes de que alcancen las zonas de anidación. Esta experiencia gamificada busca concientizar a los estudiantes sobre el impacto real de los microplásticos y demostrar que las acciones directas de limpieza, combinadas con hábitos de separación en origen, son esenciales para recuperar nuestros ecosistemas y proteger la biodiversidad de Lima.",
      stats: [
        { value: "Totora 100%", label: "Material orgánico biodegradable" },
        { value: "0% Basura", label: "Objetivo en zonas de anidamiento de aves" },
        { value: "Acción", label: "Gamificación educativa con impacto real" },
      ],
    },
  };

  const activeData = tabConfig[activeTab];

  return (
    <section id="eco-villa" className="relative scroll-mt-24 border-t border-border bg-surface-raised/30 px-4 py-16 sm:px-6 lg:px-8">
      {/* Background Spotlight Glow */}
      <div className={`absolute left-1/2 top-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px] transition-colors duration-700 ${activeData.glowColor}`} />

      <div className="mx-auto max-w-6xl">
        {/* Title Block */}
        <div className="mb-12 text-center">
          <p className="mb-3 inline-flex rounded-full border border-eco-emerald-200 bg-eco-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-eco-emerald-800 shadow-sm dark:border-eco-emerald-900/40 dark:bg-eco-emerald-950/40 dark:text-eco-emerald-300 sm:mb-4 sm:px-4 sm:text-xs">
            Humedales de Lima
          </p>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Protegiendo los Pantanos de Villa 🌿
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Descubre el propósito ecológico detrás de Eco-Villa y únete a la misión para preservar este ecosistema vital.
          </p>
        </div>

        {/* Dashboard Layout */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left Column: Interactive Nav List */}
          <div className="flex flex-row justify-center gap-2 lg:col-span-4 lg:flex-col lg:justify-start lg:gap-3">
            {(Object.keys(tabConfig)).map((tabKey) => {
              const tab = tabConfig[tabKey];
              const isActive = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`relative flex w-full max-w-xs items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-300 sm:max-w-none ${
                    isActive
                      ? "border-eco-emerald-500/30 bg-card shadow-md shadow-eco-emerald-950/5 ring-1 ring-eco-emerald-500/20"
                      : "border-border bg-card/40 hover:bg-card/85"
                  }`}
                >
                  {/* Left Accent indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-eco-emerald-500"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-raised text-xl">
                    {tab.icon}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold uppercase tracking-wider ${isActive ? "text-eco-emerald-600 dark:text-eco-emerald-400" : "text-muted-foreground"}`}>
                      {tab.subtitle}
                    </p>
                    <p className="truncate text-sm font-semibold text-foreground sm:text-base">
                      {tab.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Dynamic Panel with Framer Motion */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="rounded-3xl border border-border bg-card/80 p-6 shadow-lg backdrop-blur-md sm:p-8"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${activeData.badgeClass}`}>
                    {activeData.badge}
                  </span>
                </div>

                {/* Header Title */}
                <h3 className="text-xl font-extrabold text-foreground sm:text-2xl lg:text-3xl mb-4">
                  {activeData.title}
                </h3>

                {/* Description Text */}
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base mb-8">
                  {activeData.description}
                </p>

                {/* Stats Row */}
                <div className="grid gap-4 sm:grid-cols-3">
                  {activeData.stats.map((stat, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-border/80 bg-surface-raised/40 p-4 transition hover:bg-surface-raised/80"
                    >
                      <p className={`text-xl font-black sm:text-2xl ${activeData.statColor}`}>
                        {stat.value}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground leading-snug">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
