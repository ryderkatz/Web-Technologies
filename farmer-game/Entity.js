/**
 * Base game entity with a position and size.
 * @class
 */
export class Entity {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  constructor(x, y, w, h) {
    /** @type {number} */ this.x = x;
    /** @type {number} */ this.y = y;
    /** @type {number} */ this.w = w;
    /** @type {number} */ this.h = h;
    /** @type {boolean} */ this.dead = false;
  }
  /** @param {number} dt @param {import('./Game.js').Game} game */
  update(dt, game) {}
  /** @param {CanvasRenderingContext2D} ctx */
  draw(ctx) {}
}

/** Axis-aligned bounding box overlap. */
export const aabb = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** Clamp helper. */
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
