import React, { useState, useEffect } from 'react';
import { Compass, RotateCcw, RotateCw, ArrowUp, PauseCircle, Radio, Play } from 'lucide-react';

interface VirtualBCIDeviceProps {
  prediction: string;
}

export const VirtualBCIDevice: React.FC<VirtualBCIDeviceProps> = ({ prediction }) => {
  const [manualOverride, setManualOverride] = useState<string | null>(null);

  // Active state is manual override if set, else live prediction from WebSocket
  const activeAction = manualOverride || prediction || 'REST';

  // Clear manual override after 4 seconds of inactivity
  useEffect(() => {
    if (manualOverride) {
      const timer = setTimeout(() => setManualOverride(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [manualOverride]);

  const getRotationAngle = () => {
    switch (activeAction) {
      case 'LEFT_HAND': return -45;
      case 'RIGHT_HAND': return 45;
      default: return 0;
    }
  };

  const getStatusText = () => {
    switch (activeAction) {
      case 'LEFT_HAND': return 'TURNING LEFT (-45°)';
      case 'RIGHT_HAND': return 'TURNING RIGHT (+45°)';
      default: return 'STOPPED / REST (0°)';
    }
  };

  const getStatusBadgeStyle = () => {
    switch (activeAction) {
      case 'LEFT_HAND':
        return 'text-cyan-600 dark:text-cyan-400 border-cyan-500/50 bg-cyan-500/10 shadow-cyan-500/20';
      case 'RIGHT_HAND':
        return 'text-emerald-600 dark:text-emerald-400 border-emerald-500/50 bg-emerald-500/10 shadow-emerald-500/20';
      default:
        return 'text-amber-600 dark:text-amber-400 border-amber-500/50 bg-amber-500/10 shadow-amber-500/20';
    }
  };

  return (
    <div className="card flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-[var(--text-main)] font-mono tracking-wider uppercase flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-500" />
            Virtual Assistive Wheelchair
          </h2>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
            SOFTWARE SIMULATOR
          </span>
        </div>

        {/* Wheelchair Graphic Display */}
        <div className="card-inner p-5 flex flex-col items-center justify-center relative min-h-[190px]">
          {/* Rotating Compass Wheel */}
          <div
            className="w-24 h-24 rounded-full border-2 border-dashed border-cyan-500/60 flex items-center justify-center transition-transform duration-500 ease-out shadow-xl shadow-cyan-500/10 mb-3"
            style={{ transform: `rotate(${getRotationAngle()}deg)` }}
          >
            <div className="bg-[var(--bg-main)] p-3 rounded-full border border-cyan-500 text-[var(--text-main)] shadow-md">
              <ArrowUp className="w-8 h-8 text-cyan-500 dark:text-cyan-400" />
            </div>
          </div>

          {/* Action Status Badge */}
          <div className={`font-mono text-xs font-extrabold px-3 py-1 rounded-full border shadow-sm ${getStatusBadgeStyle()}`}>
            {getStatusText()}
          </div>
        </div>
      </div>

      {/* Manual Interactive Buttons */}
      <div className="mt-4 space-y-2">
        <div className="text-[10px] font-mono text-[var(--text-muted)] text-center">
          Interactive Manual Override Controls:
        </div>
        <div className="grid grid-cols-3 gap-2 font-mono text-xs">
          <button
            onClick={() => setManualOverride('LEFT_HAND')}
            className={`py-1.5 px-2 rounded-lg border font-bold text-center transition-all ${
              activeAction === 'LEFT_HAND'
                ? 'bg-cyan-500 text-white border-cyan-400 shadow-md'
                : 'bg-[var(--bg-inner)] text-[var(--text-main)] border-[var(--border-color)] hover:border-cyan-500'
            }`}
          >
            ◀ LEFT
          </button>
          <button
            onClick={() => setManualOverride('REST')}
            className={`py-1.5 px-2 rounded-lg border font-bold text-center transition-all ${
              activeAction === 'REST'
                ? 'bg-amber-500 text-white border-amber-400 shadow-md'
                : 'bg-[var(--bg-inner)] text-[var(--text-main)] border-[var(--border-color)] hover:border-amber-500'
            }`}
          >
            ■ STOP
          </button>
          <button
            onClick={() => setManualOverride('RIGHT_HAND')}
            className={`py-1.5 px-2 rounded-lg border font-bold text-center transition-all ${
              activeAction === 'RIGHT_HAND'
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                : 'bg-[var(--bg-inner)] text-[var(--text-main)] border-[var(--border-color)] hover:border-emerald-500'
            }`}
          >
            RIGHT ▶
          </button>
        </div>
      </div>
    </div>
  );
};
