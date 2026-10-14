/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ActivationFunction } from '../types/neural';
import { Sliders, Plus, Minus, Cpu } from 'lucide-react';

interface ArchitecturePanelProps {
  layerSizes: number[];
  onChangeLayerSizes: (newSizes: number[]) => void;
  activationFn: ActivationFunction;
  onChangeActivationFn: (fn: ActivationFunction) => void;
  learningRate: number;
  onChangeLearningRate: (lr: number) => void;
}

export const ArchitecturePanel: React.FC<ArchitecturePanelProps> = ({
  layerSizes,
  onChangeLayerSizes,
  activationFn,
  onChangeActivationFn,
  learningRate,
  onChangeLearningRate,
}) => {
  const activationFunctions: { id: ActivationFunction; name: string; formula: string }[] = [
    { id: 'gelu', name: 'GELU', formula: 'x · Φ(x)' },
    { id: 'relu', name: 'ReLU', formula: 'max(0, x)' },
    { id: 'leaky_relu', name: 'Leaky ReLU', formula: 'max(0.08x, x)' },
    { id: 'tanh', name: 'Tanh', formula: 'tanh(x)' },
    { id: 'sigmoid', name: 'Sigmoid', formula: '1 / (1 + e⁻ˣ)' },
  ];

  const handleAdjustLayer = (index: number, delta: number) => {
    const updated = [...layerSizes];
    const newCount = Math.max(2, Math.min(8, updated[index] + delta));
    updated[index] = newCount;
    onChangeLayerSizes(updated);
  };

  const handleAddLayer = () => {
    if (layerSizes.length >= 5) return;
    const insertIdx = layerSizes.length - 1;
    const updated = [...layerSizes];
    updated.splice(insertIdx, 0, 5);
    onChangeLayerSizes(updated);
  };

  const handleRemoveLayer = () => {
    if (layerSizes.length <= 3) return;
    const removeIdx = layerSizes.length - 2;
    const updated = [...layerSizes];
    updated.splice(removeIdx, 1);
    onChangeLayerSizes(updated);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/[0.08]">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-6">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">
            Конфігуратор архітектури
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Топологія шарів та математичні ядра передачі потенціалу
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddLayer}
            disabled={layerSizes.length >= 5}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 rounded-lg border border-white/[0.06] transition-colors"
          >
            <Plus size={13} />
            <span>Додати шар</span>
          </button>
          <button
            onClick={handleRemoveLayer}
            disabled={layerSizes.length <= 3}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 rounded-lg border border-white/[0.06] transition-colors"
          >
            <Minus size={13} />
            <span>Видалити шар</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Layer Nodes Adjuster */}
        <div className="space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block">
            Шари та кількість нейронів
          </span>
          <div className="space-y-2">
            {layerSizes.map((count, idx) => {
              const isInput = idx === 0;
              const isOutput = idx === layerSizes.length - 1;
              const title = isInput
                ? 'Вхідний сенсорний'
                : isOutput
                ? 'Вихідний вектор'
                : `Прихований шар ${idx}`;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]"
                >
                  <div>
                    <div className="text-xs text-slate-300 font-medium">{title}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Скляна панель L_{idx}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAdjustLayer(idx, -1)}
                      disabled={count <= 2}
                      className="p-1 rounded bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-30 text-slate-300"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center font-mono text-sm tabular-nums text-white">
                      {count}
                    </span>
                    <button
                      onClick={() => handleAdjustLayer(idx, 1)}
                      disabled={count >= 8}
                      className="p-1 rounded bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-30 text-slate-300"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activation Function Selection */}
        <div className="space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block">
            Функція активації f(z)
          </span>
          <div className="space-y-1.5">
            {activationFunctions.map((fn) => (
              <button
                key={fn.id}
                onClick={() => onChangeActivationFn(fn.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all text-left ${
                  activationFn === fn.id
                    ? 'bg-white/[0.1] border-white/20 text-white shadow-sm'
                    : 'bg-white/[0.02] border-white/[0.05] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <div>
                  <span className="text-xs font-medium block">{fn.name}</span>
                  <span className="text-[11px] font-mono text-slate-500">{fn.formula}</span>
                </div>
                {activationFn === fn.id && (
                  <span className="text-[11px] font-mono text-slate-300">Активна</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plasticity & Parameters */}
        <div className="space-y-4">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block">
            Синаптична пластичність
          </span>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Швидкість навчання (η):</span>
              <span className="font-mono tabular-nums text-white">{learningRate.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.001"
              max="0.08"
              step="0.002"
              value={learningRate}
              onChange={(e) => onChangeLearningRate(parseFloat(e.target.value))}
              className="w-full accent-slate-300 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Визначає динамічну адаптацію синаптичних ваг за принципом Хебба при сумісних спалахах нейронів.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
            <div className="text-xs text-slate-300 font-medium mb-1">Скляна підкладка</div>
            <div className="text-[11px] text-slate-400 leading-relaxed font-mono">
              Оптичне скло BK7 з наноструктурованим заломленням. Повна ізоляція перехресних перешкод між сусідніми шарами.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
