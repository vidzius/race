"use strict";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
const TOTAL_LAPS = 3;
const MAX_PLAYERS = 6;
const BASE_SPEED = 285;
const BOOST_SPEED = 485;
const BOOST_DURATION = 0.34;
const BOOST_COOLDOWN = 1.8;
const BASE_SHOT_COOLDOWN = 0.72;
const BASE_PROJECTILE_SPEED = 650;
const PROJECTILE_LIFETIME = 1.55;
const BASE_SLOW_FACTOR = 0.56;
const BASE_SLOW_DURATION = 0.9;
const CHECKPOINT_RADIUS = 15;
const CHECKPOINTS = [
  { x: 170, y: 380, label: "START" },
  { x: 540, y: 175, label: "1" },
  { x: 1095, y: 335, label: "2" },
  { x: 690, y: 575, label: "3" }
];
const RACE_SEQUENCE = [1, 2, 3, 0];
const SPAWN_POINTS = [
  [128, 270], [151, 314], [128, 358], [151, 402], [128, 446], [151, 490]
];
const PLAYER_COLORS = ["#39f5ff", "#ff3e9d", "#ffd34d", "#8dff72", "#b879ff", "#ff7b45"];
const LOCAL_REWARDS = [42, 32, 25, 20, 16, 13];

const SKINS = [
  {
    id: "neon_scout", name: "Neon Scout", price: 0, projectile: "Pulse bolts",
    description: "The balanced original. Reliable, bright and impossible to blame.",
    perkText: "Balanced stats · no trade-offs", accent: "#39f5ff",
    stats: { speed: 1, accel: 1, boost: 1, boostCooldown: 1, fireRate: 1, projectileSpeed: 1, projectileSize: 1, slowPower: 1, slowDuration: 1, slowResist: 0, coin: 1 }
  },
  {
    id: "banana_henchling", name: "Banana Henchling", price: 120, projectile: "Banana peels",
    description: "A tiny yellow goggle-wearing nuisance with suspicious banana expertise.",
    perkText: "+9% acceleration, bigger peels · −2% speed", accent: "#ffe44c",
    stats: { speed: .98, accel: 1.09, boost: 1.02, boostCooldown: 1, fireRate: 1.05, projectileSpeed: .96, projectileSize: 1.12, slowPower: 1, slowDuration: 1.05, slowResist: .05, coin: 1 }
  },
  {
    id: "square_sea_fry", name: "Square Sea Fry", price: 180, projectile: "Soap bubbles",
    description: "A relentlessly cheerful square fry cook from somewhere under the sea.",
    perkText: "34% slow resistance, huge bubbles · −3% speed", accent: "#fff05a",
    stats: { speed: .97, accel: 1, boost: .98, boostCooldown: 1, fireRate: .95, projectileSpeed: .92, projectileSize: 1.25, slowPower: .96, slowDuration: 1.08, slowResist: .34, coin: 1 }
  },
  {
    id: "espresso_pirouette", name: "Espresso Pirouette", price: 220, projectile: "Espresso cups",
    description: "An Italian-brainrot ballerina powered by dangerously concentrated coffee.",
    perkText: "+6% speed, +3% response · slower boost recharge", accent: "#d59b69",
    stats: { speed: 1.06, accel: 1.03, boost: .97, boostCooldown: 1.1, fireRate: 1, projectileSpeed: 1.04, projectileSize: .92, slowPower: .95, slowDuration: .95, slowResist: 0, coin: 1 }
  },
  {
    id: "jet_gator", name: "Jet Gator", price: 260, projectile: "Pocket jets",
    description: "A crocodile attached to aviation hardware. Nobody approved the paperwork.",
    perkText: "+22% projectile speed, stronger boost · slower firing", accent: "#74e46a",
    stats: { speed: 1.02, accel: .98, boost: 1.06, boostCooldown: 1.08, fireRate: .94, projectileSpeed: 1.22, projectileSize: .88, slowPower: 1, slowDuration: .92, slowResist: .08, coin: 1 }
  },
  {
    id: "furious_toaster", name: "Furious Toaster", price: 140, projectile: "Burnt toast",
    description: "A household appliance that woke up angry and chose carbohydrates.",
    perkText: "+24% slowdown duration, 14% resistance · slower firing", accent: "#d8e0ec",
    stats: { speed: .97, accel: .98, boost: 1, boostCooldown: 1, fireRate: .88, projectileSpeed: .94, projectileSize: 1.18, slowPower: 1.04, slowDuration: 1.24, slowResist: .14, coin: 1 }
  },
  {
    id: "tactical_plunger", name: "Tactical Plunger", price: 160, projectile: "Mini plungers",
    description: "Specialized bathroom equipment with a totally unnecessary combat certification.",
    perkText: "+8% projectile speed, +6% fire rate, sticky hits", accent: "#ef4c55",
    stats: { speed: .99, accel: 1.02, boost: 1, boostCooldown: .96, fireRate: 1.06, projectileSpeed: 1.08, projectileSize: 1.18, slowPower: 1.05, slowDuration: 1, slowResist: .03, coin: 1 }
  },
  {
    id: "forklift_fury", name: "Forklift Fury", price: 300, projectile: "Wooden pallets",
    description: "Certified to lift loads, grudges and the entire lobby’s blood pressure.",
    perkText: "52% slow resistance, heavy hits · −7% speed", accent: "#ffc83d",
    stats: { speed: .93, accel: .91, boost: 1.1, boostCooldown: 1.12, fireRate: .82, projectileSpeed: .84, projectileSize: 1.38, slowPower: 1.22, slowDuration: 1.12, slowResist: .52, coin: 1 }
  },
  {
    id: "traffic_cone", name: "Traffic Cone", price: 110, projectile: "Tiny road cones",
    description: "A premium road-safety device with surprisingly aggressive corner exits.",
    perkText: "+14% acceleration, faster boost recharge · −1% speed", accent: "#ff7b38",
    stats: { speed: .99, accel: 1.14, boost: 1, boostCooldown: .92, fireRate: 1, projectileSpeed: 1, projectileSize: 1, slowPower: .96, slowDuration: .96, slowResist: .06, coin: 1 }
  },
  {
    id: "office_printer", name: "Office Printer", price: 240, projectile: "A4 paperwork",
    description: "It jams, it screams, and somehow it still prints faster than everyone else shoots.",
    perkText: "+32% fire rate · weaker, shorter slowdown", accent: "#b7c0ce",
    stats: { speed: .98, accel: .98, boost: .98, boostCooldown: 1, fireRate: 1.32, projectileSpeed: 1.06, projectileSize: .82, slowPower: .76, slowDuration: .82, slowResist: .1, coin: 1 }
  },
  {
    id: "disco_duck", name: "Disco Duck", price: 280, projectile: "Rubber ducklings",
    description: "A glitter-powered bird with an excellent accountant and terrible music taste.",
    perkText: "+25% race coins · almost balanced elsewhere", accent: "#ffe85c",
    stats: { speed: 1, accel: 1, boost: 1, boostCooldown: 1, fireRate: .98, projectileSpeed: .98, projectileSize: 1.08, slowPower: .98, slowDuration: 1, slowResist: .05, coin: 1.25 }
  },
  {
    id: "grandmas_slipper", name: "Grandma's Slipper", price: 190, projectile: "Flying slippers",
    description: "Ancient household precision technology. It never misses on purpose.",
    perkText: "+14% projectile speed, +13% fire rate", accent: "#ff8ac5",
    stats: { speed: 1.01, accel: 1.01, boost: .98, boostCooldown: 1, fireRate: 1.13, projectileSpeed: 1.14, projectileSize: .96, slowPower: 1, slowDuration: .94, slowResist: .02, coin: 1 }
  }
];
const SKIN_MAP = new Map(SKINS.map(skin => [skin.id, skin]));

const elements = Object.fromEntries([
  "overlay", "modal", "modalTitle", "modalText", "menuPanel", "playerNameInput", "roomInput",
  "modeControls", "onlinePanel", "joinControls", "onlineControls", "readyButton", "createRoomButton",
  "joinRoomButton", "lobbyInfo", "countdown", "status", "roomBadge", "leaderboard", "boostMeter",
  "shotMeter", "hudSkinName", "hudCoins", "wallet", "equippedName", "shopPanel", "shopGrid", "toast"
].map(id => [id, document.getElementById(id)]));

const keys = Object.create(null);
const touch = { up: false, down: false, left: false, right: false, boost: false, shoot: false };
const state = {
  mode: null, running: false, gameOver: false, socket: null, connectionNumber: 0,
  connected: false, manualDisconnect: false, localPlayerId: null, localReady: false,
  roomCode: "", remotePlayers: new Map(), onlineProjectiles: [], localBots: [],
  localProjectiles: [], particles: [], stars: [], shake: 0, lastNetworkSend: 0,
  pointerShoot: false, localProjectileSequence: 0, localRaceNumber: 0, shopReturn: "menu",
  leaderboardKey: "", toastTimer: null
};

function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}
function skinFor(id) { return SKIN_MAP.get(id) || SKIN_MAP.get("neon_scout"); }
function normalizeRoomCode(value) { return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8); }

function loadProfile() {
  const fallback = { coins: 150, unlocked: ["neon_scout"], equipped: "neon_scout", rewardedRaceIds: [] };
  try {
    const saved = JSON.parse(localStorage.getItem("neonScrambleProfileV1") || "null");
    if (!saved || typeof saved !== "object") return fallback;
    const unlocked = Array.isArray(saved.unlocked)
      ? saved.unlocked.filter(id => SKIN_MAP.has(id))
      : fallback.unlocked;
    if (!unlocked.includes("neon_scout")) unlocked.unshift("neon_scout");
    return {
      coins: Math.max(0, Math.floor(Number(saved.coins) || 0)),
      unlocked,
      equipped: unlocked.includes(saved.equipped) ? saved.equipped : "neon_scout",
      rewardedRaceIds: Array.isArray(saved.rewardedRaceIds) ? saved.rewardedRaceIds.slice(-20) : []
    };
  } catch { return fallback; }
}
const profile = loadProfile();
function saveProfile() {
  try { localStorage.setItem("neonScrambleProfileV1", JSON.stringify(profile)); } catch { /* private mode */ }
  updateWallet();
}
function updateWallet() {
  const skin = skinFor(profile.equipped);
  elements.wallet.textContent = `◉ ${profile.coins}`;
  elements.hudCoins.textContent = `${profile.coins} coins`;
  elements.hudSkinName.textContent = skin.name;
  elements.equippedName.textContent = skin.name;
}

function createPlayer(id, name, skinId, slot, x, y) {
  return {
    playerId: id, name, skinId, slot, accent: PLAYER_COLORS[slot % PLAYER_COLORS.length],
    x, y, targetX: x, targetY: y, vx: 0, vy: 0, angle: -Math.PI / 4,
    targetAngle: -Math.PI / 4, speed: 0, radius: 25, lap: 1, nextCheckpoint: 1,
    passedCount: 0, position: slot + 1, finished: false, boostUntil: 0,
    boostCooldownUntil: 0, shotCooldownUntil: 0, boostReady: 1, shotReady: 1,
    boostWasDown: false, slowedUntil: 0, slowFactor: 1, slowed: false, hits: 0
  };
}

const p1 = createPlayer(null, "Player One", profile.equipped, 0, ...SPAWN_POINTS[0]);
const BOT_NAMES = ["Turbo Dave", "Mop Supreme", "Wi-Fi Potato", "Forklift Kevin", "Auntie Nitro"];
const BOT_SKINS = ["banana_henchling", "square_sea_fry", "espresso_pirouette", "forklift_fury", "disco_duck"];

for (let index = 0; index < 165; index += 1) {
  state.stars.push({ x: Math.random() * W, y: Math.random() * H, size: Math.random() * 2 + .3, alpha: Math.random() * .7 + .15, phase: Math.random() * 8 });
}

function setStatus(text) { elements.status.textContent = text; }
function showOverlay(title, text) {
  elements.modalTitle.textContent = title;
  elements.modalText.textContent = text;
  elements.overlay.classList.remove("hidden");
}
function hideOverlay() { elements.overlay.classList.add("hidden"); }
function hideCountdown() { elements.countdown.classList.add("hidden"); elements.countdown.textContent = ""; }
function showCountdown(value) { elements.countdown.textContent = String(value); elements.countdown.classList.remove("hidden"); }
function playerName() { return elements.playerNameInput.value.trim().slice(0, 20) || "Player One"; }

function showToast(message, duration = 1400) {
  elements.toast.textContent = message;
  elements.toast.classList.remove("hidden");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => elements.toast.classList.add("hidden"), duration);
}

function resetPlayer(player, name = player.name, skinId = player.skinId) {
  const spawn = SPAWN_POINTS[player.slot] || SPAWN_POINTS[0];
  Object.assign(player, {
    name, skinId, x: spawn[0], y: spawn[1], targetX: spawn[0], targetY: spawn[1],
    vx: 0, vy: 0, angle: -Math.PI / 4, targetAngle: -Math.PI / 4, speed: 0,
    lap: 1, nextCheckpoint: 1, passedCount: 0, position: player.slot + 1,
    finished: false, boostUntil: 0, boostCooldownUntil: 0, shotCooldownUntil: 0,
    boostReady: 1, shotReady: 1, boostWasDown: false, slowedUntil: 0,
    slowFactor: 1, slowed: false, hits: 0
  });
}

function clearControls() {
  for (const key of Object.keys(keys)) keys[key] = false;
  for (const key of Object.keys(touch)) touch[key] = false;
  state.pointerShoot = false;
  document.querySelectorAll(".touch-key.is-active").forEach(button => button.classList.remove("is-active"));
}
function readControls() {
  return {
    up: Boolean(keys.w || keys.arrowup || touch.up), down: Boolean(keys.s || keys.arrowdown || touch.down),
    left: Boolean(keys.a || keys.arrowleft || touch.left), right: Boolean(keys.d || keys.arrowright || touch.right),
    boost: Boolean(keys[" "] || touch.boost), shoot: Boolean(keys.f || keys.enter || touch.shoot || state.pointerShoot)
  };
}

function showMainMenu(message = "Race five bots locally or fill a private room with up to six friends.") {
  state.mode = null; state.running = false; state.gameOver = false;
  elements.menuPanel.classList.remove("hidden"); elements.shopPanel.classList.add("hidden");
  elements.modal.classList.remove("shop-open"); elements.modeControls.classList.remove("hidden");
  elements.onlinePanel.classList.add("hidden"); elements.joinControls.classList.remove("hidden");
  elements.onlineControls.classList.add("hidden"); elements.lobbyInfo.textContent = "";
  elements.roomBadge.classList.add("hidden");
  showOverlay("NEON SCRAMBLE", message); setStatus("Choose a mode"); clearControls(); updateWallet();
}

function showOnlineMenu(message = "Create a room or enter a friend's code. Rooms hold up to six racers.") {
  state.mode = "online";
  elements.menuPanel.classList.remove("hidden"); elements.shopPanel.classList.add("hidden");
  elements.modal.classList.remove("shop-open"); elements.modeControls.classList.remove("hidden");
  elements.onlinePanel.classList.remove("hidden"); elements.joinControls.classList.remove("hidden");
  elements.onlineControls.classList.add("hidden"); elements.lobbyInfo.textContent = "";
  showOverlay("ONLINE SCRAMBLE", message); setStatus("Choose or create a room");
}

function showLobbyOverlay(text = "Wait for everyone to join before pressing Ready. The race begins when all connected racers are ready.") {
  elements.menuPanel.classList.remove("hidden"); elements.shopPanel.classList.add("hidden");
  elements.modal.classList.remove("shop-open"); elements.modeControls.classList.add("hidden");
  elements.onlinePanel.classList.remove("hidden"); elements.joinControls.classList.add("hidden");
  elements.onlineControls.classList.remove("hidden"); showOverlay("ONLINE LOBBY", text);
}

function openShop(returnTo) {
  state.shopReturn = returnTo || (state.connected ? "lobby" : "menu");
  elements.menuPanel.classList.add("hidden"); elements.shopPanel.classList.remove("hidden");
  elements.modal.classList.add("shop-open");
  showOverlay("SKIN SHOP", "Spend race coins on tiny advantages, silly projectiles and questionable fashion.");
  renderShop();
}

function closeShop() {
  if (state.shopReturn === "lobby" && state.connected) showLobbyOverlay();
  else showMainMenu();
}

function equipSkin(skinId) {
  if (!profile.unlocked.includes(skinId)) return;
  if (state.connected && state.localReady) {
    showToast("Cancel Ready before changing skin");
    return;
  }
  profile.equipped = skinId; p1.skinId = skinId; saveProfile();
  if (state.connected) sendMessage({ type: "skin", skinId });
  renderShop(); updateHud();
}

function buySkin(skinId) {
  const skin = skinFor(skinId);
  if (profile.unlocked.includes(skinId)) return equipSkin(skinId);
  if (state.connected && state.localReady) {
    showToast("Cancel Ready before buying or changing skin");
    return;
  }
  if (profile.coins < skin.price) return showToast(`Need ${skin.price - profile.coins} more coins`);
  profile.coins -= skin.price; profile.unlocked.push(skinId); profile.equipped = skinId;
  p1.skinId = skinId; saveProfile();
  if (state.connected) sendMessage({ type: "skin", skinId });
  showToast(`${skin.name} unlocked!`); renderShop(); updateHud();
}

function renderShop() {
  elements.shopGrid.replaceChildren();
  for (const skin of SKINS) {
    const card = document.createElement("article");
    card.className = `skin-card${profile.equipped === skin.id ? " is-equipped" : ""}`;
    const preview = document.createElement("canvas"); preview.width = 180; preview.height = 90; preview.className = "skin-preview";
    const name = document.createElement("div"); name.className = "skin-name"; name.textContent = skin.name;
    const projectile = document.createElement("div"); projectile.className = "skin-projectile"; projectile.textContent = skin.projectile;
    const description = document.createElement("div"); description.className = "skin-description"; description.textContent = skin.description;
    const perk = document.createElement("div"); perk.className = "skin-perk"; perk.textContent = skin.perkText;
    const button = document.createElement("button"); button.type = "button";
    const unlocked = profile.unlocked.includes(skin.id);
    if (profile.equipped === skin.id) { button.textContent = "EQUIPPED"; button.disabled = true; }
    else if (unlocked) button.textContent = "EQUIP";
    else { button.textContent = `BUY · ◉ ${skin.price}`; button.disabled = profile.coins < skin.price; }
    button.addEventListener("click", () => unlocked ? equipSkin(skin.id) : buySkin(skin.id));
    card.append(preview, name, projectile, description, perk, button); elements.shopGrid.append(card);
    const previewContext = preview.getContext("2d");
    previewContext.clearRect(0, 0, preview.width, preview.height);
    drawSkinShape(previewContext, { x: 90, y: 45, angle: 0, skinId: skin.id, accent: skin.accent }, 1.28);
  }
  updateWallet();
}

function setJoinButtonsDisabled(disabled) {
  elements.createRoomButton.disabled = disabled; elements.joinRoomButton.disabled = disabled;
}

function resetLocalGame() {
  disconnectOnline(true); state.localRaceNumber += 1;
  p1.slot = 0; p1.accent = PLAYER_COLORS[0]; resetPlayer(p1, playerName(), profile.equipped);
  state.localBots = BOT_NAMES.map((name, index) => {
    const slot = index + 1;
    const bot = createPlayer(`bot-${slot}`, name, BOT_SKINS[index], slot, ...SPAWN_POINTS[slot]);
    resetPlayer(bot); return bot;
  });
  state.mode = "local"; state.running = true; state.gameOver = false;
  state.remotePlayers.clear(); state.localProjectiles.length = 0; state.onlineProjectiles.length = 0;
  state.particles.length = 0; state.shake = 0; state.roomCode = "";
  hideCountdown(); hideOverlay(); elements.roomBadge.classList.add("hidden");
  setStatus("Six-racer practice · fire to slow rivals"); updateHud();
}

function websocketUrl() {
  const query = new URLSearchParams(window.location.search);
  const override = query.get("server")?.trim();
  const configured = window.NEON_SCRAMBLE_CONFIG?.serverUrl?.trim();
  if (override) return override;
  if (configured) return configured;
  if (!window.location.host || window.location.protocol === "file:") return "ws://127.0.0.1:8765/ws";
  if (/(^|\.)itch\.zone$|(^|\.)itch\.io$/i.test(window.location.hostname)) {
    throw new Error("Multiplayer server is not configured for this itch.io build. Run prepare_itch_build.py with your Render URL.");
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

function connectOnline(requestedRoom) {
  const roomCode = normalizeRoomCode(requestedRoom);
  if (requestedRoom && roomCode.length < 4) return showOnlineMenu("Room codes contain 4–8 letters or numbers.");
  disconnectOnline(true); state.mode = "online"; state.gameOver = false; state.manualDisconnect = false;
  state.remotePlayers.clear(); state.onlineProjectiles.length = 0; state.localReady = false; state.roomCode = roomCode;
  state.connectionNumber += 1; const connectionNumber = state.connectionNumber;
  setJoinButtonsDisabled(true); setStatus("Connecting…"); elements.lobbyInfo.textContent = "Waking or connecting to the multiplayer server…";
  let socket;
  try { socket = new WebSocket(websocketUrl()); }
  catch (error) { setJoinButtonsDisabled(false); showOnlineMenu(error.message); return; }
  state.socket = socket;
  socket.addEventListener("open", () => {
    if (connectionNumber !== state.connectionNumber) return;
    state.connected = true;
    socket.send(JSON.stringify({ type: "join", name: playerName(), room: roomCode, skinId: profile.equipped }));
    setStatus("Connected · joining room");
  });
  socket.addEventListener("message", event => {
    if (connectionNumber !== state.connectionNumber) return;
    try { handleServerMessage(JSON.parse(event.data)); }
    catch (error) { console.warn("Ignored invalid server message", error); }
  });
  socket.addEventListener("error", () => {
    if (connectionNumber === state.connectionNumber) setStatus("Connection error");
  });
  socket.addEventListener("close", () => {
    if (connectionNumber !== state.connectionNumber) return;
    state.connected = false; state.running = false; state.socket = null; setJoinButtonsDisabled(false);
    if (!state.manualDisconnect) {
      showOnlineMenu("The server connection closed. A free cloud server may need about a minute to wake up; try again shortly.");
      setStatus("Disconnected");
    }
  });
}

function disconnectOnline(silent = false) {
  state.manualDisconnect = true; state.connectionNumber += 1;
  if (state.socket) state.socket.close(1000, "Player left");
  state.socket = null; state.connected = false; state.running = false; state.localReady = false;
  state.localPlayerId = null; state.remotePlayers.clear(); state.onlineProjectiles.length = 0; state.roomCode = "";
  setJoinButtonsDisabled(false); hideCountdown(); clearControls();
  if (!silent) showMainMenu("You left the online room. Your coins and unlocked skins remain on this device.");
}

function sendMessage(message) {
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN) return false;
  state.socket.send(JSON.stringify(message)); return true;
}

function handleServerMessage(message) {
  switch (message.type) {
    case "connected": state.localPlayerId = message.playerId; p1.playerId = message.playerId; break;
    case "join_accepted":
      state.roomCode = normalizeRoomCode(message.roomCode || ""); elements.roomInput.value = state.roomCode;
      elements.roomBadge.textContent = `ROOM ${state.roomCode}`; elements.roomBadge.classList.remove("hidden");
      showLobbyOverlay(); updateLobby(message.players || []); break;
    case "player_list": updateLobby(message.players || []); break;
    case "countdown": showCountdown(message.value); setStatus("Race starting"); break;
    case "race_started":
      hideCountdown(); state.running = true; state.gameOver = false; state.localReady = false;
      state.localProjectiles.length = 0; hideOverlay(); setStatus("Online race · shoot to slow rivals"); break;
    case "game_state": applyGameState(message.players || [], message.projectiles || []); break;
    case "player_hit": showHitEffect(message); break;
    case "player_left":
      state.running = false; hideCountdown(); state.onlineProjectiles.length = 0; updateLobby(message.players || []);
      showLobbyOverlay("A racer left. Everyone has been returned to the lobby; press Ready again when the group is set.");
      setStatus("Racer left · lobby reset"); break;
    case "race_finished":
      state.running = false; state.gameOver = true; state.localReady = false; showOnlineResults(message.raceId, message.results || []); break;
    case "error":
      setJoinButtonsDisabled(false); showOnlineMenu(message.message || "The server rejected the request."); setStatus("Could not join room"); break;
    default: break;
  }
}

function updateLobby(players) {
  const lines = players.map(player => `${player.slot + 1}. ${player.name} · ${skinFor(player.skinId).name} · ${player.ready ? "READY" : "WAITING"}`);
  const local = players.find(player => player.playerId === state.localPlayerId);
  state.localReady = Boolean(local?.ready); elements.readyButton.textContent = state.localReady ? "CANCEL READY" : "READY";
  elements.lobbyInfo.textContent = `Room ${state.roomCode} · ${players.length}/${MAX_PLAYERS} racers\n${lines.join("\n")}\n\nWait for the full group before pressing Ready.`;
  setStatus(players.length < 2 ? "Waiting for at least one friend" : `${players.length} racers connected`);
  const seen = new Set();
  for (const player of players) {
    seen.add(player.playerId);
    if (player.playerId === state.localPlayerId) { p1.name = player.name; p1.skinId = player.skinId; p1.slot = player.slot; p1.accent = PLAYER_COLORS[player.slot]; continue; }
    let remote = state.remotePlayers.get(player.playerId);
    if (!remote) remote = createPlayer(player.playerId, player.name, player.skinId, player.slot, ...SPAWN_POINTS[player.slot]);
    remote.name = player.name; remote.skinId = player.skinId; remote.slot = player.slot; remote.accent = PLAYER_COLORS[player.slot];
    state.remotePlayers.set(player.playerId, remote);
  }
  for (const id of state.remotePlayers.keys()) if (!seen.has(id)) state.remotePlayers.delete(id);
  updateHud();
}

function applyGameState(serverPlayers, projectiles) {
  const seen = new Set();
  for (const serverPlayer of serverPlayers) {
    seen.add(serverPlayer.playerId);
    if (serverPlayer.playerId === state.localPlayerId) {
      Object.assign(p1, {
        name: serverPlayer.name, skinId: serverPlayer.skinId, slot: serverPlayer.slot,
        accent: PLAYER_COLORS[serverPlayer.slot], x: serverPlayer.x, y: serverPlayer.y,
        targetX: serverPlayer.x, targetY: serverPlayer.y, angle: serverPlayer.angle,
        targetAngle: serverPlayer.angle, speed: serverPlayer.speed, lap: serverPlayer.lap,
        nextCheckpoint: serverPlayer.nextCheckpoint, passedCount: serverPlayer.passedCount,
        position: serverPlayer.position, finished: serverPlayer.finished, hits: serverPlayer.hits,
        slowed: serverPlayer.slowed, boostReady: serverPlayer.boostReady, shotReady: serverPlayer.shotReady
      });
      continue;
    }
    let remote = state.remotePlayers.get(serverPlayer.playerId);
    if (!remote) remote = createPlayer(serverPlayer.playerId, serverPlayer.name, serverPlayer.skinId, serverPlayer.slot, serverPlayer.x, serverPlayer.y);
    Object.assign(remote, {
      name: serverPlayer.name, skinId: serverPlayer.skinId, slot: serverPlayer.slot,
      accent: PLAYER_COLORS[serverPlayer.slot], targetX: serverPlayer.x, targetY: serverPlayer.y,
      targetAngle: serverPlayer.angle, speed: serverPlayer.speed, lap: serverPlayer.lap,
      nextCheckpoint: serverPlayer.nextCheckpoint, passedCount: serverPlayer.passedCount,
      position: serverPlayer.position, finished: serverPlayer.finished, hits: serverPlayer.hits,
      slowed: serverPlayer.slowed, boostReady: serverPlayer.boostReady, shotReady: serverPlayer.shotReady
    });
    state.remotePlayers.set(serverPlayer.playerId, remote);
  }
  for (const id of state.remotePlayers.keys()) if (!seen.has(id)) state.remotePlayers.delete(id);
  state.onlineProjectiles = projectiles; updateHud();
}

function showHitEffect(message) {
  createHitBurst(message.x, message.y, skinFor(message.skinId).accent);
  if (message.targetId === state.localPlayerId) { state.shake = Math.max(state.shake, .5); showToast("BONKED · slowed!"); }
  else if (message.shooterId === state.localPlayerId) showToast("DIRECT HIT!");
}

function rewardOnlineRace(raceId, results) {
  if (!raceId || profile.rewardedRaceIds.includes(raceId)) return 0;
  const ownResult = results.find(result => result.playerId === state.localPlayerId);
  if (!ownResult) return 0;
  const coins = Math.max(0, Math.floor(ownResult.coins || 0));
  profile.coins += coins; profile.rewardedRaceIds.push(raceId);
  profile.rewardedRaceIds = profile.rewardedRaceIds.slice(-20); saveProfile(); return coins;
}

function showOnlineResults(raceId, results) {
  const earned = rewardOnlineRace(raceId, results);
  const lines = results.map(result => `${result.position}. ${result.name} · ${result.hits} hits · +${result.coins} coins`).join("\n");
  elements.modeControls.classList.add("hidden"); elements.onlinePanel.classList.remove("hidden");
  elements.joinControls.classList.add("hidden"); elements.onlineControls.classList.remove("hidden");
  elements.readyButton.textContent = "READY FOR REMATCH";
  showOverlay("RACE FINISHED", `${lines}\n\nYou earned ${earned} coins. Press Ready for a rematch.`);
  setStatus(results[0]?.playerId === state.localPlayerId ? "You won!" : `Finished · +${earned} coins`);
}

function sendOnlineInput(now) {
  if (!state.connected || !state.running || now - state.lastNetworkSend < 50) return;
  state.lastNetworkSend = now; sendMessage({ type: "input", input: readControls() });
}

function triggerBoost(player, nowSeconds, controls) {
  const stats = skinFor(player.skinId).stats;
  const cooldown = BOOST_COOLDOWN * stats.boostCooldown;
  if (controls.boost && !player.boostWasDown && nowSeconds >= player.boostCooldownUntil) {
    player.boostUntil = nowSeconds + BOOST_DURATION; player.boostCooldownUntil = nowSeconds + cooldown;
    state.shake = Math.max(state.shake, player === p1 ? .34 : 0);
  }
  player.boostWasDown = controls.boost;
  player.boostReady = clamp(1 - (player.boostCooldownUntil - nowSeconds) / cooldown, 0, 1);
}

function movePlayer(player, controls, dt, nowSeconds) {
  const stats = skinFor(player.skinId).stats;
  let dx = Number(controls.right) - Number(controls.left); let dy = Number(controls.down) - Number(controls.up);
  const length = Math.hypot(dx, dy); if (length > 0) { dx /= length; dy /= length; }
  player.slowed = nowSeconds < player.slowedUntil;
  if (!player.slowed) player.slowFactor = 1;
  const base = nowSeconds < player.boostUntil ? BOOST_SPEED * stats.boost : BASE_SPEED;
  const maxSpeed = base * stats.speed * (player.slowed ? player.slowFactor : 1);
  const smoothing = 1 - Math.exp(-(length ? 13 : 8) * stats.accel * dt);
  player.vx += (dx * maxSpeed - player.vx) * smoothing; player.vy += (dy * maxSpeed - player.vy) * smoothing;
  player.x = clamp(player.x + player.vx * dt, 45, W - 45); player.y = clamp(player.y + player.vy * dt, 118, H - 40);
  player.speed = Math.hypot(player.vx, player.vy); if (player.speed > 8) player.angle = Math.atan2(player.vy, player.vx);
  if (nowSeconds < player.boostUntil && player.speed > 80) createBoostEffect(player);
}

function spawnLocalProjectile(player, nowSeconds, angle = player.angle) {
  const stats = skinFor(player.skinId).stats;
  if (player.finished || nowSeconds < player.shotCooldownUntil) return;
  player.shotCooldownUntil = nowSeconds + BASE_SHOT_COOLDOWN / stats.fireRate;
  state.localProjectileSequence += 1;
  const speed = BASE_PROJECTILE_SPEED * stats.projectileSpeed;
  state.localProjectiles.push({
    projectileId: state.localProjectileSequence, ownerId: player.playerId || "local-player",
    skinId: player.skinId, x: player.x + Math.cos(angle) * 34, y: player.y + Math.sin(angle) * 34,
    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, angle,
    radius: 10 * stats.projectileSize, expiresAt: nowSeconds + PROJECTILE_LIFETIME
  });
}

function maybeShootLocal(player, controls, nowSeconds, angle = player.angle) {
  const stats = skinFor(player.skinId).stats;
  player.shotReady = clamp(1 - (player.shotCooldownUntil - nowSeconds) / (BASE_SHOT_COOLDOWN / stats.fireRate), 0, 1);
  if (controls.shoot) spawnLocalProjectile(player, nowSeconds, angle);
}

function nextCheckpointForPassedCount(passedCount) { return RACE_SEQUENCE[passedCount % RACE_SEQUENCE.length]; }
function updateCheckpoint(player) {
  if (player.finished) return;
  const checkpoint = CHECKPOINTS[player.nextCheckpoint];
  if (Math.hypot(player.x - checkpoint.x, player.y - checkpoint.y) > CHECKPOINT_RADIUS) return;
  player.passedCount += 1;
  if (player.passedCount >= TOTAL_LAPS * CHECKPOINTS.length) { player.finished = true; player.lap = TOTAL_LAPS; return; }
  player.nextCheckpoint = nextCheckpointForPassedCount(player.passedCount);
  player.lap = Math.floor(player.passedCount / CHECKPOINTS.length) + 1;
}
function raceProgress(player) {
  const checkpoint = CHECKPOINTS[player.nextCheckpoint];
  return player.passedCount + clamp(1 - Math.hypot(player.x - checkpoint.x, player.y - checkpoint.y) / 700, 0, .95);
}

function nearestOpponent(player, racers) {
  let best = null; let bestDistance = Infinity;
  for (const candidate of racers) {
    if (candidate === player || candidate.finished) continue;
    const distance = Math.hypot(candidate.x - player.x, candidate.y - player.y);
    if (distance < bestDistance) { best = candidate; bestDistance = distance; }
  }
  return { target: best, distance: bestDistance };
}

function updateLocalProjectiles(dt, nowSeconds, racers) {
  for (let index = state.localProjectiles.length - 1; index >= 0; index -= 1) {
    const projectile = state.localProjectiles[index];
    projectile.x += projectile.vx * dt; projectile.y += projectile.vy * dt;
    const outside = projectile.x < 15 || projectile.x > W - 15 || projectile.y < 95 || projectile.y > H - 10;
    if (outside || nowSeconds >= projectile.expiresAt) { state.localProjectiles.splice(index, 1); continue; }
    const shooter = racers.find(racer => (racer.playerId || "local-player") === projectile.ownerId);
    if (!shooter) { state.localProjectiles.splice(index, 1); continue; }
    for (const target of racers) {
      if (target === shooter || target.finished) continue;
      if (Math.hypot(projectile.x - target.x, projectile.y - target.y) > projectile.radius + 25) continue;
      const shooterStats = skinFor(shooter.skinId).stats; const targetStats = skinFor(target.skinId).stats;
      const speedLoss = (1 - BASE_SLOW_FACTOR) * shooterStats.slowPower * (1 - targetStats.slowResist);
      const factor = clamp(1 - speedLoss, .35, .9);
      const duration = BASE_SLOW_DURATION * shooterStats.slowDuration * (1 - targetStats.slowResist * .45);
      target.slowFactor = nowSeconds < target.slowedUntil ? Math.min(target.slowFactor, factor) : factor;
      target.slowedUntil = Math.max(target.slowedUntil, nowSeconds + duration); shooter.hits += 1;
      createHitBurst(target.x, target.y, skinFor(shooter.skinId).accent);
      if (target === p1) { state.shake = Math.max(state.shake, .48); showToast("BONKED · slowed!"); }
      else if (shooter === p1) showToast("DIRECT HIT!");
      state.localProjectiles.splice(index, 1); break;
    }
  }
}

function updateLocalRace(dt, nowSeconds) {
  const racers = [p1, ...state.localBots]; const controls = readControls();
  triggerBoost(p1, nowSeconds, controls); movePlayer(p1, controls, dt, nowSeconds);
  maybeShootLocal(p1, controls, nowSeconds); updateCheckpoint(p1);
  for (const bot of state.localBots) {
    const targetCheckpoint = CHECKPOINTS[bot.nextCheckpoint];
    const angle = Math.atan2(targetCheckpoint.y - bot.y, targetCheckpoint.x - bot.x);
    const botControls = {
      left: Math.cos(angle) < -.16, right: Math.cos(angle) > .16,
      up: Math.sin(angle) < -.16, down: Math.sin(angle) > .16,
      boost: Math.hypot(targetCheckpoint.x - bot.x, targetCheckpoint.y - bot.y) > 360 && Math.random() < .018,
      shoot: false
    };
    triggerBoost(bot, nowSeconds, botControls); movePlayer(bot, botControls, dt, nowSeconds);
    const nearest = nearestOpponent(bot, racers);
    if (nearest.target && nearest.distance < 470 && Math.random() < .042) {
      spawnLocalProjectile(bot, nowSeconds, Math.atan2(nearest.target.y - bot.y, nearest.target.x - bot.x));
    }
    maybeShootLocal(bot, { shoot: false }, nowSeconds); updateCheckpoint(bot);
  }
  updateLocalProjectiles(dt, nowSeconds, racers);
  racers.sort((a, b) => raceProgress(b) - raceProgress(a)); racers.forEach((racer, index) => racer.position = index + 1);
  if (racers[0]?.finished) finishLocalRace(racers);
}

function finishLocalRace(ranked) {
  state.running = false; state.gameOver = true;
  const position = p1.position; const base = LOCAL_REWARDS[position - 1] || 10;
  const reward = Math.round((base + p1.passedCount + Math.min(p1.hits * 2, 24)) * skinFor(p1.skinId).stats.coin);
  profile.coins += reward; saveProfile();
  const lines = ranked.map(racer => `${racer.position}. ${racer.name} · ${racer.hits} hits`).join("\n");
  elements.modeControls.classList.remove("hidden"); elements.onlinePanel.classList.add("hidden"); elements.onlineControls.classList.add("hidden");
  showOverlay(position === 1 ? "YOU WIN" : `FINISHED ${position}${position === 2 ? "ND" : position === 3 ? "RD" : "TH"}`, `${lines}\n\nYou earned ${reward} coins.`);
  setStatus(`Practice finished · +${reward} coins`);
}

function updateRemotePlayers() {
  for (const remote of state.remotePlayers.values()) {
    remote.x += (remote.targetX - remote.x) * .24; remote.y += (remote.targetY - remote.y) * .24;
    remote.angle += normalizeAngle(remote.targetAngle - remote.angle) * .24;
  }
}

function createBoostEffect(player) {
  if (Math.random() > .5) return;
  state.particles.push({ x: player.x - Math.cos(player.angle) * 25, y: player.y - Math.sin(player.angle) * 25, vx: -Math.cos(player.angle) * 120, vy: -Math.sin(player.angle) * 120, life: .32, maxLife: .32, color: skinFor(player.skinId).accent, size: Math.random() * 4 + 3 });
}
function createHitBurst(x, y, color) {
  for (let index = 0; index < 12; index += 1) {
    const angle = Math.random() * Math.PI * 2; const speed = Math.random() * 170 + 50;
    state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .42, maxLife: .42, color, size: Math.random() * 5 + 2 });
  }
}
function updateParticles(dt) {
  for (let index = state.particles.length - 1; index >= 0; index -= 1) {
    const particle = state.particles[index]; particle.x += particle.vx * dt; particle.y += particle.vy * dt;
    particle.vx *= .94; particle.vy *= .94; particle.life -= dt;
    if (particle.life <= 0) state.particles.splice(index, 1);
  }
}

function update(dt, now) {
  const nowSeconds = now / 1000;
  if (state.running && !state.gameOver) {
    if (state.mode === "local") updateLocalRace(dt, nowSeconds);
    if (state.mode === "online") sendOnlineInput(now);
  }
  updateRemotePlayers(); updateParticles(dt); state.shake = Math.max(0, state.shake - dt * 2.2); updateHud();
}

function activeRacers() {
  if (state.mode === "local") return [p1, ...state.localBots];
  if (state.mode === "online") return [p1, ...state.remotePlayers.values()];
  return [p1, ...state.localBots];
}

function updateHud() {
  const racers = activeRacers().filter(Boolean).sort((a, b) => a.position - b.position);
  const key = racers.map(racer => `${racer.position}:${racer.name}:${racer.lap}:${racer.slowed}:${racer.skinId}`).join("|");
  if (key !== state.leaderboardKey) {
    state.leaderboardKey = key; elements.leaderboard.replaceChildren();
    for (const racer of racers) {
      const row = document.createElement("div"); row.className = `leader-row${racer === p1 ? " is-local" : ""}`;
      row.style.setProperty("--player-color", racer.accent || PLAYER_COLORS[racer.slot] || "#39f5ff");
      const position = document.createElement("span"); position.className = "leader-position"; position.textContent = racer.position;
      const name = document.createElement("span"); name.className = "leader-name"; name.textContent = `${racer.name}${racer.slowed ? " ◌" : ""}`;
      if (racer.slowed) name.classList.add("leader-slowed");
      const progress = document.createElement("span"); progress.className = "leader-progress"; progress.textContent = `L${clamp(racer.lap, 1, TOTAL_LAPS)}`;
      row.append(position, name, progress); elements.leaderboard.append(row);
    }
  }
  elements.boostMeter.style.width = `${clamp(p1.boostReady, 0, 1) * 100}%`;
  elements.shotMeter.style.width = `${clamp(p1.shotReady, 0, 1) * 100}%`;
  updateWallet();
}

function drawBackground(now) {
  const gradient = ctx.createLinearGradient(0, 0, W, H); gradient.addColorStop(0, "#080a20"); gradient.addColorStop(.5, "#15103a"); gradient.addColorStop(1, "#090b1d");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, W, H);
  for (const star of state.stars) {
    const pulse = Math.sin(now / 700 + star.phase) * .25 + .75; ctx.globalAlpha = star.alpha * pulse;
    ctx.fillStyle = "#c9d5ff"; ctx.fillRect(star.x, star.y, star.size, star.size);
  }
  ctx.globalAlpha = 1;
}
function traceTrack(context) {
  context.beginPath(); context.moveTo(CHECKPOINTS[0].x, CHECKPOINTS[0].y);
  for (let index = 1; index < CHECKPOINTS.length; index += 1) context.lineTo(CHECKPOINTS[index].x, CHECKPOINTS[index].y);
  context.closePath();
}
function drawArena(now) {
  ctx.save(); ctx.strokeStyle = "rgba(92,103,255,.11)"; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 105); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 115; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  traceTrack(ctx); ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.strokeStyle = "rgba(4,6,18,.78)"; ctx.lineWidth = 132; ctx.stroke();
  traceTrack(ctx); ctx.strokeStyle = "rgba(103,82,255,.22)"; ctx.lineWidth = 122; ctx.stroke();
  traceTrack(ctx); ctx.setLineDash([16, 24]); ctx.lineDashOffset = -now / 45; ctx.strokeStyle = "rgba(201,213,255,.17)"; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
  const activeCheckpoint = p1.nextCheckpoint;
  CHECKPOINTS.forEach((checkpoint, index) => {
    const active = index === activeCheckpoint && state.running; const pulse = Math.sin(now / 180) * 4;
    ctx.beginPath(); ctx.arc(checkpoint.x, checkpoint.y, (active ? 36 : 25) + (active ? pulse : 0), 0, Math.PI * 2);
    ctx.fillStyle = active ? "rgba(57,245,255,.15)" : "rgba(255,255,255,.035)"; ctx.fill();
    ctx.strokeStyle = active ? "#39f5ff" : "rgba(180,190,240,.25)"; ctx.lineWidth = active ? 4 : 2; ctx.shadowColor = active ? "#39f5ff" : "transparent"; ctx.shadowBlur = active ? 24 : 0; ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = active ? "#eaffff" : "rgba(220,225,255,.5)"; ctx.font = "700 11px Arial"; ctx.textAlign = "center"; ctx.fillText(checkpoint.label, checkpoint.x, checkpoint.y + 4);
  });
  ctx.restore();
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  if (context.roundRect) context.roundRect(x, y, width, height, radius);
  else context.rect(x, y, width, height);
}

function drawSkinShape(context, player, scale = 1) {
  const skin = skinFor(player.skinId); context.save(); context.translate(player.x, player.y); context.rotate(player.angle || 0); context.scale(scale, scale);
  context.shadowBlur = 18; context.shadowColor = skin.accent; context.lineWidth = 2;
  switch (skin.id) {
    case "banana_henchling":
      roundedRect(context, -19, -27, 40, 54, 17); context.fillStyle = "#ffe44c"; context.fill();
      context.fillStyle = "#3983d7"; context.fillRect(-19, 8, 40, 19); context.fillStyle = "#7e8794"; context.fillRect(-21, -12, 44, 7);
      context.fillStyle = "white"; context.beginPath(); context.arc(6, -9, 8, 0, Math.PI * 2); context.fill(); context.fillStyle = "#352515"; context.beginPath(); context.arc(7, -9, 3, 0, Math.PI * 2); context.fill();
      context.strokeStyle = "#2e65a6"; context.beginPath(); context.moveTo(-18, 10); context.lineTo(19, 10); context.stroke(); break;
    case "square_sea_fry":
      context.fillStyle = "#f7e752"; context.fillRect(-23, -25, 46, 50); context.strokeStyle = "#b6a72f"; context.strokeRect(-23, -25, 46, 50);
      context.fillStyle = "white"; context.beginPath(); context.arc(8, -10, 8, 0, Math.PI * 2); context.arc(-7, -10, 8, 0, Math.PI * 2); context.fill();
      context.fillStyle = "#4aa2e5"; context.beginPath(); context.arc(8, -10, 3, 0, Math.PI * 2); context.arc(-7, -10, 3, 0, Math.PI * 2); context.fill();
      context.fillStyle = "#9a5a28"; context.fillRect(-23, 10, 46, 15); context.fillStyle = "#e54046"; context.beginPath(); context.moveTo(0, 6); context.lineTo(6, 18); context.lineTo(0, 24); context.lineTo(-6, 18); context.closePath(); context.fill(); break;
    case "espresso_pirouette":
      context.fillStyle = "#f3eee4"; roundedRect(context, -18, -22, 35, 40, 7); context.fill(); context.strokeStyle = "#a86e43"; context.stroke();
      context.strokeStyle = "#f3eee4"; context.lineWidth = 6; context.beginPath(); context.arc(19, -4, 9, -Math.PI / 2, Math.PI / 2); context.stroke();
      context.fillStyle = "#7b4528"; context.fillRect(-15, -17, 29, 10); context.fillStyle = "#ff9cd1"; context.beginPath(); context.moveTo(-27, 15); context.lineTo(27, 15); context.lineTo(0, 31); context.closePath(); context.fill(); break;
    case "jet_gator":
      context.fillStyle = "#69c65d"; context.beginPath(); context.ellipse(0, 0, 28, 18, 0, 0, Math.PI * 2); context.fill();
      context.fillStyle = "#54aa4d"; context.fillRect(10, -10, 25, 20); context.fillStyle = "white"; context.beginPath(); context.arc(9, -10, 5, 0, Math.PI * 2); context.fill();
      context.fillStyle = "#27311f"; context.beginPath(); context.arc(11, -10, 2, 0, Math.PI * 2); context.fill();
      context.fillStyle = "#8b93a8"; context.beginPath(); context.moveTo(-10, -13); context.lineTo(-29, -27); context.lineTo(-22, -5); context.closePath(); context.fill(); context.beginPath(); context.moveTo(-10, 13); context.lineTo(-29, 27); context.lineTo(-22, 5); context.closePath(); context.fill();
      context.fillStyle = "#ff5c3d"; context.fillRect(-34, -7, 10, 14); break;
    case "furious_toaster":
      context.fillStyle = "#cbd2dc"; roundedRect(context, -25, -19, 50, 39, 8); context.fill(); context.strokeStyle = "#737b87"; context.stroke();
      context.fillStyle = "#5b6572"; context.fillRect(-16, -15, 32, 4); context.fillStyle = "#b86f31"; context.fillRect(-13, -29, 11, 17); context.fillRect(3, -29, 11, 17);
      context.fillStyle = "#ff3e56"; context.beginPath(); context.moveTo(-12, -3); context.lineTo(-4, 0); context.lineTo(-12, 3); context.closePath(); context.fill(); context.beginPath(); context.moveTo(12, -3); context.lineTo(4, 0); context.lineTo(12, 3); context.closePath(); context.fill(); break;
    case "tactical_plunger":
      context.strokeStyle = "#a96b32"; context.lineWidth = 9; context.beginPath(); context.moveTo(-24, 0); context.lineTo(13, 0); context.stroke();
      context.fillStyle = "#e8454f"; context.beginPath(); context.moveTo(7, -18); context.quadraticCurveTo(34, -16, 34, 0); context.quadraticCurveTo(34, 16, 7, 18); context.closePath(); context.fill();
      context.fillStyle = "#3b4759"; context.fillRect(-29, -6, 10, 12); break;
    case "forklift_fury":
      context.fillStyle = "#ffc43d"; context.fillRect(-25, -18, 42, 36); context.fillStyle = "#222b39"; context.fillRect(-18, -14, 19, 22);
      context.strokeStyle = "#d5dbe4"; context.lineWidth = 5; context.beginPath(); context.moveTo(16, -24); context.lineTo(16, 22); context.stroke(); context.beginPath(); context.moveTo(17, 15); context.lineTo(39, 15); context.moveTo(17, 23); context.lineTo(39, 23); context.stroke();
      context.fillStyle = "#151a24"; context.beginPath(); context.arc(-14, 20, 8, 0, Math.PI * 2); context.arc(11, 20, 8, 0, Math.PI * 2); context.fill(); break;
    case "traffic_cone":
      context.fillStyle = "#ff762f"; context.beginPath(); context.moveTo(24, 0); context.lineTo(-18, -25); context.lineTo(-18, 25); context.closePath(); context.fill();
      context.strokeStyle = "white"; context.lineWidth = 7; context.beginPath(); context.moveTo(3, -12); context.lineTo(3, 12); context.stroke(); context.fillStyle = "#ff762f"; context.fillRect(-24, -29, 9, 58); break;
    case "office_printer":
      context.fillStyle = "#aeb8c5"; roundedRect(context, -25, -18, 50, 39, 6); context.fill(); context.fillStyle = "#303947"; context.fillRect(-18, -12, 36, 12);
      context.fillStyle = "white"; context.fillRect(-14, -31, 28, 20); context.strokeStyle = "#7e8aa0"; context.lineWidth = 1; for (let y = -26; y < -14; y += 5) { context.beginPath(); context.moveTo(-9, y); context.lineTo(9, y); context.stroke(); }
      context.fillStyle = "#68e7ff"; context.beginPath(); context.arc(18, 14, 3, 0, Math.PI * 2); context.fill(); break;
    case "disco_duck":
      context.fillStyle = "#ffe34f"; context.beginPath(); context.ellipse(-3, 5, 25, 18, 0, 0, Math.PI * 2); context.fill(); context.beginPath(); context.arc(15, -10, 15, 0, Math.PI * 2); context.fill();
      context.fillStyle = "#ff8738"; context.beginPath(); context.moveTo(27, -9); context.lineTo(42, -3); context.lineTo(27, 2); context.closePath(); context.fill();
      context.fillStyle = "#2c2542"; context.beginPath(); context.arc(9, -11, 4, 0, Math.PI * 2); context.arc(20, -11, 4, 0, Math.PI * 2); context.fill();
      context.fillStyle = "#b879ff"; for (let i = 0; i < 6; i += 1) { const a = i / 6 * Math.PI * 2; context.beginPath(); context.arc(14 + Math.cos(a) * 10, -25 + Math.sin(a) * 7, 6, 0, Math.PI * 2); context.fill(); } break;
    case "grandmas_slipper":
      context.fillStyle = "#f287bd"; context.beginPath(); context.moveTo(-28, -6); context.quadraticCurveTo(-8, -22, 14, -14); context.quadraticCurveTo(36, -5, 24, 12); context.quadraticCurveTo(-2, 24, -28, 8); context.closePath(); context.fill();
      context.fillStyle = "#ffd0e8"; context.beginPath(); context.ellipse(8, -1, 13, 8, 0, 0, Math.PI * 2); context.fill(); context.strokeStyle = "#a44578"; context.lineWidth = 3; context.beginPath(); context.moveTo(-21, -2); context.lineTo(-21, 8); context.stroke(); break;
    default:
      context.fillStyle = "#39f5ff"; context.beginPath(); context.moveTo(32, 0); context.lineTo(-20, -20); context.lineTo(-12, 0); context.lineTo(-20, 20); context.closePath(); context.fill();
      context.fillStyle = "#10142e"; context.beginPath(); context.arc(-2, 0, 10, 0, Math.PI * 2); context.fill();
  }
  context.restore();
}

function drawPlayer(player, now) {
  drawSkinShape(ctx, player, 1);
  ctx.save(); ctx.globalAlpha = .42; ctx.strokeStyle = player.accent; ctx.lineWidth = player === p1 ? 4 : 3;
  ctx.beginPath(); ctx.arc(player.x, player.y, 34 + Math.sin(now / 180 + player.slot) * 2, 0, Math.PI * 2); ctx.stroke();
  if (player.slowed) { ctx.strokeStyle = "#8edbff"; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.arc(player.x, player.y, 41, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
  ctx.globalAlpha = .9; ctx.font = "700 10px Arial"; ctx.textAlign = "center"; ctx.fillStyle = "white"; ctx.fillText(player.name || "Player", player.x, player.y - 39); ctx.restore();
}

function drawProjectile(projectile) {
  const context = ctx; const skinId = projectile.skinId; const x = projectile.x; const y = projectile.y; const angle = projectile.angle ?? Math.atan2(projectile.vy || 0, projectile.vx || 1); const size = clamp(projectile.radius || 10, 6, 18);
  context.save(); context.translate(x, y); context.rotate(angle); context.shadowBlur = 14; context.shadowColor = skinFor(skinId).accent;
  switch (skinId) {
    case "banana_henchling": context.strokeStyle = "#ffe14a"; context.lineWidth = 6; context.beginPath(); context.arc(0, 0, size, -.9, .9); context.stroke(); break;
    case "square_sea_fry": context.fillStyle = "rgba(150,230,255,.34)"; context.strokeStyle = "#bff5ff"; context.lineWidth = 2; context.beginPath(); context.arc(0, 0, size, 0, Math.PI * 2); context.fill(); context.stroke(); break;
    case "espresso_pirouette": context.fillStyle = "#f0e6d4"; context.fillRect(-size, -size * .7, size * 1.6, size * 1.4); context.fillStyle = "#6e3a20"; context.fillRect(-size * .8, -size * .55, size * 1.25, size * .5); break;
    case "jet_gator": context.fillStyle = "#ff5b38"; context.beginPath(); context.moveTo(size, 0); context.lineTo(-size, -size * .55); context.lineTo(-size * .55, 0); context.lineTo(-size, size * .55); context.closePath(); context.fill(); break;
    case "furious_toaster": context.fillStyle = "#b86f31"; context.fillRect(-size, -size * .75, size * 2, size * 1.5); context.strokeStyle = "#5c351b"; context.strokeRect(-size, -size * .75, size * 2, size * 1.5); break;
    case "tactical_plunger": context.strokeStyle = "#a96b32"; context.lineWidth = 4; context.beginPath(); context.moveTo(-size, 0); context.lineTo(size * .4, 0); context.stroke(); context.fillStyle = "#e8454f"; context.beginPath(); context.arc(size * .6, 0, size * .65, -Math.PI / 2, Math.PI / 2); context.fill(); break;
    case "forklift_fury": context.fillStyle = "#a96c33"; for (let i = -1; i <= 1; i += 1) context.fillRect(-size, i * size * .48 - 2, size * 2, 4); context.fillRect(-size * .8, -size, 4, size * 2); context.fillRect(size * .55, -size, 4, size * 2); break;
    case "traffic_cone": context.fillStyle = "#ff762f"; context.beginPath(); context.moveTo(size, 0); context.lineTo(-size, -size); context.lineTo(-size, size); context.closePath(); context.fill(); break;
    case "office_printer": context.fillStyle = "white"; context.fillRect(-size, -size * .7, size * 2, size * 1.4); context.strokeStyle = "#8d96a8"; context.strokeRect(-size, -size * .7, size * 2, size * 1.4); break;
    case "disco_duck": context.fillStyle = "#ffe34f"; context.beginPath(); context.arc(0, 0, size, 0, Math.PI * 2); context.fill(); context.fillStyle = "#ff8738"; context.beginPath(); context.moveTo(size, 0); context.lineTo(size * 1.7, -size * .35); context.lineTo(size * 1.7, size * .35); context.closePath(); context.fill(); break;
    case "grandmas_slipper": context.fillStyle = "#f287bd"; context.beginPath(); context.ellipse(0, 0, size * 1.45, size * .65, 0, 0, Math.PI * 2); context.fill(); break;
    default: context.fillStyle = "#39f5ff"; context.beginPath(); context.arc(0, 0, size, 0, Math.PI * 2); context.fill();
  }
  context.restore();
}

function drawParticles() {
  for (const particle of state.particles) {
    ctx.save(); ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife); ctx.fillStyle = particle.color; ctx.shadowColor = particle.color; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}

function draw(now) {
  ctx.clearRect(0, 0, W, H); ctx.save(); const strength = state.shake * 14;
  ctx.translate((Math.random() - .5) * strength, (Math.random() - .5) * strength);
  drawBackground(now); drawArena(now);
  const projectiles = state.mode === "local" ? state.localProjectiles : state.onlineProjectiles;
  for (const projectile of projectiles) drawProjectile(projectile);
  for (const racer of activeRacers()) drawPlayer(racer, now);
  drawParticles(); ctx.restore();
}

document.getElementById("localButton").addEventListener("click", resetLocalGame);
document.getElementById("onlineButton").addEventListener("click", () => showOnlineMenu());
document.getElementById("shopButton").addEventListener("click", () => openShop("menu"));
document.getElementById("lobbyShopButton").addEventListener("click", () => openShop("lobby"));
document.getElementById("shopBackButton").addEventListener("click", closeShop);
elements.createRoomButton.addEventListener("click", () => connectOnline(""));
elements.joinRoomButton.addEventListener("click", () => connectOnline(elements.roomInput.value));
elements.roomInput.addEventListener("input", () => elements.roomInput.value = normalizeRoomCode(elements.roomInput.value));
elements.roomInput.addEventListener("keydown", event => { if (event.key === "Enter") connectOnline(elements.roomInput.value); });
elements.readyButton.addEventListener("click", () => {
  if (sendMessage({ type: "ready", value: !state.localReady })) setStatus(state.localReady ? "Canceling ready…" : "Ready · waiting for the group");
});
document.getElementById("disconnectButton").addEventListener("click", () => disconnectOnline(false));
document.getElementById("copyButton").addEventListener("click", async () => {
  const text = `Neon Scramble room code: ${state.roomCode}`;
  try { await navigator.clipboard.writeText(text); showToast("Room code copied"); }
  catch { window.prompt("Copy this room code:", state.roomCode); }
});

window.addEventListener("keydown", event => {
  const target = event.target; if (target instanceof HTMLInputElement || target instanceof HTMLButtonElement) return;
  const key = event.key.toLowerCase(); keys[key] = true;
  if (["w", "a", "s", "d", "f", "enter", "arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
  if (key === "r" && state.mode === "local") resetLocalGame();
});
window.addEventListener("keyup", event => keys[event.key.toLowerCase()] = false);
window.addEventListener("blur", clearControls);
document.addEventListener("visibilitychange", () => { if (document.hidden) clearControls(); });
canvas.addEventListener("pointerdown", event => { if (state.running && event.pointerType !== "touch") { event.preventDefault(); state.pointerShoot = true; } });
window.addEventListener("pointerup", () => state.pointerShoot = false);
window.addEventListener("pointercancel", () => state.pointerShoot = false);

document.querySelectorAll(".touch-key").forEach(button => {
  const control = button.dataset.control;
  const press = event => { event.preventDefault(); touch[control] = true; button.classList.add("is-active"); button.setPointerCapture?.(event.pointerId); };
  const release = event => { event.preventDefault(); touch[control] = false; button.classList.remove("is-active"); };
  button.addEventListener("pointerdown", press); button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release); button.addEventListener("lostpointercapture", release);
});

const initialRoom = normalizeRoomCode(new URLSearchParams(window.location.search).get("room") || "");
if (initialRoom) { elements.roomInput.value = initialRoom; showOnlineMenu(`Room ${initialRoom} is ready to join. Enter your name and press Join Room.`); }
updateWallet();

let lastTime = performance.now();
function gameLoop(now) {
  const dt = Math.min((now - lastTime) / 1000, .05); lastTime = now;
  update(dt, now); draw(now); requestAnimationFrame(gameLoop);
}
updateHud(); requestAnimationFrame(gameLoop);
