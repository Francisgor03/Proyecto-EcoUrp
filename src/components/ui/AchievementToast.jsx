"use client";

import { useEffect, useMemo, useState } from "react";
import { ACHIEVEMENTS } from "@/lib/achievementsCatalog";

const EVENT_NAME = "ecourp:achievement-unlocked";
const AUTO_HIDE_MS = 5200;

function resolveAchievements(ids) {
  if (!Array.isArray(ids)) return [];
  const byId = new Map(ACHIEVEMENTS.map((achievement) => [achievement.id, achievement]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

export default function AchievementToast() {
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (event) => {
      const achievements = resolveAchievements(event?.detail?.achievementIds);
      if (!achievements.length) return;
      setQueue((prev) => [...prev, ...achievements]);
    };

    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  useEffect(() => {
    if (current || queue.length === 0) return;
    setCurrent(queue[0]);
    setQueue((prev) => prev.slice(1));
    setVisible(true);
  }, [queue, current]);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, AUTO_HIDE_MS);

    return () => window.clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    if (visible || !current) return undefined;
    const timer = window.setTimeout(() => setCurrent(null), 150);
    return () => window.clearTimeout(timer);
  }, [visible, current]);

  const hidden = useMemo(() => !current || !visible, [current, visible]);

  if (hidden) return null;

  return (
    <div className="fixed right-4 top-16 z-50 w-[min(92vw,380px)]">
      <div className="flex items-start gap-3 rounded-2xl border border-eco-emerald-200 bg-white/95 px-4 py-3 shadow-lg shadow-eco-emerald-900/10 backdrop-blur">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-eco-emerald-100 text-xs font-bold text-eco-emerald-800">
          {current.iconText || "LOGO"}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-eco-emerald-900">
            Felicidades, conseguiste el logro
          </p>
          <p className="mt-1 text-sm font-bold text-eco-emerald-700">"{current.title}"</p>
          <p className="mt-1 text-xs text-eco-emerald-700">{current.requirement}</p>
        </div>
        <button
          type="button"
          aria-label="Cerrar aviso"
          onClick={() => setVisible(false)}
          className="flex h-6 w-6 items-center justify-center rounded-full text-eco-emerald-600 transition hover:bg-eco-emerald-50"
        >
          ×
        </button>
      </div>
    </div>
  );
}
