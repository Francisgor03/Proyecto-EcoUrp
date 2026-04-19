import * as Phaser from "phaser";

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

const DEFAULT_SPAWN_MS = 1800;
const DEFAULT_FALL_SPEED = 220;
const DEFAULT_LIVES = 3;
const MODE_LABEL = {
  easy: "Facil",
  normal: "Normal",
  hard: "Dificil",
  timed: "Contrarreloj",
  zen: "Zen",
};

function getModeConfig(mode) {
  switch (mode) {
    case "easy":
      return { spawnMs: 2100, fallSpeed: 180, lives: 5 };
    case "hard":
      return { spawnMs: 1200, fallSpeed: 280, lives: 3 };
    case "timed":
      return { spawnMs: 1500, fallSpeed: 240, lives: 3, timeLimitMs: 60000 };
    case "zen":
      return { spawnMs: 2000, fallSpeed: 200, lives: 99, infiniteLives: true };
    case "normal":
    default:
      return { spawnMs: DEFAULT_SPAWN_MS, fallSpeed: DEFAULT_FALL_SPEED, lives: DEFAULT_LIVES };
  }
}

function getModeDetails(mode) {
  const config = getModeConfig(mode);
  const descriptions = {
    easy: "Modo facil para principiantes. Practica sin presion y con mas margen de error.",
    normal: "Ritmo equilibrado para entrenar reflejos y mejorar tu precision.",
    hard: "Modo desafiante con caida rapida. Requiere mas enfoque y velocidad.",
    timed: "Tienes 60 segundos para sumar puntos. Ideal para jugar rapido.",
    zen: "Modo libre sin limite de vidas. Juega tranquilo y aprende a tu ritmo.",
  };
  const livesLabel = config.infiniteLives ? "Sin limite" : `${config.lives}`;
  const errorsLabel = config.infiniteLives ? "Sin limite" : `${config.lives}`;
  const timeLabel =
    typeof config.timeLimitMs === "number" ? `${Math.ceil(config.timeLimitMs / 1000)}s` : "Sin limite";

  return {
    description: descriptions[mode] || descriptions.normal,
    livesLabel,
    errorsLabel,
    timeLabel,
  };
}

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
    const initialMode = this.registry.get("tachoGameMode") || "normal";
    this.mode = initialMode;
    this.applyModeConfig(initialMode);

    this.score = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.missedCount = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.isStarted = false;
    this.selectedIndex = 0;
    this.isPausedWrong = false;
    this.isGameOver = false;
    /** @type {Phaser.Physics.Arcade.Sprite | null} */
    this.pendingTrash = null;

    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0xd1fae5, 1).setDepth(-2);
    this.backgroundImage = this.add.image(w / 2, h / 2, "eco-bg").setDepth(-1);
    this.backgroundImage.setDisplaySize(w, h);

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

    const livesLabel = this.infiniteLives ? "∞" : this.lives;
    this.livesText = this.add.text(16, 34, `Vidas: ${livesLabel}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      color: "#047857",
    });

    this.streakText = this.add.text(16, 54, "Racha: 0", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "12px",
      color: "#047857",
    });

    this.timerText = this.add
      .text(w - 16, 12, "Tiempo: 60s", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px",
        color: "#065f46",
        fontStyle: "bold",
      })
      .setOrigin(1, 0)
      .setVisible(this.timeLeftMs !== null);

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

    this.spawnTimer = null;

    this.createMobileBinButtons(w, h);
    this.setMobileVisible(false);
    this.refreshMobileHighlight();

    this.createStartMenu(w, h);
    this.registerMenuHandler();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownCleanup());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.shutdownCleanup());
  }

  shutdownCleanup() {
    this.spawnTimer?.remove(false);
  }

  applyModeConfig(mode) {
    const modeConfig = getModeConfig(mode);
    this.spawnMs = modeConfig.spawnMs;
    this.fallSpeed = modeConfig.fallSpeed;
    this.lives = modeConfig.lives;
    this.infiniteLives = Boolean(modeConfig.infiniteLives);
    this.timeLimitMs = typeof modeConfig.timeLimitMs === "number" ? modeConfig.timeLimitMs : null;
    this.timeLeftMs = this.timeLimitMs;
  }

  registerMenuHandler() {
    this.game.registry.set("tachoOpenMenu", () => {
      this.scene.restart();
    });
  }

  setMobileVisible(visible) {
    this.mobileButtons?.forEach(({ bg, txt }) => {
      bg.setVisible(visible);
      txt.setVisible(visible);
    });
  }

  createStartMenu(w, h) {
    this.menuSection = "main";

    this.menuOverlay = this.add
      .rectangle(w / 2, h / 2, w, h, 0x022c22, 0.7)
      .setDepth(30)
      .setInteractive();

    this.menuTitle = this.add
      .text(w / 2, h / 2 - 210, "Eco-Catch", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "44px",
        color: "#ecfdf5",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(31);

    this.menuSubtitle = this.add
      .text(w / 2, h / 2 - 175, "Atrapa y separa residuos", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px",
        color: "#a7f3d0",
      })
      .setOrigin(0.5)
      .setDepth(31);

    const leftX = w / 2 - 220;
    const rightX = w / 2 + 180;
    const navItems = [
      { id: "play", label: "Jugar" },
      { id: "difficulty", label: "Dificultad" },
      { id: "options", label: "Opciones" },
    ];

    this.menuNavButtons = navItems.map((item, index) => {
      const y = h / 2 - 110 + index * 42;
      const bg = this.add
        .rectangle(leftX, y, 180, 34, 0xffffff, 0.12)
        .setStrokeStyle(2, 0x10b981, 1)
        .setDepth(31)
        .setInteractive({ useHandCursor: true });
      const txt = this.add
        .text(leftX, y, item.label, {
          fontFamily: "system-ui, sans-serif",
          fontSize: "14px",
          color: "#ecfdf5",
        })
        .setOrigin(0.5)
        .setDepth(32);

      bg.on("pointerdown", () => {
        if (item.id === "play") {
          this.startGame();
          return;
        }
        this.setMenuSection(item.id);
      });

      return { bg, txt, id: item.id };
    });

    const modes = ["easy", "normal", "hard", "timed", "zen"];
    this.difficultyButtons = modes.map((mode, index) => {
      const y = h / 2 - 50 + index * 34;
      const label = MODE_LABEL[mode] || mode;
      const bg = this.add
        .rectangle(leftX, y, 180, 32, 0xffffff, 0.08)
        .setStrokeStyle(1, 0x5eead4, 1)
        .setDepth(31)
        .setInteractive({ useHandCursor: true });
      const txt = this.add
        .text(leftX, y, label, {
          fontFamily: "system-ui, sans-serif",
          fontSize: "13px",
          color: "#ecfdf5",
        })
        .setOrigin(0.5)
        .setDepth(32);

      bg.on("pointerdown", () => this.setMode(mode));
      return { bg, txt, mode };
    });

    this.menuPanelBg = this.add
      .rectangle(rightX, h / 2 + 10, 320, 260, 0x0f172a, 0.45)
      .setStrokeStyle(2, 0x10b981, 0.8)
      .setDepth(31);

    this.menuPanelTitle = this.add
      .text(rightX, h / 2 - 105, "Dificultad", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        color: "#ecfdf5",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(32);

    this.menuPanelStats = this.add
      .text(rightX, h / 2 - 70, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "12px",
        color: "#d1fae5",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(32);

    this.menuPanelDesc = this.add
      .text(rightX, h / 2 + 20, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "12px",
        color: "#ecfdf5",
        wordWrap: { width: 250 },
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(32);

    this.menuPanelWip = this.add
      .text(rightX, h / 2 + 10, "Opciones (WIP)\nProximamente controles de sonido.", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "12px",
        color: "#ecfdf5",
        align: "center",
        wordWrap: { width: 240 },
      })
      .setOrigin(0.5)
      .setDepth(32)
      .setVisible(false);

    this.menuConfirmButton = this.add
      .rectangle(leftX, h / 2 + 150, 180, 36, 0x10b981, 1)
      .setDepth(31)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);
    this.menuConfirmLabel = this.add
      .text(leftX, h / 2 + 150, "Listo", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "13px",
        color: "#022c22",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(32)
      .setVisible(false);

    this.menuBackButton = this.add
      .rectangle(leftX, h / 2 + 195, 180, 30, 0xffffff, 0.1)
      .setStrokeStyle(2, 0x10b981, 1)
      .setDepth(31)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);
    this.menuBackLabel = this.add
      .text(leftX, h / 2 + 195, "Volver", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "12px",
        color: "#ecfdf5",
      })
      .setOrigin(0.5)
      .setDepth(32)
      .setVisible(false);

    this.menuConfirmButton.on("pointerdown", () => this.setMenuSection("main"));
    this.menuBackButton.on("pointerdown", () => this.setMenuSection("main"));

    this.setMode(this.mode);
    this.setMenuSection(this.menuSection);
  }

  setMode(mode) {
    this.mode = mode;
    this.registry.set("tachoGameMode", mode);
    this.applyModeConfig(mode);
    const livesLabel = this.infiniteLives ? "∞" : this.lives;
    this.livesText.setText(`Vidas: ${livesLabel}`);
    if (this.timerText) {
      if (this.timeLeftMs !== null) {
        const seconds = Math.ceil(this.timeLeftMs / 1000);
        this.timerText.setText(`Tiempo: ${seconds || 60}s`);
        this.timerText.setVisible(true);
      } else {
        this.timerText.setVisible(false);
      }
    }
    this.difficultyButtons?.forEach(({ bg, mode: current }) => {
      const active = current === mode;
      bg.setFillStyle(active ? 0x10b981 : 0xffffff, active ? 0.35 : 0.08);
      bg.setStrokeStyle(active ? 3 : 1, 0x10b981, 1);
    });
    this.updateDifficultyPanel();
  }

  setMenuSection(section) {
    this.menuSection = section;
    const showDifficulty = section === "difficulty";
    const showOptions = section === "options";
    const showPanel = showDifficulty || showOptions;
    const showMain = section === "main";

    this.difficultyButtons?.forEach(({ bg, txt }) => {
      bg.setVisible(showDifficulty);
      txt.setVisible(showDifficulty);
    });

    this.menuConfirmButton.setVisible(showDifficulty);
    this.menuConfirmLabel.setVisible(showDifficulty);
    this.menuBackButton.setVisible(showDifficulty || showOptions);
    this.menuBackLabel.setVisible(showDifficulty || showOptions);

    this.menuPanelBg.setVisible(showPanel);
    this.menuPanelTitle.setVisible(showDifficulty);
    this.menuPanelStats.setVisible(showDifficulty);
    this.menuPanelDesc.setVisible(showDifficulty);
    this.menuPanelWip.setVisible(showOptions);

    this.menuNavButtons?.forEach(({ bg, txt, id }) => {
      bg.setVisible(showMain);
      txt.setVisible(showMain);
      const active = id === section;
      bg.setFillStyle(active ? 0x10b981 : 0xffffff, active ? 0.35 : 0.12);
      bg.setStrokeStyle(active ? 3 : 2, 0x10b981, 1);
    });
  }

  updateDifficultyPanel() {
    if (!this.menuPanelTitle || !this.menuPanelStats || !this.menuPanelDesc) return;
    const details = getModeDetails(this.mode);
    const label = MODE_LABEL[this.mode] || "Normal";
    this.menuPanelTitle.setText(`Dificultad: ${label}`);
    this.menuPanelStats.setText(
      `Vidas: ${details.livesLabel}\nErrores permitidos: ${details.errorsLabel}\nTiempo: ${details.timeLabel}`
    );
    this.menuPanelDesc.setText(details.description);
  }

  startGame() {
    this.isStarted = true;
    this.isGameOver = false;
    this.isPausedWrong = false;
    this.score = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.missedCount = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.timeLeftMs = this.timeLimitMs;
    this.scoreText.setText("Puntos: 0");
    this.streakText.setText("Racha: 0");
    const livesLabel = this.infiniteLives ? "∞" : this.lives;
    this.livesText.setText(`Vidas: ${livesLabel}`);

    if (this.timerText) {
      if (this.timeLeftMs !== null) {
        const seconds = Math.ceil(this.timeLeftMs / 1000);
        this.timerText.setText(`Tiempo: ${seconds}s`);
        this.timerText.setVisible(true);
      } else {
        this.timerText.setVisible(false);
      }
    }

    this.menuOverlay?.setVisible(false);
    this.menuTitle?.setVisible(false);
    this.menuSubtitle?.setVisible(false);
    this.menuNavButtons?.forEach(({ bg, txt }) => {
      bg.setVisible(false);
      txt.setVisible(false);
    });
    this.difficultyButtons?.forEach(({ bg, txt }) => {
      bg.setVisible(false);
      txt.setVisible(false);
    });
    this.menuConfirmButton?.setVisible(false);
    this.menuConfirmLabel?.setVisible(false);
    this.menuBackButton?.setVisible(false);
    this.menuBackLabel?.setVisible(false);
    this.menuPanelBg?.setVisible(false);
    this.menuPanelTitle?.setVisible(false);
    this.menuPanelStats?.setVisible(false);
    this.menuPanelDesc?.setVisible(false);
    this.menuPanelWip?.setVisible(false);

    this.setMobileVisible(true);
    this.clearTrash();

    this.spawnTimer?.remove(false);
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnMs,
      loop: true,
      callback: () => {
        if (!this.isPausedWrong && !this.isGameOver) this.spawnTrash();
      },
    });

    this.startTimeMs = this.time.now;
    this.time.delayedCall(0, () => {
      if (!this.isPausedWrong && !this.isGameOver) this.spawnTrash();
    });
  }

  clearTrash() {
    this.trashGroup?.getChildren().forEach((obj) => obj.destroy());
    this.trashGroup?.clear(true, true);
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
        if (!this.isGameOver && this.isStarted) this.setSelectedIndex(i);
      });

      this.mobileButtons.push({ bg, txt, index: i });
    }
  }

  setSelectedIndex(index) {
    if (index < 0 || index > 3 || this.isGameOver || !this.isStarted) return;
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
    body.setVelocity(0, this.fallSpeed);
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
      this.correctCount += 1;
      this.streak += 1;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      this.scoreText.setText(`Puntos: ${this.score}`);
      this.streakText.setText(`Racha: ${this.streak}`);
      return;
    }

    trash.setData("resolved", true);
    this.wrongCount += 1;
    this.streak = 0;
    this.streakText.setText(`Racha: ${this.streak}`);
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
    this.missedCount += 1;
    this.streak = 0;
    this.streakText.setText(`Racha: ${this.streak}`);
    if (this.infiniteLives) return;
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

    const durationMs = this.startTimeMs ? Math.max(0, this.time.now - this.startTimeMs) : null;
    const handlers = this.game.registry.get("reactHandlers");
    handlers?.onGameOver?.({
      score: this.score,
      summary: {
        correct: this.correctCount,
        wrong: this.wrongCount,
        missed: this.missedCount,
        durationMs,
        mode: this.mode,
        modeLabel: MODE_LABEL[this.mode] || "Normal",
      },
    });
  }

  update() {
    if (this.isGameOver || !this.isStarted) return;

    if (this.timeLeftMs !== null && !this.isPausedWrong) {
      this.timeLeftMs = Math.max(0, this.timeLeftMs - this.game.loop.delta);
      if (this.timerText) {
        const seconds = Math.ceil(this.timeLeftMs / 1000);
        this.timerText.setText(`Tiempo: ${seconds}s`);
      }
      if (this.timeLeftMs === 0) {
        this.triggerGameOver();
        return;
      }
    }

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
