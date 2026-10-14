/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Neuron, Synapse, SignalPacket, GlassPlate, ViewPerspective, ActivationFunction } from '../types/neural';
import { activate, clamp, generateWeight } from '../utils/math';
import { neuralAudio } from '../utils/audio';

interface NeuralGlassCanvasProps {
  layerSizes: number[];
  activationFn: ActivationFunction;
  simulationSpeed: number;
  pulseRate: number;
  learningRate: number;
  glassOpacity: number;
  perspective: ViewPerspective;
  isPaused: boolean;
  selectedNeuronId: string | null;
  onSelectNeuron: (neuron: Neuron | null) => void;
  onStatsUpdate: (stats: {
    totalNeurons: number;
    totalSynapses: number;
    activeSignals: number;
    firingRateHz: number;
    averageVoltage: number;
    networkEntropy: number;
  }) => void;
}

export const NeuralGlassCanvas: React.FC<NeuralGlassCanvasProps> = ({
  layerSizes,
  activationFn,
  simulationSpeed,
  pulseRate,
  glassOpacity,
  perspective,
  isPaused,
  selectedNeuronId,
  onSelectNeuron,
  onStatsUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Simulation persistent refs
  const neuronsRef = useRef<Neuron[]>([]);
  const synapsesRef = useRef<Synapse[]>([]);
  const signalsRef = useRef<SignalPacket[]>([]);
  const glassPlatesRef = useRef<GlassPlate[]>([]);
  const rippleWavesRef = useRef<{ x: number; y: number; radius: number; maxRadius: number; alpha: number }[]>([]);

  // Interaction tracking
  const hoveredNeuronRef = useRef<Neuron | null>(null);
  const draggingNeuronRef = useRef<Neuron | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mousePosRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });
  const view3dAngleRef = useRef<{ pitch: number; yaw: number }>({ pitch: 0.25, yaw: 0.12 });
  const isOrbitingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Telemetry trackers
  const fireCountInSecRef = useRef<number>(0);
  const lastSecCheckRef = useRef<number>(performance.now());
  const currentFiringRateRef = useRef<number>(0);
  const autonomicTimerRef = useRef<number>(0);

  // Robust network topology builder
  const buildNetwork = useCallback(() => {
    const container = containerRef.current;
    const rect = container?.getBoundingClientRect();
    const width = Math.max(800, rect?.width || container?.clientWidth || 900);
    const height = Math.max(520, rect?.height || container?.clientHeight || 620);

    const newNeurons: Neuron[] = [];
    const newSynapses: Synapse[] = [];
    const newPlates: GlassPlate[] = [];

    const numLayers = layerSizes.length;
    const paddingX = Math.max(80, width * 0.11);
    const availableWidth = width - paddingX * 2;
    const layerSpacing = numLayers > 1 ? availableWidth / (numLayers - 1) : availableWidth;

    const layerNames = [
      'Вхідний сенсорний шар',
      'Латентний шар α',
      'Латентний шар β',
      'Інтеграційний шар',
      'Вихідний вектор дій',
    ];

    layerSizes.forEach((nodeCount, lIdx) => {
      const layerX = paddingX + lIdx * layerSpacing;
      const isInput = lIdx === 0;
      const isOutput = lIdx === numLayers - 1;

      // Glass plate bounds
      const plateWidth = Math.min(130, layerSpacing * 0.72);
      const plateHeight = Math.min(height * 0.86, Math.max(nodeCount * 65 + 110, 320));
      const plateY = height / 2 - plateHeight / 2;

      newPlates.push({
        layerIndex: lIdx,
        name: layerNames[lIdx] || `Прихований шар ${lIdx}`,
        x: layerX - plateWidth / 2,
        y: plateY,
        width: plateWidth,
        height: plateHeight,
        glow: 0.15,
        depthZ: (lIdx - (numLayers - 1) / 2) * 85,
      });

      // Position neurons in this layer
      const spacingY = plateHeight / (nodeCount + 1);
      for (let nIdx = 0; nIdx < nodeCount; nIdx++) {
        const neuronY = plateY + (nIdx + 1) * spacingY;
        const neuronId = `n_${lIdx}_${nIdx}`;
        const prefix = isInput ? 'x' : isOutput ? 'y' : `h${lIdx}`;

        newNeurons.push({
          id: neuronId,
          layerIndex: lIdx,
          nodeIndex: nIdx,
          label: `${prefix}${nIdx + 1}`,
          x: layerX,
          y: neuronY,
          targetX: layerX,
          targetY: neuronY,
          radius: isInput || isOutput ? 17 : 15,
          voltage: Math.random() * 0.25,
          restingVoltage: 0.08,
          threshold: 0.48, // Responsive threshold for cascading waves
          bias: (Math.random() * 2 - 1) * 0.2,
          lastFired: 0,
          isFiring: false,
          refractoryRemaining: 0,
          isInput,
          isOutput,
        });
      }
    });

    // Synapses between adjacent layers
    for (let lIdx = 0; lIdx < numLayers - 1; lIdx++) {
      const currentLayerNodes = newNeurons.filter((n) => n.layerIndex === lIdx);
      const nextLayerNodes = newNeurons.filter((n) => n.layerIndex === lIdx + 1);

      currentLayerNodes.forEach((source) => {
        nextLayerNodes.forEach((target) => {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const length = Math.sqrt(dx * dx + dy * dy);

          newSynapses.push({
            id: `s_${source.id}_${target.id}`,
            sourceId: source.id,
            targetId: target.id,
            weight: generateWeight(currentLayerNodes.length, 'he'),
            length,
            activity: 0,
          });
        });
      });
    }

    neuronsRef.current = newNeurons;
    synapsesRef.current = newSynapses;
    glassPlatesRef.current = newPlates;
    signalsRef.current = [];
  }, [layerSizes]);

  // Initial and resize trigger
  useEffect(() => {
    buildNetwork();
    const handleResize = () => buildNetwork();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [buildNetwork]);

  // Fire a neuron and send action potentials down synapses
  const fireNeuron = useCallback(
    (neuron: Neuron, manualBoost = 0) => {
      neuron.voltage = 1.0;
      neuron.isFiring = true;
      neuron.lastFired = performance.now();
      neuron.refractoryRemaining = 16;
      fireCountInSecRef.current += 1;

      // Ripple on glass
      rippleWavesRef.current.push({
        x: neuron.x,
        y: neuron.y,
        radius: 4,
        maxRadius: 60,
        alpha: 0.85,
      });

      // Illuminate glass plate
      const plate = glassPlatesRef.current.find((p) => p.layerIndex === neuron.layerIndex);
      if (plate) {
        plate.glow = Math.min(1.0, plate.glow + 0.65);
      }

      // Audio feedback
      neuralAudio.playActionPotential(neuron.layerIndex, neuron.voltage);

      // Spawn signal packets to all connected synapses
      const outgoingSynapses = synapsesRef.current.filter((s) => s.sourceId === neuron.id);
      outgoingSynapses.forEach((syn) => {
        syn.activity = 1.0;
        signalsRef.current.push({
          id: `sig_${Math.random().toString(36).substring(2, 9)}`,
          synapseId: syn.id,
          sourceId: syn.sourceId,
          targetId: syn.targetId,
          progress: 0,
          speed: (0.025 + Math.random() * 0.008) * simulationSpeed,
          magnitude: Math.abs(syn.weight) * (1.0 + manualBoost),
        });
      });
    },
    [simulationSpeed]
  );

  // Manual Trigger from external click or button
  const triggerSensoryStimulus = useCallback(() => {
    const inputNeurons = neuronsRef.current.filter((n) => n.isInput);
    if (inputNeurons.length === 0) return;
    inputNeurons.forEach((n, idx) => {
      setTimeout(() => {
        fireNeuron(n, 0.5);
      }, idx * 70);
    });
  }, [fireNeuron]);

  // Window event trigger
  useEffect(() => {
    const handleTriggerEvent = () => triggerSensoryStimulus();
    window.addEventListener('trigger-neural-stimulus', handleTriggerEvent);
    return () => window.removeEventListener('trigger-neural-stimulus', handleTriggerEvent);
  }, [triggerSensoryStimulus]);

  // Auto-fire initial burst after mounting
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerSensoryStimulus();
    }, 250);
    return () => clearTimeout(timer);
  }, [triggerSensoryStimulus]);

  // Main Simulation Loop
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
      const width = Math.max(600, rect.width);
      const height = Math.max(450, rect.height);

      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Deep obsidian slate background
      ctx.fillStyle = '#0b0c0e';
      ctx.fillRect(0, 0, width, height);

      // Architectural grid
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

      // Track Firing Rate in Hz
      const now = performance.now();
      if (now - lastSecCheckRef.current >= 1000) {
        currentFiringRateRef.current = fireCountInSecRef.current;
        fireCountInSecRef.current = 0;
        lastSecCheckRef.current = now;

        const neurons = neuronsRef.current;
        const avgVolt = neurons.reduce((sum, n) => sum + n.voltage, 0) / Math.max(1, neurons.length);
        const voltProbs = neurons.map((n) => n.voltage);
        const entropy = voltProbs.reduce((acc, v) => (v > 0 ? acc - v * Math.log2(v + 1e-5) : acc), 0) / neurons.length;

        onStatsUpdate({
          totalNeurons: neurons.length,
          totalSynapses: synapsesRef.current.length,
          activeSignals: signalsRef.current.length,
          firingRateHz: currentFiringRateRef.current,
          averageVoltage: avgVolt,
          networkEntropy: Math.max(0, entropy),
        });
      }

      // Physics & Signal propagation
      if (!isPaused) {
        // Continuous autonomic pulse generator
        autonomicTimerRef.current += simulationSpeed;
        if (autonomicTimerRef.current > 75 / Math.max(0.2, pulseRate)) {
          autonomicTimerRef.current = 0;
          const inputNeurons = neuronsRef.current.filter((n) => n.isInput);
          if (inputNeurons.length > 0) {
            const randomInput = inputNeurons[Math.floor(Math.random() * inputNeurons.length)];
            fireNeuron(randomInput);
          }
        }

        // Update signals along synapses
        const survivingSignals: SignalPacket[] = [];
        signalsRef.current.forEach((sig) => {
          sig.progress += sig.speed;
          if (sig.progress >= 1.0) {
            // Reached target neuron!
            const targetNeuron = neuronsRef.current.find((n) => n.id === sig.targetId);
            const syn = synapsesRef.current.find((s) => s.id === sig.synapseId);

            if (targetNeuron && syn) {
              // Excite target neuron
              const delta = Math.abs(activate(syn.weight * sig.magnitude, activationFn)) * 0.85 + 0.15;
              targetNeuron.voltage = clamp(targetNeuron.voltage + delta, 0, 1.2);

              // Downstream cascading firing!
              if (targetNeuron.voltage >= targetNeuron.threshold && targetNeuron.refractoryRemaining <= 0) {
                fireNeuron(targetNeuron);
              }
            }
          } else {
            survivingSignals.push(sig);
          }
        });
        signalsRef.current = survivingSignals;

        // Voltage decay toward resting potential
        neuronsRef.current.forEach((n) => {
          if (n.refractoryRemaining > 0) {
            n.refractoryRemaining -= 1;
            n.voltage *= 0.88;
          } else {
            n.voltage += (n.restingVoltage - n.voltage) * 0.035;
          }
          if (n.voltage < 0.15) {
            n.isFiring = false;
          }

          if (n !== draggingNeuronRef.current) {
            n.x += (n.targetX - n.x) * 0.12;
            n.y += (n.targetY - n.y) * 0.12;
          }
        });

        // Decay synaptic line brightness
        synapsesRef.current.forEach((s) => {
          s.activity *= 0.94;
        });

        // Decay glass glow & ripples
        glassPlatesRef.current.forEach((p) => {
          p.glow *= 0.94;
        });

        rippleWavesRef.current.forEach((w) => {
          w.radius += 2.5 * simulationSpeed;
          w.alpha *= 0.93;
        });
        rippleWavesRef.current = rippleWavesRef.current.filter((w) => w.alpha > 0.04);
      }

      // Projection Helper
      const project = (x: number, y: number, depthZ: number = 0) => {
        if (perspective === 'ortho') {
          return { px: x, py: y, scale: 1 };
        }
        const cx = width / 2;
        const cy = height / 2;
        const { pitch, yaw } = view3dAngleRef.current;

        const dx = x - cx;
        const dy = y - cy;
        const dz = depthZ;

        const rotX = dx * Math.cos(yaw) - dz * Math.sin(yaw);
        const rotZ = dx * Math.sin(yaw) + dz * Math.cos(yaw);

        const rotY = dy * Math.cos(pitch) - rotZ * Math.sin(pitch);
        const finalZ = dy * Math.sin(pitch) + rotZ * Math.cos(pitch);

        const fov = 900;
        const scale = fov / (fov + finalZ * 0.8);

        return {
          px: cx + rotX * scale,
          py: cy + rotY * scale,
          scale: Math.max(0.4, scale),
        };
      };

      // 1. Draw Frosted Glass Slabs (Скляні підкладки шарів)
      glassPlatesRef.current.forEach((plate) => {
        const p1 = project(plate.x, plate.y, plate.depthZ);
        const p2 = project(plate.x + plate.width, plate.y, plate.depthZ);
        const p3 = project(plate.x + plate.width, plate.y + plate.height, plate.depthZ);
        const p4 = project(plate.x, plate.y + plate.height, plate.depthZ);

        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.lineTo(p3.px, p3.py);
        ctx.lineTo(p4.px, p4.py);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(p1.px, p1.py, p4.px, p4.py);
        const baseOpacity = glassOpacity;
        const glowBoost = plate.glow * 0.18;
        gradient.addColorStop(0, `rgba(255, 255, 255, ${baseOpacity * 0.08 + glowBoost})`);
        gradient.addColorStop(0.5, `rgba(200, 215, 230, ${baseOpacity * 0.03 + glowBoost * 0.5})`);
        gradient.addColorStop(1, `rgba(148, 163, 184, ${baseOpacity * 0.05 + glowBoost})`);

        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.lineWidth = 1.2;
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.18 + plate.glow * 0.4})`;
        ctx.stroke();

        // Etched label
        ctx.save();
        ctx.fillStyle = `rgba(203, 213, 225, ${0.5 + plate.glow * 0.3})`;
        ctx.font = '500 10px var(--font-mono)';
        ctx.fillText(`ШАР 0${plate.layerIndex}`, p1.px + 10, p1.py + 18);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.font = '400 9px var(--font-mono)';
        ctx.fillText(plate.name.toUpperCase(), p1.px + 10, p1.py + 30);
        ctx.restore();
      });

      // 2. Draw Synapses
      synapsesRef.current.forEach((syn) => {
        const source = neuronsRef.current.find((n) => n.id === syn.sourceId);
        const target = neuronsRef.current.find((n) => n.id === syn.targetId);
        if (!source || !target) return;

        const sProj = project(source.x, source.y, (source.layerIndex - 1.5) * 85);
        const tProj = project(target.x, target.y, (target.layerIndex - 1.5) * 85);

        const isHovered =
          hoveredNeuronRef.current &&
          (hoveredNeuronRef.current.id === source.id || hoveredNeuronRef.current.id === target.id);
        const isSelected =
          selectedNeuronId && (selectedNeuronId === source.id || selectedNeuronId === target.id);

        const isExcitatory = syn.weight > 0;
        const absWeight = Math.abs(syn.weight);

        ctx.beginPath();
        ctx.moveTo(sProj.px, sProj.py);

        const midX = (sProj.px + tProj.px) / 2;
        ctx.bezierCurveTo(midX, sProj.py, midX, tProj.py, tProj.px, tProj.py);

        if (isHovered || isSelected) {
          ctx.lineWidth = 2.4 * sProj.scale;
          ctx.strokeStyle = isExcitatory ? 'rgba(255, 255, 255, 0.85)' : 'rgba(148, 163, 184, 0.85)';
        } else {
          ctx.lineWidth = Math.max(0.6, absWeight * 1.6 * sProj.scale);
          const alpha = 0.12 + absWeight * 0.25 + syn.activity * 0.45;
          ctx.strokeStyle = isExcitatory
            ? `rgba(226, 232, 240, ${alpha})`
            : `rgba(71, 85, 105, ${alpha * 0.9})`;
        }
        ctx.stroke();
      });

      // 3. Draw Traveling Action Potentials
      signalsRef.current.forEach((sig) => {
        const syn = synapsesRef.current.find((s) => s.id === sig.synapseId);
        if (!syn) return;
        const source = neuronsRef.current.find((n) => n.id === syn.sourceId);
        const target = neuronsRef.current.find((n) => n.id === syn.targetId);
        if (!source || !target) return;

        const sProj = project(source.x, source.y, (source.layerIndex - 1.5) * 85);
        const tProj = project(target.x, target.y, (target.layerIndex - 1.5) * 85);

        const t = sig.progress;
        const midX = (sProj.px + tProj.px) / 2;

        const u = 1 - t;
        const currX = u * u * u * sProj.px + 3 * u * u * t * midX + 3 * u * t * t * midX + t * t * t * tProj.px;
        const currY = u * u * u * sProj.py + 3 * u * u * t * sProj.py + 3 * u * t * t * tProj.py + t * t * t * tProj.py;

        const pulseSize = (3.0 + sig.magnitude * 2.5) * sProj.scale;
        const pulseGrad = ctx.createRadialGradient(currX, currY, 0, currX, currY, pulseSize * 3);
        pulseGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
        pulseGrad.addColorStop(0.4, 'rgba(226, 232, 240, 0.6)');
        pulseGrad.addColorStop(1, 'rgba(226, 232, 240, 0)');

        ctx.fillStyle = pulseGrad;
        ctx.beginPath();
        ctx.arc(currX, currY, pulseSize * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(currX, currY, pulseSize, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Draw Ripples
      rippleWavesRef.current.forEach((wave) => {
        const wProj = project(wave.x, wave.y);
        ctx.beginPath();
        ctx.arc(wProj.px, wProj.py, wave.radius * wProj.scale, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${wave.alpha * 0.45})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // 5. Draw Neurons
      neuronsRef.current.forEach((neuron) => {
        const nProj = project(neuron.x, neuron.y, (neuron.layerIndex - 1.5) * 85);
        const radius = neuron.radius * nProj.scale;
        const isHovered = hoveredNeuronRef.current?.id === neuron.id;
        const isSelected = selectedNeuronId === neuron.id;

        // Housing ring
        ctx.beginPath();
        ctx.arc(nProj.px, nProj.py, radius + 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 17, 21, 0.9)';
        ctx.fill();

        ctx.lineWidth = isSelected || isHovered ? 2.0 : 1.2;
        ctx.strokeStyle = isSelected
          ? '#ffffff'
          : isHovered
          ? 'rgba(255, 255, 255, 0.85)'
          : 'rgba(148, 163, 184, 0.4)';
        ctx.stroke();

        // Core fill
        const voltNorm = clamp(neuron.voltage, 0, 1);
        const coreRadius = Math.max(2, radius * (0.35 + voltNorm * 0.55));

        const coreGrad = ctx.createRadialGradient(nProj.px, nProj.py, 0, nProj.px, nProj.py, coreRadius);
        if (neuron.isFiring) {
          coreGrad.addColorStop(0, '#ffffff');
          coreGrad.addColorStop(0.5, 'rgba(241, 245, 249, 0.9)');
          coreGrad.addColorStop(1, 'rgba(203, 213, 225, 0.4)');
        } else {
          coreGrad.addColorStop(0, `rgba(241, 245, 249, ${0.4 + voltNorm * 0.6})`);
          coreGrad.addColorStop(0.7, `rgba(148, 163, 184, ${0.2 + voltNorm * 0.5})`);
          coreGrad.addColorStop(1, `rgba(71, 85, 105, 0.1)`);
        }

        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(nProj.px, nProj.py, coreRadius, 0, Math.PI * 2);
        ctx.fill();

        // Text label
        ctx.fillStyle = neuron.isFiring ? '#ffffff' : 'rgba(226, 232, 240, 0.85)';
        ctx.font = `600 ${Math.max(9, Math.floor(10 * nProj.scale))}px var(--font-mono)`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(neuron.label, nProj.px, nProj.py);
      });

      ctx.restore();
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    activationFn,
    simulationSpeed,
    pulseRate,
    glassOpacity,
    perspective,
    isPaused,
    selectedNeuronId,
    onStatsUpdate,
    fireNeuron,
  ]);

  // Pointer Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    const clickedNeuron = neuronsRef.current.find((n) => {
      const dx = n.x - mouseX;
      const dy = n.y - mouseY;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 8;
    });

    if (clickedNeuron) {
      draggingNeuronRef.current = clickedNeuron;
      dragOffsetRef.current = { x: mouseX - clickedNeuron.x, y: mouseY - clickedNeuron.y };
      onSelectNeuron(clickedNeuron);
      fireNeuron(clickedNeuron, 0.6);
      neuralAudio.playGlassClink();
    } else {
      onSelectNeuron(null);
      if (perspective === 'perspective3d') {
        isOrbitingRef.current = true;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    mousePosRef.current = { x: mouseX, y: mouseY };

    if (draggingNeuronRef.current) {
      draggingNeuronRef.current.x = mouseX - dragOffsetRef.current.x;
      draggingNeuronRef.current.y = mouseY - dragOffsetRef.current.y;
    } else if (isOrbitingRef.current && perspective === 'perspective3d') {
      const deltaX = e.clientX - lastMousePosRef.current.x;
      const deltaY = e.clientY - lastMousePosRef.current.y;
      view3dAngleRef.current.yaw += deltaX * 0.005;
      view3dAngleRef.current.pitch = clamp(
        view3dAngleRef.current.pitch + deltaY * 0.005,
        -0.45,
        0.55
      );
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    } else {
      const hovered = neuronsRef.current.find((n) => {
        const dx = n.x - mouseX;
        const dy = n.y - mouseY;
        return Math.sqrt(dx * dx + dy * dy) <= n.radius + 8;
      });
      hoveredNeuronRef.current = hovered || null;
      canvas.style.cursor = hovered ? 'pointer' : isOrbitingRef.current ? 'grabbing' : 'default';
    }
  };

  const handleMouseUp = () => {
    draggingNeuronRef.current = null;
    isOrbitingRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[580px] lg:h-[660px] rounded-2xl overflow-hidden select-none border border-white/[0.07] bg-[#0b0c0e] shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full block"
      />

      <div className="absolute top-4 left-5 pointer-events-none flex items-center gap-2 text-xs text-slate-400 font-mono tracking-tight">
        <span className="text-slate-200 font-medium">СИСТЕМА СУБСТРАТУ</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>БАГАТОШАРОВЕ СКЛО</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span className="tabular-nums">{layerSizes.join(' × ')} ВУЗЛИ</span>
      </div>

      <div className="absolute bottom-4 left-5 pointer-events-none text-xs text-slate-500 font-mono flex items-center gap-3">
        <span>Клік по нейрону — спалах імпульсу</span>
        <span aria-hidden="true" className="text-slate-700">·</span>
        <span>Перетягування — пружна топологія</span>
        {perspective === 'perspective3d' && (
          <>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>Затисніть для 3D орбіти</span>
          </>
        )}
      </div>
    </div>
  );
};
