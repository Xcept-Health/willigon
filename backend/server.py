"""
backend/server.py
=================
FastAPI server — deux rôles :
1. WebSocket /ws/frames  : reçoit les frames JPEG depuis le browser (getUserMedia)
                           → analyse rPPG → renvoie BPM + waveform
2. WebSocket /ws/signal  : broadcast du signal vers tous les clients connectés
3. GET /                 : sert le frontend (en prod)

Lancer : uvicorn backend.server:app --reload --port 8000
"""

import asyncio
import base64
import json
import time
from collections import deque
from typing import Set

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from scipy.signal import butter, filtfilt
 
#  APP

app = FastAPI(title="Willis Live", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


#  PARAMÈTRES rPPG

FPS_ESTIMATE    = 15.0
WINDOW_SEC      = 10
BPM_MIN, BPM_MAX = 45, 180
FREQ_LOW        = BPM_MIN / 60.0
FREQ_HIGH       = BPM_MAX / 60.0
 
#  ÉTAT GLOBAL 

class RPPGState:
    def __init__(self):
        self.rgb_buffer  = deque(maxlen=int(FPS_ESTIMATE * WINDOW_SEC))
        self.time_buffer = deque(maxlen=int(FPS_ESTIMATE * WINDOW_SEC))
        self.bpm         = 0.0
        self.waveform    = []
        self.fps         = FPS_ESTIMATE
        self.detector    = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )

    def update_fps(self):
        times = list(self.time_buffer)
        if len(times) > 5:
            deltas = np.diff(times[-20:])
            if np.mean(deltas) > 0:
                self.fps = float(1.0 / np.mean(deltas))
                self.fps = np.clip(self.fps, 5, 60)

    def process(self, frame_bgr: np.ndarray) -> dict:
        now = time.time()
        gray  = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        faces = self.detector.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
        )

        face_detected = len(faces) > 0
        if not face_detected:
            return {"bpm": 0, "waveform": [], "face": False}

        # Plus grand visage
        fx, fy, fw, fh = max(faces, key=lambda f: f[2]*f[3])

        # ROI front
        rx1 = fx + int(fw * 0.25)
        rx2 = fx + int(fw * 0.75)
        ry1 = fy + int(fh * 0.15)
        ry2 = fy + int(fh * 0.35)
        roi = frame_bgr[ry1:ry2, rx1:rx2]

        if roi.size == 0:
            return {"bpm": 0, "waveform": [], "face": True}

        mean_bgr = roi.reshape(-1, 3).mean(axis=0)
        r, g, b  = float(mean_bgr[2]), float(mean_bgr[1]), float(mean_bgr[0])

        self.rgb_buffer.append([r, g, b])
        self.time_buffer.append(now)
        self.update_fps()

        n = len(self.rgb_buffer)
        min_frames = int(self.fps * 3)
        if n < min_frames:
            return {"bpm": 0, "waveform": [], "face": True, "calibrating": True}

        rgb_arr = np.array(self.rgb_buffer)

        # POS method
        mean_c = rgb_arr.mean(axis=0)
        mean_c = np.where(mean_c == 0, 1e-6, mean_c)
        Cn = rgb_arr / mean_c
        S1 = Cn[:, 1] - Cn[:, 2]
        S2 = Cn[:, 0] + Cn[:, 1] - 2 * Cn[:, 2]
        std1 = np.std(S1) or 1e-6
        std2 = np.std(S2) or 1e-6
        pulse = S1 - (std1 / std2) * S2

        # Bandpass
        nyq = self.fps / 2.0
        lo  = np.clip(FREQ_LOW  / nyq, 1e-4, 0.99)
        hi  = np.clip(FREQ_HIGH / nyq, 1e-4, 0.99)
        if lo < hi:
            b_c, a_c = butter(4, [lo, hi], btype='band')
            filtered = filtfilt(b_c, a_c, pulse)
        else:
            filtered = pulse

        # BPM via FFT
        N = len(filtered)
        windowed = filtered * np.hanning(N)
        fft_v = np.abs(np.fft.rfft(windowed, n=N*4))
        freqs = np.fft.rfftfreq(N*4, d=1.0/self.fps)
        mask  = (freqs >= FREQ_LOW) & (freqs <= FREQ_HIGH)
        if np.any(mask):
            self.bpm = float(freqs[mask][np.argmax(fft_v[mask])] * 60.0)

        # Waveform normalisée [0..1] — dernières 60 valeurs
        wave = filtered[-60:]
        wmin, wmax = wave.min(), wave.max()
        if wmax - wmin > 1e-8:
            wave = (wave - wmin) / (wmax - wmin)
        else:
            wave = np.zeros_like(wave)

        self.waveform = wave.tolist()

        return {
            "bpm":      round(self.bpm, 1),
            "waveform": self.waveform,
            "face":     True,
            "calibrating": False,
        }


# 
#  WEBSOCKET — frames depuis le browser
# 

@app.websocket("/ws/rppg")
async def rppg_endpoint(ws: WebSocket):
    await ws.accept()
    state = RPPGState()
    print("Client connecté — rPPG WebSocket")
    try:
        while True:
            # Reçoit une frame JPEG en base64
            data = await ws.receive_text()
            msg  = json.loads(data)

            if msg.get("type") != "frame":
                continue

            # Décode la frame
            b64 = msg["data"].split(",")[-1]   # retire "data:image/jpeg;base64,"
            jpg = base64.b64decode(b64)
            arr = np.frombuffer(jpg, dtype=np.uint8)
            frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)

            if frame is None:
                continue

            # Analyse rPPG (run dans thread pool pour ne pas bloquer)
            result = await asyncio.get_event_loop().run_in_executor(
                None, state.process, frame
            )

            # Envoie le résultat
            await ws.send_text(json.dumps(result))

    except WebSocketDisconnect:
        print("Client déconnecté")
    except Exception as e:
        print(f"Erreur WebSocket : {e}")


# 
#  HEALTH CHECK
# 

@app.get("/health")
def health():
    return {"status": "ok", "service": "willis-live"}