export type SfxType = "aceite" | "error" | "recogida" | "tronco";

export function playSfx(name: SfxType): void {
  if (typeof window === "undefined") {
    return;
  }

  const isMuted = localStorage.getItem("ecourp_music_muted") === "true";
  if (isMuted) {
    return;
  }

  try {
    const audio = new Audio(`/sfx/${name}.mp3`);
    audio.volume = 0.6; // 60% volume for clear sound effects
    audio.play().catch(() => {
      // Audio play blocked or interrupted, ignore
    });
  } catch (error) {
    console.warn(`[SFX] No se pudo reproducir sfx/${name}.mp3:`, error);
  }
}
