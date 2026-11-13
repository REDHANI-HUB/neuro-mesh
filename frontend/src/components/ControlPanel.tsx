import React from 'react';
import { Play, Square, RotateCcw, BarChart3, Sliders, Database, AlertCircle } from 'lucide-react';

interface ControlPanelProps {
  streamStatus: string;
  datasetMode: 'DEMO' | 'PHYSIONET';
  backendOnline: boolean;
  onStartDemo: () => void;
  onStopDemo: () => void;
  onResetSession: () => void;
  onToggleDatasetMode: () => void;
  onOpenBenchmark: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  streamStatus,
  datasetMode,
  backendOnline,
  onStartDemo,
  onStopDemo,
  onResetSession,
  onToggleDatasetMode,
  onOpenBenchmark
}) => {
  const isLive = streamStatus === 'LIVE';

  return (
    <div className="panel-card flex flex-wrap items-center justify-between gap-4">
      {/* Title & Description */}
      <div>
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-500" />
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Session & Data Source Control
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage real-time EEG ingestion stream, select dataset source, and control distributed task queue
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {!backendOnline && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Backend Offline</span>
          </div>
        )}

        <button
          onClick={onToggleDatasetMode}
          disabled={!backendOnline}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-500 transition-colors disabled:opacity-50"
          title="Toggle EEG Source between Synthetic Simulation and Authentic PhysioNet Dataset"
        >
          <Database className="w-3.5 h-3.5 text-sky-500" />
          <span>DATASET: <strong className="text-sky-600 dark:text-sky-400">{datasetMode === 'DEMO' ? 'Synthetic Simulation' : 'PhysioNet EEGMMIDB'}</strong></span>
        </button>

        {!isLive ? (
          <button
            onClick={onStartDemo}
            disabled={!backendOnline}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>START STREAM</span>
          </button>
        ) : (
          <button
            onClick={onStopDemo}
            disabled={!backendOnline}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-sm disabled:opacity-50"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>STOP STREAM</span>
          </button>
        )}

        <button
          onClick={onResetSession}
          disabled={!backendOnline}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono font-bold text-slate-800 dark:text-slate-100 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
          <span>RESET SESSION</span>
        </button>

        <button
          onClick={onOpenBenchmark}
          disabled={!backendOnline}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono font-bold text-white bg-sky-600 hover:bg-sky-500 transition-colors shadow-sm disabled:opacity-50"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>BENCHMARK MODE</span>
        </button>
      </div>
    </div>
  );
};
