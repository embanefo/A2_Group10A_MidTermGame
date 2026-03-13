/*
  Spike.js
  ─────────────────────────────────────────────
  A single spike obstacle. Supports two types:

  "ground" — sits on the floor, tip points UP.
             Player must jump over it.

  "air"    — hangs from above, tip points DOWN.
             Dangerous when the player is on a
             platform; safe when on the ground.
             Drawn in red so it reads differently.

  The bounding box (x, y, w, h) works for both:
    ground: y = top of spike, y+h = base on floor
    air:    y = top (near screen top), y+h = tip

  Collision logic lives in sketch.js.
*/

class Spike {
  constructor(x, y, w, h, type = "ground") {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = type; // "ground" | "air"

    // Flags set by sketch.js collision checks
    this.scored = false;
    this.nearMiss = false;
  }

  // ── Draw ─────────────────────────────────────
  // Both types pulse with intensity for visual feedback
  draw(intensity, maxIntensity) {
    noStroke();

    const pulse = sin(frameCount * 0.1);
    const scale = map(intensity, 0, maxIntensity, 0, 0.4);
    const visualHeight = this.h * (1 + pulse * scale);

    if (this.type === "ground") {
      // light grey triangle, tip pointing UP
      fill(140);
      triangle(
        this.x,
        this.y + this.h, // bottom-left
        this.x + this.w / 2,
        this.y + this.h - visualHeight, // tip (up)
        this.x + this.w,
        this.y + this.h, // bottom-right
      );
    } else {
      // Dark blue triangle, tip pointing DOWN — hangs from above
      fill(2, 21, 28); // #02151C
      triangle(
        this.x,
        this.y, // top-left
        this.x + this.w / 2,
        this.y + visualHeight, // tip (down)
        this.x + this.w,
        this.y, // top-right
      );
    }
  }
}
