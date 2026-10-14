/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { NetworkStats } from '../types/neural';

interface OscilloscopePanelProps {
  stats: NetworkStats;
}

export const OscilloscopePanel: React.FC<OscilloscopePanelProps> = ({ stats }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<number[]>([]);

  useEffect(() => {
    // Keep 120 points history of average voltage
    historyRef.current.push(stats.averageVoltage);
    if (historyRef.current.length > 120) {
      historyRef.current.shift();
    }
  }, [stats.averageVoltage]);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      animId = requestAnimationFrame(render);
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Background
      ctx.fillStyle = '#0f1115';
      ctx.fillRect(0, 0, width, height);

      // Oscilloscope grid lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';

      // Horizontal reference lines
      for (let y = 15; y < height; y += 22) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Zero baseline
      const baselineY = height * 0.72;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.moveTo(0, baselineY);
      ctx.lineTo(width, baselineY);
      ctx.stroke();

      // Render waveform curve
      const data = historyRef.current;
      if (data.length > 1) {
        ctx.beginPath();
        const step = width / 120;
        data.forEach((val, i) => {
          const x = i * step;
          // Scale val [0, 1] to height
          const y = baselineY - val * (height * 0.55);
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        // Waveform stroke: pristine liquid silver
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.9)';
        ctx.stroke();

        // Area gradient below waveform
        ctx.lineTo((data.length - 1) * step, baselineY);
        ctx.lineTo(0, baselineY);
        ctx.closePath();
        const fillGrad = ctx.createLinearGradient(0, 0, 0, baselineY);
        fillGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
        fillGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        ctx.fillStyle = fillGrad;
        ctx.fill();

        // Head tracer dot
        const lastX = (data.length - 1) * step;
        const lastY = baselineY - data[data.length - 1] * (height * 0.55);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(lastX, lastY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/[0.08]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06] mb-6">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">
            Осцилограф та телеметрія активності
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Моніторинг сумарного синаптичного потоку та ентропії в реальному часі
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>СЕМПЛУВАННЯ: 60 ГЦ</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>ЧАСОВА РОЗГОРТКА: 2.0 СЕК</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Waveform Canvas */}
        <div className="lg:col-span-7 h-48 rounded-xl overflow-hidden border border-white/[0.06] relative">
          <canvas ref={canvasRef} className="w-full h-full block" />
          <div className="absolute top-2 left-3 text-[10px] font-mono text-slate-400 pointer-events-none">
            ПОТЕНЦІАЛ МЕМБРАНИ V_m(t) [мВ]
          </div>
          <div className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-500 pointer-events-none">
            БАЗОВА ЛІНІЯ: 0.08V
          </div>
        </div>

        {/* Tabular Precision Metrics */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Частота спалахів
            </div>
            <div className="flex items-baseline mt-1">
              <span className="text-2xl font-mono font-semibold text-white tabular-nums">
                {stats.firingRateHz}
              </span>
              <span className="text-xs uppercase font-mono text-slate-400 ml-1.5">Гц</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-1">
              Поточна швидкість імпульсів
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Активні фотони
            </div>
            <div className="flex items-baseline mt-1">
              <span className="text-2xl font-mono font-semibold text-white tabular-nums">
                {stats.activeSignals}
              </span>
              <span className="text-xs uppercase font-mono text-slate-400 ml-1.5">сигн</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-1">
              У синаптичних волокнах
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Середній потенціал
            </div>
            <div className="flex items-baseline mt-1">
              <span className="text-2xl font-mono font-semibold text-white tabular-nums">
                {(stats.averageVoltage * 100).toFixed(1)}
              </span>
              <span className="text-xs uppercase font-mono text-slate-400 ml-1.5">мВ</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-1">
              По всьому масиву нейронів
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Ентропія мережі
            </div>
            <div className="flex items-baseline mt-1">
              <span className="text-2xl font-mono font-semibold text-white tabular-nums">
                {stats.networkEntropy.toFixed(3)}
              </span>
              <span className="text-xs uppercase font-mono text-slate-400 ml-1.5">біт</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-1">
              Рівень хаосу розподілу
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
