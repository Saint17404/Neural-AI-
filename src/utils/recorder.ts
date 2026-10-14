/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class CanvasVideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;
  private timerId: number | null = null;
  private progressIntervalId: number | null = null;

  public startRecording(
    canvas: HTMLCanvasElement,
    durationMs = 5000,
    onProgress?: (percent: number) => void,
    onComplete?: () => void
  ): boolean {
    if (this.isRecording) return false;

    try {
      // 60 fps stream from canvas
      const stream = canvas.captureStream(60);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      this.mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
      this.recordedChunks = [];
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.saveVideo();
        this.isRecording = false;
        if (onComplete) onComplete();
      };

      this.mediaRecorder.start();

      const startTime = performance.now();
      if (onProgress) {
        this.progressIntervalId = window.setInterval(() => {
          const elapsed = performance.now() - startTime;
          const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
          onProgress(pct);
        }, 100);
      }

      this.timerId = window.setTimeout(() => {
        this.stopRecording();
      }, durationMs);

      return true;
    } catch {
      this.isRecording = false;
      return false;
    }
  }

  public stopRecording() {
    if (this.timerId) clearTimeout(this.timerId);
    if (this.progressIntervalId) clearInterval(this.progressIntervalId);
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.isRecording = false;
  }

  private saveVideo() {
    if (this.recordedChunks.length === 0) return;
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neural-glass-animation-${Date.now()}.webm`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }
}

export const videoRecorder = new CanvasVideoRecorder();
