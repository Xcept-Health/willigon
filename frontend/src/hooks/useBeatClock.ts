import { useEffect, useRef } from "react";

type BeatCallback = () => void;

/**
 * Déclenche `onBeat` à l'intervalle correspondant au BPM fourni.
 * Recale l'intervalle automatiquement quand le BPM change.
 * En dessous de 30 BPM ou si non prêt → aucun événement.
 */
export function useBeatClock(bpm: number, ready: boolean, onBeat: BeatCallback): void {
  const onBeatRef = useRef<BeatCallback>(onBeat);
  onBeatRef.current = onBeat;

  useEffect(() => {
    if (!ready || bpm < 30) return;

    const interval = (60_000 / bpm);

    const id = setInterval(() => {
      onBeatRef.current();
    }, interval);

    return () => clearInterval(id);
  }, [bpm, ready]);
}
