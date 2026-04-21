import { Collector } from "@/game/entities/Collector";
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

  public static isWasteOutOfBounds(waste: Waste, floorY: number): boolean {
    return waste.y - waste.getCollisionRadius() > floorY;
  }
}
