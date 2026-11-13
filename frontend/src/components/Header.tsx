import React from 'react';
import { Activity, Wifi, Radio, Sun, Moon, Zap, Server, Database, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  streamStatus: string;
  wsConnected: boolean;
  backendOnline: boolean;
  systemHealth: string;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenBenchmark: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  streamStatus,
  wsConnected,
  backendOnline,
  systemHealth,
  theme,
  onToggleTheme,
  onOpenBenchmark
}) => {
  const isLive = streamStatus === 'LIVE';

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3.5 transition-colors">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left Academic Branding */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                NEUROMESH
              </h1>
              <span className="text-[11px] font-semibold font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                DISTRIBUTED BCI v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distributed Real-Time BCI Processing & Motor Imagery Command Platform
            </p>
          </div>
        </div>

        {/* Right Telemetry Status Pills */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
            <Server className={`w-3.5 h-3.5 ${backendOnline ? 'text-emerald-500' : 'text-rose-500'}`} />
            <span>API:</span>
            <span className={`font-bold ${backendOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {backendOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
            <Wifi className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-500' : 'text-amber-500'}`} />
            <span>WS:</span>
            <span className={`font-bold ${wsConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {wsConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
            <Radio className={`w-3.5 h-3.5 ${isLive ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
            <span>STREAM:</span>
            <span className={`font-bold ${isLive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {streamStatus}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
            <ShieldCheck className={`w-3.5 h-3.5 ${systemHealth === 'ONLINE' ? 'text-emerald-500' : 'text-amber-500'}`} />
            <span>HEALTH:</span>
            <span className={`font-bold ${systemHealth === 'ONLINE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {systemHealth}
            </span>
          </div>

          <button
            onClick={onOpenBenchmark}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-white bg-sky-600 hover:bg-sky-500 transition-colors shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>BENCHMARK</span>
          </button>

          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
