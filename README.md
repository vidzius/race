# Neon Scramble Online

Neon Scramble is a responsive browser racing game for **2–6 online players** or one player against five local bots. Racers follow four checkpoints for three laps, boost, and fire skin-specific projectiles. Hits do not remove health: they slow the target briefly.

The Python server owns movement, projectiles, hits, slowdown, checkpoints, placement and coin rewards. The browser stores each player's coins, unlocked skins and equipped skin on that device.

## Included files

- `index.html`, `styles.css`, `game.js`, `config.js` — itch.io-ready browser client.
- `server.py` — HTTP and authoritative WebSocket multiplayer server.
- `requirements.txt` — Python dependency.
- `render.yaml` — free Render server deployment configuration.
- `start_local.bat` — one-click Windows local server.
- `prepare_itch_build.py` / `.bat` — creates the final itch.io upload after the server URL is known.
- `standalone-index.html` — generated single-file client for inspection or other static hosts.

## Mechanics

- Online rooms accept 2–6 racers. Wait until everyone has joined, then all connected players press **Ready**.
- Move with `WASD`, arrow keys or the touch D-pad.
- Fire with `F`, `Enter`, mouse click or the **Fire** touch button.
- Boost with `Space` or the **Boost** touch button.
- A projectile hit slows an opponent for roughly one second; there is no health or elimination.
- Coins come from placement, checkpoint progress and successful hits.
- Coins unlock skins. Each skin has a small perk and a trade-off. Other players receive the selected skin ID from the server and draw the same skin.

Coins and unlocks use browser `localStorage`. They persist in the same browser/device, including the itch.io web build, but they are not account-synced. Clearing site data resets the profile. This keeps the project free and avoids requiring user accounts or a database.

## Skins

The build includes twelve lightweight canvas-drawn skins with no image downloads:

1. Neon Scout — balanced pulse bolts.
2. Banana Henchling — faster acceleration and banana peels.
3. Square Sea Fry — strong slow resistance and soap bubbles.
4. Espresso Pirouette — higher speed and espresso cups.
5. Jet Gator — very fast pocket-jet projectiles.
6. Furious Toaster — long-lasting burnt-toast slowdown.
7. Tactical Plunger — fast sticky mini plungers.
8. Forklift Fury — heavy pallet hits and high slow resistance.
9. Traffic Cone — very quick acceleration and tiny cone shots.
10. Office Printer — rapid but weaker A4 paperwork.
11. Disco Duck — 25% more race coins and rubber ducklings.
12. Grandma's Slipper — fast-firing flying slippers.

The public build uses original parody names and original primitive artwork rather than official character images, logos or ripped assets. That is much safer for publishing on itch.io. If you replace them with exact licensed characters, you are responsible for obtaining the relevant rights.

## Run locally

### Windows

1. Double-click `start_local.bat`.
2. Wait until the server says it is running.
3. Open <http://127.0.0.1:8765>.

The first start creates `.venv` and installs `websockets`.

### Manual

```powershell
py -m venv .venv
.venv\Scripts\activate
py -m pip install -r requirements.txt
py server.py
```

For separate devices on the same Wi-Fi, run `ipconfig`, find the host PC's IPv4 address, allow Python on private networks in Windows Firewall, and open `http://YOUR-PC-IP:8765` on each device. The host PC must remain on.

## Publish multiplayer on itch.io

itch.io hosts the static HTML client but does **not** run `server.py`. Use this two-part setup:

### 1. Deploy the free multiplayer server

1. Create a GitHub repository and upload all project files to its root.
2. Create a free Render account and connect GitHub.
3. In Render choose **New → Blueprint**, select the repository and apply `render.yaml`.
4. Wait for deployment and copy the resulting URL, such as `https://neon-scramble-online.onrender.com`.
5. Open the Render URL once and check that the game loads.

### 2. Create and upload the itch.io client

1. Double-click `prepare_itch_build.bat`.
2. Paste the Render `https://...onrender.com` URL.
3. The script creates `Neon-Scramble-Itch.zip` with a secure `wss://.../ws` connection configured.
4. On itch.io create or edit a project and choose **HTML Game**.
5. Upload `Neon-Scramble-Itch.zip` and mark it as playable in the browser.
6. Recommended embed choice: **Click to launch in fullscreen**. Enable **Mobile Friendly** and the fullscreen button.
7. If using an embedded viewport instead, choose **1280 × 720**.

Do not upload the full server project as the playable itch ZIP. Upload only the ZIP produced by `prepare_itch_build`.

The client uses relative asset paths, adapts to dynamic iframe/fullscreen sizes, includes touch controls and connects only through secure WSS. The itch ZIP contains four small files at its root, including the required `index.html`.

## Updating the game

After editing browser code, rerun `prepare_itch_build.bat` and replace the itch.io upload. After editing `server.py`, push the changes to GitHub so Render redeploys it.

## Free-host limitation

A free Render web service sleeps after about 15 minutes without HTTP requests or WebSocket messages. Its first visitor after that may wait roughly one minute for it to wake. Active players produce WebSocket traffic, so it should remain awake during a race.
