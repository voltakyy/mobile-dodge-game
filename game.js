(() => {
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const overlay = document.querySelector("#overlay");
  const playButton = document.querySelector("#play-button");
  const buttonLabel = document.querySelector("#button-label");
  const overlayKicker = document.querySelector("#overlay-kicker");
  const overlayTitle = document.querySelector("#overlay-title");
  const overlayCopy = document.querySelector("#overlay-copy");
  const overlayHint = document.querySelector("#overlay-hint");
  const scoreOutput = document.querySelector("#score");
  const collectedOutput = document.querySelector("#collected");
  const bestOutput = document.querySelector("#best-score");
  const livesOutput = document.querySelector("#lives");
  const lifePips = [...document.querySelectorAll(".life-pip")];
  const leftButton = document.querySelector("#left-button");
  const rightButton = document.querySelector("#right-button");
  const BEST_KEY = "night-shift-best";

  const state = {
    mode: "ready",
    width: 0,
    height: 0,
    pixelRatio: 1,
    lanes: [],
    player: { lane: 1, y: 0, x: 0, targetX: 0 },
    objects: [],
    particles: [],
    stars: [],
    score: 0,
    collected: 0,
    lives: 3,
    speed: 180,
    spawnTimer: 0,
    invulnerable: 0,
    lastFrame: 0,
    elapsed: 0,
    best: readBest(),
  };

  function readBest() {
    try {
      return Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch {
      return 0;
    }
  }

  function saveBest() {
    try {
      localStorage.setItem(BEST_KEY, String(state.best));
    } catch {
      // Best score is optional; the game remains playable without storage.
    }
  }

  function formatScore(value) {
    return String(Math.floor(value)).padStart(5, "0");
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    state.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    state.width = rect.width;
    state.height = rect.height;
    canvas.width = Math.round(rect.width * state.pixelRatio);
    canvas.height = Math.round(rect.height * state.pixelRatio);
    ctx.setTransform(state.pixelRatio, 0, 0, state.pixelRatio, 0, 0);

    const padding = state.width * .16;
    state.lanes = Array.from({ length: 3 }, (_, index) =>
      padding + ((state.width - padding * 2) / 2) * index
    );
    state.player.y = state.height * .82;
    state.player.x = state.lanes[state.player.lane];
    state.player.targetX = state.player.x;
    state.stars = Array.from({ length: 44 }, () => ({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      size: Math.random() * 1.5 + .35,
      alpha: Math.random() * .42 + .08,
      phase: Math.random() * Math.PI * 2,
    }));
    draw();
  }

  function updateHud() {
    scoreOutput.textContent = formatScore(state.score);
    collectedOutput.textContent = String(state.collected).padStart(2, "0");
    bestOutput.textContent = formatScore(state.best);
    lifePips.forEach((pip, index) => pip.classList.toggle("is-lost", index >= state.lives));
    livesOutput.setAttribute("aria-label", `${state.lives} ${state.lives === 1 ? "life" : "lives"} remaining`);
  }

  function startGame() {
    state.mode = "playing";
    state.player.lane = 1;
    state.player.x = state.lanes[1];
    state.player.targetX = state.player.x;
    state.objects = [];
    state.particles = [];
    state.score = 0;
    state.collected = 0;
    state.lives = 3;
    state.speed = 180;
    state.spawnTimer = .7;
    state.invulnerable = 0;
    state.elapsed = 0;
    updateHud();
    overlay.classList.add("is-hidden");
    canvas.focus({ preventScroll: true });
    state.lastFrame = performance.now();
    requestAnimationFrame(frame);
  }

  function endGame() {
    state.mode = "over";
    const finalScore = Math.floor(state.score);
    const isBest = finalScore > state.best;
    if (isBest) {
      state.best = finalScore;
      saveBest();
    }
    updateHud();
    overlayKicker.textContent = isBest ? "NEW PERSONAL BEST" : "SHIFT COMPLETE";
    overlayTitle.innerHTML = `You made it<br><span>${formatScore(finalScore)}</span>`;
    overlayTitle.style.color = "var(--text)";
    overlayTitle.querySelector("span").style.color = "var(--mint)";
    overlayCopy.textContent = `${state.collected} light ${state.collected === 1 ? "orb" : "orbs"} caught. The night goes on.`;
    buttonLabel.textContent = "Run it back";
    overlayHint.textContent = "PRESS ENTER OR TAP TO RESTART";
    overlay.classList.remove("is-hidden");
  }

  function move(direction) {
    if (state.mode !== "playing") return;
    state.player.lane = Math.max(0, Math.min(2, state.player.lane + direction));
    state.player.targetX = state.lanes[state.player.lane];
  }

  function spawnObject() {
    const isOrb = Math.random() < .24;
    state.objects.push({
      type: isOrb ? "orb" : "hazard",
      lane: Math.floor(Math.random() * 3),
      y: -24,
      size: isOrb ? 7 : 11 + Math.random() * 4,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - .5) * 2.4,
      drift: isOrb ? 0 : (Math.random() - .5) * 8,
      checked: false,
    });
  }

  function burst(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 115;
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: .35 + Math.random() * .45,
        maxLife: .8,
        size: 1 + Math.random() * 2.2,
        color,
      });
    }
  }

  function update(dt) {
    state.elapsed += dt;
    state.score += dt * (10 + Math.min(state.elapsed * .42, 18));
    state.speed = 180 + Math.min(state.elapsed * 3.2, 175);
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnObject();
      state.spawnTimer = Math.max(.38, .82 - state.elapsed * .004) + Math.random() * .3;
    }
    state.invulnerable = Math.max(0, state.invulnerable - dt);
    state.player.x += (state.player.targetX - state.player.x) * Math.min(1, dt * 13);

    for (const object of state.objects) {
      object.y += state.speed * dt;
      object.rotation += object.spin * dt;
      const objectX = state.lanes[object.lane] + object.drift * Math.sin(object.y / 35);
      if (!object.checked && object.y > state.player.y - 17 && object.y < state.player.y + 17) {
        object.checked = true;
        if (object.lane === state.player.lane) {
          if (object.type === "orb") {
            state.collected += 1;
            state.score += 80;
            burst(objectX, object.y, "#b7ff72", 12);
          } else if (state.invulnerable <= 0) {
            state.lives -= 1;
            state.invulnerable = 1.1;
            burst(state.player.x, state.player.y, "#ff8e72", 15);
            if (state.lives <= 0) {
              updateHud();
              endGame();
              return;
            }
          }
          updateHud();
        }
      }
    }
    state.objects = state.objects.filter((object) => object.y < state.height + 35);

    for (const particle of state.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= Math.pow(.07, dt);
      particle.vy *= Math.pow(.07, dt);
      particle.life -= dt;
    }
    state.particles = state.particles.filter((particle) => particle.life > 0);
    updateHud();
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, state.height);
    gradient.addColorStop(0, "#091a13");
    gradient.addColorStop(.58, "#0b2016");
    gradient.addColorStop(1, "#07130f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);

    for (const star of state.stars) {
      ctx.globalAlpha = star.alpha * (.7 + Math.sin(state.elapsed * 1.7 + star.phase) * .3);
      ctx.fillStyle = "#d9ffbd";
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1;
    const glow = ctx.createRadialGradient(state.width / 2, state.height * .72, 0, state.width / 2, state.height * .72, state.width * .62);
    glow.addColorStop(0, "rgba(120, 255, 100, .075)");
    glow.addColorStop(1, "rgba(120, 255, 100, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, state.width, state.height);

    for (const x of state.lanes) {
      ctx.beginPath();
      ctx.setLineDash([2, 11]);
      ctx.strokeStyle = "rgba(183, 255, 114, .11)";
      ctx.lineWidth = 1;
      ctx.moveTo(x, 14);
      ctx.lineTo(x, state.height - 12);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    const horizon = state.height * .15;
    ctx.strokeStyle = "rgba(183, 255, 114, .13)";
    ctx.beginPath();
    ctx.moveTo(18, horizon);
    ctx.lineTo(31, horizon);
    ctx.moveTo(state.width - 31, horizon);
    ctx.lineTo(state.width - 18, horizon);
    ctx.stroke();
    ctx.fillStyle = "rgba(188, 219, 187, .5)";
    ctx.font = "8px 'DM Mono', monospace";
    ctx.fillText("NIGHT / 008", 18, horizon - 9);
    ctx.textAlign = "right";
    ctx.fillText(`${String(Math.floor(state.elapsed)).padStart(2, "0")} SEC`, state.width - 18, horizon - 9);
    ctx.textAlign = "left";
  }

  function drawHazard(object) {
    const x = state.lanes[object.lane] + object.drift * Math.sin(object.y / 35);
    ctx.save();
    ctx.translate(x, object.y);
    ctx.rotate(object.rotation);
    ctx.shadowColor = "#ff886a";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#ff9575";
    ctx.beginPath();
    ctx.moveTo(0, -object.size);
    ctx.lineTo(object.size * .72, -object.size * .25);
    ctx.lineTo(object.size * .52, object.size * .72);
    ctx.lineTo(-object.size * .58, object.size * .8);
    ctx.lineTo(-object.size * .9, -object.size * .2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff0c8";
    ctx.fillRect(-1.3, -2, 2.6, 4);
    ctx.restore();
  }

  function drawOrb(object) {
    ctx.save();
    ctx.translate(state.lanes[object.lane], object.y);
    ctx.shadowColor = "#b7ff72";
    ctx.shadowBlur = 19;
    ctx.fillStyle = "rgba(183, 255, 114, .2)";
    ctx.beginPath();
    ctx.arc(0, 0, object.size + 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d2ff95";
    ctx.beginPath();
    ctx.arc(0, 0, object.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f4ffdb";
    ctx.beginPath();
    ctx.arc(-2, -2, object.size * .35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPlayer() {
    if (state.invulnerable > 0 && Math.floor(state.invulnerable * 12) % 2 === 0) return;
    const { x, y } = state.player;
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = "#b7ff72";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#b7ff72";
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(11, 10);
    ctx.lineTo(0, 6);
    ctx.lineTo(-11, 10);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f3ffd9";
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(3.2, 3);
    ctx.lineTo(-3.2, 3);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = .7 + Math.random() * .25;
    ctx.fillStyle = "#e5ffad";
    ctx.beginPath();
    ctx.moveTo(-3, 10);
    ctx.lineTo(0, 15 + Math.random() * 6);
    ctx.lineTo(3, 10);
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    if (!state.width || !state.height) return;
    drawBackground();
    for (const object of state.objects) {
      if (object.type === "orb") drawOrb(object);
      else drawHazard(object);
    }
    for (const particle of state.particles) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    ctx.globalAlpha = 1;
    if (state.mode === "playing" || state.mode === "over") drawPlayer();
  }

  function frame(now) {
    if (state.mode !== "playing") return;
    const dt = Math.min((now - state.lastFrame) / 1000, .04);
    state.lastFrame = now;
    update(dt);
    draw();
    if (state.mode === "playing") requestAnimationFrame(frame);
  }

  function startFromOverlay() {
    if (state.mode !== "playing") startGame();
  }

  playButton.addEventListener("click", startFromOverlay);
  leftButton.addEventListener("click", () => move(-1));
  rightButton.addEventListener("click", () => move(1));
  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") move(-1);
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") move(1);
    if ((event.key === "Enter" || event.key === " ") && state.mode !== "playing") startFromOverlay();
  });

  let touchStartX = null;
  canvas.addEventListener("pointerdown", (event) => { touchStartX = event.clientX; });
  canvas.addEventListener("pointerup", (event) => {
    if (state.mode === "playing" && touchStartX !== null) {
      const delta = event.clientX - touchStartX;
      if (Math.abs(delta) > 18) move(delta > 0 ? 1 : -1);
      else {
        const rect = canvas.getBoundingClientRect();
        move(event.clientX < rect.left + rect.width / 2 ? -1 : 1);
      }
    }
    touchStartX = null;
  });
  canvas.addEventListener("pointercancel", () => { touchStartX = null; });

  new ResizeObserver(resize).observe(canvas);
  updateHud();
  resize();
})();
