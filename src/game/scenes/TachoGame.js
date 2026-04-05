import Phaser from "phaser";

/** @typedef {'plastic' | 'paper' | 'glass' | 'organic'} WasteType */

export const WASTE_TYPES = /** @type {const} */ (["plastic", "paper", "glass", "organic"]);

const LABEL = {
  plastic: "Plástico",
  paper: "Papel",
  glass: "Vidrio",
  organic: "Orgánico",
};

const COLOR = {
  plastic: 0xfacc15,
  paper: 0x3b82f6,
  glass: 0x22c55e,
  organic: 0xa16207,
};

const SPAWN_MS = 1800;
const FALL_SPEED = 220;
const LIVES_START = 3;

/**
 * Texto educativo cuando el tacho elegido no coincide con el residuo.
 * @param {WasteType} itemType Tipo del residuo que cayó
 * @param {WasteType} binType Tipo de tacho seleccionado (incorrecto)
 */
export function buildWrongBinPayload(itemType, binType) {
  const residuo = LABEL[itemType];
  const tachoMal = LABEL[binType];
  const tachoBien = LABEL[itemType];

  const porQue = {
    plastic:
      "Los plásticos no deben mezclarse con otros flujos: pueden arrastrar microplásticos o alterar el tratamiento del resto de residuos.",
    paper:
      "El papel mojado o mezclado con restos de comida deja de ser reciclable y ensucia el lote entero.",
    glass:
      "El vidrio es 100% reciclable pero debe ir separado: mezclarlo con otros materiales puede romper la cadena de reciclaje.",
    organic:
      "Lo orgánico genera compost o biogás; mezclarlo con envases contamina el proceso y genera olores y plagas.",
  };

  const cruce = {
    plastic: {
      paper: "El plástico en el tacho de papel contamina el papel limpio y dificulta el reciclaje.",
      glass: "Mezclar plástico con vidrio complica la selección en planta y puede degradar la calidad del vidrio reciclado.",
      organic:
        "El plástico en orgánico no se descompone: termina como microplásticos en compost o suelo.",
    },
    paper: {
      plastic: "El papel sucio o mezclado con plásticos suele rechazarse en el proceso de reciclaje de papel.",
      glass: "Papel y vidrio deben ir por separado para no romper fibras ni mezclar cullets.",
      organic: "El papel con restos de comida va a orgánico solo si tu municipio lo indica; si no, ensucia el compost.",
    },
    glass: {
      plastic: "El vidrio con plástico mezclado obliga a más pasos de separación y puede hacer perder pureza del cullet.",
      paper: "Restos de vidrio entre el papel son un riesgo en las máquinas y para las personas que clasifican.",
      organic: "El vidrio en orgánico es peligroso para quien manipula el compost y no aporta materia orgánica.",
    },
    organic: {
      plastic: "La comida o restos orgánicos entre plásticos ensucian el envase y pueden hacer rechazar todo el lote.",
      paper: "Restos orgánicos húmedos estropean el papel seco que sí es reciclable.",
      glass: "Orgánico mezclado con vidrio genera limpieza costosa y riesgo de corte en planta.",
    },
  };

  const explicacion =
    cruce[itemType]?.[binType] ??
    `Mezclar ${residuo} con el tacho de ${tachoMal} dificulta el reciclaje y puede contaminar otros materiales.`;

  return {
    itemType,
    binType,
    title: "Tacho incorrecto",
    residuo,
    tachoElegido: tachoMal,
    tachoCorrecto: tachoBien,
    body: `${explicacion} ${porQue[itemType] ?? ""}`.trim(),
  };
}

export default class TachoGame extends Phaser.Scene {
  constructor() {
    super({ key: "TachoGame" });
  }

  create() {
    this.score = 0;
    this.lives = LIVES_START;
    this.selectedIndex = 0;
    this.isPausedWrong = false;
    this.isGameOver = false;
    /** @type {Phaser.Physics.Arcade.Sprite | null} */
    this.pendingTrash = null;

    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0xd1fae5, 1).setDepth(-2);

    // Grupo de GameObjects (no PhysicsGroup): PhysicsGroup reaplica defaults y pone velocityY=0 al add()
    this.trashGroup = this.add.group();

    this.bin = this.add.rectangle(w / 2, h - 52, 88, 36, COLOR[WASTE_TYPES[this.selectedIndex]], 1);
    this.physics.add.existing(this.bin, true);
    /** @type {Phaser.Physics.Arcade.StaticBody} */
    this.binBody = this.bin.body;
    this.binBody.setSize(88, 36);

    this.binLabel = this.add
      .text(this.bin.x, this.bin.y, LABEL[WASTE_TYPES[this.selectedIndex]], {
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px",
        color: "#022c22",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.scoreText = this.add.text(16, 12, "Puntos: 0", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "16px",
      color: "#064e3b",
      fontStyle: "bold",
    });

    this.livesText = this.add.text(16, 34, `Vidas: ${this.lives}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      color: "#047857",
    });

    this.hintText = this.add.text(w / 2, 12, "1-4: tacho · ← →: mover", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "12px",
      color: "#065f46",
    }).setOrigin(0.5, 0);

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keys = this.input.keyboard?.addKeys({
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE,
      four: Phaser.Input.Keyboard.KeyCodes.FOUR,
      n1: Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE,
      n2: Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO,
      n3: Phaser.Input.Keyboard.KeyCodes.NUMPAD_THREE,
      n4: Phaser.Input.Keyboard.KeyCodes.NUMPAD_FOUR,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.physics.add.overlap(
      this.bin,
      this.trashGroup,
      (_bin, trash) => this.onTrashHitBin(/** @type {Phaser.Physics.Arcade.Sprite} */ (trash)),
      undefined,
      this
    );

    this.spawnTimer = this.time.addEvent({
      delay: SPAWN_MS,
      loop: true,
      callback: () => {
        if (!this.isPausedWrong && !this.isGameOver) this.spawnTrash();
      },
    });

    // Primer residuo en el siguiente tick (física y timers listos) + no esperar el primer delay del loop
    this.time.delayedCall(0, () => {
      if (!this.isPausedWrong && !this.isGameOver) this.spawnTrash();
    });

    this.createMobileBinButtons(w, h);
    this.refreshMobileHighlight();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownCleanup());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.shutdownCleanup());
  }

  shutdownCleanup() {
    this.spawnTimer?.remove(false);
  }

  /**
   * @param {number} w
   * @param {number} h
   */
  createMobileBinButtons(w, h) {
    const labels = ["1", "2", "3", "4"];
    const pad = 6;
    const btnW = (w - pad * 5) / 4;
    const y = h - 18;
    this.mobileButtons = [];

    for (let i = 0; i < 4; i++) {
      const cx = pad + btnW / 2 + i * (btnW + pad);
      const bg = this.add
        .rectangle(cx, y, btnW - 4, 28, 0xffffff, 0.85)
        .setStrokeStyle(2, COLOR[WASTE_TYPES[i]], 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(10);

      const txt = this.add
        .text(cx, y, `${labels[i]}\n${LABEL[WASTE_TYPES[i]].slice(0, 3)}`, {
          fontFamily: "system-ui, sans-serif",
          fontSize: "10px",
          color: "#064e3b",
          align: "center",
        })
        .setOrigin(0.5)
        .setDepth(11);

      bg.on("pointerdown", () => {
        if (!this.isGameOver) this.setSelectedIndex(i);
      });

      this.mobileButtons.push({ bg, txt, index: i });
    }
  }

  setSelectedIndex(index) {
    if (index < 0 || index > 3 || this.isGameOver) return;
    this.selectedIndex = index;
    const type = WASTE_TYPES[index];
    this.bin.setFillStyle(COLOR[type], 1);
    this.binLabel.setText(LABEL[type]);
    this.refreshMobileHighlight();
  }

  refreshMobileHighlight() {
    this.mobileButtons?.forEach(({ bg, index }) => {
      const active = index === this.selectedIndex;
      bg.setStrokeStyle(active ? 3 : 2, COLOR[WASTE_TYPES[index]], 1);
      bg.setFillStyle(active ? 0xe6fffa : 0xffffff, active ? 0.95 : 0.85);
    });
  }

  spawnTrash() {
    const w = this.scale.width;
    const typeIndex = Phaser.Math.Between(0, 3);
    const type = WASTE_TYPES[typeIndex];
    const x = Phaser.Math.Between(40, w - 40);
    // Arcade no expone physics.add.rectangle; se crea el rect y luego se habilita el body dinámico
    const piece = this.add.rectangle(x, -24, 28, 28, COLOR[type]);
    this.physics.add.existing(piece, false);
    piece.setDepth(2);
    const body = /** @type {Phaser.Physics.Arcade.Body} */ (piece.body);
    body.setAllowGravity(false);
    body.setImmovable(false);
    piece.setData("typeIndex", typeIndex);
    piece.setData("type", type);
    piece.setData("resolved", false);
    this.trashGroup.add(piece, true);
    body.setVelocity(0, FALL_SPEED);
  }

  /**
   * @param {Phaser.Physics.Arcade.Sprite} trash
   */
  onTrashHitBin(trash) {
    if (trash.getData("resolved") || this.isPausedWrong || this.isGameOver) return;

    const typeIndex = trash.getData("typeIndex");
    if (typeIndex === this.selectedIndex) {
      trash.setData("resolved", true);
      trash.destroy();
      this.score += 1;
      this.scoreText.setText(`Puntos: ${this.score}`);
      return;
    }

    trash.setData("resolved", true);
    this.pendingTrash = trash;
    this.physics.pause();
    this.isPausedWrong = true;
    if (this.spawnTimer) this.spawnTimer.paused = true;

    const itemType = /** @type {WasteType} */ (trash.getData("type"));
    const binType = /** @type {WasteType} */ (WASTE_TYPES[this.selectedIndex]);
    const payload = buildWrongBinPayload(itemType, binType);

    const handlers = this.game.registry.get("reactHandlers");
    this.game.registry.set("tachoResumeWrong", () => this.resumeAfterWrong());

    handlers?.onWrongBin?.(payload);
  }

  resumeAfterWrong() {
    this.game.registry.remove("tachoResumeWrong");
    if (this.pendingTrash) {
      this.pendingTrash.destroy();
      this.pendingTrash = null;
    }
    this.isPausedWrong = false;
    this.physics.resume();
    if (this.spawnTimer) this.spawnTimer.paused = false;
  }

  /**
   * @param {Phaser.Physics.Arcade.Sprite} trash
   */
  handleMissedTrash(trash) {
    if (trash.getData("resolved") || this.isPausedWrong || this.isGameOver) return;
    trash.setData("resolved", true);
    trash.destroy();
    this.lives -= 1;
    this.livesText.setText(`Vidas: ${this.lives}`);
    if (this.lives <= 0) {
      this.triggerGameOver();
    }
  }

  triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.spawnTimer?.remove(false);
    this.physics.pause();

    const w = this.scale.width;
    const h = this.scale.height;
    this.add
      .rectangle(w / 2, h / 2, w, h, 0x022c22, 0.65)
      .setDepth(20);
    this.add
      .text(w / 2, h / 2 - 20, "Partida terminada", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "28px",
        color: "#ecfdf5",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(21);
    this.add
      .text(w / 2, h / 2 + 18, `Puntaje: ${this.score}`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "20px",
        color: "#a7f3d0",
      })
      .setOrigin(0.5)
      .setDepth(21);

    const handlers = this.game.registry.get("reactHandlers");
    handlers?.onGameOver?.({ score: this.score });
  }

  update() {
    if (this.isGameOver) return;

    if (!this.isPausedWrong) {
      const speed = 260;
      let dx = 0;
      if (this.cursors?.left?.isDown || this.keys?.a?.isDown) dx = -1;
      if (this.cursors?.right?.isDown || this.keys?.d?.isDown) dx = 1;
      if (dx !== 0) {
        const nx = Phaser.Math.Clamp(
          this.bin.x + dx * ((speed * this.game.loop.delta) / 1000),
          44,
          this.scale.width - 44
        );
        this.bin.x = nx;
        this.binBody.updateFromGameObject();
        this.binLabel.setPosition(this.bin.x, this.bin.y);
      }
    }

    if (this.keys) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.one) || Phaser.Input.Keyboard.JustDown(this.keys.n1))
        this.setSelectedIndex(0);
      if (Phaser.Input.Keyboard.JustDown(this.keys.two) || Phaser.Input.Keyboard.JustDown(this.keys.n2))
        this.setSelectedIndex(1);
      if (Phaser.Input.Keyboard.JustDown(this.keys.three) || Phaser.Input.Keyboard.JustDown(this.keys.n3))
        this.setSelectedIndex(2);
      if (Phaser.Input.Keyboard.JustDown(this.keys.four) || Phaser.Input.Keyboard.JustDown(this.keys.n4))
        this.setSelectedIndex(3);
    }

    const floorY = this.scale.height - 70;
    this.trashGroup.getChildren().forEach((obj) => {
      const trash = /** @type {Phaser.GameObjects.Rectangle} */ (obj);
      if (!trash.body) return;
      if (trash.getData("resolved")) return;
      if (trash.y > floorY) {
        this.handleMissedTrash(/** @type {Phaser.Physics.Arcade.Sprite} */ (trash));
      }
    });
  }
}
