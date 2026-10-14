/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SystemMode = 'constellation' | 'layered' | 'hypercube' | 'wavegrid' | 'vortex' | 'sculptor';

export type SculptorTool = 'draw' | 'connect' | 'erase' | 'torch';

export type GlassTheme = 'platinum' | 'obsidian' | 'titanium' | 'quartz';

export interface GlassThemeConfig {
  id: GlassTheme;
  name: string;
  desc: string;
  bg: string;
  plateFill: string;
  plateBorder: string;
  wireColor: string;
  sparkColor: string;
}

export type ActivationFunction = 'gelu' | 'relu' | 'leaky_relu' | 'tanh' | 'sigmoid';

export interface Neuron {
  id: string;
  layerIndex: number;
  nodeIndex: number;
  label: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  voltage: number;         // Current membrane potential [0, 1]
  restingVoltage: number;  // Default resting potential
  threshold: number;       // Firing threshold (usually 0.65)
  bias: number;            // Bias term [-1, 1]
  lastFired: number;       // Timestamp ms
  isFiring: boolean;
  refractoryRemaining: number; // Cooldown after firing
  isInput?: boolean;
  isOutput?: boolean;
}

export interface Synapse {
  id: string;
  sourceId: string;
  targetId: string;
  weight: number;          // [-1.5, 1.5]
  length: number;
  activity: number;        // [0, 1] for visual glow
}

export interface SignalPacket {
  id: string;
  synapseId: string;
  sourceId: string;
  targetId: string;
  progress: number;        // 0.0 to 1.0
  speed: number;           // step per frame
  magnitude: number;       // signal strength [0, 1]
  color?: string;
}

export interface GlassPlate {
  layerIndex: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  glow: number;            // 0.0 to 1.0 refractive illumination
  depthZ: number;          // For 3D perspective
}

export type ViewPerspective = 'ortho' | 'perspective3d' | 'focus';

export type StimulationPattern =
  | 'idle'
  | 'cascade'
  | 'harmonic'
  | 'storm'
  | 'pattern_classification'
  | 'burst';

export interface NetworkStats {
  totalNeurons: number;
  totalSynapses: number;
  activeSignals: number;
  firingRateHz: number;
  averageVoltage: number;
  networkEntropy: number;
}

export interface ParticleNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  charge: number;        // [0, 1]
  pulseIntensity: number; // [0, 1] for shockwave glow
  mass: number;
}

export type MouseInteraction = 'attract' | 'repel' | 'connect';

export interface ConstellationStats {
  activeParticles: number;
  activeConnections: number;
  cursorDistance: number;
  cursorConnectedCount: number;
}

// 3D Point for Hypercube
export interface Point3D {
  id: string;
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  voltage: number;
  isFiring: boolean;
  refractory: number;
}
