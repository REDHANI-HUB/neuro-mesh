import React from 'react';
import { Target, Cpu, Clock, Activity, ShieldAlert, CheckCircle } from 'lucide-react';

interface PredictionDisplayProps {
  prediction: string;
  confidence: number;
  probabilities: { [key: string]: number };
  lastWorker: string;
  processingTimeMs: number;
  safetyThreshold?: number;
  temporalCount?: number;
}

export const PredictionDisplay: React.FC<PredictionDisplayProps> = ({
  prediction,
  confidence,
  probabilities,
  lastWorker,
  processingTimeMs,
  safetyThreshold = 0.60,
  temporalCount = 3
}) => {
  const isAvailable = prediction !== 'N/A' && prediction !== '' && prediction !== 'MODEL UNAVAILABLE' && prediction !== 'DATASET UNAVAILABLE';
  const isModelUnavailable = prediction === 'MODEL UNAVAILABLE';
  const isDatasetUnavailable = prediction === 'DATASET UNAVAILABLE';

  const passesSafety = confidence >= safetyThreshold;

  const getBadgeColor = () => {
    if (isModelUnavailable || isDatasetUnavailable) {
      return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30';
    }
    if (!isAvailable) return 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    if (!passesSafety) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30';
    switch (prediction) {
      case 'LEFT_HAND': return 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30';
      case 'RIGHT_HAND': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      default: return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30';
    }
  };

  const safeProbas = probabilities || { LEFT_HAND: 0, RIGHT_HAND: 0, REST: 0 };

  return (
    <div className="panel-card flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Target className="w-4 h-4 text-sky-500" />
            Motor Imagery BCI Decision
          </h2>
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            <Cpu className="w-3 h-3 text-sky-500" />
            <span>{isAvailable ? lastWorker : 'Worker Idle'}</span>
          </div>
        </div>

        {/* Prediction Badge */}
        <div className={`inner-box p-4 text-center border font-mono rounded-lg mb-3 ${getBadgeColor()}`}>
          <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
            DECODED INTENTION
          </span>
          <div className="text-lg font-bold tracking-wide my-1">
            {isModelUnavailable ? 'MODEL UNAVAILABLE' : isDatasetUnavailable ? 'DATASET UNAVAILABLE' : isAvailable ? prediction : 'Waiting for EEG stream...'}
          </div>
          <div className="text-xs font-semibold opacity-90 flex items-center justify-center gap-2">
            <span>Model Confidence: {isAvailable ? `${(confidence * 100).toFixed(1)}%` : '0.0%'}</span>
            {isAvailable && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${passesSafety ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                {passesSafety ? 'PASSED SAFETY' : 'SAFETY HOLD'}
              </span>
            )}
          </div>
        </div>

        {/* Temporal Smoothing & Safety Threshold Status */}
        <div className="grid grid-cols-2 gap-2 mb-3 font-mono text-[11px]">
          <div className="inner-box p-2 text-center">
            <span className="text-slate-400 text-[10px] block">Temporal Voting</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {isAvailable ? `${temporalCount}-Window Match` : 'Idle'}
            </span>
          </div>
          <div className="inner-box p-2 text-center">
            <span className="text-slate-400 text-[10px] block">Safety Threshold</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {(safetyThreshold * 100).toFixed(0)}% Min
            </span>
          </div>
        </div>

        {/* Confidence Progress Bar */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
            <span>Probability Certainty</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {isAvailable ? `${(confidence * 100).toFixed(1)}%` : '0.0%'}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${passesSafety ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${isAvailable ? Math.min(100, confidence * 100) : 0}%` }}
            />
          </div>
        </div>

        {/* Class Probabilities */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase block">
            Class Distribution:
          </span>
          {Object.entries(safeProbas).map(([cls, prob]) => (
            <div key={cls} className="space-y-0.5 font-mono text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span>{cls}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {isAvailable ? `${((prob as number) * 100).toFixed(1)}%` : '0.0%'}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    cls === prediction ? 'bg-sky-500' : 'bg-slate-400 opacity-40'
                  }`}
                  style={{ width: `${isAvailable ? Math.min(100, (prob as number) * 100) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-500" /> Latency: {isAvailable ? `${processingTimeMs} ms` : 'N/A'}
        </span>
        <span className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-emerald-500" /> Model: SVM-RBF
        </span>
      </div>
    </div>
  );
};
