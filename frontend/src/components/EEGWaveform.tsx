import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Waves, Activity } from 'lucide-react';

interface EEGWaveformProps {
  isLive: boolean;
  waveformPreview?: number[][] | null;
  sensorPowers?: { [key: string]: number } | null;
}

export const EEGWaveform: React.FC<EEGWaveformProps> = ({ isLive, waveformPreview, sensorPowers }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [paused, setPaused] = useState(false);
  const [activeBand, setActiveBand] = useState<'MU' | 'BETA' | 'ALL'>('ALL');
  const [selectedChannel, setSelectedChannel] = useState<'ALL_CH' | 'C3' | 'C4' | 'Cz'>('ALL_CH');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Grid background lines
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 1;
      const gridStep = 30;
      for (let x = 0; x < width; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const allChannels = [
        { name: 'C3 (Left Motor)', color: '#0284c7', freq: 10, key: 'C3' },
        { name: 'C4 (Right Motor)', color: '#059669', freq: 10, key: 'C4' },
        { name: 'Cz (Central)', color: '#d97706', freq: 18, key: 'Cz' },
        { name: 'Fz (Frontal)', color: '#8b5cf6', freq: 12, key: 'Fz' },
        { name: 'Pz (Parietal)', color: '#ec4899', freq: 22, key: 'Pz' },
        { name: 'O1 (Occipital)', color: '#14b8a6', freq: 9, key: 'O1' },
      ];

      const channels = selectedChannel === 'ALL_CH'
        ? allChannels
        : allChannels.filter(c => c.key === selectedChannel);

      const chHeight = height / channels.length;

      channels.forEach((ch, idx) => {
        const centerY = idx * chHeight + chHeight / 2;

        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = ch.color;
        ctx.fillText(ch.name, 10, centerY - 8);

        ctx.beginPath();
        ctx.strokeStyle = ch.color;
        ctx.lineWidth = 1.5;

        if (isLive && waveformPreview && waveformPreview[idx] && waveformPreview[idx].length > 0) {
          const points = waveformPreview[idx];
          const xStep = width / points.length;
          for (let i = 0; i < points.length; i++) {
            const x = i * xStep;
            let val = points[i];
            if (activeBand === 'MU') val *= 1.35;
            if (activeBand === 'BETA') val *= 0.75;
            const y = centerY + val * 3.2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        } else {
          // Visual waveform when stream is waiting
          for (let x = 0; x < width; x++) {
            const t = (x + offset) * 0.05;
            let amp = isLive && !paused ? 12 : 2;

            if (activeBand === 'MU') amp *= 1.4;
            if (activeBand === 'BETA') amp *= 0.8;

            const y = centerY + Math.sin(t * (ch.freq / 10)) * amp + Math.sin(t * 0.5) * (amp * 0.3);

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      if (isLive && !paused) {
        offset += 2;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isLive, paused, activeBand, selectedChannel, waveformPreview]);

  // C3, Cz, C4 sensor power values for activity map
  const c3Pwr = sensorPowers ? sensorPowers['C3'] || 1.2 : 1.2;
  const czPwr = sensorPowers ? sensorPowers['Cz'] || 1.0 : 1.0;
  const c4Pwr = sensorPowers ? sensorPowers['C4'] || 1.2 : 1.2;

  return (
    <div className="panel-card flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Waves className="w-4 h-4 text-sky-500" />
            64-Channel EEG Oscilloscope & Sensor Activity
          </h2>

          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            {/* Band Filters */}
            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveBand('ALL')}
                className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                  activeBand === 'ALL' ? 'bg-sky-500 text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => setActiveBand('MU')}
                className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                  activeBand === 'MU' ? 'bg-sky-500 text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                μ (8-12Hz)
              </button>
              <button
                onClick={() => setActiveBand('BETA')}
                className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                  activeBand === 'BETA' ? 'bg-sky-500 text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                β (13-30Hz)
              </button>
            </div>

            <button
              onClick={() => setPaused(!paused)}
              className="p-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title={paused ? 'Resume Oscilloscope' : 'Pause Oscilloscope'}
            >
              {paused ? <Play className="w-3 h-3 text-emerald-500" /> : <Pause className="w-3 h-3 text-amber-500" />}
            </button>
          </div>
        </div>

        {/* Canvas Display */}
        <div className="inner-box p-1.5 flex items-center justify-center overflow-hidden mb-2">
          <canvas ref={canvasRef} width={450} height={180} className="w-full h-[180px] rounded" />
        </div>

        {/* EEG Motor Sensor Activity Map (C3, Cz, C4) */}
        <div className="inner-box p-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg">
          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1 font-bold">
              <Activity className="w-3 h-3 text-sky-500" /> Motor Cortex Sensor Power Map
            </span>
            <span>Contralateral ERD Signal</span>
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-center">
            <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded border border-slate-200 dark:border-slate-700">
              <span className="text-sky-600 dark:text-sky-400 font-bold block">C3 (Left Motor)</span>
              <span className="text-slate-800 dark:text-slate-200 font-extrabold">{c3Pwr} µV²</span>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded border border-slate-200 dark:border-slate-700">
              <span className="text-amber-600 dark:text-amber-400 font-bold block">Cz (Central)</span>
              <span className="text-slate-800 dark:text-slate-200 font-extrabold">{czPwr} µV²</span>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded border border-slate-200 dark:border-slate-700">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold block">C4 (Right Motor)</span>
              <span className="text-slate-800 dark:text-slate-200 font-extrabold">{c4Pwr} µV²</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
        <span>Fs: 500 Hz | Win: 2.0s</span>
        <span>Filter: 50Hz Notch + 8–30Hz Bandpass</span>
      </div>
    </div>
  );
};
