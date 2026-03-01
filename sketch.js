/*
  A2 Starter Runner (Shapes Only) — p5.js
  -------------------------------------------------------
  PURPOSE
  - This is a clean, demo-ready runner prototype for your A2 repo.
  - It uses ONLY shapes (rectangles/lines), no images or sound.
  - It includes a simple but complete “one level” loop:
      Start Screen -> Play -> Lose Screen -> Restart
  - It is intentionally NOT modified for BPD yet (your request).

  FILE EXPECTATION
  - Save this code as: sketch.js
  - Ensure index.html loads p5.js (CDN or local) + this sketch.js

  CONTROLS
  - ENTER: Start game (from start screen)
  - SPACE: Jump (during play)
  - R: Restart (after game over)

  TEAM EXTENSIONS (later)
  - Add a second mechanic (e.g., pickups, stamina, dash, etc.)
  - Add win condition (survive X seconds) if desired
  - Modularize into player.js / obstacles.js / ui.js if needed
*/

// ----------------------
// CANVAS + WORLD SETTINGS
// ----------------------

// Canvas size (matches your earlier runner)
const CANVAS_W = 700;
const CANVAS_H = 300;

// Ground line position
// We'll treat this as the top surface where the player's feet rest.
const GROUND_TOP_Y = 230;

// Physics
const GRAVITY = 1.0; // pulls player down each frame
const JUMP_VELOCITY = -14; // negative = up

// Obstacle system
const OBSTACLE_SPAWN_FRAMES = 90; // spawn one obstacle every ~90 frames
const OBSTACLE_SPEED = 6; // how fast obstacles move left

// ----------------------
// GAME STATE (SCREENS)
// ----------------------

// We use a simple “state machine” so the game has clean screens:
// "start" -> "play" -> "lose"
let state = "start";

// ----------------------
// GAME OBJECTS / VARIABLES
// ----------------------

// Player object (a rectangle)
let player;

// Obstacles: an array of rectangles that move left
let obstacles = [];

// Score counts up while playing (we display a simplified score)
let score = 0;

// ----------------------
// p5.js: setup()
// Runs once at the start
// ----------------------
function setup() {
  createCanvas(CANVAS_W, CANVAS_H);

  // Initialize all game objects
  resetGame();
}

// ----------------------
// Reset the game to a fresh run
// Called on setup() and restart
// ----------------------
function resetGame() {
  // Player starts near the left side, standing on the ground.
  player = {
    x: 90,
    y: GROUND_TOP_Y, // this is the TOP of the player rectangle
    w: 40,
    h: 40,
    vy: 0, // vertical velocity
    onGround: true, // used to prevent double-jumps
  };

  // Clear obstacles + reset score
  obstacles = [];
  score = 0;

  // Note:
  // We do NOT change `state` here. That allows resetGame()
  // to be reused for restarts (where the caller sets the state).
}

// ----------------------
// p5.js: draw()
// Runs every frame (~60 fps)
// ----------------------
function draw() {
  // Background each frame so the canvas redraws cleanly
  background(245);

  // Ground always visible (all screens)
  drawGround();

  // Decide what to do based on state
  if (state === "start") {
    drawStartScreen();
    // show player as a preview
    drawPlayer();
    return; // do not run gameplay update logic
  }

  if (state === "play") {
    // Update world
    updatePlayer();
    updateObstacles();

    // Check for collisions (may switch state to "lose")
    checkCollisions();

    // Update score (only while playing)
    score += 1;

    // Draw world
    drawHUD();
    drawPlayer();
    drawObstacles();

    return;
  }

  if (state === "lose") {
    // Show the frozen scene (player + obstacles) and overlay GAME OVER
    drawPlayer();
    drawObstacles();
    drawLoseScreen();
    return;
  }
}

// =======================================================
// DRAWING HELPERS (visual only)
// =======================================================

function drawGround() {
  // The ground “surface line”:
  // The player stands on GROUND_TOP_Y.
  stroke(40);
  strokeWeight(2);

  // Draw the ground line at the player's "feet level"
  // player's y is the TOP of player, so feet = player.y + player.h
  // We'll keep ground line consistent using GROUND_TOP_Y + player.h
  line(0, GROUND_TOP_Y + player.h, width, GROUND_TOP_Y + player.h);

  // Optional: simple dashed "road" line below the ground
  strokeWeight(3);
  for (let x = 0; x < width; x += 50) {
    line(x, GROUND_TOP_Y + player.h + 20, x + 25, GROUND_TOP_Y + player.h + 20);
  }
}

function drawPlayer() {
  // Player is a rounded rectangle
  noStroke();
  fill(30, 120, 255); // blue

  rect(player.x, player.y, player.w, player.h, 8);
}

function drawObstacles() {
  // Obstacles are dark rounded rectangles
  noStroke();
  fill(30);

  for (const o of obstacles) {
    rect(o.x, o.y, o.w, o.h, 6);
  }
}

function drawHUD() {
  // Score display in top-left corner
  noStroke();
  fill(0);
  textSize(14);
  textAlign(LEFT, TOP);

  // Score grows every frame, so divide by 10 to slow the visible increase
  text(`Score: ${floor(score / 10)}`, 12, 12);
}

function drawStartScreen() {
  // Start screen text + instructions
  noStroke();
  fill(0);
  textAlign(CENTER, CENTER);

  textSize(26);
  text("Runner Prototype", width / 2, height / 2 - 40);

  textSize(14);
  text("Press ENTER to start", width / 2, height / 2);
  text("Press SPACE to jump", width / 2, height / 2 + 22);

  // Small note: this is just the prototype scaffold
  textSize(12);
  text("(Shapes only — mechanics first)", width / 2, height / 2 + 48);
}

function drawLoseScreen() {
  // Game over overlay text
  noStroke();
  fill(0);
  textAlign(CENTER, CENTER);

  textSize(26);
  text("GAME OVER", width / 2, height / 2 - 20);

  textSize(14);
  text(`Final Score: ${floor(score / 10)}`, width / 2, height / 2 + 10);
  text("Press R to restart", width / 2, height / 2 + 32);
}

// =======================================================
// UPDATE LOGIC (movement, spawning, collisions)
// =======================================================

function updatePlayer() {
  // Apply gravity every frame
  player.vy += GRAVITY;

  // Apply velocity to position
  player.y += player.vy;

  // Ground collision:
  // If the player falls below the ground top, snap them back onto the ground.
  if (player.y >= GROUND_TOP_Y) {
    player.y = GROUND_TOP_Y;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }
}

function updateObstacles() {
  // Spawn obstacles at a fixed interval
  // frameCount is a p5 variable that increments every draw() frame
  if (frameCount % OBSTACLE_SPAWN_FRAMES === 0) {
    spawnObstacle();
  }

  // Move obstacles left each frame
  for (const o of obstacles) {
    o.x -= OBSTACLE_SPEED;
  }

  // Remove obstacles once they leave the screen
  // (keeps array from growing forever)
  obstacles = obstacles.filter((o) => o.x + o.w > 0);
}

function spawnObstacle() {
  // Randomize obstacle width/height slightly for variety
  const w = random(22, 40);
  const h = random(35, 70);

  // We want the obstacle to sit on the ground.
  // Ground line is at (GROUND_TOP_Y + player.h).
  // So obstacle top y should be: groundLineY - obstacleHeight.
  const groundLineY = GROUND_TOP_Y + player.h;

  obstacles.push({
    x: width + 20, // spawn off-screen right
    y: groundLineY - h, // sit on the ground
    w: w,
    h: h,
  });
}

function checkCollisions() {
  // Check player against each obstacle
  for (const o of obstacles) {
    if (
      rectsOverlap(player.x, player.y, player.w, player.h, o.x, o.y, o.w, o.h)
    ) {
      // Switch to lose screen
      state = "lose";

      // Stop the draw loop so everything freezes on impact
      // Restart will call loop() again.
      noLoop();
      return;
    }
  }
}

// Basic AABB (axis-aligned bounding box) collision detection
// Works well for rectangles that are not rotated.
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// =======================================================
// INPUT
// =======================================================

function keyPressed() {
  // START SCREEN INPUT
  if (state === "start") {
    // Start the game
    if (keyCode === ENTER) {
      state = "play";
      loop(); // ensure the loop is running
    }

    // Optional: allow preview jump even on start screen
    // (This helps players understand "SPACE jumps" immediately.)
    if (key === " " && player.onGround) {
      player.vy = JUMP_VELOCITY;
    }

    return;
  }

  // PLAY INPUT
  if (state === "play") {
    // Jump only if on the ground (prevents double jump)
    if (key === " " && player.onGround) {
      player.vy = JUMP_VELOCITY;
    }
    return;
  }

  // LOSE INPUT
  if (state === "lose") {
    // Restart on R
    if (key === "r" || key === "R") {
      resetGame();
      state = "play";
      loop(); // resume draw loop
    }
  }
}
