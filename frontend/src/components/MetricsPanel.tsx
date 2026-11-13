import React, { useEffect, useState } from 'react';
import { Activity, Layers, CheckCircle2, AlertCircle, Clock, Zap, Target, Award } from 'lucide-react';

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

interface ModelInfo {
  model_name: string;
  model_version: string;
  training_dataset: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

  useEffect(() => {
    fetch('/api/model_info')
      .then(res => res.json())
      .then(data => setModelInfo(data))
      .catch(() => {});
  }, []);

  const statCards = [
    {
      label: 'Total Tasks Created',
      value: metrics.total_tasks,
      icon: Layers,
      color: 'text-sky-500',
      bgColor: 'bg-sky-500/10 border-sky-500/30'
    },
    {
      label: 'Completed Tasks',
      value: metrics.completed_tasks,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30'
    },
    {
      label: 'Failed / Retried',
      value: metrics.failed_tasks,
      icon: AlertCircle,
      color: metrics.failed_tasks > 0 ? 'text-rose-500' : 'text-slate-400',
      bgColor: metrics.failed_tasks > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
    },
    {
      label: 'Redis Queue Depth',
      value: metrics.queue_length,
      icon: Activity,
      color: metrics.queue_length > 0 ? 'text-amber-500' : 'text-emerald-500',
      bgColor: 'bg-amber-500/10 border-amber-500/30'
    },
    {
      label: 'Avg Worker Latency',
      value: `${metrics.avg_latency_ms} ms`,
      icon: Clock,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10 border-indigo-500/30'
    },
    {
      label: 'System Throughput',
      value: `${metrics.throughput_fps} /s`,
      icon: Zap,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10 border-purple-500/30'
    }
  ];

  return (
    <div className="space-y-3">
      {/* Model Performance Bar */}
      {modelInfo && (
        <div className="panel-card bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-slate-800 dark:text-slate-200">ML Model Evaluation Metrics:</span>
              <span className="text-slate-500 dark:text-slate-400">[{modelInfo.model_name} {modelInfo.model_version}]</span>
            </div>

            <div className="flex items-center gap-4">
              <div>Accuracy: <strong className="text-emerald-600 dark:text-emerald-400">{(modelInfo.accuracy * 100).toFixed(1)}%</strong></div>
              <div>Precision: <strong className="text-sky-600 dark:text-sky-400">{(modelInfo.precision * 100).toFixed(1)}%</strong></div>
              <div>Recall: <strong className="text-purple-600 dark:text-purple-400">{(modelInfo.recall * 100).toFixed(1)}%</strong></div>
              <div>F1 Score: <strong className="text-amber-600 dark:text-amber-400">{(modelInfo.f1_score * 100).toFixed(1)}%</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* Telemetry Stat Grid */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          Real-Time Distributed Telemetry & Queue Analytics
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, idx) => {
          const IconComponent = stat.icon;

          return (
            <div key={idx} className="panel-card p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                  {stat.label}
                </span>
                <div className={`p-1 rounded border ${stat.bgColor} ${stat.color}`}>
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
