import { useEffect, useRef, useState } from "react";

export function useBackgroundMusic(src: string, isPlaying: boolean, isGamePaused: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ecourp_music_muted") === "true";
    }
    return false;
  });

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.45;
    audio.muted = isMuted;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [src]);

  // Synchronize mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
    localStorage.setItem("ecourp_music_muted", String(isMuted));
  }, [isMuted]);

  // Handle play and pause states
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.warn("[BackgroundMusic] Play blocked by browser auto-play policy:", err);
      });
    } else {
      audio.pause();
      if (!isGamePaused) {
        audio.currentTime = 0;
      }
    }
  }, [isPlaying, isGamePaused]);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  return { isMuted, toggleMute };
}
