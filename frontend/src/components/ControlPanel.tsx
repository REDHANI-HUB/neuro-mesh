import React from 'react';
import { Play, Square, RotateCcw, BarChart3, Sliders, Database } from 'lucide-react';

interface ControlPanelProps {
  streamStatus: string;
  datasetMode: 'DEMO' | 'PHYSIONET';
  onStartDemo: () => void;
  onStopDemo: () => void;
  onResetSession: () => void;
  onToggleDatasetMode: () => void;
  onOpenBenchmark: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  streamStatus,
  datasetMode,
  onStartDemo,
  onStopDemo,
  onResetSession,
  onToggleDatasetMode,
  onOpenBenchmark
}) => {
  const isLive = streamStatus === 'LIVE';

  return (
    <div className="card flex-between gap-4" style={{ flexWrap: 'wrap' }}>
      {/* Title & Info */}
      <div>
        <div className="flex-row gap-2">
          <Sliders style={{ width: '18px', height: '18px', color: 'var(--accent-cyan)' }} />
          <h2 style={{ fontSize: '0.95rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}>
            System Control & Stream Orchestrator
          </h2>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          Manage real-time EEG stream ingestion, task distribution, and pipeline mode
        </p>
      </div>

      {/* Control Buttons & Toggles */}
      <div className="flex-row gap-3" style={{ flexWrap: 'wrap' }}>
        {/* Mode Switcher Toggle Button */}
        <button onClick={onToggleDatasetMode} className="btn-base btn-secondary">
          <Database style={{ width: '14px', height: '14px', color: 'var(--accent-cyan)' }} />
          <span>MODE: <strong style={{ color: 'var(--accent-cyan)' }}>{datasetMode === 'DEMO' ? 'MODE A (SYNTHETIC)' : 'MODE B (PHYSIONET)'}</strong></span>
        </button>

        {/* Start / Stop Button */}
        {!isLive ? (
          <button onClick={onStartDemo} className="btn-base btn-primary">
            <Play style={{ width: '14px', height: '14px' }} />
            <span>START DEMO STREAM</span>
          </button>
        ) : (
          <button onClick={onStopDemo} className="btn-base btn-danger">
            <Square style={{ width: '14px', height: '14px' }} />
            <span>STOP STREAM</span>
          </button>
        )}

        {/* Reset Session Button */}
        <button onClick={onResetSession} className="btn-base btn-warning">
          <RotateCcw style={{ width: '14px', height: '14px' }} />
          <span>RESET SESSION</span>
        </button>

        {/* Benchmark Button */}
        <button onClick={onOpenBenchmark} className="btn-base btn-info">
          <BarChart3 style={{ width: '14px', height: '14px' }} />
          <span>RUN BENCHMARK</span>
        </button>
      </div>
    </div>
  );
};
