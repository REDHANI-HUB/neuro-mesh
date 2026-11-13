import React, { useState, useEffect } from 'react';
import { Compass, ArrowUp, ShieldAlert, Cpu } from 'lucide-react';

interface VirtualBCIDeviceProps {
  prediction: string;
}

export const VirtualBCIDevice: React.FC<VirtualBCIDeviceProps> = ({ prediction }) => {
  const [controlMode, setControlMode] = useState<'BCI_AUTO' | 'MANUAL'>('BCI_AUTO');
  const [manualOverride, setManualOverride] = useState<string | null>(null);

  const activeAction = controlMode === 'MANUAL'
    ? (manualOverride || 'REST')
    : (prediction === 'N/A' || prediction === 'MODEL UNAVAILABLE' || prediction === 'DATASET UNAVAILABLE' ? 'REST' : prediction || 'REST');

  useEffect(() => {
    if (manualOverride && controlMode === 'MANUAL') {
      const timer = setTimeout(() => setManualOverride(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [manualOverride, controlMode]);

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
        return 'text-sky-600 dark:text-sky-400 border-sky-500/30 bg-sky-500/10';
      case 'RIGHT_HAND':
        return 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      default:
        return 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10';
    }
  };

  return (
    <div className="panel-card flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-500" />
            Virtual Assistive Wheelchair
          </h2>

          <div className="flex items-center gap-1 font-mono text-[10px] bg-slate-100 dark:bg-slate-800 p-0.5 rounded border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setControlMode('BCI_AUTO')}
              className={`px-2 py-0.5 rounded font-bold transition-colors ${
                controlMode === 'BCI_AUTO' ? 'bg-emerald-600 text-white' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              BCI AUTO
            </button>
            <button
              onClick={() => setControlMode('MANUAL')}
              className={`px-2 py-0.5 rounded font-bold transition-colors ${
                controlMode === 'MANUAL' ? 'bg-amber-600 text-white' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              MANUAL
            </button>
          </div>
        </div>

        {/* Wheelchair Graphic Display */}
        <div className="inner-box p-5 flex flex-col items-center justify-center relative min-h-[170px]">
          <div
            className="w-22 h-22 rounded-full border-2 border-dashed border-sky-500/50 flex items-center justify-center transition-transform duration-500 ease-out shadow-lg shadow-sky-500/10 mb-3"
            style={{ transform: `rotate(${getRotationAngle()}deg)` }}
          >
            <div className="bg-white dark:bg-slate-900 p-3 rounded-full border border-sky-500 shadow-md">
              <ArrowUp className="w-7 h-7 text-sky-500" />
            </div>
          </div>

          <div className={`font-mono text-xs font-bold px-3 py-1 rounded-full border shadow-sm ${getStatusBadgeStyle()}`}>
            {getStatusText()}
          </div>
        </div>
      </div>

      {/* Mode Status & Interactive Manual Controls */}
      <div className="mt-3 space-y-2">
        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Active Command Source:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {controlMode === 'BCI_AUTO' ? 'BCI EEG Prediction Pipeline' : 'Manual Controller Override'}
          </span>
        </div>

        {controlMode === 'MANUAL' && (
          <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
            <button
              onClick={() => setManualOverride('LEFT_HAND')}
              className={`py-1.5 px-2 rounded-md border font-bold text-center transition-colors ${
                activeAction === 'LEFT_HAND'
                  ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-sky-500'
              }`}
            >
              ◀ LEFT
            </button>
            <button
              onClick={() => setManualOverride('REST')}
              className={`py-1.5 px-2 rounded-md border font-bold text-center transition-colors ${
                activeAction === 'REST'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-500'
              }`}
            >
              ■ STOP
            </button>
            <button
              onClick={() => setManualOverride('RIGHT_HAND')}
              className={`py-1.5 px-2 rounded-md border font-bold text-center transition-colors ${
                activeAction === 'RIGHT_HAND'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
              }`}
            >
              RIGHT ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
