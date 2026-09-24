import React from 'react';
import { CameraViewMode, GameStats, NearMissAlert } from '../types/game';
import { Pause, Volume2, VolumeX, Music, Video, Shield, Zap, Sparkles } from 'lucide-react';

interface HUDProps {
  stats: GameStats;
  nearMissAlerts: NearMissAlert[];
  cameraMode: CameraViewMode;
  isMuted: boolean;
  isMusicPlaying: boolean;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onCycleCamera: () => void;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  nearMissAlerts,
  cameraMode,
  isMuted,
  isMusicPlaying,
  onToggleMute,
  onToggleMusic,
  onCycleCamera,
  onPause,
}) => {
  const nitroPercentage = Math.max(0, Math.min(100, stats.nitro));
  const isHighSpeed = stats.speed > 160;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 select-none overflow-hidden p-4 md:p-6 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="flex items-start justify-between">
        {/* Speedometer & Gear */}
        <div className="bg-slate-950/60 backdrop-blur-md border border-cyan-500/30 rounded-xl p-3.5 shadow-xl min-w-[170px]">
          <div className="flex items-baseline gap-2">
            <span
              className={`font-orbitron text-4xl md:text-5xl font-black tracking-tight ${
                isHighSpeed ? 'text-amber-400 glow-amber' : 'text-cyan-400 glow-cyan'
              }`}
            >
              {stats.speed}
            </span>
            <span className="text-xs font-chakra text-cyan-300/80 font-bold uppercase tracking-widest">
              KM/H
            </span>
          </div>

          {/* Speed Bar Gauge */}
          <div className="w-full h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-75 rounded-full ${
                isHighSpeed
                  ? 'bg-gradient-to-r from-cyan-500 via-amber-400 to-rose-500'
                  : 'bg-gradient-to-r from-cyan-600 to-cyan-400'
              }`}
              style={{ width: `${Math.min(100, (stats.speed / 240) * 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center mt-2 text-[10px] font-chakra text-slate-400">
            <span>GEAR {Math.min(5, Math.floor(stats.speed / 45) + 1)}</span>
            <span className="text-cyan-400 font-mono font-bold">
              TOP: {stats.maxSpeedReached}
            </span>
          </div>
        </div>

        {/* Center: Score & Combo Multiplier */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-950/60 backdrop-blur-md border border-white/10 rounded-xl px-5 py-2.5 shadow-xl text-center">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-chakra">
              SCORE
            </div>
            <div className="font-orbitron text-2xl md:text-3xl font-black text-white tracking-wider">
              {stats.score.toLocaleString()}
            </div>
          </div>

          {/* Multiplier Badge */}
          {stats.multiplier > 1 && (
            <div className="mt-2 bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-orbitron font-black text-xs px-3 py-1 rounded-full shadow-lg animate-pulse flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {stats.multiplier}X MULTIPLIER
            </div>
          )}

          {/* Invulnerability Status */}
          {stats.isInvulnerable && (
            <div className="mt-2 bg-indigo-600/90 text-white font-chakra font-bold text-xs px-3 py-1 rounded-lg border border-indigo-400 shadow-lg flex items-center gap-1.5 animate-bounce">
              <Shield className="w-3.5 h-3.5 text-cyan-300" />
              SHIELD ACTIVE ({stats.invulnerableTimeRemaining}s)
            </div>
          )}

          {/* Near Miss Floating Alerts */}
          <div className="mt-3 flex flex-col items-center gap-1 pointer-events-none">
            {nearMissAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-amber-400 text-slate-950 font-orbitron font-extrabold text-xs md:text-sm px-3 py-1 rounded shadow-lg animate-fade-in-up"
              >
                {alert.text}
              </div>
            ))}
          </div>
        </div>

        {/* Right Controls & Distance */}
        <div className="flex flex-col items-end gap-2.5">
          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={onCycleCamera}
              title={`Camera: ${cameraMode.toUpperCase()}`}
              className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 border border-white/10 rounded-lg backdrop-blur-md transition-colors shadow-lg cursor-pointer"
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleMusic}
              title={isMusicPlaying ? 'Mute Synth Music' : 'Play Synth Music'}
              className={`p-2 bg-slate-900/80 hover:bg-slate-800 border border-white/10 rounded-lg backdrop-blur-md transition-colors shadow-lg cursor-pointer ${
                isMusicPlaying ? 'text-pink-400' : 'text-slate-400'
              }`}
            >
              <Music className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className={`p-2 bg-slate-900/80 hover:bg-slate-800 border border-white/10 rounded-lg backdrop-blur-md transition-colors shadow-lg cursor-pointer ${
                isMuted ? 'text-rose-400' : 'text-slate-200'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onPause}
              title="Pause Game (Esc)"
              className="p-2 bg-slate-900/80 hover:bg-rose-500/20 text-slate-200 hover:text-rose-400 border border-white/10 rounded-lg backdrop-blur-md transition-colors shadow-lg cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          {/* Distance & Coin counters */}
          <div className="bg-slate-950/60 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-right text-xs font-chakra shadow-xl">
            <div className="text-slate-400">
              DISTANCE:{' '}
              <span className="font-orbitron font-bold text-white">
                {(stats.distance / 1000).toFixed(2)} KM
              </span>
            </div>
            <div className="text-slate-400 mt-1">
              GEMS:{' '}
              <span className="font-orbitron font-bold text-amber-400">
                {stats.coinsCollected}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Nitro Bar & Tips */}
      <div className="flex flex-col items-center pb-2">
        <div className="bg-slate-950/70 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-3 shadow-2xl flex flex-col items-center min-w-[280px] md:min-w-[420px]">
          <div className="w-full flex justify-between items-center text-xs font-chakra font-bold text-cyan-300 mb-1.5 px-1">
            <span className="flex items-center gap-1.5 tracking-wider">
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
              NITRO BOOST
            </span>
            <span className="font-mono text-cyan-400">{Math.round(nitroPercentage)}%</span>
          </div>

          {/* Nitro gauge bar */}
          <div className="w-full h-3.5 bg-slate-900 border border-cyan-400/40 rounded-full p-0.5 overflow-hidden box-glow-cyan">
            <div
              className="h-full rounded-full transition-all duration-100 bg-gradient-to-r from-blue-600 via-cyan-400 to-teal-300"
              style={{ width: `${nitroPercentage}%` }}
            />
          </div>

          <div className="mt-2 text-[11px] font-chakra text-slate-400 flex items-center gap-3">
            <span>HOLD <strong className="text-cyan-300">SPACEBAR</strong> / <strong className="text-cyan-300">SHIFT</strong> TO BOOST</span>
            <span className="text-slate-600">·</span>
            <span>PRESS <strong className="text-rose-400">S</strong> TO DRIFT</span>
          </div>
        </div>
      </div>
    </div>
  );
};
