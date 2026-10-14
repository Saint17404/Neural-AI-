/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, Sparkles, Activity, Waves, Network } from 'lucide-react';

interface ExperimentsSectionProps {
  onTriggerImpulse: () => void;
  onTriggerPattern: (pattern: 'cascade' | 'harmonic' | 'storm') => void;
}

export const ExperimentsSection: React.FC<ExperimentsSectionProps> = ({
  onTriggerImpulse,
  onTriggerPattern,
}) => {
  const [activeExperiment, setActiveExperiment] = useState<string>('cascade');

  const experiments = [
    {
      id: 'cascade',
      title: 'Хвильовий синаптичний каскад',
      tag: 'Каскадна хвиля',
      desc: 'Послідовне збудження сенсорного шару з подальшим лавиноподібним поширенням через скляні пластини у глибину прихованих латентів.',
      actionLabel: 'Запустити каскад',
      run: () => onTriggerPattern('cascade'),
      metrics: 'Затримка фронту: 12 мс · Фазовий зсув: 0.18 рад',
    },
    {
      id: 'harmonic',
      title: 'Гармонічний фазовий резонанс',
      tag: 'Когерентне коливання',
      desc: 'Синхронна синусоїдальна модуляція вхідних нейронів. Мережа генерує стоячу хвилю потенціалів, що розсіюється на мікрорельєфі скла.',
      actionLabel: 'Запустити гармоніку',
      run: () => onTriggerPattern('harmonic'),
      metrics: 'Резонансна частота: 4.8 Гц · Коефіцієнт добротності Q: 14.2',
    },
    {
      id: 'storm',
      title: 'Стохастичний синаптичний шторм',
      tag: 'Ентропійний сплеск',
      desc: 'Введення псевдовипадкового квантового шуму у всі шари одночасно для тестування стабільності порогів збудження та динамічного балансу.',
      actionLabel: 'Викликати шторм',
      run: () => onTriggerPattern('storm'),
      metrics: 'Пікова ентропія: 2.84 біт · Струм розряду: 85 мкА',
    },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">
            Лабораторні нейродинамічні експерименти
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Тестування проходження сигналів крізь скляні шари в різних режимах модуляції
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500">
          3 АКТИВНІ ПРОГРАМИ СТИМУЛЯЦІЇ
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {experiments.map((exp) => (
          <div
            key={exp.id}
            className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
              activeExperiment === exp.id
                ? 'bg-white/[0.05] border-white/20 shadow-lg'
                : 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  {exp.tag}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">{exp.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{exp.desc}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.05] space-y-3">
              <div className="text-[10px] font-mono text-slate-500">{exp.metrics}</div>
              <button
                onClick={() => {
                  setActiveExperiment(exp.id);
                  exp.run();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-900 bg-white hover:bg-slate-200 transition-colors rounded-lg shadow-sm font-mono"
              >
                <Play size={12} className="fill-slate-900" />
                <span>{exp.actionLabel}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
