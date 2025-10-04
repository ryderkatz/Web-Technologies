import { Game } from "./Game.js";

const canvas = /** @type {HTMLCanvasElement|null} */ (document.getElementById("game"));
if (!canvas) {
  console.error("Canvas #game not found. Check index.html IDs.");
} else {
  // Create and hold a reference on window for debugging if desired.
  const game = new Game(canvas);
  // Click "Start" in the UI to begin.
  // Expose for console inspection during development (optional).
  // @ts-ignore
  window.__game__ = game;
}
