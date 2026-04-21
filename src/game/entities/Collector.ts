import { Container, Graphics, Sprite, Text, type Texture } from "pixi.js";
import { getWasteType, type WasteTypeId } from "@/game/config/wasteTypes";

export interface CollectorOptions {
  texture: Texture;
  startX: number;
  y: number;
  minX: number;
  maxX: number;
  moveSpeed: number;
  selectedType: WasteTypeId;
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
  private readonly selectionRing: Graphics;
  private readonly typeLabel: Text;

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

    this.sprite = new Sprite(options.texture);
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(0.54);

    this.selectionRing = new Graphics();
    this.selectionRing.y = 50;

    this.typeLabel = new Text({
      text: "",
      style: {
        fontFamily: "Trebuchet MS, Verdana, sans-serif",
        fontSize: 16,
        fontWeight: "700",
        fill: "#ecfdf5",
      },
    });
    this.typeLabel.anchor.set(0.5);
    this.typeLabel.y = 79;

    this.x = options.startX;
    this.y = options.y;

    this.addChild(this.sprite, this.selectionRing, this.typeLabel);
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

  public applySelectedType(type: WasteTypeId): void {
    this.selectedType = type;

    const selectedWaste = getWasteType(type);
    this.sprite.tint = selectedWaste.colorNumber;

    this.selectionRing.clear();
    this.selectionRing.circle(0, 0, 22);
    this.selectionRing.stroke({ width: 4, color: selectedWaste.colorNumber, alpha: 0.95 });
    this.selectionRing.fill({ color: selectedWaste.colorNumber, alpha: 0.2 });

    this.typeLabel.text = selectedWaste.label;
    this.typeLabel.style.fill = selectedWaste.colorHex;
  }

  public update(deltaMs: number): void {
    const previousX = this.x;
    this.x = clamp(this.x + (this.moveDirection * this.moveSpeed * deltaMs) / 1000, this.minX, this.maxX);

    const velocityX = this.x - previousX;
    const moving = Math.abs(velocityX) > 0.001;

    const targetScaleX = moving ? 1.14 : 1;
    const targetScaleY = moving ? 0.88 : 1;

    this.sprite.scale.x += (targetScaleX - this.sprite.scale.x) * 0.22;
    this.sprite.scale.y += (targetScaleY - this.sprite.scale.y) * 0.22;

    const targetRotation = this.moveDirection * 0.06;
    this.sprite.rotation += (targetRotation - this.sprite.rotation) * 0.18;

    const ringPulse = 1 + Math.sin(performance.now() * 0.008) * 0.05;
    this.selectionRing.scale.set(ringPulse);
  }

  public getSelectedType(): WasteTypeId {
    return this.selectedType;
  }

  public getCollisionRadius(): number {
    return Math.max(30, this.width * 0.24);
  }
}
