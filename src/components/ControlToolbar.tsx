/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Pause, RotateCcw, Eye, Layers, Sparkles, Activity } from 'lucide-react';
import { ViewPerspective } from '../types/neural';

interface ControlToolbarProps {
  isPaused: boolean;
  onTogglePause: () => void;
  simulationSpeed: number;
  onChangeSpeed: (speed: number) => void;
  pulseRate: number;
  onChangePulseRate: (rate: number) => void;
  glassOpacity: number;
  onChangeGlassOpacity: (opacity: number) => void;
  perspective: ViewPerspective;
  onChangePerspective: (p: ViewPerspective) => void;
  onResetWeights: () => void;
  onTriggerPattern: (pattern: 'cascade' | 'harmonic' | 'storm') => void;
}

export const ControlToolbar: React.FC<ControlToolbarProps> = ({
  isPaused,
  onTogglePause,
  simulationSpeed,
  onChangeSpeed,
  pulseRate,
  onChangePulseRate,
  glassOpacity,
  onChangeGlassOpacity,
  perspective,
  onChangePerspective,
  onResetWeights,
  onTriggerPattern,
}) => {
  return (
    <div className="w-full glass-panel rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 border border-white/[0.08]">
      {/* Primary Playback & Pulse Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onTogglePause}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
            isPaused
              ? 'bg-white text-slate-900 border-white'
              : 'bg-white/[0.05] text-slate-200 border-white/[0.1] hover:bg-white/[0.1]'
          }`}
        >
          {isPaused ? <Play size={13} className="fill-current" /> : <Pause size={13} />}
          <span>{isPaused ? 'Відновити' : 'Пауза'}</span>
        </button>

        <button
          onClick={onResetWeights}
          title="Скинути та ініціалізувати синаптичні ваги за методом He-Normal"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-lg border border-white/[0.06] transition-colors"
        >
          <RotateCcw size={13} />
          <span>Перезавантажити ваги</span>
        </button>
      </div>

      {/* Perspective Mode Switcher (Functional buttons, segmented control) */}
      <div className="flex items-center gap-1 p-1 bg-black/40 rounded-lg border border-white/[0.06]">
        <button
          onClick={() => onChangePerspective('ortho')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            perspective === 'ortho'
              ? 'bg-white/[0.15] text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers size={12} />
          <span>2D Орто</span>
        </button>
        <button
          onClick={() => onChangePerspective('perspective3d')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            perspective === 'perspective3d'
              ? 'bg-white/[0.15] text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye size={12} />
          <span>3D Скло</span>
        </button>
      </div>

      {/* Pattern Triggers */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 font-mono hidden sm:inline">Патерни:</span>
        <button
          onClick={() => onTriggerPattern('cascade')}
          className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-md border border-white/[0.06] transition-colors font-mono"
        >
          Каскад
        </button>
        <button
          onClick={() => onTriggerPattern('harmonic')}
          className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-md border border-white/[0.06] transition-colors font-mono"
        >
          Гармоніка
        </button>
        <button
          onClick={() => onTriggerPattern('storm')}
          className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-md border border-white/[0.06] transition-colors font-mono"
        >
          Шторм
        </button>
      </div>

      {/* Fine-Tuning Sliders */}
      <div className="flex items-center gap-6 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-500">Швидкість:</span>
          <input
            type="range"
            min="0.3"
            max="2.5"
            step="0.1"
            value={simulationSpeed}
            onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
            className="w-20 accent-slate-300 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono tabular-nums text-slate-300">{simulationSpeed.toFixed(1)}x</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-500">Прозорість скла:</span>
          <input
            type="range"
            min="0.2"
            max="1.5"
            step="0.1"
            value={glassOpacity}
            onChange={(e) => onChangeGlassOpacity(parseFloat(e.target.value))}
            className="w-20 accent-slate-300 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono tabular-nums text-slate-300">{glassOpacity.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
};
