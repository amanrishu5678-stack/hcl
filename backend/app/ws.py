from fastapi import WebSocket
from typing import Set
import json

clients: Set[WebSocket] = set()

async def connect(ws: WebSocket):
    await ws.accept()
    clients.add(ws)

def disconnect(ws: WebSocket):
    clients.discard(ws)

async def broadcast(payload):
    dead = []
    for ws in list(clients):
        try:
            await ws.send_text(json.dumps(payload, default=str))
        except Exception:
            dead.append(ws)
    for ws in dead:
        disconnect(ws)
