// Audio schema types for designer-friendly pedal chains and registry

export type PedalType =
  | 'gain'
  | 'filter'
  | 'delay'
  | 'reverb'
  | 'compressor'
  | 'limiter'
  | 'panner'
  | 'pitch'
  | 'distortion'
  // Friendly macro pedals that map to EQ curves under the hood
  | 'sparkle' // gentle high-shelf boost
  | 'warmth'; // gentle low-shelf boost

export interface GainPedalParams {
  level?: number; // 0..2 (1 = unity)
}

export interface FilterPedalParams {
  type?: 'lowpass' | 'highpass' | 'bandpass' | 'lowshelf' | 'highshelf';
  tone?: number; // designer-friendly frequency control in Hz
  frequencyHz?: number; // precise frequency in Hz
  q?: number; // resonance/bandwidth
  gainDb?: number; // for shelf filters
}

export interface DelayPedalParams {
  timeMs?: number; // 0..1000+
  feedback?: number; // 0..0.95
  mix?: number; // 0..1
}

export interface ReverbPedalParams {
  size?: number; // 0..1 (maps to decay)
  mix?: number; // 0..1
  color?: number; // 0..1 (darker to brighter)
  irUrl?: string; // impulse response path (optional)
}

export interface CompressorPedalParams {
  tightness?: number; // 0..1 (maps to threshold/ratio)
  makeup?: number; // 0..2 gain after compression
  attackMs?: number;
  releaseMs?: number;
}

export interface LimiterPedalParams {
  ceilingDb?: number; // typically -12..0
}

export interface PannerPedalParams {
  pan?: number; // -1..1
}

export interface PitchPedalParams {
  semitones?: number; // -12..12
  cents?: number; // fine tune
}

export interface DistortionPedalParams {
  drive?: number; // 0..1
  tone?: number; // 0..1
}

export interface SparklePedalParams {
  amount?: number; // 0..1 high-shelf boost
}

export interface WarmthPedalParams {
  amount?: number; // 0..1 low-shelf boost
}

export type PedalParams =
  | GainPedalParams
  | FilterPedalParams
  | DelayPedalParams
  | ReverbPedalParams
  | CompressorPedalParams
  | LimiterPedalParams
  | PannerPedalParams
  | PitchPedalParams
  | DistortionPedalParams
  | SparklePedalParams
  | WarmthPedalParams;

export interface PedalConfig {
  pedal: PedalType;
  params?: PedalParams;
}

export interface ChainPreset {
  name: string;
  pedals: PedalConfig[];
}

export interface MasterConfig {
  volume?: number; // 0..1
}

export interface BusConfig {
  volume?: number; // 0..1
  // Optional ducking configuration: when FX plays, reduce BGM by X dB
  duckBgmByDb?: number;
  duckAttackMs?: number;
  duckReleaseMs?: number;
}

export interface AssetConfig {
  key: string; // e.g., "fx.click", "bgm.cave"
  src: string; // path to audio file (designer-provided)
  bus: string; // "fx" | "bgm" | custom
  chain?: string; // path to chain preset JSON
  loop?: boolean;
  preload?: boolean;
  volume?: number; // per-asset gain 0..1
  allowOverlap?: boolean; // multiple instances may play simultaneously
  maxInstances?: number; // cap polyphony
  cooldownMs?: number; // minimum time between triggers
}

export interface AudioRegistry {
  master?: MasterConfig;
  buses?: Record<string, BusConfig>;
  assets: AssetConfig[];
}
