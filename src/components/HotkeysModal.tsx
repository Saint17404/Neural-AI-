/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface HotkeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotkeysModal: React.FC<HotkeysModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '1 – 6', desc: 'Миттєве перемикання між 6 режимами симуляції' },
    { key: 'Space', desc: 'Пауза / Відновлення поточної симуляції' },
    { key: 'Z', desc: 'Стимулювати електричний розряд або хвилю' },
    { key: 'C', desc: 'Зберегти 4K скляний знімок (PNG шпалери)' },
    { key: 'R', desc: 'Записати 5-секундну анімацію (WebM)' },
    { key: 'F', desc: 'Повноекранний кінематографічний Zen-режим' },
    { key: 'M', desc: 'Увімкнути / вимкнути кристалічний звук' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-white/20 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
          <div className="flex items-center gap-2.5">
            <Keyboard size={16} className="text-white" />
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Гарячі клавіші (Pro Mode)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-2.5">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]"
            >
              <span className="text-xs text-slate-300">{sc.desc}</span>
              <kbd className="px-2 py-1 text-[11px] font-mono font-medium text-white bg-white/[0.1] rounded border border-white/[0.15] shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-white/[0.06] text-center">
          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-medium text-slate-900 bg-white hover:bg-slate-200 transition-colors rounded-lg shadow-sm"
          >
            Зрозуміло
          </button>
        </div>
      </div>
    </div>
  );
};
