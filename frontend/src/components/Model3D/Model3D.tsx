import { useCallback, useRef, useState } from "react";
import { useBeatClock } from "../../hooks/useBeatClock";
import type { RPPGStatus } from "../../types/rppg";
import styles from "./Model3D.module.css";
import "./modelViewer.d.ts";

// Import du web component model-viewer
import "@google/model-viewer";

interface Props {
  bpm: number;
  status: RPPGStatus;
  ready: boolean;
}

export function Model3D({ bpm, status, ready }: Props) {
  const [beat, setBeat] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onBeat = useCallback(() => {
    setBeat(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setBeat(false), 150);
  }, []);

  useBeatClock(bpm, ready, onBeat);

  return (
    <div className={`${styles.panel} ${beat ? styles.beat : ""}`}>
      {/* @ts-ignore — model-viewer est un web component */}
      <model-viewer
        src="/models/scene.glb"
        alt="Polygone de Willis 3D"
        auto-rotate
        camera-controls
        shadow-intensity="0.8"
        exposure="1.2"
        style={{ width: "100%", height: "100%", background: "transparent" }}
      />
      <div className={styles.label}>Polygone de Willis — 3D</div>
    </div>
  );
}
