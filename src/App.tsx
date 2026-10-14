/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { ModeSelectorBar } from './components/ModeSelectorBar';
import { ThemeSelector } from './components/ThemeSelector';
import { AudioVisualizerBar } from './components/AudioVisualizerBar';
import { HotkeysModal } from './components/HotkeysModal';
import { NeuralGlassCanvas } from './components/NeuralGlassCanvas';
import { ParticleConstellationCanvas } from './components/ParticleConstellationCanvas';
import { WaveGridCanvas } from './components/WaveGridCanvas';
import { HypercubeCanvas } from './components/HypercubeCanvas';
import { VortexCanvas } from './components/VortexCanvas';
import { SculptorCanvas } from './components/SculptorCanvas';
import { ControlToolbar } from './components/ControlToolbar';
import { ConstellationToolbar } from './components/ConstellationToolbar';
import { SpecializedToolbar } from './components/SpecializedToolbar';
import { SculptorToolbar } from './components/SculptorToolbar';
import { ArchitecturePanel } from './components/ArchitecturePanel';
import { OscilloscopePanel } from './components/OscilloscopePanel';
import { NeuronDetailSheet } from './components/NeuronDetailSheet';
import { ExperimentsSection } from './components/ExperimentsSection';
import { GlassSpecsSection } from './components/GlassSpecsSection';
import {
  SystemMode,
  SculptorTool,
  GlassTheme,
  ActivationFunction,
  ViewPerspective,
  Neuron,
  NetworkStats,
  MouseInteraction,
  ConstellationStats,
} from './types/neural';
import { neuralAudio } from './utils/audio';
import { videoRecorder } from './utils/recorder';

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('simulation');
  const appContainerRef = useRef<HTMLDivElement | null>(null);

  // Primary System Mode
  const [viewMode, setViewMode] = useState<SystemMode>('constellation');

  // Noble metal & glass theme
  const [currentTheme, setCurrentTheme] = useState<GlassTheme>('platinum');

  // Hotkeys Modal State
  const [isHotkeysOpen, setIsHotkeysOpen] = useState<boolean>(false);

  // Video recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);

  // Constellation Parameters
  const [particleCount, setParticleCount] = useState<number>(110);
  const [maxDistance, setMaxDistance] = useState<number>(140);
  const [cursorRadius, setCursorRadius] = useState<number>(190);
  const [particleSpeed, setParticleSpeed] = useState<number>(1.0);
  const [mouseMode, setMouseMode] = useState<MouseInteraction>('connect');
  const [glassLensEnabled, setGlassLensEnabled] = useState<boolean>(true);
  const [constellationStats, setConstellationStats] = useState<ConstellationStats>({
    activeParticles: 110,
    activeConnections: 340,
    cursorDistance: 190,
    cursorConnectedCount: 8,
  });

  // Sculptor Parameters
  const [sculptorTool, setSculptorTool] = useState<SculptorTool>('draw');
  const [autoConnectDist, setAutoConnectDist] = useState<number>(130);
  const [driftSpeed, setDriftSpeed] = useState<number>(0.5);
  const [sculptorStats, setSculptorStats] = useState<{ nodes: number; links: number; pulses: number }>({
    nodes: 45,
    links: 88,
    pulses: 12,
  });

  // Layered Network topology
  const [layerSizes, setLayerSizes] = useState<number[]>([4, 6, 6, 3]);
  const [activationFn, setActivationFn] = useState<ActivationFunction>('gelu');
  const [learningRate, setLearningRate] = useState<number>(0.024);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1.0);
  const [pulseRate, setPulseRate] = useState<number>(1.2);
  const [glassOpacity, setGlassOpacity] = useState<number>(0.9);
  const [perspective, setPerspective] = useState<ViewPerspective>('ortho');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [selectedNeuron, setSelectedNeuron] = useState<Neuron | null>(null);

  // WaveGrid Parameters
  const [damping, setDamping] = useState<number>(0.985);
  const [elasticity, setElasticity] = useState<number>(1.1);
  const [cursorInfluence, setCursorInfluence] = useState<number>(0.35);

  // Hypercube Parameters
  const [latticeDim, setLatticeDim] = useState<number>(4);
  const [rotSpeed, setRotSpeed] = useState<number>(1.0);
  const [glassFacetOpacity, setGlassFacetOpacity] = useState<number>(1.0);

  // Vortex Parameters
  const [vortexSpeed, setVortexSpeed] = useState<number>(1.0);
  const [attractorStrength, setAttractorStrength] = useState<number>(1.1);

  // Telemetry stats
  const [stats, setStats] = useState<NetworkStats>({
    totalNeurons: 19,
    totalSynapses: 80,
    activeSignals: 0,
    firingRateHz: 0,
    averageVoltage: 0.12,
    networkEntropy: 1.45,
  });

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      neuralAudio.setEnabled(next);
      if (next) neuralAudio.playGlassClink();
      return next;
    });
  }, []);

  const handleInjectImpulse = useCallback(() => {
    switch (viewMode) {
      case 'constellation':
        window.dispatchEvent(new CustomEvent('trigger-constellation-burst'));
        break;
      case 'layered':
        window.dispatchEvent(new CustomEvent('trigger-neural-stimulus'));
        break;
      case 'wavegrid':
        window.dispatchEvent(new CustomEvent('trigger-wavegrid-impulse'));
        break;
      case 'hypercube':
        window.dispatchEvent(new CustomEvent('trigger-hypercube-burst'));
        break;
      case 'vortex':
        window.dispatchEvent(new CustomEvent('trigger-vortex-burst'));
        break;
      case 'sculptor':
        window.dispatchEvent(new CustomEvent('apply-sculptor-stamp', { detail: { stamp: 'constellation' } }));
        break;
    }
    if (soundEnabled) {
      neuralAudio.playGlassClink();
    }
  }, [viewMode, soundEnabled]);

  const handleResetWeights = () => {
    setLayerSizes([...layerSizes]);
  };

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleUpdateBias = (neuronId: string, bias: number) => {
    if (selectedNeuron && selectedNeuron.id === neuronId) {
      setSelectedNeuron({ ...selectedNeuron, bias });
    }
  };

  // 4K Wallpaper Snapshot Downloader
  const handleTakeSnapshot = useCallback(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    try {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;

      // Copy simulation
      ctx.drawImage(canvas, 0, 0);

      // Add architectural blueprint frame
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(16, 16, exportCanvas.width - 32, exportCanvas.height - 32);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '600 14px monospace';
      ctx.fillText('NEURAL GLASS ARCHITECTURE · OPTICAL SUBSTRATE BK7', 32, 44);

      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.font = '400 12px monospace';
      ctx.fillText(`РЕЖИМ: ${viewMode.toUpperCase()} · ТЕМА: ${currentTheme.toUpperCase()} · 2026`, 32, 62);

      const link = document.createElement('a');
      link.download = `neural-glass-${viewMode}-${Date.now()}.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();

      neuralAudio.playGlassClink();
    } catch {}
  }, [viewMode, currentTheme]);

  // Record 5s Video
  const handleRecordVideo = useCallback(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    setIsRecording(true);
    setRecordingProgress(0);

    videoRecorder.startRecording(
      canvas,
      5000,
      (pct) => setRecordingProgress(pct),
      () => {
        setIsRecording(false);
        setRecordingProgress(0);
        neuralAudio.playGlassClink();
      }
    );
  }, []);

  // Fullscreen Zen toggle
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Mobile Gyroscope Device Orientation Listener
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        // Subtle tilt interaction for mobile devices
        const tiltX = Math.max(-1, Math.min(1, e.gamma / 45));
        const tiltY = Math.max(-1, Math.min(1, (e.beta - 45) / 45));
        if (viewMode === 'vortex') {
          setAttractorStrength(Math.max(0.5, 1.0 + tiltX * 0.5));
        }
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [viewMode]);

  // Global Keyboard Shortcuts (Pro Mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case '1':
          setViewMode('constellation');
          break;
        case '2':
          setViewMode('layered');
          break;
        case '3':
          setViewMode('wavegrid');
          break;
        case '4':
          setViewMode('hypercube');
          break;
        case '5':
          setViewMode('vortex');
          break;
        case '6':
          setViewMode('sculptor');
          break;
        case ' ':
          e.preventDefault();
          setIsPaused((p) => !p);
          break;
        case 'z':
        case 'Z':
          handleInjectImpulse();
          break;
        case 'c':
        case 'C':
          handleTakeSnapshot();
          break;
        case 'r':
        case 'R':
          handleRecordVideo();
          break;
        case 'f':
        case 'F':
          handleToggleFullscreen();
          break;
        case 'm':
        case 'M':
          handleToggleSound();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleInjectImpulse,
    handleTakeSnapshot,
    handleRecordVideo,
    handleToggleFullscreen,
    handleToggleSound,
  ]);

  const getHeroTitle = () => {
    switch (viewMode) {
      case 'constellation':
        return 'Жива констеляція точок на скляній поверхні';
      case 'layered':
        return 'Багатошарова нейродинамічна матриця на склі';
      case 'wavegrid':
        return 'Топологічна хвильова сітка на оптичному склі';
      case 'hypercube':
        return 'Об’ємний 3D кристалічний гіперкуб';
      case 'vortex':
        return 'Синаптичний вихор на скляному диску';
      case 'sculptor':
        return 'Нейро-Скульптор: створення власних живих мереж';
      default:
        return 'Жива нейронна система';
    }
  };

  const getHeroDescription = () => {
    switch (viewMode) {
      case 'constellation':
        return 'Точки у безперервному русі, що динамічно з’єднуються лініями між собою та миттєво взаємодіють із курсором миші на матованій підкладці.';
      case 'layered':
        return 'Повнорозмірна глибока топологія з прозорими скляними пластинами між обчислювальними шарами, поширенням потенціалів дії та 3D-ракурсом.';
      case 'wavegrid':
        return 'Еластична 3D-матриця на склі BK7: рух курсора збуджує плавні концентричні хвилі та каустичні сплески рідкого срібла.';
      case 'hypercube':
        return 'Повноцінна 3D нейронна решітка, підвішена у кристалічній скляній призмі з вільним орбітальним обертанням та об’ємними синапсами.';
      case 'vortex':
        return 'Орбітальний квантовий ротор: частинки обертаються навколо оптичного ядра й реагують на курсор як на гравітаційний маяк.';
      case 'sculptor':
        return 'Малюйте пером власні нейрони прямо на склі, протягуйте між ними волокна зв’язків або штампуйте священну геометрію (ДНК, фрактали, кільця).';
      default:
        return '';
    }
  };

  return (
    <div
      ref={appContainerRef}
      className="min-h-screen bg-[#0b0c0e] text-slate-200 flex flex-col font-sans selection:bg-slate-700 selection:text-white"
    >
      {/* Top Bar with 3-zone contract */}
      <TopBar
        onInjectImpulse={handleInjectImpulse}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        activeViewMode={viewMode}
        onSelectViewMode={setViewMode}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onTakeSnapshot={handleTakeSnapshot}
        onToggleFullscreen={handleToggleFullscreen}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Hero Section */}
        <section id="simulation" className="space-y-6">
          <div className="border-b border-white/[0.08] pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <span>НЕЙРОННИЙ СУБСТРАТ</span>
                <span aria-hidden="true">·</span>
                <span>ОПТИЧНЕ СКЛО BK7</span>
                <span aria-hidden="true">·</span>
                <span className="uppercase">ТЕМА: {currentTheme}</span>
              </div>

              {/* Theme Palette Switcher */}
              <ThemeSelector currentTheme={currentTheme} onSelectTheme={setCurrentTheme} />
            </div>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight text-white text-balance">
                  {getHeroTitle()}
                </h1>
                <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
                  {getHeroDescription()}
                </p>
              </div>
            </div>

            {/* Mode Selector Gallery Bar (6 modes) */}
            <div className="mt-6">
              <ModeSelectorBar currentMode={viewMode} onSelectMode={setViewMode} />
            </div>

            {/* Audio Reactive & Recorder Bar */}
            <div className="mt-4">
              <AudioVisualizerBar
                onShowHotkeys={() => setIsHotkeysOpen(true)}
                onRecordVideo={handleRecordVideo}
                isRecording={isRecording}
                recordingProgress={recordingProgress}
              />
            </div>

            {/* Live Metrics Ribbon */}
            <div className="mt-5 pt-4 border-t border-white/[0.05] flex flex-wrap items-center gap-8 text-xs font-mono text-slate-400">
              {viewMode === 'constellation' && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">АКТИВНІ ТОЧКИ:</span>
                    <span className="text-white font-medium tabular-nums">
                      {constellationStats.activeParticles}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">ЛІНІЇ ЗВ'ЯЗКУ:</span>
                    <span className="text-white font-medium tabular-nums">
                      {constellationStats.activeConnections}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">З'ЄДНАНО З КУРСОРОМ:</span>
                    <span className="text-white font-medium tabular-nums">
                      {constellationStats.cursorConnectedCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">РАДІУС ВЗАЄМОДІЇ:</span>
                    <span className="text-white font-medium tabular-nums">{cursorRadius}px</span>
                  </div>
                </>
              )}

              {viewMode === 'layered' && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">НЕЙРОНИ:</span>
                    <span className="text-white font-medium tabular-nums">{stats.totalNeurons}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">СИНАПСИ:</span>
                    <span className="text-white font-medium tabular-nums">{stats.totalSynapses}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">ПОТІК СИГНАЛУ:</span>
                    <span className="text-white font-medium tabular-nums">{stats.firingRateHz} Гц</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">ЕНТРОПІЯ:</span>
                    <span className="text-white font-medium tabular-nums">
                      {stats.networkEntropy.toFixed(3)} біт
                    </span>
                  </div>
                </>
              )}

              {viewMode === 'wavegrid' && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">ТОПОЛОГІЧНІ ВУЗЛИ:</span>
                    <span className="text-white font-medium tabular-nums">1536 (48×32)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">ФІЗИЧНА МОДЕЛЬ:</span>
                    <span className="text-white font-medium">Двобуферна 3D хвиля</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">ПЕРСПЕКТИВА:</span>
                    <span className="text-white font-medium">3D Ізометрія нахилу</span>
                  </div>
                </>
              )}

              {viewMode === 'hypercube' && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">3D РЕШІТКА:</span>
                    <span className="text-white font-medium tabular-nums">
                      {latticeDim}×{latticeDim}×{latticeDim} ({latticeDim * latticeDim * latticeDim} вузлів)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">3D СИНАПСИ:</span>
                    <span className="text-white font-medium tabular-nums">
                      {latticeDim === 4 ? '144 зв\'язки' : '54 зв\'язки'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">ПРОСТІР:</span>
                    <span className="text-white font-medium">Об'ємна скляна призма</span>
                  </div>
                </>
              )}

              {viewMode === 'vortex' && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">ОРБІТАЛЬНІ ЧАСТИНКИ:</span>
                    <span className="text-white font-medium tabular-nums">180</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">АТРАКТОР:</span>
                    <span className="text-white font-medium">Курсор + Квантове ядро</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">ГЕОМЕТРІЯ:</span>
                    <span className="text-white font-medium">Скляний диск n=1.5168</span>
                  </div>
                </>
              )}

              {viewMode === 'sculptor' && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">СТВОРЕНО ВУЗЛІВ:</span>
                    <span className="text-white font-medium tabular-nums">{sculptorStats.nodes}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">СИНАПТИЧНИХ ЛІНІЙ:</span>
                    <span className="text-white font-medium tabular-nums">{sculptorStats.links}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">ІНСТРУМЕНТ:</span>
                    <span className="text-white font-medium">
                      {sculptorTool === 'draw'
                        ? 'Перо створення'
                        : sculptorTool === 'connect'
                        ? 'З\'єднувач'
                        : sculptorTool === 'torch'
                        ? 'Факел'
                        : 'Ластик'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Contextual Toolbar based on active viewMode */}
          {viewMode === 'constellation' && (
            <ConstellationToolbar
              particleCount={particleCount}
              onChangeParticleCount={setParticleCount}
              maxDistance={maxDistance}
              onChangeMaxDistance={setMaxDistance}
              cursorRadius={cursorRadius}
              onChangeCursorRadius={setCursorRadius}
              speed={particleSpeed}
              onChangeSpeed={setParticleSpeed}
              mouseMode={mouseMode}
              onChangeMouseMode={setMouseMode}
              glassLensEnabled={glassLensEnabled}
              onToggleGlassLens={() => setGlassLensEnabled(!glassLensEnabled)}
              onTriggerBurst={handleInjectImpulse}
            />
          )}

          {viewMode === 'layered' && (
            <ControlToolbar
              isPaused={isPaused}
              onTogglePause={() => setIsPaused(!isPaused)}
              simulationSpeed={simulationSpeed}
              onChangeSpeed={setSimulationSpeed}
              pulseRate={pulseRate}
              onChangePulseRate={setPulseRate}
              glassOpacity={glassOpacity}
              onChangeGlassOpacity={setGlassOpacity}
              perspective={perspective}
              onChangePerspective={setPerspective}
              onResetWeights={handleResetWeights}
              onTriggerPattern={handleInjectImpulse}
            />
          )}

          {(viewMode === 'wavegrid' || viewMode === 'hypercube' || viewMode === 'vortex') && (
            <SpecializedToolbar
              mode={viewMode}
              damping={damping}
              onChangeDamping={setDamping}
              elasticity={elasticity}
              onChangeElasticity={setElasticity}
              cursorInfluence={cursorInfluence}
              onChangeCursorInfluence={setCursorInfluence}
              latticeDim={latticeDim}
              onChangeLatticeDim={setLatticeDim}
              rotSpeed={rotSpeed}
              onChangeRotSpeed={setRotSpeed}
              glassFacetOpacity={glassFacetOpacity}
              onChangeGlassFacetOpacity={setGlassFacetOpacity}
              vortexSpeed={vortexSpeed}
              onChangeVortexSpeed={setVortexSpeed}
              attractorStrength={attractorStrength}
              onChangeAttractorStrength={setAttractorStrength}
              onTriggerBurst={handleInjectImpulse}
            />
          )}

          {viewMode === 'sculptor' && (
            <SculptorToolbar
              tool={sculptorTool}
              onChangeTool={setSculptorTool}
              autoConnectDist={autoConnectDist}
              onChangeAutoConnectDist={setAutoConnectDist}
              driftSpeed={driftSpeed}
              onChangeDriftSpeed={setDriftSpeed}
              onApplyStamp={(stamp) =>
                window.dispatchEvent(new CustomEvent('apply-sculptor-stamp', { detail: { stamp } }))
              }
              onClear={() => window.dispatchEvent(new CustomEvent('clear-sculptor-canvas'))}
            />
          )}

          {/* Active Canvas Stage */}
          <div className="relative">
            {viewMode === 'constellation' && (
              <ParticleConstellationCanvas
                particleCount={particleCount}
                maxDistance={maxDistance}
                cursorRadius={cursorRadius}
                speed={particleSpeed}
                mouseMode={mouseMode}
                glassLensEnabled={glassLensEnabled}
                onStatsUpdate={setConstellationStats}
              />
            )}

            {viewMode === 'layered' && (
              <>
                <NeuralGlassCanvas
                  layerSizes={layerSizes}
                  activationFn={activationFn}
                  simulationSpeed={simulationSpeed}
                  pulseRate={pulseRate}
                  learningRate={learningRate}
                  glassOpacity={glassOpacity}
                  perspective={perspective}
                  isPaused={isPaused}
                  selectedNeuronId={selectedNeuron?.id || null}
                  onSelectNeuron={setSelectedNeuron}
                  onStatsUpdate={setStats}
                />

                {selectedNeuron && (
                  <div className="absolute top-4 right-4 z-20">
                    <NeuronDetailSheet
                      neuron={selectedNeuron}
                      onClose={() => setSelectedNeuron(null)}
                      onFireNeuron={() => handleInjectImpulse()}
                      onUpdateBias={handleUpdateBias}
                    />
                  </div>
                )}
              </>
            )}

            {viewMode === 'wavegrid' && (
              <WaveGridCanvas
                damping={damping}
                elasticity={elasticity}
                cursorInfluence={cursorInfluence}
                isPaused={isPaused}
              />
            )}

            {viewMode === 'hypercube' && (
              <HypercubeCanvas
                latticeDim={latticeDim}
                rotSpeed={rotSpeed}
                glassFacetOpacity={glassFacetOpacity}
              />
            )}

            {viewMode === 'vortex' && (
              <VortexCanvas
                particleCount={180}
                vortexSpeed={vortexSpeed}
                attractorStrength={attractorStrength}
              />
            )}

            {viewMode === 'sculptor' && (
              <SculptorCanvas
                tool={sculptorTool}
                autoConnectDist={autoConnectDist}
                driftSpeed={driftSpeed}
                onStatsUpdate={setSculptorStats}
              />
            )}
          </div>
        </section>

        {/* Section: Real-time Oscilloscope */}
        <section id="oscilloscope">
          <OscilloscopePanel stats={stats} />
        </section>

        {/* Section: Laboratory Experiments */}
        <section id="experiments">
          <ExperimentsSection
            onTriggerImpulse={handleInjectImpulse}
            onTriggerPattern={() => handleInjectImpulse()}
          />
        </section>

        {/* Section: Architecture Configuration */}
        <section id="architecture">
          <ArchitecturePanel
            layerSizes={layerSizes}
            onChangeLayerSizes={setLayerSizes}
            activationFn={activationFn}
            onChangeActivationFn={setActivationFn}
            learningRate={learningRate}
            onChangeLearningRate={setLearningRate}
          />
        </section>

        {/* Section: Glass Substrate Specifications */}
        <section id="specs">
          <GlassSpecsSection />
        </section>
      </main>

      {/* Hotkeys Cheat-Sheet Modal */}
      <HotkeysModal isOpen={isHotkeysOpen} onClose={() => setIsHotkeysOpen(false)} />

      {/* Quiet, refined footer */}
      <footer className="border-t border-white/[0.08] bg-[#090a0c] py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <div>
            <span>Neural Glass Systems</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>6 інтерактивних режимів скляної матриці</span>
          </div>
          <div>
            <span>Монохромна гама: Платина · Графіт · Скло BK7 · 4K Blueprint Export</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
