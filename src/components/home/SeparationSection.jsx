"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import spr_plastico_botella from "@/assets/sprites/spr_plastico_botella.png";
import spr_plastico_detergente from "@/assets/sprites/spr_plastico_detergente.png";
import spr_plastico_vaso from "@/assets/sprites/spr_plastico_vaso.png";
import spr_papel_bolsa from "@/assets/sprites/spr_papel_bolsa.png";
import spr_papel_caja from "@/assets/sprites/spr_papel_caja.png";
import spr_papel_diario from "@/assets/sprites/spr_papel_diario.png";
import spr_vidrio_botella from "@/assets/sprites/spr_vidrio_botella.png";
import spr_vidrio_frasco from "@/assets/sprites/spr_vidrio_frasco.png";
import spr_vidrio_tarro from "@/assets/sprites/spr_vidrio_tarro.png";
import spr_organico_banana from "@/assets/sprites/spr_organico_banana.png";
import spr_organico_huevo from "@/assets/sprites/spr_organico_huevo.png";
import spr_organico_manzana from "@/assets/sprites/spr_organico_manzana.png";

const AUTOPLAY_MS = 3600;

const WASTE_CONTENT = [
  {
    id: "plastic",
    label: "Plastico",
    helper: "Envases y botellas",
    color: "#facc15",
    tips: [
      "Enjuaga y escurre los envases para evitar malos olores y contaminacion del lote.",
      "Aplasta botellas y vasos para ahorrar espacio en el tacho.",
      "Retira tapas y etiquetas si son de otro material.",
    ],
    examples: [
      { src: spr_plastico_botella, alt: "Botella de plastico", label: "Botella" },
      { src: spr_plastico_detergente, alt: "Envase de detergente", label: "Detergente" },
      { src: spr_plastico_vaso, alt: "Vaso descartable", label: "Vaso plastico" },
    ],
  },
  {
    id: "paper",
    label: "Papel",
    helper: "Cajas y cuadernos",
    color: "#3b82f6",
    tips: [
      "Mantiene el papel seco: la humedad debilita las fibras reciclables.",
      "Pliega cajas y bolsas para reducir volumen.",
      "Evita papel con grasa o laminados metalizados.",
    ],
    examples: [
      { src: spr_papel_bolsa, alt: "Bolsa de papel", label: "Bolsa de papel" },
      { src: spr_papel_caja, alt: "Caja de carton", label: "Caja de carton" },
      { src: spr_papel_diario, alt: "Periodico", label: "Periodico" },
    ],
  },
  {
    id: "glass",
    label: "Vidrio",
    helper: "Frascos y botellas",
    color: "#22c55e",
    tips: [
      "Enjuaga frascos antes de tirarlos para evitar residuos pegados.",
      "No mezcles con ceramica o loza: no se reciclan igual.",
      "Separa tapas metalicas o de plastico.",
    ],
    examples: [
      { src: spr_vidrio_botella, alt: "Botella de vidrio", label: "Botella de vidrio" },
      { src: spr_vidrio_frasco, alt: "Frasco de vidrio", label: "Frasco" },
      { src: spr_vidrio_tarro, alt: "Tarro de vidrio", label: "Tarro" },
    ],
  },
  {
    id: "organic",
    label: "Organico",
    helper: "Restos biodegradables",
    color: "#a16207",
    tips: [
      "Incluye restos de comida, cascara y servilletas usadas.",
      "Evita mezclar con plastico o vidrio para que el compost sea limpio.",
      "Asegura que no lleve envases ni clips metalicos.",
    ],
    examples: [
      { src: spr_organico_banana, alt: "Cascara de banana", label: "Banana" },
      { src: spr_organico_huevo, alt: "Cascara de huevo", label: "Cascara de huevo" },
      { src: spr_organico_manzana, alt: "Restos de manzana", label: "Manzana" },
    ],
  },
];

export default function SeparationSection() {
  const [activeId, setActiveId] = useState(WASTE_CONTENT[0].id);
  const [slideIndex, setSlideIndex] = useState(0);

  const activeWaste = WASTE_CONTENT.find((waste) => waste.id === activeId) ?? WASTE_CONTENT[0];
  const exampleCount = activeWaste.examples.length;
  const safeIndex = slideIndex >= exampleCount ? 0 : slideIndex;
  const activeExample = activeWaste.examples[safeIndex];

  useEffect(() => {
    setSlideIndex(0);
  }, [activeId]);

  useEffect(() => {
    if (exampleCount <= 1) return undefined;

    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % exampleCount);
    }, AUTOPLAY_MS);

    return () => clearInterval(timer);
  }, [activeId, exampleCount]);

  const handlePrev = () => {
    if (exampleCount <= 1) return;
    setSlideIndex((prev) => (prev - 1 + exampleCount) % exampleCount);
  };

  const handleNext = () => {
    if (exampleCount <= 1) return;
    setSlideIndex((prev) => (prev + 1) % exampleCount);
  };

  return (
    <section
      id="separacion"
      className="scroll-mt-20 border-t border-border bg-surface-raised/60 px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_1.35fr] lg:items-start lg:gap-10">
          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-gradient-to-br from-eco-emerald-100 via-eco-emerald-50 to-eco-lime-100 p-6 shadow-inner sm:rounded-3xl sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-eco-emerald-700">
                Separacion en origen
              </p>
              <h2 className="mt-2 text-xl font-black text-foreground sm:text-2xl lg:text-3xl">
                Tu guia rapida para clasificar residuos
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base">
                Selecciona un tipo de residuo y descubre tips concretos con ejemplos del juego.
                Cada color representa un flujo distinto: separarlos bien mantiene el reciclaje
                limpio y evita rechazos en la planta.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  title: "1. Elige el tipo",
                  body: "Selecciona plastico, papel, vidrio u organico.",
                },
                {
                  title: "2. Revisa los tips",
                  body: "Lee recomendaciones rapidas para ese material.",
                },
                {
                  title: "3. Mira ejemplos",
                  body: "Identifica residuos reales del juego.",
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-border bg-card/80 p-4 text-xs text-muted-foreground shadow-sm sm:p-5"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
                    {step.title}
                  </p>
                  <p className="mt-2 leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>

          </div>

          <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-xl sm:rounded-3xl sm:p-6 lg:p-8">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
                    Selecciona el residuo
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground sm:text-xl">
                    Tipos de residuos
                  </h3>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-4 sm:gap-3">
                {WASTE_CONTENT.map((waste) => {
                  const selected = activeId === waste.id;

                  return (
                    <button
                      key={waste.id}
                      type="button"
                      onClick={() => setActiveId(waste.id)}
                      className={`rounded-2xl border px-3 py-3 text-left shadow-sm transition sm:px-4 sm:py-4 ${
                        selected
                          ? "border-transparent bg-card/90 shadow-lg"
                          : "border-border bg-card/70 hover:shadow-md"
                      }`}
                      style={selected ? { boxShadow: `0 12px 30px -20px ${waste.color}` } : undefined}
                      aria-pressed={selected}
                    >
                      <span
                        className="block text-sm font-extrabold"
                        style={{ color: waste.color }}
                      >
                        {waste.label}
                      </span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">
                        {waste.helper}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
                <div className="overflow-hidden rounded-2xl border border-border bg-surface-raised/70">
                  <div className="h-1 w-full" style={{ backgroundColor: activeWaste.color }} />
                  <div className="p-4 sm:p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                      Tips
                    </p>
                    <ul className="mt-3 space-y-3 text-xs text-muted-foreground sm:text-sm">
                      {activeWaste.tips.map((tip, index) => (
                        <li
                          key={tip}
                          className="flex gap-3 rounded-xl bg-card/80 p-3 shadow-sm"
                        >
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-slate-900"
                            style={{ backgroundColor: activeWaste.color }}
                          >
                            {index + 1}
                          </span>
                          <span className="leading-relaxed">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border bg-surface-raised/70">
                  <div className="h-1 w-full" style={{ backgroundColor: activeWaste.color }} />
                  <div className="p-4 sm:p-5">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-card/70">
                      {activeWaste.examples.map((example, index) => (
                        <div
                          key={example.label}
                          className={`absolute inset-0 transition-opacity duration-700 ${
                            index === safeIndex ? "opacity-100" : "opacity-0"
                          }`}
                        >
                          <Image
                            src={example.src}
                            alt={example.alt}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
                            className="object-contain p-6"
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-eco-emerald-100/20" />
                        </div>
                      ))}
                      <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white">
                        {activeExample.label}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handlePrev}
                        disabled={exampleCount <= 1}
                        className="rounded-full border border-border bg-card/80 p-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                        aria-label="Anterior"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>
                      <div className="flex items-center gap-2">
                        {activeWaste.examples.map((example, index) => (
                          <button
                            key={example.label}
                            type="button"
                            onClick={() => setSlideIndex(index)}
                            className={`h-2 w-2 rounded-full transition ${
                              index === safeIndex ? "scale-125 opacity-100" : "opacity-40"
                            }`}
                            style={{ backgroundColor: activeWaste.color }}
                            aria-label={`Ver ${example.label}`}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={exampleCount <= 1}
                        className="rounded-full border border-border bg-card/80 p-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                        aria-label="Siguiente"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
