/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AudioFrequencyData {
  bass: number;     // [0, 1]
  mid: number;      // [0, 1]
  treble: number;   // [0, 1]
  overall: number;  // [0, 1]
}

class AudioReactiveEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private isListeningMic: boolean = false;
  private isSyntheticActive: boolean = false;
  private dataArray: Uint8Array | null = null;

  // Synthetic pulse phase
  private synthPhase: number = 0;

  public async enableMicrophone(): Promise<boolean> {
    try {
      this.initContext();
      if (!this.ctx || !this.analyser) return false;

      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const source = this.ctx.createMediaStreamSource(this.micStream);
      source.connect(this.analyser);
      this.isListeningMic = true;
      this.isSyntheticActive = false;
      return true;
    } catch {
      this.isListeningMic = false;
      return false;
    }
  }

  public disableMicrophone() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    this.isListeningMic = false;
  }

  public setSyntheticReactive(active: boolean) {
    this.isSyntheticActive = active;
    if (active) {
      this.disableMicrophone();
    }
  }

  public isMicActive(): boolean {
    return this.isListeningMic;
  }

  public isSynthActive(): boolean {
    return this.isSyntheticActive;
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getFrequencyData(): AudioFrequencyData {
    if (this.isListeningMic && this.analyser && this.dataArray) {
      // @ts-expect-error type compatibility
      this.analyser.getByteFrequencyData(this.dataArray);

      // Low bins (0 - 10) = Bass
      let bassSum = 0;
      for (let i = 0; i < 8; i++) bassSum += this.dataArray[i];
      const bass = Math.min(1.0, bassSum / (8 * 255));

      // Mid bins (10 - 45) = Mids
      let midSum = 0;
      for (let i = 8; i < 40; i++) midSum += this.dataArray[i];
      const mid = Math.min(1.0, midSum / (32 * 255));

      // High bins (45 - 128) = Treble
      let trebleSum = 0;
      for (let i = 40; i < 110; i++) trebleSum += this.dataArray[i];
      const treble = Math.min(1.0, trebleSum / (70 * 255));

      const overall = (bass * 0.45 + mid * 0.35 + treble * 0.2);

      return { bass, mid, treble, overall };
    }

    if (this.isSyntheticActive) {
      this.synthPhase += 0.04;
      const bass = 0.2 + 0.6 * Math.max(0, Math.sin(this.synthPhase * 1.5));
      const mid = 0.2 + 0.5 * Math.max(0, Math.sin(this.synthPhase * 2.8 + 1));
      const treble = 0.15 + 0.45 * Math.max(0, Math.sin(this.synthPhase * 5.2 + 2));
      const overall = (bass + mid + treble) / 3;
      return { bass, mid, treble, overall };
    }

    return { bass: 0, mid: 0, treble: 0, overall: 0 };
  }
}

export const audioReactiveEngine = new AudioReactiveEngine();
