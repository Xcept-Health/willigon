/**
 * Démarre la webcam et retourne le stream.
 * Doit être appelé depuis un contexte HTTPS (ou localhost).
 */
export async function startCamera(
    videoEl: HTMLVideoElement,
    width = 640,
    height = 480
  ): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width, height, facingMode: "user" },
      audio: false,
    });
    videoEl.srcObject = stream;
    await videoEl.play();
    return stream;
  }
  
  export function stopCamera(stream: MediaStream): void {
    stream.getTracks().forEach((t) => t.stop());
  }
  
  /**
   * Capture une frame depuis <video> en JPEG base64.
   * Le canvas est réutilisé à chaque appel.
   */
  export function captureFrame(
    videoEl: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    quality = 0.6
  ): string {
    const ctx = canvas.getContext("2d")!;
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    ctx.drawImage(videoEl, 0, 0);
    return canvas.toDataURL("image/jpeg", quality);
  }
  