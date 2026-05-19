import { useRef } from "react";
import { useFaceROI } from "../../hooks/useFaceROI";
import type { BBoxData, RPPGStatus } from "../../types/rppg";
import styles from "./WebcamPanel.module.css";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  bbox: BBoxData | null;
  status: RPPGStatus;
  ready: boolean;
}

export function WebcamPanel({ videoRef, bbox, status, ready }: Props) {
  const overlayRef = useRef<HTMLCanvasElement>(null);
  useFaceROI(overlayRef, bbox, status);

  const label = STATUS_LABEL[status];
  const labelColor = STATUS_COLOR[status];

  return (
    <div className={styles.panel}>
      <div className={styles.videoWrap}>
        <video ref={videoRef} className={styles.video} muted playsInline />
        <canvas ref={overlayRef} className={styles.overlay} width={640} height={480} />
        <div className={styles.badge} style={{ color: labelColor }}>
          <span className={styles.dot} style={{ background: labelColor }} />
          {label}
        </div>
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<RPPGStatus, string> = {
  estimating: "Estimation en cours…",
  no_face: "Aucun visage détecté",
  normal: "Rythme normal",
  brady: "Bradycardie",
  tachy: "Tachycardie",
  critical_low: "BPM critique bas",
  critical_high: "BPM critique haut",
};

const STATUS_COLOR: Record<RPPGStatus, string> = {
  estimating: "#888",
  no_face: "#ff4444",
  normal: "#00ff88",
  brady: "#ffcc00",
  tachy: "#ffcc00",
  critical_low: "#ff4444",
  critical_high: "#ff4444",
};
