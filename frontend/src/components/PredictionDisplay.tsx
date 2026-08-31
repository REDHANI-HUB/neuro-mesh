import React from 'react';
import { Target, Cpu, Clock, Activity } from 'lucide-react';

interface PredictionDisplayProps {
  prediction: string;
  confidence: number;
  probabilities: { [key: string]: number };
  lastWorker: string;
  processingTimeMs: number;
}

export const PredictionDisplay: React.FC<PredictionDisplayProps> = ({
  prediction,
  confidence,
  probabilities,
  lastWorker,
  processingTimeMs
}) => {
  const getPredictionColor = () => {
    switch (prediction) {
      case 'LEFT_HAND': return 'text-cyan-500 dark:text-cyan-400 border-cyan-500/50 bg-cyan-500/10';
      case 'RIGHT_HAND': return 'text-emerald-500 dark:text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
      default: return 'text-amber-500 dark:text-amber-400 border-amber-500/50 bg-amber-500/10';
    }
  };

  const safeProbas = probabilities || { LEFT_HAND: 0.33, RIGHT_HAND: 0.33, REST: 0.34 };

  return (
    <div className="card flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-[var(--text-main)] font-mono tracking-wider uppercase flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-500" />
            Active BCI Command Decision
          </h2>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-inner)] px-2 py-0.5 rounded border border-[var(--border-color)]">
            <Cpu className="w-3 h-3 text-cyan-500" />
            <span>{lastWorker || 'worker-1'}</span>
          </div>
        </div>

        {/* Big Badge */}
        <div className={`card-inner p-4 text-center border font-mono rounded-xl mb-4 ${getPredictionColor()}`}>
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] block mb-1">
            CLASSIFIED BCI ACTION
          </span>
          <div className="text-2xl font-black tracking-wide my-1">
            {prediction || 'REST'}
          </div>
          <div className="text-xs font-bold opacity-90">
            Confidence Score: {(confidence * 100).toFixed(1)}%
          </div>
        </div>

        {/* Confidence Progress Bar */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-xs font-mono text-[var(--text-muted)]">
            <span>Model Certainty</span>
            <span className="font-bold text-[var(--text-main)]">{(confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-[var(--bg-inner)] h-2 rounded-full overflow-hidden border border-[var(--border-color)]">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${Math.min(100, confidence * 100)}%` }}
            />
          </div>
        </div>

        {/* Probabilities Breakdown */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase block">
            Class Probability Distribution:
          </span>
          {Object.entries(safeProbas).map(([cls, prob]) => (
            <div key={cls} className="space-y-1 font-mono text-xs">
              <div className="flex justify-between text-[var(--text-muted)] text-[11px]">
                <span>{cls}</span>
                <span className="font-bold text-[var(--text-main)]">{((prob as number) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-[var(--bg-inner)] h-1.5 rounded-full overflow-hidden border border-[var(--border-color)]">
                <div
                  className={`h-full transition-all duration-300 ${
                    cls === prediction ? 'bg-cyan-500' : 'bg-slate-400 opacity-40'
                  }`}
                  style={{ width: `${Math.min(100, (prob as number) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-500" /> Latency: {processingTimeMs || 22} ms
        </span>
        <span className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-emerald-500" /> SVM Model RBF
        </span>
      </div>
    </div>
  );
};
