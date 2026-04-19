import * as Phaser from "phaser";
import fondoPrueba from "@/assets/images/FondoPrueba.jpg";

/**
 * Escena inicial: prepara el canvas y el entorno antes de cargar assets pesados.
 */
export default class Boot extends Phaser.Scene {
  constructor() {
    super({ key: "Boot" });
  }

  preload() {
    const backgroundUrl = typeof fondoPrueba === "string" ? fondoPrueba : fondoPrueba.src;
    this.load.image("eco-bg", backgroundUrl);
  }

  create() {
    this.scene.start("TachoGame");
  }
}
