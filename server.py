"""Neon Scramble HTTP and authoritative six-player WebSocket server.

Run with: python server.py
Then open: http://127.0.0.1:8765
"""

from __future__ import annotations

import asyncio
import json
import math
import os
import random
import secrets
import string
import time
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlsplit

from websockets.asyncio.server import ServerConnection, serve
from websockets.datastructures import Headers
from websockets.http11 import Response


ROOT = Path(__file__).resolve().parent
HOST = "0.0.0.0"
PORT = int(os.environ.get("PORT", "8765"))
TICK_RATE = 30
STATE_RATE = 20
MAX_PLAYERS_PER_ROOM = 6
MIN_PLAYERS_TO_START = 2
MAX_ROOMS = 100
TOTAL_LAPS = 3
BASE_SPEED = 285.0
BOOST_SPEED = 485.0
BOOST_DURATION = 0.34
BOOST_COOLDOWN = 1.8
BASE_SHOT_COOLDOWN = 0.72
BASE_PROJECTILE_SPEED = 650.0
PROJECTILE_LIFETIME = 1.55
BASE_SLOW_FACTOR = 0.56
BASE_SLOW_DURATION = 0.9
CHECKPOINT_RADIUS = 64.0
WORLD_MIN_X, WORLD_MAX_X = 45.0, 1235.0
WORLD_MIN_Y, WORLD_MAX_Y = 118.0, 680.0
CHECKPOINTS = (
    (170.0, 380.0),
    (540.0, 175.0),
    (1095.0, 335.0),
    (690.0, 575.0),
)
RACE_SEQUENCE = (1, 2, 3, 0)
ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
SPAWN_POINTS = (
    (128.0, 270.0),
    (151.0, 314.0),
    (128.0, 358.0),
    (151.0, 402.0),
    (128.0, 446.0),
    (151.0, 490.0),
)
POSITION_REWARDS = (60, 46, 36, 29, 24, 20)

# Multipliers stay deliberately small so skins feel different without becoming
# pay-to-win. Coins and unlocks live in the browser; the server owns all physics.
SKIN_PERKS: dict[str, dict[str, float]] = {
    "neon_scout": {
        "speed": 1.00, "accel": 1.00, "boost": 1.00, "boost_cooldown": 1.00,
        "fire_rate": 1.00, "projectile_speed": 1.00, "projectile_size": 1.00,
        "slow_power": 1.00, "slow_duration": 1.00, "slow_resist": 0.00, "coin": 1.00,
    },
    "banana_henchling": {
        "speed": 0.98, "accel": 1.09, "boost": 1.02, "boost_cooldown": 1.00,
        "fire_rate": 1.05, "projectile_speed": 0.96, "projectile_size": 1.12,
        "slow_power": 1.00, "slow_duration": 1.05, "slow_resist": 0.05, "coin": 1.00,
    },
    "square_sea_fry": {
        "speed": 0.97, "accel": 1.00, "boost": 0.98, "boost_cooldown": 1.00,
        "fire_rate": 0.95, "projectile_speed": 0.92, "projectile_size": 1.25,
        "slow_power": 0.96, "slow_duration": 1.08, "slow_resist": 0.34, "coin": 1.00,
    },
    "espresso_pirouette": {
        "speed": 1.06, "accel": 1.03, "boost": 0.97, "boost_cooldown": 1.10,
        "fire_rate": 1.00, "projectile_speed": 1.04, "projectile_size": 0.92,
        "slow_power": 0.95, "slow_duration": 0.95, "slow_resist": 0.00, "coin": 1.00,
    },
    "jet_gator": {
        "speed": 1.02, "accel": 0.98, "boost": 1.06, "boost_cooldown": 1.08,
        "fire_rate": 0.94, "projectile_speed": 1.22, "projectile_size": 0.88,
        "slow_power": 1.00, "slow_duration": 0.92, "slow_resist": 0.08, "coin": 1.00,
    },
    "furious_toaster": {
        "speed": 0.97, "accel": 0.98, "boost": 1.00, "boost_cooldown": 1.00,
        "fire_rate": 0.88, "projectile_speed": 0.94, "projectile_size": 1.18,
        "slow_power": 1.04, "slow_duration": 1.24, "slow_resist": 0.14, "coin": 1.00,
    },
    "tactical_plunger": {
        "speed": 0.99, "accel": 1.02, "boost": 1.00, "boost_cooldown": 0.96,
        "fire_rate": 1.06, "projectile_speed": 1.08, "projectile_size": 1.18,
        "slow_power": 1.05, "slow_duration": 1.00, "slow_resist": 0.03, "coin": 1.00,
    },
    "forklift_fury": {
        "speed": 0.93, "accel": 0.91, "boost": 1.10, "boost_cooldown": 1.12,
        "fire_rate": 0.82, "projectile_speed": 0.84, "projectile_size": 1.38,
        "slow_power": 1.22, "slow_duration": 1.12, "slow_resist": 0.52, "coin": 1.00,
    },
    "traffic_cone": {
        "speed": 0.99, "accel": 1.14, "boost": 1.00, "boost_cooldown": 0.92,
        "fire_rate": 1.00, "projectile_speed": 1.00, "projectile_size": 1.00,
        "slow_power": 0.96, "slow_duration": 0.96, "slow_resist": 0.06, "coin": 1.00,
    },
    "office_printer": {
        "speed": 0.98, "accel": 0.98, "boost": 0.98, "boost_cooldown": 1.00,
        "fire_rate": 1.32, "projectile_speed": 1.06, "projectile_size": 0.82,
        "slow_power": 0.76, "slow_duration": 0.82, "slow_resist": 0.10, "coin": 1.00,
    },
    "disco_duck": {
        "speed": 1.00, "accel": 1.00, "boost": 1.00, "boost_cooldown": 1.00,
        "fire_rate": 0.98, "projectile_speed": 0.98, "projectile_size": 1.08,
        "slow_power": 0.98, "slow_duration": 1.00, "slow_resist": 0.05, "coin": 1.25,
    },
    "grandmas_slipper": {
        "speed": 1.01, "accel": 1.01, "boost": 0.98, "boost_cooldown": 1.00,
        "fire_rate": 1.13, "projectile_speed": 1.14, "projectile_size": 0.96,
        "slow_power": 1.00, "slow_duration": 0.94, "slow_resist": 0.02, "coin": 1.00,
    },
}


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def safe_name(value: object) -> str:
    if not isinstance(value, str):
        return "Player"
    cleaned = "".join(character for character in value.strip() if character.isprintable())
    return cleaned[:20] or "Player"


def safe_room_code(value: object) -> str:
    if not isinstance(value, str):
        return ""
    allowed = string.ascii_uppercase + string.digits
    return "".join(character for character in value.upper() if character in allowed)[:8]


def safe_skin(value: object) -> str:
    return value if isinstance(value, str) and value in SKIN_PERKS else "neon_scout"


@dataclass
class Projectile:
    projectile_id: int
    owner_id: str
    skin_id: str
    x: float
    y: float
    vx: float
    vy: float
    radius: float
    expires_at: float

    def public_state(self) -> dict[str, object]:
        return {
            "projectileId": self.projectile_id,
            "ownerId": self.owner_id,
            "skinId": self.skin_id,
            "x": round(self.x, 2),
            "y": round(self.y, 2),
            "angle": round(math.atan2(self.vy, self.vx), 4),
            "radius": round(self.radius, 2),
        }


@dataclass
class Player:
    websocket: ServerConnection
    player_id: str = field(default_factory=lambda: secrets.token_hex(8))
    name: str = "Player"
    skin_id: str = "neon_scout"
    room_code: str | None = None
    slot: int = 0
    ready: bool = False
    x: float = 128.0
    y: float = 270.0
    vx: float = 0.0
    vy: float = 0.0
    angle: float = -math.pi / 4
    speed: float = 0.0
    lap: int = 1
    next_checkpoint: int = 1
    passed_count: int = 0
    position: int = 1
    finished: bool = False
    finish_time: float | None = None
    boost_until: float = 0.0
    boost_cooldown_until: float = 0.0
    shot_cooldown_until: float = 0.0
    boost_input_down: bool = False
    slowed_until: float = 0.0
    slow_factor: float = 1.0
    hits: int = 0
    input_state: dict[str, bool] = field(
        default_factory=lambda: {
            "up": False, "down": False, "left": False, "right": False,
            "boost": False, "shoot": False,
        }
    )
    send_lock: asyncio.Lock = field(default_factory=asyncio.Lock)

    @property
    def perks(self) -> dict[str, float]:
        return SKIN_PERKS[self.skin_id]

    def reset_for_race(self) -> None:
        self.x, self.y = SPAWN_POINTS[self.slot]
        self.vx = self.vy = 0.0
        self.angle = -math.pi / 4
        self.speed = 0.0
        self.lap = 1
        self.next_checkpoint = 1
        self.passed_count = 0
        self.position = self.slot + 1
        self.finished = False
        self.finish_time = None
        self.boost_until = 0.0
        self.boost_cooldown_until = 0.0
        self.shot_cooldown_until = 0.0
        self.boost_input_down = False
        self.slowed_until = 0.0
        self.slow_factor = 1.0
        self.hits = 0
        for key in self.input_state:
            self.input_state[key] = False

    def public_lobby(self) -> dict[str, object]:
        return {
            "playerId": self.player_id,
            "name": self.name,
            "ready": self.ready,
            "skinId": self.skin_id,
            "slot": self.slot,
        }

    def public_state(self, now: float) -> dict[str, object]:
        boost_cooldown = BOOST_COOLDOWN * self.perks["boost_cooldown"]
        shot_cooldown = BASE_SHOT_COOLDOWN / self.perks["fire_rate"]
        return {
            "playerId": self.player_id,
            "name": self.name,
            "skinId": self.skin_id,
            "slot": self.slot,
            "x": round(self.x, 2),
            "y": round(self.y, 2),
            "angle": round(self.angle, 4),
            "speed": round(self.speed, 2),
            "lap": self.lap,
            "nextCheckpoint": self.next_checkpoint,
            "passedCount": self.passed_count,
            "position": self.position,
            "finished": self.finished,
            "hits": self.hits,
            "slowed": now < self.slowed_until,
            "slowRemaining": round(max(0.0, self.slowed_until - now), 2),
            "boostReady": round(clamp(1 - (self.boost_cooldown_until - now) / boost_cooldown, 0, 1), 3),
            "shotReady": round(clamp(1 - (self.shot_cooldown_until - now) / shot_cooldown, 0, 1), 3),
        }


@dataclass
class Room:
    code: str
    players: dict[str, Player] = field(default_factory=dict)
    projectiles: dict[int, Projectile] = field(default_factory=dict)
    phase: str = "lobby"
    countdown_task: asyncio.Task[None] | None = None
    projectile_sequence: int = 0
    race_id: str = ""

    def ordered_players(self) -> list[Player]:
        return sorted(self.players.values(), key=lambda player: player.slot)


ROOMS: dict[str, Room] = {}


def new_room_code() -> str:
    for _ in range(100):
        code = "".join(random.choice(ROOM_ALPHABET) for _ in range(5))
        if code not in ROOMS:
            return code
    raise RuntimeError("Could not allocate a room code")


async def send_json(player: Player, payload: dict[str, object]) -> bool:
    try:
        encoded = json.dumps(payload, separators=(",", ":"))
        async with player.send_lock:
            await player.websocket.send(encoded)
        return True
    except Exception:
        return False


async def broadcast(room: Room, payload: dict[str, object]) -> None:
    players = list(room.players.values())
    if players:
        await asyncio.gather(*(send_json(player, payload) for player in players))


async def broadcast_player_list(room: Room, message_type: str = "player_list") -> None:
    await broadcast(
        room,
        {
            "type": message_type,
            "roomCode": room.code,
            "maxPlayers": MAX_PLAYERS_PER_ROOM,
            "players": [player.public_lobby() for player in room.ordered_players()],
        },
    )


async def join_room(player: Player, message: dict[str, object]) -> None:
    if player.room_code is not None:
        await send_json(player, {"type": "error", "message": "You already joined a room."})
        return
    requested_code = safe_room_code(message.get("room", ""))
    if requested_code and len(requested_code) < 4:
        await send_json(player, {"type": "error", "message": "Room codes have 4–8 letters or numbers."})
        return
    if requested_code:
        room = ROOMS.get(requested_code)
        if room is None:
            await send_json(player, {"type": "error", "message": "That room does not exist. Check the code and try again."})
            return
    else:
        if len(ROOMS) >= MAX_ROOMS:
            await send_json(player, {"type": "error", "message": "The server has too many open rooms. Try again shortly."})
            return
        room = Room(new_room_code())
        ROOMS[room.code] = room
    if len(room.players) >= MAX_PLAYERS_PER_ROOM:
        await send_json(player, {"type": "error", "message": "That six-player room is full."})
        return
    if room.phase != "lobby":
        await send_json(player, {"type": "error", "message": "That room is already racing."})
        return

    used_slots = {existing.slot for existing in room.players.values()}
    player.slot = next(slot for slot in range(MAX_PLAYERS_PER_ROOM) if slot not in used_slots)
    player.name = safe_name(message.get("name"))
    player.skin_id = safe_skin(message.get("skinId"))
    player.room_code = room.code
    player.ready = False
    player.reset_for_race()
    room.players[player.player_id] = player
    await send_json(
        player,
        {
            "type": "join_accepted",
            "roomCode": room.code,
            "maxPlayers": MAX_PLAYERS_PER_ROOM,
            "players": [member.public_lobby() for member in room.ordered_players()],
        },
    )
    await broadcast_player_list(room)


async def set_ready(player: Player, value: object) -> None:
    room = ROOMS.get(player.room_code or "")
    if room is None or room.phase != "lobby":
        return
    player.ready = bool(value)
    await broadcast_player_list(room)
    enough_players = len(room.players) >= MIN_PLAYERS_TO_START
    everyone_ready = all(member.ready for member in room.players.values())
    if enough_players and everyone_ready:
        room.phase = "countdown"
        room.countdown_task = asyncio.create_task(run_countdown(room))


async def set_skin(player: Player, value: object) -> None:
    room = ROOMS.get(player.room_code or "")
    if room is None or room.phase != "lobby" or player.ready:
        return
    player.skin_id = safe_skin(value)
    await broadcast_player_list(room)


async def run_countdown(room: Room) -> None:
    try:
        for value in (3, 2, 1):
            enough = len(room.players) >= MIN_PLAYERS_TO_START
            ready = bool(room.players) and all(player.ready for player in room.players.values())
            if not enough or not ready:
                room.phase = "lobby"
                return
            await broadcast(room, {"type": "countdown", "value": value})
            await asyncio.sleep(1)
        room.projectiles.clear()
        room.race_id = secrets.token_hex(6)
        for player in room.players.values():
            player.reset_for_race()
        room.phase = "racing"
        await broadcast(
            room,
            {"type": "race_started", "totalLaps": TOTAL_LAPS, "raceId": room.race_id},
        )
    except asyncio.CancelledError:
        raise
    finally:
        room.countdown_task = None


def apply_input(player: Player, value: object) -> None:
    room = ROOMS.get(player.room_code or "")
    if room is None or room.phase != "racing" or not isinstance(value, dict):
        return
    for key in ("up", "down", "left", "right", "boost", "shoot"):
        player.input_state[key] = bool(value.get(key, False))
    boost_down = player.input_state["boost"]
    now = time.monotonic()
    boost_cooldown = BOOST_COOLDOWN * player.perks["boost_cooldown"]
    if boost_down and not player.boost_input_down and now >= player.boost_cooldown_until:
        player.boost_until = now + BOOST_DURATION
        player.boost_cooldown_until = now + boost_cooldown
    player.boost_input_down = boost_down


async def handle_message(player: Player, raw_message: str | bytes) -> None:
    if isinstance(raw_message, bytes):
        try:
            raw_message = raw_message.decode("utf-8")
        except UnicodeDecodeError:
            return
    try:
        message = json.loads(raw_message)
    except json.JSONDecodeError:
        await send_json(player, {"type": "error", "message": "Invalid JSON message."})
        return
    if not isinstance(message, dict):
        return
    message_type = message.get("type")
    if message_type == "join":
        await join_room(player, message)
    elif message_type == "ready":
        await set_ready(player, message.get("value", False))
    elif message_type == "skin":
        await set_skin(player, message.get("skinId"))
    elif message_type == "input":
        apply_input(player, message.get("input"))


def update_player(player: Player, dt: float, now: float) -> None:
    controls = player.input_state
    dx = float(controls["right"]) - float(controls["left"])
    dy = float(controls["down"]) - float(controls["up"])
    length = math.hypot(dx, dy)
    if length:
        dx /= length
        dy /= length
    slow_multiplier = player.slow_factor if now < player.slowed_until else 1.0
    if now >= player.slowed_until:
        player.slow_factor = 1.0
    base_max_speed = BOOST_SPEED * player.perks["boost"] if now < player.boost_until else BASE_SPEED
    max_speed = base_max_speed * player.perks["speed"] * slow_multiplier
    response = (13 if length else 8) * player.perks["accel"]
    smoothing = 1 - math.exp(-response * dt)
    player.vx += (dx * max_speed - player.vx) * smoothing
    player.vy += (dy * max_speed - player.vy) * smoothing
    player.x = clamp(player.x + player.vx * dt, WORLD_MIN_X, WORLD_MAX_X)
    player.y = clamp(player.y + player.vy * dt, WORLD_MIN_Y, WORLD_MAX_Y)
    player.speed = math.hypot(player.vx, player.vy)
    if player.speed > 8:
        player.angle = math.atan2(player.vy, player.vx)
    if player.finished:
        return
    checkpoint_x, checkpoint_y = CHECKPOINTS[player.next_checkpoint]
    if math.hypot(player.x - checkpoint_x, player.y - checkpoint_y) <= CHECKPOINT_RADIUS:
        player.passed_count += 1
        if player.passed_count >= TOTAL_LAPS * len(CHECKPOINTS):
            player.finished = True
            player.finish_time = now
            player.lap = TOTAL_LAPS
        else:
            player.next_checkpoint = RACE_SEQUENCE[player.passed_count % len(RACE_SEQUENCE)]
            player.lap = player.passed_count // len(CHECKPOINTS) + 1


def maybe_spawn_projectile(room: Room, player: Player, now: float) -> None:
    if not player.input_state["shoot"] or player.finished or now < player.shot_cooldown_until:
        return
    room.projectile_sequence += 1
    speed = BASE_PROJECTILE_SPEED * player.perks["projectile_speed"]
    radius = 10.0 * player.perks["projectile_size"]
    player.shot_cooldown_until = now + BASE_SHOT_COOLDOWN / player.perks["fire_rate"]
    room.projectiles[room.projectile_sequence] = Projectile(
        projectile_id=room.projectile_sequence,
        owner_id=player.player_id,
        skin_id=player.skin_id,
        x=player.x + math.cos(player.angle) * 34,
        y=player.y + math.sin(player.angle) * 34,
        vx=math.cos(player.angle) * speed,
        vy=math.sin(player.angle) * speed,
        radius=radius,
        expires_at=now + PROJECTILE_LIFETIME,
    )


def update_projectiles(room: Room, dt: float, now: float) -> list[dict[str, object]]:
    hit_events: list[dict[str, object]] = []
    for projectile_id, projectile in list(room.projectiles.items()):
        projectile.x += projectile.vx * dt
        projectile.y += projectile.vy * dt
        outside = not (WORLD_MIN_X - 30 <= projectile.x <= WORLD_MAX_X + 30 and WORLD_MIN_Y - 30 <= projectile.y <= WORLD_MAX_Y + 30)
        if outside or now >= projectile.expires_at:
            room.projectiles.pop(projectile_id, None)
            continue
        shooter = room.players.get(projectile.owner_id)
        if shooter is None:
            room.projectiles.pop(projectile_id, None)
            continue
        for target in room.players.values():
            if target.player_id == projectile.owner_id or target.finished:
                continue
            collision_distance = projectile.radius + 25
            if math.hypot(projectile.x - target.x, projectile.y - target.y) > collision_distance:
                continue
            resistance = target.perks["slow_resist"]
            speed_loss = (1 - BASE_SLOW_FACTOR) * shooter.perks["slow_power"] * (1 - resistance)
            applied_factor = clamp(1 - speed_loss, 0.35, 0.9)
            duration = BASE_SLOW_DURATION * shooter.perks["slow_duration"] * (1 - resistance * 0.45)
            if now >= target.slowed_until:
                target.slow_factor = applied_factor
            else:
                target.slow_factor = min(target.slow_factor, applied_factor)
            target.slowed_until = max(target.slowed_until, now + duration)
            shooter.hits += 1
            hit_events.append(
                {
                    "type": "player_hit",
                    "shooterId": shooter.player_id,
                    "targetId": target.player_id,
                    "skinId": shooter.skin_id,
                    "x": round(target.x, 2),
                    "y": round(target.y, 2),
                }
            )
            room.projectiles.pop(projectile_id, None)
            break
    return hit_events


def race_progress(player: Player) -> float:
    checkpoint_x, checkpoint_y = CHECKPOINTS[player.next_checkpoint]
    distance = math.hypot(player.x - checkpoint_x, player.y - checkpoint_y)
    return player.passed_count + clamp(1 - distance / 700, 0, 0.95)


def rank_players(room: Room) -> list[Player]:
    def key(player: Player) -> tuple[int, float]:
        if player.finished:
            return (1, -(player.finish_time or float("inf")))
        return (0, race_progress(player))

    ranked = sorted(room.players.values(), key=key, reverse=True)
    for index, player in enumerate(ranked, start=1):
        player.position = index
    return ranked


async def finish_race(room: Room, ranked: list[Player]) -> None:
    room.phase = "lobby"
    room.projectiles.clear()
    results = []
    for index, player in enumerate(ranked, start=1):
        base = POSITION_REWARDS[min(index - 1, len(POSITION_REWARDS) - 1)]
        checkpoint_bonus = min(player.passed_count, TOTAL_LAPS * len(CHECKPOINTS))
        hit_bonus = min(player.hits * 2, 30)
        coins = round((base + checkpoint_bonus + hit_bonus) * player.perks["coin"])
        results.append(
            {
                "position": index,
                "playerId": player.player_id,
                "name": player.name,
                "skinId": player.skin_id,
                "hits": player.hits,
                "coins": coins,
            }
        )
        player.ready = False
        for key in player.input_state:
            player.input_state[key] = False
    await broadcast(room, {"type": "race_finished", "raceId": room.race_id, "results": results})


async def game_loop() -> None:
    tick_interval = 1 / TICK_RATE
    broadcast_every = max(1, round(TICK_RATE / STATE_RATE))
    tick_number = 0
    previous = time.monotonic()
    while True:
        started = time.monotonic()
        dt = min(started - previous, 0.05)
        previous = started
        tick_number += 1
        for room in list(ROOMS.values()):
            if room.phase != "racing":
                continue
            now = time.monotonic()
            for player in room.players.values():
                update_player(player, dt, now)
                maybe_spawn_projectile(room, player, now)
            hit_events = update_projectiles(room, dt, now)
            for hit_event in hit_events:
                await broadcast(room, hit_event)
            ranked = rank_players(room)
            if tick_number % broadcast_every == 0:
                await broadcast(
                    room,
                    {
                        "type": "game_state",
                        "raceId": room.race_id,
                        "players": [player.public_state(now) for player in room.ordered_players()],
                        "projectiles": [projectile.public_state() for projectile in room.projectiles.values()],
                    },
                )
            if ranked and ranked[0].finished:
                await finish_race(room, ranked)
        elapsed = time.monotonic() - started
        await asyncio.sleep(max(0, tick_interval - elapsed))


async def leave_room(player: Player) -> None:
    room = ROOMS.get(player.room_code or "")
    player.room_code = None
    if room is None:
        return
    room.players.pop(player.player_id, None)
    room.projectiles = {
        projectile_id: projectile
        for projectile_id, projectile in room.projectiles.items()
        if projectile.owner_id != player.player_id
    }
    if room.countdown_task is not None:
        room.countdown_task.cancel()
    room.phase = "lobby"
    room.projectiles.clear()
    for remaining in room.players.values():
        remaining.ready = False
        for key in remaining.input_state:
            remaining.input_state[key] = False
    if not room.players:
        ROOMS.pop(room.code, None)
        return
    await broadcast_player_list(room, "player_left")


async def websocket_handler(websocket: ServerConnection) -> None:
    if urlsplit(websocket.request.path).path != "/ws":
        await websocket.close(1008, "Unknown WebSocket path")
        return
    player = Player(websocket)
    await send_json(
        player,
        {
            "type": "connected",
            "playerId": player.player_id,
            "maxPlayers": MAX_PLAYERS_PER_ROOM,
        },
    )
    try:
        async for raw_message in websocket:
            await handle_message(player, raw_message)
    finally:
        await leave_room(player)


def http_response(status: int, reason: str, body: bytes, content_type: str) -> Response:
    headers = Headers(
        [
            ("Content-Type", content_type),
            ("Content-Length", str(len(body))),
            ("Cache-Control", "no-store"),
            ("X-Content-Type-Options", "nosniff"),
            ("Referrer-Policy", "no-referrer"),
        ]
    )
    return Response(status, reason, headers, body)


async def process_http_request(_connection: ServerConnection, request) -> Response | None:
    path = urlsplit(request.path).path
    if path == "/ws":
        if request.headers.get("Upgrade", "").lower() == "websocket":
            return None
        return http_response(426, "Upgrade Required", b"WebSocket upgrade required.\n", "text/plain; charset=utf-8")
    static_files = {
        "/": ("index.html", "text/html; charset=utf-8"),
        "/index.html": ("index.html", "text/html; charset=utf-8"),
        "/styles.css": ("styles.css", "text/css; charset=utf-8"),
        "/game.js": ("game.js", "text/javascript; charset=utf-8"),
        "/config.js": ("config.js", "text/javascript; charset=utf-8"),
    }
    if path == "/health":
        return http_response(200, "OK", b'{"status":"ok"}\n', "application/json; charset=utf-8")
    if path in static_files:
        filename, content_type = static_files[path]
        file_path = ROOT / filename
        if file_path.exists():
            return http_response(200, "OK", file_path.read_bytes(), content_type)
    return http_response(404, "Not Found", b"Not found.\n", "text/plain; charset=utf-8")


async def main() -> None:
    update_task = asyncio.create_task(game_loop())
    try:
        async with serve(
            websocket_handler,
            HOST,
            PORT,
            process_request=process_http_request,
            max_size=8_192,
            ping_interval=20,
            ping_timeout=20,
        ):
            print(f"Neon Scramble is running at http://127.0.0.1:{PORT}")
            print("Press Ctrl+C to stop the server.")
            await asyncio.Future()
    finally:
        update_task.cancel()
        await asyncio.gather(update_task, return_exceptions=True)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
