import "./style.css";

// --- Canvas setup (high-DPI for crisp rendering) ---
const canvas = document.getElementById("game");
let ctx;
try {
  ctx = canvas.getContext("2d", {
    alpha: true,
    desynchronized: true,
  });
} catch (_) {
  ctx = canvas.getContext("2d");
}
if (!ctx) throw new Error("Canvas 2D not supported");
const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
canvas.width = 900 * dpr;
canvas.height = 520 * dpr;
ctx.scale(dpr, dpr);

const W = 900;
const H = 520;

const uiScore = document.getElementById("score");
const uiLives = document.getElementById("lives");
const uiCoins = document.getElementById("coins");
const uiBest = document.getElementById("best");
const uiMult = document.getElementById("mult");

// Cached font strings (sans-serif)
const FONT = {
  combo: "12px sans-serif",
  small: "18px sans-serif",
  medium: "20px sans-serif",
  large: "34px sans-serif",
  title: "400 44px sans-serif",
  subtitle: "400 22px sans-serif",
  pause: "400 40px sans-serif",
};

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

// Touch position in canvas coordinates (null when not touching)
let touchPos = null;
let lastTapTime = 0;
let touchDashTrigger = false;

const getCanvasCoords = (clientX, clientY) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * W,
    y: ((clientY - rect.top) / rect.height) * H,
  };
};

canvas.addEventListener("touchstart", (e) => {
  if (e.cancelable) e.preventDefault();
  const t = e.touches[0];
  if (t) {
    touchPos = getCanvasCoords(t.clientX, t.clientY);
    const now = performance.now();
    if (now - lastTapTime < 400) touchDashTrigger = true;
    lastTapTime = now;
  }
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
  if (e.cancelable) e.preventDefault();
  const t = e.touches[0];
  if (t) touchPos = getCanvasCoords(t.clientX, t.clientY);
}, { passive: false });

canvas.addEventListener("touchend", (e) => {
  if (e.touches.length === 0) touchPos = null;
});
canvas.addEventListener("touchcancel", () => { touchPos = null; });

// Tap/click: tutorial dismiss, restart (game over), or resume (paused)
canvas.addEventListener("click", (e) => {
  if (state.showTutorial) {
    state.showTutorial = false;
    state.paused = false;
    state.meta.hasSeenTutorial = true;
    saveMeta(state.meta);
    SOUND.click();
    if (state.meta.settings?.music) { startMusic(); setMusicVolume(0.08); }
    return;
  }
  if (!state.running) {
    touchPos = null;
    resetGame();
    SOUND.click();
    if (state.meta.settings?.music) { startMusic(); setMusicVolume(0.08); }
  } else if (state.paused) {
    state.paused = false;
    setMusicVolume(0.08);
    SOUND.click();
  }
});

// Pause when tab is hidden (saves battery, avoids runaway state)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && state.running && !state.paused) {
    state.paused = true;
  }
});

window.addEventListener("keydown", (e) => {
  keys.add(e.key.toLowerCase());
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

const STORAGE_KEY = "catfish_meta_v2";

const loadMeta = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// --- Sound (Web Audio, no external files) ---
let audioCtx = null;
let musicGain = null;
let sfxGain = null;
let musicOsc = null;
let musicStarted = false;

const initAudio = () => {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  musicGain = audioCtx.createGain();
  musicGain.gain.value = 0;
  musicGain.connect(audioCtx.destination);
  sfxGain = audioCtx.createGain();
  sfxGain.gain.value = 1;
  sfxGain.connect(audioCtx.destination);
};

const playTone = (freq, duration, type = "sine", vol = 0.1) => {
  if (state.meta.settings?.sfx === false) return;
  initAudio();
  if (audioCtx.state === "suspended") audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.connect(g);
  g.connect(sfxGain);
  osc.frequency.value = freq;
  osc.type = type;
  g.gain.setValueAtTime(0, audioCtx.currentTime);
  g.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + duration);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
};

const SOUND = {
  collect: () => playTone(392, 0.14, "sine", 0.08),
  golden: () => { playTone(523, 0.12, "sine", 0.09); playTone(659, 0.16, "sine", 0.07); },
  powerup: () => playTone(440, 0.18, "sine", 0.08),
  hit: () => playTone(220, 0.2, "sine", 0.06),
  dash: () => playTone(330, 0.08, "sine", 0.05),
  newBest: () => { playTone(440, 0.15, "sine", 0.07); playTone(554, 0.15, "sine", 0.06); playTone(659, 0.2, "sine", 0.07); },
  click: () => playTone(262, 0.06, "sine", 0.05),
};

const startMusic = () => {
  if (!state.meta.settings?.music) return;
  initAudio();
  if (audioCtx.state === "suspended") audioCtx.resume();
  if (musicStarted) return;
  musicStarted = true;
  musicGain.gain.setValueAtTime(0.07, audioCtx.currentTime);
  const melody = [
    261.63, 329.63, 392, 261.63,
    220, 261.63, 329.63, 196,
    261.63, 329.63, 392, 440, 392, 329.63,
    261.63, 196, 261.63,
  ];
  let idx = 0;
  const schedule = () => {
    if (!state.meta.settings?.music) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(musicGain);
    o.type = "sine";
    o.frequency.value = melody[idx % melody.length] * 0.5;
    const t = audioCtx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.25, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.008, t + 2.4);
    o.start(t);
    o.stop(t + 2.4);
    idx++;
    setTimeout(schedule, 1600);
  };
  schedule();
};
const setMusicVolume = (v) => {
  if (musicGain) musicGain.gain.setTargetAtTime(v, audioCtx?.currentTime ?? 0, 0.1);
};

let saveMetaTimer = null;
const saveMeta = (meta) => {
  try {
    if (saveMetaTimer) clearTimeout(saveMetaTimer);
    saveMetaTimer = setTimeout(() => {
      saveMetaTimer = null;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
    }, 80);
  } catch {
    // ignore
  }
};

const defaultMeta = () => ({
  coins: 0,
  bestScore: 0,
  upgrades: { speed: 0, lives: 0, magnet: 0 },
  settings: { sfx: true, music: true },
  hasSeenTutorial: false,
  achievements: {},
  leaderboard: [],
  catSkin: 0,
  background: 0,
  totalGamesPlayed: 0,
});

const getUpgradeCost = (key, level) => {
  const base = { speed: 30, lives: 45, magnet: 35 }[key] ?? 40;
  return Math.floor(base * (1 + level * 0.65));
};

const CONFIG = {
  baseCatSpeed: 400,
  fishSpawnEvery: 0.85,
  dogSpawnEvery: 2.2,
  dogSpeedMin: 72,
  dogSpeedMax: 118,
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

const CAT_SKINS = [
  { emoji: "🐱", cost: 0 },
  { emoji: "😺", cost: 30 },
  { emoji: "🐈", cost: 40 },
  { emoji: "😸", cost: 50 },
];
const getCatEmoji = () => CAT_SKINS[state.meta.catSkin ?? 0]?.emoji ?? "🐱";

const state = {
  meta: (() => {
    const m = loadMeta();
    if (!m) return defaultMeta();
    const d = defaultMeta();
    return {
      ...d,
      ...m,
      upgrades: { ...d.upgrades, ...(m.upgrades || {}) },
      settings: { ...d.settings, ...(m.settings || {}) },
      achievements: { ...(m.achievements || {}) },
      leaderboard: Array.isArray(m.leaderboard) ? m.leaderboard : d.leaderboard,
    };
  })(),

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

  particles: [],
  newBestFlash: 0,
  showTutorial: false,
  showSettings: false,

  runStats: { goldenCollected: 0, startTime: 0, lastHitTime: 0, survived60NoHit: false },
};

// Only update DOM when values change (reduces layout thrashing)
let lastHud = { score: -1, lives: -1, coins: -1, best: -1, mult: "" };
const syncHud = () => {
  const s = String(state.score);
  if (lastHud.score !== s) {
    lastHud.score = s;
    uiScore.textContent = s;
  }
  uiScore.classList.toggle("score-blink", state.newBestFlash > 0);
  const l = String(state.lives);
  if (lastHud.lives !== l) {
    lastHud.lives = l;
    uiLives.textContent = l;
  }
  const c = String(state.meta.coins);
  if (lastHud.coins !== c) {
    lastHud.coins = c;
    uiCoins.textContent = c;
  }
  const b = String(state.meta.bestScore);
  if (lastHud.best !== b) {
    lastHud.best = b;
    uiBest.textContent = b;
  }
  const m = state.mult.toFixed(1);
  if (lastHud.mult !== m) {
    lastHud.mult = m;
    uiMult.textContent = m;
  }
  const comboBar = document.getElementById("combo-bar");
  if (comboBar) {
    const pct = Math.min(100, (state.comboT / CONFIG.comboWindow) * 100);
    comboBar.style.width = pct + "%";
    comboBar.setAttribute("aria-valuenow", Math.round(pct));
  }
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
  state.particles = [];
  state.newBestFlash = 0;
  state.runStats = {
    goldenCollected: 0,
    startTime: performance.now() / 1000,
    lastHitTime: -999,
    survived60NoHit: false,
    maxComboReached: 0,
  };
  if (!state.meta.hasSeenTutorial) {
    state.showTutorial = true;
    state.paused = true;
  }
  state.meta.totalGamesPlayed = (state.meta.totalGamesPlayed || 0) + 1;
  saveMeta(state.meta);
  syncHud();
  if (musicGain) setMusicVolume(state.paused ? 0.03 : 0.08);
};

const readMovement = () => {
  // Touch: move toward touch point (smooth analog-like direction)
  if (touchPos && state.cat) {
    const cx = state.cat.x + state.cat.w / 2;
    const cy = state.cat.y + state.cat.h / 2;
    let dx = touchPos.x - cx;
    let dy = touchPos.y - cy;
    const len = Math.hypot(dx, dy);
    const deadzone = 18;
    if (len > deadzone) {
      return { mx: dx / len, my: dy / len };
    }
    return { mx: 0, my: 0 };
  }

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
};

const spawnParticle = (x, y, text) => {
  state.particles.push({
    x: x + rng(-8, 8),
    y,
    text,
    t: 0,
    vy: -85,
    life: 0.9,
  });
};

const addScore = (base) => {
  const added = Math.round(base * state.mult);
  const wasBest = state.meta.bestScore;
  state.score += added;
  if (state.score > state.meta.bestScore) {
    state.meta.bestScore = state.score;
    saveMeta(state.meta);
    if (wasBest > 0) {
      state.newBestFlash = 1.4;
      SOUND.newBest();
    }
  }
  if (state.runStats) state.runStats.maxComboReached = Math.max(state.runStats.maxComboReached || 0, state.mult);
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
  checkAchievements();
  return true;
};

const CHALLENGES = [
  { id: "golden5", goal: 5, check: () => state.runStats.goldenCollected >= 5, reward: 20 },
  { id: "survive60", check: () => state.runStats.survived60NoHit, reward: 15 },
];
const awardChallenges = () => {
  const key = "challengesCompleted";
  if (!state.meta[key]) state.meta[key] = {};
  for (const c of CHALLENGES) {
    if (state.meta[key][c.id]) continue;
    if (c.check()) {
      state.meta[key][c.id] = true;
      awardCoins(c.reward);
    }
  }
  saveMeta(state.meta);
};

const LEADERBOARD_MAX = 5;
const updateLeaderboard = (score) => {
  const lb = state.meta.leaderboard || [];
  const entry = { score, date: Date.now() };
  const next = [...lb, entry].sort((a, b) => b.score - a.score).slice(0, LEADERBOARD_MAX);
  state.meta.leaderboard = next;
  saveMeta(state.meta);
};

const ACHIEVEMENTS = [
  { id: "first100", check: () => state.meta.bestScore >= 100, reward: 10 },
  { id: "combo3", check: () => (state.meta.achievements?.maxCombo ?? 0) >= 3, reward: 15 },
  { id: "allUpgrades", check: () => {
    const u = state.meta.upgrades || {};
    return (u.speed ?? 0) >= 1 && (u.lives ?? 0) >= 1 && (u.magnet ?? 0) >= 1;
  }, reward: 25 },
  { id: "games10", check: () => (state.meta.totalGamesPlayed || 0) >= 10, reward: 10 },
];
const checkAchievements = () => {
  if (!state.meta.achievements) state.meta.achievements = {};
  const maxCombo = state.runStats?.maxComboReached ?? state.meta.achievements.maxCombo ?? 0;
  state.meta.achievements.maxCombo = Math.max(state.meta.achievements.maxCombo ?? 0, maxCombo);
  for (const a of ACHIEVEMENTS) {
    if (state.meta.achievements[a.id]) continue;
    if (a.check()) {
      state.meta.achievements[a.id] = true;
      awardCoins(a.reward);
    }
  }
  saveMeta(state.meta);
};

const update = (dt) => {
  if (keys.has("r")) resetGame();
  if (keys.has("p")) {
    keys.delete("p");
    state.paused = !state.paused;
    setMusicVolume(state.paused ? 0.03 : 0.08);
  }

  if (!state.running) {
    if (keys.has("1")) { keys.delete("1"); buyUpgrade("speed"); SOUND.click(); }
    if (keys.has("2")) { keys.delete("2"); buyUpgrade("lives"); SOUND.click(); }
    if (keys.has("3")) { keys.delete("3"); buyUpgrade("magnet"); SOUND.click(); }
    if (keys.has("4")) {
      keys.delete("4");
      state.meta.catSkin = ((state.meta.catSkin ?? 0) - 1 + CAT_SKINS.length) % CAT_SKINS.length;
      saveMeta(state.meta);
      SOUND.click();
    }
    if (keys.has("5")) {
      keys.delete("5");
      state.meta.catSkin = ((state.meta.catSkin ?? 0) + 1) % CAT_SKINS.length;
      saveMeta(state.meta);
      SOUND.click();
    }
    if (keys.has("enter")) { keys.delete("enter"); resetGame(); }
    return;
  }

  if (state.paused) {
    syncHud();
    return;
  }

  const cat = state.cat;

  state.difficultyT += dt;
  const difficultyBoost = Math.min(1.0, state.difficultyT / 120);

  if (cat.invuln > 0) cat.invuln = Math.max(0, cat.invuln - dt);
  if (cat.dashCd > 0) cat.dashCd = Math.max(0, cat.dashCd - dt);
  if (cat.dashT > 0) cat.dashT = Math.max(0, cat.dashT - dt);
  if (cat.magnetT > 0) cat.magnetT = Math.max(0, cat.magnetT - dt);

  updateCombo(dt);

  const { mx, my } = readMovement();

  if ((keys.has(" ") || touchDashTrigger) && canDash(cat) && (mx !== 0 || my !== 0)) {
    cat.dashT = CONFIG.dashDuration;
    cat.dashCd = CONFIG.dashCooldown;
    touchDashTrigger = false;
    SOUND.dash();
  }

  const speedMult = cat.dashT > 0 ? CONFIG.dashSpeedBoost : 1.0;
  const targetVx = mx * cat.baseSpeed * speedMult;
  const targetVy = my * cat.baseSpeed * speedMult;
  const lerp = 12 * dt;
  cat.vx += (targetVx - cat.vx) * lerp;
  cat.vy += (targetVy - cat.vy) * lerp;

  cat.x = clamp(cat.x + cat.vx * dt, 10, W - cat.w - 10);
  cat.y = clamp(cat.y + cat.vy * dt, 10, H - cat.h - 10);
  cat.bobTime = (cat.bobTime ?? 0) + dt;

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

    const cx = f.x + f.w / 2;
    const cy = f.y + f.h / 2;
    state.fish.splice(i, 1);

    if (f.golden) {
      spawnParticle(cx, cy, "+" + String(Math.round(CONFIG.goldenFishScore * state.mult)));
      SOUND.golden();
      state.runStats.goldenCollected++;
      addScore(CONFIG.goldenFishScore);
      awardCoins(CONFIG.goldenFishCoins);
      addCombo(CONFIG.comboPerFish * 2.0);
      state.comboT = Math.min(CONFIG.comboWindow + 0.6, state.comboT + 0.8);
    } else {
      spawnParticle(cx, cy, "+" + String(Math.round(CONFIG.fishScore * state.mult)));
      SOUND.collect();
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
      SOUND.powerup();
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
      state.runStats.lastHitTime = state.difficultyT;
      SOUND.hit();

      cat.invuln = CONFIG.invulnSeconds;
      state.mult = Math.max(1.0, state.mult - 0.8);
      state.comboT = 0;

      const knockX = cat.x - d.x;
      const knockY = cat.y - d.y;
      const kLen = Math.hypot(knockX, knockY) || 1;
      cat.x = clamp(cat.x + (knockX / kLen) * 50, 10, W - cat.w - 10);
      cat.y = clamp(cat.y + (knockY / kLen) * 50, 10, H - cat.h - 10);

      if (state.lives <= 0) {
        state.running = false;
        saveMeta(state.meta);
        awardChallenges();
        updateLeaderboard(state.score);
        checkAchievements();
      }
      break;
    }
  }

  // Challenges: survive 60s without hit (reward awarded in awardChallenges on game over)
  if (!state.runStats.survived60NoHit && state.difficultyT >= 60 && (state.difficultyT - state.runStats.lastHitTime) >= 60) {
    state.runStats.survived60NoHit = true;
  }

  // Particles
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.t += dt;
    p.y += p.vy * dt;
    p.vy *= 0.96;
    if (p.t >= p.life) state.particles.splice(i, 1);
  }

  // New-best flash decay
  if (state.newBestFlash > 0) state.newBestFlash = Math.max(0, state.newBestFlash - dt);

  syncHud();
};

// --- Sea theme: offscreen background (drawn once) ---
const backgroundCanvas = document.createElement("canvas");
backgroundCanvas.width = W;
backgroundCanvas.height = H;
const bgCtx = backgroundCanvas.getContext("2d");
(function drawBackgroundToBuffer() {
  // Deep sea gradient: surface (lighter) to depth (darker teal/blue)
  const seaGrad = bgCtx.createLinearGradient(0, 0, 0, H);
  seaGrad.addColorStop(0, "#4dd0e1");
  seaGrad.addColorStop(0.25, "#26c6da");
  seaGrad.addColorStop(0.5, "#00acc1");
  seaGrad.addColorStop(0.75, "#0097a7");
  seaGrad.addColorStop(1, "#006064");
  bgCtx.fillStyle = seaGrad;
  bgCtx.fillRect(0, 0, W, H);

  // Sun rays from above (light through water)
  const rayGrad = bgCtx.createRadialGradient(W * 0.5, 0, 0, W * 0.5, 0, 500);
  rayGrad.addColorStop(0, "rgba(255,255,255,0.18)");
  rayGrad.addColorStop(0.4, "rgba(255,255,255,0.06)");
  rayGrad.addColorStop(1, "rgba(0,0,0,0)");
  bgCtx.fillStyle = rayGrad;
  bgCtx.fillRect(0, 0, W, H);

  // Subtle grid (like underwater light lines)
  bgCtx.save();
  bgCtx.globalAlpha = 0.12;
  bgCtx.strokeStyle = "rgba(255,255,255,0.9)";
  bgCtx.beginPath();
  for (let x = 0; x <= W; x += 45) { bgCtx.moveTo(x, 0); bgCtx.lineTo(x, H); }
  for (let y = 0; y <= H; y += 45) { bgCtx.moveTo(0, y); bgCtx.lineTo(W, y); }
  bgCtx.stroke();
  bgCtx.restore();

  // Soft bubbles (static)
  bgCtx.fillStyle = "rgba(255,255,255,0.08)";
  for (let i = 0; i < 24; i++) {
    const bx = (i * 137 + 31) % (W + 40) - 20;
    const by = (i * 89 + 17) % (H + 40) - 20;
    const r = 4 + (i % 3) * 2;
    bgCtx.beginPath();
    bgCtx.arc(bx, by, r, 0, Math.PI * 2);
    bgCtx.fill();
  }
})();

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
  ctx.fillStyle = "rgba(0,40,60,0.7)";
  ctx.fill();

  ctx.restore();

  ctx.save();
  ctx.font = f.golden ? FONT.medium : FONT.small;
  ctx.globalAlpha = 0.95;
  ctx.fillText(f.golden ? "🐟✨" : "🐟", f.x - 2, y + 16);
  ctx.restore();
};

const drawDog = (d) => {
  ctx.save();
  ctx.translate(d.x, d.y);

  drawRoundedRect(0, 0, d.w, d.h, 12);
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.fill();

  ctx.font = FONT.large;
  ctx.globalAlpha = 1;
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

  ctx.font = FONT.medium;
  ctx.globalAlpha = 0.95;
  ctx.fillText(p.type === "magnet" ? "🧲" : "🛡️", 4, 22);

  ctx.restore();
};

const drawCat = (cat) => {
  const blink = cat.invuln > 0 && Math.floor(cat.invuln * 16) % 2 === 0;

  ctx.save();
  ctx.translate(cat.x, cat.y);

  drawRoundedRect(0, 0, cat.w, cat.h, 14);
  ctx.fillStyle = blink ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.78)";
  ctx.fill();

  ctx.font = FONT.large;
  ctx.globalAlpha = blink ? 0.5 : 1;
  const bob = cat.bobTime ? Math.sin(cat.bobTime * 2.5) * 2 : 0;
  ctx.fillText(getCatEmoji(), 5, 36 + bob);

  if (cat.shield > 0) {
    ctx.globalAlpha = 0.95;
    ctx.font = FONT.small;
    ctx.fillText("🛡️", 26, 16);
  }
  if (cat.magnetT > 0) {
    ctx.globalAlpha = 0.95;
    ctx.font = FONT.small;
    ctx.fillText("🧲", 6, 16);
  }

  ctx.restore();
};

const drawShopOverlay = () => {
  const meta = state.meta;
  const u = meta.upgrades;
  const speedCost = getUpgradeCost("speed", u.speed ?? 0);
  const livesCost = getUpgradeCost("lives", u.lives ?? 0);
  const magnetCost = getUpgradeCost("magnet", u.magnet ?? 0);

  ctx.save();
  ctx.fillStyle = "rgba(0,50,70,0.88)";
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = FONT.title;
  ctx.fillText("Game Over", W / 2, 95);

  ctx.font = FONT.small;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText(`Score: ${state.score}  •  Best: ${meta.bestScore}`, W / 2, 128);
  const fromBest = meta.bestScore - state.score;
  if (fromBest > 0 && state.score > 0) {
    ctx.fillStyle = "rgba(255,235,140,0.9)";
    ctx.fillText(`You were ${fromBest} from your best!`, W / 2, 152);
  }
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText(`Coins: ${meta.coins} (+${state.coinsEarnedThisRun} this run)`, W / 2, 176);

  const lb = (meta.leaderboard || []).slice(0, 5);
  if (lb.length > 0) {
    ctx.font = FONT.combo;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("Top: " + lb.map((e) => e.score).join(" · "), W / 2, 198);
  }

  ctx.font = FONT.subtitle;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText("Upgrades: 1 Speed · 2 Lives · 3 Magnet", W / 2, 235);
  ctx.font = FONT.small;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(`1) Speed (lvl ${u.speed ?? 0}) ${speedCost} coins`, W / 2, 262);
  ctx.fillText(`2) Lives (lvl ${u.lives ?? 0}) ${livesCost} coins`, W / 2, 284);
  ctx.fillText(`3) Magnet (lvl ${u.magnet ?? 0}) ${magnetCost} coins`, W / 2, 306);

  ctx.fillStyle = "rgba(255,235,140,0.9)";
  ctx.font = FONT.subtitle;
  ctx.fillText("Skins: 4 / 5 to change cat", W / 2, 342);
  ctx.font = FONT.small;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  const skinIdx = meta.catSkin ?? 0;
  ctx.fillText(`Current: ${CAT_SKINS[skinIdx]?.emoji ?? "🐱"}  (4 prev · 5 next)`, W / 2, 366);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = FONT.combo;
  ctx.fillText("Tap or ENTER to play again · R reset", W / 2, 405);

  ctx.restore();
};

const drawPaused = () => {
  ctx.save();
  ctx.fillStyle = "rgba(0,40,60,0.5)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.textAlign = "center";
  ctx.font = FONT.pause;
  ctx.fillText("Paused", W / 2, H / 2 - 10);
  ctx.font = FONT.small;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("Press P or tap to resume", W / 2, H / 2 + 25);
  ctx.restore();
};

// Water effect: gentle wave lines (animated each frame)
let wavePhase = 0;
const drawWaterEffect = () => {
  wavePhase += 0.018;
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    const baseY = 60 + i * 65 + Math.sin(wavePhase + i * 0.7) * 12;
    for (let x = 0; x <= W + 20; x += 25) {
      const y = baseY + Math.sin((x * 0.02) + wavePhase * 2 + i) * 8;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
};

const drawParticles = () => {
  ctx.save();
  ctx.font = FONT.small;
  ctx.textAlign = "center";
  for (const p of state.particles) {
    const a = 1 - p.t / p.life;
    ctx.globalAlpha = a;
    ctx.fillStyle = p.text.includes("+6") || Number(p.text.replace("+", "")) >= 5 ? "rgba(255,235,140,0.95)" : "rgba(255,255,255,0.95)";
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.restore();
};

const drawTutorialOverlay = () => {
  ctx.save();
  ctx.fillStyle = "rgba(0,40,60,0.88)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.textAlign = "center";
  ctx.font = FONT.subtitle;
  ctx.fillText("How to play", W / 2, 120);
  ctx.font = FONT.small;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("Move the cat → collect fish, avoid dogs.", W / 2, 180);
  ctx.fillText("Double-tap or SPACE to dash.", W / 2, 215);
  ctx.fillText("Golden fish = big points!", W / 2, 250);
  ctx.fillStyle = "rgba(255,235,140,0.95)";
  ctx.font = FONT.medium;
  ctx.fillText("Tap anywhere to start", W / 2, 320);
  ctx.restore();
};

const render = () => {
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(backgroundCanvas, 0, 0);
  drawWaterEffect();

  for (const f of state.fish) drawFish(f);
  for (const p of state.powerups) drawPowerup(p);
  for (const d of state.dogs) drawDog(d);
  drawCat(state.cat);
  drawParticles();

  if (state.showTutorial) drawTutorialOverlay();
  else if (state.paused) drawPaused();
  if (!state.running) drawShopOverlay();

  ctx.restore();
};

let last = performance.now();
const loop = (t) => {
  requestAnimationFrame(loop);
  if (document.visibilityState === "hidden") {
    last = t;
    return;
  }
  const dt = Math.min(0.033, (t - last) / 1000);
  last = t;
  update(dt);
  render();
};

// Settings panel
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const settingSfx = document.getElementById("setting-sfx");
const settingMusic = document.getElementById("setting-music");
if (settingsBtn && settingsPanel && settingSfx && settingMusic) {
  settingSfx.checked = state.meta.settings?.sfx !== false;
  settingMusic.checked = state.meta.settings?.music !== false;
  settingsBtn.addEventListener("click", () => {
    state.showSettings = !state.showSettings;
    settingsPanel.classList.toggle("hidden", !state.showSettings);
    settingsPanel.setAttribute("aria-hidden", state.showSettings ? "true" : "false");
    if (state.showSettings) {
      settingSfx.checked = state.meta.settings?.sfx !== false;
      settingMusic.checked = state.meta.settings?.music !== false;
    }
    if (state.meta.settings?.sfx) SOUND.click();
  });
  settingSfx.addEventListener("change", () => {
    if (!state.meta.settings) state.meta.settings = { sfx: true, music: true };
    state.meta.settings.sfx = settingSfx.checked;
    saveMeta(state.meta);
  });
  settingMusic.addEventListener("change", () => {
    if (!state.meta.settings) state.meta.settings = { sfx: true, music: true };
    state.meta.settings.music = settingMusic.checked;
    saveMeta(state.meta);
    setMusicVolume(settingMusic.checked ? 0.08 : 0);
  });
}

resetGame();
requestAnimationFrame(loop);
