/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Point3D } from '../types/neural';
import { neuralAudio } from '../utils/audio';

interface HypercubeCanvasProps {
  latticeDim?: number; // 4 => 4x4x4 = 64 nodes
  rotSpeed: number;
  glassFacetOpacity: number;
  onStatsUpdate?: (stats: { nodes: number; connections: number; activeFirings: number }) => void;
}

export const HypercubeCanvas: React.FC<HypercubeCanvasProps> = ({
  latticeDim = 4,
  rotSpeed,
  glassFacetOpacity,
  onStatsUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const pointsRef = useRef<Point3D[]>([]);
  const anglesRef = useRef<{ ax: number; ay: number; az: number }>({ ax: 0.4, ay: 0.6, az: 0.1 });
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mousePosRef = useRef<{ x: number; y: number; isInside: boolean }>({ x: -999, y: -999, isInside: false });
  const pulses3DRef = useRef<{ from: Point3D; to: Point3D; t: number; speed: number }[]>([]);

  // Build 3D lattice points
  const buildLattice = useCallback(() => {
    const dim = latticeDim;
    const spacing = 75;
    const offset = ((dim - 1) * spacing) / 2;
    const pts: Point3D[] = [];

    for (let x = 0; x < dim; x++) {
      for (let y = 0; y < dim; y++) {
        for (let z = 0; z < dim; z++) {
          const posX = x * spacing - offset;
          const posY = y * spacing - offset;
          const posZ = z * spacing - offset;

          pts.push({
            id: `p3d_${x}_${y}_${z}`,
            x: posX,
            y: posY,
            z: posZ,
            baseX: posX,
            baseY: posY,
            baseZ: posZ,
            voltage: Math.random() * 0.3,
            isFiring: false,
            refractory: 0,
          });
        }
      }
    }
    pointsRef.current = pts;
  }, [latticeDim]);

  useEffect(() => {
    buildLattice();
  }, [buildLattice]);

  // Trigger 3D pulse burst
  const triggerBurst = useCallback(() => {
    const pts = pointsRef.current;
    if (pts.length === 0) return;

    // Pick 4 random nodes to fire
    for (let i = 0; i < 6; i++) {
      const idx = Math.floor(Math.random() * pts.length);
      const p = pts[idx];
      p.voltage = 1.0;
      p.isFiring = true;
      p.refractory = 25;

      // Find nearby neighbors to send 3D pulse
      pts.forEach((other) => {
        const d = Math.hypot(other.baseX - p.baseX, other.baseY - p.baseY, other.baseZ - p.baseZ);
        if (d > 10 && d < 95 && Math.random() < 0.45) {
          pulses3DRef.current.push({
            from: p,
            to: other,
            t: 0,
            speed: 0.035 + Math.random() * 0.02,
          });
        }
      });
    }

    neuralAudio.playGlassClink();
  }, []);

  // Listen for global burst event
  useEffect(() => {
    const handleEvent = () => triggerBurst();
    window.addEventListener('trigger-hypercube-burst', handleEvent);
    return () => window.removeEventListener('trigger-hypercube-burst', handleEvent);
  }, [triggerBurst]);

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

      // Auto rotation if not dragging
      if (!isDraggingRef.current) {
        anglesRef.current.ay += 0.005 * rotSpeed;
        anglesRef.current.ax += 0.002 * rotSpeed;
      }

      const { ax, ay, az } = anglesRef.current;
      const cosX = Math.cos(ax), sinX = Math.sin(ax);
      const cosY = Math.cos(ay), sinY = Math.sin(ay);
      const cosZ = Math.cos(az), sinZ = Math.sin(az);

      const fov = 700;
      const cx = width / 2;
      const cy = height / 2;

      // 3D rotation projection helper
      const project3D = (x: number, y: number, z: number) => {
        // Rotate around Y
        let x1 = x * cosY - z * sinY;
        let z1 = x * sinY + z * cosY;

        // Rotate around X
        let y2 = y * cosX - z1 * sinX;
        let z2 = y * sinX + z1 * cosX;

        // Rotate around Z
        let x3 = x1 * cosZ - y2 * sinZ;
        let y3 = x1 * sinZ + y2 * cosZ;

        const depth = fov + z2;
        const scale = fov / Math.max(100, depth);

        return {
          px: cx + x3 * scale,
          py: cy + y3 * scale,
          pz: z2,
          scale,
        };
      };

      // 1. Draw Bounding Frosted Glass Cube Facets
      const cubeHalf = 135;
      const cubeCorners = [
        { x: -cubeHalf, y: -cubeHalf, z: -cubeHalf },
        { x: cubeHalf, y: -cubeHalf, z: -cubeHalf },
        { x: cubeHalf, y: cubeHalf, z: -cubeHalf },
        { x: -cubeHalf, y: cubeHalf, z: -cubeHalf },
        { x: -cubeHalf, y: -cubeHalf, z: cubeHalf },
        { x: cubeHalf, y: -cubeHalf, z: cubeHalf },
        { x: cubeHalf, y: cubeHalf, z: cubeHalf },
        { x: -cubeHalf, y: cubeHalf, z: cubeHalf },
      ];

      const projCorners = cubeCorners.map((c) => project3D(c.x, c.y, c.z));

      // Draw Cube Glass Edges
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7],
      ];

      ctx.lineWidth = 1.2;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 * glassFacetOpacity})`;
      edges.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.moveTo(projCorners[i].px, projCorners[i].py);
        ctx.lineTo(projCorners[j].px, projCorners[j].py);
        ctx.stroke();
      });

      // Semi-transparent frosted facets fill
      const faces = [
        [0, 1, 2, 3], // front
        [4, 5, 6, 7], // back
        [0, 1, 5, 4], // top
        [2, 3, 7, 6], // bottom
      ];

      faces.forEach((face) => {
        ctx.beginPath();
        ctx.moveTo(projCorners[face[0]].px, projCorners[face[0]].py);
        for (let i = 1; i < face.length; i++) {
          ctx.lineTo(projCorners[face[i]].px, projCorners[face[i]].py);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(255, 255, 255, ${0.015 * glassFacetOpacity})`;
        ctx.fill();
      });

      // 2. Project Points and Depth Sort
      const pts = pointsRef.current;
      const projPoints = pts.map((p) => {
        // Decay voltage
        if (p.refractory > 0) {
          p.refractory -= 1;
        } else {
          p.voltage *= 0.96;
        }
        if (p.voltage < 0.2) p.isFiring = false;

        const proj = project3D(p.baseX, p.baseY, p.baseZ);
        return {
          point: p,
          ...proj,
        };
      });

      projPoints.sort((a, b) => b.pz - a.pz); // Back-to-front rendering

      // 3. Draw Synaptic Lines between adjacent 3D points
      let connectionCount = 0;
      for (let i = 0; i < projPoints.length; i++) {
        const p1 = projPoints[i];
        for (let j = i + 1; j < projPoints.length; j++) {
          const p2 = projPoints[j];
          const dist3D = Math.hypot(
            p1.point.baseX - p2.point.baseX,
            p1.point.baseY - p2.point.baseY,
            p1.point.baseZ - p2.point.baseZ
          );

          if (dist3D < 82) {
            connectionCount++;
            const combinedV = (p1.point.voltage + p2.point.voltage) * 0.5;
            const alpha = Math.min(0.85, 0.08 + combinedV * 0.7);

            ctx.lineWidth = 0.8 * p1.scale;
            ctx.strokeStyle = combinedV > 0.3 ? `rgba(255, 255, 255, ${alpha})` : `rgba(148, 163, 184, ${alpha})`;

            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.stroke();
          }
        }
      }

      // 4. Draw Traveling 3D Pulses
      const activePulses: typeof pulses3DRef.current = [];
      pulses3DRef.current.forEach((pulse) => {
        pulse.t += pulse.speed;
        if (pulse.t < 1.0) {
          activePulses.push(pulse);
          const currX = pulse.from.baseX + (pulse.to.baseX - pulse.from.baseX) * pulse.t;
          const currY = pulse.from.baseY + (pulse.to.baseY - pulse.from.baseY) * pulse.t;
          const currZ = pulse.from.baseZ + (pulse.to.baseZ - pulse.from.baseZ) * pulse.t;

          const proj = project3D(currX, currY, currZ);
          const pGrad = ctx.createRadialGradient(proj.px, proj.py, 0, proj.px, proj.py, 6 * proj.scale);
          pGrad.addColorStop(0, '#ffffff');
          pGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = pGrad;
          ctx.beginPath();
          ctx.arc(proj.px, proj.py, 5 * proj.scale, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      pulses3DRef.current = activePulses;

      // 5. Draw 3D Nodes
      let firingCount = 0;
      projPoints.forEach((pt) => {
        const radius = (2.4 + pt.point.voltage * 3.0) * pt.scale;
        if (pt.point.isFiring) firingCount++;

        ctx.beginPath();
        ctx.arc(pt.px, pt.py, radius, 0, Math.PI * 2);

        if (pt.point.isFiring) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
          ctx.shadowBlur = 8;
        } else {
          const depthAlpha = Math.min(1.0, Math.max(0.2, (pt.pz + cubeHalf * 2) / (cubeHalf * 4)));
          ctx.fillStyle = `rgba(226, 232, 240, ${depthAlpha})`;
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 6. Dynamic Cursor Filaments to 3D Nodes
      const mouse = mousePosRef.current;
      if (mouse.isInside) {
        projPoints.slice(0, 8).forEach((pt) => {
          const d2D = Math.hypot(mouse.x - pt.px, mouse.y - pt.py);
          if (d2D < 160) {
            const alpha = (1 - d2D / 160) * 0.7;
            ctx.lineWidth = (1 - d2D / 160) * 1.5;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(pt.px, pt.py);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        });

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stats notify
      const now = performance.now();
      if (now - statsTime > 400 && onStatsUpdate) {
        statsTime = now;
        onStatsUpdate({
          nodes: pts.length,
          connections: connectionCount,
          activeFirings: firingCount,
        });
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [latticeDim, rotSpeed, glassFacetOpacity, onStatsUpdate]);

  // Mouse Drag to Orbit 3D Box
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      isInside: true,
    };

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      anglesRef.current.ay += dx * 0.008;
      anglesRef.current.ax += dy * 0.008;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = () => {
    triggerBurst();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[580px] lg:h-[660px] rounded-2xl overflow-hidden select-none border border-white/[0.08] bg-[#0b0c0e] shadow-[0_20px_50px_rgba(0,0,0,0.6)] cursor-grab active:cursor-grabbing"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => {
          mousePosRef.current.isInside = true;
        }}
        onMouseLeave={() => {
          mousePosRef.current.isInside = false;
          isDraggingRef.current = false;
        }}
        onClick={handleClick}
        className="w-full h-full block"
      />

      <div className="absolute top-4 left-5 pointer-events-none flex items-center gap-2 text-xs text-slate-400 font-mono tracking-tight">
        <span className="text-white font-medium">3D КРИСТАЛІЧНИЙ ГІПЕРКУБ</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>СКЛЯНА 3D ПРИЗМА</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span className="tabular-nums">{latticeDim * latticeDim * latticeDim} 3D ВУЗЛІВ</span>
      </div>

      <div className="absolute bottom-4 left-5 pointer-events-none text-xs text-slate-400 font-mono flex items-center gap-3">
        <span>Затисніть і тягніть для 3D обертання</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>Клікніть для генерації об'ємного розряду</span>
      </div>
    </div>
  );
};
