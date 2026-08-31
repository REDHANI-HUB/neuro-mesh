import React, { useRef, useEffect, useState } from 'react';
import { Activity, Play, Pause, Waves, Filter } from 'lucide-react';

interface EEGWaveformProps {
  isLive: boolean;
}

export const EEGWaveform: React.FC<EEGWaveformProps> = ({ isLive }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [paused, setPaused] = useState(false);
  const [activeBand, setActiveBand] = useState<'MU' | 'BETA' | 'ALL'>('ALL');

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
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.15)';
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

      const channels = [
        { name: 'C3 (Motor L)', color: '#0284c7', freq: 10 },
        { name: 'C4 (Motor R)', color: '#059669', freq: 10 },
        { name: 'Cz (Central)', color: '#d97706', freq: 18 },
        { name: 'Fz (Frontal)', color: '#8b5cf6', freq: 12 },
        { name: 'Pz (Parietal)', color: '#ec4899', freq: 22 },
        { name: 'O1 (Occipital)', color: '#14b8a6', freq: 9 },
      ];

      const chHeight = height / channels.length;

      channels.forEach((ch, idx) => {
        const centerY = idx * chHeight + chHeight / 2;

        // Channel Label
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = ch.color;
        ctx.fillText(ch.name, 10, centerY - 10);

        // Draw Signal Line
        ctx.beginPath();
        ctx.strokeStyle = ch.color;
        ctx.lineWidth = 1.5;

        for (let x = 0; x < width; x++) {
          const t = (x + offset) * 0.05;
          let amp = isLive && !paused ? 12 : 1;

          if (activeBand === 'MU') amp *= 1.4;
          if (activeBand === 'BETA') amp *= 0.8;

          const y = centerY + Math.sin(t * (ch.freq / 10)) * amp + Math.sin(t * 0.5) * (amp * 0.3);

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
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
  }, [isLive, paused, activeBand]);

  return (
    <div className="card flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-[var(--text-main)] font-mono tracking-wider uppercase flex items-center gap-2">
          <Waves className="w-4 h-4 text-cyan-500" />
          Live 64-Channel EEG Oscilloscope
        </h2>

        <div className="flex items-center gap-2">
          {/* Band Filter Chips */}
          <div className="flex items-center gap-1 font-mono text-[10px] bg-[var(--bg-inner)] p-1 rounded-lg border border-[var(--border-color)]">
            <button
              onClick={() => setActiveBand('ALL')}
              className={`px-1.5 py-0.5 rounded font-bold ${
                activeBand === 'ALL' ? 'bg-cyan-500 text-white' : 'text-[var(--text-muted)]'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setActiveBand('MU')}
              className={`px-1.5 py-0.5 rounded font-bold ${
                activeBand === 'MU' ? 'bg-cyan-500 text-white' : 'text-[var(--text-muted)]'
              }`}
            >
              $\mu$ (8-12Hz)
            </button>
            <button
              onClick={() => setActiveBand('BETA')}
              className={`px-1.5 py-0.5 rounded font-bold ${
                activeBand === 'BETA' ? 'bg-cyan-500 text-white' : 'text-[var(--text-muted)]'
              }`}
            >
              $\beta$ (13-30Hz)
            </button>
          </div>

          {/* Pause / Play Visualizer Toggle */}
          <button
            onClick={() => setPaused(!paused)}
            className="p-1 rounded bg-[var(--bg-inner)] border border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--border-hover)]"
            title={paused ? 'Resume Waveform' : 'Pause Waveform'}
          >
            {paused ? <Play className="w-3.5 h-3.5 text-emerald-500" /> : <Pause className="w-3.5 h-3.5 text-amber-500" />}
          </button>
        </div>
      </div>

      <div className="card-inner p-2 flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} width={450} height={230} className="w-full h-[230px] rounded" />
      </div>

      <div className="mt-3 pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
        <span>Fs: 500 Hz | Win: 2.0s</span>
        <span>Filter: Bandpass 8–30 Hz</span>
      </div>
    </div>
  );
};
