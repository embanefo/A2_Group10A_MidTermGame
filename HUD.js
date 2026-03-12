/*
  HUD.js
  ─────────────────────────────────────────────
  Draws all on-screen UI:
    • Score counter
    • Intensity bar (red fill)
    • Streak / boost / shake status text

  Call HUD.draw() once per frame AFTER cam.end()
  so it renders on top of the world in screen space.
  Edit colours, positions, and labels here without
  touching game logic.
*/

class HUD {
  draw(
    score,
    intensity,
    maxIntensity,
    hearts,
    streak,
    boostActive,
    shakeActive,
  ) {
    // ── Score ────────────────────────────────
    fill(0);
    noStroke();
    textAlign(LEFT);
    textSize(14);
    text("Score: " + score, 10, 20);

    // ── Hearts display ───────────────────────
    textAlign(CENTER);
    textSize(28); // larger hearts

    for (let i = 0; i < 5; i++) {
      if (i < hearts) {
        //full heart
        fill(255, 50, 50);
        text("♥", 22 + i * 35, 55);
      } else {
        //empty heart
        fill(100);
        text("♥", 22 + i * 35, 55);
      }
    }

    //for (let i = 0; i < 5; i++) {
    //if (hearts >= i + 1) {
    // Full heart
    //fill(255, 50, 50);
    //text("♥", 35 + i * 35, 48);
    // } else if (hearts >= i + 0.5) {
    // Half heart
    // fill(255, 100, 100);
    // text("♡", 35 + i * 35, 48);
    //} else {
    // Empty heart
    //fill(100);
    // text("♡", 35 + i * 35, 48);
    //}
    //}
    textSize(14); // reset to default
    textAlign(LEFT);

    // ── Intensity bar ────────────────────────
    //fill(200);
    //rect(10, 55, 200, 12); // grey background track
    //fill(255, 80, 80);
    //rect(10, 55, map(intensity, 0, maxIntensity, 0, 200), 12); // red fill

    // ── Status line ──────────────────────────
    if (shakeActive) {
      fill(255, 60, 60);
      text("DANGER — hearts draining! Clear 5 spikes to recover!", 10, 80);
    } else if (boostActive) {
      fill(255, 200, 0);
      text("BOOST ACTIVE!", 10, 80);
    } else {
      fill(0);
      text("Streak: " + streak + " / 5 for boost", 10, 80);
    }

    // ── Controls reminder ────────────────────
    //fill(120);
    //textSize(12);
    //text("SPACE — jump   |   R — restart", 10, 110);
    //textSize(14); // reset for next frame
  }
}
