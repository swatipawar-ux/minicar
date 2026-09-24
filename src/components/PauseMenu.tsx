import React from 'react';
import { CameraViewMode } from '../types/game';
import { Play, RotateCcw, Home, Volume2, Music, Video } from 'lucide-react';

interface PauseMenuProps {
  cameraMode: CameraViewMode;
  sfxVolume: number;
  musicVolume: number;
  isMuted: boolean;
  isMusicPlaying: boolean;
  onResume: () => void;
  onRestart: () => void;
  onReturnToGarage: () => void;
  onSetCameraMode: (mode: CameraViewMode) => void;
  onSetSfxVolume: (val: number) => void;
  onSetMusicVolume: (val: number) => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  cameraMode,
  sfxVolume,
  musicVolume,
  isMuted,
  isMusicPlaying,
  onResume,
  onRestart,
  onReturnToGarage,
  onSetCameraMode,
  onSetSfxVolume,
  onSetMusicVolume,
  onToggleMute,
  onToggleMusic,
}) => {
  return (
    <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/90 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
        <div className="text-center border-b border-white/10 pb-4">
          <div className="text-xs uppercase tracking-widest text-cyan-400 font-chakra font-bold">
            RACE SUSPENDED
          </div>
          <h2 className="font-orbitron font-black text-3xl text-white tracking-wide mt-1">
            GAME PAUSED
          </h2>
        </div>

        {/* Camera Selector */}
        <div>
          <label className="text-xs uppercase tracking-wider font-chakra text-slate-400 font-bold flex items-center gap-1.5 mb-2">
            <Video className="w-3.5 h-3.5 text-cyan-400" /> CAMERA PERSPECTIVE
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['chase', 'far', 'hood'] as CameraViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onSetCameraMode(mode)}
                className={`py-2 px-3 rounded-lg text-xs font-chakra font-bold uppercase transition-colors cursor-pointer ${
                  cameraMode === mode
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {mode === 'chase' ? 'Action Cam' : mode === 'far' ? 'Arcade High' : 'Cockpit'}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Volume Controls */}
        <div className="space-y-3 bg-slate-950/50 p-3.5 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-chakra font-bold text-slate-300">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>SFX & MOTOR ENGINE</span>
            </div>
            <button
              onClick={onToggleMute}
              className="text-xs font-chakra text-cyan-400 hover:underline cursor-pointer"
            >
              {isMuted ? 'UNMUTE' : 'MUTE'}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : sfxVolume}
            onChange={(e) => onSetSfxVolume(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs font-chakra font-bold text-slate-300">
              <Music className="w-4 h-4 text-pink-400" />
              <span>RETRO SYNTH SOUNDTRACK</span>
            </div>
            <button
              onClick={onToggleMusic}
              className="text-xs font-chakra text-pink-400 hover:underline cursor-pointer"
            >
              {isMusicPlaying ? 'STOP' : 'PLAY'}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={musicVolume}
            onChange={(e) => onSetMusicVolume(parseFloat(e.target.value))}
            className="w-full accent-pink-400 cursor-pointer"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={onResume}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-orbitron font-black text-sm uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            RESUME RACE (ESC)
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-chakra font-bold text-sm uppercase tracking-wider rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            RESTART CIRCUIT
          </button>

          <button
            onClick={onReturnToGarage}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white font-chakra font-bold text-xs uppercase tracking-wider rounded-xl border border-white/5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            RETURN TO GARAGE
          </button>
        </div>
      </div>
    </div>
  );
};
