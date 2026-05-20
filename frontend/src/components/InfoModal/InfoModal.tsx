import { useEffect, useRef } from "react";
import type { Theme } from "../../App";
import styles from "./InfoModal.module.css";

interface Props {
  onClose: () => void;
  theme: Theme;
}

export function InfoModal({ onClose, theme }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Fermer avec Echap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Clic en dehors = fermer
  const onOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={onOverlayClick} data-theme={theme}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="À propos de Willigon">
        {/* En-tête */}
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Willigon</h2>
            <p className={styles.modalSubtitle}>Cardiographie en temps réel — Guide pédagogique</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className={styles.sections}>

          {/* ── Section 1 : rPPG ── */}
          <section className={styles.section}>
            <div className={styles.sectionIcon}>
              <HeartIcon />
            </div>
            <div className={styles.sectionBody}>
              <h3 className={styles.sectionTitle}>Qu'est-ce que le rPPG ?</h3>
              <p className={styles.sectionText}>
                La <strong>photopléthysmographie à distance</strong> (rPPG) est une technique qui
                mesure votre fréquence cardiaque sans aucun capteur physique, uniquement à partir
                de votre caméra.
              </p>
              <div className={styles.steps}>
                <div className={styles.step}>
                  <span className={styles.stepNum}>1</span>
                  <span>La caméra capture votre visage à ~15 images/seconde</span>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNum}>2</span>
                  <span>La région du front est isolée (ROI — Zone d'Intérêt)</span>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNum}>3</span>
                  <span>La couleur moyenne (R, G, B) fluctue légèrement au rythme du flux sanguin</span>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNum}>4</span>
                  <span>La méthode <em>POS</em> extrait le signal cardiaque de ces variations de couleur</span>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNum}>5</span>
                  <span>Une FFT (Transformée de Fourier) identifie la fréquence dominante → le BPM</span>
                </div>
              </div>
              <div className={styles.tip}>
                <span className={styles.tipIcon}>💡</span>
                <span>Pour de meilleurs résultats : restez immobile, bien éclairé de face, à ~50 cm de la caméra</span>
              </div>
            </div>
          </section>

          {/* ── Section 2 : Polygone de Willis ── */}
          <section className={styles.section}>
            <div className={styles.sectionIcon}>
              <BrainIcon />
            </div>
            <div className={styles.sectionBody}>
              <h3 className={styles.sectionTitle}>Le Polygone de Willis</h3>
              <p className={styles.sectionText}>
                Décrit en 1664 par le médecin anglais <strong>Thomas Willis</strong>, le polygone de Willis
                est un anneau artériel situé à la base du cerveau qui vascularise l'ensemble du tissu cérébral.
              </p>
              <div className={styles.arteryGrid}>
                <div className={styles.arteryCard}>
                  <span className={styles.arteryDot} style={{ background: "#00ccff" }}/>
                  <div>
                    <strong>Artère basilaire</strong>
                    <p>Provient des deux artères vertébrales et irrigue le tronc cérébral et le cervelet</p>
                  </div>
                </div>
                <div className={styles.arteryCard}>
                  <span className={styles.arteryDot} style={{ background: "#7755ff" }}/>
                  <div>
                    <strong>Artères cérébrales postérieures</strong>
                    <p>Irriguent le lobe occipital (vision) et la face inférieure du lobe temporal</p>
                  </div>
                </div>
                <div className={styles.arteryCard}>
                  <span className={styles.arteryDot} style={{ background: "#ff6699" }}/>
                  <div>
                    <strong>Artères communicantes</strong>
                    <p>Relient les circuits gauche/droit, assurant une redondance vitale en cas d'occlusion</p>
                  </div>
                </div>
                <div className={styles.arteryCard}>
                  <span className={styles.arteryDot} style={{ background: "#00e87a" }}/>
                  <div>
                    <strong>Artères cérébrales antérieures & moyennes</strong>
                    <p>Irriguent les lobes frontaux, pariétaux et une grande partie du cortex moteur</p>
                  </div>
                </div>
              </div>
              <div className={styles.tip}>
                <span className={styles.tipIcon}>🔬</span>
                <span>Le polygone de Willis pulse en temps réel synchronisé à votre BPM mesuré — observez les nœuds s'animer à chaque battement</span>
              </div>
            </div>
          </section>

          {/* ── Section 3 : Comment utiliser ── */}
          <section className={styles.section}>
            <div className={styles.sectionIcon}>
              <GuideIcon />
            </div>
            <div className={styles.sectionBody}>
              <h3 className={styles.sectionTitle}>Comment utiliser l'application</h3>
              <div className={styles.panelGuide}>
                <div className={styles.panelItem}>
                  <span className={styles.panelTag}>↖ Haut gauche</span>
                  <span>Flux webcam avec détection du visage et indicateur d'état</span>
                </div>
                <div className={styles.panelItem}>
                  <span className={styles.panelTag}>↗ Haut droit</span>
                  <span>Modèle 3D du polygone de Willis — déplaçable et zoomable</span>
                </div>
                <div className={styles.panelItem}>
                  <span className={styles.panelTag}>↙ Bas gauche</span>
                  <span>Forme d'onde du signal cardiaque filtré avec BPM en temps réel</span>
                </div>
                <div className={styles.panelItem}>
                  <span className={styles.panelTag}>↘ Bas droit</span>
                  <span>Vue anatomique 2D du polygone de Willis animée à chaque battement</span>
                </div>
              </div>
              <div className={styles.statusGuide}>
                <h4 className={styles.statusTitle}>Indicateurs d'état</h4>
                <div className={styles.statusItems}>
                  {[
                    { color: "#888",    label: "Estimation en cours…",  desc: "Calibration du signal (3–10 sec)" },
                    { color: "#00e87a", label: "Normal",                desc: "60–100 BPM — rythme sinusal normal" },
                    { color: "#ffcc00", label: "Bradycardie",           desc: "< 60 BPM — rythme lent" },
                    { color: "#ffcc00", label: "Tachycardie",           desc: "> 100 BPM — rythme rapide" },
                    { color: "#ff4444", label: "Critique",              desc: "< 30 ou > 120 BPM" },
                  ].map(s => (
                    <div key={s.label} className={styles.statusRow}>
                      <span className={styles.statusDot} style={{ background: s.color }} />
                      <strong style={{ color: s.color }}>{s.label}</strong>
                      <span className={styles.statusDesc}>{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.tip} style={{ marginTop: 16 }}>
                <span className={styles.tipIcon}>↔</span>
                <span>Glissez les séparateurs entre les panneaux pour les redimensionner librement</span>
              </div>
            </div>
          </section>

        </div>

        <div className={styles.modalFooter}>
          <span className={styles.footerNote}>Projet pédagogique open-source — méthode rPPG POS + FFT</span>
          <button className={styles.closeFooterBtn} onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

function HeartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 3v9M12 12l5.5-5M12 12l-5.5-5M12 12v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function GuideIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M7 8h10M7 12h7M7 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
