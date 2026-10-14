/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SystemMode } from '../types/neural';
import { Zap, Volume2, VolumeX, Camera, Maximize2 } from 'lucide-react';

interface TopBarProps {
  onInjectImpulse: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  activeViewMode: SystemMode;
  onSelectViewMode: (mode: SystemMode) => void;
  activeSection: string;
  onNavigate: (section: string) => void;
  onTakeSnapshot: () => void;
  onToggleFullscreen: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onInjectImpulse,
  soundEnabled,
  onToggleSound,
  activeViewMode,
  onSelectViewMode,
  activeSection,
  onNavigate,
  onTakeSnapshot,
  onToggleFullscreen,
}) => {
  const getActionLabel = () => {
    switch (activeViewMode) {
      case 'constellation':
        return 'Імпульсний спалах';
      case 'layered':
        return 'Стимулювати імпульс';
      case 'wavegrid':
        return 'Хвильовий резонанс';
      case 'hypercube':
        return 'Об\'ємний розряд';
      case 'vortex':
        return 'Орбітальний сплеск';
      case 'sculptor':
        return 'Електризувати вузли';
      default:
        return 'Стимулювати';
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-8 px-6 lg:px-12 py-4 border-b border-white/[0.08] bg-[#0b0c0e]/85 backdrop-blur-xl">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('simulation');
        }}
        className="text-lg font-semibold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2.5"
      >
        <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-tr from-slate-400 to-white shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
        Neural Glass
      </a>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
        <button
          onClick={() => {
            onNavigate('simulation');
          }}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'simulation' ? 'text-white' : ''
          }`}
        >
          Сітка
        </button>
        <button
          onClick={() => onNavigate('oscilloscope')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'oscilloscope' ? 'text-white' : ''
          }`}
        >
          Осцилограф
        </button>
        <button
          onClick={() => onNavigate('experiments')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'experiments' ? 'text-white' : ''
          }`}
        >
          Експерименти
        </button>
        <button
          onClick={() => onNavigate('architecture')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'architecture' ? 'text-white' : ''
          }`}
        >
          Архітектура
        </button>
        <button
          onClick={() => onNavigate('specs')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'specs' ? 'text-white' : ''
          }`}
        >
          Специфікація
        </button>
      </nav>

      {/* Zone 3: 1 primary action (+ tools) */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onTakeSnapshot}
          title="Зберегти скляний знімок (PNG шпалери)"
          className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg border border-white/[0.06] hover:bg-white/[0.04]"
        >
          <Camera size={15} />
        </button>

        <button
          onClick={onToggleFullscreen}
          title="Повноекранний Zen-режим"
          className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg border border-white/[0.06] hover:bg-white/[0.04]"
        >
          <Maximize2 size={15} />
        </button>

        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Вимкнути звук' : 'Увімкнути кристалічний звук'}
          className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg border border-white/[0.06] hover:bg-white/[0.04]"
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>

        <button
          onClick={onInjectImpulse}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-900 bg-white hover:bg-slate-200 transition-colors rounded-lg shadow-sm whitespace-nowrap shrink-0"
        >
          <Zap size={13} className="fill-slate-900" />
          {getActionLabel()}
        </button>
      </div>
    </header>
  );
};
