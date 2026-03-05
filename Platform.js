/*
  Platform.js
  ─────────────────────────────────────────────
  A single scrolling platform.
  PlatformManager owns the list and moves them.
  Player.js reads the list for landing collision.

  Edit PLATFORM_Y in sketch.js to change
  the height all platforms spawn at.
*/

class Platform {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  draw() {
    fill(80, 160, 80); // green — change colour here
    noStroke();
    rect(this.x, this.y, this.w, this.h, 4);

    // Subtle top highlight so it reads as a surface
    fill(120, 210, 120);
    rect(this.x + 4, this.y, this.w - 8, 3, 2);
  }
}
