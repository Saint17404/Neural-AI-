/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Neuron } from '../types/neural';
import { Zap, X, SlidersHorizontal } from 'lucide-react';

interface NeuronDetailSheetProps {
  neuron: Neuron | null;
  onClose: () => void;
  onFireNeuron: (neuron: Neuron) => void;
  onUpdateBias: (neuronId: string, bias: number) => void;
}

export const NeuronDetailSheet: React.FC<NeuronDetailSheetProps> = ({
  neuron,
  onClose,
  onFireNeuron,
  onUpdateBias,
}) => {
  if (!neuron) return null;

  return (
    <div className="glass-panel rounded-xl p-5 border border-white/[0.12] shadow-2xl relative w-full max-w-sm">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
          <span className="font-mono text-sm font-semibold text-white">Вузол {neuron.label}</span>
          <span className="text-xs text-slate-400 font-mono">
            {neuron.isInput ? '· ВХІД' : neuron.isOutput ? '· ВИХІД' : `· ШАР ${neuron.layerIndex}`}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      <div className="space-y-3.5">
        <div>
          <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
            <span>Потенціал мембрани:</span>
            <span className="text-white font-semibold tabular-nums">
              {(neuron.voltage * 100).toFixed(1)} мВ
            </span>
          </div>
          <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/[0.08]">
            <div
              className="h-full bg-white transition-all duration-75 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              style={{ width: `${Math.min(100, neuron.voltage * 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
            <span className="text-slate-500 block text-[10px]">ПОРІГ ЗБУДЖЕННЯ</span>
            <span className="text-slate-200 font-medium tabular-nums">
              {(neuron.threshold * 100).toFixed(0)} мВ
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
            <span className="text-slate-500 block text-[10px]">СТАН ВУЗЛА</span>
            <span className="text-slate-200 font-medium">
              {neuron.isFiring ? 'Спалах' : 'Спокій'}
            </span>
          </div>
        </div>

        {/* Bias adjuster */}
        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Зсув вузла (Bias b):</span>
            <span className="text-white font-semibold tabular-nums">{neuron.bias.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="-1.0"
            max="1.0"
            step="0.05"
            value={neuron.bias}
            onChange={(e) => onUpdateBias(neuron.id, parseFloat(e.target.value))}
            className="w-full accent-slate-300 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        <button
          onClick={() => onFireNeuron(neuron)}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-900 bg-white hover:bg-slate-200 transition-colors rounded-lg shadow-sm"
        >
          <Zap size={13} className="fill-slate-900" />
          Деполяризувати (Спровокувати спалах)
        </button>
      </div>
    </div>
  );
};
