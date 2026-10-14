/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SculptorTool } from '../types/neural';
import { neuralAudio } from '../utils/audio';

interface CustomNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  voltage: number;
  isFiring: boolean;
  refractory: number;
}

interface CustomLink {
  id: string;
  fromId: string;
  toId: string;
  weight: number;
}

interface SculptorCanvasProps {
  tool: SculptorTool;
  autoConnectDist: number;
  driftSpeed: number;
  onStatsUpdate?: (stats: { nodes: number; links: number; pulses: number }) => void;
}

export const SculptorCanvas: React.FC<SculptorCanvasProps> = ({
  tool,
  autoConnectDist,
  driftSpeed,
  onStatsUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const nodesRef = useRef<CustomNode[]>([]);
  const linksRef = useRef<CustomLink[]>([]);
  const pulsesRef = useRef<{ from: CustomNode; to: CustomNode; t: number; speed: number }[]>([]);

  const isMouseDownRef = useRef<boolean>(false);
  const lastDrawPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const connectingSourceRef = useRef<CustomNode | null>(null);
  const mousePosRef = useRef<{ x: number; y: number; isInside: boolean }>({ x: -999, y: -999, isInside: false });

  // Spawn a node at coordinate
  const spawnNode = useCallback((x: number, y: number): CustomNode => {
    const angle = Math.random() * Math.PI * 2;
    const node: CustomNode = {
      id: `sn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x,
      y,
      vx: Math.cos(angle) * 0.25,
      vy: Math.sin(angle) * 0.25,
      radius: 3.5,
      voltage: 0.8,
      isFiring: true,
      refractory: 15,
    };

    nodesRef.current.push(node);

    // Auto-connect to closest existing nodes within autoConnectDist
    const currentNodes = nodesRef.current;
    currentNodes.forEach((other) => {
      if (other.id === node.id) return;
      const d = Math.hypot(other.x - node.x, other.y - node.y);
      if (d < autoConnectDist) {
        linksRef.current.push({
          id: `lk_${node.id}_${other.id}`,
          fromId: node.id,
          toId: other.id,
          weight: 0.7 + Math.random() * 0.6,
        });

        // Spawn pulse
        pulsesRef.current.push({
          from: node,
          to: other,
          t: 0,
          speed: 0.03 + Math.random() * 0.02,
        });
      }
    });

    neuralAudio.playGlassClink();
    return node;
  }, [autoConnectDist]);

  // Load geometric stamp templates
  const applyStamp = useCallback((stamp: 'dna' | 'fractal' | 'ring' | 'constellation') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    nodesRef.current = [];
    linksRef.current = [];
    pulsesRef.current = [];

    if (stamp === 'dna') {
      const steps = 22;
      const length = 460;
      const startX = cx - length / 2;
      for (let i = 0; i < steps; i++) {
        const x = startX + (i / steps) * length;
        const phase = (i / steps) * Math.PI * 4;
        const y1 = cy + Math.sin(phase) * 60;
        const y2 = cy + Math.sin(phase + Math.PI) * 60;

        const n1 = spawnNode(x, y1);
        const n2 = spawnNode(x, y2);

        // Cross rungs
        if (i % 2 === 0) {
          linksRef.current.push({
            id: `rung_${i}`,
            fromId: n1.id,
            toId: n2.id,
            weight: 1.0,
          });
        }
      }
    } else if (stamp === 'ring') {
      const count = 28;
      const r = 160;
      for (let i = 0; i < count; i++) {
        const theta = (i / count) * Math.PI * 2;
        const x = cx + Math.cos(theta) * r;
        const y = cy + Math.sin(theta) * r;
        spawnNode(x, y);
      }
    } else if (stamp === 'fractal') {
      // Hexagonal snowflake web
      spawnNode(cx, cy);
      const branches = 6;
      for (let b = 0; b < branches; b++) {
        const angle = (b / branches) * Math.PI * 2;
        for (let step = 1; step <= 4; step++) {
          const r = step * 48;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          spawnNode(x, y);

          // Sub-nodes
          const subAngle1 = angle + 0.35;
          const subAngle2 = angle - 0.35;
          spawnNode(cx + Math.cos(subAngle1) * (r * 0.85), cy + Math.sin(subAngle1) * (r * 0.85));
          spawnNode(cx + Math.cos(subAngle2) * (r * 0.85), cy + Math.sin(subAngle2) * (r * 0.85));
        }
      }
    } else if (stamp === 'constellation') {
      for (let i = 0; i < 45; i++) {
        const rx = cx + (Math.random() - 0.5) * 550;
        const ry = cy + (Math.random() - 0.5) * 360;
        spawnNode(rx, ry);
      }
    }
  }, [spawnNode]);

  // Window event listeners for stamp & clear
  useEffect(() => {
    const handleStampEvent = (e: CustomEvent) => {
      if (e.detail?.stamp) applyStamp(e.detail.stamp);
    };
    const handleClearEvent = () => {
      nodesRef.current = [];
      linksRef.current = [];
      pulsesRef.current = [];
    };
    window.addEventListener('apply-sculptor-stamp', handleStampEvent as EventListener);
    window.addEventListener('clear-sculptor-canvas', handleClearEvent);
    return () => {
      window.removeEventListener('apply-sculptor-stamp', handleStampEvent as EventListener);
      window.removeEventListener('clear-sculptor-canvas', handleClearEvent);
    };
  }, [applyStamp]);

  // Initial stamp
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nodesRef.current.length === 0) {
        applyStamp('constellation');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [applyStamp]);

  // Main Render Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let statsTimer = performance.now();

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

      // 1. Deep obsidian canvas
      ctx.fillStyle = '#0b0c0e';
      ctx.fillRect(0, 0, width, height);

      // Fine architectural millimeter grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      const gridSize = 40;
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

      // Frosted Glass Workbench Surface
      const margin = 20;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.018)';
      ctx.fillRect(margin, margin, width - margin * 2, height - margin * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

      // Update Node Physics
      const nodes = nodesRef.current;
      nodes.forEach((n) => {
        n.x += n.vx * driftSpeed;
        n.y += n.vy * driftSpeed;

        if (n.x < margin + 10 || n.x > width - margin - 10) n.vx *= -1;
        if (n.y < margin + 10 || n.y > height - margin - 10) n.vy *= -1;

        if (n.refractory > 0) {
          n.refractory -= 1;
        } else {
          n.voltage *= 0.96;
        }
        if (n.voltage < 0.2) n.isFiring = false;
      });

      // 2. Render Synaptic Links
      const links = linksRef.current;
      links.forEach((l) => {
        const from = nodes.find((n) => n.id === l.fromId);
        const to = nodes.find((n) => n.id === l.toId);
        if (!from || !to) return;

        const dist = Math.hypot(to.x - from.x, to.y - from.y);
        const combinedV = (from.voltage + to.voltage) * 0.5;
        const alpha = Math.min(0.9, 0.12 + combinedV * 0.6);

        ctx.lineWidth = 0.8 + combinedV * 1.2;
        ctx.strokeStyle = combinedV > 0.3 ? `rgba(255, 255, 255, ${alpha})` : `rgba(148, 163, 184, ${alpha})`;

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      });

      // 3. Render Traveling Pulses
      const activePulses: typeof pulsesRef.current = [];
      pulsesRef.current.forEach((pulse) => {
        pulse.t += pulse.speed;
        if (pulse.t < 1.0) {
          activePulses.push(pulse);
          const px = pulse.from.x + (pulse.to.x - pulse.from.x) * pulse.t;
          const py = pulse.from.y + (pulse.to.y - pulse.from.y) * pulse.t;

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      pulsesRef.current = activePulses;

      // 4. Render Nodes
      nodes.forEach((n) => {
        const r = n.radius + n.voltage * 2.5;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);

        if (n.isFiring) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.stroke();
      });

      // 5. Connecting Drag Preview Line
      const mouse = mousePosRef.current;
      if (connectingSourceRef.current && mouse.isInside) {
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.moveTo(connectingSourceRef.current.x, connectingSourceRef.current.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Cursor Beacon
      if (mouse.isInside) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, tool === 'erase' ? 8 : 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Stats notify
      const now = performance.now();
      if (now - statsTimer > 400 && onStatsUpdate) {
        statsTimer = now;
        onStatsUpdate({
          nodes: nodes.length,
          links: links.length,
          pulses: pulsesRef.current.length,
        });
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [driftSpeed, tool, onStatsUpdate]);

  // Pointer Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isMouseDownRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    lastDrawPosRef.current = { x, y };

    if (tool === 'draw') {
      spawnNode(x, y);
    } else if (tool === 'connect') {
      // Find node under click
      const hit = nodesRef.current.find((n) => Math.hypot(n.x - x, n.y - y) <= n.radius + 10);
      connectingSourceRef.current = hit || null;
    } else if (tool === 'erase') {
      // Erase node
      nodesRef.current = nodesRef.current.filter((n) => Math.hypot(n.x - x, n.y - y) > 20);
      linksRef.current = linksRef.current.filter((l) => {
        const fromExists = nodesRef.current.some((n) => n.id === l.fromId);
        const toExists = nodesRef.current.some((n) => n.id === l.toId);
        return fromExists && toExists;
      });
    } else if (tool === 'torch') {
      // Electrify nearby nodes
      nodesRef.current.forEach((n) => {
        if (Math.hypot(n.x - x, n.y - y) < 80) {
          n.voltage = 1.0;
          n.isFiring = true;
        }
      });
      neuralAudio.playGlassClink();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mousePosRef.current = { x, y, isInside: true };

    if (isMouseDownRef.current) {
      if (tool === 'draw') {
        const d = Math.hypot(x - lastDrawPosRef.current.x, y - lastDrawPosRef.current.y);
        if (d > 35) {
          spawnNode(x, y);
          lastDrawPosRef.current = { x, y };
        }
      } else if (tool === 'erase') {
        nodesRef.current = nodesRef.current.filter((n) => Math.hypot(n.x - x, n.y - y) > 22);
      } else if (tool === 'torch') {
        nodesRef.current.forEach((n) => {
          if (Math.hypot(n.x - x, n.y - y) < 70) {
            n.voltage = 1.0;
            n.isFiring = true;
          }
        });
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'connect' && connectingSourceRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const hit = nodesRef.current.find((n) => Math.hypot(n.x - x, n.y - y) <= n.radius + 12);
        if (hit && hit.id !== connectingSourceRef.current.id) {
          linksRef.current.push({
            id: `lk_${connectingSourceRef.current.id}_${hit.id}`,
            fromId: connectingSourceRef.current.id,
            toId: hit.id,
            weight: 1.0,
          });
          neuralAudio.playGlassClink();
        }
      }
    }
    connectingSourceRef.current = null;
    isMouseDownRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[580px] lg:h-[660px] rounded-2xl overflow-hidden select-none border border-white/[0.08] bg-[#0b0c0e] shadow-[0_20px_50px_rgba(0,0,0,0.6)] cursor-crosshair"
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
          isMouseDownRef.current = false;
        }}
        className="w-full h-full block"
      />

      <div className="absolute top-4 left-5 pointer-events-none flex items-center gap-2 text-xs text-slate-400 font-mono tracking-tight">
        <span className="text-white font-medium">НЕЙРО-СКУЛЬПТОР</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>ІНТЕРАКТИВНЕ МАЛЮВАННЯ ВУЗЛІВ</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>СКЛЯНИЙ ВЕРСТАТ</span>
      </div>

      <div className="absolute bottom-4 left-5 pointer-events-none text-xs text-slate-400 font-mono flex items-center gap-3">
        <span>Клікайте або проводьте для створення власних нейронів</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>Вузли оживають автоматично</span>
      </div>
    </div>
  );
};
