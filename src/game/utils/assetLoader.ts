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
import sprVidrioBotellaImage from "@/assets/sprites/spr_vidrio_botella.png";
import sprVidrioFrascoImage from "@/assets/sprites/spr_vidrio_frasco.png";
import sprVidrioTarroImage from "@/assets/sprites/spr_vidrio_tarro.png";
import { WASTE_IDS, getWasteType, type WasteTypeId } from "@/game/config/wasteTypes";

const ASSET_KEYS = {
  backgroundFar: "game-bg-far",
  backgroundMid: "game-bg-mid",
  backgroundNear: "game-bg-near",
  collector: "game-collector",
  errorIcon: "game-error-icon",
  particle: "game-particle-dot",
} as const;

type AssetKey = (typeof ASSET_KEYS)[keyof typeof ASSET_KEYS];

export interface LoadedGameAssets {
  backgrounds: {
    far: Texture;
    mid: Texture;
    near: Texture;
  };
  collector: Texture;
  errorIcon: Texture;
  particle: Texture;
  wastes: Record<WasteTypeId, Texture[]>;
}

const WASTE_SPRITE_SOURCES: Record<WasteTypeId, StaticImageData[]> = {
  plastic: [sprPlasticoBotellaImage, sprPlasticoDetergenteImage, sprPlasticoVasoImage],
  paper: [sprPapelBolsaImage, sprPapelCajaImage, sprPapelDiarioImage],
  glass: [sprVidrioBotellaImage, sprVidrioFrascoImage, sprVidrioTarroImage],
  organic: [sprOrganicoBananaImage, sprOrganicoHuevoImage, sprOrganicoManzanaImage],
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

export async function preloadGameAssets(): Promise<LoadedGameAssets> {
  if (assetCachePromise) {
    return assetCachePromise;
  }

  assetCachePromise = (async () => {
    registerAsset(ASSET_KEYS.backgroundFar, resolveImageSource(datosImage));
    registerAsset(ASSET_KEYS.backgroundMid, resolveImageSource(heroImage));
    registerAsset(ASSET_KEYS.backgroundNear, resolveImageSource(fondoPruebaImage));
    registerAsset(ASSET_KEYS.collector, createCollectorSvg());
    registerAsset(ASSET_KEYS.errorIcon, createErrorIconSvg());
    registerAsset(ASSET_KEYS.particle, createParticleSvg());

    await Assets.load([
      ASSET_KEYS.backgroundFar,
      ASSET_KEYS.backgroundMid,
      ASSET_KEYS.backgroundNear,
      ASSET_KEYS.collector,
      ASSET_KEYS.errorIcon,
      ASSET_KEYS.particle,
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

    return {
      backgrounds: {
        far: getTexture(ASSET_KEYS.backgroundFar),
        mid: getTexture(ASSET_KEYS.backgroundMid),
        near: getTexture(ASSET_KEYS.backgroundNear),
      },
      collector: getTexture(ASSET_KEYS.collector),
      errorIcon: getTexture(ASSET_KEYS.errorIcon),
      particle: getTexture(ASSET_KEYS.particle),
      wastes: wasteTextures,
    };
  })();

  return assetCachePromise;
}

export function clearAssetCache(): void {
  assetCachePromise = null;
}
