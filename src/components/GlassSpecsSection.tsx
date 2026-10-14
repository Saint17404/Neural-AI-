/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers, Shield, Sparkles, Binary, Cpu } from 'lucide-react';

export const GlassSpecsSection: React.FC = () => {
  const glassFeatures = [
    {
      title: 'Оптичний діелектрик BK7',
      desc: 'Прецизійні боросилікатні скляні пластини товщиною 1.2 мм з коефіцієнтом заломлення n=1.5168, що запобігають паразитним індуктивним зв’язкам між шарами.',
      metric: 'n = 1.5168',
      label: 'Показник заломлення',
    },
    {
      title: 'Матоване розсіювання імпульсів',
      desc: 'Мікроструктурована текстура поверхні скла створює контрольоване дифузне свічення при проходженні квантів синаптичного сигналу.',
      metric: '0.04 RMS',
      label: 'Шорсткість травлення',
    },
    {
      title: 'Титанове напилення електродів',
      desc: 'Надтонкі металізовані доріжки та контактні майданчики на скляній підкладці у відтінках платини й матового титану.',
      metric: '99.98 %',
      label: 'Чистота титанового шару',
    },
    {
      title: 'Хвилевідний бар’єр затримки',
      desc: 'Скляні міжшарові перегородки задають фізичну просторову затримку передачі збудження, стабілізуючи зворотні зв’язки мережі.',
      metric: '4.2 пс',
      label: 'Оптична латентність',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Editorial Header (No pills, clean unboxed metadata) */}
      <div className="border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-2">
          <span>СПЕЦИФІКАЦІЯ</span>
          <span aria-hidden="true">·</span>
          <span>ОПТИЧНИЙ СУБСТРАТ</span>
          <span aria-hidden="true">·</span>
          <span>НЕЙРОМОРФНЕ СКЛО</span>
        </div>
        <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight text-white">
          Фізика та естетика скляного нейросубстрату
        </h2>
        <p className="text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
          Між кожним обчислювальним шаром нейронів інтегровано напівпрозорі скляні панелі. Вони виконують роль оптичних фільтрів, розсіюють світлові імпульси потенціалів дії та створюють тривимірний ефект кристалічної глибини в монохромній палітрі.
        </p>
      </div>

      {/* Feature Grid with Frosted Glass Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {glassFeatures.map((item, idx) => (
          <div
            key={idx}
            className="glass-panel rounded-xl p-5 border border-white/[0.06] hover:border-white/[0.15] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                0{idx + 1}. {item.title}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>

            <div className="mt-6 pt-3 border-t border-white/[0.05]">
              <div className="text-xl font-mono font-bold text-white tabular-nums">
                {item.metric}
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-0.5">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Cross-section Schematic Visualizer in Gray & Glass */}
      <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Пошаровий переріз структури «Скло — Синапс — Скло»
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Візуалізація просторового розташування напівпрозорих пластин
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500">
            ПРОСТОРОВИЙ КРОК: 140 МКМ
          </div>
        </div>

        {/* CSS Glass Slabs visual demonstration */}
        <div className="relative py-8 flex items-center justify-center gap-3 md:gap-8 overflow-x-auto">
          {[
            { name: 'Вхідне скло L0', tag: 'Сенсори' },
            { name: 'Призма розсіювання L1', tag: 'Латенти α' },
            { name: 'Оптичне ядро L2', tag: 'Латенти β' },
            { name: 'Кристалічний колектор L3', tag: 'Вихід' },
          ].map((slab, i) => (
            <div key={i} className="flex flex-col items-center gap-3 shrink-0">
              <div className="w-24 md:w-36 h-48 rounded-xl bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-white/[0.05] backdrop-blur-md border border-white/[0.15] shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-3 flex flex-col justify-between relative group hover:border-white/40 transition-colors">
                <div className="text-[10px] font-mono text-slate-400 border-b border-white/[0.06] pb-1">
                  ПАНЕЛЬ 0{i}
                </div>
                {/* Simulated etched lines inside glass */}
                <div className="space-y-2 opacity-40">
                  <div className="w-full h-px bg-white/30" />
                  <div className="w-2/3 h-px bg-white/20" />
                  <div className="w-3/4 h-px bg-white/20" />
                </div>
                <div className="text-[11px] font-mono font-medium text-slate-200">
                  {slab.tag}
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400 text-center">{slab.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
