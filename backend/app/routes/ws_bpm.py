import base64
import json
import numpy as np
import cv2 as cv

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..services.rppg import RPPGProcessor

router = APIRouter()


@router.websocket("/ws/bpm")
async def ws_bpm(websocket: WebSocket) -> None:
    """
    WebSocket endpoint.

    Protocole :
      → client envoie : JSON { "frame": "<base64 JPEG>" }
      ← serveur renvoie : JSON BPMResponse
    """
    await websocket.accept()
    processor = RPPGProcessor()

    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)

            # Décoder la frame JPEG base64
            frame_b64: str = data.get("frame", "")
            if not frame_b64:
                continue

            # Enlever le préfixe data URI si présent
            if "," in frame_b64:
                frame_b64 = frame_b64.split(",", 1)[1]

            jpg_bytes = base64.b64decode(frame_b64)
            arr = np.frombuffer(jpg_bytes, dtype=np.uint8)
            frame_bgr = cv.imdecode(arr, cv.IMREAD_COLOR)

            if frame_bgr is None:
                continue

            result = processor.process(frame_bgr)
            await websocket.send_text(json.dumps(result.to_dict()))

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        await websocket.close(code=1011, reason=str(exc))