"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { normUserId } from "@/lib/normUserId";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const ACHIEVEMENT_COLORS = {
  first_session: "bg-emerald-500",
  five_sessions: "bg-teal-500",
  normal_50: "bg-orange-500",
  score_100: "bg-amber-500",
  modes_3: "bg-violet-500",
};

function AchievementDot({ achievement, unlocked }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, placeAbove: true });
  const triggerRef = useRef(null);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el || typeof window === "undefined") return;
    const r = el.getBoundingClientRect();
    const margin = 8;
    const approxH = 100;
    const spaceAbove = r.top;
    const placeAbove = spaceAbove >= approxH + margin;
    const centerX = r.left + r.width / 2;
    const halfW = 176 / 2; // w-44 = 11rem
    const left = Math.min(window.innerWidth - margin - halfW, Math.max(margin + halfW, centerX));
    const top = placeAbove ? r.top - margin : r.bottom + margin;
    setCoords({ top, left, placeAbove });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onMove = () => updatePosition();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, updatePosition]);

  const colorClass = ACHIEVEMENT_COLORS[achievement.id] || "bg-gray-400";

  const tooltip =
    open &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="pointer-events-none fixed z-[9999] w-44 rounded-xl border border-border bg-card p-2.5 text-left shadow-lg shadow-black/15"
        style={{
          left: coords.left,
          top: coords.top,
          transform: coords.placeAbove ? "translate(-50%, -100%)" : "translate(-50%, 0)",
        }}
        role="tooltip"
      >
        <span className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
              unlocked ? colorClass : "bg-muted-foreground"
            }`}
          />
          <span className="text-xs font-bold text-foreground">{achievement.title}</span>
        </span>
        <span className="mt-1 block text-[10px] leading-snug text-muted-foreground">
          {achievement.description}
        </span>
        {!unlocked && (
          <span className="mt-1.5 block text-[10px] font-semibold text-primary">
            🔒 {achievement.requirement}
          </span>
        )}
      </div>,
      document.body
    );

  return (
    <>
      <span
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={() => {
          setOpen(true);
          queueMicrotask(() => updatePosition());
        }}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => {
          setOpen(true);
          queueMicrotask(() => updatePosition());
        }}
        onBlur={() => setOpen(false)}
        tabIndex={0}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full border-2 border-card shadow-sm sm:h-[18px] sm:w-[18px] ${
            unlocked ? colorClass : "bg-surface-raised"
          }`}
          title={achievement.title}
        />
      </span>
      {tooltip}
    </>
  );
}

export default function RankingTable({ rows, profileNames, achievementsMap = {}, achievements = [] }) {
  const { user } = useAuth();

  if (!rows || rows.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Aun no hay puntajes para mostrar.</div>
    );
  }

  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-base sm:min-w-[720px]">
        <thead className="bg-surface-raised text-xs uppercase tracking-wide text-muted-foreground sm:text-sm">
          <tr>
            <th className="px-4 py-3.5 sm:px-5 sm:py-4">#</th>
            <th className="px-4 py-3.5 sm:px-5 sm:py-4">Jugador</th>
            <th className="px-4 py-3.5 sm:px-5 sm:py-4">Puntaje</th>
            <th className="hidden px-4 py-3.5 sm:table-cell sm:px-5 sm:py-4">Actualizado</th>
            <th className="px-4 py-3.5 sm:px-5 sm:py-4">Logros</th>
          </tr>
        </thead>
        <tbody className="text-foreground">
          {rows.map((row, index) => {
            const rawName = profileNames?.[row.user_id] || "";
            const isSelf = user && normUserId(row.user_id) === normUserId(user.id);
            const fallbackSelf = isSelf && user?.email ? user.email.split("@")[0] : "";
            const displayName = rawName.trim() || fallbackSelf || `Jugador ${row.user_id?.slice(0, 6)}`;
            const userAchievements = achievementsMap[normUserId(row.user_id)] || [];
            const unlockedSet = new Set(userAchievements);

            return (
              <tr
                key={`${row.user_id}-${row.updated_at}`}
                className={`border-t border-border transition-colors ${
                  isSelf
                    ? "bg-[var(--highlight-self)] shadow-[inset_3px_0_0_0_var(--primary)]"
                    : "bg-card"
                }`}
              >
                <td className="px-4 py-3.5 text-base font-semibold sm:px-5 sm:py-4 sm:text-lg">
                  {index + 1}
                </td>
                <td className="max-w-[140px] truncate px-4 py-3.5 text-base sm:max-w-none sm:px-5 sm:py-4 sm:text-lg">
                  {displayName}
                </td>
                <td className="px-4 py-3.5 text-base font-semibold sm:px-5 sm:py-4 sm:text-lg">
                  {row.max_score}
                </td>
                <td className="hidden px-4 py-3.5 text-sm text-muted-foreground sm:table-cell sm:px-5 sm:py-4 sm:text-base">
                  {formatDate(row.updated_at)}
                </td>
                <td className="px-4 py-3.5 sm:px-5 sm:py-4">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    {achievements.map((ach) => (
                      <AchievementDot
                        key={ach.id}
                        achievement={ach}
                        unlocked={unlockedSet.has(ach.id)}
                      />
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
