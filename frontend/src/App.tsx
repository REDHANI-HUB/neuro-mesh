import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { WorkerMonitors } from './components/WorkerMonitors';
import { PredictionDisplay } from './components/PredictionDisplay';
import { EEGWaveform } from './components/EEGWaveform';
import { MetricsPanel } from './components/MetricsPanel';
import { VirtualBCIDevice } from './components/VirtualBCIDevice';
import { PredictionHistory } from './components/PredictionHistory';
import { BenchmarkModal } from './components/BenchmarkModal';

const API_BASE = 'http://localhost:8000/api';
const WS_BASE = 'ws://localhost:8000/ws';

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('neuromesh_theme') as 'dark' | 'light') || 'dark';
  });

  const [streamStatus, setStreamStatus] = useState('STOPPED');
  const [datasetMode, setDatasetMode] = useState<'DEMO' | 'PHYSIONET'>('DEMO');
  const [wsConnected, setWsConnected] = useState(false);
  const [workers, setWorkers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    total_tasks: 0,
    completed_tasks: 0,
    failed_tasks: 0,
    queue_length: 0,
    avg_latency_ms: 0,
    throughput_fps: 0
  });

  const [currentPrediction, setCurrentPrediction] = useState({
    prediction: 'REST',
    confidence: 0.91,
    probabilities: { LEFT_HAND: 0.05, RIGHT_HAND: 0.04, REST: 0.91 },
    worker_id: 'worker-1',
    processing_time_ms: 22.4
  });

  const [history, setHistory] = useState<any[]>([]);
  const [benchmarkOpen, setBenchmarkOpen] = useState(false);

  // Sync Theme class on document.documentElement
  useEffect(() => {
    localStorage.setItem('neuromesh_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const fetchData = async () => {
    try {
      const resStatus = await fetch(`${API_BASE}/status`);
      if (resStatus.ok) {
        const data = await resStatus.json();
        setStreamStatus(data.stream_status);
      }

      const resWorkers = await fetch(`${API_BASE}/workers`);
      if (resWorkers.ok) {
        const data = await resWorkers.json();
        setWorkers(data);
      }

      const resMetrics = await fetch(`${API_BASE}/metrics`);
      if (resMetrics.ok) {
        const data = await resMetrics.json();
        setMetrics(data);
      }

      const resPreds = await fetch(`${API_BASE}/predictions?limit=15`);
      if (resPreds.ok) {
        const data = await resPreds.json();
        setHistory(data);
        if (data.length > 0) {
          const latest = data[0];
          setCurrentPrediction({
            prediction: latest.prediction,
            confidence: latest.confidence,
            probabilities: latest.probabilities || { LEFT_HAND: 0.05, RIGHT_HAND: 0.04, REST: 0.91 },
            worker_id: latest.worker_id,
            processing_time_ms: 22.0
          });
        }
      }
    } catch (err) {
      console.warn('API fetch notice:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);

    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket(WS_BASE);
      socket.onopen = () => setWsConnected(true);
      socket.onclose = () => setWsConnected(false);
      socket.onerror = () => setWsConnected(false);
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'PREDICTION_UPDATE') {
            const data = msg.data;
            setCurrentPrediction({
              prediction: data.prediction,
              confidence: data.confidence,
              probabilities: data.probabilities,
              worker_id: data.worker_id,
              processing_time_ms: data.processing_time_ms
            });
            fetchData();
          }
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };
    } catch (e) {
      console.warn('WS Init notice:', e);
    }

    return () => {
      clearInterval(interval);
      if (socket) socket.close();
    };
  }, []);

  const handleStartDemo = async () => {
    try {
      await fetch(`${API_BASE}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_name: `BCI Stream (${datasetMode})`, mode: 'DISTRIBUTED' })
      });
      setStreamStatus('LIVE');
      fetchData();
    } catch (e) {
      setStreamStatus('LIVE');
    }
  };

  const handleStopDemo = async () => {
    try {
      await fetch(`${API_BASE}/stop`, { method: 'POST' });
      setStreamStatus('STOPPED');
      fetchData();
    } catch (e) {
      setStreamStatus('STOPPED');
    }
  };

  const handleResetSession = async () => {
    try {
      await fetch(`${API_BASE}/reset`, { method: 'POST' });
      setStreamStatus('STOPPED');
      setHistory([]);
      fetchData();
    } catch (e) {
      setStreamStatus('STOPPED');
    }
  };

  const handleToggleDatasetMode = () => {
    setDatasetMode((prev) => (prev === 'DEMO' ? 'PHYSIONET' : 'DEMO'));
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
      <Header
        streamStatus={streamStatus}
        wsConnected={wsConnected}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenBenchmark={() => setBenchmarkOpen(true)}
      />

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        <ControlPanel
          streamStatus={streamStatus}
          datasetMode={datasetMode}
          onStartDemo={handleStartDemo}
          onStopDemo={handleStopDemo}
          onResetSession={handleResetSession}
          onToggleDatasetMode={handleToggleDatasetMode}
          onOpenBenchmark={() => setBenchmarkOpen(true)}
        />

        <WorkerMonitors workers={workers} />

        <div className="grid-3">
          <PredictionDisplay
            prediction={currentPrediction.prediction}
            confidence={currentPrediction.confidence}
            probabilities={currentPrediction.probabilities}
            lastWorker={currentPrediction.worker_id}
            processingTimeMs={currentPrediction.processing_time_ms}
          />

          <EEGWaveform isLive={streamStatus === 'LIVE'} />

          <VirtualBCIDevice prediction={currentPrediction.prediction} />
        </div>

        <MetricsPanel metrics={metrics} />

        <PredictionHistory history={history} />
      </main>

      <BenchmarkModal
        isOpen={benchmarkOpen}
        onClose={() => setBenchmarkOpen(false)}
      />

      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-card)] py-4 text-center text-xs font-mono text-[var(--text-muted)]">
        NeuroMesh BCI Platform &copy; 2026 — Distributed Real-Time Processing Architecture Project
      </footer>
    </div>
  );
}

export default App;
