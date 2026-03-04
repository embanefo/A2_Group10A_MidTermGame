// Controls which screen is currently shown: start, play, or lose
let state = "start";

// Player object
let player;

// Array that stores all spike obstacles
let spikes = [];

// Player score
let score = 0;

// Anxiety intensity mechanic (scales difficulty)
let intensity = 0;

// Tracks how many successful jumps in a row
let streak = 0;

// Boost mechanic variables
let boostActive = false;
let boostTimer = 0;

// Mistake tracking for shake mechanic
let misses = 0;
let shakeActive = false;
let shakeSuccess = 0;

// Prevents multiple collision triggers in quick succession
let hitCooldown = 0;

// Ground position
const GROUND = 230;

// Maximum allowed anxiety intensity
const MAX_INTENSITY = 100;

// How long boost lasts (in frames)
const BOOST_DURATION = 200;

// Runs once when the sketch starts
function setup() {
  createCanvas(700, 300);
  resetGame();
}

// Resets all variables to starting values
function resetGame() {
  // Player starting properties
  player = {
    x: 90,
    y: GROUND,
    w: 40,
    h: 40,
    vy: 0, // vertical velocity
    onGround: true, // whether player is touching the ground
  };

  spikes = [];
  score = 0;
  intensity = 0;

  // Boost system reset
  streak = 0;
  boostActive = false;
  boostTimer = 0;

  // Shake system reset
  misses = 0;
  shakeActive = false;
  shakeSuccess = 0;

  // Collision cooldown reset
  hitCooldown = 0;
}

function draw() {
  // Background color
  background(245);

  // Draw ground line
  stroke(40);
  line(0, GROUND + player.h, width, GROUND + player.h);

  if (state === "start") {
    textAlign(CENTER);
    textSize(24);
    text("Press ENTER to Start", width / 2, height / 2);

    drawPlayer();
    return;
  }

  if (state === "play") {
    // Gradually increase anxiety intensity over time
    intensity += 0.04;
    intensity = constrain(intensity, 0, MAX_INTENSITY);

    // If shake mode is active, disable boost
    if (shakeActive) {
      boostActive = false;
      boostTimer = 0;
    }

    // Handle boost countdown
    if (boostActive) {
      boostTimer--;
      if (boostTimer <= 0) {
        boostActive = false;
      }
    }

    // Reduce collision cooldown
    if (hitCooldown > 0) hitCooldown--;

    // Update game systems
    updatePlayer();
    updateSpikes();
    checkNearMiss();
    checkScore();
    checkCollision();

    // Draw HUD elements
    drawHUD();

    // Screen shake effect
    push();
    if (shakeActive) {
      let shakeAmount = 4;

      translate(
        random(-shakeAmount, shakeAmount),
        random(-shakeAmount, shakeAmount),
      );
    }

    drawPlayer();
    drawSpikes();

    pop();
  }

  if (state === "lose") {
    drawPlayer();
    drawSpikes();

    textAlign(CENTER);

    textSize(28);
    text("GAME OVER", width / 2, height / 2);

    textSize(24);
    text("Press R to Restart", width / 2, height / 2 + 30);
  }
}

function updatePlayer() {
  // Gravity increases slightly with intensity
  let gravity = 1 + map(intensity, 0, MAX_INTENSITY, 0, 0.4);

  // Apply gravity
  player.vy += gravity;

  // Apply velocity
  player.y += player.vy;

  // Ground collision
  if (player.y >= GROUND) {
    player.y = GROUND;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }
}

function drawPlayer() {
  noStroke();

  // Player turns yellow when boost is active
  if (boostActive) {
    fill(255, 200, 0);
  } else {
    fill(30, 120, 255);
  }

  rect(player.x, player.y, player.w, player.h, 8);
}

function updateSpikes() {
  // Spike speed increases with intensity
  let speed = 7 + map(intensity, 0, MAX_INTENSITY, 0, 2);

  // Shake mode increases difficulty
  if (shakeActive) speed *= 1.25;

  // Spawn rate increases with intensity
  let spawnRate = 70 - map(intensity, 0, MAX_INTENSITY, 0, 20);

  // Spawn spikes periodically
  if (frameCount % floor(spawnRate) === 0) spawnSpike();

  // Move spikes
  for (let s of spikes) s.x -= speed;

  // Remove spikes that leave screen
  spikes = spikes.filter((s) => s.x + s.w > 0);
}

function spawnSpike() {
  let groundY = GROUND + player.h;

  let h = random(40, 55);
  let w = random(28, 40);

  // Main spike
  spikes.push({
    x: width + 20,
    y: groundY - h,
    w: w,
    h: h,
    scored: false,
    nearMiss: false,
  });

  // Occasionally spawn a second spike
  if (random() < 0.3) {
    let h2 = h - random(10, 15);

    spikes.push({
      x: width + 20 + w,
      y: groundY - h2,
      w: w,
      h: h2,
      scored: false,
      nearMiss: false,
    });
  }
}

function drawSpikes() {
  noStroke();
  fill(40);

  for (let s of spikes) {
    // Pulsing spike effect tied to intensity
    let pulse = sin(frameCount * 0.1);
    let scale = map(intensity, 0, MAX_INTENSITY, 0, 0.4);
    let visualHeight = s.h * (1 + pulse * scale);

    triangle(
      s.x,
      s.y + s.h,
      s.x + s.w / 2,
      s.y + s.h - visualHeight,
      s.x + s.w,
      s.y + s.h,
    );
  }
}

function checkCollision() {
  if (hitCooldown > 0) return;

  for (let s of spikes) {
    let overlapX = player.x + player.w > s.x && player.x < s.x + s.w;

    if (!overlapX) continue;

    let playerFeet = player.y + player.h;

    if (playerFeet > s.y + 8) {
      s.scored = true;

      // Register mistake
      misses++;
      hitCooldown = 15;

      // Activate shake mode after 3 misses
      if (!shakeActive && misses >= 3) {
        shakeActive = true;
        shakeSuccess = 0;
      }

      return;
    }
  }
}

function checkScore() {
  for (let s of spikes) {
    if (!s.scored && s.x + s.w < player.x) {
      score++;
      s.scored = true;

      // Recover from shake mode after 5 successes
      if (shakeActive) {
        shakeSuccess++;

        if (shakeSuccess >= 5) {
          shakeActive = false;
          shakeSuccess = 0;
          misses = 0;
        }
      }

      // Boost mechanic
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

function checkNearMiss() {
  for (let s of spikes) {
    let closeX = s.x < player.x + player.w + 10 && s.x + s.w > player.x - 10;

    let closeY = abs(player.y + player.h - s.y) < 10;

    // Near miss increases intensity
    if (closeX && closeY && !s.nearMiss) {
      intensity += 10;
      intensity = constrain(intensity, 0, MAX_INTENSITY);

      s.nearMiss = true;
    }
  }
}

function drawHUD() {
  fill(0);
  textAlign(LEFT);

  text("Score: " + score, 10, 20);

  // Intensity bar background
  fill(200);
  rect(10, 30, 200, 12);

  // Intensity level
  fill(255, 80, 80);
  rect(10, 30, map(intensity, 0, MAX_INTENSITY, 0, 200), 12);

  // Status text
  if (shakeActive) {
    fill(0);
    text("BOOST DEACTIVATED", 10, 70);
  } else if (boostActive) {
    fill(255, 200, 0);
    text("BOOST ACTIVE!", 10, 70);
  } else {
    fill(0);
    text("Streak: " + streak, 10, 70);
  }
}

function keyPressed() {
  // Start game
  if (state === "start" && keyCode === ENTER) state = "play";

  // Jump
  if (state === "play" && key === " " && player.onGround) {
    let jumpPower = boostActive ? -20 : -14.2;
    player.vy = jumpPower;
  }

  // Restart game
  if (state === "lose" && (key === "r" || key === "R")) {
    resetGame();
    state = "play";
  }
}
