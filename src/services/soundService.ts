// Web Audio API Procedural Sound Engine for CS2 Case Opening
import type { Rarity } from '../types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private volume: number = 0.7;
  private isMuted: boolean = false;
  private rollSource: AudioBufferSourceNode | null = null;
  private rollGain: GainNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.rollGain && this.ctx) {
      this.rollGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.4, this.ctx.currentTime);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.rollGain && this.ctx) {
      this.rollGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.4, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // 1. Tick Sound: Realistic mechanical pointer tick
  public playTick(pitchMultiplier: number = 1.0) {
    if (this.isMuted || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Sharp mechanical click
      osc.type = 'triangle';
      const baseFreq = 1800 * pitchMultiplier;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.025);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(400, now);

      gain.gain.setValueAtTime(this.volume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // AudioContext fallback
    }
  }

  // 2. Rolling Sound: continuous whoosh while cards fly
  public startRoll() {
    if (this.isMuted || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      this.stopRoll();

      // Create pink noise buffer
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.1;
        b6 = white * 0.115926;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, this.ctx.currentTime);
      filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 0.25, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      this.rollSource = noise;
      this.rollGain = gain;
    } catch {
      // Audio context fallback
    }
  }

  public stopRoll() {
    if (this.rollSource) {
      try {
        this.rollSource.stop();
        this.rollSource.disconnect();
      } catch {
        // already stopped
      }
      this.rollSource = null;
    }
  }

  // 3. Slow Down Suspense Sound: Rising tension chord as speed decreases
  public playSuspense() {
    if (this.isMuted || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 1.2);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(this.volume * 0.2, now + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.35);
    } catch {
      // fallback
    }
  }

  // 4. Winner Sound: Sub-bass hit + celebratory triumphant chord (CS2 style)
  public playWinner(rarity: Rarity = 'covert') {
    if (this.isMuted || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      this.stopRoll();
      const now = this.ctx.currentTime;

      // 1. Sub Bass Impact
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(140, now);
      bassOsc.frequency.exponentialRampToValueAtTime(35, now + 0.45);

      bassGain.gain.setValueAtTime(this.volume * 0.8, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      bassOsc.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 0.85);

      // 2. Triumphant CS2 Chord (Major / Epic Fanfare)
      const chordNotes = rarity === 'special' 
        ? [523.25, 659.25, 783.99, 1046.50, 1318.51] // C5, E5, G5, C6, E6 (High gold shine)
        : rarity === 'covert' 
        ? [440, 554.37, 659.25, 880]                 // A4, C#5, E5, A5
        : [392, 493.88, 587.33, 783.99];              // G4, B4, D5, G5

      chordNotes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        // Low pass filter for warm brass/synth sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, now);

        gain.gain.setValueAtTime(0.001, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime((this.volume * 0.25) / chordNotes.length, now + idx * 0.05 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + 2.0);
      });

      // 3. Shimmer Chime for high rarity
      if (rarity === 'covert' || rarity === 'special') {
        const shimmerNotes = [1200, 1500, 1800, 2400, 3000];
        shimmerNotes.forEach((freq, i) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + 0.2 + i * 0.07);

          gain.gain.setValueAtTime(this.volume * 0.12, now + 0.2 + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + i * 0.07 + 0.4);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + 0.2 + i * 0.07);
          osc.stop(now + 0.2 + i * 0.07 + 0.45);
        });
      }
    } catch {
      // fallback
    }
  }
}

export const soundService = new SoundEngine();
