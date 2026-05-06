import { Container, Sprite, type Texture } from "pixi.js";
import type { WasteTypeId } from "@/game/config/wasteTypes";

export interface CollectorOptions {
  textures: Record<WasteTypeId, Texture>;
  startX: number;
  y: number;
  minX: number;
  maxX: number;
  moveSpeed: number;
  selectedType: WasteTypeId;
  baseScale?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Tacho recolector controlado por el jugador.
 * Aplica squash and stretch en desplazamiento lateral.
 */
export class Collector extends Container {
  private readonly sprite: Sprite;
  private readonly textures: Record<WasteTypeId, Texture>;
  private baseScale: number;

  private moveDirection = 0;
  private minX: number;
  private maxX: number;
  private readonly moveSpeed: number;
  private selectedType: WasteTypeId;

  public constructor(options: CollectorOptions) {
    super();

    this.minX = options.minX;
    this.maxX = options.maxX;
    this.moveSpeed = options.moveSpeed;
    this.selectedType = options.selectedType;
    this.textures = options.textures;
    this.baseScale = options.baseScale ?? 1;

    this.sprite = new Sprite(this.textures[options.selectedType]);
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(this.baseScale);

    this.x = options.startX;
    this.y = options.y;

    this.addChild(this.sprite);
    this.applySelectedType(options.selectedType);
  }

  public setBounds(minX: number, maxX: number): void {
    this.minX = minX;
    this.maxX = maxX;
    this.x = clamp(this.x, this.minX, this.maxX);
  }

  public setMoveDirection(direction: number): void {
    this.moveDirection = clamp(direction, -1, 1);
  }

  public setBaseScale(scale: number): void {
    this.baseScale = Math.max(0.1, scale);
    this.sprite.scale.set(this.baseScale);
  }

  public applySelectedType(type: WasteTypeId): void {
    this.selectedType = type;

    this.sprite.texture = this.textures[type];
    this.sprite.tint = 0xffffff;
  }

  public update(deltaMs: number): void {
    const previousX = this.x;
    this.x = clamp(this.x + (this.moveDirection * this.moveSpeed * deltaMs) / 1000, this.minX, this.maxX);

    const velocityX = this.x - previousX;
    const moving = Math.abs(velocityX) > 0.001;

    const targetScaleX = this.baseScale * (moving ? 1.14 : 1);
    const targetScaleY = this.baseScale * (moving ? 0.88 : 1);

    this.sprite.scale.x += (targetScaleX - this.sprite.scale.x) * 0.22;
    this.sprite.scale.y += (targetScaleY - this.sprite.scale.y) * 0.22;

    const targetRotation = this.moveDirection * 0.06;
    this.sprite.rotation += (targetRotation - this.sprite.rotation) * 0.18;

  }

  public getSelectedType(): WasteTypeId {
    return this.selectedType;
  }

  public getCollisionRadius(): number {
    return Math.max(30, this.width * 0.24);
  }
}
