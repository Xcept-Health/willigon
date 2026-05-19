import { useEffect, useRef } from "react";
import type { RPPGStatus } from "../../types/rppg";
import styles from "./WaveformPanel.module.css";

interface Props {
  signal: number[];
  bpm: number;
  status: RPPGStatus;
  ready: boolean;
}

const STATUS_COLOR: Record<RPPGStatus, string> = {
  estimating: "#555",
  no_face: "#ff4444",
  normal: "#00ff88",
  brady: "#ffcc00",
  tachy: "#ffcc00",
  critical_low: "#ff4444",
  critical_high: "#ff4444",
};

export function WaveformPanel({ signal, bpm, status, ready }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<number[]>([]);

  useEffect(() => {
    if (signal.length > 0) {
      bufferRef.current = [...bufferRef.current, ...signal].slice(-300);
    }
  }, [signal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf: number;
    const ctx = canvas.getContext("2d")!;

    function draw() {
      const W = canvas!.width;
      const H = canvas!.height;
      const color = STATUS_COLOR[status];
      const buf = bufferRef.current;

      ctx.fillStyle = "#050510";
      ctx.fillRect(0, 0, W, H);

      // Grille légère
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      if (buf.length < 2) {
        raf = requestAnimationFrame(draw);
        return;
      }

      // Courbe
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      buf.forEach((v, i) => {
        const x = (i / (buf.length - 1)) * W;
        const y = H - v * (H * 0.8) - H * 0.1;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, [status]);

  return (
    <div className={styles.panel}>
      <canvas ref={canvasRef} className={styles.canvas} width={640} height={120} />
      <div className={styles.info}>
        <span className={styles.bpm} style={{ color: STATUS_COLOR[status] }}>
          {ready ? `${Math.round(bpm)} BPM` : "— BPM"}
        </span>
        <span className={styles.status} style={{ color: STATUS_COLOR[status] }}>
          {STATUS_LABEL[status]}
        </span>
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<RPPGStatus, string> = {
  estimating: "Estimation…",
  no_face: "Pas de visage",
  normal: "Normal",
  brady: "Bradycardie",
  tachy: "Tachycardie",
  critical_low: "Critique bas",
  critical_high: "Critique haut",
};
