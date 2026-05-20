import { useCallback, useRef, useState } from "react";
import { useBeatClock } from "../../hooks/useBeatClock";
import type { RPPGStatus } from "../../types/rppg";
import styles from "./Polygon2D.module.css";

interface Props {
  bpm: number;
  status: RPPGStatus;
  ready: boolean;
}

const STATUS_COLOR: Record<RPPGStatus, string> = {
  estimating: "#334",
  no_face: "#ff4444",
  normal: "#00ccff",
  brady: "#ffcc00",
  tachy: "#ff6600",
  critical_low: "#ff2222",
  critical_high: "#ff2222",
};

export function Polygon2D({ bpm, status, ready }: Props) {
  const [beat, setBeat] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onBeat = useCallback(() => {
    setBeat(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setBeat(false), 150);
  }, []);

  useBeatClock(bpm, ready, onBeat);

  const c = STATUS_COLOR[status];
  const sw = beat ? 3.5 : 1.5;
  const scale = beat ? 1.04 : 1;

  return (
    <div className={styles.panel}>
      <svg
        viewBox="0 0 400 340"
        className={styles.svg}
        style={{ transform: `scale(${scale})`, transition: beat ? "none" : "transform 0.35s ease" }}
      >
        {/* Polygone de Willis simplifié — vue anatomique de dessus */}

        {/* Artère basilaire */}
        <line x1="200" y1="300" x2="200" y2="230" stroke={c} strokeWidth={sw} strokeLinecap="round" />

        {/* Artères cérébrales postérieures */}
        <path d={`M200 230 Q160 220 140 200`} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        <path d={`M200 230 Q240 220 260 200`} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" />

        {/* Communicantes postérieures */}
        <line x1="140" y1="200" x2="140" y2="160" stroke={c} strokeWidth={sw - 0.5} strokeLinecap="round" />
        <line x1="260" y1="200" x2="260" y2="160" stroke={c} strokeWidth={sw - 0.5} strokeLinecap="round" />

        {/* Artères carotides internes */}
        <line x1="140" y1="160" x2="140" y2="110" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        <line x1="260" y1="160" x2="260" y2="110" stroke={c} strokeWidth={sw} strokeLinecap="round" />

        {/* Communicante antérieure */}
        <line x1="140" y1="110" x2="260" y2="110" stroke={c} strokeWidth={sw - 0.5} strokeLinecap="round" />

        {/* Artères cérébrales antérieures */}
        <path d={`M140 110 Q120 80 140 55`} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        <path d={`M260 110 Q280 80 260 55`} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" />

        {/* Artères cérébrales moyennes */}
        <path d={`M140 110 Q80 110 60 130`} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        <path d={`M260 110 Q320 110 340 130`} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" />

        {/* Noeuds de jonction */}
        {[
          [200, 230], [140, 200], [260, 200],
          [140, 160], [260, 160], [140, 110], [260, 110],
          [200, 300], [140, 55], [260, 55], [60, 130], [340, 130],
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={x} cy={y} r={beat ? 5 : 3.5}
            fill={c}
            style={{ transition: beat ? "none" : "r 0.35s ease" }}
          />
        ))}

        {/* Labels anatomiques */}
        <text x="205" y="318" fontSize="9" fill={c} opacity={0.6}>A. basilaire</text>
        <text x="60" y="165" fontSize="9" fill={c} opacity={0.6}>A. cérébrale post.</text>
        <text x="60" y="145" fontSize="9" fill={c} opacity={0.6}>gauche</text>
        <text x="270" y="165" fontSize="9" fill={c} opacity={0.6}>A. cérébrale post.</text>
        <text x="270" y="145" fontSize="9" fill={c} opacity={0.6}>droite</text>
        <text x="155" y="105" fontSize="9" fill={c} opacity={0.6}>A. comm.</text>
        <text x="155" y="95" fontSize="9" fill={c} opacity={0.6}>antérieure</text>
      </svg>

      <div className={styles.label}>
        2D
      </div>
    </div>
  );
}
