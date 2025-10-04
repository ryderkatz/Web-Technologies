import { Entity } from "./Entity.js";

/** Stationary scarecrow obstacle. */
export class Scarecrow extends Entity {
  constructor(x, y) {
    super(x, y, 80, 80);

    this.img = new Image();
    this.img.src = "assets/scarecrow.png";
  }

  draw(ctx) {
    if (this.img.complete) {
      ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
    } else {
      ctx.fillStyle = "gray";
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }
}
