import React from 'react';
import { Activity, Layers, CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react';

interface MetricsPanelProps {
  metrics: {
    total_tasks: number;
    completed_tasks: number;
    failed_tasks: number;
    queue_length: number;
    avg_latency_ms: number;
    throughput_fps: number;
  };
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  const statCards = [
    {
      label: 'Total Tasks Created',
      value: metrics.total_tasks,
      icon: Layers,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10 border-cyan-500/30'
    },
    {
      label: 'Completed Tasks',
      value: metrics.completed_tasks,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30'
    },
    {
      label: 'Failed Tasks',
      value: metrics.failed_tasks,
      icon: AlertCircle,
      color: metrics.failed_tasks > 0 ? 'text-rose-500' : 'text-[var(--text-muted)]',
      bgColor: metrics.failed_tasks > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-[var(--bg-inner)] border-[var(--border-color)]'
    },
    {
      label: 'Redis Queue Length',
      value: metrics.queue_length,
      icon: Activity,
      color: metrics.queue_length > 0 ? 'text-amber-500' : 'text-emerald-500',
      bgColor: 'bg-amber-500/10 border-amber-500/30'
    },
    {
      label: 'Avg Worker Latency',
      value: `${metrics.avg_latency_ms} ms`,
      icon: Clock,
      color: 'text-indigo-500 dark:text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/30'
    },
    {
      label: 'System Throughput',
      value: `${metrics.throughput_fps} fps`,
      icon: Zap,
      color: 'text-purple-500 dark:text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/30'
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-[var(--text-main)] font-mono tracking-wider uppercase flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          Real-Time Performance Metrics & Queue Analytics
        </h2>
        <span className="text-xs text-[var(--text-muted)] font-mono">Continuous Telemetry</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, idx) => {
          const IconComponent = stat.icon;

          return (
            <div key={idx} className="card p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                  {stat.label}
                </span>
                <div className={`p-1 rounded-md border ${stat.bgColor} ${stat.color}`}>
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className={`text-xl font-mono font-extrabold text-[var(--text-main)]`}>
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
