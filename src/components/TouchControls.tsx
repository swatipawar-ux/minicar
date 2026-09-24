import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Zap } from 'lucide-react';

interface TouchControlsProps {
  onPress: (action: 'left' | 'right' | 'up' | 'down' | 'boost', state: boolean) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onPress }) => {
  return (
    <div className="absolute inset-x-0 bottom-4 pointer-events-none z-10 select-none px-4 md:hidden flex items-end justify-between">
      {/* Left Steering Pad */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onTouchStart={() => onPress('left', true)}
          onTouchEnd={() => onPress('left', false)}
          onMouseDown={() => onPress('left', true)}
          onMouseUp={() => onPress('left', false)}
          className="w-16 h-16 rounded-2xl bg-slate-900/80 active:bg-cyan-500/40 border border-cyan-500/40 backdrop-blur-md flex items-center justify-center text-cyan-400 active:text-white shadow-xl touch-none cursor-pointer"
          aria-label="Steer Left"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>

        <button
          onTouchStart={() => onPress('right', true)}
          onTouchEnd={() => onPress('right', false)}
          onMouseDown={() => onPress('right', true)}
          onMouseUp={() => onPress('right', false)}
          className="w-16 h-16 rounded-2xl bg-slate-900/80 active:bg-cyan-500/40 border border-cyan-500/40 backdrop-blur-md flex items-center justify-center text-cyan-400 active:text-white shadow-xl touch-none cursor-pointer"
          aria-label="Steer Right"
        >
          <ArrowRight className="w-8 h-8" />
        </button>
      </div>

      {/* Right Action Pad: Throttle, Brake, Nitro */}
      <div className="flex items-end gap-3 pointer-events-auto">
        {/* Brake */}
        <button
          onTouchStart={() => onPress('down', true)}
          onTouchEnd={() => onPress('down', false)}
          onMouseDown={() => onPress('down', true)}
          onMouseUp={() => onPress('down', false)}
          className="w-14 h-14 rounded-2xl bg-slate-900/80 active:bg-rose-500/40 border border-rose-500/40 backdrop-blur-md flex flex-col items-center justify-center text-rose-400 active:text-white shadow-xl touch-none cursor-pointer"
          aria-label="Brake"
        >
          <ArrowDown className="w-6 h-6" />
          <span className="text-[9px] font-chakra font-bold">BRAKE</span>
        </button>

        {/* Throttle */}
        <button
          onTouchStart={() => onPress('up', true)}
          onTouchEnd={() => onPress('up', false)}
          onMouseDown={() => onPress('up', true)}
          onMouseUp={() => onPress('up', false)}
          className="w-16 h-16 rounded-2xl bg-slate-900/80 active:bg-emerald-500/40 border border-emerald-500/40 backdrop-blur-md flex flex-col items-center justify-center text-emerald-400 active:text-white shadow-xl touch-none cursor-pointer"
          aria-label="Accelerate"
        >
          <ArrowUp className="w-7 h-7" />
          <span className="text-[9px] font-chakra font-bold">GAS</span>
        </button>

        {/* Nitro */}
        <button
          onTouchStart={() => onPress('boost', true)}
          onTouchEnd={() => onPress('boost', false)}
          onMouseDown={() => onPress('boost', true)}
          onMouseUp={() => onPress('boost', false)}
          className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 active:from-cyan-400 active:to-teal-300 border border-cyan-400/50 flex flex-col items-center justify-center text-white shadow-xl box-glow-cyan touch-none cursor-pointer"
          aria-label="Nitro Boost"
        >
          <Zap className="w-7 h-7 fill-current" />
          <span className="text-[9px] font-chakra font-black">BOOST</span>
        </button>
      </div>
    </div>
  );
};
