import * as THREE from 'three';
import * as Tone from 'tone';

import { AUDIO_QUALITY_DEFAULT, withAudioQuality } from './constants';
import registry from './registry';
import type {
  AssetConfig,
  AudioRegistry,
  ChainPreset,
  FilterPedalParams,
  PedalConfig,
} from './types';

type PlayOptions = {
  volume?: number;
  fadeMs?: number;
  loop?: boolean;
};

const DB_TO_GAIN = (db: number) => Math.pow(10, db / 20);

export class AudioManager {
  private static _instance: AudioManager | null = null;

  static get instance(): AudioManager {
    if (!this._instance) this._instance = new AudioManager();
    return this._instance;
  }

  private readonly listener: THREE.AudioListener;
  private readonly context: AudioContext;
  private readonly loader: THREE.AudioLoader;

  private readonly masterGain: GainNode;
  private readonly busGains: Map<string, GainNode> = new Map();

  private readonly buffers: Map<string, AudioBuffer> = new Map();
  private readonly toneBuffers: Map<string, Tone.ToneAudioBuffer> = new Map();
  private readonly chains: Map<string, ChainPreset> = new Map();
  private readonly assets: Map<string, AssetConfig> = new Map();

  private readonly fxLastPlayedAt: Map<string, number> = new Map();
  private readonly fxInstances: Map<string, number> = new Map();

  private currentBgm?: { key: string; gain: GainNode; source: AudioBufferSourceNode };

  private readonly cfg: AudioRegistry;
  private fxToneBus: Tone.Gain;
  private quality: 'low' | 'high' = AUDIO_QUALITY_DEFAULT;

  private constructor() {
    this.listener = new THREE.AudioListener();
    // three.js exposes the context via listener.context in recent versions
    this.context = (this.listener.context || THREE.AudioContext.getContext()) as AudioContext;
    // Ensure Tone uses the same AudioContext as three.js
    Tone.setContext(this.context);
    this.loader = new THREE.AudioLoader();

    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.listener.getInput());

    // load registry
    this.cfg = registry as AudioRegistry;
    if (this.cfg.master?.volume !== undefined) this.masterGain.gain.value = this.cfg.master.volume;

    // create default buses (bgm/fx) and any custom ones
    const buses = this.cfg.buses || { bgm: { volume: 0.6 }, fx: { volume: 0.7 } };
    Object.entries(buses).forEach(([name, bus]) => {
      const gain = this.context.createGain();
      gain.gain.value = bus.volume ?? 1.0;
      gain.connect(this.masterGain);
      this.busGains.set(name, gain);
    });

    // index assets by key
    this.cfg.assets.forEach((a) => this.assets.set(a.key, a));

    // Tone.js FX bus -> Destination
    const fxVol = this.cfg.buses?.fx?.volume ?? 0.7;
    this.fxToneBus = new Tone.Gain(fxVol).toDestination();
  }

  get audioListener(): THREE.AudioListener {
    return this.listener;
  }

  async resume(): Promise<void> {
    if (this.context.state !== 'running') await this.context.resume();
    if (Tone.getContext().state !== 'running') await Tone.start();
  }

  setMasterVolume(value: number): void {
    this.masterGain.gain.value = this.clamp01(value);
  }

  setBusVolume(bus: string, value: number): void {
    const g = this.busGains.get(bus);
    if (g) g.gain.value = this.clamp01(value);
    if (bus === 'fx') {
      this.fxToneBus.gain.value = this.clamp01(value);
    }
  }

  setQuality(quality: 'low' | 'high'): void {
    if (this.quality === quality) return;
    this.quality = quality;
    // clear decoded caches so subsequent loads honor the new quality
    this.buffers.clear();
    this.toneBuffers.clear();
  }

  async preload(): Promise<void> {
    const toLoad = this.cfg.assets.filter((a) => a.preload);
    await Promise.all(toLoad.map((a) => this.getOrLoadBuffer(a.src)));
    // Preload chains referenced by preloaded assets
    await Promise.all(
      toLoad.filter((a) => !!a.chain).map((a) => this.getOrLoadChain(a.chain as string))
    );
    // Preload FX Tone buffers
    const fxAssets = this.cfg.assets.filter((a) => a.preload && a.bus !== 'bgm');
    await Promise.all(fxAssets.map((a) => this.getOrLoadToneBuffer(a.src)));
  }

  async playByKey(key: string): Promise<void> {
    const asset = this.assets.get(key);
    if (!asset) return;

    if (asset.bus === 'bgm') {
      await this.playBgmByKey(key, { loop: asset.loop ?? true, volume: asset.volume });
      return;
    }

    await this.playFxAsset(asset);
  }

  async playBgmByKey(key: string, opts?: PlayOptions): Promise<void> {
    const asset = this.assets.get(key);
    if (!asset) return;
    const busGain = this.getOrCreateBus('bgm');
    const buffer = await this.getOrLoadBuffer(asset.src);
    const chain = asset.chain ? await this.getOrLoadChain(asset.chain) : null;

    // new source + gain for crossfade
    const src = this.context.createBufferSource();
    src.buffer = buffer;
    src.loop = opts?.loop ?? asset.loop ?? true;

    const startGain = this.context.createGain();
    startGain.gain.value = 0.0;

    // build optional chain between source and startGain
    const chainOut = await this.buildChain(chain, src, startGain, /*forFx*/ false);
    chainOut.connect(busGain);

    const fadeMs = opts?.fadeMs ?? 800;
    const vol = this.safeVolume(opts?.volume ?? asset.volume ?? 1.0);

    const now = this.context.currentTime;
    startGain.gain.setValueAtTime(0, now);
    startGain.gain.linearRampToValueAtTime(vol, now + fadeMs / 1000);

    src.start();

    // fade out existing
    if (this.currentBgm) {
      const { gain, source } = this.currentBgm;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + fadeMs / 1000);
      source.stop(now + fadeMs / 1000 + 0.05);
    }

    this.currentBgm = { key, gain: startGain, source: src };
  }

  async playBgmBySrc(srcUrl: string, opts?: PlayOptions): Promise<void> {
    const busGain = this.getOrCreateBus('bgm');
    const buffer = await this.getOrLoadBuffer(srcUrl);
    const src = this.context.createBufferSource();
    src.buffer = buffer;
    src.loop = opts?.loop ?? true;

    const startGain = this.context.createGain();
    startGain.gain.value = 0.0;
    src.connect(startGain);
    startGain.connect(busGain);

    const fadeMs = opts?.fadeMs ?? 800;
    const vol = this.safeVolume(opts?.volume ?? 1.0);

    const now = this.context.currentTime;
    startGain.gain.setValueAtTime(0, now);
    startGain.gain.linearRampToValueAtTime(vol, now + fadeMs / 1000);

    src.start();

    if (this.currentBgm) {
      const { gain, source } = this.currentBgm;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + fadeMs / 1000);
      source.stop(now + fadeMs / 1000 + 0.05);
    }

    this.currentBgm = { key: srcUrl, gain: startGain, source: src };
  }

  async stopBgm(fadeMs = 400): Promise<void> {
    if (!this.currentBgm) return;
    const now = this.context.currentTime;
    const { gain, source } = this.currentBgm;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + fadeMs / 1000);
    source.stop(now + fadeMs / 1000 + 0.05);
    this.currentBgm = undefined;
  }

  private async playFxAsset(asset: AssetConfig): Promise<void> {
    const nowMs = performance.now();
    const last = this.fxLastPlayedAt.get(asset.key) || 0;
    if (asset.cooldownMs && nowMs - last < asset.cooldownMs) return;

    const active = this.fxInstances.get(asset.key) || 0;
    const max = asset.maxInstances ?? 8;
    if (active >= max) return;

    this.fxLastPlayedAt.set(asset.key, nowMs);
    this.fxInstances.set(asset.key, active + 1);

    try {
      if (Tone.getContext().state !== 'running') await Tone.start();
      const chain = asset.chain ? await this.getOrLoadChain(asset.chain) : null;
      const buffer = await this.getOrLoadToneBuffer(asset.src);
      const player = new Tone.Player(buffer);
      // build Tone chain and connect to fx bus
      const { input, output } = this.buildToneChain(chain);
      output.connect(this.fxToneBus);
      // gain per asset
      const vol = this.safeVolume(asset.volume ?? 1.0);
      const g = new Tone.Gain(vol);
      // connect player -> gain -> (optional pitch) -> chain input
      player.connect(g);
      let head: Tone.ToneAudioNode = g;
      // pitch shift if specified
      const ps = this.createTonePitchNode(chain);
      if (ps) {
        head.connect(ps);
        head = ps;
      }
      head.connect(input);

      // Optional ducking: reduce bgm temporarily
      this.duckBgmOnFx();

      player.start();
      player.onstop = () => {
        player.dispose();
        g.dispose();
        if (ps) ps.dispose();
        const activeNow = this.fxInstances.get(asset.key) || 1;
        this.fxInstances.set(asset.key, Math.max(0, activeNow - 1));
      };
    } catch {
      // ignore errors during rapid navigation
      const activeNow = this.fxInstances.get(asset.key) || 1;
      this.fxInstances.set(asset.key, Math.max(0, activeNow - 1));
    }
  }

  private duckBgmOnFx(): void {
    const fxBus = this.cfg.buses?.fx;
    if (!fxBus || !fxBus.duckBgmByDb) return;
    const bgmGain = this.busGains.get('bgm');
    if (!bgmGain) return;
    const now = this.context.currentTime;
    const attack = (fxBus.duckAttackMs ?? 10) / 1000;
    const release = (fxBus.duckReleaseMs ?? 250) / 1000;
    const duckGain = DB_TO_GAIN(-(fxBus.duckBgmByDb || 6));
    const original = bgmGain.gain.value;

    bgmGain.gain.cancelScheduledValues(now);
    bgmGain.gain.setValueAtTime(original, now);
    bgmGain.gain.linearRampToValueAtTime(original * duckGain, now + attack);
    // schedule release shortly after to allow short fx
    bgmGain.gain.linearRampToValueAtTime(original, now + attack + release);
  }

  private async getOrLoadBuffer(src: string): Promise<AudioBuffer> {
    const resolvedSrc = this.applyQuality(src);
    if (this.buffers.has(resolvedSrc)) return this.buffers.get(resolvedSrc) as AudioBuffer;
    const url = this.resolveAssetUrl(resolvedSrc);
    try {
      // THREE.AudioLoader.loadAsync returns a decoded AudioBuffer
      const audioBuffer = (await this.loader.loadAsync(url)) as unknown as AudioBuffer;
      this.buffers.set(resolvedSrc, audioBuffer);
      return audioBuffer;
    } catch {
      // Fallback: fetch and decode via AudioContext
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.buffers.set(resolvedSrc, audioBuffer);
      return audioBuffer;
    }
  }

  private async getOrLoadChain(path: string): Promise<ChainPreset> {
    if (this.chains.has(path)) return this.chains.get(path) as ChainPreset;
    const url = new URL(path, import.meta.url).toString();
    const res = await fetch(url);
    const json = (await res.json()) as ChainPreset;
    this.chains.set(path, json);
    return json;
  }

  private async getOrLoadToneBuffer(src: string): Promise<Tone.ToneAudioBuffer> {
    const resolvedSrc = this.applyQuality(src);
    if (this.toneBuffers.has(resolvedSrc))
      return this.toneBuffers.get(resolvedSrc) as Tone.ToneAudioBuffer;
    const url = this.resolveAssetUrl(resolvedSrc);
    const buf = await new Promise<Tone.ToneAudioBuffer>((resolve, reject) => {
      const tb = new Tone.ToneAudioBuffer(
        url,
        () => resolve(tb),
        (e) => reject(e)
      );
    });
    this.toneBuffers.set(resolvedSrc, buf);
    return buf;
  }

  private createTonePitchNode(chain: ChainPreset | null): Tone.PitchShift | null {
    const rate = this.extractPlaybackRate(chain);
    if (rate === 1) return null;
    // Convert rate back to semitones
    const semitones = Math.round(Math.log2(rate) * 12);
    return new Tone.PitchShift({ pitch: semitones });
  }

  private buildToneChain(chain: ChainPreset | null): {
    input: Tone.ToneAudioNode;
    output: Tone.ToneAudioNode;
  } {
    const input = new Tone.Gain(1);
    let head: Tone.ToneAudioNode = input;
    if (!chain) return { input, output: head };
    for (const pedal of chain.pedals) {
      const node = this.createTonePedal(pedal);
      if (!node) continue;
      head.connect(node);
      head = node as unknown as Tone.ToneAudioNode;
    }
    return { input, output: head };
  }

  private createTonePedal(pedal: PedalConfig): Tone.ToneAudioNode | null {
    const p = pedal.params as any;
    switch (pedal.pedal) {
      case 'gain':
        return new Tone.Gain(this.safeVolume(p?.level ?? 1.0));
      case 'filter': {
        const type = p?.type ?? 'lowpass';
        const freq = p?.frequencyHz ?? p?.tone ?? (type.includes('high') ? 800 : 3000);
        const q = p?.q ?? 0.0;
        const f = new Tone.Filter({ type: type, frequency: freq, Q: q });
        if (p?.gainDb !== undefined) {
          // Tone.Filter gain is in dB for shelf filters
          (f as any).gain?.setValueAtTime?.(p.gainDb, Tone.now());
        }
        return f;
      }
      case 'delay': {
        const time = (p?.timeMs ?? 180) / 1000;
        const feedback = this.clamp01(p?.feedback ?? 0.3);
        const mix = this.clamp01(p?.mix ?? 0.25);
        const d = new Tone.FeedbackDelay(time, feedback);
        const x = new Tone.CrossFade(mix);
        return this.wrapMixNode(d, x);
      }
      case 'reverb': {
        const mix = this.clamp01(p?.mix ?? 0.2);
        if (p?.irUrl) {
          const conv = new Tone.Convolver(this.resolveAssetUrl(p.irUrl));
          const x = new Tone.CrossFade(mix);
          return this.wrapMixNode(conv, x);
        } else {
          const rv = new Tone.Reverb({ decay: 1 + (p?.size ?? 0.5) * 3, wet: mix });
          return rv;
        }
      }
      case 'compressor': {
        const tight = this.clamp01(p?.tightness ?? 0.5);
        const comp = new Tone.Compressor({
          threshold: -50 + tight * 30,
          ratio: 2 + tight * 8,
          attack: (p?.attackMs ?? 6) / 1000,
          release: (p?.releaseMs ?? 120) / 1000,
        });
        const makeup = this.safeVolume(p?.makeup ?? 1.0);
        const g = new Tone.Gain(makeup);
        comp.connect(g);
        return this.wrapInline(comp, g);
      }
      case 'limiter':
        return new Tone.Limiter(p?.ceilingDb ?? -0.1);
      case 'panner':
        return new Tone.Panner(p?.pan ?? 0);
      case 'distortion':
        return new Tone.Distortion(this.clamp01(p?.drive ?? 0.2));
      case 'sparkle': {
        const amount = this.clamp01(p?.amount ?? 0.2);
        return new Tone.Filter({ type: 'highshelf', frequency: 6000, gain: amount * 6 });
      }
      case 'warmth': {
        const amount = this.clamp01(p?.amount ?? 0.2);
        return new Tone.Filter({ type: 'lowshelf', frequency: 180, gain: amount * 6 });
      }
      case 'pitch':
        return null;
      default:
        return null;
    }
  }

  private wrapInline(a: Tone.ToneAudioNode, b: Tone.ToneAudioNode): Tone.ToneAudioNode {
    // returns node that accepts input and outputs at the end
    // We'll create a mini chain entry point for consistency
    const g = new Tone.Gain(1);
    g.connect(a);
    a.connect(b);
    // use b as output, but expose g as input via property chaining
    // not strictly type-safe; we return b and let callers connect head->g then g->a->b
    // We'll just return a small proxy-like: but simplest is to return a and rely on pre-connect
    return a as unknown as Tone.ToneAudioNode;
  }

  private wrapMixNode(effect: Tone.ToneAudioNode, cross: Tone.CrossFade): Tone.ToneAudioNode {
    const input = new Tone.Gain(1);
    input.fan(cross.a, effect);
    effect.connect(cross.b);
    return cross as unknown as Tone.ToneAudioNode;
  }
  private async buildChain(
    chain: ChainPreset | null,
    source: AudioNode,
    lastNode: AudioNode,
    forFx: boolean
  ): Promise<AudioNode> {
    if (!chain || chain.pedals.length === 0) {
      source.connect(lastNode);
      return lastNode;
    }

    let head: AudioNode = source;
    let tail: AudioNode = lastNode;

    // Build from source -> ...pedals... -> lastNode
    for (const pedal of chain.pedals) {
      const node = this.createPedalNode(pedal);
      if (!node) continue;
      head.connect(node.input);
      head = node.output;
    }

    head.connect(tail);
    return tail;
  }

  private createPedalNode(pedal: PedalConfig): { input: AudioNode; output: AudioNode } | null {
    const p = pedal.params as any;
    switch (pedal.pedal) {
      case 'gain': {
        const g = this.context.createGain();
        g.gain.value = this.safeVolume(p?.level ?? 1.0);
        return { input: g, output: g };
      }
      case 'filter': {
        const f = this.context.createBiquadFilter();
        const params = (p || {}) as FilterPedalParams;
        const type = params.type ?? 'lowpass';
        f.type = type as BiquadFilterType;
        const freq = params.frequencyHz ?? params.tone ?? (type.includes('high') ? 800 : 3000);
        f.frequency.value = this.clamp(freq, 20, 20000);
        if (params.q !== undefined) f.Q.value = params.q;
        if (params.gainDb !== undefined) f.gain.value = params.gainDb;
        return { input: f, output: f };
      }
      case 'delay': {
        const time = (p?.timeMs ?? 180) / 1000;
        const feedback = this.clamp01(p?.feedback ?? 0.3);
        const mix = this.clamp01(p?.mix ?? 0.25);
        const delay = this.context.createDelay(5.0);
        delay.delayTime.value = time;
        const fbGain = this.context.createGain();
        fbGain.gain.value = feedback;
        delay.connect(fbGain);
        fbGain.connect(delay);
        const dryGain = this.context.createGain();
        dryGain.gain.value = 1 - mix;
        const wetGain = this.context.createGain();
        wetGain.gain.value = mix;
        return this.mixNode(delay, dryGain, wetGain);
      }
      case 'reverb': {
        const mix = this.clamp01(p?.mix ?? 0.2);
        const conv = this.context.createConvolver();
        if (p?.irUrl) {
          // fire and forget: use AudioLoader to get an AudioBuffer directly
          this.loader
            .loadAsync(this.resolveAssetUrl(p.irUrl))
            .then((ab) => (conv.buffer = ab as unknown as AudioBuffer))
            .catch(() => void 0);
        }
        const dryGain = this.context.createGain();
        dryGain.gain.value = 1 - mix;
        const wetGain = this.context.createGain();
        wetGain.gain.value = mix;
        return this.mixNode(conv, dryGain, wetGain);
      }
      case 'compressor': {
        const c = this.context.createDynamicsCompressor();
        const tight = this.clamp01(p?.tightness ?? 0.5);
        c.threshold.value = -50 + tight * 30; // -50..-20 dB
        c.ratio.value = 2 + tight * 8; // 2..10
        c.attack.value = (p?.attackMs ?? 6) / 1000;
        c.release.value = (p?.releaseMs ?? 120) / 1000;
        const makeup = this.safeVolume(p?.makeup ?? 1.0);
        const g = this.context.createGain();
        g.gain.value = makeup;
        c.connect(g);
        return { input: c, output: g };
      }
      case 'limiter': {
        const ceilingDb = p?.ceilingDb ?? -0.1;
        const c = this.context.createDynamicsCompressor();
        c.threshold.value = ceilingDb;
        c.ratio.value = 20;
        c.attack.value = 0.001;
        c.release.value = 0.03;
        return { input: c, output: c };
      }
      case 'panner': {
        const pan = this.clamp(p?.pan ?? 0, -1, 1);
        const pn = this.context.createStereoPanner();
        pn.pan.value = pan;
        return { input: pn, output: pn };
      }
      case 'distortion': {
        const ws = this.context.createWaveShaper();
        const drive = this.clamp01(p?.drive ?? 0.2);
        ws.curve = this.makeDistortionCurve(drive * 400);
        const tone = this.clamp01(p?.tone ?? 0.5);
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000 + tone * 15000;
        ws.connect(filter);
        return { input: ws, output: filter };
      }
      case 'sparkle': {
        const amount = this.clamp01(p?.amount ?? 0.2);
        const f = this.context.createBiquadFilter();
        f.type = 'highshelf';
        f.frequency.value = 6000;
        f.gain.value = amount * 6; // up to +6 dB
        return { input: f, output: f };
      }
      case 'warmth': {
        const amount = this.clamp01(p?.amount ?? 0.2);
        const f = this.context.createBiquadFilter();
        f.type = 'lowshelf';
        f.frequency.value = 180;
        f.gain.value = amount * 6;
        return { input: f, output: f };
      }
      case 'pitch': {
        // handled by playbackRate on source; skip node
        return null;
      }
      default:
        return null;
    }
  }

  private extractPlaybackRate(chain: ChainPreset | null): number {
    if (!chain) return 1;
    const pedal = chain.pedals.find((p) => p.pedal === 'pitch') as any;
    if (!pedal?.params) return 1;
    const semitones = pedal.params.semitones ?? 0;
    const cents = pedal.params.cents ?? 0;
    const total = semitones + cents / 100;
    return Math.pow(2, total / 12);
  }

  private mixNode(
    effectNode: AudioNode,
    dryGain: GainNode,
    wetGain: GainNode
  ): { input: AudioNode; output: AudioNode } {
    const input = this.context.createGain();
    const output = this.context.createGain();
    input.connect(dryGain);
    input.connect(effectNode);
    effectNode.connect(wetGain);
    dryGain.connect(output);
    wetGain.connect(output);
    return { input, output };
  }

  private getOrCreateBus(name: string): GainNode {
    let g = this.busGains.get(name);
    if (!g) {
      g = this.context.createGain();
      g.gain.value = 1.0;
      g.connect(this.masterGain);
      this.busGains.set(name, g);
    }
    return g;
  }

  private resolveAssetUrl(src: string): string {
    // If the source is already a full URL (http/https), return as-is
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    // Allow registry to specify paths relative to src root via "assets/..."
    // From this file (src/audio/..), assets live at ../assets/...
    const fixed = src.startsWith('assets/') ? `../${src}` : src;
    const url = new URL(fixed, import.meta.url);
    return url.toString();
  }

  private applyQuality(src: string): string {
    return withAudioQuality(src, this.quality);
  }

  private clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
  }
  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }
  private safeVolume(v: number): number {
    return this.clamp(v, 0, 2);
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const n_samples = 44100,
      curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    let x = 0;
    for (let i = 0; i < n_samples; ++i) {
      x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }
}

export const audioManager = AudioManager.instance;
