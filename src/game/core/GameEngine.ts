import { Application, Container, Sprite } from "pixi.js";
import { buildWrongBinFeedback, type WasteTypeId } from "@/game/config/wasteTypes";
import { DifficultyManager, type DifficultySnapshot } from "@/game/core/DifficultyManager";
import { CollisionSystem } from "@/game/core/CollisionSystem";
import { SpawnSystem } from "@/game/core/SpawnSystem";
import { Collector } from "@/game/entities/Collector";
import { Waste } from "@/game/entities/Waste";
import { ParticleEffect } from "@/game/entities/ParticleEffect";
import type { LoadedGameAssets } from "@/game/utils/assetLoader";
import type { GameModeId } from "@/game/config/gameModes";

export type GamePhase = "menu" | "playing" | "game-over";
export type GameOverReason = "time" | "lives" | "manual";

export interface GameSummary {
  mode: GameModeId;
  score: number;
  accuracy: number;
  durationMs: number;
  correct: number;
  wrong: number;
  missed: number;
  bestStreak: number;
  reason: GameOverReason;
}

export interface GameStateSnapshot {
  phase: GamePhase;
  mode: GameModeId;
  selectedType: WasteTypeId;
  score: number;
  lives: number | null;
  timerMs: number | null;
  durationMs: number;
  wrongPauseMs: number;
  summary: GameSummary | null;
}

export interface GameStateBridge {
  getState: () => GameStateSnapshot;
  onFrameTick: (deltaMs: number) => GameStateSnapshot;
  onSelectWasteType: (type: WasteTypeId) => GameStateSnapshot;
  onCorrectCatch: () => GameStateSnapshot;
  onWrongCatch: (feedback: ReturnType<typeof buildWrongBinFeedback>) => GameStateSnapshot;
  onMissedWaste: () => GameStateSnapshot;
  onForceGameOver: (reason: GameOverReason) => GameStateSnapshot;
}

export interface GameEngineOptions {
  app: Application;
  assets: LoadedGameAssets;
  bridge: GameStateBridge;
}

interface ParallaxLayer {
  spriteA: Sprite;
  spriteB: Sprite;
  speed: number;
  width: number;
}

const COLLECTOR_BOTTOM_OFFSET = 152;

/**
 * Motor principal del juego Eco-Catch con render Pixi.
 */
export class GameEngine {
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

  private readonly difficultyManager: DifficultyManager;
  private currentDifficulty: DifficultySnapshot;
  private readonly spawnSystem: SpawnSystem;
  private shouldPauseAfterError = false;

  private isRoundRunning = false;
  private spawnedWasteCount = 0;

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

  public constructor(options: GameEngineOptions) {
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

    this.collector = new Collector({
      texture: this.assets.collector,
      startX: this.width / 2,
      y: this.getCollectorY(),
      minX: 56,
      maxX: this.width - 56,
      moveSpeed: 360,
      selectedType: initialState.selectedType,
    });

    this.errorIcon = new Sprite(this.assets.errorIcon);
    this.errorIcon.anchor.set(0.5);
    this.errorIcon.visible = false;
    this.errorIcon.alpha = 0;
    this.errorIcon.scale.set(0.42);

    this.worldRoot.addChild(this.collector, this.errorIcon);

    this.particleEffect = new ParticleEffect(this.effectRoot, this.assets.particle);

    this.spawnSystem = new SpawnSystem({
      width: this.width,
      paddingX: 52,
      getCurrentSpawnMs: () => this.currentDifficulty.spawnMs,
      onSpawn: (type, x) => this.spawnWaste(type, x),
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
    this.spawnedWasteCount = 0;

    this.difficultyManager.setMode(snapshot.mode);
    this.currentDifficulty = this.difficultyManager.getCurrent(snapshot.durationMs, snapshot.score);

    this.clearWastes();

    this.collector.x = this.width / 2;
    this.collector.y = this.getCollectorY();
    this.collector.setMoveDirection(0);
    this.collector.applySelectedType(snapshot.selectedType);

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
    this.touchDirection = 0;
    this.touchDirectionMs = 0;

    this.clearWastes();
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;

    this.spawnSystem.setWidth(width);
    this.collector.setBounds(56, this.width - 56);
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
    this.updateParallax(deltaMs);

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

    this.difficultyManager.setMode(tickedState.mode);
    this.currentDifficulty = this.difficultyManager.getCurrent(tickedState.durationMs, tickedState.score);

    this.collector.applySelectedType(tickedState.selectedType);

    if (tickedState.wrongPauseMs > 0) {
      this.spawnSystem.setPaused(true);
      this.collector.setMoveDirection(0);
      this.collector.update(deltaMs);
      this.particleEffect.update(deltaMs);
      this.updateScreenShake(deltaMs);
      this.updateErrorIcon(deltaMs);
      return;
    }

    this.spawnSystem.setPaused(false);
    this.shouldPauseAfterError = false;

    const moveDirection = this.computeMoveDirection(deltaMs);
    this.collector.setMoveDirection(moveDirection);
    this.collector.update(deltaMs);

    this.spawnSystem.update(deltaMs);

    for (let index = this.wastes.length - 1; index >= 0; index -= 1) {
      const waste = this.wastes[index];
      waste.setFallSpeed(this.currentDifficulty.fallSpeed);
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
      const nextState = this.bridge.onCorrectCatch();

      if (nextState.phase !== "playing") {
        this.stopRound();
      }

      return;
    }

    const feedback = buildWrongBinFeedback(wasteType, selectedType);
    this.triggerErrorFeedback();
    this.shouldPauseAfterError = true;

    const nextState = this.bridge.onWrongCatch(feedback);
    if (nextState.phase !== "playing") {
      this.stopRound();
    }
  }

  private resolveMissedWaste(index: number, _waste: Waste): void {
    this.removeWasteAt(index);

    const nextState = this.bridge.onMissedWaste();
    if (nextState.phase !== "playing") {
      this.stopRound();
    }
  }

  private removeWasteAt(index: number): void {
    const waste = this.wastes[index];
    if (!waste) {
      return;
    }

    this.wastes.splice(index, 1);
    waste.destroy({ children: true });
  }

  private getCollectorY(): number {
    return Math.max(100, this.height - COLLECTOR_BOTTOM_OFFSET);
  }

  private clearWastes(): void {
    while (this.wastes.length) {
      const waste = this.wastes.pop();
      waste?.destroy({ children: true });
    }
  }

  private spawnWaste(type: WasteTypeId, x: number): void {
    if (!this.isRoundRunning) {
      return;
    }

    const waste = new Waste({
      id: `w-${this.spawnedWasteCount}`,
      type,
      textures: this.assets.wastes[type],
      x,
      y: -36,
      fallSpeed: this.currentDifficulty.fallSpeed,
    });

    this.spawnedWasteCount += 1;

    this.wastes.push(waste);
    this.worldRoot.addChild(waste);
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

    const keyboardDirection = Number(this.keyboardRightPressed) - Number(this.keyboardLeftPressed);
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
