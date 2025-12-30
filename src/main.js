import "./style.css";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const uiScore = document.getElementById("score");
const uiLives = document.getElementById("lives");
const uiCoins = document.getElementById("coins");
const uiBest = document.getElementById("best");
const uiMult = document.getElementById("mult");

const W = canvas.width;
const H = canvas.height;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const rng = (min, max) => min + Math.random() * (max - min);

const rectsOverlap = (a, b) =>
  a.x < b.x + b.w &&
  a.x + a.w > b.x &&
  a.y < b.y + b.h &&
  a.y + a.h > b.y;

const drawRoundedRect = (x, y, w, h, r) => {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
};

const keys = new Set();
window.addEventListener("keydown", (e) => {
  keys.add(e.key.toLowerCase());
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

const STORAGE_KEY = "catfish_meta_v1";

const loadMeta = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const saveMeta = (meta) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // ignore
  }
};

const defaultMeta = () => ({
  coins: 0,
  bestScore: 0,
  upgrades: {
    speed: 0,
    lives: 0,
    magnet: 0,
  },
});

const getUpgradeCost = (key, level) => {
  const base = { speed: 30, lives: 45, magnet: 35 }[key] ?? 40;
  return Math.floor(base * (1 + level * 0.65));
};

const CONFIG = {
  baseCatSpeed: 310,
  fishSpawnEvery: 0.85,
  dogSpawnEvery: 2.2,
  dogSpeedMin: 98,
  dogSpeedMax: 155,
  invulnSeconds: 1.0,
  maxFishOnMap: 10,
  maxDogsOnMap: 7,

  comboWindow: 2.6,
  comboMaxMult: 5.0,
  comboPerFish: 0.32,
  comboDecayPerSec: 0.55,

  goldenFishChance: 0.12,
  goldenFishScore: 6,
  goldenFishCoins: 5,
  fishScore: 1,
  fishCoins: 1,

  powerupChanceOnFish: 0.14,
  powerupDropCooldown: 0.6,
  magnetPull: 175,

  dashCooldown: 1.2,
  dashDuration: 0.12,
  dashSpeedBoost: 3.2,
};

const makeCat = (meta) => {
  const speedLevel = meta.upgrades.speed ?? 0;
  const livesLevel = meta.upgrades.lives ?? 0;

  return {
    x: W * 0.5 - 22,
    y: H * 0.5 - 22,
    w: 44,
    h: 44,
    vx: 0,
    vy: 0,
    invuln: 0,
    shield: 0,
    baseSpeed: CONFIG.baseCatSpeed + speedLevel * 25,
    dashCd: 0,
    dashT: 0,
    startLives: 3 + livesLevel,
  };
};

const makeFish = () => {
  const golden = Math.random() < CONFIG.goldenFishChance;
  return {
    kind: "fish",
    golden,
    x: rng(24, W - 50),
    y: rng(24, H - 50),
    w: golden ? 32 : 26,
    h: golden ? 22 : 18,
    bob: rng(0, Math.PI * 2),
  };
};

const makeDog = () => {
  const fromEdge = Math.floor(rng(0, 4));
  const size = 44;
  let x = 0;
  let y = 0;

  if (fromEdge === 0) {
    x = -size;
    y = rng(0, H - size);
  } else if (fromEdge === 1) {
    x = W + size;
    y = rng(0, H - size);
  } else if (fromEdge === 2) {
    x = rng(0, W - size);
    y = -size;
  } else {
    x = rng(0, W - size);
    y = H + size;
  }

  return {
    kind: "dog",
    x,
    y,
    w: size,
    h: size,
    speed: rng(CONFIG.dogSpeedMin, CONFIG.dogSpeedMax),
  };
};

const makePowerup = (x, y, type) => ({
  kind: "power",
  type, // "magnet" | "shield"
  x: clamp(x, 16, W - 30),
  y: clamp(y, 16, H - 30),
  w: 28,
  h: 28,
  t: 0,
});

const pickRandomPowerup = () => (Math.random() < 0.55 ? "magnet" : "shield");

const state = {
  meta: loadMeta() ?? defaultMeta(),

  running: true,
  paused: false,

  score: 0,
  lives: 3,
  coinsEarnedThisRun: 0,

  mult: 1.0,
  comboT: 0,

  cat: null,
  fish: [],
  dogs: [],
  powerups: [],

  fishTimer: 0,
  dogTimer: 0,
  powerDropCd: 0,

  difficultyT: 0,
};

const syncHud = () => {
  uiScore.textContent = String(state.score);
  uiLives.textContent = String(state.lives);
  uiCoins.textContent = String(state.meta.coins);
  uiBest.textContent = String(state.meta.bestScore);
  uiMult.textContent = state.mult.toFixed(1);
};

const awardCoins = (n) => {
  state.meta.coins += n;
  state.coinsEarnedThisRun += n;
  saveMeta(state.meta);
};

const resetGame = () => {
  state.running = true;
  state.paused = false;

  state.score = 0;
  state.coinsEarnedThisRun = 0;

  state.mult = 1.0;
  state.comboT = 0;

  state.cat = makeCat(state.meta);
  state.lives = state.cat.startLives;

  state.fish = [makeFish(), makeFish()];
  state.dogs = [];
  state.powerups = [];

  state.fishTimer = 0;
  state.dogTimer = 0;
  state.powerDropCd = 0;

  state.difficultyT = 0;

  syncHud();
};

const readMovement = () => {
  const up = keys.has("w") || keys.has("arrowup");
  const down = keys.has("s") || keys.has("arrowdown");
  const left = keys.has("a") || keys.has("arrowleft");
  const right = keys.has("d") || keys.has("arrowright");

  const dx = (right ? 1 : 0) - (left ? 1 : 0);
  const dy = (down ? 1 : 0) - (up ? 1 : 0);

  let mx = dx;
  let my = dy;

  const len = Math.hypot(mx, my);
  if (len > 0) {
    mx /= len;
    my /= len;
  }

  return { mx, my };
};

const canDash = (cat) => cat.dashCd <= 0 && cat.dashT <= 0;

const updateCombo = (dt) => {
  state.comboT = Math.max(0, state.comboT - dt);
  if (state.comboT <= 0) {
    state.mult = clamp(state.mult - CONFIG.comboDecayPerSec * dt, 1.0, CONFIG.comboMaxMult);
  }
};

const addCombo = (amount) => {
  state.comboT = CONFIG.comboWindow;
  state.mult = clamp(state.mult + amount, 1.0, CONFIG.comboMaxMult);
  uiMult.textContent = state.mult.toFixed(1);
};

const addScore = (base) => {
  const added = Math.round(base * state.mult);
  state.score += added;
  uiScore.textContent = String(state.score);
  if (state.score > state.meta.bestScore) {
    state.meta.bestScore = state.score;
    saveMeta(state.meta);
    uiBest.textContent = String(state.meta.bestScore);
  }
};

const applyPowerup = (cat, type) => {
  if (type === "magnet") {
    const magnetLevel = state.meta.upgrades.magnet ?? 0;
    cat.magnetT = 3.0 + magnetLevel * 0.85;
  } else if (type === "shield") {
    cat.shield = 1;
  }
};

const buyUpgrade = (key) => {
  const lvl = state.meta.upgrades[key] ?? 0;
  const cost = getUpgradeCost(key, lvl);
  if (state.meta.coins < cost) return false;
  state.meta.coins -= cost;
  state.meta.upgrades[key] = lvl + 1;
  saveMeta(state.meta);
  syncHud();
  return true;
};

const update = (dt) => {
  if (keys.has("r")) resetGame();
  if (keys.has("p")) {
    keys.delete("p");
    state.paused = !state.paused;
  }

  if (!state.running) {
    if (keys.has("1")) { keys.delete("1"); buyUpgrade("speed"); }
    if (keys.has("2")) { keys.delete("2"); buyUpgrade("lives"); }
    if (keys.has("3")) { keys.delete("3"); buyUpgrade("magnet"); }
    if (keys.has("enter")) { keys.delete("enter"); resetGame(); }
    return;
  }

  if (state.paused) return;

  const cat = state.cat;

  state.difficultyT += dt;
  const difficultyBoost = Math.min(1.0, state.difficultyT / 120);

  if (cat.invuln > 0) cat.invuln = Math.max(0, cat.invuln - dt);
  if (cat.dashCd > 0) cat.dashCd = Math.max(0, cat.dashCd - dt);
  if (cat.dashT > 0) cat.dashT = Math.max(0, cat.dashT - dt);
  if (cat.magnetT > 0) cat.magnetT = Math.max(0, cat.magnetT - dt);

  updateCombo(dt);

  const { mx, my } = readMovement();

  if (keys.has(" ") && canDash(cat) && (mx !== 0 || my !== 0)) {
    cat.dashT = CONFIG.dashDuration;
    cat.dashCd = CONFIG.dashCooldown;
  }

  const speedMult = cat.dashT > 0 ? CONFIG.dashSpeedBoost : 1.0;
  cat.vx = mx * cat.baseSpeed * speedMult;
  cat.vy = my * cat.baseSpeed * speedMult;

  cat.x = clamp(cat.x + cat.vx * dt, 10, W - cat.w - 10);
  cat.y = clamp(cat.y + cat.vy * dt, 10, H - cat.h - 10);

  state.fishTimer += dt;
  const fishEvery = clamp(CONFIG.fishSpawnEvery - difficultyBoost * 0.18, 0.55, 0.95);
  if (state.fishTimer >= fishEvery) {
    state.fishTimer = 0;
    if (state.fish.length < CONFIG.maxFishOnMap) state.fish.push(makeFish());
  }

  state.dogTimer += dt;
  const dogEvery = clamp(CONFIG.dogSpawnEvery - difficultyBoost * 0.45, 1.35, 2.3);
  if (state.dogTimer >= dogEvery) {
    state.dogTimer = 0;
    if (state.dogs.length < CONFIG.maxDogsOnMap) state.dogs.push(makeDog());
  }

  for (const d of state.dogs) {
    const cx = cat.x + cat.w / 2;
    const cy = cat.y + cat.h / 2;
    const dx = cx - (d.x + d.w / 2);
    const dy = cy - (d.y + d.h / 2);
    const len = Math.hypot(dx, dy) || 1;
    const speed = d.speed * (1 + difficultyBoost * 0.35);
    d.x += (dx / len) * speed * dt;
    d.y += (dy / len) * speed * dt;
  }

  for (const f of state.fish) f.bob += dt * 3.2;
  for (const p of state.powerups) p.t += dt;

  state.powerDropCd = Math.max(0, state.powerDropCd - dt);

  if (cat.magnetT > 0) {
    for (const f of state.fish) {
      const cx = cat.x + cat.w / 2;
      const cy = cat.y + cat.h / 2;
      const fx = f.x + f.w / 2;
      const fy = f.y + f.h / 2;
      const dx = cx - fx;
      const dy = cy - fy;
      const dist = Math.hypot(dx, dy);
      if (!dist || dist > 220) continue;
      const pull = CONFIG.magnetPull * (1 + (state.meta.upgrades.magnet ?? 0) * 0.08);
      f.x = clamp(f.x + (dx / dist) * pull * dt, 12, W - f.w - 12);
      f.y = clamp(f.y + (dy / dist) * pull * dt, 12, H - f.h - 12);
    }
  }

  // fish pickup
  for (let i = state.fish.length - 1; i >= 0; i--) {
    const f = state.fish[i];
    if (!rectsOverlap(cat, f)) continue;

    state.fish.splice(i, 1);

    if (f.golden) {
      addScore(CONFIG.goldenFishScore);
      awardCoins(CONFIG.goldenFishCoins);
      addCombo(CONFIG.comboPerFish * 2.0);
      state.comboT = Math.min(CONFIG.comboWindow + 0.6, state.comboT + 0.8);
    } else {
      addScore(CONFIG.fishScore);
      awardCoins(CONFIG.fishCoins);
      addCombo(CONFIG.comboPerFish);
    }

    if (state.powerDropCd <= 0 && Math.random() < CONFIG.powerupChanceOnFish) {
      state.powerDropCd = CONFIG.powerupDropCooldown;
      state.powerups.push(makePowerup(f.x, f.y, pickRandomPowerup()));
    }
  }

  // powerup pickup
  for (let i = state.powerups.length - 1; i >= 0; i--) {
    const p = state.powerups[i];
    if (rectsOverlap(cat, p)) {
      applyPowerup(cat, p.type);
      state.powerups.splice(i, 1);
      addCombo(0.25);
    }
  }

  // dog hit
  if (cat.invuln <= 0) {
    for (const d of state.dogs) {
      if (!rectsOverlap(cat, d)) continue;

      if (cat.shield > 0) {
        cat.shield = 0;
        cat.invuln = 0.55;
        addCombo(0.15);
        break;
      }

      state.lives -= 1;
      uiLives.textContent = String(state.lives);

      cat.invuln = CONFIG.invulnSeconds;
      state.mult = Math.max(1.0, state.mult - 0.8);
      uiMult.textContent = state.mult.toFixed(1);
      state.comboT = 0;

      const knockX = cat.x - d.x;
      const knockY = cat.y - d.y;
      const kLen = Math.hypot(knockX, knockY) || 1;
      cat.x = clamp(cat.x + (knockX / kLen) * 50, 10, W - cat.w - 10);
      cat.y = clamp(cat.y + (knockY / kLen) * 50, 10, H - cat.h - 10);

      if (state.lives <= 0) {
        state.running = false;
        saveMeta(state.meta);
      }
      break;
    }
  }
};

const drawBackground = () => {
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y <= H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.strokeStyle = "white";
  ctx.stroke();
  ctx.restore();

  const g = ctx.createRadialGradient(W * 0.5, H * 0.35, 80, W * 0.5, H * 0.5, 560);
  g.addColorStop(0, "rgba(255,255,255,0.10)");
  g.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
};

const drawFish = (f) => {
  const y = f.y + Math.sin(f.bob) * 3;

  ctx.save();
  ctx.translate(f.x, y);

  drawRoundedRect(0, 0, f.w, f.h, 6);
  ctx.fillStyle = f.golden ? "rgba(255, 235, 140, 0.9)" : "rgba(255,255,255,0.85)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, f.h / 2);
  ctx.lineTo(-10, 2);
  ctx.lineTo(-10, f.h - 2);
  ctx.closePath();
  ctx.fillStyle = f.golden ? "rgba(255, 235, 140, 0.65)" : "rgba(255,255,255,0.65)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(f.w - 7, f.h / 2 - 2, 2.2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fill();

  ctx.restore();

  ctx.save();
  ctx.font = f.golden ? "20px ui-sans-serif, system-ui" : "18px ui-sans-serif, system-ui";
  ctx.globalAlpha = 0.95;
  ctx.fillText(f.golden ? "🐟✨" : "🐟", f.x - 2, y + 16);
  ctx.restore();
};

const drawDog = (d) => {
  ctx.save();
  ctx.translate(d.x, d.y);

  drawRoundedRect(0, 0, d.w, d.h, 12);
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fill();

  ctx.font = "34px ui-sans-serif, system-ui";
  ctx.globalAlpha = 0.95;
  ctx.fillText("🐶", 5, 36);

  ctx.restore();
};

const drawPowerup = (p) => {
  const bounce = Math.sin(p.t * 5) * 2;
  ctx.save();
  ctx.translate(p.x, p.y + bounce);

  drawRoundedRect(0, 0, p.w, p.h, 10);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fill();

  ctx.font = "20px ui-sans-serif, system-ui";
  ctx.globalAlpha = 0.95;
  ctx.fillText(p.type === "magnet" ? "🧲" : "🛡️", 4, 22);

  ctx.restore();
};

const drawCat = (cat) => {
  const blink = cat.invuln > 0 && Math.floor(cat.invuln * 16) % 2 === 0;

  ctx.save();
  ctx.translate(cat.x, cat.y);

  drawRoundedRect(0, 0, cat.w, cat.h, 14);
  ctx.fillStyle = blink ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.16)";
  ctx.fill();

  ctx.font = "34px ui-sans-serif, system-ui";
  ctx.globalAlpha = blink ? 0.25 : 0.98;
  ctx.fillText("🐱", 5, 36);

  if (cat.shield > 0) {
    ctx.globalAlpha = 0.8;
    ctx.font = "18px ui-sans-serif, system-ui";
    ctx.fillText("🛡️", 26, 16);
  }
  if (cat.magnetT > 0) {
    ctx.globalAlpha = 0.8;
    ctx.font = "18px ui-sans-serif, system-ui";
    ctx.fillText("🧲", 6, 16);
  }

  ctx.restore();
};

const drawComboBar = () => {
  const w = 220;
  const h = 10;
  const x = 16;
  const y = 16;
  const t = clamp(state.comboT / CONFIG.comboWindow, 0, 1);

  ctx.save();
  ctx.globalAlpha = 0.8;
  drawRoundedRect(x, y, w, h, 6);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.stroke();

  ctx.globalAlpha = 0.9;
  drawRoundedRect(x, y, w * t, h, 6);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fill();

  ctx.globalAlpha = 0.85;
  ctx.font = "12px ui-sans-serif, system-ui";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(`Combo x${state.mult.toFixed(1)}`, x, y + 26);

  ctx.restore();
};

const drawShopOverlay = () => {
  const meta = state.meta;
  const u = meta.upgrades;

  const speedCost = getUpgradeCost("speed", u.speed ?? 0);
  const livesCost = getUpgradeCost("lives", u.lives ?? 0);
  const magnetCost = getUpgradeCost("magnet", u.magnet ?? 0);

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "800 44px ui-sans-serif, system-ui";
  ctx.fillText("Game Over", W / 2, 150);

  ctx.font = "18px ui-sans-serif, system-ui";
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.fillText(`Score: ${state.score}  •  Best: ${meta.bestScore}`, W / 2, 185);
  ctx.fillText(`Coins: ${meta.coins} (earned this run: +${state.coinsEarnedThisRun})`, W / 2, 210);

  ctx.font = "700 22px ui-sans-serif, system-ui";
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.fillText("Upgrade Shop (press 1 / 2 / 3)", W / 2, 270);

  ctx.font = "18px ui-sans-serif, system-ui";
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.fillText(`1) Speed +25   (lvl ${u.speed ?? 0})   Cost: ${speedCost}`, W / 2, 305);
  ctx.fillText(`2) Start Lives +1 (lvl ${u.lives ?? 0}) Cost: ${livesCost}`, W / 2, 335);
  ctx.fillText(`3) Magnet +0.85s  (lvl ${u.magnet ?? 0}) Cost: ${magnetCost}`, W / 2, 365);

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("Press ENTER to play again • R to hard reset run", W / 2, 420);

  ctx.restore();
};

const drawPaused = () => {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.textAlign = "center";
  ctx.font = "800 40px ui-sans-serif, system-ui";
  ctx.fillText("Paused", W / 2, H / 2 - 10);
  ctx.font = "18px ui-sans-serif, system-ui";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("Press P to resume", W / 2, H / 2 + 25);
  ctx.restore();
};

const render = () => {
  ctx.clearRect(0, 0, W, H);
  drawBackground();

  for (const f of state.fish) drawFish(f);
  for (const p of state.powerups) drawPowerup(p);
  for (const d of state.dogs) drawDog(d);
  drawCat(state.cat);
  drawComboBar();

  if (state.paused) drawPaused();
  if (!state.running) drawShopOverlay();
};

let last = performance.now();
const loop = (t) => {
  const dt = Math.min(0.033, (t - last) / 1000);
  last = t;

  update(dt);
  render();

  requestAnimationFrame(loop);
};

resetGame();
requestAnimationFrame(loop);
