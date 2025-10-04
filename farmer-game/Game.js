import { clamp, aabb } from "./Entity.js";
import { Farmer } from "./Farmer.js";
import { Crop, CropPoints, randomCropKind } from "./Crop.js";
import { Scarecrow } from "./Obstacle.js";

/** @enum {string} */
export const State = Object.freeze({
  MENU:"MENU", PLAYING:"PLAYING", PAUSED:"PAUSED", GAME_OVER:"GAME_OVER"
});

/** Simple level curve helpers */
function levelGoal(level) {
  // start at 50, +30 each level: 50, 80, 110, 140, ...
  let extra = 50 + (level - 1) * 30;
  if (level > 5) extra += (level - 5) * 20; // +20 each level after 5, +50 each round total
  if (level > 10) extra += (level - 10) * 10; // +50 each level after 10, +100 each round total
  if (level > 15) extra += (level - 15) * 5; // +100 each level after 15, +150 each round total
  return extra;
}
function levelTime(level) {
  // start 40s, -5s each level, floor 20s
  return Math.max(20, 40 - (level - 1) * 5);
}
function levelSpawnBase(level) {
  // start 0.9s, -0.1s each level, floor 0.40s
  return Math.max(0.40, 0.9 - (level - 1) * 0.1);
}
function levelObstacleCount(level) {
  // start 2, +1 per level, cap 6
  return Math.min(6, 1 + level);
}

/**
 * Keyboard input manager.
 */
class Input {
  /** @param {Game} game */
  constructor(game) {
    /** @type {Game} */ this.game = game;
    /** @type {Set<string>} */ this.keys = new Set();
    this._onKeyDown = this.onKeyDown.bind(this);
    this._onKeyUp = this.onKeyUp.bind(this);
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
  }
  /** @param {KeyboardEvent} e */
  onKeyDown(e) {
    if (e.key === "p" || e.key === "P") this.game.togglePause();
    this.keys.add(e.key);
  }
  /** @param {KeyboardEvent} e */
  onKeyUp(e) { this.keys.delete(e.key); }
  dispose() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
  }
}

/**
 * Main game controller with levels.
 */
export class Game {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    // constants
    this.WIDTH = 900; this.HEIGHT = 540; this.TILE = 30;

    /** @type {HTMLCanvasElement} */ this.canvas = canvas;
    /** @type {CanvasRenderingContext2D|null} */ this.ctx = canvas?.getContext("2d") ?? null;

    /** @type {State} */ this.state = State.MENU;

    // score & level
    this.level = 1;
    this.score = 0;                  // cumulative score across levels
    this.goal = levelGoal(this.level);
    this.bestLevel = 1;

    // world
    this.player = new Farmer(this.WIDTH/2 - 17, this.HEIGHT - 80);
    this.crops = [];
    this.obstacles = [];

    // timing & spawns
    this.timeLeft = levelTime(this.level);
    this.spawnEveryBase = levelSpawnBase(this.level);
    this.spawnEvery = this.spawnEveryBase;
    this._accumSpawn = 0;
    this._elapsed = 0;               // elapsed time in current run
    this.lastTime = 0;

    // input & resize
    this.input = new Input(this);
    this._onResize = this.onResize.bind(this);
    window.addEventListener("resize", this._onResize);

    // UI hooks
    const $ = (id) => document.getElementById(id);
    this.ui = {
      score: $("score"), time: $("time"), goal: $("goal"),
      status: $("status"), start: $("btnStart"), reset: $("btnReset"),
      bestLevel: $("bestLevel")
    };
    this.syncUI();
    this.ui.start?.addEventListener("click", () => this.start());
    this.ui.reset?.addEventListener("click", () => this.resetToMenu());

    // background image (load once)
    this.bg = new Image();
    this.bgReady = false;
    this.bg.onload = () => { this.bgReady = true; this.render(); };
    this.bg.src = "assets/field.png";

    // RAF loop as arrow → lexical `this`
    /** @type {(ts:number)=>void} */
    this.tick = (ts) => {
      const dt = Math.min((ts - this.lastTime) / 1000, 0.033);
      this.lastTime = ts;
      this._elapsed += dt;
      this.update(dt);
      this.render();
      requestAnimationFrame(this.tick);
    };

    // draw first frame (background + menu)
    this.render();
  }

  // ====== Level control ===================================================

  /** Prepare the current level (keeps cumulative score). */
  setupLevel() {
    // reset runtime state for this level
    this.timeLeft = levelTime(this.level);
    this.goal = levelGoal(this.level);
    this.spawnEveryBase = levelSpawnBase(this.level);
    this.spawnEvery = this.spawnEveryBase;
    this._accumSpawn = 0;
    this._elapsed = 0;
    this.lastTime = performance.now();
    this.bumpBestLevel();

    // reset player position
    this.player = new Farmer(this.WIDTH/2 - 17, this.HEIGHT - 80);

    // clear world and place obstacles appropriate to level
    this.crops.length = 0;
    this.obstacles.length = 0;

    // place N scarecrows
    const count = levelObstacleCount(this.level);
    const used = new Set();
    const randCell = () => ({
      x: Math.floor(Math.random() * ((this.WIDTH - 2 * this.TILE) / this.TILE)) * this.TILE + this.TILE,
      y: Math.floor(Math.random() * ((this.HEIGHT - 2 * this.TILE) / this.TILE)) * this.TILE + this.TILE,
    });
    while (this.obstacles.length < count) {
      const p = randCell();
      const key = `${p.x},${p.y}`;
      if (used.has(key)) continue;
      used.add(key);
      // keep obstacles away from the player's spawn area a bit
      if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < 120) continue;
      this.obstacles.push(new Scarecrow(p.x, p.y));
    }

    this.syncUI();
    this.ui.status && (this.ui.status.textContent = `Level ${this.level}`);
  }

  /** Move to the next level. */
  nextLevel() {
    this.level += 1;
    this.setupLevel();
  }

  /** Return to menu state (without wiping score/level unless desired). */
  resetToMenu() {
    this.state = State.MENU;
    // keep score & level visible but reset world view
    this.setupLevel(); // prepare current level parameters
    this.ui.status && (this.ui.status.textContent = "Menu");
    this.render();
  }

  // ====== Game lifecycle ===================================================

  onResize() {}

  /** Start/resume gameplay. */
  start() {
    if (this.state === State.MENU || this.state === State.GAME_OVER) {
      // fresh start from Level 1
      this.level = 1;
      this.score = 0;
      this.setupLevel();
      this.state = State.PLAYING;
      this.ui.status && (this.ui.status.textContent = `Level ${this.level}`);
      requestAnimationFrame(this.tick);
    } else if (this.state === State.PAUSED) {
      this.state = State.PLAYING;
      this.ui.status && (this.ui.status.textContent = `Level ${this.level}`);
    }
  }

  /** Pause/unpause gameplay. */
  togglePause() {
    if (this.state === State.PLAYING) {
      this.state = State.PAUSED;
      this.ui.status && (this.ui.status.textContent = `Paused — Level ${this.level}`);
    } else if (this.state === State.PAUSED) {
      this.state = State.PLAYING;
      this.ui.status && (this.ui.status.textContent = `Level ${this.level}`);
    }
  }

  /** Update header numbers. */
  syncUI() {
    this.ui.score && (this.ui.score.textContent = String(this.score));
    this.ui.time && (this.ui.time.textContent = Math.ceil(this.timeLeft));
    this.ui.goal && (this.ui.goal.textContent = String(this.goal));
    this.ui.bestLevel && (this.ui.bestLevel.textContent = String(this.bestLevel));
  }

  /** Update and display the highest level reached this session. */
  bumpBestLevel() {
    if (this.level > this.bestLevel) {
      this.bestLevel = this.level;
      if (this.ui.bestLevel) this.ui.bestLevel.textContent = String(this.bestLevel);
    }
  }    

  /** Spawn one crop at a grid-aligned position with a random kind. */
  spawnCrop() {
    const gx = Math.floor(Math.random() * ((this.WIDTH - 2 * this.TILE) / this.TILE)) * this.TILE + this.TILE;
    const gy = Math.floor(Math.random() * ((this.HEIGHT - 2 * this.TILE) / this.TILE)) * this.TILE + this.TILE;
    const kind = randomCropKind();
    this.crops.push(new Crop(gx, gy, kind));
  }

  /** Gentle difficulty ramp inside a level (optional icing). */
  applyDifficulty(dt) {
    const target = Math.max(0.25, this.spawnEveryBase - 0.01 * this._elapsed);
    this.spawnEvery += (target - this.spawnEvery) * 0.1;
  }

  // ====== Frame update & render ==========================================

  update(dt) {
    if (this.state !== State.PLAYING) return;

    // timer
    this.timeLeft = clamp(this.timeLeft - dt, 0, 999);
    if (this.timeLeft <= 0) {
      // out of time → game over
      this.state = State.GAME_OVER;
      this.ui.status && (this.ui.status.textContent = `Game Over — Reached Level ${this.level}`);
      this.syncUI();
      return;
    }

    // player
    this.player.handleInput(this.input);
    this.player.update(dt, this);

    // within-level difficulty ramp
    this.applyDifficulty(dt);

    // spawn crops
    this._accumSpawn += dt;
    while (this._accumSpawn >= this.spawnEvery) {
      this._accumSpawn -= this.spawnEvery;
      this.spawnCrop();
    }

    // collect crops (points depend on crop type)
    const collected = this.crops.filter(c => aabb(this.player, c));
    if (collected.length) {
      let gained = 0;
      collected.forEach(c => { c.dead = true; gained += CropPoints[c.type]; });
      this.score += gained;
      this.ui.score && (this.ui.score.textContent = String(this.score));
    }
    this.crops = this.crops.filter(c => !c.dead);
    this.crops.forEach(c => c.update(dt, this));

    // level completion check (cumulative score >= goal)
    if (this.score >= this.goal) {
      // advance immediately to next level
      this.nextLevel();
      // keep playing without stopping the RAF; status text updates in setupLevel()
    }

    // timer UI
    this.ui.time && (this.ui.time.textContent = Math.ceil(this.timeLeft));
    this.ui.goal && (this.ui.goal.textContent = String(this.goal));
  }

  render() {
    const ctx = this.ctx; if (!ctx) return;
    ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

    // background
    if (this.bgReady) {
      ctx.drawImage(this.bg, 0, 0, this.WIDTH, this.HEIGHT);
    } else {
      ctx.fillStyle = "#b98255";
      ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
    }

    // world
    this.crops.forEach(c => c.draw(ctx));
    this.obstacles.forEach(o => o.draw(ctx));
    this.player.draw(ctx);

    // state labels
    ctx.fillStyle = "#333";
    ctx.font = "16px system-ui, sans-serif";
    if (this.state === State.MENU) {
      ctx.fillText("Press Start to play", 20, 28);
    } else if (this.state === State.PAUSED) {
      ctx.fillText(`Paused — Level ${this.level}`, 20, 28);
    } else if (this.state === State.GAME_OVER) {
      ctx.fillText(`Game Over — Reached Level ${this.level}`, 20, 28);
    } else if (this.state === State.PLAYING) {
      ctx.fillText(`Level ${this.level}`, 20, 28);
    }
  }

  dispose() {
    this.input.dispose();
    window.removeEventListener("resize", this._onResize);
  }
}