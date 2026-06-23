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
  /** En modo eco-villa el colector se mueve también verticalmente. */
  horizontal?: boolean;
  minY?: number;
  maxY?: number;
  ecoVillaCollectorTexture?: Texture;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Balsa/tacho recolector controlado por el jugador.
 *
 * Eco-Catch (vertical): movimiento horizontal con squash & stretch.
 * Eco-Villa (horizontal): movimiento bidimensional (X e Y) con las
 *   mismas animaciones aplicadas al desplazamiento dominante.
 */
export class Collector extends Container {
  private readonly sprite: Sprite;
  private readonly binSprite?: Sprite;
  private readonly textures: Record<WasteTypeId, Texture>;
  private baseScale: number;
  private baseMoveSpeed: number;
  private speedMultiplier = 1;

  private moveDirectionX = 0;
  private moveDirectionY = 0;
  private minX: number;
  private maxX: number;
  private minY: number;
  private maxY: number;
  private selectedType: WasteTypeId;
  private readonly is2D: boolean;

  public constructor(options: CollectorOptions) {
    super();

    this.is2D = options.horizontal ?? false;
    this.minX = options.minX;
    this.maxX = options.maxX;
    this.minY = options.minY ?? 0;
    this.maxY = options.maxY ?? 9999;
    this.baseMoveSpeed = options.moveSpeed;
    this.selectedType = options.selectedType;
    this.textures = options.textures;
    this.baseScale = options.baseScale ?? 1;

    if (this.is2D && options.ecoVillaCollectorTexture) {
      this.sprite = new Sprite(options.ecoVillaCollectorTexture);
      this.sprite.anchor.set(0.5);
      this.sprite.scale.set(this.baseScale * 0.28);
    } else {
      this.sprite = new Sprite(this.textures[options.selectedType]);
      this.sprite.anchor.set(0.5);
      this.sprite.scale.set(this.baseScale);
    }

    this.x = options.startX;
    this.y = options.y;

    this.addChild(this.sprite);
    if (this.binSprite) {
      this.addChild(this.binSprite);
    }
    this.applySelectedType(options.selectedType);
  }

  // ─── Bounds ─────────────────────────────────────────────────────────────────

  public setBounds(minX: number, maxX: number, minY?: number, maxY?: number): void {
    this.minX = minX;
    this.maxX = maxX;
    if (minY !== undefined) this.minY = minY;
    if (maxY !== undefined) this.maxY = maxY;
    this.x = clamp(this.x, this.minX, this.maxX);
    this.y = clamp(this.y, this.minY, this.maxY);
  }

  // ─── Direction API ───────────────────────────────────────────────────────────

  /** Dirección horizontal (-1, 0, 1). En Eco-Catch es la única dirección. */
  public setMoveDirection(direction: number): void {
    this.moveDirectionX = clamp(direction, -1, 1);
  }

  /** Dirección vertical (-1, 0, 1). Solo activa en Eco-Villa (is2D). */
  public setMoveDirectionY(direction: number): void {
    this.moveDirectionY = clamp(direction, -1, 1);
  }

  // ─── Speed / scale ──────────────────────────────────────────────────────────

  public setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = Math.max(0.2, multiplier);
  }

  public setBaseScale(scale: number): void {
    this.baseScale = Math.max(0.1, scale);
    this.sprite.scale.set(this.baseScale);
  }

  // ─── Appearance ─────────────────────────────────────────────────────────────

  public applySelectedType(type: WasteTypeId): void {
    this.selectedType = type;
    if (this.is2D) {
      if (this.binSprite) {
        this.binSprite.texture = this.textures[type];
      }
    } else {
      this.sprite.texture = this.textures[type];
    }
    this.sprite.tint = 0xffffff;
  }

  // ─── Update ─────────────────────────────────────────────────────────────────

  public update(deltaMs: number): void {
    const moveSpeed = this.baseMoveSpeed * this.speedMultiplier;
    const previousX = this.x;

    // Movimiento horizontal (ambos modos).
    this.x = clamp(
      this.x + (this.moveDirectionX * moveSpeed * deltaMs) / 1000,
      this.minX,
      this.maxX,
    );

    // Movimiento vertical (solo Eco-Villa).
    if (this.is2D) {
      this.y = clamp(
        this.y + (this.moveDirectionY * moveSpeed * deltaMs) / 1000,
        this.minY,
        this.maxY,
      );
    }

    // Squash & stretch según velocidad horizontal dominante.
    const velocityX = this.x - previousX;
    const moving = Math.abs(velocityX) > 0.001;

    const targetScaleX = this.baseScale * (moving ? 1.14 : 1);
    const targetScaleY = this.baseScale * (moving ? 0.88 : 1);

    const isVilla = this.is2D;
    const villaMult = isVilla ? 0.28 : 1.0;

    if (isVilla && this.binSprite) {
      this.sprite.scale.x += (targetScaleX * 0.28 - this.sprite.scale.x) * 0.22;
      this.sprite.scale.y += (targetScaleY * 0.28 - this.sprite.scale.y) * 0.22;
      
      this.binSprite.scale.x += (targetScaleX * 0.28 - this.binSprite.scale.x) * 0.22;
      this.binSprite.scale.y += (targetScaleY * 0.28 - this.binSprite.scale.y) * 0.22;
    } else {
      this.sprite.scale.x += (targetScaleX * villaMult - this.sprite.scale.x) * 0.22;
      this.sprite.scale.y += (targetScaleY * villaMult - this.sprite.scale.y) * 0.22;
    }

    const targetRotation = this.moveDirectionX * 0.06;
    this.sprite.rotation += (targetRotation - this.sprite.rotation) * 0.18;
    if (this.is2D && this.binSprite) {
      this.binSprite.rotation += (targetRotation - this.binSprite.rotation) * 0.18;
    }
  }

  // ─── Getters ─────────────────────────────────────────────────────────────────

  public getSelectedType(): WasteTypeId {
    return this.selectedType;
  }

  public getCollisionRadius(): number {
    const minRadius = this.is2D ? 18 : 30;
    return Math.max(minRadius, this.width * 0.24);
  }

  public getIs2D(): boolean {
    return this.is2D;
  }
}
