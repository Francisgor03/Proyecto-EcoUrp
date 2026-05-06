"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AVATARS, getAvatarById, type Avatar, type UserStats } from "@/config/avatars";

type UseAvatarSelectorParams = {
  currentAvatarId: string;
  userStats: UserStats;
  onSave: (avatarId: string) => Promise<void>;
};

type UseAvatarSelectorResult = {
  selectedId: string;
  isOpen: boolean;
  isSaving: boolean;
  isDirty: boolean;
  selectAvatar: (id: string) => void;
  togglePanel: () => void;
  saveAvatar: () => Promise<void>;
  isUnlocked: (avatar: Avatar, stats: UserStats) => boolean;
};

export function useAvatarSelector({
  currentAvatarId,
  userStats,
  onSave,
}: UseAvatarSelectorParams): UseAvatarSelectorResult {
  const resolvedCurrentId = useMemo(() => getAvatarById(currentAvatarId).id, [currentAvatarId]);

  const [selectedId, setSelectedId] = useState(resolvedCurrentId);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedId(resolvedCurrentId);
  }, [resolvedCurrentId]);

  const isUnlocked = useCallback((avatar: Avatar, stats: UserStats): boolean => {
    return avatar.unlockCheck(stats);
  }, []);

  const isDirty = selectedId !== resolvedCurrentId;

  const selectAvatar = useCallback(
    (id: string) => {
      const avatar = AVATARS.find((item) => item.id === id);
      if (!avatar) return;
      if (!isUnlocked(avatar, userStats)) return;
      setSelectedId(id);
    },
    [isUnlocked, userStats]
  );

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const saveAvatar = useCallback(async () => {
    if (!supabase || isSaving || !isDirty) return;

    setIsSaving(true);

    const previousId = resolvedCurrentId;
    let optimisticApplied = false;

    try {
      await onSave(selectedId);
      optimisticApplied = true;

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("No se encontró una sesión activa para guardar el avatar.");
      }

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_id: selectedId })
        .eq("id", user.id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      if (optimisticApplied) {
        try {
          await onSave(previousId);
        } catch {
          // Si falla el rollback visual, mantenemos el error original.
        }
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("No se pudo guardar el avatar.");
    } finally {
      setIsSaving(false);
    }
  }, [isDirty, isSaving, onSave, resolvedCurrentId, selectedId]);

  return {
    selectedId,
    isOpen,
    isSaving,
    isDirty,
    selectAvatar,
    togglePanel,
    saveAvatar,
    isUnlocked,
  };
}
