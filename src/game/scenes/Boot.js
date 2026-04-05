import Phaser from "phaser";

/**
 * Escena inicial: prepara el canvas y el entorno antes de cargar assets pesados.
 */
export default class Boot extends Phaser.Scene {
  constructor() {
    super({ key: "Boot" });
  }

  preload() {
    // Aquí irán this.load.image(), this.load.atlas(), audio, etc.
    // Sin assets aún: create() se ejecuta al terminar preload vacío.
  }

  create() {
    this.scene.start("TachoGame");
  }
}
