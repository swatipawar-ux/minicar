import React from 'react';
import { CarId, EnvironmentId } from '../types/game';
import { CAR_CONFIGS } from '../game/CarModels';
import { ENV_CONFIGS } from '../game/Environment';
import { Trophy, Volume2, VolumeX, Music, Zap, Gauge, Flame, Compass, ChevronRight } from 'lucide-react';

interface GarageMenuProps {
  selectedCarId: CarId;
  selectedColor: string;
  selectedEnv: EnvironmentId;
  highScore: number;
  isMuted: boolean;
  isMusicPlaying: boolean;
  onSelectCar: (carId: CarId) => void;
  onSelectColor: (color: string) => void;
  onSelectEnv: (envId: EnvironmentId) => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onOpenLeaderboard: () => void;
  onStartRace: () => void;
}

export const GarageMenu: React.FC<GarageMenuProps> = ({
  selectedCarId,
  selectedColor,
  selectedEnv,
  highScore,
  isMuted,
  isMusicPlaying,
  onSelectCar,
  onSelectColor,
  onSelectEnv,
  onToggleMute,
  onToggleMusic,
  onOpenLeaderboard,
  onStartRace,
}) => {
  const currentCar = CAR_CONFIGS[selectedCarId];

  return (
    <div className="absolute inset-0 z-20 overflow-y-auto bg-slate-950/85 backdrop-blur-xl flex flex-col items-center justify-between p-4 md:p-8">
      {/* Header bar */}
      <div className="w-full max-w-5xl flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-cyan-400 font-chakra font-semibold">
            NEO ARCADE VEHICLE RACING
          </div>
          <h1 className="font-orbitron font-black text-3xl md:text-5xl italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400">
            ARCADE MINI RACER 3D
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {highScore > 0 && (
            <button
              onClick={onOpenLeaderboard}
              className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 rounded-xl px-3.5 py-2 text-xs font-chakra text-amber-300 transition-colors shadow-lg cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>BEST: <strong className="font-orbitron text-white">{highScore.toLocaleString()}</strong></span>
            </button>
          )}

          <button
            onClick={onToggleMusic}
            title="Toggle Retro Synth Soundtrack"
            className={`p-2.5 rounded-xl border border-white/10 bg-slate-900/80 hover:bg-slate-800 transition-colors cursor-pointer ${
              isMusicPlaying ? 'text-pink-400 border-pink-500/40' : 'text-slate-400'
            }`}
          >
            <Music className="w-5 h-5" />
          </button>

          <button
            onClick={onToggleMute}
            title="Toggle Sound Effects"
            className={`p-2.5 rounded-xl border border-white/10 bg-slate-900/80 hover:bg-slate-800 transition-colors cursor-pointer ${
              isMuted ? 'text-rose-400 border-rose-500/40' : 'text-slate-200'
            }`}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Garage Body */}
      <div className="w-full max-w-5xl my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Car Selector & Paint */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div>
            <label className="text-xs uppercase tracking-wider font-chakra text-slate-400 font-bold block mb-2.5">
              1. SELECT MACHINE
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(Object.keys(CAR_CONFIGS) as CarId[]).map((id) => {
                const car = CAR_CONFIGS[id];
                const isSelected = selectedCarId === id;
                return (
                  <button
                    key={id}
                    onClick={() => onSelectCar(id)}
                    className={`flex flex-col p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900/90 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                        : 'bg-slate-950/60 border-white/10 hover:border-white/30 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-chakra tracking-widest text-slate-400">
                      {car.category}
                    </span>
                    <span className={`font-orbitron font-bold text-sm mt-1 ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                      {car.name}
                    </span>
                    <span className="text-[11px] font-chakra text-slate-400 mt-1 line-clamp-1">
                      {car.tagline}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Car Colors */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider font-chakra text-slate-400 font-bold">
                PAINT CUSTOMIZATION
              </span>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {selectedColor.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {currentCar.availableColors.map((color) => (
                <button
                  key={color}
                  onClick={() => onSelectColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                    selectedColor.toLowerCase() === color.toLowerCase()
                      ? 'scale-110 border-white ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950'
                      : 'border-white/20 hover:scale-105'
                  }`}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Environment Selector */}
          <div>
            <label className="text-xs uppercase tracking-wider font-chakra text-slate-400 font-bold block mb-2.5">
              2. SELECT CIRCUIT
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(Object.keys(ENV_CONFIGS) as EnvironmentId[]).map((envKey) => {
                const env = ENV_CONFIGS[envKey];
                const isSelected = selectedEnv === envKey;
                return (
                  <button
                    key={envKey}
                    onClick={() => onSelectEnv(envKey)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900/90 border-pink-500 shadow-lg shadow-pink-500/20 ring-1 ring-pink-500'
                        : 'bg-slate-950/60 border-white/10 hover:border-white/30 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-orbitron font-bold text-white flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-pink-400" />
                      {env.name}
                    </div>
                    <div className="text-[11px] font-chakra text-slate-400 mt-1 line-clamp-2">
                      {env.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Car Telemetry & Specs */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-5 shadow-2xl flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] font-chakra uppercase tracking-widest text-cyan-400 font-bold">
                  VEHICLE TELEMETRY
                </span>
                <h2 className="font-orbitron font-black text-2xl text-white">
                  {currentCar.name}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-chakra uppercase tracking-widest text-slate-400">
                  TOP SPEED
                </span>
                <div className="font-orbitron font-black text-xl text-cyan-400">
                  {currentCar.stats.topSpeed} <span className="text-xs">KM/H</span>
                </div>
              </div>
            </div>

            {/* Stat Bars */}
            <div className="mt-5 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-chakra text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" /> TOP VELOCITY
                  </span>
                  <span className="font-mono text-cyan-400">{currentCar.stats.topSpeed} KM/H</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${(currentCar.stats.topSpeed / 250) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-chakra text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Flame className="w-3.5 h-3.5 text-amber-400" /> ACCELERATION
                  </span>
                  <span className="font-mono text-amber-400">{currentCar.stats.acceleration}/10</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${(currentCar.stats.acceleration / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-chakra text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Zap className="w-3.5 h-3.5 text-pink-400" /> NITRO BOOST
                  </span>
                  <span className="font-mono text-pink-400">{currentCar.stats.nitroEfficiency}/10</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-pink-600 to-pink-400 rounded-full transition-all duration-300"
                    style={{ width: `${(currentCar.stats.nitroEfficiency / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-chakra text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Compass className="w-3.5 h-3.5 text-emerald-400" /> HANDLING & DRIFT
                  </span>
                  <span className="font-mono text-emerald-400">{currentCar.stats.handling}/10</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${(currentCar.stats.handling / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Controls Cheat Sheet */}
            <div className="mt-6 p-3 bg-slate-950/70 border border-white/10 rounded-xl text-xs font-chakra text-slate-300 space-y-1.5">
              <div className="font-bold text-cyan-400 uppercase text-[10px] tracking-wider">
                CONTROLS GUIDE
              </div>
              <div className="flex justify-between">
                <span>Steer Left / Right:</span>
                <span className="font-mono text-white font-bold">A / D or ◄ / ►</span>
              </div>
              <div className="flex justify-between">
                <span>Throttle / Brake:</span>
                <span className="font-mono text-white font-bold">W / S or ▲ / ▼</span>
              </div>
              <div className="flex justify-between">
                <span>Nitro Thrusters:</span>
                <span className="font-mono text-cyan-300 font-bold">SPACE / SHIFT</span>
              </div>
              <div className="flex justify-between">
                <span>Power Drift:</span>
                <span className="font-mono text-amber-300 font-bold">S + TURN</span>
              </div>
            </div>
          </div>

          {/* Launch Button */}
          <button
            onClick={onStartRace}
            className="mt-6 w-full py-4 bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 hover:from-pink-500 hover:to-amber-400 text-slate-950 font-orbitron font-black text-xl tracking-wider uppercase rounded-xl shadow-xl shadow-rose-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>LAUNCH RACE</span>
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Footer credits / info */}
      <div className="text-center text-xs font-chakra text-slate-400 flex items-center gap-3">
        <span>ARCADE MINI RACER 3D</span>
        <span aria-hidden="true">·</span>
        <span>WEBGL THREE.JS ENGINE</span>
        <span aria-hidden="true">·</span>
        <span>PROCEDURAL WEB AUDIO SYNTHESIS</span>
      </div>
    </div>
  );
};
