import { Application, Container, Sprite, Texture } from "pixi.js";
import { WASTE_IDS, type WasteTypeId } from "@/game/config/wasteTypes";
import {
  POWER_UP_DROP_CHANCE,
  POWER_UP_IDS,
  POWER_UP_SLOW_MULTIPLIER,
  POWER_UP_SPEED_MULTIPLIER,
  type PowerUpId,
  type PowerUpStatus,
} from "@/game/config/powerUps";
import { DifficultyManager, type DifficultySnapshot } from "@/game/core/DifficultyManager";
import { CollisionSystem } from "@/game/core/CollisionSystem";
import { SpawnSystem, type SpawnPosition } from "@/game/core/SpawnSystem";
import { Collector } from "@/game/entities/Collector";
import { PowerUp } from "@/game/entities/PowerUp";
import { Waste } from "@/game/entities/Waste";
import { ParticleEffect } from "@/game/entities/ParticleEffect";
import type { LoadedGameAssets } from "@/game/utils/assetLoader";
import type { BaseEngine, GameStateBridge, GameStateSnapshot } from "./BaseEngine";

interface ParallaxLayer {
  spriteA: Sprite;
  spriteB: Sprite;
  speed: number;
  width: number;
}

const MAX_PLAY_WIDTH = 900;
const PLAY_PADDING = 52;

/**
 * Motor especializado para Eco-Villa (jugabilidad horizontal de derecha a izquierda).
 */
export class EcoVillaEngine implements BaseEngine {
  private readonly app: Application;
  private readonly assets: LoadedGameAssets;
  private readonly bridge: GameStateBridge;

  private readonly root = new Container();
  private readonly parallaxRoot = new Container();
  private readonly worldRoot = new Container();
  private readonly effectRoot = new Container();

  private readonly parallaxLayers: ParallaxLayer[] = [];

  private collector: Collector;
  private readonly particleEffect: ParticleEffect;
  private readonly errorIcon: Sprite;

  private readonly wastes: Waste[] = [];
  private readonly powerUps: PowerUp[] = [];

  private readonly difficultyManager: DifficultyManager;
  private currentDifficulty: DifficultySnapshot;
  private readonly spawnSystem: SpawnSystem;

  private isRoundRunning = false;
  private spawnedItemCount = 0;

  private width: number;
  private height: number;

  private shakeRemainingMs = 0;
  private shakeMagnitude = 0;

  private errorPulseRemainingMs = 0;

  // Variables para la ralentización por aceite
  private oilSlowDurationRemainingMs = 0;

  // Controles teclado
  private keyboardLeftPressed = false;
  private keyboardRightPressed = false;
  private keyboardUpPressed = false;
  private keyboardDownPressed = false;

  // Controles touch 2D
  private touchTrackingActive = false;
  private touchLastX = 0;
  private touchLastY = 0;
  private touchDirectionX = 0;
  private touchDirectionY = 0;
  private touchDirectionMs = 0;

  private readonly keyDownHandler: (event: KeyboardEvent) => void;
  private readonly keyUpHandler: (event: KeyboardEvent) => void;
  private readonly pointerDownHandler: (event: PointerEvent) => void;
  private readonly pointerMoveHandler: (event: PointerEvent) => void;
  private readonly pointerUpHandler: () => void;

  private readonly tickHandler: (ticker: { deltaMS: number }) => void;

  public constructor(options: { app: Application; assets: LoadedGameAssets; bridge: GameStateBridge }) {
    this.app = options.app;
    this.assets = options.assets;
    this.bridge = options.bridge;

    this.width = this.app.renderer.width;
    this.height = this.app.renderer.height;

    const initialState = this.bridge.getState();

    this.difficultyManager = new DifficultyManager(initialState.mode);
    this.currentDifficulty = this.difficultyManager.getCurrent(0, 0);

    this.app.stage.addChild(this.root);
    this.root.addChild(this.parallaxRoot, this.worldRoot, this.effectRoot);

    this.setupParallax();

    const playBounds = this.getPlayBounds();
    const waterBounds = this.getWaterBounds();

    // En Eco-Villa el recolector se mueve con la balsa en 2D (sin límites horizontales)
    this.collector = new Collector({
      textures: this.assets.collectors,
      startX: this.width / 4, // Empezar en la parte izquierda
      y: this.height / 2,
      minX: 0,
      maxX: this.width,
      moveSpeed: 380,
      selectedType: initialState.selectedType,
      baseScale: this.resolveCollectorScale(),
      horizontal: true,
      minY: waterBounds.minY,
      maxY: waterBounds.maxY,
      ecoVillaCollectorTexture: this.assets.ecoVilla?.collector,
    });

    this.errorIcon = new Sprite(this.assets.errorIcon);
    this.errorIcon.anchor.set(0.5);
    this.errorIcon.visible = false;
    this.errorIcon.alpha = 0;
    this.errorIcon.scale.set(0.42);

    this.worldRoot.addChild(this.collector, this.errorIcon);

    this.particleEffect = new ParticleEffect(this.effectRoot, this.assets.particle);

    this.spawnSystem = new SpawnSystem({
      minX: playBounds.minX,
      maxX: playBounds.maxX,
      minY: waterBounds.minY,
      maxY: waterBounds.maxY,
      horizontal: true,
      getCurrentSpawnMs: () => this.currentDifficulty.spawnMs,
      onSpawn: (pos) => this.spawnItem(pos),
    });

    this.keyDownHandler = (event) => this.handleKeyDown(event);
    this.keyUpHandler = (event) => this.handleKeyUp(event);
    this.pointerDownHandler = (event) => this.handlePointerDown(event);
    this.pointerMoveHandler = (event) => this.handlePointerMove(event);
    this.pointerUpHandler = () => this.handlePointerUp();

    window.addEventListener("keydown", this.keyDownHandler);
    window.addEventListener("keyup", this.keyUpHandler);

    this.app.canvas.addEventListener("pointerdown", this.pointerDownHandler);
    this.app.canvas.addEventListener("pointermove", this.pointerMoveHandler);
    this.app.canvas.addEventListener("pointerup", this.pointerUpHandler);
    this.app.canvas.addEventListener("pointercancel", this.pointerUpHandler);
    this.app.canvas.addEventListener("pointerleave", this.pointerUpHandler);

    this.tickHandler = (ticker) => this.update(ticker.deltaMS);
    this.app.ticker.add(this.tickHandler);

    this.syncToState(initialState);
  }

  public startRound(): void {
    const snapshot = this.bridge.getState();

    this.isRoundRunning = true;
    this.spawnedItemCount = 0;
    this.oilSlowDurationRemainingMs = 0;

    this.difficultyManager.setMode(snapshot.mode);
    this.currentDifficulty = this.difficultyManager.getCurrent(snapshot.durationMs, snapshot.correct);

    this.clearWastes();
    this.clearPowerUps();

    // Resetear posición de la balsa
    this.collector.x = this.width / 4;
    this.collector.y = this.height / 2;
    this.collector.setMoveDirection(0);
    this.collector.setMoveDirectionY(0);
    this.collector.setSpeedMultiplier(1);

    const waterBounds = this.getWaterBounds();
    this.spawnSystem.setBounds(
      this.getPlayBounds().minX,
      this.getPlayBounds().maxX,
      waterBounds.minY,
      waterBounds.maxY,
    );

    this.spawnSystem.setPaused(false);
    this.spawnSystem.reset();
    this.spawnSystem.forceSpawn();

    this.shakeRemainingMs = 0;
    this.shakeMagnitude = 0;

    this.errorPulseRemainingMs = 0;
    this.errorIcon.visible = false;
    this.errorIcon.alpha = 0;

    this.root.position.set(0, 0);
  }

  public stopRound(): void {
    this.isRoundRunning = false;
    this.spawnSystem.setPaused(true);
    this.collector.setMoveDirection(0);
    this.collector.setMoveDirectionY(0);
    this.touchDirectionX = 0;
    this.touchDirectionY = 0;
    this.touchDirectionMs = 0;

    this.clearWastes();
    this.clearPowerUps();
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;

    const playBounds = this.getPlayBounds();
    const waterBounds = this.getWaterBounds();

    this.spawnSystem.setBounds(
      playBounds.minX,
      playBounds.maxX,
      waterBounds.minY,
      waterBounds.maxY,
    );
    this.collector.setBounds(
      0,
      this.width,
      waterBounds.minY,
      waterBounds.maxY,
    );
    this.collector.setBaseScale(this.resolveCollectorScale());

    this.parallaxLayers.forEach((layer) => {
      this.layoutParallaxLayer(layer);
    });
  }

  public destroy(): void {
    this.app.ticker.remove(this.tickHandler);

    window.removeEventListener("keydown", this.keyDownHandler);
    window.removeEventListener("keyup", this.keyUpHandler);

    this.app.canvas.removeEventListener("pointerdown", this.pointerDownHandler);
    this.app.canvas.removeEventListener("pointermove", this.pointerMoveHandler);
    this.app.canvas.removeEventListener("pointerup", this.pointerUpHandler);
    this.app.canvas.removeEventListener("pointercancel", this.pointerUpHandler);
    this.app.canvas.removeEventListener("pointerleave", this.pointerUpHandler);

    this.clearWastes();
    this.clearPowerUps();
    this.particleEffect.destroy();

    this.root.destroy({ children: true });
  }

  private setupParallax(): void {
    if (!this.assets.ecoVilla) return;

    const layersConfig = [
      { texture: this.assets.ecoVilla.backgroundFar, speed: 6, alpha: 1.0, tint: 0xffffff },
      { texture: this.assets.ecoVilla.backgroundNear, speed: 18, alpha: 1.0, tint: 0xffffff },
    ];

    for (const layerConfig of layersConfig) {
      const spriteA = new Sprite(layerConfig.texture);
      const spriteB = new Sprite(layerConfig.texture);

      spriteA.alpha = layerConfig.alpha;
      spriteB.alpha = layerConfig.alpha;
      spriteA.tint = layerConfig.tint;
      spriteB.tint = layerConfig.tint;

      this.parallaxRoot.addChild(spriteA, spriteB);

      const layer: ParallaxLayer = {
        spriteA,
        spriteB,
        speed: layerConfig.speed,
        width: this.width,
      };

      this.layoutParallaxLayer(layer);
      this.parallaxLayers.push(layer);
    }
  }

  private layoutParallaxLayer(layer: ParallaxLayer): void {
    const texture = layer.spriteA.texture;
    const scale = this.height / texture.height;
    const scaledWidth = Math.max(this.width, texture.width * scale);

    layer.width = scaledWidth;

    layer.spriteA.width = scaledWidth;
    layer.spriteA.height = this.height;
    layer.spriteA.x = 0;
    layer.spriteA.y = 0;

    layer.spriteB.width = scaledWidth;
    layer.spriteB.height = this.height;
    layer.spriteB.x = scaledWidth - 1;
    layer.spriteB.y = 0;
  }

  private update(deltaMs: number): void {
    const stateSnapshot = this.bridge.getState();
    this.syncToState(stateSnapshot);

    if (!this.isRoundRunning) {
      return;
    }

    const tickedState = this.bridge.onFrameTick(deltaMs);
    if (tickedState.phase !== "playing") {
      this.stopRound();
      return;
    }

    if (tickedState.manualPaused) {
      this.spawnSystem.setPaused(true);
      this.collector.setMoveDirection(0);
      this.collector.setMoveDirectionY(0);
      return;
    }

    this.updateParallax(deltaMs);

    this.difficultyManager.setMode(tickedState.mode);
    this.currentDifficulty = this.difficultyManager.getCurrent(tickedState.durationMs, tickedState.correct);

    // Ralentización por aceite
    if (this.oilSlowDurationRemainingMs > 0) {
      this.oilSlowDurationRemainingMs = Math.max(0, this.oilSlowDurationRemainingMs - deltaMs);
    }
    this.collector.setOilDirty(this.oilSlowDurationRemainingMs > 0);

    this.applySpeedMultiplier(tickedState);

    // Mover balsa
    const moveX = this.computeMoveDirectionX(deltaMs);
    const moveY = this.computeMoveDirectionY(deltaMs);
    this.collector.setMoveDirection(moveX);
    this.collector.setMoveDirectionY(moveY);
    this.collector.update(deltaMs);

    this.spawnSystem.setPaused(false);
    this.spawnSystem.update(deltaMs);

    const fallSpeed = this.resolveDriftSpeed(tickedState);

    // Actualizar residuos, obstáculos, aves
    for (let index = this.wastes.length - 1; index >= 0; index -= 1) {
      const waste = this.wastes[index];
      waste.setFallSpeed(fallSpeed);
      waste.update(deltaMs);

      if (CollisionSystem.isCollectorTouchingWaste(this.collector, waste)) {
        this.resolveCollectorCollision(index, waste);
        if (!this.isRoundRunning) return;
        continue;
      }

      // El residuo se escapó por el borde izquierdo
      if (CollisionSystem.isWastePastLeftEdge(waste)) {
        this.resolveMissedWaste(index, waste);
        if (!this.isRoundRunning) return;
      }
    }

    // Actualizar power-ups
    for (let index = this.powerUps.length - 1; index >= 0; index -= 1) {
      const powerUp = this.powerUps[index];
      powerUp.setFallSpeed(fallSpeed);
      powerUp.update(deltaMs);

      if (CollisionSystem.isCollectorTouchingPowerUp(this.collector, powerUp)) {
        this.resolvePowerUpCollision(index, powerUp);
        if (!this.isRoundRunning) return;
        continue;
      }

      if (CollisionSystem.isPowerUpPastLeftEdge(powerUp)) {
        this.removePowerUpAt(index);
      }
    }

    this.particleEffect.update(deltaMs);
    this.updateScreenShake(deltaMs);
    this.updateErrorIcon(deltaMs);
  }

  private resolveCollectorCollision(index: number, waste: Waste): void {
    const hitX = waste.x;
    const hitY = waste.y;

    if (waste.isObstacle) {
      // Chocar con tronco
      this.removeWasteAt(index);
      this.triggerErrorFeedback();
      if (this.bridge.onObstacleHit) {
        const nextState = this.bridge.onObstacleHit();
        if (nextState.phase !== "playing") {
          this.stopRound();
        }
      }
      return;
    }



    if (waste.isOilSpill) {
      // Mancha de aceite
      this.removeWasteAt(index);
      this.oilSlowDurationRemainingMs = 2000; // Ralentización por 2 segundos
      this.particleEffect.emitSuccessBurst(hitX, hitY, "#78350f"); // Café
      return;
    }

    // Basura estándar (recolección automática sin clasificar en Eco-Villa)
    const typeColor = this.resolveTypeColor(waste.type);
    this.removeWasteAt(index);
    this.particleEffect.emitSuccessBurst(hitX, hitY, typeColor);

    const nextState = this.bridge.onCorrectCatch();
    if (nextState.phase !== "playing") {
      this.stopRound();
    }
  }

  private resolvePowerUpCollision(index: number, powerUp: PowerUp): void {
    this.removePowerUpAt(index);
    const nextState = this.bridge.onPowerUpCollected(powerUp.type);
    if (nextState.phase !== "playing") {
      this.stopRound();
    }
  }

  private resolveMissedWaste(index: number, waste: Waste): void {
    this.removeWasteAt(index);

    // Solo los residuos normales y las manchas de aceite restan vida al llegar a los nidos.
    // Los obstáculos no penalizan por fugarse.
    if (!waste.isObstacle) {
      const nextState = this.bridge.onMissedWaste();
      if (nextState.phase !== "playing") {
        this.stopRound();
      }
    }
  }

  private removeWasteAt(index: number): void {
    const waste = this.wastes[index];
    if (!waste) return;

    this.wastes.splice(index, 1);
    waste.destroy({ children: true });
  }

  private removePowerUpAt(index: number): void {
    const powerUp = this.powerUps[index];
    if (!powerUp) return;

    this.powerUps.splice(index, 1);
    powerUp.destroy({ children: true });
  }

  private getPlayBounds(): { minX: number; maxX: number } {
    const effectiveWidth = Math.min(this.width, MAX_PLAY_WIDTH);
    const centerX = this.width / 2;
    const halfPlay = effectiveWidth / 2 - PLAY_PADDING;

    return {
      minX: centerX - halfPlay,
      maxX: centerX + halfPlay,
    };
  }

  private getWaterBounds(): { minY: number; maxY: number } {
    // La zona superior de plantas ocupa aprox. el 35% de la pantalla.
    // La zona inferior es navegable casi hasta el borde (8% de margen).
    return {
      minY: this.height * 0.35,
      maxY: this.height - this.height * 0.08,
    };
  }

  private resolveCollectorScale(): number {
    if (this.width < 360) return 0.66;
    if (this.width < 420) return 0.72;
    if (this.width < 520) return 0.82;
    return 1;
  }

  private clearWastes(): void {
    while (this.wastes.length) {
      const waste = this.wastes.pop();
      waste?.destroy({ children: true });
    }
  }

  private clearPowerUps(): void {
    while (this.powerUps.length) {
      const powerUp = this.powerUps.pop();
      powerUp?.destroy({ children: true });
    }
  }

  private spawnItem(pos: SpawnPosition): void {
    const roll = Math.random();

    if (roll < 0.65) {
      // 65% Basura estándar
      this.spawnWaste(this.pickRandomWasteType(), pos, false, false);
    } else if (roll < 0.75) {
      // 10% PowerUp
      this.spawnPowerUp(this.pickRandomPowerUpType(), pos);
    } else if (roll < 0.90) {
      // 15% Tronco obstáculo
      this.spawnWaste("organic", pos, false, true);
    } else {
      // 10% Mancha de aceite
      this.spawnWaste("organic", pos, true, false);
    }
  }

  private spawnWaste(
    type: WasteTypeId,
    pos: SpawnPosition,
    isOilSpill = false,
    isObstacle = false
  ): void {
    if (!this.isRoundRunning || !this.assets.ecoVilla) return;

    let textures: Texture[];
    if (isObstacle) {
      textures = [this.assets.ecoVilla.obstacleLog];
    } else if (isOilSpill) {
      textures = this.assets.ecoVilla.oilSpills;
    } else {
      textures = this.assets.ecoVilla.wastes[type];
    }

    const waste = new Waste({
      id: `w-${this.spawnedItemCount}`,
      type,
      textures,
      x: pos.x,
      y: pos.y,
      fallSpeed: this.currentDifficulty.fallSpeed,
      horizontal: true,
      isOilSpill,
      isObstacle,
    });

    this.spawnedItemCount += 1;
    this.wastes.push(waste);
    this.worldRoot.addChild(waste);
  }

  private spawnPowerUp(type: PowerUpId, pos: SpawnPosition): void {
    if (!this.isRoundRunning) return;

    const powerUp = new PowerUp({
      id: `p-${this.spawnedItemCount}`,
      type,
      textures: this.assets.powerUps[type],
      x: pos.x,
      y: pos.y,
      fallSpeed: this.currentDifficulty.fallSpeed,
      horizontal: true,
    });

    this.spawnedItemCount += 1;
    this.powerUps.push(powerUp);
    this.worldRoot.addChild(powerUp);
  }

  private pickRandomWasteType(): WasteTypeId {
    return WASTE_IDS[Math.floor(Math.random() * WASTE_IDS.length)];
  }

  private pickRandomPowerUpType(): PowerUpId {
    return POWER_UP_IDS[Math.floor(Math.random() * POWER_UP_IDS.length)];
  }

  private updateParallax(deltaMs: number): void {
    const deltaSec = deltaMs / 1000;

    this.parallaxLayers.forEach((layer) => {
      const movement = layer.speed * deltaSec;

      layer.spriteA.x -= movement;
      layer.spriteB.x -= movement;

      if (layer.spriteA.x + layer.width <= 0) {
        layer.spriteA.x = layer.spriteB.x + layer.width - 1;
      }

      if (layer.spriteB.x + layer.width <= 0) {
        layer.spriteB.x = layer.spriteA.x + layer.width - 1;
      }
    });
  }

  private computeMoveDirectionX(deltaMs: number): number {
    if (this.touchDirectionMs > 0) {
      this.touchDirectionMs = Math.max(0, this.touchDirectionMs - deltaMs);
    }

    const keyboardDirection =
      Number(this.keyboardRightPressed) - Number(this.keyboardLeftPressed);
    
    if (this.touchTrackingActive && this.touchDirectionX !== 0) {
      return this.touchDirectionX;
    }

    return keyboardDirection;
  }

  private computeMoveDirectionY(deltaMs: number): number {
    const keyboardDirection =
      Number(this.keyboardDownPressed) - Number(this.keyboardUpPressed);

    if (this.touchTrackingActive && this.touchDirectionY !== 0) {
      return this.touchDirectionY;
    }

    return keyboardDirection;
  }

  private updateScreenShake(deltaMs: number): void {
    if (this.shakeRemainingMs <= 0) {
      this.root.position.set(0, 0);
      return;
    }

    this.shakeRemainingMs = Math.max(0, this.shakeRemainingMs - deltaMs);

    const intensity = this.shakeRemainingMs / 220;
    const magnitude = this.shakeMagnitude * intensity;

    this.root.x = (Math.random() * 2 - 1) * magnitude;
    this.root.y = (Math.random() * 2 - 1) * magnitude * 0.55;

    if (this.shakeRemainingMs === 0) {
      this.root.position.set(0, 0);
    }
  }

  private triggerErrorFeedback(): void {
    this.shakeRemainingMs = 220;
    this.shakeMagnitude = 8;

    this.errorPulseRemainingMs = 420;
    this.errorIcon.visible = true;
    this.errorIcon.alpha = 1;
    this.errorIcon.scale.set(0.25);
    this.errorIcon.position.set(this.collector.x, this.collector.y - 90);
  }

  private updateErrorIcon(deltaMs: number): void {
    if (this.errorPulseRemainingMs <= 0) {
      this.errorIcon.visible = false;
      return;
    }

    this.errorPulseRemainingMs = Math.max(0, this.errorPulseRemainingMs - deltaMs);

    const progress = 1 - this.errorPulseRemainingMs / 420;
    const scale = 0.25 + progress * 0.7;

    this.errorIcon.visible = true;
    this.errorIcon.alpha = 1 - progress;
    this.errorIcon.scale.set(scale);
    this.errorIcon.x = this.collector.x;
    this.errorIcon.y = this.collector.y - 90 - progress * 18;

    if (this.errorPulseRemainingMs === 0) {
      this.errorIcon.visible = false;
    }
  }

  private resolveTypeColor(type: WasteTypeId): string {
    switch (type) {
      case "plastic": return "#facc15";
      case "paper": return "#3b82f6";
      case "glass": return "#22c55e";
      case "organic": return "#a16207";
      default: return "#ffffff";
    }
  }

  private applySpeedMultiplier(snapshot: GameStateSnapshot): void {
    let speedMultiplier = 1;

    // Aceleración por rayo
    if (snapshot.powerUps.some((p) => p.id === "lightning")) {
      speedMultiplier = POWER_UP_SPEED_MULTIPLIER;
    }

    // Ralentización por aceite
    if (this.oilSlowDurationRemainingMs > 0) {
      speedMultiplier *= 0.4;
    }

    this.collector.setSpeedMultiplier(speedMultiplier);
  }

  private resolveDriftSpeed(snapshot: GameStateSnapshot): number {
    const slowActive = snapshot.powerUps.some((p) => p.id === "hourglass");
    const multiplier = slowActive ? POWER_UP_SLOW_MULTIPLIER : 1;
    return this.currentDifficulty.fallSpeed * multiplier;
  }

  private syncToState(snapshot: GameStateSnapshot): void {
    if (snapshot.phase === "playing" && !this.isRoundRunning) {
      this.startRound();
      return;
    }

    if (snapshot.phase !== "playing" && this.isRoundRunning) {
      this.stopRound();
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const { code, key } = event;

    if (code === "ArrowLeft" || key.toLowerCase() === "a") {
      this.keyboardLeftPressed = true;
      event.preventDefault();
      return;
    }

    if (code === "ArrowRight" || key.toLowerCase() === "d") {
      this.keyboardRightPressed = true;
      event.preventDefault();
      return;
    }

    if (code === "ArrowUp" || key.toLowerCase() === "w") {
      this.keyboardUpPressed = true;
      event.preventDefault();
      return;
    }

    if (code === "ArrowDown" || key.toLowerCase() === "s") {
      this.keyboardDownPressed = true;
      event.preventDefault();
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const { code, key } = event;

    if (code === "ArrowLeft" || key.toLowerCase() === "a") {
      this.keyboardLeftPressed = false;
      event.preventDefault();
      return;
    }

    if (code === "ArrowRight" || key.toLowerCase() === "d") {
      this.keyboardRightPressed = false;
      event.preventDefault();
      return;
    }

    if (code === "ArrowUp" || key.toLowerCase() === "w") {
      this.keyboardUpPressed = false;
      event.preventDefault();
      return;
    }

    if (code === "ArrowDown" || key.toLowerCase() === "s") {
      this.keyboardDownPressed = false;
      event.preventDefault();
    }
  }

  private handlePointerDown(event: PointerEvent): void {
    this.touchTrackingActive = true;
    this.touchLastX = event.clientX;
    this.touchLastY = event.clientY;
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.touchTrackingActive) return;

    const deltaX = event.clientX - this.touchLastX;
    const deltaY = event.clientY - this.touchLastY;

    if (Math.abs(deltaX) >= 6) {
      this.touchDirectionX = deltaX > 0 ? 1 : -1;
      this.touchDirectionMs = 120;
      this.touchLastX = event.clientX;
    } else {
      this.touchDirectionX = 0;
    }

    if (Math.abs(deltaY) >= 6) {
      this.touchDirectionY = deltaY > 0 ? 1 : -1;
      this.touchDirectionMs = 120;
      this.touchLastY = event.clientY;
    } else {
      this.touchDirectionY = 0;
    }
  }

  private handlePointerUp(): void {
    this.touchTrackingActive = false;
    this.touchDirectionX = 0;
    this.touchDirectionY = 0;
    this.touchDirectionMs = 0;
  }
}
