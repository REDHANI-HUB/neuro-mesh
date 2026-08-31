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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="flex-between">
        <h2 style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Server style={{ width: '16px', height: '16px', color: 'var(--accent-cyan)' }} />
          Containerized Worker Nodes & Distributed Pipeline Monitor
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          3 Independent Worker Microservices
        </span>
      </div>

      <div className="grid-3">
        {displayWorkers.map((w) => {
          const isOnline = w.status === 'ONLINE';

          return (
            <div key={w.worker_id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="flex-between" style={{ marginBottom: '0.85rem' }}>
                  <div className="flex-row gap-2">
                    <Cpu style={{ width: '18px', height: '18px', color: 'var(--accent-cyan)' }} />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: '1rem' }}>
                      {w.worker_id}
                    </span>
                  </div>
                  <span className={isOnline ? 'badge-online' : 'badge-offline'}>
                    {isOnline ? '● ONLINE' : '○ OFFLINE'}
                  </span>
                </div>

                <div className="grid-2" style={{ marginBottom: '0.85rem' }}>
                  <div className="card-inner">
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                      <CheckCircle2 style={{ width: '14px', height: '14px', color: '#10b981' }} /> Tasks Done
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                      {w.total_tasks_processed}
                    </div>
                  </div>

                  <div className="card-inner">
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                      <Clock style={{ width: '14px', height: '14px', color: '#f59e0b' }} /> Avg Latency
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace' }}>
                      {w.avg_latency_ms} ms
                    </div>
                  </div>
                </div>
              </div>

              {/* Resource Load Bar */}
              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.725rem', fontFamily: 'JetBrains Mono, monospace' }}>
                <div>
                  <div className="flex-between" style={{ marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                    <span>CPU Load</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{w.cpu_percent}%</span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: 'var(--bg-inner)', height: '6px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <div
                      style={{
                        backgroundColor: 'var(--accent-cyan)',
                        height: '100%',
                        width: `${Math.min(100, Math.max(5, w.cpu_percent))}%`,
                        transition: 'width 0.5s ease'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex-between" style={{ marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                    <span>RAM Memory</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{w.memory_mb} MB</span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: 'var(--bg-inner)', height: '6px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <div
                      style={{
                        backgroundColor: '#a855f7',
                        height: '100%',
                        width: `${Math.min(100, (w.memory_mb / 512) * 100)}%`,
                        transition: 'width 0.5s ease'
                      }}
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
