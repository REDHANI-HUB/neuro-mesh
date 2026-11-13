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

const API_BASE = '/api';

const WS_BASE = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('neuromesh_theme') as 'dark' | 'light') || 'dark';
  });

  const [backendOnline, setBackendOnline] = useState(false);
  const [systemHealth, setSystemHealth] = useState('ONLINE');
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
    prediction: 'N/A',
    confidence: 0,
    probabilities: { LEFT_HAND: 0, RIGHT_HAND: 0, REST: 0 },
    worker_id: 'N/A',
    processing_time_ms: 0
  });

  const [latestWaveform, setLatestWaveform] = useState<number[][] | null>(null);
  const [latestSensorPowers, setLatestSensorPowers] = useState<{ [key: string]: number } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [benchmarkOpen, setBenchmarkOpen] = useState(false);

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
        setBackendOnline(true);
        setStreamStatus(data.stream_status);
        setSystemHealth(data.system_health || 'ONLINE');
        if (data.dataset_mode) {
          setDatasetMode(data.dataset_mode);
        }
      } else {
        setBackendOnline(false);
        setStreamStatus('OFFLINE');
        setSystemHealth('OFFLINE');
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
        if (data.length > 0 && currentPrediction.prediction === 'N/A') {
          const latest = data[0];
          setCurrentPrediction({
            prediction: latest.prediction,
            confidence: latest.confidence,
            probabilities: latest.probabilities || { LEFT_HAND: 0, RIGHT_HAND: 0, REST: 0 },
            worker_id: latest.worker_id,
            processing_time_ms: 0
          });
        }
      }
    } catch (err) {
      setBackendOnline(false);
      setStreamStatus('OFFLINE');
      setSystemHealth('OFFLINE');
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
            if (data.waveform_preview) {
              setLatestWaveform(data.waveform_preview);
            }
            if (data.sensor_powers) {
              setLatestSensorPowers(data.sensor_powers);
            }
            setHistory((prev) => {
              const newItem = {
                id: data.sequence_no || Date.now(),
                task_id: data.task_id,
                sequence_no: data.sequence_no,
                worker_id: data.worker_id,
                prediction: data.prediction,
                confidence: data.confidence,
                probabilities: data.probabilities,
                timestamp: data.timestamp || new Date().toISOString()
              };
              const exists = prev.some((x) => x.task_id === data.task_id);
              if (exists) return prev;
              return [newItem, ...prev].slice(0, 50);
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
      fetchData();
    }
  };

  const handleStopDemo = async () => {
    try {
      await fetch(`${API_BASE}/stop`, { method: 'POST' });
      setStreamStatus('STOPPED');
      fetchData();
    } catch (e) {
      fetchData();
    }
  };

  const handleResetSession = async () => {
    try {
      await fetch(`${API_BASE}/reset`, { method: 'POST' });
      setStreamStatus('STOPPED');
      setHistory([]);
      setCurrentPrediction({
        prediction: 'N/A',
        confidence: 0,
        probabilities: { LEFT_HAND: 0, RIGHT_HAND: 0, REST: 0 },
        worker_id: 'N/A',
        processing_time_ms: 0
      });
      setLatestWaveform(null);
      setLatestSensorPowers(null);
      fetchData();
    } catch (e) {
      fetchData();
    }
  };

  const handleToggleDatasetMode = async () => {
    const nextMode = datasetMode === 'DEMO' ? 'PHYSIONET' : 'DEMO';
    try {
      const res = await fetch(`${API_BASE}/dataset_mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: nextMode })
      });
      if (res.ok) {
        setDatasetMode(nextMode);
      }
    } catch (e) {
      setDatasetMode(nextMode);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-app)] flex flex-col transition-colors duration-300">
      <Header
        streamStatus={streamStatus}
        wsConnected={wsConnected}
        backendOnline={backendOnline}
        systemHealth={systemHealth}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenBenchmark={() => setBenchmarkOpen(true)}
      />

      <main className="main-content">
        <ControlPanel
          streamStatus={streamStatus}
          datasetMode={datasetMode}
          backendOnline={backendOnline}
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

          <EEGWaveform
            isLive={streamStatus === 'LIVE'}
            waveformPreview={latestWaveform}
            sensorPowers={latestSensorPowers}
          />

          <VirtualBCIDevice prediction={currentPrediction.prediction} />
        </div>

        <MetricsPanel metrics={metrics} />

        <PredictionHistory history={history} />
      </main>

      <BenchmarkModal
        isOpen={benchmarkOpen}
        onClose={() => setBenchmarkOpen(false)}
      />

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 text-center text-xs font-mono text-slate-500 dark:text-slate-400">
        NeuroMesh BCI Platform &copy; 2026 — Distributed Real-Time Processing Architecture Prototype
      </footer>
    </div>
  );
}

export default App;
