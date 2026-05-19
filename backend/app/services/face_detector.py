import numpy as np
import cv2 as cv
from cvzone.FaceDetectionModule import FaceDetector as CvzoneFaceDetector


class FaceDetector:
    """
    Détecteur de visage basé sur cvzone.FaceDetectionModule,
    identique à celui utilisé dans heartrate.py.
    Utilise BlazeFace (MediaPipe sous le capot) via cvzone.
    """

    def __init__(self, min_detection_confidence: float = 0.5) -> None:
        # minDetectionCon correspond au seuil de confiance BlazeFace
        self._detector = CvzoneFaceDetector(minDetectionCon=min_detection_confidence)

    def detect(self, frame: np.ndarray) -> tuple[int, int, int, int] | None:
        """
        Args:
            frame: image BGR uint8

        Returns:
            (x, y, w, h) de la plus grande face détectée, ou None.
        """
        # cvzone attend du BGR et retourne (img, bboxs)
        # draw=False pour ne pas modifier la frame en place
        _, bboxs = self._detector.findFaces(frame, draw=False)

        if not bboxs:
            return None

        # Prendre la plus grande face si plusieurs détectées
        # bboxs[i]['bbox'] = (x, y, w, h) — même format que heartrate.py
        bboxs_sorted = sorted(
            bboxs,
            key=lambda b: b["bbox"][2] * b["bbox"][3],
            reverse=True,
        )
        x, y, w, h = bboxs_sorted[0]["bbox"]
        return int(x), int(y), int(w), int(h)

    def crop_roi(
        self,
        frame: np.ndarray,
        bbox: tuple[int, int, int, int],
        target_w: int = 160,
        target_h: int = 120,
    ) -> np.ndarray:
        """Extrait et redimensionne la ROI visage."""
        x, y, w, h = bbox
        face = frame[y : y + h, x : x + w]
        return cv.resize(face, (target_w, target_h))