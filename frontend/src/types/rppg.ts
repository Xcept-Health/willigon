export type RPPGStatus =
  | "estimating"
  | "no_face"
  | "normal"
  | "brady"
  | "tachy"
  | "critical_low"
  | "critical_high";

export interface BBoxData {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BPMData {
  bpm: number;
  signal: number[];
  status: RPPGStatus;
  bbox: BBoxData | null;
  ready: boolean;
}

export interface BeatEvent {
  bpm: number;
  timestamp: number;
}
