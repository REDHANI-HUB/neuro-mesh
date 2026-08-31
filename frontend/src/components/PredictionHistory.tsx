import React, { useState } from 'react';
import { History, Download, Search, CheckCircle, Cpu, Clock } from 'lucide-react';

interface HistoryItem {
  id: number;
  task_id: string;
  sequence_no: number;
  worker_id: string;
  prediction: string;
  confidence: number;
  probabilities: { [key: string]: number };
  timestamp: string;
}

interface PredictionHistoryProps {
  history: HistoryItem[];
}

export const PredictionHistory: React.FC<PredictionHistoryProps> = ({ history }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter(
    (item) =>
      item.task_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.worker_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.prediction?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCSV = () => {
    if (history.length === 0) return;

    const headers = ['Sequence', 'Task ID', 'Worker ID', 'Prediction', 'Confidence', 'Timestamp'];
    const rows = history.map((item) => [
      item.sequence_no,
      item.task_id,
      item.worker_id,
      item.prediction,
      item.confidence,
      item.timestamp
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `neuromesh_bci_predictions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-500" />
          <h2 className="text-sm font-bold text-[var(--text-main)] font-mono tracking-wider uppercase">
            Recent Task Prediction Audit Log
          </h2>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-inner)] border border-[var(--border-color)] text-[var(--text-main)] text-xs font-mono pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Export CSV Button */}
          <button
            onClick={exportCSV}
            disabled={history.length === 0}
            className="btn-base btn-secondary border border-[var(--border-color)] px-3 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-50"
            title="Export Prediction Logs as CSV"
          >
            <Download className="w-3.5 h-3.5 text-cyan-500" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto card-inner">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] text-[11px]">
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Task ID</th>
              <th className="py-2.5 px-3">Worker Node</th>
              <th className="py-2.5 px-3">Predicted Action</th>
              <th className="py-2.5 px-3">Confidence</th>
              <th className="py-2.5 px-3">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[var(--text-muted)] italic">
                  No prediction records yet. Click 'START DEMO STREAM' to begin processing.
                </td>
              </tr>
            ) : (
              filteredHistory.map((item) => {
                const getBadgeClass = (pred: string) => {
                  switch (pred) {
                    case 'LEFT_HAND': return 'text-cyan-500 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
                    case 'RIGHT_HAND': return 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
                    default: return 'text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/30';
                  }
                };

                return (
                  <tr key={item.id || item.task_id} className="border-b border-[var(--border-color)]/50 hover:bg-[var(--bg-card)]/50 transition-colors">
                    <td className="py-2 px-3 font-bold text-[var(--text-muted)]">{item.sequence_no}</td>
                    <td className="py-2 px-3 text-[var(--text-main)] truncate max-w-[160px]">{item.task_id}</td>
                    <td className="py-2 px-3 text-cyan-600 dark:text-cyan-400 font-bold">{item.worker_id}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${getBadgeClass(item.prediction)}`}>
                        {item.prediction}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold text-[var(--text-main)]">
                      {(item.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-[var(--text-muted)] text-[11px]">
                      {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Just now'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
