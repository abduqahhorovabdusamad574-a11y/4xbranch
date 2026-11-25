import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  GitBranch,
  Layers,
  Maximize2,
  Palette,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';

type StylePreset =
  | 'Cyberpunk 2099'
  | '3D Octane Render'
  | 'Studio Portrait'
  | 'Abstract Glass';

type AspectRatio = '16:9' | '1:1' | '9:16';

interface ArtworkItem {
  id: string;
  prompt: string;
  style: StylePreset;
  aspectRatio: AspectRatio;
  seed: number;
  cfg: number;
  palette: [string, string, string];
  createdAt: string;
  liked?: boolean;
}

const STYLE_PRESETS: {
  id: StylePreset;
  badge: string;
  palettes: [string, string, string][];
}[] = [
  {
    id: 'Cyberpunk 2099',
    badge: 'Neon Megastructure',
    palettes: [
      ['#8b5cf6', '#d946ef', '#06b6d4'],
      ['#a855f7', '#ec4899', '#38bdf8'],
      ['#6366f1', '#d946ef', '#22d3ee'],
    ],
  },
  {
    id: '3D Octane Render',
    badge: 'Subsurface Caustics',
    palettes: [
      ['#7c3aed', '#f472b6', '#f59e0b'],
      ['#8b5cf6', '#c084fc', '#2dd4bf'],
      ['#6d28d9', '#e879f9', '#fb7185'],
    ],
  },
  {
    id: 'Studio Portrait',
    badge: 'Editorial Rim Light',
    palettes: [
      ['#d946ef', '#fb7185', '#f59e0b'],
      ['#a855f7', '#f43f5e', '#c084fc'],
      ['#8b5cf6', '#ec4899', '#fcd34d'],
    ],
  },
  {
    id: 'Abstract Glass',
    badge: 'Liquid Refraction',
    palettes: [
      ['#c026d3', '#7c3aed', '#38bdf8'],
      ['#8b5cf6', '#e879f9', '#34d399'],
      ['#a21caf', '#6366f1', '#f472b6'],
    ],
  },
];

const ASPECT_RATIOS: { id: AspectRatio; label: string; className: string }[] = [
  { id: '16:9', label: '16:9 Wide', className: 'aspect-video' },
  { id: '1:1', label: '1:1 Square', className: 'aspect-square' },
  { id: '9:16', label: '9:16 Vertical', className: 'aspect-[9/16]' },
];

const INSPIRATION_PROMPTS: { prompt: string; style: StylePreset; ratio: AspectRatio }[] = [
  {
    prompt:
      'Orbital glass cathedral hovering above neon rain megacity, volumetric violet beams, ultra-detailed',
    style: 'Cyberpunk 2099',
    ratio: '16:9',
  },
  {
    prompt:
      'Iridescent obsidian torus suspended in liquid mercury, studio caustics, raytraced dispersion',
    style: '3D Octane Render',
    ratio: '1:1',
  },
  {
    prompt:
      'Haute couture cybernetic muse bathed in magenta and ultraviolet rim lighting, 85mm f/1.2',
    style: 'Studio Portrait',
    ratio: '9:16',
  },
  {
    prompt:
      'Translucent dichroic crystal ribbons folding through deep space fog, soft aurora refraction',
    style: 'Abstract Glass',
    ratio: '16:9',
  },
];

const INITIAL_GALLERY: ArtworkItem[] = [
  {
    id: 'art-1',
    prompt:
      'Quantum monolith floating inside a bioluminescent violet canyon, volumetric mist, 8k raytracing',
    style: '3D Octane Render',
    aspectRatio: '9:16',
    seed: 849201,
    cfg: 8.5,
    palette: ['#7c3aed', '#d946ef', '#38bdf8'],
    createdAt: '2m ago',
  },
  {
    id: 'art-2',
    prompt:
      'Tokyo 2099 rain-slicked skybridge with holographic kanji reflections and magenta cyber fog',
    style: 'Cyberpunk 2099',
    aspectRatio: '16:9',
    seed: 412987,
    cfg: 9.0,
    palette: ['#8b5cf6', '#ec4899', '#22d3ee'],
    createdAt: '6m ago',
  },
  {
    id: 'art-3',
    prompt:
      'Sculpted frosted sapphire & fuchsia glass waves in zero gravity, chromatic aberration',
    style: 'Abstract Glass',
    aspectRatio: '1:1',
    seed: 193844,
    cfg: 7.5,
    palette: ['#c026d3', '#6366f1', '#38bdf8'],
    createdAt: '11m ago',
  },
  {
    id: 'art-4',
    prompt:
      'Avant-garde studio portrait with prism split-lighting and liquid chrome visor',
    style: 'Studio Portrait',
    aspectRatio: '9:16',
    seed: 772310,
    cfg: 8.0,
    palette: ['#d946ef', '#fb7185', '#f59e0b'],
    createdAt: '18m ago',
  },
  {
    id: 'art-5',
    prompt:
      'Hyper-minimalist floating glass pavilion surrounded by aurora borealis ribbons at midnight',
    style: 'Abstract Glass',
    aspectRatio: '16:9',
    seed: 550129,
    cfg: 7.0,
    palette: ['#8b5cf6', '#e879f9', '#34d399'],
    createdAt: '24m ago',
  },
];

function hashSeed(input: string, seed: number): number {
  let h = seed;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) % 1000000;
  }
  return Math.abs(h);
}

function getRatioClass(ratio: AspectRatio): string {
  return ASPECT_RATIOS.find((r) => r.id === ratio)?.className ?? 'aspect-square';
}

function ProceduralArtwork({ item }: { item: ArtworkItem }) {
  const h = hashSeed(item.prompt, item.seed);
  const [c1, c2, c3] = item.palette;
  const cx1 = 22 + (h % 45);
  const cy1 = 20 + ((h >> 3) % 45);
  const cx2 = 55 + ((h >> 5) % 32);
  const cy2 = 50 + ((h >> 7) % 36);
  const angle = h % 360;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#080b18]">
      {/* Multi-layered Aurora Mesh Backdrop */}
      <div
        className="absolute inset-0 opacity-90 transition-transform duration-700 group-hover:scale-105"
        style={{
          background: `
            radial-gradient(circle at ${cx1}% ${cy1}%, ${c1}cc 0%, transparent 56%),
            radial-gradient(circle at ${cx2}% ${cy2}%, ${c2}bb 0%, transparent 58%),
            radial-gradient(circle at 50% 85%, ${c3}88 0%, transparent 62%),
            linear-gradient(${angle}deg, #070a17 0%, #120b28 50%, #090d1e 100%)
          `,
        }}
      />

      {/* Style-Specific Generative Vector Geometry */}
      <svg
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full mix-blend-screen opacity-85"
      >
        <defs>
          <linearGradient id={`grad-${item.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c1} stopOpacity="0.9" />
            <stop offset="50%" stopColor={c2} stopOpacity="0.7" />
            <stop offset="100%" stopColor={c3} stopOpacity="0.9" />
          </linearGradient>
          <filter id={`blur-${item.id}`}>
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>

        {item.style === 'Cyberpunk 2099' && (
          <g>
            <path
              d="M0 320 L130 220 L260 240 L400 150 L400 400 L0 400 Z"
              fill={c1}
              fillOpacity="0.22"
            />
            {Array.from({ length: 8 }).map((_, i) => (
              <line
                key={i}
                x1={25 + i * 50}
                y1={60 + ((h + i * 19) % 120)}
                x2={25 + i * 50}
                y2={390}
                stroke={i % 2 === 0 ? c2 : c3}
                strokeWidth={i % 3 === 0 ? 3 : 1.5}
                strokeOpacity="0.45"
              />
            ))}
            <circle
              cx={cx1 * 3.8}
              cy={cy1 * 2.5}
              r={58}
              fill="none"
              stroke={`url(#grad-${item.id})`}
              strokeWidth="2.5"
            />
          </g>
        )}

        {item.style === '3D Octane Render' && (
          <g>
            <circle
              cx="200"
              cy="195"
              r="112"
              fill={`url(#grad-${item.id})`}
              fillOpacity="0.32"
              filter={`url(#blur-${item.id})`}
            />
            <ellipse
              cx="200"
              cy="195"
              rx="116"
              ry="46"
              transform={`rotate(${(h % 50) - 25} 200 195)`}
              fill="none"
              stroke={c3}
              strokeWidth="2.5"
              strokeOpacity="0.75"
            />
            <ellipse
              cx="200"
              cy="195"
              rx="86"
              ry="118"
              transform={`rotate(${(h % 70) + 15} 200 195)`}
              fill="none"
              stroke={c2}
              strokeWidth="1.8"
              strokeOpacity="0.65"
            />
            <circle cx="200" cy="195" r="52" fill={`url(#grad-${item.id})`} fillOpacity="0.55" />
          </g>
        )}

        {item.style === 'Studio Portrait' && (
          <g>
            <circle
              cx="200"
              cy="155"
              r="92"
              fill={`url(#grad-${item.id})`}
              fillOpacity="0.38"
              filter={`url(#blur-${item.id})`}
            />
            <path
              d="M115 395 C120 275, 280 275, 285 395"
              fill={c1}
              fillOpacity="0.3"
              stroke={c2}
              strokeWidth="1.5"
            />
            <circle
              cx="200"
              cy="165"
              r="54"
              fill="#0b0f21"
              fillOpacity="0.55"
              stroke={c3}
              strokeWidth="2"
            />
            <line
              x1="70"
              y1="165"
              x2="330"
              y2="165"
              stroke={c2}
              strokeWidth="1.2"
              strokeDasharray="6 6"
              strokeOpacity="0.6"
            />
          </g>
        )}

        {item.style === 'Abstract Glass' && (
          <g>
            <path
              d={`M -20 ${180 + (h % 60)} Q 120 ${60 + (h % 90)} 220 210 T 430 ${150 + (h % 70)}`}
              fill="none"
              stroke={`url(#grad-${item.id})`}
              strokeWidth="44"
              strokeOpacity="0.35"
              strokeLinecap="round"
            />
            <path
              d={`M -20 ${260 - (h % 50)} Q 160 ${320 - (h % 80)} 240 160 T 430 ${230 - (h % 60)}`}
              fill="none"
              stroke={c3}
              strokeWidth="18"
              strokeOpacity="0.45"
              strokeLinecap="round"
            />
            <polygon
              points="200,75 295,200 200,325 105,200"
              fill="rgba(255,255,255,0.06)"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.5"
            />
          </g>
        )}
      </svg>

      {/* Subtle Glass Grain & Specular Rim */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#060913]/90 via-transparent to-white/[0.06]"
      />
    </div>
  );
}

function downloadArtworkSvg(item: ArtworkItem) {
  const [c1, c2, c3] = item.palette;
  const h = hashSeed(item.prompt, item.seed);
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 400 400">
  <defs>
    <radialGradient id="bg1" cx="30%" cy="25%" r="70%">
      <stop offset="0%" stop-color="${c1}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#060913" stop-opacity="1"/>
    </radialGradient>
    <radialGradient id="bg2" cx="75%" cy="75%" r="65%">
      <stop offset="0%" stop-color="${c2}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="50%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg1)"/>
  <rect width="400" height="400" fill="url(#bg2)"/>
  <circle cx="200" cy="190" r="105" fill="none" stroke="url(#accent)" stroke-width="3" opacity="0.85"/>
  <ellipse cx="200" cy="190" rx="130" ry="50" transform="rotate(${h % 90} 200 190)" fill="none" stroke="${c3}" stroke-width="2" opacity="0.7"/>
  <text x="24" y="372" fill="#e2e8f0" font-family="monospace" font-size="11">AetherVision // ${item.style} // Seed ${item.seed}</text>
</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `aether-studio-${item.seed}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function App() {
  const [prompt, setPrompt] = useState<string>(
    'Holographic obsidian prism floating above ultraviolet liquid glass, volumetric neon aurora, 8k octane'
  );
  const [style, setStyle] = useState<StylePreset>('Cyberpunk 2099');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [cfgScale, setCfgScale] = useState<number>(8.5);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [scanStage, setScanStage] = useState<string>('Initializing diffusion tensor...');
  const [gallery, setGallery] = useState<ArtworkItem[]>(INITIAL_GALLERY);
  const [activeFilter, setActiveFilter] = useState<'All' | StylePreset>('All');
  const [lightboxItem, setLightboxItem] = useState<ArtworkItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isGenerating) return;
    setScanStage('Tokenizing semantic latent space...');
    const t1 = window.setTimeout(() => setScanStage('Synthesizing neural caustics...'), 520);
    const t2 = window.setTimeout(() => setScanStage('Refining 4K specular glass pass...'), 1020);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [isGenerating]);

  const filteredGallery = useMemo(() => {
    if (activeFilter === 'All') return gallery;
    return gallery.filter((item) => item.style === activeFilter);
  }, [gallery, activeFilter]);

  const handleGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isGenerating || !prompt.trim()) return;

    setIsGenerating(true);
    const currentPrompt = prompt.trim();
    const currentStyle = style;
    const currentRatio = aspectRatio;
    const currentCfg = cfgScale;

    window.setTimeout(() => {
      const preset = STYLE_PRESETS.find((s) => s.id === currentStyle) ?? STYLE_PRESETS[0];
      const seed = Math.floor(100000 + Math.random() * 899999);
      const palette = preset.palettes[seed % preset.palettes.length];
      const newArt: ArtworkItem = {
        id: `art-${Date.now()}`,
        prompt: currentPrompt,
        style: currentStyle,
        aspectRatio: currentRatio,
        seed,
        cfg: currentCfg,
        palette,
        createdAt: 'Just now',
      };
      setGallery((prev) => [newArt, ...prev]);
      setIsGenerating(false);
    }, 1500);
  };

  const handleRemix = (item: ArtworkItem) => {
    setPrompt(item.prompt);
    setStyle(item.style);
    setAspectRatio(item.aspectRatio);
    setCfgScale(item.cfg);
    setLightboxItem(null);
    promptInputRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRandomInspiration = () => {
    const pick =
      INSPIRATION_PROMPTS[Math.floor(Math.random() * INSPIRATION_PROMPTS.length)];
    setPrompt(pick.prompt);
    setStyle(pick.style);
    setAspectRatio(pick.ratio);
  };

  const handleCopyPrompt = async (item: ArtworkItem) => {
    try {
      await navigator.clipboard.writeText(item.prompt);
    } catch {
      // Ignore clipboard failure in restricted context
    }
    setCopiedId(item.id);
    window.setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#060913] text-slate-100 overflow-x-hidden pb-16">
      {/* Electric Violet & Fuchsia Aurora Mesh */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-36 -left-24 h-[36rem] w-[36rem] rounded-full bg-violet-600/22 blur-[140px] animate-float-slow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/3 -right-28 h-[34rem] w-[34rem] rounded-full bg-fuchsia-500/18 blur-[140px] animate-float-reverse"
      />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-cyber-grid opacity-30" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-5 sm:px-6">
        {/* Top Studio Bar + Floating Branch Badge */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/35 bg-gradient-to-br from-violet-500/25 to-fuchsia-500/20 backdrop-blur-xl shadow-[0_0_32px_-8px_rgba(217,70,239,0.65)]">
              <Palette className="h-5 w-5 text-fuchsia-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-bold tracking-[0.16em] text-white uppercase">
                  AetherVision
                </span>
                <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/15 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-fuchsia-200">
                  DIFFUSION v4.2
                </span>
              </div>
              <p className="text-xs text-slate-400">Next-Gen Generative Art & Prompt Studio</p>
            </div>
          </div>

          {/* Floating Badge at Top-Right */}
          <div className="flex items-center gap-2 rounded-full border border-fuchsia-400/40 bg-violet-500/15 px-4 py-1.5 backdrop-blur-xl shadow-[0_0_28px_-8px_rgba(139,92,246,0.65)]">
            <GitBranch className="h-3.5 w-3.5 text-fuchsia-300" />
            <span className="font-mono text-xs font-semibold tracking-wide text-white">
              BRANCH: feature/ai-studio
            </span>
          </div>
        </header>

        {/* Glassmorphic Prompt Command Bar */}
        <section className="mt-6 rounded-3xl border border-white/12 bg-white/[0.035] p-5 sm:p-6 backdrop-blur-2xl shadow-[0_24px_80px_-24px_rgba(139,92,246,0.35)]">
          <form onSubmit={handleGenerate} className="space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
              <div className="relative flex-1">
                <textarea
                  ref={promptInputRef}
                  rows={2}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your scene, lighting, camera lens, and material physics..."
                  className="h-full min-h-[84px] w-full resize-none rounded-2xl border border-white/12 bg-[#060913]/75 px-4 py-3.5 pr-28 text-sm leading-relaxed text-white placeholder:text-slate-500 outline-none transition focus:border-fuchsia-400/55 focus:shadow-[0_0_24px_-8px_rgba(217,70,239,0.5)]"
                />
                <button
                  type="button"
                  onClick={handleRandomInspiration}
                  className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] font-medium text-slate-300 transition hover:border-violet-400/40 hover:bg-violet-500/15 hover:text-white cursor-pointer"
                  title="Load curated prompt"
                >
                  <Wand2 className="h-3.5 w-3.5 text-fuchsia-300" />
                  <span>Inspire</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="group relative flex shrink-0 items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-purple-600 px-8 py-4 text-sm font-bold tracking-wide text-white shadow-[0_0_40px_-8px_rgba(217,70,239,0.75)] transition-all hover:scale-[1.015] hover:shadow-[0_0_50px_-6px_rgba(217,70,239,0.9)] disabled:opacity-60 disabled:hover:scale-100 cursor-pointer"
              >
                <Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Synthesizing...' : 'Generate'}</span>
              </button>
            </div>

            {/* Style Preset Pills + Aspect Ratio + Guidance Controls */}
            <div className="flex flex-col gap-4 border-t border-white/10 pt-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Style Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <Layers className="h-3.5 w-3.5 text-violet-400" />
                  Style:
                </span>
                {STYLE_PRESETS.map((preset) => {
                  const active = style === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setStyle(preset.id)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                        active
                          ? 'border-fuchsia-400/60 bg-gradient-to-r from-violet-500/25 to-fuchsia-500/25 text-white shadow-[0_0_20px_-6px_rgba(217,70,239,0.65)]'
                          : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/25 hover:text-white'
                      }`}
                    >
                      {preset.id}
                    </button>
                  );
                })}
              </div>

              {/* Aspect Ratio & CFG */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#060913]/70 p-1">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => setAspectRatio(ratio.id)}
                      className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition cursor-pointer ${
                        aspectRatio === ratio.id
                          ? 'bg-violet-500/25 text-fuchsia-200 border border-fuchsia-400/40'
                          : 'text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      {ratio.id}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#060913]/70 px-3 py-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-violet-300" />
                  <span className="text-[11px] text-slate-400">CFG</span>
                  <input
                    type="range"
                    min={5}
                    max={12}
                    step={0.5}
                    value={cfgScale}
                    onChange={(e) => setCfgScale(Number(e.target.value))}
                    className="w-20 accent-fuchsia-500 cursor-pointer"
                  />
                  <span className="font-mono text-xs font-semibold tabular-nums text-fuchsia-300">
                    {cfgScale.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </form>
        </section>

        {/* Futuristic Laser-Scan / Shimmer Generating State (1.5s) */}
        {isGenerating && (
          <section className="mt-6 overflow-hidden rounded-3xl border border-fuchsia-400/40 bg-white/[0.03] p-6 backdrop-blur-2xl shadow-[0_0_60px_-15px_rgba(217,70,239,0.5)]">
            <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#070a18]">
              {/* Shimmer sweep */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-violet-400/15 to-transparent animate-shimmer-sweep"
              />
              {/* Laser scan bar */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 h-14 bg-gradient-to-b from-transparent via-fuchsia-500/40 to-transparent animate-laser-scan"
              >
                <div className="h-[2px] w-full bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 shadow-[0_0_20px_#e879f9]" />
              </div>

              <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-fuchsia-400/40 bg-fuchsia-500/15">
                  <Sparkles className="h-6 w-6 animate-pulse text-fuchsia-300" />
                </div>
                <p className="mt-4 font-display text-base font-semibold text-white">
                  {scanStage}
                </p>
                <p className="mt-1 max-w-xl truncate font-mono text-xs text-slate-400">
                  {style} • {aspectRatio} • CFG {cfgScale.toFixed(1)}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Gallery Filter Bar */}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold tracking-tight text-white">
              Latent Masonry Gallery
            </h2>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-xs tabular-nums text-slate-300">
              {filteredGallery.length} renders
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', ...STYLE_PRESETS.map((s) => s.id)] as const).map((filterKey) => (
              <button
                key={filterKey}
                type="button"
                onClick={() => setActiveFilter(filterKey)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer ${
                  activeFilter === filterKey
                    ? 'bg-white/[0.12] text-white border border-white/20'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {filterKey}
              </button>
            ))}
          </div>
        </div>

        {/* Masonry Artwork Gallery */}
        <main className="mt-5 columns-1 gap-5 sm:columns-2 lg:columns-3 space-y-5">
          {filteredGallery.map((item) => (
            <article
              key={item.id}
              className="group break-inside-avoid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl transition-all duration-300 hover:border-fuchsia-400/40 hover:shadow-[0_18px_50px_-18px_rgba(217,70,239,0.45)]"
            >
              {/* Artwork Canvas */}
              <div
                onClick={() => setLightboxItem(item)}
                className={`relative w-full cursor-pointer overflow-hidden ${getRatioClass(
                  item.aspectRatio
                )}`}
              >
                <ProceduralArtwork item={item} />

                {/* Top Overlay Badges */}
                <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                  <span className="rounded-full border border-white/15 bg-[#060913]/65 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
                    {item.style}
                  </span>
                  <span className="rounded-full border border-white/15 bg-[#060913]/65 px-2 py-0.5 font-mono text-[10px] text-fuchsia-200 backdrop-blur-md">
                    {item.aspectRatio}
                  </span>
                </div>

                {/* Hover Expand Hint */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxItem(item);
                  }}
                  className="absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-[#060913]/70 text-slate-200 opacity-0 backdrop-blur-md transition group-hover:opacity-100 hover:bg-white/20 cursor-pointer"
                  title="Inspect artwork"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Prompt Metadata & Actions */}
              <div className="p-4">
                <p className="line-clamp-2 text-xs leading-relaxed text-slate-200">
                  {item.prompt}
                </p>

                <div className="mt-3 flex items-center justify-between font-mono text-[10px] tabular-nums text-slate-400">
                  <span>SEED {item.seed}</span>
                  <span>
                    CFG {item.cfg.toFixed(1)} • {item.createdAt}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
                  <button
                    type="button"
                    onClick={() => downloadArtworkSvg(item)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] py-2 text-xs font-medium text-slate-200 transition hover:border-violet-400/40 hover:bg-violet-500/15 hover:text-white cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-violet-300" />
                    <span>Download</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemix(item)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/12 py-2 text-xs font-medium text-fuchsia-200 transition hover:bg-fuchsia-500/25 hover:text-white cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Remix</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyPrompt(item)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.12] hover:text-white cursor-pointer"
                    title="Copy prompt"
                  >
                    {copiedId === item.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </main>
      </div>

      {/* Artwork Lightbox Modal */}
      {lightboxItem && (
        <div
          onClick={() => setLightboxItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#04060e]/85 p-4 backdrop-blur-xl"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/15 bg-[#0a0f22] shadow-[0_30px_100px_-15px_rgba(217,70,239,0.5)]"
          >
            <div className="relative h-80 sm:h-96 w-full">
              <ProceduralArtwork item={lightboxItem} />
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#060913]/75 text-white backdrop-blur-md hover:bg-white/20 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-fuchsia-400/35 bg-fuchsia-500/15 px-3 py-1 font-semibold text-fuchsia-200">
                  {lightboxItem.style}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 font-mono text-slate-300">
                  {lightboxItem.aspectRatio}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 font-mono text-slate-300">
                  Seed {lightboxItem.seed}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-200">
                {lightboxItem.prompt}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => downloadArtworkSvg(lightboxItem)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/[0.12] cursor-pointer"
                >
                  <Download className="h-4 w-4 text-violet-300" />
                  <span>Download SVG Render</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemix(lightboxItem)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-2.5 text-xs font-semibold text-white hover:opacity-95 cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Remix in Studio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
