import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AudioLines,
  Disc3,
  GitBranch,
  Headphones,
  ListMusic,
  Pause,
  Play,
  Radio,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';

type RepeatMode = 'off' | 'all' | 'one';

interface SpatialTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  mood: string;
  durationSec: number;
  bpm: number;
  spatialFormat: string;
  meshPrimary: string;
  meshSecondary: string;
  meshTertiary: string;
  accentHex: string;
  accentText: string;
  accentBorder: string;
  accentBg: string;
  chordHz: [number, number, number, number];
}

const TRACKS: SpatialTrack[] = [
  {
    id: 'trk-1',
    title: 'Neon Horizon (Spatial Mix)',
    artist: 'Kaito & Vespera',
    album: 'Aether Sessions Vol. IV',
    mood: 'Euphoric Synthwave',
    durationSec: 214,
    bpm: 118,
    spatialFormat: 'Dolby Atmos • 24-bit/96kHz',
    meshPrimary: 'rgba(56, 189, 248, 0.28)',
    meshSecondary: 'rgba(139, 92, 246, 0.26)',
    meshTertiary: 'rgba(217, 70, 239, 0.16)',
    accentHex: '#38bdf8',
    accentText: 'text-sky-300',
    accentBorder: 'border-sky-400/45',
    accentBg: 'bg-sky-500/15',
    chordHz: [146.83, 220.0, 277.18, 329.63], // Dmaj7
  },
  {
    id: 'trk-2',
    title: 'Midnight Glass Cathedral',
    artist: 'Solene Noir',
    album: 'Obsidian Echoes',
    mood: 'Deep Ambient House',
    durationSec: 248,
    bpm: 124,
    spatialFormat: 'Spatial Lossless • 24-bit/192kHz',
    meshPrimary: 'rgba(244, 63, 94, 0.26)',
    meshSecondary: 'rgba(245, 158, 11, 0.20)',
    meshTertiary: 'rgba(168, 85, 247, 0.18)',
    accentHex: '#fb7185',
    accentText: 'text-rose-300',
    accentBorder: 'border-rose-400/45',
    accentBg: 'bg-rose-500/15',
    chordHz: [130.81, 196.0, 233.08, 293.66], // Cm9
  },
  {
    id: 'trk-3',
    title: 'Bioluminescent Drift',
    artist: 'Aether Orchestra',
    album: 'Submerged Signals',
    mood: 'Emerald Downtempo',
    durationSec: 196,
    bpm: 96,
    spatialFormat: 'Binaural 360° • Studio Master',
    meshPrimary: 'rgba(16, 185, 129, 0.26)',
    meshSecondary: 'rgba(6, 182, 212, 0.22)',
    meshTertiary: 'rgba(59, 130, 246, 0.16)',
    accentHex: '#34d399',
    accentText: 'text-emerald-300',
    accentBorder: 'border-emerald-400/45',
    accentBg: 'bg-emerald-500/15',
    chordHz: [164.81, 246.94, 293.66, 392.0], // Em7
  },
  {
    id: 'trk-4',
    title: 'Ultraviolet Orbit',
    artist: 'Mira & The Null Set',
    album: 'Gravity Architecture',
    mood: 'Cosmic Electro',
    durationSec: 232,
    bpm: 128,
    spatialFormat: 'Dolby Atmos • 24-bit/96kHz',
    meshPrimary: 'rgba(217, 70, 239, 0.28)',
    meshSecondary: 'rgba(99, 102, 241, 0.25)',
    meshTertiary: 'rgba(34, 211, 238, 0.16)',
    accentHex: '#e879f9',
    accentText: 'text-fuchsia-300',
    accentBorder: 'border-fuchsia-400/45',
    accentBg: 'bg-fuchsia-500/15',
    chordHz: [174.61, 261.63, 329.63, 392.0], // Fmaj9
  },
  {
    id: 'trk-5',
    title: 'Solaris Velvet',
    artist: 'Cassian Wells',
    album: 'Warm Analog Tape',
    mood: 'Golden Lo-Fi Analog',
    durationSec: 185,
    bpm: 90,
    spatialFormat: 'Master Vinyl Cut • 96kHz',
    meshPrimary: 'rgba(245, 158, 11, 0.26)',
    meshSecondary: 'rgba(234, 88, 12, 0.22)',
    meshTertiary: 'rgba(244, 63, 94, 0.15)',
    accentHex: '#fbbf24',
    accentText: 'text-amber-300',
    accentBorder: 'border-amber-400/45',
    accentBg: 'bg-amber-500/15',
    chordHz: [196.0, 293.66, 349.23, 440.0], // Gm9
  },
];

function formatDuration(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function App() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [elapsedSec, setElapsedSec] = useState<number>(46);
  const [volume, setVolume] = useState<number>(0.72);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [synthEnabled, setSynthEnabled] = useState<boolean>(false);
  const [eqBars, setEqBars] = useState<number[]>(() =>
    Array.from({ length: 32 }, (_, i) => 18 + Math.round(Math.sin(i * 0.45) * 14 + 14))
  );

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const oscNodesRef = useRef<OscillatorNode[]>([]);
  const pulseTimerRef = useRef<number | null>(null);

  const track = TRACKS[currentIndex];
  const effectiveVolume = isMuted ? 0 : volume;

  const selectTrack = (index: number, autoPlay = true) => {
    setCurrentIndex(index);
    setElapsedSec(0);
    if (autoPlay) setIsPlaying(true);
  };

  const handleNext = () => {
    if (shuffle && TRACKS.length > 1) {
      let nextIdx = currentIndex;
      while (nextIdx === currentIndex) {
        nextIdx = Math.floor(Math.random() * TRACKS.length);
      }
      selectTrack(nextIdx, true);
      return;
    }
    const nextIdx = (currentIndex + 1) % TRACKS.length;
    selectTrack(nextIdx, true);
  };

  const handlePrev = () => {
    if (elapsedSec > 4) {
      setElapsedSec(0);
      return;
    }
    const prevIdx = (currentIndex - 1 + TRACKS.length) % TRACKS.length;
    selectTrack(prevIdx, true);
  };

  const cycleRepeat = () => {
    setRepeatMode((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
  };

  // Playback progress timer
  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setElapsedSec((prev) => {
        if (prev + 1 >= track.durationSec) {
          if (repeatMode === 'one') {
            return 0;
          }
          if (repeatMode === 'off' && currentIndex === TRACKS.length - 1 && !shuffle) {
            setIsPlaying(false);
            return track.durationSec;
          }
          window.setTimeout(() => handleNext(), 0);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, track.durationSec, repeatMode, currentIndex, shuffle]);

  // Real-time 32-bar frequency equalizer visualizer
  useEffect(() => {
    let phase = 0;
    const interval = window.setInterval(() => {
      phase += isPlaying ? 0.32 : 0.08;
      setEqBars((prev) =>
        prev.map((val, idx) => {
          if (!isPlaying) {
            return Math.max(8, Math.round(val * 0.78 + 8 * 0.22));
          }
          const bassWeight = idx < 8 ? 1.28 : idx < 20 ? 1.05 : 0.85;
          const wave1 = Math.sin(phase + idx * 0.42) * 28;
          const wave2 = Math.cos(phase * 1.45 - idx * 0.26) * 20;
          const jitter = (Math.random() - 0.3) * 26;
          const energy = Math.min(
            98,
            Math.max(12, Math.round((46 + wave1 + wave2 + jitter) * bassWeight * (0.45 + effectiveVolume * 0.65)))
          );
          return energy;
        })
      );
    }, 95);

    return () => window.clearInterval(interval);
  }, [isPlaying, effectiveVolume, track.id]);

  // Web Audio API Synthesized Ambient Chord + Subtle Beat Engine
  useEffect(() => {
    const cleanupSynth = () => {
      if (pulseTimerRef.current !== null) {
        window.clearInterval(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }
      for (const osc of oscNodesRef.current) {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // Ignore already stopped oscillator
        }
      }
      oscNodesRef.current = [];
    };

    if (!synthEnabled || !isPlaying) {
      cleanupSynth();
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0.0001, effectiveVolume * 0.16), ctx.currentTime);
    masterGainRef.current = masterGain;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(920, ctx.currentTime);
    filter.Q.setValueAtTime(2.5, ctx.currentTime);

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    const createdOscs: OscillatorNode[] = [];
    track.chordHz.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const voiceGain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.detune.setValueAtTime((idx - 1.5) * 6, ctx.currentTime);
      voiceGain.gain.setValueAtTime(0.18 / track.chordHz.length, ctx.currentTime);
      osc.connect(voiceGain);
      voiceGain.connect(filter);
      osc.start();
      createdOscs.push(osc);
    });
    oscNodesRef.current = createdOscs;

    // Subtle rhythmic pulse synced to track BPM
    const beatMs = Math.round((60 / track.bpm) * 1000);
    pulseTimerRef.current = window.setInterval(() => {
      if (!audioCtxRef.current || !masterGainRef.current) return;
      const now = audioCtxRef.current.currentTime;
      const kickOsc = audioCtxRef.current.createOscillator();
      const kickGain = audioCtxRef.current.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(110, now);
      kickOsc.frequency.exponentialRampToValueAtTime(42, now + 0.12);
      kickGain.gain.setValueAtTime(0.22, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      kickOsc.connect(kickGain);
      kickGain.connect(masterGainRef.current);
      kickOsc.start(now);
      kickOsc.stop(now + 0.2);
    }, beatMs);

    return cleanupSynth;
  }, [synthEnabled, isPlaying, track.id, track.bpm, track.chordHz, effectiveVolume]);

  // Smooth volume adjustment on live Web Audio gain
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(
        Math.max(0.0001, effectiveVolume * 0.16),
        audioCtxRef.current.currentTime,
        0.04
      );
    }
  }, [effectiveVolume]);

  const progressPct = useMemo(
    () => Math.min(100, (elapsedSec / track.durationSec) * 100),
    [elapsedSec, track.durationSec]
  );

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#060913] text-slate-100">
      {/* Dynamic Shifting Spatial Mesh Gradients synced to active track mood */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-32 -left-24 h-[38rem] w-[38rem] rounded-full blur-[150px] transition-colors duration-1000 animate-float-slow"
        style={{ background: track.meshPrimary }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-32 -right-24 h-[38rem] w-[38rem] rounded-full blur-[150px] transition-colors duration-1000 animate-float-reverse"
        style={{ background: track.meshSecondary }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/2 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[160px] transition-colors duration-1000"
        style={{ background: track.meshTertiary }}
      />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-cyber-grid opacity-20" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-4 py-5 sm:px-6">
        {/* Top Spatial Header + Floating Branch Badge */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border bg-white/[0.04] backdrop-blur-xl transition-colors duration-700 ${track.accentBorder}`}
            >
              <Headphones className={`h-5 w-5 transition-colors duration-700 ${track.accentText}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-bold tracking-[0.16em] text-white uppercase">
                  AetherSound
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold transition-colors duration-700 ${track.accentBorder} ${track.accentBg} ${track.accentText}`}
                >
                  SPATIAL AUDIO
                </span>
              </div>
              <p className="text-xs text-slate-400">{track.spatialFormat}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Web Audio API Live Synth Toggle */}
            <button
              type="button"
              onClick={() => setSynthEnabled((s) => !s)}
              className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-xl transition cursor-pointer ${
                synthEnabled
                  ? `${track.accentBorder} ${track.accentBg} text-white shadow-lg`
                  : 'border-white/15 bg-white/[0.04] text-slate-300 hover:border-white/30 hover:text-white'
              }`}
            >
              <Radio className={`h-3.5 w-3.5 ${synthEnabled ? track.accentText : 'text-slate-400'}`} />
              <span>{synthEnabled ? 'WebAudio Synth: ON' : 'Enable WebAudio Synth'}</span>
            </button>

            {/* Floating Badge at Top-Right */}
            <div
              className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 backdrop-blur-xl transition-colors duration-700 ${track.accentBorder} ${track.accentBg}`}
            >
              <GitBranch className={`h-3.5 w-3.5 ${track.accentText}`} />
              <span className="font-mono text-xs font-semibold tracking-wide text-white">
                BRANCH: feature/music-player
              </span>
            </div>
          </div>
        </header>

        {/* Main Spatial Vinyl Stage + Glass Tracklist Sidebar */}
        <main className="my-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
          {/* Centerpiece Vinyl & Equalizer Stage (8 cols) */}
          <section className="lg:col-span-8 rounded-3xl border border-white/12 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-2xl shadow-[0_28px_90px_-24px_rgba(0,0,0,0.85)]">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-center">
              {/* Spinning Glossy Black Vinyl Record */}
              <div className="md:col-span-6 flex items-center justify-center">
                <div className="relative flex h-64 w-64 items-center justify-center sm:h-76 sm:w-76">
                  {/* Ambient Halo behind vinyl */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-4 rounded-full blur-2xl transition-colors duration-1000 animate-pulse-ring"
                    style={{ background: track.meshPrimary }}
                  />

                  {/* Pivoting Tonearm Indicator */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-2 right-4 z-20 origin-top-right transition-transform duration-700 ease-out"
                    style={{
                      transform: isPlaying ? 'rotate(24deg)' : 'rotate(2deg)',
                    }}
                  >
                    <div className="h-5 w-5 rounded-full border border-white/25 bg-slate-800 shadow-lg" />
                    <div className="mx-auto h-28 w-1.5 rounded-full bg-gradient-to-b from-slate-300 via-slate-400 to-slate-600 shadow-md" />
                    <div className="mx-auto h-3.5 w-2.5 rounded-sm bg-white/80" />
                  </div>

                  {/* Spinning Vinyl Disc */}
                  <div
                    className="relative flex h-60 w-60 sm:h-72 sm:w-72 items-center justify-center rounded-full border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.9)] animate-spin-vinyl"
                    style={{
                      animationPlayState: isPlaying ? 'running' : 'paused',
                      background: `
                        conic-gradient(from 40deg, rgba(255,255,255,0.12) 0deg, transparent 35deg, transparent 175deg, rgba(255,255,255,0.10) 210deg, transparent 250deg),
                        repeating-radial-gradient(circle at center, #080a10 0px, #080a10 3px, #121725 4px, #090c14 6px)
                      `,
                    }}
                  >
                    {/* Glowing Album Art Core */}
                    <div
                      className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full border-2 border-white/25 shadow-2xl transition-all duration-700"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, ${track.accentHex}, #0f172a 80%)`,
                        boxShadow: `0 0 36px -4px ${track.accentHex}`,
                      }}
                    >
                      <Disc3 className="h-10 w-10 text-white/90" />
                      {/* Center Spindle Hole */}
                      <span className="absolute h-3.5 w-3.5 rounded-full border border-white/40 bg-[#060913]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Track Info, Scrubber & Transport Controls */}
              <div className="md:col-span-6 flex flex-col justify-between space-y-5">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                    <Sparkles className={`h-3 w-3 ${track.accentText}`} />
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-300">
                      {track.mood} • {track.bpm} BPM
                    </span>
                  </div>

                  <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    {track.title}
                  </h1>
                  <p className="mt-1 text-sm text-slate-300">
                    {track.artist} <span className="text-slate-600">•</span>{' '}
                    <span className="text-slate-400">{track.album}</span>
                  </p>
                </div>

                {/* Interactive Live Progress Scrubber */}
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="range"
                      min={0}
                      max={track.durationSec}
                      value={elapsedSec}
                      onChange={(e) => setElapsedSec(Number(e.target.value))}
                      aria-label="Track seek scrubber"
                      className="w-full h-1.5 appearance-none rounded-full bg-white/15 cursor-pointer accent-white"
                      style={{
                        background: `linear-gradient(to right, ${track.accentHex} ${progressPct}%, rgba(255,255,255,0.12) ${progressPct}%)`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-slate-400">
                    <span>{formatDuration(elapsedSec)}</span>
                    <span>-{formatDuration(track.durationSec - elapsedSec)}</span>
                  </div>
                </div>

                {/* Transport Buttons: Shuffle, Prev, Play/Pause, Next, Repeat */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShuffle((s) => !s)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border transition cursor-pointer ${
                      shuffle
                        ? `${track.accentBorder} ${track.accentBg} ${track.accentText}`
                        : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
                    }`}
                    title="Shuffle"
                  >
                    <Shuffle className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/[0.12] hover:text-white cursor-pointer"
                      title="Previous track"
                    >
                      <SkipBack className="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPlaying((p) => !p)}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-950 shadow-[0_0_35px_-4px_rgba(255,255,255,0.75)] transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause className="h-6 w-6 fill-current" />
                      ) : (
                        <Play className="h-6 w-6 fill-current translate-x-0.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/[0.12] hover:text-white cursor-pointer"
                      title="Next track"
                    >
                      <SkipForward className="h-5 w-5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={cycleRepeat}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border transition cursor-pointer ${
                      repeatMode !== 'off'
                        ? `${track.accentBorder} ${track.accentBg} ${track.accentText}`
                        : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
                    }`}
                    title={`Repeat: ${repeatMode}`}
                  >
                    {repeatMode === 'one' ? (
                      <Repeat1 className="h-4 w-4" />
                    ) : (
                      <Repeat className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Volume Slider */}
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#060913]/60 px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => setIsMuted((m) => !m)}
                    className="text-slate-300 hover:text-white cursor-pointer"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-4 w-4 text-rose-400" />
                    ) : (
                      <Volume2 className={`h-4 w-4 ${track.accentText}`} />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={effectiveVolume}
                    onChange={(e) => {
                      setIsMuted(false);
                      setVolume(Number(e.target.value));
                    }}
                    aria-label="Master volume"
                    className="h-1.5 flex-1 appearance-none rounded-full bg-white/15 cursor-pointer accent-white"
                    style={{
                      background: `linear-gradient(to right, ${track.accentHex} ${
                        effectiveVolume * 100
                      }%, rgba(255,255,255,0.12) ${effectiveVolume * 100}%)`,
                    }}
                  />
                  <span className="w-10 text-right font-mono text-[11px] tabular-nums text-slate-400">
                    {Math.round(effectiveVolume * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Real-Time Animated 32-Bar Frequency Audio Equalizer Visualizer */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-[#060913]/65 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AudioLines className={`h-4 w-4 ${track.accentText}`} />
                  <span className="font-mono text-[11px] uppercase tracking-widest text-slate-300">
                    32-Band Spatial Spectrum
                  </span>
                </div>
                <span className="font-mono text-[11px] tabular-nums text-slate-400">
                  {isPlaying ? 'LIVE SIGNAL' : 'PAUSED'} • {track.bpm} BPM
                </span>
              </div>

              <div className="flex h-24 items-end gap-1 sm:gap-1.5">
                {eqBars.map((level, idx) => (
                  <div
                    key={idx}
                    className="flex-1 rounded-t-full transition-all duration-100 ease-out"
                    style={{
                      height: `${level}%`,
                      background: `linear-gradient(to top, ${track.accentHex}55, ${track.accentHex})`,
                      boxShadow: isPlaying ? `0 0 12px -2px ${track.accentHex}88` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Interactive Glass Tracklist Sidebar (4 cols) */}
          <aside className="lg:col-span-4 rounded-3xl border border-white/12 bg-white/[0.03] p-5 backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-2">
                <ListMusic className={`h-4 w-4 ${track.accentText}`} />
                <h2 className="font-display text-sm font-bold tracking-wide text-white uppercase">
                  Spatial Queue
                </h2>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-slate-400">
                {TRACKS.length} tracks
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {TRACKS.map((item, idx) => {
                const active = idx === currentIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTrack(idx, true)}
                    className={`group flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition-all duration-300 cursor-pointer ${
                      active
                        ? `${item.accentBorder} ${item.accentBg} shadow-lg`
                        : 'border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, ${item.accentHex}, #0b1020 85%)`,
                        }}
                      >
                        {active && isPlaying ? (
                          <AudioLines className="h-4 w-4 text-white animate-pulse" />
                        ) : (
                          <span className="font-mono text-xs font-bold text-white/90">
                            0{idx + 1}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">
                          {item.title}
                        </div>
                        <div className="truncate text-xs text-slate-400">
                          {item.artist} • {item.mood}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right font-mono text-xs tabular-nums text-slate-400">
                      <div>{formatDuration(item.durationSec)}</div>
                      <div className="text-[10px] text-slate-500">{item.bpm} BPM</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-[#060913]/60 p-3.5 text-xs text-slate-400">
              <div className="flex items-center justify-between font-mono text-[11px] text-slate-300">
                <span>Atmosphere Engine</span>
                <span className={track.accentText}>Synced to Track Mood</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                Switching tracks dynamically morphs the spatial mesh gradient, vinyl core, spectrum glow, and WebAudio chord voicing.
              </p>
            </div>
          </aside>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[11px] text-slate-500">
          <span>AetherOS // Spatial Vinyl & Audio Visualizer Module</span>
          <span className="font-mono tabular-nums">
            Track {currentIndex + 1}/{TRACKS.length} • Repeat: {repeatMode.toUpperCase()} • Shuffle:{' '}
            {shuffle ? 'ON' : 'OFF'}
          </span>
        </footer>
      </div>
    </div>
  );
}

export default App;
