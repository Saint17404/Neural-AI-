/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { neuralAudio } from '../utils/audio';

interface VortexCanvasProps {
  particleCount: number;
  vortexSpeed: number;
  attractorStrength: number;
  onStatsUpdate?: (stats: { particleCount: number; orbitalLinks: number; coreEnergy: number }) => void;
}

export const VortexCanvas: React.FC<VortexCanvasProps> = ({
  particleCount = 180,
  vortexSpeed = 1.0,
  attractorStrength = 1.0,
  onStatsUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const particlesRef = useRef<
    {
      angle: number;
      radius: number;
      speed: number;
      rSpeed: number;
      baseRadius: number;
      charge: number;
    }[]
  >([]);

  const mousePosRef = useRef<{ x: number; y: number; isInside: boolean }>({
    x: -999,
    y: -999,
    isInside: false,
  });

  const shockwavesRef = useRef<{ r: number; alpha: number }[]>([]);

  // Init orbital particles
  const initVortex = useCallback(() => {
    const pts = [];
    for (let i = 0; i < particleCount; i++) {
      const radius = 30 + Math.pow(Math.random(), 0.7) * 230;
      pts.push({
        angle: Math.random() * Math.PI * 2,
        radius,
        baseRadius: radius,
        speed: (0.008 + (1 / Math.max(20, radius)) * 0.4) * (Math.random() < 0.1 ? -1 : 1),
        rSpeed: (Math.random() * 2 - 1) * 0.15,
        charge: Math.random() * 0.3,
      });
    }
    particlesRef.current = pts;
  }, [particleCount]);

  useEffect(() => {
    initVortex();
  }, [initVortex]);

  const triggerVortexBurst = useCallback(() => {
    shockwavesRef.current.push({ r: 10, alpha: 1.0 });
    neuralAudio.playGlassClink();

    particlesRef.current.forEach((p) => {
      p.charge = 1.0;
      p.radius += (Math.random() * 2 - 1) * 40;
    });
  }, []);

  useEffect(() => {
    const handleEvent = () => triggerVortexBurst();
    window.addEventListener('trigger-vortex-burst', handleEvent);
    return () => window.removeEventListener('trigger-vortex-burst', handleEvent);
  }, [triggerVortexBurst]);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let statsTime = performance.now();

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

      // Deep obsidian canvas
      ctx.fillStyle = '#0b0c0e';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // 1. Frosted Glass Concentric Ring Plates (Скляні орбітальні кола)
      [70, 140, 210, 280].forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.03 + idx * 0.015})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 2. Central Optoelectronic Core Lens
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 75);
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
      coreGrad.addColorStop(0.7, 'rgba(180, 200, 230, 0.02)');
      coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 75, 0, Math.PI * 2);
      ctx.fill();

      // 3. Update & Project Orbital Particles
      const pts = particlesRef.current;
      const mouse = mousePosRef.current;

      const screenCoords: { x: number; y: number; charge: number }[] = [];

      pts.forEach((p) => {
        p.angle += p.speed * vortexSpeed;
        p.radius += p.rSpeed;

        // Radial bounds
        if (p.radius < 25) {
          p.radius = 25;
          p.rSpeed = Math.abs(p.rSpeed);
        } else if (p.radius > 260) {
          p.radius = 260;
          p.rSpeed = -Math.abs(p.rSpeed);
        }

        let px = cx + Math.cos(p.angle) * p.radius;
        let py = cy + Math.sin(p.angle) * p.radius;

        // Gravitational Mouse Attractor
        if (mouse.isInside) {
          const dx = mouse.x - px;
          const dy = mouse.y - py;
          const dist = Math.hypot(dx, dy);

          if (dist < 150) {
            const pull = (1 - dist / 150) * 0.25 * attractorStrength;
            px += dx * pull;
            py += dy * pull;
            p.charge = Math.min(1.0, p.charge + 0.06);
          }
        }

        p.charge *= 0.96;
        screenCoords.push({ x: px, y: py, charge: p.charge });
      });

      // 4. Draw Inter-Orbital Filament Links
      let orbitalLinks = 0;
      for (let i = 0; i < screenCoords.length; i++) {
        const p1 = screenCoords[i];
        for (let j = i + 1; j < screenCoords.length; j++) {
          const p2 = screenCoords[j];
          const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

          if (dist < 55) {
            orbitalLinks++;
            const alpha = (1 - dist / 55) * 0.45 + (p1.charge + p2.charge) * 0.25;
            ctx.lineWidth = 0.8;
            ctx.strokeStyle = `rgba(226, 232, 240, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // 5. Draw Cursor Connections
      if (mouse.isInside) {
        screenCoords.forEach((p) => {
          const dist = Math.hypot(mouse.x - p.x, mouse.y - p.y);
          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.75;
            ctx.lineWidth = (1 - dist / 140) * 1.5;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        });

        // Mouse beacon
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Draw Orbital Nodes
      screenCoords.forEach((p) => {
        const radius = 1.8 + p.charge * 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        if (p.charge > 0.3) {
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
        }
        ctx.fill();
      });

      // 7. Shockwaves
      shockwavesRef.current.forEach((sw) => {
        sw.r += 6;
        sw.alpha *= 0.94;
        ctx.beginPath();
        ctx.arc(cx, cy, sw.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${sw.alpha * 0.6})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
      shockwavesRef.current = shockwavesRef.current.filter((sw) => sw.alpha > 0.02);

      // Stats notify
      const now = performance.now();
      if (now - statsTime > 400 && onStatsUpdate) {
        statsTime = now;
        onStatsUpdate({
          particleCount: pts.length,
          orbitalLinks,
          coreEnergy: 0.82,
        });
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [vortexSpeed, attractorStrength, onStatsUpdate]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mousePosRef.current.x = e.clientX - rect.left;
    mousePosRef.current.y = e.clientY - rect.top;
    mousePosRef.current.isInside = true;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[580px] lg:h-[660px] rounded-2xl overflow-hidden select-none border border-white/[0.08] bg-[#0b0c0e] shadow-[0_20px_50px_rgba(0,0,0,0.6)] cursor-crosshair"
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => {
          mousePosRef.current.isInside = true;
        }}
        onMouseLeave={() => {
          mousePosRef.current.isInside = false;
        }}
        onClick={triggerVortexBurst}
        className="w-full h-full block"
      />

      <div className="absolute top-4 left-5 pointer-events-none flex items-center gap-2 text-xs text-slate-400 font-mono tracking-tight">
        <span className="text-white font-medium">СИНАПТИЧНИЙ ВИХІР</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>ОРБІТАЛЬНИЙ СКЛЯНИЙ ДИСК</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span className="tabular-nums">{particleCount} ЧАСТИНОК</span>
      </div>

      <div className="absolute bottom-4 left-5 pointer-events-none text-xs text-slate-400 font-mono flex items-center gap-3">
        <span>Рухайте курсор як гравітаційний атрактор</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>Клік генерує орбітальний імпульс</span>
      </div>
    </div>
  );
};
