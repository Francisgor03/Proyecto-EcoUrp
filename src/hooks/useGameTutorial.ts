"use client";

import { useCallback, useEffect, useState } from "react";

export type TutorialEntryPoint = "auto" | "menu";

export interface GameTutorialState {
  isOpen: boolean;
  stepIndex: number;
  entryPoint: TutorialEntryPoint | null;
  hasSeen: boolean;
  ready: boolean;
  start: (entryPoint: TutorialEntryPoint) => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  finish: () => void;
}

const TUTORIAL_STORAGE_KEY = "ecourp_game_tutorial_seen_v1";

export function useGameTutorial(): GameTutorialState {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [entryPoint, setEntryPoint] = useState<TutorialEntryPoint | null>(null);
  const [hasSeen, setHasSeen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(TUTORIAL_STORAGE_KEY);
    setHasSeen(stored === "1");
    setReady(true);
  }, []);

  const markSeen = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(TUTORIAL_STORAGE_KEY, "1");
    setHasSeen(true);
  }, []);

  const start = useCallback((nextEntryPoint: TutorialEntryPoint) => {
    setEntryPoint(nextEntryPoint);
    setStepIndex(0);
    setIsOpen(true);
  }, []);

  const finish = useCallback(() => {
    setIsOpen(false);
    setStepIndex(0);
    setEntryPoint(null);
    markSeen();
  }, [markSeen]);

  const skip = useCallback(() => {
    finish();
  }, [finish]);

  const next = useCallback(() => {
    setStepIndex((current) => current + 1);
  }, []);

  const prev = useCallback(() => {
    setStepIndex((current) => Math.max(0, current - 1));
  }, []);

  return {
    isOpen,
    stepIndex,
    entryPoint,
    hasSeen,
    ready,
    start,
    next,
    prev,
    skip,
    finish,
  };
}
