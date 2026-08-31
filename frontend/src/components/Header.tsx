import React from 'react';
import { Activity, Wifi, Radio, Sun, Moon, Zap } from 'lucide-react';

interface HeaderProps {
  streamStatus: string;
  wsConnected: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenBenchmark: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  streamStatus,
  wsConnected,
  theme,
  onToggleTheme,
  onOpenBenchmark
}) => {
  const isLive = streamStatus === 'LIVE';

  return (
    <header className="header-bar">
      {/* Left Branding */}
      <div className="header-left">
        <div style={{ backgroundColor: 'rgba(2, 132, 199, 0.15)', padding: '0.6rem', borderRadius: '10px', border: '1px solid rgba(2, 132, 199, 0.3)', color: '#0284c7' }}>
          <Activity style={{ width: '24px', height: '24px' }} />
        </div>
        <div>
          <div className="flex-row gap-2">
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
              NEUROMESH
            </h1>
            <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(2, 132, 199, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(2, 132, 199, 0.3)', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
              DISTRIBUTED BCI v1.0
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            Distributed Real-Time BCI Signal Processing & Worker Node Control Platform
          </p>
        </div>
      </div>

      {/* Right Action & Status Bar */}
      <div className="header-right">
        {/* WebSocket Status */}
        <div className="status-chip">
          <Wifi style={{ width: '14px', height: '14px', color: wsConnected ? '#10b981' : '#ef4444' }} />
          <span style={{ color: 'var(--text-muted)' }}>WS:</span>
          <span style={{ fontWeight: 700, color: wsConnected ? '#10b981' : '#ef4444' }}>
            {wsConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>

        {/* EEG Stream Status */}
        <div className="status-chip">
          <Radio className={isLive ? 'animated-pulse' : ''} style={{ width: '14px', height: '14px', color: isLive ? '#10b981' : '#f59e0b' }} />
          <span style={{ color: 'var(--text-muted)' }}>STREAM:</span>
          <span style={{ fontWeight: 700, color: isLive ? '#10b981' : '#f59e0b' }}>
            {streamStatus}
          </span>
        </div>

        {/* Benchmark Button */}
        <button onClick={onOpenBenchmark} className="btn-base btn-info">
          <Zap style={{ width: '14px', height: '14px' }} />
          <span>BENCHMARK</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="btn-base btn-secondary"
          style={{ padding: '0.55rem', borderRadius: '8px' }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun style={{ width: '16px', height: '16px', color: '#fbbf24' }} />
          ) : (
            <Moon style={{ width: '16px', height: '16px', color: '#4f46e5' }} />
          )}
        </button>
      </div>
    </header>
  );
};
