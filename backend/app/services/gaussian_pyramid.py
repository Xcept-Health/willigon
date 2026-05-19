import numpy as np
import cv2 as cv


def build_pyramid(img: np.ndarray, levels: int) -> list[np.ndarray]:
    """
    Construit une pyramide gaussienne descendante.
    Portage direct de GaussianBuilding() dans heartrate.py.

    Args:
        img: image (H, W, C) float32
        levels: nombre de niveaux à descendre

    Returns:
        Liste de tableaux du plus grand au plus petit.
        L'index `levels` donne le niveau le plus bas utilisé par rPPG.
    """
    pyramid = [img]
    for _ in range(levels):
        img = cv.pyrDown(img)
        pyramid.append(img)
    return pyramid


def get_level(img: np.ndarray, levels: int) -> np.ndarray:
    """Raccourci : retourne directement le niveau `levels`."""
    return build_pyramid(img, levels)[levels]