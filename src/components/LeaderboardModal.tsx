import React from 'react';
import { HighScoreRecord } from '../types/game';
import { CAR_CONFIGS } from '../game/CarModels';
import { ENV_CONFIGS } from '../game/Environment';
import { Trophy, X, Trash2 } from 'lucide-react';

interface LeaderboardModalProps {
  records: HighScoreRecord[];
  onClose: () => void;
  onClearRecords: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  records,
  onClose,
  onClearRecords,
}) => {
  return (
    <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900/95 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-orbitron font-black text-xl text-white">
              HALL OF FAME
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Records List */}
        <div className="my-4 flex-1 overflow-y-auto space-y-2 pr-1">
          {records.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-chakra">
              No race telemetry recorded yet. Start racing to set records!
            </div>
          ) : (
            records.map((rec, index) => {
              const car = CAR_CONFIGS[rec.carId];
              const env = ENV_CONFIGS[rec.environment];
              return (
                <div
                  key={rec.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                    index === 0
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                      : index === 1
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
                      : 'bg-slate-950/50 border-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-orbitron font-black text-lg w-6 text-center text-slate-400">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
                        {car ? car.name : rec.carId}
                        <span className="text-[10px] font-chakra text-slate-400">
                          ({env ? env.name.split(' ')[0] : ''})
                        </span>
                      </div>
                      <div className="text-[11px] font-chakra text-slate-400 mt-0.5">
                        {rec.date} · Top: {rec.maxSpeed} KM/H · {(rec.distance / 1000).toFixed(1)} KM
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-orbitron font-black text-lg text-amber-400">
                      {rec.score.toLocaleString()}
                    </div>
                    <div className="text-[9px] font-chakra uppercase tracking-widest text-slate-400">
                      POINTS
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 pt-3 flex items-center justify-between">
          {records.length > 0 && (
            <button
              onClick={onClearRecords}
              className="flex items-center gap-1.5 text-xs font-chakra text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              CLEAR RECORDS
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-chakra font-bold rounded-lg transition-colors cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
