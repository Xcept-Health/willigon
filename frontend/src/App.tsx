import { useCallback, useEffect, useRef, useState } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import { useRPPG } from "./hooks/useRPPG";
import { WebcamPanel } from "./components/WebcamPanel/WebcamPanel";
import { WaveformPanel } from "./components/WaveformPanel/WaveformPanel";
import { Polygon2D } from "./components/Polygon2D/Polygon2D";
import { Model3D } from "./components/Model3D/Model3D";
import { InfoModal } from "./components/InfoModal/InfoModal";
import styles from "./App.module.css";

export type Theme = "dark" | "light";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000/ws/bpm";

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { send, lastMessage, status: wsStatus } = useWebSocket(WS_URL);

  const [theme, setTheme] = useState<Theme>("dark");
  const [showInfo, setShowInfo] = useState(false);
  const [colSplit, setColSplit] = useState(50); // % largeur colonne gauche
  const [rowSplit, setRowSplit] = useState(60); // % hauteur ligne haute

  // Applique le thème sur l'élément racine
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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

  // --- Drag pour redimensionner ---
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingCol = useRef(false);
  const draggingRow = useRef(false);

  const startColDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    draggingCol.current = true;
  }, []);

  const startRowDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    draggingRow.current = true;
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (draggingCol.current) {
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        setColSplit(Math.min(80, Math.max(20, pct)));
      }
      if (draggingRow.current) {
        const pct = ((e.clientY - rect.top) / rect.height) * 100;
        setRowSplit(Math.min(80, Math.max(20, pct)));
      }
    };
    const onMouseUp = () => {
      draggingCol.current = false;
      draggingRow.current = false;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span className={styles.title}>Willigon</span>
        <div className={styles.headerActions}>
          <button
            className={styles.iconBtn}
            onClick={() => setShowInfo(true)}
            title="À propos & aide"
            aria-label="Ouvrir le panneau d'information"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 7v5M8 5v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            className={styles.iconBtn}
            onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            aria-label="Basculer le thème"
          >
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 9A6 6 0 0 1 7 2.5a6 6 0 1 0 6.5 6.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <span
            className={styles.wsIndicator}
            data-status={wsStatus}
            title={`WebSocket : ${wsStatus}`}
          />
        </div>
      </header>

      <main className={styles.container} ref={containerRef}>
        {/* Ligne haute */}
        <div className={styles.row} style={{ height: `${rowSplit}%` }}>
          <div className={styles.cell} style={{ width: `${colSplit}%` }}>
            <WebcamPanel
              videoRef={videoRef}
              bbox={bbox}
              status={rppgStatus}
              ready={ready}
              theme={theme}
            />
          </div>

          <div
            className={styles.splitterV}
            onMouseDown={startColDrag}
            title="Glisser pour redimensionner"
          >
            <div className={styles.splitterHandle} />
          </div>

          <div className={styles.cell} style={{ flex: 1 }}>
            <Model3D bpm={bpm} status={rppgStatus} ready={ready} />
          </div>
        </div>

        {/* Séparateur horizontal */}
        <div
          className={styles.splitterH}
          onMouseDown={startRowDrag}
          title="Glisser pour redimensionner"
        >
          <div className={styles.splitterHandle} />
        </div>

        {/* Ligne basse */}
        <div className={styles.row} style={{ flex: 1 }}>
          <div className={styles.cell} style={{ width: `${colSplit}%` }}>
            <WaveformPanel
              signal={signal}
              bpm={bpm}
              status={rppgStatus}
              ready={ready}
              theme={theme}
            />
          </div>

          <div
            className={styles.splitterV}
            onMouseDown={startColDrag}
            title="Glisser pour redimensionner"
          >
            <div className={styles.splitterHandle} />
          </div>

          <div className={styles.cell} style={{ flex: 1 }}>
            <Polygon2D bpm={bpm} status={rppgStatus} ready={ready} />
          </div>
        </div>
      </main>

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} theme={theme} />}
    </div>
  );
}
