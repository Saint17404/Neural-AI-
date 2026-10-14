/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ParticleNode, MouseInteraction, ConstellationStats } from '../types/neural';
import { neuralAudio } from '../utils/audio';

interface ParticleConstellationCanvasProps {
  particleCount: number;
  maxDistance: number;
  cursorRadius: number;
  speed: number;
  mouseMode: MouseInteraction;
  glassLensEnabled: boolean;
  onStatsUpdate?: (stats: ConstellationStats) => void;
}

export const ParticleConstellationCanvas: React.FC<ParticleConstellationCanvasProps> = ({
  particleCount,
  maxDistance,
  cursorRadius,
  speed,
  mouseMode,
  glassLensEnabled,
  onStatsUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const particlesRef = useRef<ParticleNode[]>([]);
  const pulsesRef = useRef<{
    p1: { x: number; y: number };
    p2: { x: number; y: number };
    progress: number;
    speed: number;
  }[]>([]);
  const shockwavesRef = useRef<{ x: number; y: number; radius: number; maxRadius: number; alpha: number }[]>([]);

  const mousePosRef = useRef<{ x: number; y: number; isInside: boolean }>({
    x: -999,
    y: -999,
    isInside: false,
  });

  // Initialize or re-sample particles
  const initParticles = useCallback(() => {
    const container = containerRef.current;
    const width = container?.clientWidth || 900;
    const height = container?.clientHeight || 600;

    const current = particlesRef.current;
    const newParticles: ParticleNode[] = [];

    for (let i = 0; i < particleCount; i++) {
      if (i < current.length) {
        newParticles.push(current[i]);
      } else {
        const angle = Math.random() * Math.PI * 2;
        const velMag = 0.4 + Math.random() * 0.7;
        newParticles.push({
          id: `p_${i}_${Math.random().toString(36).substring(2, 7)}`,
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * velMag,
          vy: Math.sin(angle) * velMag,
          radius: 2.2 + Math.random() * 2.2,
          baseRadius: 2.2 + Math.random() * 2.2,
          charge: Math.random() * 0.3,
          pulseIntensity: 0,
          mass: 1.0 + Math.random() * 0.5,
        });
      }
    }

    particlesRef.current = newParticles.slice(0, particleCount);
  }, [particleCount]);

  useEffect(() => {
    initParticles();
    const handleResize = () => initParticles();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initParticles]);

  // Trigger shockwave at coordinates
  const triggerShockwave = useCallback((x: number, y: number) => {
    shockwavesRef.current.push({
      x,
      y,
      radius: 4,
      maxRadius: 240,
      alpha: 1.0,
    });

    neuralAudio.playGlassClink();

    // Excite particles and spawn travelling pulses
    const particles = particlesRef.current;
    particles.forEach((p) => {
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 220) {
        p.charge = 1.0;
        p.pulseIntensity = 1.0;
        // Radial kick
        const factor = (1 - dist / 220) * 4;
        p.vx += (dx / Math.max(1, dist)) * factor;
        p.vy += (dy / Math.max(1, dist)) * factor;
      }
    });

    // Spawn pulses along existing links
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      const dToOrigin = Math.hypot(p1.x - x, p1.y - y);
      if (dToOrigin > 200) continue;

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (dist < 140 && Math.random() < 0.35) {
          pulsesRef.current.push({
            p1: { x: p1.x, y: p1.y },
            p2: { x: p2.x, y: p2.y },
            progress: 0,
            speed: 0.04 + Math.random() * 0.03,
          });
        }
      }
    }
  }, []);

  // Expose trigger shockwave via window event
  useEffect(() => {
    const handleTriggerEvent = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      triggerShockwave(cx, cy);
    };
    window.addEventListener('trigger-constellation-burst', handleTriggerEvent);
    return () => window.removeEventListener('trigger-constellation-burst', handleTriggerEvent);
  }, [triggerShockwave]);

  // Main Animation Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastStatsTime = performance.now();

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

      // 1. Dark obsidian canvas background
      ctx.fillStyle = '#0b0c0e';
      ctx.fillRect(0, 0, width, height);

      // Subtle architectural grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      const gridSize = 48;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Underlying Frosted Glass Geometric Planes (Скляні пластини на фоні)
      const glassSlabs = [
        { x: width * 0.08, y: height * 0.12, w: width * 0.38, h: height * 0.76, label: 'СУБСТРАТ 01 · СВІТЛОВОД' },
        { x: width * 0.54, y: height * 0.12, w: width * 0.38, h: height * 0.76, label: 'СУБСТРАТ 02 · МАТРИЦЯ' },
      ];

      glassSlabs.forEach((slab) => {
        // Frosted fill
        const slabGrad = ctx.createLinearGradient(slab.x, slab.y, slab.x + slab.w, slab.y + slab.h);
        slabGrad.addColorStop(0, 'rgba(255, 255, 255, 0.025)');
        slabGrad.addColorStop(0.5, 'rgba(180, 200, 220, 0.015)');
        slabGrad.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
        ctx.fillStyle = slabGrad;
        ctx.fillRect(slab.x, slab.y, slab.w, slab.h);

        // Specular highlight top rim
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(slab.x, slab.y, slab.w, slab.h);

        // Corner registration brackets
        const bLen = 8;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.moveTo(slab.x + 4, slab.y + 4 + bLen);
        ctx.lineTo(slab.x + 4, slab.y + 4);
        ctx.lineTo(slab.x + 4 + bLen, slab.y + 4);
        ctx.stroke();

        ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
        ctx.font = '500 9px var(--font-mono)';
        ctx.fillText(slab.label, slab.x + 10, slab.y + 18);
      });

      // 3. Dynamic Cursor Frosted Glass Lens (Лінза заломлення під курсором)
      const mouse = mousePosRef.current;
      if (mouse.isInside && glassLensEnabled) {
        const lensGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, cursorRadius);
        lensGrad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
        lensGrad.addColorStop(0.6, 'rgba(200, 220, 245, 0.02)');
        lensGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = lensGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, cursorRadius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle specular boundary ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, cursorRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 4. Update Particle Physics
      const particles = particlesRef.current;
      particles.forEach((p) => {
        // Apply velocity with speed factor
        p.x += p.vx * speed;
        p.y += p.vy * speed;

        // Damping and drag
        p.vx *= 0.992;
        p.vy *= 0.992;

        // Keep baseline minimum drift
        const vMag = Math.hypot(p.vx, p.vy);
        if (vMag < 0.25) {
          const angle = Math.random() * Math.PI * 2;
          p.vx += Math.cos(angle) * 0.1;
          p.vy += Math.sin(angle) * 0.1;
        }

        // Boundary bounce / reflection
        const padding = 10;
        if (p.x < padding) {
          p.x = padding;
          p.vx = Math.abs(p.vx);
        } else if (p.x > width - padding) {
          p.x = width - padding;
          p.vx = -Math.abs(p.vx);
        }

        if (p.y < padding) {
          p.y = padding;
          p.vy = Math.abs(p.vy);
        } else if (p.y > height - padding) {
          p.y = height - padding;
          p.vy = -Math.abs(p.vy);
        }

        // Mouse interaction force
        if (mouse.isInside) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < cursorRadius && dist > 1) {
            const force = (1 - dist / cursorRadius) * 0.8;
            if (mouseMode === 'repel') {
              p.vx += (dx / dist) * force * 1.5;
              p.vy += (dy / dist) * force * 1.5;
            } else if (mouseMode === 'attract') {
              p.vx -= (dx / dist) * force * 1.2;
              p.vy -= (dy / dist) * force * 1.2;
            }
            // Increase charge when near cursor
            p.charge = Math.min(1.0, p.charge + 0.08);
          }
        }

        // Decay charges
        p.charge *= 0.96;
        p.pulseIntensity *= 0.94;
      });

      // 5. Render Inter-Particle Connections (Лінії зв’язку між точками)
      let activeConnectionsCount = 0;

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxDistance) {
            activeConnectionsCount++;
            const proximityNorm = 1 - dist / maxDistance;
            const combinedCharge = (p1.charge + p2.charge) * 0.5;

            // Liquid silver gradient
            const alpha = 0.08 + proximityNorm * 0.35 + combinedCharge * 0.45;
            const strokeWidth = 0.6 + proximityNorm * 1.2 + combinedCharge * 1.0;

            ctx.lineWidth = strokeWidth;
            if (combinedCharge > 0.3) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            } else {
              ctx.strokeStyle = `rgba(203, 213, 225, ${alpha})`;
            }

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // 6. Render Dynamic Connections to the Cursor (Лінії до курсора)
      let cursorConnectedCount = 0;

      if (mouse.isInside) {
        particles.forEach((p) => {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy);

          if (dist < cursorRadius) {
            cursorConnectedCount++;
            const proximityNorm = 1 - dist / cursorRadius;

            // Laser filament to mouse
            const alpha = 0.2 + proximityNorm * 0.65;
            const strokeWidth = 0.8 + proximityNorm * 1.8;

            ctx.lineWidth = strokeWidth;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();

            // Tiny pulse node along the mouse filament
            const t = (performance.now() * 0.002) % 1;
            const sparkX = p.x + dx * t;
            const sparkY = p.y + dy * t;

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Cursor focal core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 10, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 7. Render Travelling Signal Pulses
      const activePulses: typeof pulsesRef.current = [];
      pulsesRef.current.forEach((pulse) => {
        pulse.progress += pulse.speed;
        if (pulse.progress < 1.0) {
          activePulses.push(pulse);
          const px = pulse.p1.x + (pulse.p2.x - pulse.p1.x) * pulse.progress;
          const py = pulse.p1.y + (pulse.p2.y - pulse.p1.y) * pulse.progress;

          const pGrad = ctx.createRadialGradient(px, py, 0, px, py, 6);
          pGrad.addColorStop(0, '#ffffff');
          pGrad.addColorStop(0.5, 'rgba(226, 232, 240, 0.8)');
          pGrad.addColorStop(1, 'rgba(226, 232, 240, 0)');
          ctx.fillStyle = pGrad;
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      pulsesRef.current = activePulses;

      // 8. Render Shockwaves
      shockwavesRef.current.forEach((sw) => {
        sw.radius += 6.5;
        sw.alpha *= 0.94;

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${sw.alpha * 0.7})`;
        ctx.lineWidth = 2.0;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius * 0.8, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(203, 213, 225, ${sw.alpha * 0.3})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });
      shockwavesRef.current = shockwavesRef.current.filter((sw) => sw.alpha > 0.02);

      // 9. Render Particle Nodes (Крапки)
      particles.forEach((p) => {
        const radius = p.baseRadius + p.charge * 2.5 + p.pulseIntensity * 3;

        // Glow ring if energized
        if (p.charge > 0.2 || p.pulseIntensity > 0.2) {
          const glowGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 3);
          glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
          glowGrad.addColorStop(0.5, 'rgba(203, 213, 225, 0.3)');
          glowGrad.addColorStop(1, 'rgba(203, 213, 225, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Particle Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        if (p.charge > 0.2) {
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
        }
        ctx.fill();

        // Titanium Hairline Ring
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.stroke();
      });

      // Periodic stats notification
      const now = performance.now();
      if (now - lastStatsTime > 400 && onStatsUpdate) {
        lastStatsTime = now;
        onStatsUpdate({
          activeParticles: particles.length,
          activeConnections: activeConnectionsCount,
          cursorDistance: cursorRadius,
          cursorConnectedCount,
        });
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    maxDistance,
    cursorRadius,
    speed,
    mouseMode,
    glassLensEnabled,
    onStatsUpdate,
  ]);

  // Pointer Listeners
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      isInside: true,
    };
  };

  const handleMouseEnter = () => {
    mousePosRef.current.isInside = true;
  };

  const handleMouseLeave = () => {
    mousePosRef.current.isInside = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    triggerShockwave(x, y);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[580px] lg:h-[660px] rounded-2xl overflow-hidden select-none border border-white/[0.08] bg-[#0b0c0e] shadow-[0_20px_50px_rgba(0,0,0,0.6)] cursor-crosshair"
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="w-full h-full block"
      />

      {/* Surface Specifier Header Tag (Clean unboxed text, no pills) */}
      <div className="absolute top-4 left-5 pointer-events-none flex items-center gap-2 text-xs text-slate-400 font-mono tracking-tight">
        <span className="text-white font-medium">КОНСТЕЛЯЦІЯ ЧАСТИНОК</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>ПОВЕРХНЯ СКЛА</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span className="tabular-nums">{particleCount} ТОЧОК У РУСІ</span>
      </div>

      {/* Floating Bottom Instructions */}
      <div className="absolute bottom-4 left-5 pointer-events-none text-xs text-slate-400 font-mono flex items-center gap-3">
        <span>Рухайте курсор для зв’язку точок</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>Клікніть для генерації ударної хвилі</span>
      </div>
    </div>
  );
};
