import { useCallback, useRef } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import { useRPPG } from "./hooks/useRPPG";
import { WebcamPanel } from "./components/WebcamPanel/WebcamPanel";
import { WaveformPanel } from "./components/WaveformPanel/WaveformPanel";
import { Polygon2D } from "./components/Polygon2D/Polygon2D";
import { Model3D } from "./components/Model3D/Model3D";
import styles from "./App.module.css";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000/ws/bpm";

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { send, lastMessage, status: wsStatus } = useWebSocket(WS_URL);

  const onFrame = useCallback(
    (frameB64: string) => {
      if (wsStatus === "open") {
        send(JSON.stringify({ frame: frameB64 }));
      }
    },
    [send, wsStatus]
  );

  useRPPG({ videoRef, onFrame, enabled: true });

  const bpm = lastMessage?.bpm ?? 0;
  const signal = lastMessage?.signal ?? [];
  const rppgStatus = lastMessage?.status ?? "estimating";
  const bbox = lastMessage?.bbox ?? null;
  const ready = lastMessage?.ready ?? false;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span className={styles.title}>Willis Live</span>
        <span
          className={styles.wsIndicator}
          data-status={wsStatus}
          title={`WebSocket : ${wsStatus}`}
        />
      </header>

      <main className={styles.grid}>
        {/* Haut gauche — webcam */}
        <div className={styles.cell}>
          <WebcamPanel
            videoRef={videoRef}
            bbox={bbox}
            status={rppgStatus}
            ready={ready}
          />
        </div>

        {/* Haut droite — SVG 2D */}
        <div className={styles.cell}>
          <Polygon2D bpm={bpm} status={rppgStatus} ready={ready} />
        </div>

        {/* Bas gauche — waveform */}
        <div className={`${styles.cell} ${styles.cellShort}`}>
          <WaveformPanel
            signal={signal}
            bpm={bpm}
            status={rppgStatus}
            ready={ready}
          />
        </div>

        {/* Bas droite — modèle 3D */}
        <div className={styles.cell}>
          <Model3D bpm={bpm} status={rppgStatus} ready={ready} />
        </div>
      </main>
    </div>
  );
}
