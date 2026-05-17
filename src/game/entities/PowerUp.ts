import { Container, Sprite, Texture } from "pixi.js";
import type { PowerUpId } from "@/game/config/powerUps";

export interface PowerUpOptions {
  id: string;
  type: PowerUpId;
  textures: Texture[];
  x: number;
  y: number;
  fallSpeed: number;
}

/**
 * Power up con animacion de caida, rotacion suave y wobble.
 */
export class PowerUp extends Container {
  public readonly id: string;
  public readonly type: PowerUpId;

  private readonly sprite: Sprite;
  private readonly wobbleAmplitude: number;
  private readonly wobbleFrequency: number;
  private readonly rotationSpeed: number;
  private readonly phaseOffset: number;

  private elapsedMs = 0;
  private originX: number;
  private _fallSpeed: number;

  public constructor(options: PowerUpOptions) {
    super();

    this.id = options.id;
    this.type = options.type;
    this.originX = options.x;
    this._fallSpeed = options.fallSpeed;

    const availableTextures = options.textures.length > 0 ? options.textures : [Texture.WHITE];
    const variantIndex = Math.floor(Math.random() * availableTextures.length);

    this.sprite = new Sprite(availableTextures[variantIndex]);
    this.sprite.anchor.set(0.5);

    const baseScale = 0.3 + Math.random() * 0.06;
    this.sprite.scale.set(baseScale);

    this.wobbleAmplitude = 6 + Math.random() * 10;
    this.wobbleFrequency = 0.0024 + Math.random() * 0.0025;
    this.rotationSpeed = (Math.random() * 2 - 1) * 0.0015;
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

    const pulse = 1 + Math.sin(this.elapsedMs * 0.008 + this.phaseOffset) * 0.04;
    this.scale.set(pulse);
  }

  public getCollisionRadius(): number {
    const size = Math.max(this.width, this.height);
    return Math.max(10, size * 0.34);
  }
}
