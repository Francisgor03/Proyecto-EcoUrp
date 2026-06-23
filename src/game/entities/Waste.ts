import { Container, Sprite, Texture } from "pixi.js";
import type { WasteTypeId } from "@/game/config/wasteTypes";

export interface WasteOptions {
  id: string;
  type: WasteTypeId;
  textures: Texture[];
  x: number;
  y: number;
  fallSpeed: number;
  /** Si es true el residuo flota horizontalmente (Eco-Villa). */
  horizontal?: boolean;
  isOilSpill?: boolean;
  isObstacle?: boolean;
  isBirdRescue?: boolean;
}

/**
 * Residuo individual del juego.
 *
 * Eco-Catch (vertical): cae de arriba hacia abajo con wobble horizontal suave.
 * Eco-Villa (horizontal): flota de izquierda a derecha arrastrado por la corriente
 *   con un movimiento sinusoidal en Y que simula el oleaje del canal.
 */
export class Waste extends Container {
  public readonly id: string;
  public readonly type: WasteTypeId;
  public readonly horizontal: boolean;
  public readonly isOilSpill: boolean;
  public readonly isObstacle: boolean;
  public readonly isBirdRescue: boolean;

  private readonly sprite: Sprite;
  private readonly wobbleAmplitude: number;
  private readonly wobbleFrequency: number;
  private readonly rotationSpeed: number;
  private readonly phaseOffset: number;

  private elapsedMs = 0;
  /** Posición de origen en el eje perpendicular al movimiento. */
  private originPerp: number;
  private _fallSpeed: number;

  public constructor(options: WasteOptions) {
    super();

    this.id = options.id;
    this.type = options.type;
    this.horizontal = options.horizontal ?? false;
    this.isOilSpill = options.isOilSpill ?? false;
    this.isObstacle = options.isObstacle ?? false;
    this.isBirdRescue = options.isBirdRescue ?? false;
    this._fallSpeed = options.fallSpeed;
    if (this.isObstacle) {
      this._fallSpeed = 45 * (options.fallSpeed / 200);
    }

    // En modo vertical originPerp es X; en horizontal es Y.
    this.originPerp = this.horizontal ? options.y : options.x;

    const availableTextures =
      options.textures.length > 0 ? options.textures : [Texture.WHITE];
    const variantIndex = Math.floor(Math.random() * availableTextures.length);

    this.sprite = new Sprite(availableTextures[variantIndex]);
    this.sprite.anchor.set(0.5);

    const baseScale = 0.26 + Math.random() * 0.1;
    this.sprite.scale.set(baseScale);

    // Parámetros de ondulación (usados en el eje perpendicular al movimiento).
    this.wobbleAmplitude = 6 + Math.random() * 12;
    this.wobbleFrequency = 0.0024 + Math.random() * 0.0025;
    if (this.isObstacle) {
      // El tronco de madera gira mucho menos
      this.rotationSpeed = (Math.random() * 2 - 1) * 0.00015;
    } else {
      this.rotationSpeed = (Math.random() * 2 - 1) * 0.0018;
    }
    this.phaseOffset = Math.random() * Math.PI * 2;

    this.x = options.x;
    this.y = options.y;

    this.addChild(this.sprite);
  }

  public setFallSpeed(nextSpeed: number): void {
    if (this.isObstacle) {
      // La madera se desplaza más lento, coordinada con la velocidad del fondo (cerca de 45 px/s).
      this._fallSpeed = 45 * (nextSpeed / 200);
    } else {
      this._fallSpeed = Math.max(40, nextSpeed);
    }
  }

  /** Desplaza el origen del eje perpendicular (usado por parallax horizontal). */
  public shiftOrigin(deltaPerp: number): void {
    this.originPerp += deltaPerp;
  }

  public update(deltaMs: number): void {
    this.elapsedMs += deltaMs;

    const wave =
      Math.sin(this.elapsedMs * this.wobbleFrequency + this.phaseOffset) *
      this.wobbleAmplitude;

    if (this.horizontal) {
      // Eco-Villa: avanza hacia la izquierda, ondula suavemente en Y.
      this.x -= (this._fallSpeed * deltaMs) / 1000;
      this.y = this.originPerp + wave;
    } else {
      // Eco-Catch: cae hacia abajo, wobble suave en X.
      this.y += (this._fallSpeed * deltaMs) / 1000;
      this.x = this.originPerp + wave;
    }

    this.sprite.rotation += this.rotationSpeed * deltaMs;

    const pulse =
      1 + Math.sin(this.elapsedMs * 0.008 + this.phaseOffset) * 0.03;
    this.scale.set(pulse);
  }

  public getCollisionRadius(): number {
    const size = Math.max(this.width, this.height);
    return Math.max(8, size * 0.35);
  }
}
