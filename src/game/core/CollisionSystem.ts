import { Collector } from "@/game/entities/Collector";
import { PowerUp } from "@/game/entities/PowerUp";
import { Waste } from "@/game/entities/Waste";

/**
 * Sistema de colision circular entre el tacho recolector y residuos.
 */
export class CollisionSystem {
  public static isCollectorTouchingWaste(collector: Collector, waste: Waste): boolean {
    const dx = collector.x - waste.x;
    const dy = collector.y - waste.y;
    const distanceSquared = dx * dx + dy * dy;
    const radius = collector.getCollisionRadius() + waste.getCollisionRadius();

    return distanceSquared <= radius * radius;
  }

  public static isCollectorTouchingPowerUp(collector: Collector, powerUp: PowerUp): boolean {
    const dx = collector.x - powerUp.x;
    const dy = collector.y - powerUp.y;
    const distanceSquared = dx * dx + dy * dy;
    const radius = collector.getCollisionRadius() + powerUp.getCollisionRadius();

    return distanceSquared <= radius * radius;
  }

  public static isWasteOutOfBounds(waste: Waste, floorY: number): boolean {
    return waste.y - waste.getCollisionRadius() > floorY;
  }

  public static isPowerUpOutOfBounds(powerUp: PowerUp, floorY: number): boolean {
    return powerUp.y - powerUp.getCollisionRadius() > floorY;
  }
}
