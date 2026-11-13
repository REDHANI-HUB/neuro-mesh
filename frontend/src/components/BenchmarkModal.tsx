
import React, { useState } from 'react';
import { X, Play, Zap, Info, Server, Cpu, AlertTriangle, Layers } from 'lucide-react';

interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ScalabilityItem {
  workers: number;
  time_sec: number;
  speedup: number;
  efficiency: number;
}

export const BenchmarkModal: React.FC<BenchmarkModalProps> = ({ isOpen, onClose }) => {
  const [running, setRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [results, setResults] = useState<{
    centralizedTimeSec: number;
    distributedTimeSec: number;
    speedup: number;
    efficiency: number;
    tasksProcessed: number;
    scalabilityMatrix: ScalabilityItem[];
  } | null>(null);

  if (!isOpen) return null;

  const runBenchmark = async () => {
    setRunning(true);
    setErrorMsg(null);
    setResults(null);

    try {
      const res = await fetch('/api/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_count: 30 })
      });

      if (res.ok) {
        const data = await res.json();

        if (data.status === 'UNAVAILABLE') {
          setErrorMsg(data.message || 'Benchmark unavailable. Redis message broker or worker nodes are offline.');
        } else {
          setResults({
            centralizedTimeSec: data.centralized_time_sec,
            distributedTimeSec: data.distributed_time_sec,
            speedup: data.speedup,
            efficiency: data.efficiency,
            tasksProcessed: data.tasks_processed,
            scalabilityMatrix: data.scalability_matrix || []
          });
        }
      } else {
        setErrorMsg('Benchmark API unavailable. Ensure python start_local.py is running.');
      }
    } catch (e: any) {
      setErrorMsg(`Benchmark unavailable: ${e.message || 'Could not connect to backend server.'}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="panel-card w-full max-w-2xl relative font-sans text-slate-900 dark:text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-sky-500 font-mono mb-1 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Single-Node vs. Distributed Parallel Benchmark
        </h2>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Measures wall-clock execution speedup ($S_p = T_1 / T_p$) comparing 1 Centralized Process vs. 3 Redis Worker Containers.
        </p>

        {!results && !running && !errorMsg && (
          <div className="text-center py-8 inner-box p-6 space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">
              Click below to execute an empirical 30-task benchmark measuring single-threaded sequential execution against parallel Redis worker node distribution.
            </p>

            <button
              onClick={runBenchmark}
              className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-lg text-xs font-mono font-bold text-white bg-sky-600 hover:bg-sky-500 transition-colors shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>RUN BENCHMARK EVALUATION</span>
            </button>
          </div>
        )}

        {running && (
          <div className="text-center py-12 inner-box font-mono space-y-3">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-sky-500 font-bold">Executing Empirical Task Benchmarks...</p>
            <p className="text-[11px] text-slate-400">Processing 30 EEG task chunks across Workers 1-3...</p>
          </div>
        )}

        {errorMsg && (
          <div className="inner-box p-5 border-rose-500/30 bg-rose-500/10 text-center font-mono space-y-3 my-4">
            <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto" />
            <div className="text-xs font-bold text-rose-600 dark:text-rose-400">Benchmark Unavailable</div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">{errorMsg}</p>

            <button
              onClick={runBenchmark}
              className="px-4 py-1.5 rounded text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-sky-500 transition-colors"
            >
              RETRY BENCHMARK
            </button>
          </div>
        )}

        {results && !running && (
          <div className="space-y-4">
            {/* Primary Time Comparison */}
            <div className="grid grid-cols-2 gap-4 font-mono">
              <div className="inner-box p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                  <Server className="w-3.5 h-3.5 text-rose-500" /> Centralized (1 Process)
                </div>

                <div className="text-2xl font-bold text-slate-900 dark:text-white">{results.centralizedTimeSec} s</div>
                <div className="text-[11px] text-slate-400 mt-1">Sequential Processing Time (T₁)</div>
              </div>

              <div className="inner-box p-4 border-emerald-500/40">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                  <Cpu className="w-3.5 h-3.5 text-emerald-500" /> Distributed (3 Workers)
                </div>

                <div className="text-2xl font-bold text-emerald-500">{results.distributedTimeSec} s</div>
                <div className="text-[11px] text-slate-400 mt-1">Parallel Processing Time (Tₚ)</div>
              </div>
            </div>

            {/* Speedup & Efficiency Badges */}
            <div className="grid grid-cols-2 gap-3 font-mono text-center">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-bold">
                  Speedup Ratio (Sₚ = T₁ / Tₚ)
                </span>

                <div className="text-3xl font-extrabold text-emerald-500 dark:text-emerald-400 my-1">{results.speedup}x</div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {results.centralizedTimeSec}s / {results.distributedTimeSec}s = {results.speedup}x
                </p>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3">
                <span className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider font-bold">
                  Parallel Efficiency (E = Sₚ / N)
                </span>

                <div className="text-3xl font-extrabold text-purple-500 dark:text-purple-400 my-1">
                  {(results.efficiency * 100).toFixed(0)}%
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {results.speedup} / 3 Workers = {(results.efficiency * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Worker Scalability Comparison Matrix */}
            {results.scalabilityMatrix.length > 0 && (
              <div className="inner-box p-3 font-mono text-xs">
                <div className="text-slate-500 dark:text-slate-400 text-[11px] font-bold mb-2 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-sky-500" /> Worker Scalability Comparison Table:
                </div>

                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px]">
                      <th className="py-1 px-2">Active Workers</th>
                      <th className="py-1 px-2">Wall-Clock Time</th>
                      <th className="py-1 px-2">Measured Speedup</th>
                      <th className="py-1 px-2">Parallel Efficiency</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-[11px]">
                    {results.scalabilityMatrix.map((item, idx) => (
                      <tr key={idx} className={item.workers === 3 ? 'bg-sky-500/10 font-bold' : ''}>
                        <td className="py-1.5 px-2">{item.workers} Worker{item.workers > 1 ? 's' : ''}</td>
                        <td className="py-1.5 px-2">{item.time_sec} s</td>
                        <td className="py-1.5 px-2 text-emerald-600 dark:text-emerald-400">{item.speedup}x</td>
                        <td className="py-1.5 px-2 text-purple-600 dark:text-purple-400">{(item.efficiency * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="inner-box p-3 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <span>
                <strong>Academic Benchmark Note:</strong> Empirical benchmarks compare single-core sequential iteration against multi-worker queue concurrency without hardcoded equations.
              </span>
            </div>

            <div className="flex justify-end">
              <button
                onClick={runBenchmark}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-bold text-white bg-sky-600 hover:bg-sky-500 transition-colors"
              >
                RE-RUN BENCHMARK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
