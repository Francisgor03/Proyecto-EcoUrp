import { Collector } from "@/game/entities/Collector";
import { PowerUp } from "@/game/entities/PowerUp";
import { Waste } from "@/game/entities/Waste";

/**
 * Sistema de colisión circular entre el recolector y residuos/power-ups.
 *
 * Eco-Catch: los residuos se consideran perdidos cuando cruzan el borde inferior.
 * Eco-Villa: los residuos se consideran perdidos cuando cruzan el borde DERECHO
 *   (llegaron a la zona de nidos de las aves).
 */
export class CollisionSystem {
  public static isCollectorTouchingWaste(
    collector: Collector,
    waste: Waste,
  ): boolean {
    const dx = collector.x - waste.x;
    const dy = collector.y - waste.y;
    const distanceSquared = dx * dx + dy * dy;
    const radius = collector.getCollisionRadius() + waste.getCollisionRadius();

    return distanceSquared <= radius * radius;
  }

  public static isCollectorTouchingPowerUp(
    collector: Collector,
    powerUp: PowerUp,
  ): boolean {
    const dx = collector.x - powerUp.x;
    const dy = collector.y - powerUp.y;
    const distanceSquared = dx * dx + dy * dy;
    const radius = collector.getCollisionRadius() + powerUp.getCollisionRadius();

    return distanceSquared <= radius * radius;
  }

  // ─── Vertical mode (Eco-Catch) ──────────────────────────────────────────────

  /** Residuo fuera del borde inferior (modo vertical). */
  public static isWasteOutOfBounds(waste: Waste, floorY: number): boolean {
    return waste.y - waste.getCollisionRadius() > floorY;
  }

  /** Power-up fuera del borde inferior (modo vertical). */
  public static isPowerUpOutOfBounds(powerUp: PowerUp, floorY: number): boolean {
    return powerUp.y - powerUp.getCollisionRadius() > floorY;
  }

  // ─── Horizontal mode (Eco-Villa) ────────────────────────────────────────────

  /**
   * Residuo cruzó el borde izquierdo sin ser atrapado.
   * Esto significa que llegó a la zona de nidos de las aves (extremo izquierdo) → penalización.
   */
  public static isWastePastLeftEdge(waste: Waste): boolean {
    return waste.x + waste.getCollisionRadius() < 0;
  }

  /** Power-up cruzó el borde izquierdo en modo horizontal (simplemente se descarta). */
  public static isPowerUpPastLeftEdge(powerUp: PowerUp): boolean {
    return powerUp.x + powerUp.getCollisionRadius() < 0;
  }
}
