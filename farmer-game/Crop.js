import { Entity } from "./Entity.js";

/** @typedef {"wheat"|"pumpkin"|"golden_apple"} CropKind */

/** Points per crop kind. */
export const CropPoints = /** @type {Record<CropKind, number>} */ ({
  wheat: 1,
  pumpkin: 3,
  golden_apple: 5
});

/**
 * Collectible crop.
 * Different kinds have distinct visuals and point values.
 */
export class Crop extends Entity {
  constructor(x, y, type = "wheat") {
    super(x, y, 36, 36);
    this.type = type;

    // load image based on type
    this.img = new Image();
    if (type === "wheat") this.img.src = "assets/wheat.png";
    if (type === "pumpkin") this.img.src = "assets/pumpkin.png";
    if (type === "golden_apple") this.img.src = "assets/apple.png";
  }

  draw(ctx) {
    if (this.img.complete) {
      ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
    } else {
      // fallback while loading
      ctx.fillStyle = "yellow";
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }
}

/** Random crop kind with simple weights. */
export function randomCropKind() {
  const r = Math.random();
  if (r < 0.65) return "wheat";
  if (r < 0.90) return "pumpkin";
  return "golden_apple";
}
