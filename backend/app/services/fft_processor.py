import numpy as np


def build_frequency_mask(
    buffer_size: int,
    fps: float,
    freq_min: float = 1.0,
    freq_max: float = 2.0,
) -> np.ndarray:
    """
    Construit le masque booléen passe-bande.
    Portage direct de la section 'BandPass Filter' de heartrate.py.

    1.0 Hz = 60 BPM  |  2.0 Hz = 120 BPM
    """
    frequencies = (fps * np.arange(buffer_size)) / buffer_size
    mask = (frequencies >= freq_min) & (frequencies <= freq_max)
    return mask


def apply_bandpass(
    fft_result: np.ndarray,
    mask: np.ndarray,
) -> np.ndarray:
    """Annule les fréquences hors bande."""
    filtered = fft_result.copy()
    filtered[~mask] = 0
    return filtered


def dominant_bpm(
    video_gaussian: np.ndarray,
    mask: np.ndarray,
    frequencies: np.ndarray,
    buffer_size: int,
) -> tuple[float, np.ndarray, np.ndarray]:
    """
    Calcule le BPM dominant depuis le buffer gaussien.

    Args:
        video_gaussian : (buffer_size, H, W, C) — buffer circulaire
        mask           : masque passe-bande
        frequencies    : tableau des fréquences associées
        buffer_size    : taille du buffer (150 par défaut)

    Returns:
        (bpm, signal_moyenné, fft_filtrée)
    """
    fft = np.fft.fft(video_gaussian, axis=0)
    fft = apply_bandpass(fft, mask)

    # Signal moyenné sur tous les pixels/canaux → forme 1D (buffer_size,)
    ftf_avg = np.zeros(buffer_size)
    for i in range(buffer_size):
        ftf_avg[i] = np.real(fft[i]).mean()

    freq = frequencies[np.argmax(ftf_avg)]
    bpm = 60.0 * freq

    # Signal temporel reconstruit (pour la waveform)
    signal = np.real(np.fft.ifft(fft, axis=0))
    signal_1d = signal.reshape(buffer_size, -1).mean(axis=1)

    # Normalisation 0–1 pour le frontend
    s_min, s_max = signal_1d.min(), signal_1d.max()
    if s_max - s_min > 1e-8:
        signal_norm = (signal_1d - s_min) / (s_max - s_min)
    else:
        signal_norm = np.zeros(buffer_size)

    return float(bpm), signal_norm, fft