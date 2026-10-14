/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MouseInteraction } from '../types/neural';
import { Magnet, Sparkles, Sliders, Shield, Zap } from 'lucide-react';

interface ConstellationToolbarProps {
  particleCount: number;
  onChangeParticleCount: (count: number) => void;
  maxDistance: number;
  onChangeMaxDistance: (dist: number) => void;
  cursorRadius: number;
  onChangeCursorRadius: (rad: number) => void;
  speed: number;
  onChangeSpeed: (spd: number) => void;
  mouseMode: MouseInteraction;
  onChangeMouseMode: (mode: MouseInteraction) => void;
  glassLensEnabled: boolean;
  onToggleGlassLens: () => void;
  onTriggerBurst: () => void;
}

export const ConstellationToolbar: React.FC<ConstellationToolbarProps> = ({
  particleCount,
  onChangeParticleCount,
  maxDistance,
  onChangeMaxDistance,
  cursorRadius,
  onChangeCursorRadius,
  speed,
  onChangeSpeed,
  mouseMode,
  onChangeMouseMode,
  glassLensEnabled,
  onToggleGlassLens,
  onTriggerBurst,
}) => {
  return (
    <div className="w-full glass-panel rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 border border-white/[0.08]">
      {/* Mouse Physics Modes (Functional Segmented Control) */}
      <div className="flex items-center gap-1 p-1 bg-black/40 rounded-lg border border-white/[0.06]">
        <button
          onClick={() => onChangeMouseMode('connect')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            mouseMode === 'connect'
              ? 'bg-white/[0.15] text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          З'єднання
        </button>
        <button
          onClick={() => onChangeMouseMode('attract')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            mouseMode === 'attract'
              ? 'bg-white/[0.15] text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Magnet size={12} />
          <span>Притягання</span>
        </button>
        <button
          onClick={() => onChangeMouseMode('repel')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            mouseMode === 'repel'
              ? 'bg-white/[0.15] text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Відштовхування
        </button>
      </div>

      {/* Primary Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleGlassLens}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
            glassLensEnabled
              ? 'bg-white/[0.12] text-white border-white/20'
              : 'bg-white/[0.03] text-slate-400 border-white/[0.05] hover:text-slate-200'
          }`}
        >
          <Shield size={12} />
          <span>Скляна лінза курсора</span>
        </button>

        <button
          onClick={onTriggerBurst}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white hover:bg-slate-200 rounded-lg transition-colors shadow-sm"
        >
          <Zap size={12} className="fill-slate-900" />
          <span>Ударна хвиля</span>
        </button>
      </div>

      {/* Fine-Tuning Sliders */}
      <div className="flex flex-wrap items-center gap-5 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-500">Кількість точок:</span>
          <input
            type="range"
            min="40"
            max="180"
            step="10"
            value={particleCount}
            onChange={(e) => onChangeParticleCount(parseInt(e.target.value, 10))}
            className="w-20 accent-slate-300 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono tabular-nums text-slate-200 w-7">{particleCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-500">Дистанція ліній:</span>
          <input
            type="range"
            min="70"
            max="220"
            step="10"
            value={maxDistance}
            onChange={(e) => onChangeMaxDistance(parseInt(e.target.value, 10))}
            className="w-20 accent-slate-300 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono tabular-nums text-slate-200 w-8">{maxDistance}px</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-500">Радіус курсора:</span>
          <input
            type="range"
            min="100"
            max="300"
            step="10"
            value={cursorRadius}
            onChange={(e) => onChangeCursorRadius(parseInt(e.target.value, 10))}
            className="w-20 accent-slate-300 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono tabular-nums text-slate-200 w-8">{cursorRadius}px</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-500">Швидкість:</span>
          <input
            type="range"
            min="0.2"
            max="2.5"
            step="0.1"
            value={speed}
            onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
            className="w-16 accent-slate-300 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono tabular-nums text-slate-200 w-7">{speed.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  );
};
