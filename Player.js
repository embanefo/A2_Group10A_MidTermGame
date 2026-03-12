/*
  Player.js
  ─────────────────────────────────────────────
  Handles everything about the player rectangle:
  position, physics (gravity + jumping),
  platform landing collision, drawing, and
  exposing a bounding box for collision checks.

  ── What changed from the original ───────────
  update() now accepts a `platforms` array and
  checks if the player is landing on a platform
  top surface (falling down only — no clipping
  through from below).
*/

class Player {
  constructor() {
    this.x = 90;
    this.y = GROUND; // GROUND defined in sketch.js (global)
    this.w = 40;
    this.h = 40;
    this.vy = 0;
    this.onGround = true;
    this.jumpCount = 0; // tracks jumps used (0, 1, or 2 for double jump)
  }

  // ── Reset to starting state ──────────────────
  reset() {
    this.y = GROUND;
    this.vy = 0;
    this.onGround = true;
    this.jumpCount = 0;
  }

  // ── Physics update ───────────────────────────
  // platforms — array of Platform objects from PlatformManager
  update(intensity, maxIntensity, platforms) {
    const gravity = 1 + map(intensity, 0, maxIntensity, 0, 0.4);
    this.vy += gravity;

    // Store head + feet position BEFORE moving this frame (used for crossing checks)
    const prevHeadY = this.y;
    const prevFeetY = this.y + this.h;

    this.y += this.vy;
    this.onGround = false;

    // ── Ground collision ──────────────────────
    if (this.y >= GROUND) {
      this.y = GROUND;
      this.vy = 0;
      this.onGround = true;
      this.jumpCount = 0; // reset jumps when landing on ground
    }

    // ── Platform collisions ──────────────────
    for (const p of platforms) {
      const inXRange = this.x + this.w > p.x + 4 && this.x < p.x + p.w - 4;

      // Top-surface collision (landing on platform when falling)
      if (!this.onGround && this.vy > 0 && inXRange) {
        const feetY = this.y + this.h;
        const crossingTop = prevFeetY <= p.y && feetY >= p.y;

        if (crossingTop) {
          this.y = p.y - this.h; // snap feet to platform top
          this.vy = 0;
          this.onGround = true;
          this.jumpCount = 0; // reset jumps when landing on platform
          break;
        }
      }
    }
  }

  // ── Jump ─────────────────────────────────────
  // Double jump system: allows up to 2 jumps total
  jump(boostActive) {
    if (this.jumpCount < 2) {
      this.jumpCount++;
      // Second jump is slightly weaker than first
      const jumpPower =
        this.jumpCount === 1
          ? boostActive
            ? -20
            : -15 // first jump (higher!)
          : boostActive
            ? -18
            : -13; // second jump (higher!)
      this.vy = jumpPower;
      this.onGround = false; // not on ground while jumping
    }
  }

  // ── Draw ─────────────────────────────────────
  // Uses ch.png sprite passed in from sketch.js.
  // Gold tint applied during boost.
  // Falls back to a blue rectangle if no image provided.
  draw(boostActive, img) {
    if (img) {
      noTint();
      image(img, this.x, this.y - 20, 70, 70);
    } else {
      noStroke();
      fill(boostActive ? color(255, 200, 0) : color(30, 120, 255));
      rect(this.x, this.y, this.w, this.h, 8);
    }
  }

  // ── Bounding box ─────────────────────────────
  getBox() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }
}
