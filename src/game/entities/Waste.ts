import { Container, Sprite, type Texture } from "pixi.js";
import type { WasteTypeId } from "@/game/config/wasteTypes";

export interface WasteOptions {
  id: string;
  type: WasteTypeId;
  texture: Texture;
  x: number;
  y: number;
  fallSpeed: number;
}

/**
 * Residuo individual del juego con animaciones de caida,
 * rotacion suave y wobble horizontal.
 */
export class Waste extends Container {
  public readonly id: string;
  public readonly type: WasteTypeId;

  private readonly sprite: Sprite;
  private readonly wobbleAmplitude: number;
  private readonly wobbleFrequency: number;
  private readonly rotationSpeed: number;
  private readonly phaseOffset: number;

  private elapsedMs = 0;
  private originX: number;
  private _fallSpeed: number;

  public constructor(options: WasteOptions) {
    super();

    this.id = options.id;
    this.type = options.type;
    this.originX = options.x;
    this._fallSpeed = options.fallSpeed;

    this.sprite = new Sprite(options.texture);
    this.sprite.anchor.set(0.5);

    const baseScale = 0.42 + Math.random() * 0.12;
    this.sprite.scale.set(baseScale);

    this.wobbleAmplitude = 6 + Math.random() * 12;
    this.wobbleFrequency = 0.0024 + Math.random() * 0.0025;
    this.rotationSpeed = (Math.random() * 2 - 1) * 0.0018;
    this.phaseOffset = Math.random() * Math.PI * 2;

    this.x = options.x;
    this.y = options.y;

    this.addChild(this.sprite);
  }

  public setFallSpeed(nextSpeed: number): void {
    this._fallSpeed = Math.max(40, nextSpeed);
  }

  public shiftOrigin(deltaX: number): void {
    this.originX += deltaX;
  }

  public update(deltaMs: number): void {
    this.elapsedMs += deltaMs;

    this.y += (this._fallSpeed * deltaMs) / 1000;

    const wobbleX = Math.sin(this.elapsedMs * this.wobbleFrequency + this.phaseOffset) * this.wobbleAmplitude;
    this.x = this.originX + wobbleX;

    this.sprite.rotation += this.rotationSpeed * deltaMs;

    const pulse = 1 + Math.sin(this.elapsedMs * 0.008 + this.phaseOffset) * 0.03;
    this.scale.set(pulse);
  }

  public getCollisionRadius(): number {
    const size = Math.max(this.width, this.height);
    return Math.max(8, size * 0.35);
  }
}
