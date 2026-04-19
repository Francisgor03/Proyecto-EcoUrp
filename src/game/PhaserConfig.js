import * as Phaser from "phaser";
import Boot from "./scenes/Boot.js";
import TachoGame from "./scenes/TachoGame.js";

const BASE_WIDTH = 960;
const BASE_HEIGHT = 720;

/**
 * @param {HTMLElement} parent Contenedor del canvas (debe tener tamaño definido en CSS).
 * @returns {Phaser.Types.Core.GameConfig}
 */
export function createPhaserGameConfig(parent, _options = {}) {
  return {
    type: Phaser.AUTO,
    parent,
    transparent: false,
    backgroundColor: "#ecfdf5",
    // Evita Web Audio / AudioContext (errores al destruir el juego con React Strict Mode o HMR)
    audio: {
      noAudio: true,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: BASE_WIDTH,
      height: BASE_HEIGHT,
      min: {
        width: BASE_WIDTH * 0.5,
        height: BASE_HEIGHT * 0.5,
      },
      max: {
        width: BASE_WIDTH * 2,
        height: BASE_HEIGHT * 2,
      },
    },
    scene: [Boot, TachoGame],
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
    render: {
      pixelArt: false,
      antialias: true,
    },
  };
}

export { BASE_WIDTH, BASE_HEIGHT };
