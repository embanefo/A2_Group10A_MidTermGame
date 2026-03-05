/*
  PlatformManager.js
  ─────────────────────────────────────────────
  Spawns, scrolls, and culls elevated platforms.

  Platforms move left at the same speed as spikes
  so the world feels consistent.

  ── Tuning knobs ──────────────────────────────
  GAP_MIN / GAP_MAX   — space between platforms
  W_MIN  / W_MAX      — platform width range
  PLATFORM_Y is set in sketch.js as a global so
  Player.js can also read it for collision.
*/

class PlatformManager {
  constructor() {
    this.platforms = [];
    this._spawnTimer = 0; // counts down to next spawn
    this._resetSpawnTimer();
  }

  // ── Clear on game reset ──────────────────────
  reset() {
    this.platforms = [];
    this._resetSpawnTimer();
  }

  // ── Move + spawn each frame ──────────────────
  // speed — same value SpikeManager uses (passed from sketch.js)
  update(speed) {
    for (const p of this.platforms) p.x -= speed;

    // Cull platforms that have scrolled off-screen
    this.platforms = this.platforms.filter((p) => p.x + p.w > 0);

    this._spawnTimer -= speed;
    if (this._spawnTimer <= 0) {
      this._spawnPlatform();
      this._resetSpawnTimer();
    }
  }

  // ── Draw all platforms ───────────────────────
  draw() {
    for (const p of this.platforms) p.draw();
  }

  // ── Internal helpers ─────────────────────────
  _spawnPlatform() {
    const w = random(160, 250); // W_MIN / W_MAX (longer platforms)
    this.platforms.push(new Platform(width + 40, PLATFORM_Y, w, 14));
  }

  _resetSpawnTimer() {
    // distance (pixels) until the next platform spawns
    // — varies so gaps feel natural, not mechanical
    this._spawnTimer = random(400, 600); // GAP_MIN / GAP_MAX (wider spacing)
  }
}
