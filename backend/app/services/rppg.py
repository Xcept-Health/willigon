import numpy as np
import cv2 as cv

from .gaussian_pyramid import get_level
from .fft_processor import build_frequency_mask, dominant_bpm
from .face_detector import FaceDetector


VIDEO_W = 160
VIDEO_H = 120
VIDEO_C = 3
PYRAMID_LEVELS = 3


class RPPGProcessor:
    """
    Pipeline rPPG complet.
    Portage de heartrate.py adapté pour traitement frame-by-frame
    sans accès caméra direct (les frames arrivent via WebSocket).

    Usage:
        proc = RPPGProcessor()
        result = proc.process(frame_bgr)
        # result.bpm, result.signal, result.status, result.bbox
    """

    def __init__(
        self,
        buffer_size: int = 150,
        fps: float = 15.0,
        freq_min: float = 1.0,
        freq_max: float = 2.0,
        bpm_calc_freq: int = 10,
        bpm_buffer_size: int = 10,
        alpha: float = 170.0,
    ) -> None:
        self.buffer_size = buffer_size
        self.fps = fps
        self.alpha = alpha
        self.bpm_calc_freq = bpm_calc_freq

        # Initialisation du buffer gaussien (même logique que heartrate.py)
        first_frame = np.zeros((VIDEO_H, VIDEO_W, VIDEO_C), dtype=np.float32)
        first_gauss = get_level(first_frame, PYRAMID_LEVELS + 1)
        self.video_gaussian = np.zeros(
            (buffer_size, first_gauss.shape[0], first_gauss.shape[1], VIDEO_C),
            dtype=np.float32,
        )

        # Fréquences et masque passe-bande
        self.frequencies = (fps * np.arange(buffer_size)) / buffer_size
        self.mask = build_frequency_mask(buffer_size, fps, freq_min, freq_max)

        # Buffer BPM (moyenne glissante)
        self.bpm_buffer = np.zeros(bpm_buffer_size)
        self.bpm_buffer_index = 0
        self.bpm_buffer_size = bpm_buffer_size

        # Compteurs
        self.buffer_index = 0
        self.frame_count = 0

        self.face_detector = FaceDetector()

    # ------------------------------------------------------------------

    def process(self, frame_bgr: np.ndarray) -> "RPPGResult":
        """
        Traite une frame BGR et retourne le résultat courant.
        Appelé à chaque frame reçue via WebSocket.
        """
        self.frame_count += 1

        bbox = self.face_detector.detect(frame_bgr)

        if bbox is None:
            return RPPGResult(
                bpm=0.0,
                signal=[],
                status="no_face",
                bbox=None,
                ready=False,
            )

        x, y, w, h = bbox
        roi = self.face_detector.crop_roi(frame_bgr, bbox)
        roi_f = roi.astype(np.float32)

        # Construire la pyramide gaussienne et stocker dans le buffer
        self.video_gaussian[self.buffer_index] = get_level(roi_f, PYRAMID_LEVELS + 1)

        # Calculer le BPM tous les `bpm_calc_freq` frames
        if self.buffer_index % self.bpm_calc_freq == 0:
            bpm_val, signal, _ = dominant_bpm(
                self.video_gaussian,
                self.mask,
                self.frequencies,
                self.buffer_size,
            )
            self.bpm_buffer[self.bpm_buffer_index] = bpm_val
            self.bpm_buffer_index = (self.bpm_buffer_index + 1) % self.bpm_buffer_size
        else:
            signal = np.zeros(self.buffer_size)

        self.buffer_index = (self.buffer_index + 1) % self.buffer_size

        ready = self.frame_count > self.bpm_buffer_size * self.bpm_calc_freq
        avg_bpm = float(self.bpm_buffer.mean()) if ready else 0.0

        status = _classify_bpm(avg_bpm) if ready else "estimating"

        return RPPGResult(
            bpm=round(avg_bpm, 1),
            signal=signal.tolist(),
            status=status,
            bbox={"x": x, "y": y, "w": w, "h": h},
            ready=ready,
        )

    def reset(self) -> None:
        """Remet le processeur à zéro (nouveau sujet)."""
        self.video_gaussian[:] = 0
        self.bpm_buffer[:] = 0
        self.buffer_index = 0
        self.bpm_buffer_index = 0
        self.frame_count = 0


# ------------------------------------------------------------------

def _classify_bpm(bpm: float) -> str:
    if bpm <= 0:
        return "estimating"
    if bpm <= 30:
        return "critical_low"
    if bpm <= 60:
        return "brady"
    if bpm <= 100:
        return "normal"
    if bpm <= 120:
        return "tachy"
    return "critical_high"


class RPPGResult:
    __slots__ = ("bpm", "signal", "status", "bbox", "ready")

    def __init__(
        self,
        bpm: float,
        signal: list[float],
        status: str,
        bbox: dict | None,
        ready: bool,
    ) -> None:
        self.bpm = bpm
        self.signal = signal
        self.status = status
        self.bbox = bbox
        self.ready = ready

    def to_dict(self) -> dict:
        return {
            "bpm": self.bpm,
            "signal": self.signal,
            "status": self.status,
            "bbox": self.bbox,
            "ready": self.ready,
        }