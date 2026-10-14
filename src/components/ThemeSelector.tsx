/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GlassTheme } from '../types/neural';
import { Palette } from 'lucide-react';

interface ThemeSelectorProps {
  currentTheme: GlassTheme;
  onSelectTheme: (t: GlassTheme) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
}) => {
  const themes: { id: GlassTheme; name: string; tag: string; dotColor: string }[] = [
    {
      id: 'platinum',
      name: 'Платинове срібло',
      tag: 'Холодне срібло · n=1.52',
      dotColor: 'bg-white',
    },
    {
      id: 'obsidian',
      name: 'Обсидіановий графіт',
      tag: 'Матовий антрацит · n=1.65',
      dotColor: 'bg-slate-500',
    },
    {
      id: 'titanium',
      name: 'Шляхетний титан',
      tag: 'Титанове напилення · n=1.48',
      dotColor: 'bg-slate-300',
    },
    {
      id: 'quartz',
      name: 'Крижаний кварц',
      tag: 'Сапфіровий відлив · n=1.54',
      dotColor: 'bg-sky-200',
    },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/[0.08]">
      <span className="text-[11px] font-mono text-slate-500 px-2 flex items-center gap-1.5 hidden sm:flex">
        <Palette size={12} />
        <span>Скло:</span>
      </span>

      {themes.map((t) => {
        const isActive = currentTheme === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelectTheme(t.id)}
            title={t.tag}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg transition-all ${
              isActive
                ? 'bg-white text-slate-900 font-medium shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${t.dotColor} ${
                isActive ? 'ring-1 ring-slate-900' : 'opacity-70'
              }`}
            />
            <span className="whitespace-nowrap">{t.name}</span>
          </button>
        );
      })}
    </div>
  );
};
