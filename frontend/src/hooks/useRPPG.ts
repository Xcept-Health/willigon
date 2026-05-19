import { useEffect, useRef } from "react";
import { startCamera, stopCamera, captureFrame } from "../utils/videoCapture";

const FRAME_INTERVAL_MS = 1000 / 15; // 15 fps — identique à heartrate.py

interface UseRPPGOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  onFrame: (frameB64: string) => void;
  enabled: boolean;
}

/**
 * Démarre la webcam sur `videoRef` et envoie une frame toutes les ~67ms
 * via le callback `onFrame` (qui le passe au WebSocket).
 */
export function useRPPG({ videoRef, onFrame, enabled }: UseRPPGOptions): void {
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    async function init() {
      if (!videoRef.current) return;
      try {
        const stream = await startCamera(videoRef.current);
        if (!active) {
          stopCamera(stream);
          return;
        }
        streamRef.current = stream;

        // Attendre que la vidéo ait des dimensions réelles
        await new Promise<void>((resolve) => {
          const v = videoRef.current!;
          if (v.readyState >= 2) return resolve();
          v.onloadeddata = () => resolve();
        });

        intervalRef.current = setInterval(() => {
          if (!videoRef.current || !active) return;
          const frame = captureFrame(videoRef.current, canvasRef.current);
          onFrame(frame);
        }, FRAME_INTERVAL_MS);
      } catch (err) {
        console.error("[useRPPG] Erreur caméra :", err);
      }
    }

    init();

    return () => {
      active = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) stopCamera(streamRef.current);
    };
  }, [enabled, videoRef, onFrame]);
}
