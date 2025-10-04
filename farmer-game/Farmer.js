import { Entity, clamp } from "./Entity.js";

/**
 * The player-controlled farmer.
 * Uses velocity updated from keyboard input.
**/

export class Farmer extends Entity {
  constructor(x, y) {
    super(x, y, 34, 34);
    this.speed = 260;
    this.vx = 0;
    this.vy = 0;

    // ---- SPRITESHEET: 3 rows (frames), 4 cols (directions) ----
    this.img = new Image();
    this.img.src = "assets/farmer_spritesheet.png"; // or .jpeg if that's what you saved
    this.rows = 3; // frames (idle, walkA, walkB)
    this.cols = 4; // directions (up, left, right, down)

    // direction as a COLUMN index: 0=up,1=left,2=right,3=down
    this.dirCol = 3; // default facing down/front

    // vertical animation row index
    this.frameRow = 0; // 0 = idle; 1/2 = walking frames
    this.fps = 6; // how fast to flip between walk frames
    this.animTimer = 0;

    // on-screen size
    this.targetH = 64;

    this.img.onload = () => {
      this.frameW = this.img.naturalWidth / this.cols;
      this.frameH = this.img.naturalHeight / this.rows;
      const aspect = this.frameW / this.frameH;
      this.h = this.targetH;
      this.w = this.h * aspect;
    };
  }

  handleInput(input) {
    const L = input.keys.has("ArrowLeft"), R = input.keys.has("ArrowRight");
    const U = input.keys.has("ArrowUp"),   D = input.keys.has("ArrowDown");

    this.vx = (R - L) * this.speed;
    this.vy = (D - U) * this.speed;

    // pick facing column (direction). Favor the axis with larger absolute velocity.
    if (Math.abs(this.vx) > Math.abs(this.vy)) {
      this.dirCol = this.vx > 0 ? 2 : 1; // right : left
    } else if (Math.abs(this.vy) > 0) {
      this.dirCol = this.vy > 0 ? 3 : 0; // down : up
    }
  }

  update(dt, game) {
    // movement w/ bounds and obstacle blocking
    const nx = clamp(this.x + this.vx * dt, 0, game.WIDTH - this.w);
    const ny = clamp(this.y + this.vy * dt, 0, game.HEIGHT - this.h);
    const hit = game.obstacles.some(o =>
      nx < o.x + o.w && nx + this.w > o.x &&
      ny < o.y + o.h && ny + this.h > o.y
    );
    if (!hit) { this.x = nx; this.y = ny; }

    // vertical animation across rows
    const moving = (this.vx !== 0 || this.vy !== 0);
    if (moving) {
      this.animTimer += dt;
      // rows 1 and 2 are walking; flip between them
      this.frameRow = 1 + (Math.floor(this.animTimer * this.fps) % 2); // 1 ↔ 2
    } else {
      this.frameRow = 0; // idle row
      this.animTimer = 0;
    }
  }

  draw(ctx) {
    if (this.img.complete && this.frameW && this.frameH) {
      // source rect: (col * frameW, row * frameH)
      const sx = this.dirCol * this.frameW;
      const sy = this.frameRow * this.frameH;
      ctx.drawImage(this.img, sx, sy, this.frameW, this.frameH, this.x, this.y, this.w, this.h);
    } else {
      // fallback while loading
      ctx.fillStyle = "#8b5a2b";
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }
}