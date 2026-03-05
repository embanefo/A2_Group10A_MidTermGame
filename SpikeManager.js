/*
  SpikeManager.js
  ─────────────────────────────────────────────
  Manages the full list of Spike objects:
  spawning, moving, culling, and drawing.

  ── Spike types ───────────────────────────────
  "ground" — rises from the floor. Jump or use a
             platform to avoid.
  "air"    — hangs from AIR_SPIKE_Y downward.
             Safe on the ground; dangerous on a
             platform. Player must jump over or
             drop off the platform in time.

  ── Tuning knobs ──────────────────────────────
  AIR_CHANCE         — probability a new spike is
                       an air spike (0.0 – 1.0)
  spawnRate formula  — controls how quickly new
                       spikes appear as intensity rises
  speed is passed IN from sketch.js so platforms
  and spikes always scroll at the same rate.
*/

const AIR_CHANCE = 0.35; // 35% of spawns are air spikes

class SpikeManager {
  constructor() {
    this.spikes = [];
    this.currentSpeed = 7; // exposed so PlatformManager can read it
  }

  // ── Clear on game reset ──────────────────────
  reset() {
    this.spikes = [];
    this.currentSpeed = 7;
  }

  // ── Move + spawn each frame ──────────────────
  // speed — computed in sketch.js and shared with PlatformManager
  update(speed, intensity, maxIntensity) {
    this.currentSpeed = speed;

    const spawnRate = 100 - map(intensity, 0, maxIntensity, 0, 30);
    if (frameCount % floor(spawnRate) === 0) this._spawn();

    for (const s of this.spikes) s.x -= speed;

    // Cull spikes that have scrolled off the left edge
    this.spikes = this.spikes.filter((s) => s.x + s.w > 0);
  }

  // ── Spawn a ground or air spike ──────────────
  _spawn() {
    if (random() < AIR_CHANCE) {
      this._spawnAir();
    } else {
      this._spawnGround();
    }
  }

  // Ground spike — rises from the floor
  _spawnGround() {
    const groundBase = GROUND + 40; // 40 = player height
    const h = random(40, 55);
    const w = random(28, 40);
    this.spikes.push(new Spike(width + 20, groundBase - h, w, h, "ground"));

    // 30% chance of a shorter second spike right behind the first
    if (random() < 0.3) {
      const h2 = h - random(10, 15);
      this.spikes.push(
        new Spike(width + 20 + w, groundBase - h2, w, h2, "ground"),
      );
    }
  }

  // Air spike — hangs down from AIR_SPIKE_Y
  // AIR_SPIKE_Y is defined in sketch.js as a global so it stays
  // in sync with PLATFORM_Y (same file that defines platform height).
  _spawnAir() {
    const h = random(50, 70);
    const w = random(28, 40);
    this.spikes.push(new Spike(width + 20, AIR_SPIKE_Y, w, h, "air"));
  }

  // ── Draw all spikes ──────────────────────────
  draw(intensity, maxIntensity) {
    for (const s of this.spikes) s.draw(intensity, maxIntensity);
  }
}
