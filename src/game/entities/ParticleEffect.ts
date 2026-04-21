import { Container, Sprite, type Texture } from "pixi.js";

interface BurstParticle {
  sprite: Sprite;
  velocityX: number;
  velocityY: number;
  gravity: number;
  drag: number;
  elapsedSec: number;
  lifeSec: number;
  spinSpeed: number;
  startScale: number;
  endScale: number;
}

function normalizeColor(colorHex: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(colorHex)) {
    return colorHex;
  }

  if (/^[0-9a-fA-F]{6}$/.test(colorHex)) {
    return `#${colorHex}`;
  }

  return "#ffffff";
}

function toColorNumber(colorHex: string): number {
  const normalized = normalizeColor(colorHex).replace("#", "");
  return Number.parseInt(normalized, 16);
}

/**
 * Gestor de bursts de particulas para feedback de acierto.
 */
export class ParticleEffect {
  private readonly parentContainer: Container;
  private readonly particleTexture: Texture;
  private readonly particles: BurstParticle[] = [];

  public constructor(parentContainer: Container, particleTexture: Texture) {
    this.parentContainer = parentContainer;
    this.particleTexture = particleTexture;
  }

  public emitSuccessBurst(x: number, y: number, colorHex: string, particlesPerWave = 18): void {
    const totalParticles = Math.max(8, particlesPerWave);
    const tintColor = toColorNumber(colorHex);

    for (let index = 0; index < totalParticles; index += 1) {
      const sprite = new Sprite(this.particleTexture);
      sprite.anchor.set(0.5);
      sprite.position.set(x, y);
      sprite.tint = tintColor;
      sprite.alpha = 0.95;

      const startScale = 0.14 + Math.random() * 0.34;
      const endScale = 0.04 + Math.random() * 0.08;
      sprite.scale.set(startScale);

      const angle = (Math.PI * 2 * index) / totalParticles + (Math.random() - 0.5) * 0.5;
      const speed = 120 + Math.random() * 260;

      this.parentContainer.addChild(sprite);

      this.particles.push({
        sprite,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed - (30 + Math.random() * 90),
        gravity: 420 + Math.random() * 140,
        drag: 0.9 + Math.random() * 0.08,
        elapsedSec: 0,
        lifeSec: 0.35 + Math.random() * 0.32,
        spinSpeed: (Math.random() - 0.5) * 15,
        startScale,
        endScale,
      });
    }
  }

  public update(deltaMs: number): void {
    const deltaSec = Math.max(0.001, deltaMs / 1000);

    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];

      particle.elapsedSec += deltaSec;

      const lifeProgress = Math.min(1, particle.elapsedSec / particle.lifeSec);
      const easedLife = 1 - lifeProgress;

      particle.velocityX *= particle.drag;
      particle.velocityY += particle.gravity * deltaSec;

      particle.sprite.x += particle.velocityX * deltaSec;
      particle.sprite.y += particle.velocityY * deltaSec;
      particle.sprite.rotation += particle.spinSpeed * deltaSec;
      particle.sprite.alpha = easedLife;

      const nextScale = particle.endScale + (particle.startScale - particle.endScale) * easedLife;
      particle.sprite.scale.set(Math.max(0.02, nextScale));

      if (lifeProgress >= 1) {
        particle.sprite.destroy();
        this.particles.splice(index, 1);
      }
    }
  }

  public destroy(): void {
    for (const particle of this.particles) {
      particle.sprite.destroy();
    }

    this.particles.length = 0;
  }
}
