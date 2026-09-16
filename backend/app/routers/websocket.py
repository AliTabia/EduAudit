"""
Feature 4 — Real-Time Collaborative Audit Review
WebSocket endpoint for live multi-user commenting on audit reports.
"""

import json
import logging
from datetime import datetime
from typing import Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.websockets import WebSocketState

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/collab", tags=["Collaboration"])

# In-memory store: audit_id → list of connected websockets
_connections: Dict[str, List[WebSocket]] = {}
# In-memory comment store: audit_id → list of comments
_comments: Dict[str, List[dict]] = {}


class ConnectionManager:
    def connect(self, audit_id: str, ws: WebSocket):
        _connections.setdefault(audit_id, []).append(ws)

    def disconnect(self, audit_id: str, ws: WebSocket):
        if audit_id in _connections:
            _connections[audit_id] = [c for c in _connections[audit_id] if c != ws]

    async def broadcast(self, audit_id: str, message: dict, exclude: WebSocket = None):
        dead = []
        for ws in _connections.get(audit_id, []):
            if ws is exclude:
                continue
            try:
                if ws.client_state == WebSocketState.CONNECTED:
                    await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(audit_id, ws)

    def get_comment_count(self, audit_id: str) -> int:
        return len(_comments.get(audit_id, []))


manager = ConnectionManager()


@router.websocket("/ws/{audit_id}")
async def collab_ws(websocket: WebSocket, audit_id: str):
    """
    WebSocket endpoint for collaborative review.
    Client sends JSON: {"type": "comment"|"cursor"|"ping", ...}
    Server broadcasts to all connected clients on same audit.
    """
    await websocket.accept()
    manager.connect(audit_id, websocket)
    logger.info(f"WS connected to audit {audit_id}. Total: {len(_connections.get(audit_id,[]))}")

    # Send existing comments to new joiner
    existing = _comments.get(audit_id, [])
    await websocket.send_json({
        "type": "history",
        "comments": existing,
        "online_count": len(_connections.get(audit_id, [])),
    })

    # Broadcast join event
    await manager.broadcast(audit_id, {
        "type": "user_joined",
        "online_count": len(_connections.get(audit_id, [])),
        "timestamp": datetime.utcnow().isoformat(),
    }, exclude=websocket)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = data.get("type", "")

            if msg_type == "comment":
                comment = {
                    "id":        f"c_{datetime.utcnow().timestamp()}",
                    "author":    data.get("author", "Anonymous"),
                    "avatar_color": data.get("avatar_color", "#D01012"),
                    "text":      data.get("text", "")[:500],
                    "section":   data.get("section", "general"),
                    "timestamp": datetime.utcnow().isoformat(),
                }
                _comments.setdefault(audit_id, []).append(comment)
                # Broadcast to all (including sender)
                await manager.broadcast(audit_id, {"type": "comment", "comment": comment})
                await websocket.send_json({"type": "comment", "comment": comment})

            elif msg_type == "reaction":
                await manager.broadcast(audit_id, {
                    "type":      "reaction",
                    "comment_id": data.get("comment_id"),
                    "emoji":     data.get("emoji", "👍"),
                    "author":    data.get("author", ""),
                    "timestamp": datetime.utcnow().isoformat(),
                })

            elif msg_type == "cursor":
                await manager.broadcast(audit_id, {
                    "type":   "cursor",
                    "author": data.get("author", ""),
                    "section": data.get("section", ""),
                }, exclude=websocket)

            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(audit_id, websocket)
        await manager.broadcast(audit_id, {
            "type": "user_left",
            "online_count": len(_connections.get(audit_id, [])),
            "timestamp": datetime.utcnow().isoformat(),
        })
        logger.info(f"WS disconnected from audit {audit_id}")


@router.get("/comments/{audit_id}", summary="Get comments for an audit (REST fallback)")
async def get_comments(audit_id: str):
    return {
        "audit_id":  audit_id,
        "comments":  _comments.get(audit_id, []),
        "total":     len(_comments.get(audit_id, [])),
        "online_now": len(_connections.get(audit_id, [])),
    }
