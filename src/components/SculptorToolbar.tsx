/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SculptorTool } from '../types/neural';
import { PenTool, Link2, Eraser, Flame, Trash2, Sparkles, Orbit } from 'lucide-react';

interface SculptorToolbarProps {
  tool: SculptorTool;
  onChangeTool: (tool: SculptorTool) => void;
  autoConnectDist: number;
  onChangeAutoConnectDist: (d: number) => void;
  driftSpeed: number;
  onChangeDriftSpeed: (s: number) => void;
  onApplyStamp: (stamp: 'dna' | 'fractal' | 'ring' | 'constellation') => void;
  onClear: () => void;
}

export const SculptorToolbar: React.FC<SculptorToolbarProps> = ({
  tool,
  onChangeTool,
  autoConnectDist,
  onChangeAutoConnectDist,
  driftSpeed,
  onChangeDriftSpeed,
  onApplyStamp,
  onClear,
}) => {
  return (
    <div className="w-full glass-panel rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 border border-white/[0.08]">
      {/* Tool selector */}
      <div className="flex items-center gap-1 p-1 bg-black/40 rounded-lg border border-white/[0.06]">
        <button
          onClick={() => onChangeTool('draw')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            tool === 'draw'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PenTool size={13} />
          <span>Перо вузлів</span>
        </button>

        <button
          onClick={() => onChangeTool('connect')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            tool === 'connect'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Link2 size={13} />
          <span>Синаптичний зв'язок</span>
        </button>

        <button
          onClick={() => onChangeTool('torch')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            tool === 'torch'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame size={13} />
          <span>Факел збудження</span>
        </button>

        <button
          onClick={() => onChangeTool('erase')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            tool === 'erase'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eraser size={13} />
          <span>Ластик</span>
        </button>
      </div>

      {/* Preset Geometry Stamps */}
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-slate-500 font-mono hidden md:inline mr-1">Шаблони:</span>
        <button
          onClick={() => onApplyStamp('dna')}
          className="px-2.5 py-1 text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-md border border-white/[0.06] transition-colors font-mono"
        >
          ДНК-спіраль
        </button>
        <button
          onClick={() => onApplyStamp('fractal')}
          className="px-2.5 py-1 text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-md border border-white/[0.06] transition-colors font-mono"
        >
          Фрактал
        </button>
        <button
          onClick={() => onApplyStamp('ring')}
          className="px-2.5 py-1 text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-md border border-white/[0.06] transition-colors font-mono"
        >
          Кільце
        </button>
        <button
          onClick={onClear}
          title="Очистити верстат"
          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-white/[0.05] transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Fine-Tuning Sliders */}
      <div className="flex items-center gap-5 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-500">Автозв'язок:</span>
          <input
            type="range"
            min="60"
            max="220"
            step="10"
            value={autoConnectDist}
            onChange={(e) => onChangeAutoConnectDist(parseInt(e.target.value, 10))}
            className="w-20 accent-slate-300 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono tabular-nums text-slate-200">{autoConnectDist}px</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-500">Дрейф:</span>
          <input
            type="range"
            min="0"
            max="2.0"
            step="0.1"
            value={driftSpeed}
            onChange={(e) => onChangeDriftSpeed(parseFloat(e.target.value))}
            className="w-16 accent-slate-300 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono tabular-nums text-slate-200">{driftSpeed.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  );
};
