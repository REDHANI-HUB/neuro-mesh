import React from 'react';
import { Cpu, HardDrive, CheckCircle2, Clock, Server } from 'lucide-react';

interface Worker {
  worker_id: string;
  status: string;
  total_tasks_processed: number;
  avg_latency_ms: number;
  cpu_percent: number;
  memory_mb: number;
}

interface WorkerMonitorsProps {
  workers: Worker[];
}

export const WorkerMonitors: React.FC<WorkerMonitorsProps> = ({ workers }) => {
  const displayWorkers = workers.length > 0 ? workers : [
    { worker_id: 'worker-1', status: 'OFFLINE', total_tasks_processed: 0, avg_latency_ms: 0, cpu_percent: 0, memory_mb: 0 },
    { worker_id: 'worker-2', status: 'OFFLINE', total_tasks_processed: 0, avg_latency_ms: 0, cpu_percent: 0, memory_mb: 0 },
    { worker_id: 'worker-3', status: 'OFFLINE', total_tasks_processed: 0, avg_latency_ms: 0, cpu_percent: 0, memory_mb: 0 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Server className="w-4 h-4 text-sky-500" />
          Containerized Worker Nodes & Pipeline Monitor
        </h2>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          3 Microservice Workers
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayWorkers.map((w) => {
          const isOnline = w.status === 'ONLINE';

          return (
            <div key={w.worker_id} className="panel-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-sky-500" />
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {w.worker_id}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                    isOnline
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  }`}>
                    {isOnline ? '● ONLINE' : '○ OFFLINE'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-3 text-xs font-mono">
                  <div className="inner-box">
                    <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Tasks Done
                    </div>
                    <div className="text-base font-bold text-slate-900 dark:text-white">
                      {w.total_tasks_processed}
                    </div>
                  </div>

                  <div className="inner-box">
                    <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-amber-500" /> Avg Latency
                    </div>
                    <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                      {w.avg_latency_ms} ms
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Utilization Bars */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-[11px] font-mono">
                <div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400 mb-1">
                    <span>CPU Load</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{w.cpu_percent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-sky-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(4, w.cpu_percent))}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400 mb-1">
                    <span>RAM Memory</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{w.memory_mb} MB</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, (w.memory_mb / 512) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
