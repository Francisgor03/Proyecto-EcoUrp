import { Application, Container, Sprite } from "pixi.js";
import { buildWrongBinFeedback, WASTE_IDS, type WasteTypeId } from "@/game/config/wasteTypes";
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
import { playSfx } from "@/game/utils/sfx";
import type { BaseEngine, GameStateBridge, GameStateSnapshot } from "./BaseEngine";

interface ParallaxLayer {
  spriteA: Sprite;
  spriteB: Sprite;
  speed: number;
  width: number;
}

const COLLECTOR_BOTTOM_OFFSET = 152;
const MAX_PLAY_WIDTH = 900;
const PLAY_PADDING = 52;

/**
 * Motor principal del juego Eco-Catch (caída vertical) con render Pixi.
 */
export class GameEngine implements BaseEngine {
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
  private shouldPauseAfterError = false;
  private tutorialSpawnsBlocked = false;

  private isRoundRunning = false;
  private spawnedItemCount = 0;

  private width: number;
  private height: number;

  private shakeRemainingMs = 0;
  private shakeMagnitude = 0;

  private errorPulseRemainingMs = 0;

  private keyboardLeftPressed = false;
  private keyboardRightPressed = false;

  private touchTrackingActive = false;
  private touchLastX = 0;
  private touchDirection = 0;
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

    this.collector = new Collector({
      textures: this.assets.collectors,
      startX: this.width / 2,
      y: this.getCollectorY(),
      minX: playBounds.minX,
      maxX: playBounds.maxX,
      moveSpeed: 360,
      selectedType: initialState.selectedType,
      baseScale: this.resolveCollectorScale(),
      horizontal: false,
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
      horizontal: false,
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
    const blockSpawns = snapshot.tutorial?.blockSpawns ?? false;

    this.isRoundRunning = true;
    this.spawnedItemCount = 0;

    this.difficultyManager.setMode(snapshot.mode);
    this.currentDifficulty = this.difficultyManager.getCurrent(snapshot.durationMs, snapshot.correct);

    this.clearWastes();
    this.clearPowerUps();

    this.collector.x = this.width / 2;
    this.collector.y = this.getCollectorY();
    this.collector.setMoveDirection(0);
    this.collector.applySelectedType(snapshot.selectedType);
    this.collector.setSpeedMultiplier(1);

    this.spawnSystem.setBounds(
      this.getPlayBounds().minX,
      this.getPlayBounds().maxX,
    );

    this.spawnSystem.setPaused(blockSpawns);
    this.spawnSystem.reset();
    if (!blockSpawns) {
      this.spawnSystem.forceSpawn();
    }

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
    this.touchDirection = 0;
    this.touchDirectionMs = 0;

    this.clearWastes();
    this.clearPowerUps();
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;

    const playBounds = this.getPlayBounds();

    this.spawnSystem.setBounds(
      playBounds.minX,
      playBounds.maxX,
    );
    this.collector.setBounds(
      playBounds.minX,
      playBounds.maxX,
    );
    this.collector.setBaseScale(this.resolveCollectorScale());
    this.collector.y = this.getCollectorY();

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
    const layersConfig = [
      { texture: this.assets.backgrounds.far, speed: 8, alpha: 0.28, tint: 0x9ca3af },
      { texture: this.assets.backgrounds.mid, speed: 16, alpha: 0.36, tint: 0x93c5fd },
      { texture: this.assets.backgrounds.near, speed: 28, alpha: 0.5, tint: 0xffffff },
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

    const blockSpawns = tickedState.tutorial?.blockSpawns ?? false;
    if (blockSpawns !== this.tutorialSpawnsBlocked) {
      this.tutorialSpawnsBlocked = blockSpawns;
      if (blockSpawns) {
        this.clearWastes();
        this.clearPowerUps();
        this.spawnSystem.setPaused(true);
      }
    }

    if (tickedState.manualPaused) {
      this.spawnSystem.setPaused(true);
      this.collector.setMoveDirection(0);
      return;
    }

    this.updateParallax(deltaMs);

    this.difficultyManager.setMode(tickedState.mode);
    this.currentDifficulty = this.difficultyManager.getCurrent(tickedState.durationMs, tickedState.correct);

    this.collector.applySelectedType(tickedState.selectedType);
    this.applyPowerUpEffects(tickedState);

    if (tickedState.wrongPauseMs > 0) {
      this.spawnSystem.setPaused(true);
      this.collector.setMoveDirection(0);
      this.collector.update(deltaMs);
      this.particleEffect.update(deltaMs);
      this.updateScreenShake(deltaMs);
      this.updateErrorIcon(deltaMs);
      return;
    }

    if (!blockSpawns) {
      this.spawnSystem.setPaused(false);
    }
    this.shouldPauseAfterError = false;

    const moveDirection = this.computeMoveDirection(deltaMs);
    this.collector.setMoveDirection(moveDirection);
    this.collector.update(deltaMs);

    if (!blockSpawns) {
      this.spawnSystem.update(deltaMs);
    }
    const fallSpeed = this.resolveFallSpeed(tickedState);

    for (let index = this.wastes.length - 1; index >= 0; index -= 1) {
      const waste = this.wastes[index];
      waste.setFallSpeed(fallSpeed);
      waste.update(deltaMs);

      if (CollisionSystem.isCollectorTouchingWaste(this.collector, waste)) {
        this.resolveCollectorCollision(index, waste, tickedState.selectedType);

        if (!this.isRoundRunning) {
          return;
        }

        if (this.shouldPauseAfterError) {
          this.spawnSystem.setPaused(true);
          this.collector.setMoveDirection(0);
          this.collector.update(deltaMs);
          this.particleEffect.update(deltaMs);
          this.updateScreenShake(deltaMs);
          this.updateErrorIcon(deltaMs);
          return;
        }

        continue;
      }

      if (CollisionSystem.isWasteOutOfBounds(waste, this.height + 20)) {
        this.resolveMissedWaste(index, waste);

        if (!this.isRoundRunning) {
          return;
        }
      }
    }

    for (let index = this.powerUps.length - 1; index >= 0; index -= 1) {
      const powerUp = this.powerUps[index];
      powerUp.setFallSpeed(fallSpeed);
      powerUp.update(deltaMs);

      if (CollisionSystem.isCollectorTouchingPowerUp(this.collector, powerUp)) {
        this.resolvePowerUpCollision(index, powerUp);

        if (!this.isRoundRunning) {
          return;
        }

        continue;
      }

      if (CollisionSystem.isPowerUpOutOfBounds(powerUp, this.height + 20)) {
        this.resolveMissedPowerUp(index, powerUp);

        if (!this.isRoundRunning) {
          return;
        }
      }
    }

    this.particleEffect.update(deltaMs);
    this.updateScreenShake(deltaMs);
    this.updateErrorIcon(deltaMs);
  }

  private resolveCollectorCollision(index: number, waste: Waste, selectedType: WasteTypeId): void {
    const hitX = waste.x;
    const hitY = waste.y;
    const wasteType = waste.type;

    this.removeWasteAt(index);

    if (wasteType === selectedType) {
      this.particleEffect.emitSuccessBurst(hitX, hitY, this.resolveTypeColor(wasteType));
      playSfx("recogida");
      const nextState = this.bridge.onCorrectCatch();

      if (nextState.phase !== "playing") {
        this.stopRound();
      }

      return;
    }

    const feedback = buildWrongBinFeedback(wasteType, selectedType);
    playSfx("error");
    const nextState = this.bridge.onWrongCatch(feedback);
    if (nextState.phase !== "playing") {
      this.stopRound();
      return;
    }

    const shouldPause = nextState.wrongPauseMs > 0;
    if (shouldPause) {
      this.triggerErrorFeedback();
    }

    this.shouldPauseAfterError = shouldPause;
  }

  private resolvePowerUpCollision(index: number, powerUp: PowerUp): void {
    this.removePowerUpAt(index);

    const nextState = this.bridge.onPowerUpCollected(powerUp.type);
    if (nextState.phase !== "playing") {
      this.stopRound();
    }
  }

  private resolveMissedWaste(index: number, _waste: Waste): void {
    this.removeWasteAt(index);

    playSfx("error");
    const nextState = this.bridge.onMissedWaste();
    if (nextState.phase !== "playing") {
      this.stopRound();
    }
  }

  private resolveMissedPowerUp(index: number, _powerUp: PowerUp): void {
    this.removePowerUpAt(index);
  }

  private removeWasteAt(index: number): void {
    const waste = this.wastes[index];
    if (!waste) {
      return;
    }

    this.wastes.splice(index, 1);
    waste.destroy({ children: true });
  }

  private removePowerUpAt(index: number): void {
    const powerUp = this.powerUps[index];
    if (!powerUp) {
      return;
    }

    this.powerUps.splice(index, 1);
    powerUp.destroy({ children: true });
  }

  private getCollectorY(): number {
    return Math.max(100, this.height - COLLECTOR_BOTTOM_OFFSET);
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

  private resolveCollectorScale(): number {
    if (this.width < 360) {
      return 0.66;
    }

    if (this.width < 420) {
      return 0.72;
    }

    if (this.width < 520) {
      return 0.82;
    }

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
    const isEasy = this.currentDifficulty.mode === "easy";
    const powerUpChance = isEasy ? 0.10 : 0.05;
    const shouldSpawnPowerUp = Math.random() < powerUpChance;

    if (shouldSpawnPowerUp) {
      this.spawnPowerUp(this.pickRandomPowerUpType(), pos);
      return;
    }

    this.spawnWaste(this.pickRandomWasteType(), pos);
  }

  private spawnWaste(type: WasteTypeId, pos: SpawnPosition): void {
    if (!this.isRoundRunning) {
      return;
    }

    const waste = new Waste({
      id: `w-${this.spawnedItemCount}`,
      type,
      textures: this.assets.wastes[type],
      x: pos.x,
      y: pos.y,
      fallSpeed: this.currentDifficulty.fallSpeed,
      horizontal: false,
    });

    this.spawnedItemCount += 1;

    this.wastes.push(waste);
    this.worldRoot.addChild(waste);
  }

  private spawnPowerUp(type: PowerUpId, pos: SpawnPosition): void {
    if (!this.isRoundRunning) {
      return;
    }

    const powerUp = new PowerUp({
      id: `p-${this.spawnedItemCount}`,
      type,
      textures: this.assets.powerUps[type],
      x: pos.x,
      y: pos.y,
      fallSpeed: this.currentDifficulty.fallSpeed,
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

  private computeMoveDirection(deltaMs: number): number {
    if (this.touchDirectionMs > 0) {
      this.touchDirectionMs = Math.max(0, this.touchDirectionMs - deltaMs);
      if (this.touchDirectionMs === 0) {
        this.touchDirection = 0;
      }
    }

    const keyboardDirection =
      Number(this.keyboardRightPressed) - Number(this.keyboardLeftPressed);
    const touchDirection = this.touchDirection;

    if (touchDirection !== 0) {
      return touchDirection;
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
      case "plastic":
        return "#facc15";
      case "paper":
        return "#3b82f6";
      case "glass":
        return "#22c55e";
      case "organic":
        return "#a16207";
      default:
        return "#ffffff";
    }
  }

  private applyPowerUpEffects(snapshot: GameStateSnapshot): void {
    if (snapshot.tutorial?.blockSpawns) {
      this.collector.setSpeedMultiplier(1);
      return;
    }

    const speedMultiplier = this.resolveCollectorSpeedMultiplier(snapshot);
    this.collector.setSpeedMultiplier(speedMultiplier);
  }

  private resolveFallSpeed(snapshot: GameStateSnapshot): number {
    if (snapshot.tutorial?.blockSpawns) {
      return this.currentDifficulty.fallSpeed;
    }

    const slowActive = this.isPowerUpActive(snapshot.powerUps, "hourglass");
    const multiplier = slowActive ? POWER_UP_SLOW_MULTIPLIER : 1;
    return this.currentDifficulty.fallSpeed * multiplier;
  }

  private resolveCollectorSpeedMultiplier(snapshot: GameStateSnapshot): number {
    return this.isPowerUpActive(snapshot.powerUps, "lightning")
      ? POWER_UP_SPEED_MULTIPLIER
      : 1;
  }

  private isPowerUpActive(powerUps: PowerUpStatus[], id: PowerUpId): boolean {
    return powerUps.some((powerUp) => powerUp.id === id);
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

    const normalizedType = this.resolveWasteFromKey(event);
    if (normalizedType) {
      const nextState = this.bridge.onSelectWasteType(normalizedType);
      this.collector.applySelectedType(nextState.selectedType);
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
    }
  }

  private resolveWasteFromKey(event: KeyboardEvent): WasteTypeId | null {
    const key = event.key;

    if (key === "1") return "plastic";
    if (key === "2") return "paper";
    if (key === "3") return "glass";
    if (key === "4") return "organic";

    if (event.code === "Numpad1") return "plastic";
    if (event.code === "Numpad2") return "paper";
    if (event.code === "Numpad3") return "glass";
    if (event.code === "Numpad4") return "organic";

    return null;
  }

  private handlePointerDown(event: PointerEvent): void {
    this.touchTrackingActive = true;
    this.touchLastX = event.clientX;
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.touchTrackingActive) {
      return;
    }

    const deltaX = event.clientX - this.touchLastX;
    if (Math.abs(deltaX) < 6) {
      return;
    }

    this.touchDirection = deltaX > 0 ? 1 : -1;
    this.touchDirectionMs = 120;
    this.touchLastX = event.clientX;
  }

  private handlePointerUp(): void {
    this.touchTrackingActive = false;
    this.touchDirection = 0;
    this.touchDirectionMs = 0;
  }
}
