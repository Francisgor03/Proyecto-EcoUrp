"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AVATARS, getAvatarById, type UserStats } from "../../config/avatars";
import { useAvatarSelector } from "../../hooks/useAvatarSelector";

type AvatarSelectorProps = {
  currentAvatarId: string;
  userStats: UserStats;
  onSave: (avatarId: string) => Promise<void>;
};

type SaveStatus = "idle" | "saving" | "success" | "error";

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="m5 12 4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V8a4 4 0 1 1 8 0v2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" />
    </svg>
  );
}

export default function AvatarSelector({ currentAvatarId, userStats, onSave }: AvatarSelectorProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState("");
  const resetTimerRef = useRef<number | null>(null);

  const { selectedId, isOpen, isSaving, isDirty, selectAvatar, togglePanel, saveAvatar, isUnlocked } =
    useAvatarSelector({
      currentAvatarId,
      userStats,
      onSave,
    });

  const selectedAvatar = useMemo(() => getAvatarById(selectedId), [selectedId]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isSaving) {
      setSaveStatus("saving");
      return;
    }

    if (saveStatus === "saving") {
      setSaveStatus("idle");
    }
  }, [isSaving, saveStatus]);

  async function handleSaveAvatar() {
    if (!isDirty || isSaving) return;

    setSaveError("");
    setSaveStatus("saving");

    try {
      await saveAvatar();
      setSaveStatus("success");

      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }

      resetTimerRef.current = window.setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      setSaveStatus("error");
      if (error instanceof Error && error.message.trim()) {
        setSaveError(error.message);
        return;
      }
      setSaveError("No se pudo guardar el avatar.");
    }
  }

  const saveButtonLabel =
    saveStatus === "saving"
      ? "Guardando..."
      : saveStatus === "success"
        ? "Guardado"
        : "Guardar avatar";

  return (
    <div>
      <button
        type="button"
        onClick={togglePanel}
        className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
      >
        Cambiar avatar
      </button>

      <div
        className={`overflow-hidden transition-[max-height,opacity] ${isOpen ? "pointer-events-auto mt-3" : "pointer-events-none mt-0"}`}
        style={{
          maxHeight: isOpen ? "480px" : "0px",
          opacity: isOpen ? 1 : 0,
          transitionDuration: "300ms, 200ms",
          transitionTimingFunction: "ease, ease",
        }}
      >
        <div className="rounded-2xl border border-white/30 bg-white/95 p-4 text-[#1a5c3a] shadow-sm backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {AVATARS.map((avatar) => {
              const unlocked = isUnlocked(avatar, userStats);
              const isSelected = selectedId === avatar.id;

              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => {
                    if (!unlocked) return;
                    selectAvatar(avatar.id);
                  }}
                  tabIndex={unlocked ? 0 : -1}
                  aria-disabled={!unlocked}
                  data-unlock={avatar.unlockCondition}
                  className={`relative flex min-h-[132px] flex-col items-center rounded-2xl border px-3 py-3 text-center transition ${
                    isSelected
                      ? "border-[#2d9e6b] bg-[#e8f5ee]"
                      : "border-[#d4e9dc] bg-white"
                  } ${
                    unlocked
                      ? "cursor-pointer duration-150 hover:scale-[1.03]"
                      : "avatar-locked-tooltip cursor-not-allowed opacity-60"
                  }`}
                >
                  <span className={`leading-none ${unlocked ? "text-[32px]" : "text-[32px] grayscale"}`}>
                    {avatar.emoji}
                  </span>
                  <span className="mt-2 text-sm font-semibold text-[#0d2b1a]">{avatar.name}</span>

                  {unlocked ? (
                    <span className="mt-1 text-xs font-semibold text-[#2d9e6b]">Libre</span>
                  ) : (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#4a7c5f]">
                      <LockIcon className="h-3.5 w-3.5" />
                      <span className="line-clamp-2">{avatar.unlockCondition}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c7e7d8] bg-[#e8f5ee] px-3 py-1 text-xs font-semibold text-[#1a5c3a]">
              <span className="text-base leading-none">{selectedAvatar.emoji}</span>
              {selectedAvatar.name}
            </div>

            <button
              type="button"
              onClick={handleSaveAvatar}
              disabled={!isDirty || isSaving}
              className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-2xl bg-[#2d9e6b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#247f57] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saveStatus === "saving" ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : null}
              {saveStatus === "success" ? <CheckIcon className="h-4 w-4" /> : null}
              <span>{saveButtonLabel}</span>
            </button>

            {saveStatus === "error" ? (
              <p className="text-xs font-semibold text-[#9a3727]">{saveError || "No se pudo guardar el avatar."}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
