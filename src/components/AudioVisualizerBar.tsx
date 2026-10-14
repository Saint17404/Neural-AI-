/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Video, Sparkles, Keyboard, Radio } from 'lucide-react';
import { audioReactiveEngine } from '../utils/audioAnalyzer';
import { videoRecorder } from '../utils/recorder';

interface AudioVisualizerBarProps {
  onShowHotkeys: () => void;
  onRecordVideo: () => void;
  isRecording: boolean;
  recordingProgress: number;
}

export const AudioVisualizerBar: React.FC<AudioVisualizerBarProps> = ({
  onShowHotkeys,
  onRecordVideo,
  isRecording,
  recordingProgress,
}) => {
  const [micActive, setMicActive] = useState<boolean>(false);
  const [synthActive, setSynthActive] = useState<boolean>(false);
  const [freqLevels, setFreqLevels] = useState<{ bass: number; mid: number; treble: number }>({
    bass: 0,
    mid: 0,
    treble: 0,
  });

  const handleToggleMic = async () => {
    if (micActive) {
      audioReactiveEngine.disableMicrophone();
      setMicActive(false);
    } else {
      const ok = await audioReactiveEngine.enableMicrophone();
      setMicActive(ok);
      if (ok) setSynthActive(false);
    }
  };

  const handleToggleSynth = () => {
    const next = !synthActive;
    audioReactiveEngine.setSyntheticReactive(next);
    setSynthActive(next);
    if (next) setMicActive(false);
  };

  // Poll frequency data
  useEffect(() => {
    let animId: number;
    const poll = () => {
      animId = requestAnimationFrame(poll);
      const data = audioReactiveEngine.getFrequencyData();
      setFreqLevels({
        bass: data.bass,
        mid: data.mid,
        treble: data.treble,
      });
    };
    animId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="w-full glass-panel rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 border border-white/[0.08]">
      {/* Audio Reactive Toggles */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggleMic}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all ${
            micActive
              ? 'bg-white text-slate-900 border-white font-medium shadow-sm'
              : 'bg-white/[0.03] text-slate-400 border-white/[0.05] hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          {micActive ? <Mic size={13} className="text-slate-900" /> : <MicOff size={13} />}
          <span>{micActive ? 'Мікрофон увімкнено' : 'Мікрофонна реакція'}</span>
        </button>

        <button
          onClick={handleToggleSynth}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all ${
            synthActive
              ? 'bg-white text-slate-900 border-white font-medium shadow-sm'
              : 'bg-white/[0.03] text-slate-400 border-white/[0.05] hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <Radio size={13} />
          <span>Синтетичний ритм</span>
        </button>

        {/* Live Mini Spectrum Bars */}
        {(micActive || synthActive) && (
          <div className="flex items-end gap-1 h-5 px-2 bg-black/40 rounded-lg border border-white/[0.05]">
            <div
              className="w-1 bg-white rounded-t transition-all duration-75"
              style={{ height: `${Math.max(3, freqLevels.bass * 20)}px` }}
              title="Низькі частоти (Бас)"
            />
            <div
              className="w-1 bg-slate-300 rounded-t transition-all duration-75"
              style={{ height: `${Math.max(3, freqLevels.mid * 20)}px` }}
              title="Середні частоти"
            />
            <div
              className="w-1 bg-slate-400 rounded-t transition-all duration-75"
              style={{ height: `${Math.max(3, freqLevels.treble * 20)}px` }}
              title="Високі частоти"
            />
          </div>
        )}
      </div>

      {/* Right Action Tools: Video Recording & Hotkeys */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRecordVideo}
          disabled={isRecording}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all ${
            isRecording
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
              : 'bg-white/[0.03] text-slate-300 border-white/[0.06] hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          <Video size={13} />
          <span>{isRecording ? `Запис відео... ${recordingProgress}%` : 'Записати відео (5с)'}</span>
        </button>

        <button
          onClick={onShowHotkeys}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-lg border border-white/[0.06] transition-colors"
        >
          <Keyboard size={13} />
          <span className="hidden sm:inline">Гарячі клавіші</span>
        </button>
      </div>
    </div>
  );
};
