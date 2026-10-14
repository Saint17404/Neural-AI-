/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SystemMode } from '../types/neural';
import { Zap, Sliders } from 'lucide-react';

interface SpecializedToolbarProps {
  mode: SystemMode;
  // Wavegrid props
  damping: number;
  onChangeDamping: (d: number) => void;
  elasticity: number;
  onChangeElasticity: (e: number) => void;
  cursorInfluence: number;
  onChangeCursorInfluence: (c: number) => void;
  // Hypercube props
  latticeDim: number;
  onChangeLatticeDim: (dim: number) => void;
  rotSpeed: number;
  onChangeRotSpeed: (s: number) => void;
  glassFacetOpacity: number;
  onChangeGlassFacetOpacity: (o: number) => void;
  // Vortex props
  vortexSpeed: number;
  onChangeVortexSpeed: (s: number) => void;
  attractorStrength: number;
  onChangeAttractorStrength: (a: number) => void;
  // Global action
  onTriggerBurst: () => void;
}

export const SpecializedToolbar: React.FC<SpecializedToolbarProps> = ({
  mode,
  damping,
  onChangeDamping,
  elasticity,
  onChangeElasticity,
  cursorInfluence,
  onChangeCursorInfluence,
  latticeDim,
  onChangeLatticeDim,
  rotSpeed,
  onChangeRotSpeed,
  glassFacetOpacity,
  onChangeGlassFacetOpacity,
  vortexSpeed,
  onChangeVortexSpeed,
  attractorStrength,
  onChangeAttractorStrength,
  onTriggerBurst,
}) => {
  if (mode === 'wavegrid') {
    return (
      <div className="w-full glass-panel rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 border border-white/[0.08]">
        <div className="flex items-center gap-3">
          <button
            onClick={onTriggerBurst}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white hover:bg-slate-200 rounded-lg transition-colors shadow-sm"
          >
            <Zap size={12} className="fill-slate-900" />
            <span>Імпульсна крапля</span>
          </button>

          {/* Quick Sensitivity Presets */}
          <div className="flex items-center gap-1 p-0.5 bg-black/40 rounded-lg border border-white/[0.06] text-xs">
            <button
              onClick={() => onChangeCursorInfluence(0.18)}
              className={`px-2.5 py-1 rounded transition-colors ${
                cursorInfluence <= 0.25 ? 'bg-white/[0.15] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              М'яка
            </button>
            <button
              onClick={() => onChangeCursorInfluence(0.4)}
              className={`px-2.5 py-1 rounded transition-colors ${
                cursorInfluence > 0.25 && cursorInfluence < 0.7
                  ? 'bg-white/[0.15] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Баланс
            </button>
            <button
              onClick={() => onChangeCursorInfluence(0.9)}
              className={`px-2.5 py-1 rounded transition-colors ${
                cursorInfluence >= 0.7 ? 'bg-white/[0.15] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Висока
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-500">Чутливість до курсора:</span>
            <input
              type="range"
              min="0.05"
              max="1.4"
              step="0.05"
              value={cursorInfluence}
              onChange={(e) => onChangeCursorInfluence(parseFloat(e.target.value))}
              className="w-24 accent-slate-300 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="font-mono tabular-nums text-slate-200 w-10">
              {cursorInfluence.toFixed(2)}x
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-500">Затухання:</span>
            <input
              type="range"
              min="0.94"
              max="0.99"
              step="0.005"
              value={damping}
              onChange={(e) => onChangeDamping(parseFloat(e.target.value))}
              className="w-20 accent-slate-300 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="font-mono tabular-nums text-slate-200">
              {damping >= 0.985 ? 'Довге' : damping >= 0.96 ? 'Середнє' : 'Швидке'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'hypercube') {
    return (
      <div className="w-full glass-panel rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 border border-white/[0.08]">
        <div className="flex items-center gap-2">
          <button
            onClick={onTriggerBurst}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white hover:bg-slate-200 rounded-lg transition-colors shadow-sm"
          >
            <Zap size={12} className="fill-slate-900" />
            <span>Об'ємний розряд</span>
          </button>

          <div className="flex items-center gap-1 p-0.5 bg-black/40 rounded-lg border border-white/[0.06] text-xs">
            <button
              onClick={() => onChangeLatticeDim(3)}
              className={`px-2.5 py-1 rounded transition-colors ${
                latticeDim === 3 ? 'bg-white/[0.15] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              3×3×3 (27)
            </button>
            <button
              onClick={() => onChangeLatticeDim(4)}
              className={`px-2.5 py-1 rounded transition-colors ${
                latticeDim === 4 ? 'bg-white/[0.15] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              4×4×4 (64)
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-500">Швидкість обертання:</span>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.1"
              value={rotSpeed}
              onChange={(e) => onChangeRotSpeed(parseFloat(e.target.value))}
              className="w-20 accent-slate-300 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="font-mono tabular-nums text-slate-200">{rotSpeed.toFixed(1)}x</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-500">Прозорість граней:</span>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.1"
              value={glassFacetOpacity}
              onChange={(e) => onChangeGlassFacetOpacity(parseFloat(e.target.value))}
              className="w-20 accent-slate-300 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="font-mono tabular-nums text-slate-200">{glassFacetOpacity.toFixed(1)}</span>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'vortex') {
    return (
      <div className="w-full glass-panel rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 border border-white/[0.08]">
        <div className="flex items-center gap-2">
          <button
            onClick={onTriggerBurst}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white hover:bg-slate-200 rounded-lg transition-colors shadow-sm"
          >
            <Zap size={12} className="fill-slate-900" />
            <span>Орбітальний сплеск</span>
          </button>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            Геометрія: Концентричні скляні диски
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-500">Швидкість вихору:</span>
            <input
              type="range"
              min="0.3"
              max="2.5"
              step="0.1"
              value={vortexSpeed}
              onChange={(e) => onChangeVortexSpeed(parseFloat(e.target.value))}
              className="w-20 accent-slate-300 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="font-mono tabular-nums text-slate-200">{vortexSpeed.toFixed(1)}x</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-500">Гравітація курсора:</span>
            <input
              type="range"
              min="0.3"
              max="2.5"
              step="0.1"
              value={attractorStrength}
              onChange={(e) => onChangeAttractorStrength(parseFloat(e.target.value))}
              className="w-20 accent-slate-300 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="font-mono tabular-nums text-slate-200">{attractorStrength.toFixed(1)}x</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
