import { useEffect } from "react";
import type { BBoxData, RPPGStatus } from "../types/rppg";

const STATUS_COLORS: Record<RPPGStatus, string> = {
  estimating: "#888888",
  no_face: "#ff4444",
  normal: "#00ff88",
  brady: "#ffcc00",
  tachy: "#ffcc00",
  critical_low: "#ff4444",
  critical_high: "#ff4444",
};

/**
 * Dessine le rectangle de détection du visage sur un canvas overlay,
 * mis à l'échelle selon les dimensions affichées vs natives.
 */
export function useFaceROI(
  overlayRef: React.RefObject<HTMLCanvasElement>,
  bbox: BBoxData | null,
  status: RPPGStatus,
  nativeW = 640,
  nativeH = 480
): void {
  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!bbox) return;

    const scaleX = canvas.width / nativeW;
    const scaleY = canvas.height / nativeH;

    const x = bbox.x * scaleX;
    const y = bbox.y * scaleY;
    const w = bbox.w * scaleX;
    const h = bbox.h * scaleY;

    const color = STATUS_COLORS[status] ?? "#ffffff";

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.strokeRect(x, y, w, h);

    // Coins accentués (style médical)
    const cs = 12;
    ctx.lineWidth = 3;
    [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([cx, cy], i) => {
      ctx.beginPath();
      const dx = i % 2 === 0 ? cs : -cs;
      const dy = i < 2 ? cs : -cs;
      ctx.moveTo(cx + dx, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + dy);
      ctx.stroke();
    });
  }, [overlayRef, bbox, status, nativeW, nativeH]);
}
