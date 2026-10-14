/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { neuralAudio } from '../utils/audio';

interface WaveGridCanvasProps {
  damping: number;
  elasticity: number;
  cursorInfluence: number; // Sensitivity factor
  isPaused: boolean;
  onStatsUpdate?: (stats: { activeRipples: number; peakAmplitude: number; surfaceFlux: number }) => void;
}

export const WaveGridCanvas: React.FC<WaveGridCanvasProps> = ({
  damping,
  elasticity,
  cursorInfluence,
  isPaused,
  onStatsUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Discrete 2D wave grid
  const cols = 42;
  const rows = 28;

  // Double-buffering for wave equation
  const buffer1Ref = useRef<Float32Array>(new Float32Array(cols * rows));
  const buffer2Ref = useRef<Float32Array>(new Float32Array(cols * rows));

  // Expanding circular shockwaves for feedback on click
  const shockwavesRef = useRef<{ x: number; y: number; radius: number; maxRadius: number; alpha: number }[]>([]);

  // Mouse state
  const mouseRef = useRef<{
    x: number;
    y: number;
    isInside: boolean;
    prevX: number;
    prevY: number;
    lastWaveTime: number;
  }>({
    x: -1,
    y: -1,
    isInside: false,
    prevX: -1,
    prevY: -1,
    lastWaveTime: 0,
  });

  // Inject disturbance into wave buffers
  const injectWave = useCallback((gridC: number, gridR: number, radius = 2.5, power = 150) => {
    const b1 = buffer1Ref.current;
    const b2 = buffer2Ref.current;

    for (let r = Math.max(1, gridR - radius); r <= Math.min(rows - 2, gridR + radius); r++) {
      for (let c = Math.max(1, gridC - radius); c <= Math.min(cols - 2, gridC + radius); c++) {
        const d = Math.hypot(c - gridC, r - gridR);
        if (d <= radius) {
          const intensity = Math.cos((d / radius) * (Math.PI / 2)) * power;
          b1[r * cols + c] += intensity;
          b2[r * cols + c] += intensity * 0.4;
        }
      }
    }
  }, [cols, rows]);

  // Handle global impulse trigger
  useEffect(() => {
    const handleTrigger = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      shockwavesRef.current.push({
        x: cx,
        y: cy,
        radius: 5,
        maxRadius: Math.max(cx, cy),
        alpha: 0.9,
      });

      injectWave(Math.floor(cols / 2), Math.floor(rows / 2), 4.5, 300 * Math.max(0.5, cursorInfluence));
      neuralAudio.playGlassClink();
    };

    window.addEventListener('trigger-wavegrid-impulse', handleTrigger);
    return () => window.removeEventListener('trigger-wavegrid-impulse', handleTrigger);
  }, [cols, rows, cursorInfluence, injectWave]);

  // Initial calm ambient drop
  useEffect(() => {
    const timer = setTimeout(() => {
      injectWave(Math.floor(cols / 2), Math.floor(rows / 2), 3, 160);
    }, 200);
    return () => clearTimeout(timer);
  }, [cols, rows, injectWave]);

  // Main Animation Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let ambientDropTimer = 0;
    let statsTimer = performance.now();

    const render = () => {
      animId = requestAnimationFrame(render);
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(400, rect.width);
      const height = Math.max(300, rect.height);

      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Deep obsidian canvas
      ctx.fillStyle = '#0b0c0e';
      ctx.fillRect(0, 0, width, height);

      // Gentle ambient droplet if user is idle
      ambientDropTimer++;
      if (ambientDropTimer > 200 && !mouseRef.current.isInside && !isPaused) {
        ambientDropTimer = 0;
        const ac = 10 + Math.floor(Math.random() * (cols - 20));
        const ar = 8 + Math.floor(Math.random() * (rows - 16));
        injectWave(ac, ar, 2.5, 120);
      }

      // Wave Equation Update
      let b1 = buffer1Ref.current;
      let b2 = buffer2Ref.current;

      const damp = Math.min(0.99, Math.max(0.92, damping));

      if (!isPaused) {
        for (let r = 1; r < rows - 1; r++) {
          const rCols = r * cols;
          const upCols = (r - 1) * cols;
          const downCols = (r + 1) * cols;

          for (let c = 1; c < cols - 1; c++) {
            const idx = rCols + c;

            const sum =
              b1[rCols + (c - 1)] +
              b1[rCols + (c + 1)] +
              b1[upCols + c] +
              b1[downCols + c];

            let nextVal = sum * 0.5 - b2[idx];
            nextVal *= damp;
            b2[idx] = nextVal;
          }
        }

        buffer1Ref.current = b2;
        buffer2Ref.current = b1;
      }

      // Isometric 3D Projection Setup
      const cx = width / 2;
      const cy = height / 2 + 15;
      const pitch = 0.52;
      const cosP = Math.cos(pitch);

      const marginX = 40;
      const marginY = 35;
      const usableW = width - marginX * 2;
      const usableH = height - marginY * 2;

      const cellW = usableW / (cols - 1);
      const cellH = (usableH / (rows - 1)) * 0.75;

      const project = (c: number, r: number, hVal: number) => {
        const rawX = (c - (cols - 1) / 2) * cellW;
        const rawY = (r - (rows - 1) / 2) * cellH;

        const px = cx + rawX;
        // Calm displacement scaling
        const py = cy + rawY * cosP - hVal * 0.35;

        return { px, py };
      };

      // Frosted Glass Base Plate
      const pTopLeft = project(0, 0, 0);
      const pTopRight = project(cols - 1, 0, 0);
      const pBottomRight = project(cols - 1, rows - 1, 0);
      const pBottomLeft = project(0, rows - 1, 0);

      ctx.beginPath();
      ctx.moveTo(pTopLeft.px, pTopLeft.py);
      ctx.lineTo(pTopRight.px, pTopRight.py);
      ctx.lineTo(pBottomRight.px, pBottomRight.py);
      ctx.lineTo(pBottomLeft.px, pBottomLeft.py);
      ctx.closePath();

      const glassGrad = ctx.createLinearGradient(pTopLeft.px, pTopLeft.py, pBottomRight.px, pBottomRight.py);
      glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
      glassGrad.addColorStop(0.5, 'rgba(180, 205, 235, 0.02)');
      glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.035)');
      ctx.fillStyle = glassGrad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const thickness = 14;
      ctx.beginPath();
      ctx.moveTo(pBottomLeft.px, pBottomLeft.py);
      ctx.lineTo(pBottomRight.px, pBottomRight.py);
      ctx.lineTo(pBottomRight.px, pBottomRight.py + thickness);
      ctx.lineTo(pBottomLeft.px, pBottomLeft.py + thickness);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.stroke();

      // Precompute points
      const curBuf = buffer1Ref.current;
      const pts: { px: number; py: number; val: number }[] = [];
      let peakAmp = 0;
      let totalFlux = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = curBuf[r * cols + c];
          const absVal = Math.abs(val);
          if (absVal > peakAmp) peakAmp = absVal;
          totalFlux += absVal;

          pts.push({
            ...project(c, r, val),
            val,
          });
        }
      }

      // Draw Mesh Rows
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
          const p = pts[r * cols + c];
          if (c === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        }
        ctx.lineWidth = 0.9;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
        ctx.stroke();
      }

      // Draw Mesh Columns
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        for (let r = 0; r < rows; r++) {
          const p = pts[r * cols + c];
          if (r === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        }
        ctx.lineWidth = 0.9;
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.22)';
        ctx.stroke();
      }

      // Crest Highlights
      for (let r = 0; r < rows; r += 2) {
        for (let c = 0; c < cols; c += 2) {
          const p = pts[r * cols + c];
          if (p.val > 14) {
            const intensity = Math.min(1.0, (p.val - 14) / 70);
            const radius = 1.4 + intensity * 2.2;

            ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + intensity * 0.6})`;
            ctx.beginPath();
            ctx.arc(p.px, p.py, radius, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.val < -18) {
            ctx.fillStyle = 'rgba(51, 65, 85, 0.35)';
            ctx.beginPath();
            ctx.arc(p.px, p.py, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Shockwaves
      shockwavesRef.current.forEach((sw) => {
        sw.radius += 4.5;
        sw.alpha *= 0.94;

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${sw.alpha * 0.6})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius * 0.85, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(203, 213, 225, ${sw.alpha * 0.3})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });
      shockwavesRef.current = shockwavesRef.current.filter((sw) => sw.alpha > 0.02);

      // Cursor Beacon
      const mouse = mouseRef.current;
      if (mouse.isInside) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Stats update
      const now = performance.now();
      if (now - statsTimer > 400 && onStatsUpdate) {
        statsTimer = now;
        onStatsUpdate({
          activeRipples: shockwavesRef.current.length,
          peakAmplitude: peakAmp,
          surfaceFlux: totalFlux / (cols * rows),
        });
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [cols, rows, damping, elasticity, isPaused, injectWave, onStatsUpdate]);

  // Pointer Handlers
  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    shockwavesRef.current.push({
      x: mouseX,
      y: mouseY,
      radius: 4,
      maxRadius: 200,
      alpha: 0.9,
    });

    const cx = rect.width / 2;
    const cy = rect.height / 2 + 15;
    const pitch = 0.52;
    const cosP = Math.cos(pitch);

    const marginX = 40;
    const marginY = 35;
    const cellW = (rect.width - marginX * 2) / (cols - 1);
    const cellH = ((rect.height - marginY * 2) / (rows - 1)) * 0.75;

    const relX = mouseX - cx;
    const relY = (mouseY - cy) / cosP;

    const c = Math.max(1, Math.min(cols - 2, Math.round(relX / cellW + (cols - 1) / 2)));
    const r = Math.max(1, Math.min(rows - 2, Math.round(relY / cellH + (rows - 1) / 2)));

    // Power scaled by cursorInfluence
    const clickPower = 220 * Math.max(0.3, cursorInfluence);
    injectWave(c, r, 3.5, clickPower);
    neuralAudio.playGlassClink();
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const mouse = mouseRef.current;
    mouse.x = mouseX;
    mouse.y = mouseY;
    mouse.isInside = true;

    const now = performance.now();
    const distMoved = Math.hypot(mouseX - mouse.prevX, mouseY - mouse.prevY);

    // Throttle wave injection so it is silky smooth, controlled by sensitivity (cursorInfluence)
    // When cursorInfluence is low, require larger deliberate moves; when high, react to small moves
    const distThreshold = Math.max(8, 22 - cursorInfluence * 12);
    const timeDelta = now - mouse.lastWaveTime;

    if (distMoved > distThreshold && timeDelta > 30) {
      mouse.lastWaveTime = now;
      const cx = rect.width / 2;
      const cy = rect.height / 2 + 15;
      const pitch = 0.52;
      const cosP = Math.cos(pitch);

      const marginX = 40;
      const marginY = 35;
      const cellW = (rect.width - marginX * 2) / (cols - 1);
      const cellH = ((rect.height - marginY * 2) / (rows - 1)) * 0.75;

      const relX = mouseX - cx;
      const relY = (mouseY - cy) / cosP;

      const c = Math.max(1, Math.min(cols - 2, Math.round(relX / cellW + (cols - 1) / 2)));
      const r = Math.max(1, Math.min(rows - 2, Math.round(relY / cellH + (rows - 1) / 2)));

      // Smooth gentler power scaled by cursorInfluence
      const power = Math.min(180, (12 + distMoved * 3.5) * cursorInfluence);
      injectWave(c, r, 2.2, power);

      mouse.prevX = mouseX;
      mouse.prevY = mouseY;
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[580px] lg:h-[660px] rounded-2xl overflow-hidden select-none border border-white/[0.08] bg-[#0b0c0e] shadow-[0_20px_50px_rgba(0,0,0,0.6)] cursor-crosshair"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseEnter={() => {
          mouseRef.current.isInside = true;
        }}
        onMouseLeave={() => {
          mouseRef.current.isInside = false;
        }}
        className="w-full h-full block"
      />

      <div className="absolute top-4 left-5 pointer-events-none flex items-center gap-2 text-xs text-slate-400 font-mono tracking-tight">
        <span className="text-white font-medium">ХВИЛЬОВА МАТРИЦЯ</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>ОПТИЧНЕ РІДКЕ СКЛО BK7</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span className="tabular-nums">ЧУТЛИВІСТЬ: {cursorInfluence.toFixed(2)}x</span>
      </div>

      <div className="absolute bottom-4 left-5 pointer-events-none text-xs text-slate-400 font-mono flex items-center gap-3">
        <span>Проводьте курсором для створення кілець хвиль</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>Клікніть для краплі-імпульсу</span>
      </div>
    </div>
  );
};
