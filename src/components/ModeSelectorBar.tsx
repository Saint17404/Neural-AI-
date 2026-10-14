/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SystemMode } from '../types/neural';
import { Orbit, Network, Waves, Box, Compass, PenTool } from 'lucide-react';

interface ModeSelectorBarProps {
  currentMode: SystemMode;
  onSelectMode: (mode: SystemMode) => void;
}

export const ModeSelectorBar: React.FC<ModeSelectorBarProps> = ({
  currentMode,
  onSelectMode,
}) => {
  const modes: { id: SystemMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'constellation',
      label: 'Констеляція точок',
      icon: <Orbit size={14} />,
      desc: 'Динамічні точки зі зв’язками до курсора',
    },
    {
      id: 'layered',
      label: 'Багатошарова сітка',
      icon: <Network size={14} />,
      desc: 'Глибока топологія на окремих скляних пластинах',
    },
    {
      id: 'wavegrid',
      label: 'Хвильова матриця',
      icon: <Waves size={14} />,
      desc: 'Деформована топологічна сітка з рідкими хвилями',
    },
    {
      id: 'hypercube',
      label: '3D Гіперкуб',
      icon: <Box size={14} />,
      desc: 'Об’ємна 3D-решітка у скляній призмі',
    },
    {
      id: 'vortex',
      label: 'Синаптичний вихор',
      icon: <Compass size={14} />,
      desc: 'Орбітальний квантовий атрактор на склі',
    },
    {
      id: 'sculptor',
      label: 'Нейро-Скульптор',
      icon: <PenTool size={14} />,
      desc: 'Малюйте власні нейрони та створюйте структури',
    },
  ];

  return (
    <div className="w-full glass-panel rounded-2xl p-2.5 border border-white/[0.08] shadow-lg">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
        {modes.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectMode(m.id)}
              className={`flex flex-col items-start p-3 rounded-xl transition-all text-left group ${
                isActive
                  ? 'bg-white text-slate-900 shadow-md ring-1 ring-white/20'
                  : 'bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-white'}>
                  {m.icon}
                </span>
                <span className="text-xs font-semibold tracking-tight whitespace-nowrap">
                  {m.label}
                </span>
              </div>
              <span
                className={`text-[10px] line-clamp-1 leading-relaxed ${
                  isActive ? 'text-slate-600' : 'text-slate-500 group-hover:text-slate-400'
                }`}
              >
                {m.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
