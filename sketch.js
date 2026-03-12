/*
  sketch.js
  ─────────────────────────────────────────────
  A2 Mid-Term Runner — Main Sketch
  Course: GBDA302

  This file owns:
    • Global constants (canvas, physics, heights)
    • Game-state variables (score, intensity, etc.)
    • setup / draw / keyPressed
    • Collision detection (Player ↔ Spikes)
    • Screen-state machine: "start" → "play" → "lose"

  To change how things LOOK or MOVE, edit the
  matching class file instead of this one:
    Player.js         — player physics & drawing
    Spike.js          — single spike drawing (ground + air)
    SpikeManager.js   — spawn rates, air spike chance
    Platform.js       — single platform drawing
    PlatformManager.js — spawn gaps, platform width
    HUD.js            — all on-screen UI text & bars

  ── How the two spike types work ─────────────
  GROUND spikes  rise from the floor → jump or
                 use a platform to get over them.
  AIR spikes     hang down from AIR_SPIKE_Y →
                 safe on the ground, dangerous on
                 a platform. Jump over or drop off.
*/

// ── Canvas ───────────────────────────────────
const CANVAS_W = screen.width;
const CANVAS_H = 300;

// ── World heights (edit here to rebalance) ───
const GROUND = 230; // player.y (top) when standing on ground
const PLATFORM_Y = 200; // top surface of elevated platforms
// player.y on platform = PLATFORM_Y - player.h = 160
const AIR_SPIKE_Y = 110; // y where air spikes start (tip hangs down from here)
// air spike bottom reaches ~110+70 = 180
// — above player on ground (230), hits player on platform (160-200)

// ── Intensity / boost constants ───────────────
const MAX_INTENSITY = 100;
const BOOST_DURATION = 200; // frames

// ── Asset variables ───────────────────────────
let imgBg;
let imgPlayer;
let bgX = 0; // scrolling background x offset
let raindrops = []; // rain particles (active during shake)

// ── Game-state variables ─────────────────────
let state = "start";

let player;
let spikeManager;
let platformManager;
let hud;

let score = 0;
let intensity = 0;
let streak = 0;

let boostActive = false;
let boostTimer = 0;

let hearts = 5.0; // 5 full hearts (each spike hit costs 0.5 hearts)
let hitCooldown = 0;

let misses = 0; // spike hits since last recovery
let shakeActive = false; // screen shakes when player is struggling
let shakeSuccess = 0; // spikes cleared during shake (need 5 to recover)

// ── p5 preload ────────────────────────────────
function preload() {
  imgBg = loadImage("assets/10_17.png");
  imgPlayer = loadImage("assets/ch.png");
}

// ── p5 setup ─────────────────────────────────
function setup() {
  createCanvas(CANVAS_W, CANVAS_H);
  frameRate(60);

  player = new Player();
  spikeManager = new SpikeManager();
  platformManager = new PlatformManager();
  hud = new HUD();

  resetGame();
}

// ── Full game reset ───────────────────────────
function resetGame() {
  player.reset();
  spikeManager.reset();
  platformManager.reset();

  score = 0;
  intensity = 0;
  streak = 0;

  boostActive = false;
  boostTimer = 0;

  hearts = 5.0;
  hitCooldown = 0;

  misses = 0;
  shakeActive = false;
  shakeSuccess = 0;

  bgX = 0;
  raindrops = [];
}

// ── Main draw loop ────────────────────────────
function draw() {
  background(245);

  // ── Scrolling background ──────────────────
  if (state === "play") {
    let bgSpeed = map(intensity, 0, MAX_INTENSITY, 0.5, 2);
    if (shakeActive) bgSpeed *= 1.25;
    bgX -= bgSpeed;
  }

  // Draw tiled background to cover entire canvas
  if (imgBg) {
    let imgW = imgBg.width;
    let x = bgX % imgW;
    if (x > 0) x -= imgW; // start from left edge

    // Draw image tiles to cover full width
    for (let i = 0; i * imgW < width + imgW; i++) {
      image(imgBg, x + i * imgW, 0, imgW, CANVAS_H);
    }
  }

  // ── Dark blue shake overlay ───────────────
  if (shakeActive) {
    noStroke();
    fill(10, 20, 80, 140);
    rect(0, 0, width, height);
  }

  // ── Rain (only during shake) ──────────────
  updateAndDrawRain();

  // Ground line
  stroke(40);
  line(0, GROUND + player.h, width, GROUND + player.h);
  noStroke();

  // ── Start screen ──────────────────────────
  if (state === "start") {
    platformManager.draw();
    player.draw(false, imgPlayer);
    textAlign(CENTER);
    textSize(22);
    fill(0);
    text("Press ENTER to Start", width / 2, height / 2 - 10);
    textSize(14);
    fill(80);
    text("SPACE — jump   |   R — restart", width / 2, height / 2 + 18);
    text(
      "Green platforms help you dodge floor spikes.",
      width / 2,
      height / 2 + 38,
    );
    text(
      "Red hanging spikes are dangerous on platforms!",
      width / 2,
      height / 2 + 56,
    );
    return;
  }

  // ── Play screen ───────────────────────────
  if (state === "play") {
    // Slowly raise intensity over time
    intensity = constrain(intensity + 0.04, 0, MAX_INTENSITY);

    // Boost timer countdown
    if (boostActive) {
      boostTimer--;
      if (boostTimer <= 0) boostActive = false;
    }

    if (hitCooldown > 0) hitCooldown--;

    // ── Compute shared scroll speed ────────
    let gameSpeed = 4 + map(intensity, 0, MAX_INTENSITY, 0, 1);
    if (shakeActive) gameSpeed *= 1.25; // speed up during shake for extra pressure

    // ── Update game objects ─────────────────
    player.update(intensity, MAX_INTENSITY, platformManager.platforms);
    spikeManager.update(gameSpeed, intensity, MAX_INTENSITY);
    platformManager.update(gameSpeed);

    // ── Collision checks ────────────────────
    checkNearMiss();
    checkScore();
    checkCollision();

    // ── Draw (with optional screen-shake) ──
    push();
    if (shakeActive) translate(random(-4, 4), random(-4, 4));
    platformManager.draw();
    spikeManager.draw(intensity, MAX_INTENSITY);
    player.draw(boostActive, imgPlayer);
    pop();

    hud.draw(
      score,
      intensity,
      MAX_INTENSITY,
      hearts,
      streak,
      boostActive,
      shakeActive,
    );
  }

  // ── Lose screen ───────────────────────────
  if (state === "lose") {
    platformManager.draw();
    spikeManager.draw(intensity, MAX_INTENSITY);
    player.draw(false, imgPlayer);
    fill(0, 0, 0, 120);
    rect(0, 0, width, height);

    textAlign(CENTER);
    fill(255);
    textSize(28);
    text("GAME OVER", width / 2, height / 2 - 10);
    textSize(18);
    text(
      "Score: " + score + "   |   Press R to Restart",
      width / 2,
      height / 2 + 22,
    );
  }
}

// ── Rain effect (active during shake) ────────
// Spawns diagonal blue raindrops each frame,
// moves them, then culls ones that left the screen.
function updateAndDrawRain() {
  if (!shakeActive) {
    raindrops = [];
    return;
  }

  // Spawn a few new drops each frame
  for (let i = 0; i < 5; i++) {
    raindrops.push({
      x: random(width),
      y: random(-20, 0),
      speed: random(8, 14),
      len: random(10, 20),
      alpha: random(100, 200),
    });
  }

  // Move and draw existing drops
  for (let d of raindrops) {
    d.y += d.speed;
    d.x -= 1.5;
    stroke(150, 180, 255, d.alpha);
    strokeWeight(1);
    line(d.x, d.y, d.x + 2, d.y + d.len);
  }

  // Cull drops that fell off the bottom
  raindrops = raindrops.filter((d) => d.y < height);
}

// ── Collision: player hits a spike ───────────
// Hitting a spike 3 times triggers shake.
// Hearts are ONLY lost during the shake period.
function checkCollision() {
  if (hitCooldown > 0) return;

  for (const s of spikeManager.spikes) {
    const overlapX = player.x + player.w > s.x + 4 && player.x < s.x + s.w - 4;
    if (!overlapX) continue;

    let hit = false;

    if (s.type === "ground") {
      const playerFeet = player.y + player.h;
      if (playerFeet > s.y + 8) hit = true;
    } else {
      const playerTop = player.y;
      const spikeBase = s.y + s.h;
      if (playerTop < spikeBase - 8 && player.y + player.h > s.y) hit = true;
    }

    if (hit) {
      s.scored = true;
      hitCooldown = 15;

      if (shakeActive) {
        // During shake: every hit costs half a heart
        hearts -= 0.5;
        if (hearts <= 0) {
          state = "lose";
          return;
        }
      } else {
        // Outside shake: count misses; 3 triggers shake and cancels boost
        misses++;
        if (misses >= 3) {
          shakeActive = true;
          shakeSuccess = 0;
          boostActive = false;
          boostTimer = 0;
        }
      }

      // Reset streak on any hit
      streak = 0;
      return;
    }
  }
}

// ── Scoring: spike fully passed the player ────
function checkScore() {
  for (const s of spikeManager.spikes) {
    if (!s.scored && s.x + s.w < player.x) {
      score++;
      s.scored = true;

      // During shake: count successful clears toward recovery
      if (shakeActive) {
        shakeSuccess++;
        if (shakeSuccess >= 5) {
          shakeActive = false;
          shakeSuccess = 0;
          misses = 0;
        }
      }

      // Outside shake: build streak toward boost
      if (!shakeActive && !boostActive) {
        streak++;
        if (streak >= 5) {
          boostActive = true;
          boostTimer = BOOST_DURATION;
          streak = 0;
        }
      }
    }
  }
}

// ── Near-miss: ground spike barely clears player ─
// Only tracked for ground spikes (air near-miss feels unfair)
function checkNearMiss() {
  for (const s of spikeManager.spikes) {
    if (s.type !== "ground") continue;

    const closeX = s.x < player.x + player.w + 10 && s.x + s.w > player.x - 10;
    const closeY = abs(player.y + player.h - s.y) < 10;

    if (closeX && closeY && !s.nearMiss) {
      intensity = constrain(intensity + 10, 0, MAX_INTENSITY);
      s.nearMiss = true;
    }
  }
}

// ── Key input ─────────────────────────────────
function keyPressed() {
  if (state === "start" && keyCode === ENTER) {
    state = "play";
  }

  if (state === "play" && key === " ") {
    player.jump(boostActive);
  }

  if ((state === "lose" || state === "play") && (key === "r" || key === "R")) {
    resetGame();
    state = "play";
  }
}
