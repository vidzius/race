"""Create the static itch.io upload ZIP with its public WSS server configured."""

from __future__ import annotations

import json
import sys
import zipfile
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "Neon-Scramble-Itch.zip"
CLIENT_FILES = ("index.html", "styles.css", "game.js")


def websocket_url(value: str) -> str:
    value = value.strip().rstrip("/")
    if not value:
        raise ValueError("A Render service URL is required.")
    if "://" not in value:
        value = "https://" + value
    parsed = urlparse(value)
    if parsed.scheme not in {"https", "wss"} or not parsed.netloc:
        raise ValueError("Use your public HTTPS Render URL, for example https://my-game.onrender.com")
    path = parsed.path.rstrip("/")
    if not path.endswith("/ws"):
        path += "/ws"
    return f"wss://{parsed.netloc}{path}"


def main() -> int:
    supplied = " ".join(sys.argv[1:]).strip()
    if not supplied:
        supplied = input("Paste the public Render URL (https://...onrender.com): ").strip()
    try:
        server_url = websocket_url(supplied)
    except ValueError as error:
        print(f"Error: {error}")
        return 2

    config = (
        "window.NEON_SCRAMBLE_CONFIG = Object.freeze({\n"
        f"  serverUrl: {json.dumps(server_url)}\n"
        "});\n"
    )
    for filename in CLIENT_FILES:
        if not (ROOT / filename).is_file():
            print(f"Error: missing {filename}")
            return 2

    with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for filename in CLIENT_FILES:
            archive.write(ROOT / filename, filename)
        archive.writestr("config.js", config)

    with zipfile.ZipFile(OUTPUT) as archive:
        names = set(archive.namelist())
        if names != {*CLIENT_FILES, "config.js"} or archive.testzip() is not None:
            print("Error: itch.io archive validation failed.")
            return 2
    print(f"Created: {OUTPUT.name}")
    print(f"Multiplayer server: {server_url}")
    print("Upload this ZIP as an HTML Game on itch.io.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
