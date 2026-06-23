import { Assets, Texture } from "pixi.js";
import type { StaticImageData } from "next/image";
import fondoPruebaImage from "@/assets/images/FondoPrueba.jpg";
import heroImage from "@/assets/images/Hero.jpg";
import datosImage from "@/assets/images/Datos.jpg";
import sprOrganicoBananaImage from "@/assets/sprites/spr_organico_banana.png";
import sprOrganicoHuevoImage from "@/assets/sprites/spr_organico_huevo.png";
import sprOrganicoManzanaImage from "@/assets/sprites/spr_organico_manzana.png";
import sprPapelBolsaImage from "@/assets/sprites/spr_papel_bolsa.png";
import sprPapelCajaImage from "@/assets/sprites/spr_papel_caja.png";
import sprPapelDiarioImage from "@/assets/sprites/spr_papel_diario.png";
import sprPlasticoBotellaImage from "@/assets/sprites/spr_plastico_botella.png";
import sprPlasticoDetergenteImage from "@/assets/sprites/spr_plastico_detergente.png";
import sprPlasticoVasoImage from "@/assets/sprites/spr_plastico_vaso.png";
import sprTachoOrganicoImage from "@/assets/sprites/spr_tacho_organico.png";
import sprTachoPapelImage from "@/assets/sprites/spr_tacho_papel.png";
import sprTachoPlasticoImage from "@/assets/sprites/spr_tacho_plastico.png";
import sprTachoVidrioImage from "@/assets/sprites/spr_tacho_vidrio.png";
import sprVidrioBotellaImage from "@/assets/sprites/spr_vidrio_botella.png";
import sprVidrioFrascoImage from "@/assets/sprites/spr_vidrio_frasco.png";
import sprVidrioTarroImage from "@/assets/sprites/spr_vidrio_tarro.png";

// Eco-Villa images
import fondoEcoVillaImage from "@/assets/images/eco-villa/Fondo eco-villa.jpg";
import matiEcoVillaImage from "@/assets/images/eco-villa/Mati eco-villa.png";
import residuosVilla1Image from "@/assets/images/eco-villa/Residuos-villa1.png";
import residuosVilla2Image from "@/assets/images/eco-villa/Residuos-villa2.png";
import residuosVilla3Image from "@/assets/images/eco-villa/Residuos-villa3.png";
import residuosVilla4Image from "@/assets/images/eco-villa/Residuos-villa4.png";
import aceiteEcoVilla1Image from "@/assets/images/eco-villa/aceite eco-villa1.png";
import aceiteEcoVilla2Image from "@/assets/images/eco-villa/aceite eco-villa2.png";
import aceiteEcoVilla3Image from "@/assets/images/eco-villa/aceite eco-villa3.png";
import fondo2EcoVillaImage from "@/assets/images/eco-villa/fondo 2 eco-villa.png";

import { WASTE_IDS, getWasteType, type WasteTypeId } from "@/game/config/wasteTypes";
import {
  POWER_UP_IDS,
  getPowerUpDefinition,
  type PowerUpDefinition,
  type PowerUpId,
} from "@/game/config/powerUps";

const ASSET_KEYS = {
  backgroundFar: "game-bg-far",
  backgroundMid: "game-bg-mid",
  backgroundNear: "game-bg-near",
  errorIcon: "game-error-icon",
  particle: "game-particle-dot",
} as const;

const POWER_UP_ASSET_KEYS: Record<PowerUpId, string> = {
  hourglass: "game-powerup-hourglass",
  shield: "game-powerup-shield",
  lightning: "game-powerup-lightning",
};

type AssetKey = (typeof ASSET_KEYS)[keyof typeof ASSET_KEYS];

export interface LoadedGameAssets {
  backgrounds: {
    far: Texture;
    mid: Texture;
    near: Texture;
  };
  collectors: Record<WasteTypeId, Texture>;
  errorIcon: Texture;
  particle: Texture;
  wastes: Record<WasteTypeId, Texture[]>;
  powerUps: Record<PowerUpId, Texture[]>;
  ecoVilla?: {
    backgroundFar: Texture;
    backgroundNear: Texture;
    collector: Texture;
    wastes: Record<WasteTypeId, Texture[]>;
    oilSpills: Texture[];
    birdRescue: Texture;
    obstacleLog: Texture;
  };
}

const WASTE_SPRITE_SOURCES: Record<WasteTypeId, StaticImageData[]> = {
  plastic: [sprPlasticoBotellaImage, sprPlasticoDetergenteImage, sprPlasticoVasoImage],
  paper: [sprPapelBolsaImage, sprPapelCajaImage, sprPapelDiarioImage],
  glass: [sprVidrioBotellaImage, sprVidrioFrascoImage, sprVidrioTarroImage],
  organic: [sprOrganicoBananaImage, sprOrganicoHuevoImage, sprOrganicoManzanaImage],
};

const COLLECTOR_SPRITE_SOURCES: Record<WasteTypeId, StaticImageData> = {
  plastic: sprTachoPlasticoImage,
  paper: sprTachoPapelImage,
  glass: sprTachoVidrioImage,
  organic: sprTachoOrganicoImage,
};

let assetCachePromise: Promise<LoadedGameAssets> | null = null;

function resolveImageSource(image: string | StaticImageData): string {
  return typeof image === "string" ? image : image.src;
}

function asHex(colorNumber: number): string {
  return `#${colorNumber.toString(16).padStart(6, "0")}`;
}

function svgToDataUri(svgMarkup: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
}

function createWasteSvg(fillHex: string, label: string): string {
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <defs>
        <linearGradient id="w" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.45"/>
          <stop offset="1" stop-color="#000000" stop-opacity="0.2"/>
        </linearGradient>
      </defs>
      <g>
        <rect x="10" y="10" width="76" height="76" rx="18" fill="${fillHex}"/>
        <rect x="10" y="10" width="76" height="76" rx="18" fill="url(#w)"/>
        <circle cx="30" cy="30" r="8" fill="#ffffff" fill-opacity="0.28"/>
        <text x="48" y="56" text-anchor="middle" font-family="Trebuchet MS, Verdana, sans-serif" font-size="18" font-weight="700" fill="#0b1f17">${label}</text>
      </g>
    </svg>
  `);
}

function createPowerUpSvg(definition: PowerUpDefinition): string {
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24">
      <defs>
        <radialGradient id="p" cx="0.3" cy="0.3" r="0.9">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/>
          <stop offset="1" stop-color="#000000" stop-opacity="0.12"/>
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="${definition.colorHex}" stroke="#ffffff" stroke-width="1.4"/>
      <circle cx="12" cy="12" r="10" fill="url(#p)"/>
      <path d="${definition.iconPath}" fill="#ffffff" stroke="#0f172a" stroke-width="0.4"/>
    </svg>
  `);
}

function createCollectorSvg(): string {
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="160" viewBox="0 0 256 160">
      <defs>
        <linearGradient id="bin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ecfdf5"/>
          <stop offset="1" stop-color="#10b981"/>
        </linearGradient>
      </defs>
      <ellipse cx="128" cy="140" rx="92" ry="16" fill="#064e3b" fill-opacity="0.24"/>
      <path d="M48 54h160l-15 84c-2 11-12 19-24 19H87c-12 0-22-8-24-19L48 54z" fill="url(#bin)" stroke="#065f46" stroke-width="6"/>
      <rect x="38" y="36" width="180" height="24" rx="12" fill="#a7f3d0" stroke="#047857" stroke-width="6"/>
      <rect x="108" y="16" width="40" height="20" rx="8" fill="#059669"/>
      <circle cx="82" cy="102" r="8" fill="#047857" fill-opacity="0.7"/>
      <circle cx="174" cy="102" r="8" fill="#047857" fill-opacity="0.7"/>
    </svg>
  `);
}

function createErrorIconSvg(): string {
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="30" fill="#fee2e2" stroke="#dc2626" stroke-width="4"/>
      <path d="M22 22l20 20M42 22L22 42" stroke="#dc2626" stroke-width="6" stroke-linecap="round"/>
    </svg>
  `);
}

function createParticleSvg(): string {
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" fill="#ffffff"/>
    </svg>
  `);
}

function createBirdRescueSvg(): string {
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r="40" fill="#a7f3d0" stroke="#059669" stroke-width="4"/>
      <text x="48" y="62" text-anchor="middle" font-size="48">🕊️</text>
    </svg>
  `);
}

function createObstacleLogSvg(): string {
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r="40" fill="#fed7aa" stroke="#c2410c" stroke-width="4"/>
      <text x="48" y="64" text-anchor="middle" font-size="48">🪵</text>
    </svg>
  `);
}

function registerAsset(alias: string, src: string): void {
  try {
    Assets.add({ alias, src });
  } catch {
    // The alias may already be registered during hot reload.
  }
}

function getTexture(alias: AssetKey | string): Texture {
  return Assets.get(alias) as Texture;
}

async function loadWasteVariantTexture(
  wasteId: WasteTypeId,
  variantSource: StaticImageData,
  variantIndex: number,
): Promise<Texture> {
  try {
    return (await Assets.load(resolveImageSource(variantSource))) as Texture;
  } catch (error) {
    const waste = getWasteType(wasteId);

    console.warn(
      `[EcoURP] No se pudo cargar sprite ${wasteId} v${variantIndex + 1}. Usando fallback SVG.`,
      error,
    );

    return Texture.from(createWasteSvg(asHex(waste.colorNumber), waste.shortLabel));
  }
}

async function loadCollectorTexture(wasteId: WasteTypeId, source: StaticImageData): Promise<Texture> {
  try {
    return (await Assets.load(resolveImageSource(source))) as Texture;
  } catch (error) {
    console.warn(`[EcoURP] No se pudo cargar tacho ${wasteId}. Usando fallback SVG.`, error);
    return Texture.from(createCollectorSvg());
  }
}

export async function preloadGameAssets(): Promise<LoadedGameAssets> {
  if (assetCachePromise) {
    return assetCachePromise;
  }

  assetCachePromise = (async () => {
    const ecoVillaKeys = {
      bgFar: "ev-bg-far",
      bgNear: "ev-bg-near",
      collector: "ev-collector",
      residuo1: "ev-res-1",
      residuo2: "ev-res-2",
      residuo3: "ev-res-3",
      residuo4: "ev-res-4",
      aceite1: "ev-oil-1",
      aceite2: "ev-oil-2",
      aceite3: "ev-oil-3",
    } as const;

    const birdRescueSvg = createBirdRescueSvg();
    const obstacleLogSvg = createObstacleLogSvg();

    registerAsset(ASSET_KEYS.backgroundFar, resolveImageSource(datosImage));
    registerAsset(ASSET_KEYS.backgroundMid, resolveImageSource(heroImage));
    registerAsset(ASSET_KEYS.backgroundNear, resolveImageSource(fondoPruebaImage));
    registerAsset(ASSET_KEYS.errorIcon, createErrorIconSvg());
    registerAsset(ASSET_KEYS.particle, createParticleSvg());

    // Register Eco-Villa specific assets
    registerAsset(ecoVillaKeys.bgFar, resolveImageSource(fondoEcoVillaImage));
    registerAsset(ecoVillaKeys.bgNear, resolveImageSource(fondo2EcoVillaImage));
    registerAsset(ecoVillaKeys.collector, resolveImageSource(matiEcoVillaImage));
    registerAsset(ecoVillaKeys.residuo1, resolveImageSource(residuosVilla1Image));
    registerAsset(ecoVillaKeys.residuo2, resolveImageSource(residuosVilla2Image));
    registerAsset(ecoVillaKeys.residuo3, resolveImageSource(residuosVilla3Image));
    registerAsset(ecoVillaKeys.residuo4, resolveImageSource(residuosVilla4Image));
    registerAsset(ecoVillaKeys.aceite1, resolveImageSource(aceiteEcoVilla1Image));
    registerAsset(ecoVillaKeys.aceite2, resolveImageSource(aceiteEcoVilla2Image));
    registerAsset(ecoVillaKeys.aceite3, resolveImageSource(aceiteEcoVilla3Image));
    registerAsset("ev-bird-rescue", birdRescueSvg);
    registerAsset("ev-obstacle-log", obstacleLogSvg);

    for (const powerUpId of POWER_UP_IDS) {
      const definition = getPowerUpDefinition(powerUpId);
      registerAsset(POWER_UP_ASSET_KEYS[powerUpId], createPowerUpSvg(definition));
    }

    await Assets.load([
      ASSET_KEYS.backgroundFar,
      ASSET_KEYS.backgroundMid,
      ASSET_KEYS.backgroundNear,
      ASSET_KEYS.errorIcon,
      ASSET_KEYS.particle,
      ...Object.values(POWER_UP_ASSET_KEYS),
      ...Object.values(ecoVillaKeys),
      "ev-bird-rescue",
      "ev-obstacle-log",
    ]);

    const wasteTextures = {} as Record<WasteTypeId, Texture[]>;
    for (const wasteId of WASTE_IDS) {
      const variants = await Promise.all(
        WASTE_SPRITE_SOURCES[wasteId].map((source, index) =>
          loadWasteVariantTexture(wasteId, source, index),
        ),
      );

      if (variants.length === 0) {
        const waste = getWasteType(wasteId);
        variants.push(Texture.from(createWasteSvg(asHex(waste.colorNumber), waste.shortLabel)));
      }

      wasteTextures[wasteId] = variants;
    }

    const collectorTextures = {} as Record<WasteTypeId, Texture>;
    for (const wasteId of WASTE_IDS) {
      collectorTextures[wasteId] = await loadCollectorTexture(wasteId, COLLECTOR_SPRITE_SOURCES[wasteId]);
    }

    const powerUpTextures = {} as Record<PowerUpId, Texture[]>;
    for (const powerUpId of POWER_UP_IDS) {
      powerUpTextures[powerUpId] = [getTexture(POWER_UP_ASSET_KEYS[powerUpId])];
    }

    return {
      backgrounds: {
        far: getTexture(ASSET_KEYS.backgroundFar),
        mid: getTexture(ASSET_KEYS.backgroundMid),
        near: getTexture(ASSET_KEYS.backgroundNear),
      },
      collectors: collectorTextures,
      errorIcon: getTexture(ASSET_KEYS.errorIcon),
      particle: getTexture(ASSET_KEYS.particle),
      wastes: wasteTextures,
      powerUps: powerUpTextures,
      ecoVilla: {
        backgroundFar: getTexture(ecoVillaKeys.bgFar),
        backgroundNear: getTexture(ecoVillaKeys.bgNear),
        collector: getTexture(ecoVillaKeys.collector),
        wastes: {
          plastic: [getTexture(ecoVillaKeys.residuo1)],
          paper: [getTexture(ecoVillaKeys.residuo2)],
          glass: [getTexture(ecoVillaKeys.residuo3)],
          organic: [getTexture(ecoVillaKeys.residuo4)],
        },
        oilSpills: [
          getTexture(ecoVillaKeys.aceite1),
          getTexture(ecoVillaKeys.aceite2),
          getTexture(ecoVillaKeys.aceite3),
        ],
        birdRescue: getTexture("ev-bird-rescue"),
        obstacleLog: getTexture("ev-obstacle-log"),
      },
    };
  })();

  return assetCachePromise;
}

export function clearAssetCache(): void {
  assetCachePromise = null;
}
