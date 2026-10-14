/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class NeuralAudioEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = false;
  private lastPingTime = 0;

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled && !this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended' && enabled) {
      this.ctx.resume();
    }
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public playActionPotential(layerIndex: number, voltage: number) {
    if (!this.isEnabled || !this.ctx) return;
    const now = performance.now();
    // Throttle sounds so audio isn't saturated
    if (now - this.lastPingTime < 35) return;
    this.lastPingTime = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Crystalline glass tones based on layer
      // Pentatonic high-resonance frequencies
      const baseFreqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
      const freq = baseFreqs[layerIndex % baseFreqs.length] * (1 + voltage * 0.2);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const volume = Math.min(0.08, 0.02 + voltage * 0.05);
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {
      // AudioContext might be blocked until user gesture, safely ignore
    }
  }

  public playGlassClink() {
    if (!this.isEnabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch {}
  }
}

export const neuralAudio = new NeuralAudioEngine();
