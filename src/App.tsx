import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Check,
  Copy,
  Cpu,
  Flame,
  Gauge,
  GitBranch,
  Layers,
  Lock,
  Music2,
  Palette,
  Radar,
  Shield,
  Sparkles,
  Terminal,
  TrendingUp,
  Zap,
} from 'lucide-react';

type SystemMode = 'performance' | 'stealth' | 'overdrive';

interface ModeTheme {
  id: SystemMode;
  label: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  orbPrimary: string;
  orbSecondary: string;
  accentText: string;
  accentBorder: string;
  accentBg: string;
  accentGlow: string;
  barGradient: string;
  ringGlow: string;
  clockTarget: string;
  powerDraw: string;
}

const MODE_THEMES: Record<SystemMode, ModeTheme> = {
  performance: {
    id: 'performance',
    label: 'Performance',
    tagline: 'Balanced Neural Throughput',
    icon: Gauge,
    orbPrimary: 'rgba(6, 182, 212, 0.24)',
    orbSecondary: 'rgba(99, 102, 241, 0.22)',
    accentText: 'text-cyan-300',
    accentBorder: 'border-cyan-400/40',
    accentBg: 'bg-cyan-500/15',
    accentGlow: 'shadow-[0_0_45px_-10px_rgba(34,211,238,0.45)]',
    barGradient: 'from-cyan-400 via-sky-400 to-indigo-500',
    ringGlow: 'rgba(34, 211, 238, 0.35)',
    clockTarget: '4.85 GHz',
    powerDraw: '68 W',
  },
  stealth: {
    id: 'stealth',
    label: 'Stealth',
    tagline: 'Encrypted Silent Envelope',
    icon: Shield,
    orbPrimary: 'rgba(16, 185, 129, 0.20)',
    orbSecondary: 'rgba(56, 189, 248, 0.16)',
    accentText: 'text-emerald-300',
    accentBorder: 'border-emerald-400/40',
    accentBg: 'bg-emerald-500/15',
    accentGlow: 'shadow-[0_0_45px_-10px_rgba(16,185,129,0.42)]',
    barGradient: 'from-emerald-400 via-teal-400 to-cyan-500',
    ringGlow: 'rgba(16, 185, 129, 0.32)',
    clockTarget: '2.90 GHz',
    powerDraw: '24 W',
  },
  overdrive: {
    id: 'overdrive',
    label: 'Overdrive',
    tagline: 'Unrestricted Quantum Boost',
    icon: Flame,
    orbPrimary: 'rgba(244, 63, 94, 0.25)',
    orbSecondary: 'rgba(245, 158, 11, 0.20)',
    accentText: 'text-rose-300',
    accentBorder: 'border-rose-400/45',
    accentBg: 'bg-rose-500/15',
    accentGlow: 'shadow-[0_0_50px_-8px_rgba(244,63,94,0.50)]',
    barGradient: 'from-rose-500 via-fuchsia-500 to-amber-400',
    ringGlow: 'rgba(244, 63, 94, 0.40)',
    clockTarget: '6.20 GHz',
    powerDraw: '142 W',
  },
};

interface SystemModule {
  id: string;
  name: string;
  branch: string;
  subtitle: string;
  status: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  active?: boolean;
}

const SYSTEM_MODULES: SystemModule[] = [
  {
    id: 'hub',
    name: 'Command Hub',
    branch: 'main',
    subtitle: '3D Cyber-Glass Core & Telemetry',
    status: 'ACTIVE NODE',
    icon: Layers,
    accent: 'text-cyan-300',
    active: true,
  },
  {
    id: 'crypto',
    name: 'Crypto Terminal',
    branch: 'feature/crypto-terminal',
    subtitle: 'Institutional Live Order Book & SVG Charts',
    status: 'READY ON BRANCH',
    icon: TrendingUp,
    accent: 'text-emerald-300',
  },
  {
    id: 'ai',
    name: 'AI Art Studio',
    branch: 'feature/ai-studio',
    subtitle: 'Generative Prompt Engine & Gallery',
    status: 'READY ON BRANCH',
    icon: Palette,
    accent: 'text-fuchsia-300',
  },
  {
    id: 'music',
    name: 'Spatial Vinyl',
    branch: 'feature/music-player',
    subtitle: '32-Band Audio Visualizer & WebAudio Synth',
    status: 'READY ON BRANCH',
    icon: Music2,
    accent: 'text-sky-300',
  },
];

interface TelemetryState {
  cpu: number;
  neuralLatency: number;
  gpuTensor: number;
  memoryBandwidth: number;
  packetsPerSec: number;
}

const INITIAL_EVENTS = [
  'AetherKernel v4.0.8 handshake verified [0.4ms]',
  'Neural fabric synchronized across 16 tensor lanes',
  'Zero-trust enclave shield active on core bus',
  'Spatial glass compositor locked at 120 Hz',
];

export function App() {
  const [mode, setMode] = useState<SystemMode>('performance');
  const [now, setNow] = useState<Date>(() => new Date());
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [selectedModule, setSelectedModule] = useState<SystemModule>(SYSTEM_MODULES[0]);
  const [copiedBranch, setCopiedBranch] = useState<string | null>(null);
  const [diagnosticRunning, setDiagnosticRunning] = useState(false);
  const [events, setEvents] = useState<string[]>(INITIAL_EVENTS);
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    cpu: 42,
    neuralLatency: 1.8,
    gpuTensor: 64,
    memoryBandwidth: 58,
    packetsPerSec: 18420,
  });

  const cardRef = useRef<HTMLDivElement | null>(null);
  const theme = MODE_THEMES[mode];

  // Real-time digital clock tick
  useEffect(() => {
    const clockId = window.setInterval(() => {
      setNow(new Date());
    }, 250);
    return () => window.clearInterval(clockId);
  }, []);

  // Live telemetry simulation tuned by active system mode
  useEffect(() => {
    const baseline =
      mode === 'overdrive'
        ? { cpu: 84, lat: 0.9, gpu: 91, mem: 79, pps: 42800 }
        : mode === 'stealth'
        ? { cpu: 16, lat: 3.1, gpu: 22, mem: 31, pps: 6200 }
        : { cpu: 48, lat: 1.6, gpu: 63, mem: 54, pps: 19400 };

    const clamp = (val: number, min: number, max: number) =>
      Math.max(min, Math.min(max, val));

    const timer = window.setInterval(() => {
      setTelemetry((prev) => ({
        cpu: Math.round(clamp(baseline.cpu + (Math.random() - 0.5) * 14, 6, 99)),
        neuralLatency: Number(
          clamp(baseline.lat + (Math.random() - 0.5) * 0.6, 0.4, 9.5).toFixed(2)
        ),
        gpuTensor: Math.round(clamp(baseline.gpu + (Math.random() - 0.5) * 16, 8, 99)),
        memoryBandwidth: Math.round(
          clamp(baseline.mem + (Math.random() - 0.5) * 10, 12, 98)
        ),
        packetsPerSec: Math.round(
          clamp(prev.packetsPerSec * 0.35 + baseline.pps * 0.65 + (Math.random() - 0.5) * 2400, 1200, 58000)
        ),
      }));
    }, 900);

    return () => window.clearInterval(timer);
  }, [mode]);

  const formattedTime = useMemo(() => {
    return now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [now]);

  const formattedDate = useMemo(() => {
    return now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  }, [now]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 16;
    const rotateX = (0.5 - py) * 14;
    setTilt({
      rotateX,
      rotateY,
      glareX: Math.round(px * 100),
      glareY: Math.round(py * 100),
    });
  };

  const handleMouseLeave = () => {
    setIsHoveringCard(false);
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  };

  const handleModeSwitch = (nextMode: SystemMode) => {
    setMode(nextMode);
    const nextTheme = MODE_THEMES[nextMode];
    const stamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setEvents((prev) => [
      `[${stamp}] Switched core profile -> ${nextTheme.label.toUpperCase()} (${nextTheme.clockTarget})`,
      ...prev.slice(0, 4),
    ]);
  };

  const runNeuralDiagnostic = () => {
    if (diagnosticRunning) return;
    setDiagnosticRunning(true);
    const stamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setEvents((prev) => [
      `[${stamp}] Running deep neural bus integrity sweep...`,
      ...prev.slice(0, 4),
    ]);
    window.setTimeout(() => {
      const doneStamp = new Date().toLocaleTimeString('en-US', { hour12: false });
      setDiagnosticRunning(false);
      setEvents((prev) => [
        `[${doneStamp}] Sweep passed: 0 packet drops · 99.98% coherence`,
        ...prev.slice(0, 4),
      ]);
    }, 1200);
  };

  const copyCheckoutCommand = async (branch: string) => {
    const cmd = `git checkout ${branch}`;
    try {
      await navigator.clipboard.writeText(cmd);
    } catch {
      // Fallback ignored if clipboard blocked in restricted context
    }
    setCopiedBranch(branch);
    const stamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setEvents((prev) => [
      `[${stamp}] Copied branch switch command: ${cmd}`,
      ...prev.slice(0, 4),
    ]);
    window.setTimeout(() => setCopiedBranch(null), 1800);
  };

  const telemetryBars = [
    {
      label: 'CPU Core Fabric',
      value: `${telemetry.cpu}%`,
      percent: telemetry.cpu,
      icon: Cpu,
    },
    {
      label: 'Neural Latency',
      value: `${telemetry.neuralLatency.toFixed(2)} ms`,
      percent: Math.min(100, Math.round((10 - telemetry.neuralLatency) * 10)),
      icon: Radar,
    },
    {
      label: 'Tensor Pipeline',
      value: `${telemetry.gpuTensor}%`,
      percent: telemetry.gpuTensor,
      icon: Sparkles,
    },
    {
      label: 'Memory Bandwidth',
      value: `${telemetry.memoryBandwidth}%`,
      percent: telemetry.memoryBandwidth,
      icon: Activity,
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#060913] text-slate-100 flex flex-col justify-between pb-28">
      {/* Animated Cyber-Grid Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-35 animate-grid-drift"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.08) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 75% at 50% 45%, black 35%, transparent 100%)',
        }}
      />

      {/* Floating Radial Glow Orbs reacting to System Mode */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-32 -left-24 h-[34rem] w-[34rem] rounded-full blur-[120px] transition-colors duration-700 animate-float-slow"
        style={{ background: theme.orbPrimary }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-10 -right-24 h-[32rem] w-[32rem] rounded-full blur-[130px] transition-colors duration-700 animate-float-reverse"
        style={{ background: theme.orbSecondary }}
      />

      {/* Top HUD Bar */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] backdrop-blur-xl transition-all duration-500 ${theme.accentGlow}`}
          >
            <Zap className={`h-5 w-5 transition-colors duration-500 ${theme.accentText}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold tracking-[0.2em] text-white uppercase">
                AetherOS
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono-tech text-[10px] text-slate-300">
                v4.0
              </span>
            </div>
            <p className="text-xs text-slate-400">4-in-1 Modular Spatial Environment</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 backdrop-blur-xl">
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ backgroundColor: theme.ringGlow }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ backgroundColor: theme.ringGlow.replace('0.35', '1').replace('0.32', '1').replace('0.40', '1') }}
              />
            </span>
            <span className="font-mono-tech text-[11px] tabular-nums text-slate-300">
              {telemetry.packetsPerSec.toLocaleString()} pkt/s
            </span>
          </div>

          <div
            className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 backdrop-blur-xl transition-colors duration-500 ${theme.accentBorder} ${theme.accentBg}`}
          >
            <GitBranch className={`h-3.5 w-3.5 ${theme.accentText}`} />
            <span className="font-mono-tech text-xs font-semibold tracking-wide text-white">
              BRANCH: main
            </span>
          </div>
        </div>
      </header>

      {/* Main 3D Tilt Hero Stage */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-8">
        <div
          className="w-full max-w-4xl"
          style={{ perspective: '1400px' }}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHoveringCard(true)}
          onMouseLeave={handleMouseLeave}
        >
          <div
            ref={cardRef}
            className={`relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.035] p-6 sm:p-8 backdrop-blur-2xl transition-all duration-300 ease-out ${theme.accentGlow}`}
            style={{
              transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${
                isHoveringCard ? 1.012 : 1
              })`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Interactive Mouse-Follow Specular Glare */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 transition-opacity duration-300"
              style={{
                opacity: isHoveringCard ? 0.85 : 0.25,
                background: `radial-gradient(650px circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.11), transparent 45%)`,
              }}
            />

            {/* Top Hero Header & Real-Time Clock */}
            <div className="relative flex flex-col gap-6 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                  <Lock className={`h-3 w-3 ${theme.accentText}`} />
                  <span className="font-mono-tech text-[11px] tracking-[0.18em] text-slate-300 uppercase">
                    Quantum Hypervisor Online
                  </span>
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  AETHER OS <span className={`font-mono-tech ${theme.accentText}`}>//</span> CORE v4.0
                </h1>
                <p className="text-sm text-slate-400">
                  Active Profile:{' '}
                  <span className={`font-medium ${theme.accentText}`}>{theme.label}</span> —{' '}
                  {theme.tagline}
                </p>
              </div>

              {/* Real-Time Digital Clock */}
              <div className="rounded-2xl border border-white/10 bg-[#060913]/65 px-5 py-3.5 text-left md:text-right backdrop-blur-xl">
                <div className="font-mono-tech text-3xl sm:text-4xl font-bold tracking-tight tabular-nums text-white">
                  {formattedTime}
                </div>
                <div className="mt-1 flex items-center md:justify-end gap-2 font-mono-tech text-[11px] uppercase tracking-widest text-slate-400">
                  <span>{formattedDate}</span>
                  <span className="text-slate-600">•</span>
                  <span className={theme.accentText}>{theme.clockTarget}</span>
                </div>
              </div>
            </div>

            {/* Interactive System Mode Toggles */}
            <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {(Object.keys(MODE_THEMES) as SystemMode[]).map((modeKey) => {
                  const item = MODE_THEMES[modeKey];
                  const Icon = item.icon;
                  const active = mode === modeKey;
                  return (
                    <button
                      key={modeKey}
                      type="button"
                      onClick={() => handleModeSwitch(modeKey)}
                      className={`group flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 cursor-pointer ${
                        active
                          ? `${item.accentBorder} ${item.accentBg} text-white shadow-lg`
                          : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/25 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110 ${
                          active ? item.accentText : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={runNeuralDiagnostic}
                disabled={diagnosticRunning}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-xs font-semibold tracking-wide text-slate-200 transition-all hover:border-white/30 hover:bg-white/[0.1] disabled:opacity-60 cursor-pointer"
              >
                <Activity
                  className={`h-4 w-4 ${diagnosticRunning ? 'animate-spin ' : ''}${theme.accentText}`}
                />
                <span>{diagnosticRunning ? 'SCANNING BUS...' : 'RUN DIAGNOSTIC'}</span>
              </button>
            </div>

            {/* Live Telemetry Bars Grid */}
            <div className="relative mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {telemetryBars.map((metric) => {
                const MetricIcon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-white/10 bg-[#060913]/55 p-4 transition-colors duration-300 hover:border-white/20"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-300">
                        <MetricIcon className={`h-4 w-4 ${theme.accentText}`} />
                        <span className="font-medium">{metric.label}</span>
                      </div>
                      <span className="font-mono-tech font-semibold tabular-nums text-white">
                        {metric.value}
                      </span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${theme.barGradient} transition-all duration-700 ease-out`}
                        style={{ width: `${metric.percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Split: Selected Module Inspector & Live Kernel Feed */}
            <div className="relative mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
              {/* Active/Selected Branch Module Card */}
              <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.025] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tech text-[10px] uppercase tracking-[0.16em] text-slate-400">
                      Module Inspector
                    </span>
                    <span className={`font-mono-tech text-[10px] font-semibold ${selectedModule.accent}`}>
                      {selectedModule.status}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <selectedModule.icon className={`h-5 w-5 ${selectedModule.accent}`} />
                    <h2 className="font-display text-base font-semibold text-white">
                      {selectedModule.name}
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{selectedModule.subtitle}</p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#060913]/80 px-3 py-2">
                  <code className="truncate font-mono-tech text-[11px] text-slate-200">
                    git checkout {selectedModule.branch}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyCheckoutCommand(selectedModule.branch)}
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-[11px] text-slate-200 transition hover:bg-white/[0.12] cursor-pointer"
                    title="Copy git checkout command"
                  >
                    {copiedBranch === selectedModule.branch ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-300">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Live Kernel Event Log */}
              <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-[#060913]/70 p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <Terminal className={`h-3.5 w-3.5 ${theme.accentText}`} />
                    <span className="font-mono-tech text-[11px] uppercase tracking-widest text-slate-300">
                      Kernel Stream
                    </span>
                  </div>
                  <span className="font-mono-tech text-[11px] tabular-nums text-slate-400">
                    TDP {theme.powerDraw}
                  </span>
                </div>
                <div className="space-y-1.5 font-mono-tech text-[11px]">
                  {events.map((line, idx) => (
                    <div
                      key={`${line}-${idx}`}
                      className={`truncate rounded-lg px-2.5 py-1 ${
                        idx === 0
                          ? 'bg-white/[0.06] text-slate-100'
                          : 'text-slate-400'
                      }`}
                    >
                      <span className={`mr-2 ${theme.accentText}`}>&gt;</span>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Bottom macOS-Style Glass Dock */}
      <nav
        aria-label="AetherOS System Dock"
        className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2 px-4 w-full max-w-fit"
      >
        <div className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-white/15 bg-[#0a0f1e]/75 px-3 py-2.5 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)]">
          {SYSTEM_MODULES.map((mod) => {
            const Icon = mod.icon;
            const isSelected = selectedModule.id === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setSelectedModule(mod)}
                className={`group relative flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'bg-white/[0.12] text-white border border-white/20 -translate-y-1 shadow-lg'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-white hover:-translate-y-0.5 border border-transparent'
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${mod.accent}`} />
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold leading-none">{mod.name}</div>
                  <div className="mt-1 font-mono-tech text-[10px] text-slate-400">
                    {mod.branch}
                  </div>
                </div>
                {mod.active && (
                  <span
                    className={`absolute -bottom-1 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-gradient-to-r ${theme.barGradient}`}
                  />
                )}
              </button>
            );
          })}

          <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-3 pr-1">
            <GitBranch className={`h-3.5 w-3.5 ${theme.accentText}`} />
            <span className="font-mono-tech text-[11px] font-medium text-slate-300">
              BRANCH: main
            </span>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default App;
