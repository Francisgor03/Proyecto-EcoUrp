"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// Images
import fondoEcoVillaImage from "@/assets/images/eco-villa/Fondo eco-villa.jpg";
import fondo2EcoVillaImage from "@/assets/images/eco-villa/fondo 2 eco-villa.png";

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
      borderColor: "border-amber-500/30 ring-amber-500/20",
      textColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-500/20 text-amber-800 dark:text-amber-200",
      indicatorColor: "bg-amber-500",
      image: fondoEcoVillaImage,
      description:
        "Los Pantanos de Villa, en Chorrillos (Lima, Perú), son la única área natural protegida del país ubicada dentro de una capital, y un refugio vital de biodiversidad: alberga más de 210 especies de aves —muchas migratorias desde Norteamérica—, 13 especies de peces y 5 de anfibios y reptiles. Sin embargo, el humedal enfrenta una crisis sostenida de contaminación: solo entre 2019 y 2021 se recolectaron más de 6,000 kg de residuos sólidos en su interior, y desde 2019 se han presentado al menos 12 denuncias ambientales por acumulación de basura, desmonte de construcción y quema de cableado en sus alrededores. Esta contaminación bloquea el ingreso de luz solar, reduce el oxígeno disuelto en el agua y pone en riesgo a la flora y fauna que dependen de este ecosistema.",
      stats: [
        { value: "210+", label: "Especies de aves que dependen de este humedal" },
        { value: "6,000 kg", label: "Residuos sólidos recolectados (2019–2021)" },
        { value: "12+", label: "Denuncias ante OEFA por contaminación desde 2019" },
      ],
      attribution: "Fuentes: SERNANP, OEFA / Sociedad Peruana de Derecho Ambiental",
    },
    mission: {
      title: "Navegación Sostenible con Eco-Villa",
      subtitle: "Conservación Activa",
      badge: "Conservación Activa",
      icon: "🛶",
      badgeClass: "bg-eco-emerald-500/10 text-eco-emerald-600 border-eco-emerald-500/20",
      glowColor: "bg-eco-emerald-500/5",
      statColor: "text-eco-emerald-600",
      borderColor: "border-eco-emerald-500/30 ring-eco-emerald-500/20",
      textColor: "text-eco-emerald-600",
      iconBg: "bg-eco-emerald-500/20 text-eco-emerald-800 dark:text-eco-emerald-200",
      indicatorColor: "bg-eco-emerald-500",
      image: fondo2EcoVillaImage,
      description:
        "Inspirado en la conservación activa, Eco-Villa te pone al mando de un tradicional bote de totora, un patrimonio cultural peruano construido con fibras naturales del humedal. Tu misión de limpieza consiste en navegar y recolectar plásticos, vidrios y papeles antes de que alcancen las zonas de anidación. Esta experiencia gamificada busca concientizar a los estudiantes sobre el impacto real de los microplásticos y demostrar que las acciones directas de limpieza, combinadas con hábitos de separación en origen, son esenciales para recuperar nuestros ecosistemas y proteger la biodiversidad de Lima.",
      stats: [
        { value: "Totora 100%", label: "Material orgánico biodegradable local" },
        { value: "0% Basura", label: "Objetivo en zonas de anidamiento de aves" },
        { value: "Acción", label: "Gamificación educativa con impacto real" },
      ],
      attribution: "Fuente: Proyecto de Educación Sostenible EcoURP",
    },
  };

  const activeData = tabConfig[activeTab];

  return (
    <section id="eco-villa" className="relative scroll-mt-24 border-t border-border bg-surface-raised/30 px-4 py-16 sm:px-6 lg:px-8">
      {/* Background Spotlight Glow */}
      <div className={`absolute left-1/2 top-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px] transition-colors duration-700 ${activeData.glowColor}`} />

      <div className="mx-auto max-w-6xl">
        {/* Title Block */}
        <div className="mb-10 text-center">
          <p className="mb-3 inline-flex rounded-full border border-eco-emerald-200/50 bg-eco-emerald-100/50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-eco-emerald-700 shadow-sm sm:mb-4 sm:px-4 sm:text-xs">
            Humedales de Lima
          </p>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Protegiendo los Pantanos de Villa 🌿
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Descubre el propósito ecológico detrás de Eco-Villa y únete a la misión para preservar este ecosistema vital.
          </p>
        </div>

        {/* Tab Buttons (Horizontal Layout Above the Card) */}
        <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto mb-8">
          {Object.keys(tabConfig).map((tabKey) => {
            const tab = tabConfig[tabKey];
            const isActive = activeTab === tabKey;
            return (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`relative flex items-center justify-center gap-3 rounded-2xl border p-4 text-left transition-all duration-300 ${
                  isActive
                    ? `${tab.borderColor} bg-card shadow-md ring-1`
                    : "border-border bg-card/40 hover:bg-card/85"
                }`}
              >
                {/* Horizontal Underline Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className={`absolute left-0 right-0 bottom-0 h-1 rounded-b-2xl ${tab.indicatorColor}`}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl transition-colors duration-300 ${isActive ? tab.iconBg : "bg-surface-raised"}`}>
                  {tab.icon}
                </span>
                <div className="min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? tab.textColor : "text-muted-foreground"}`}>
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

        {/* Full-width Dynamic Panel with Split Layout */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="overflow-hidden rounded-3xl border border-border bg-card/80 shadow-lg backdrop-blur-md"
            >
              <div className="grid gap-0 lg:grid-cols-12">
                {/* Left side: text, stats, and attribution */}
                <div className="p-6 sm:p-8 lg:col-span-7 flex flex-col justify-between">
                  <div>
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
                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-base mb-6">
                      {activeData.description}
                    </p>
                  </div>

                  <div>
                    {/* Stats Row */}
                    <div className="grid gap-3 sm:grid-cols-3 mb-4">
                      {activeData.stats.map((stat, i) => (
                        <div
                          key={i}
                          className="rounded-2xl border border-border/80 bg-surface-raised/40 p-3.5 transition hover:bg-surface-raised/80"
                        >
                          <p className={`text-lg font-black sm:text-xl ${activeData.statColor}`}>
                            {stat.value}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Attribution and Bridge Row */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
                      {activeData.attribution && (
                        <p className="text-[10px] text-muted-foreground/70 italic">
                          {activeData.attribution}
                        </p>
                      )}
                      
                      {activeTab === "problem" && (
                        <button
                          type="button"
                          onClick={() => setActiveTab("mission")}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-eco-emerald-600 hover:text-eco-emerald-500 hover:underline text-left transition-colors"
                        >
                          <span>↓ Así respondemos: conoce Eco-Villa y el bote de totora</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Image block */}
                <div className="relative aspect-[16/10] lg:aspect-auto lg:h-full lg:col-span-5 min-h-[280px]">
                  <Image
                    src={activeData.image}
                    alt={activeData.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 450px"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-eco-emerald-600/10" />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Global CTA Block */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-card p-6 text-center sm:flex-row sm:text-left sm:justify-between lg:p-8">
          <div>
            <h4 className="text-lg font-bold text-foreground">¿Listo para comenzar la limpieza?</h4>
            <p className="text-sm text-muted-foreground mt-1">Navega en tu balsa de totora y ayuda a descontaminar los humedales.</p>
          </div>
          <Link
            href="/game"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90"
          >
            ▶ Jugar Eco-Villa
          </Link>
        </div>
      </div>
    </section>
  );
}
