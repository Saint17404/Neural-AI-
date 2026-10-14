/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActivationFunction } from '../types/neural';

export function activate(x: number, fn: ActivationFunction): number {
  switch (fn) {
    case 'gelu':
      // Approximation of GELU: 0.5 * x * (1 + tanh(sqrt(2/pi) * (x + 0.044715 * x^3)))
      return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3))));
    case 'relu':
      return Math.max(0, x);
    case 'leaky_relu':
      return x > 0 ? x : 0.08 * x;
    case 'tanh':
      return Math.tanh(x);
    case 'sigmoid':
      return 1 / (1 + Math.exp(-x));
    default:
      return x;
  }
}

export function activateDerivative(x: number, fn: ActivationFunction): number {
  switch (fn) {
    case 'relu':
      return x > 0 ? 1 : 0;
    case 'leaky_relu':
      return x > 0 ? 1 : 0.08;
    case 'tanh':
      const th = Math.tanh(x);
      return 1 - th * th;
    case 'sigmoid':
      const s = 1 / (1 + Math.exp(-x));
      return s * (1 - s);
    case 'gelu':
    default:
      return 1;
  }
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function randomGaussian(mean = 0, stdev = 1): number {
  let u = 1 - Math.random();
  let v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

export function generateWeight(fanIn: number, type: 'he' | 'xavier' | 'uniform' = 'he'): number {
  if (type === 'he') {
    const std = Math.sqrt(2 / Math.max(1, fanIn));
    return clamp(randomGaussian(0, std), -1.5, 1.5);
  }
  if (type === 'xavier') {
    const std = Math.sqrt(1 / Math.max(1, fanIn));
    return clamp(randomGaussian(0, std), -1.5, 1.5);
  }
  return (Math.random() * 2 - 1) * 0.8;
}

export function calculateEntropy(probabilities: number[]): number {
  const sum = probabilities.reduce((acc, p) => acc + Math.max(0, p), 0);
  if (sum <= 0) return 0;
  let entropy = 0;
  for (const p of probabilities) {
    if (p > 0) {
      const norm = p / sum;
      entropy -= norm * Math.log2(norm);
    }
  }
  return Number.isNaN(entropy) ? 0 : entropy;
}
