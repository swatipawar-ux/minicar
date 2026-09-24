import React, { useEffect } from 'react';
import { GameStats } from '../types/game';
import confetti from 'canvas-confetti';
import { RotateCcw, Home, Trophy, Gauge, Zap, Sparkles, Flame } from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  isNewHighScore: boolean;
  onRestart: () => void;
  onReturnToGarage: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  isNewHighScore,
  onRestart,
  onReturnToGarage,
}) => {
  useEffect(() => {
    if (isNewHighScore) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#ec4899', '#f59e0b', '#10b981'],
      });
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isNewHighScore, onRestart]);

  return (
    <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900/95 border border-rose-500/40 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Header */}
        <div className="text-xs uppercase font-chakra tracking-widest text-rose-400 font-bold mb-1">
          CIRCUIT TERMINATED
        </div>
        <h2 className="font-orbitron font-black text-4xl md:text-5xl italic text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 tracking-tight">
          CRASHED!
        </h2>

        {/* New High Score Alert */}
        {isNewHighScore && (
          <div className="mt-3 bg-amber-500/20 border border-amber-400/50 rounded-full px-4 py-1 flex items-center gap-2 text-xs font-chakra font-bold text-amber-300 animate-pulse">
            <Trophy className="w-4 h-4 text-amber-400" />
            NEW PERSONAL RECORD!
          </div>
        )}

        {/* Big Final Score */}
        <div className="my-5 w-full bg-slate-950/80 border border-white/10 rounded-2xl p-4">
          <div className="text-xs uppercase font-chakra tracking-wider text-slate-400">
            FINAL SCORE
          </div>
          <div className="font-orbitron font-black text-4xl md:text-5xl text-white tracking-wider mt-1">
            {stats.score.toLocaleString()}
          </div>
        </div>

        {/* Performance Telemetry Grid */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6 text-left">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-1 text-[10px] uppercase font-chakra text-slate-400">
              <Gauge className="w-3 h-3 text-cyan-400" /> DISTANCE
            </div>
            <div className="font-orbitron font-bold text-base text-white mt-1">
              {(stats.distance / 1000).toFixed(2)} <span className="text-[10px] text-slate-400">KM</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-1 text-[10px] uppercase font-chakra text-slate-400">
              <Flame className="w-3 h-3 text-amber-400" /> MAX SPEED
            </div>
            <div className="font-orbitron font-bold text-base text-amber-400 mt-1">
              {stats.maxSpeedReached} <span className="text-[10px] text-slate-400">KM/H</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-1 text-[10px] uppercase font-chakra text-slate-400">
              <Sparkles className="w-3 h-3 text-pink-400" /> NEAR MISS
            </div>
            <div className="font-orbitron font-bold text-base text-pink-400 mt-1">
              {stats.nearMisses}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-1 text-[10px] uppercase font-chakra text-slate-400">
              <Zap className="w-3 h-3 text-emerald-400" /> GEMS
            </div>
            <div className="font-orbitron font-bold text-base text-emerald-400 mt-1">
              {stats.coinsCollected}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRestart}
            className="flex-1 py-3.5 bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 hover:from-pink-500 hover:to-amber-400 text-slate-950 font-orbitron font-black text-base uppercase tracking-wider rounded-xl shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            RETRY RACE (ENTER)
          </button>

          <button
            onClick={onReturnToGarage}
            className="py-3.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-chakra font-bold text-sm uppercase tracking-wider rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            GARAGE
          </button>
        </div>
      </div>
    </div>
  );
};
