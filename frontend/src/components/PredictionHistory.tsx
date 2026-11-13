import React, { useState } from 'react';
import { History, Download, Search } from 'lucide-react';

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
    <div className="panel-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-sky-500" />
          <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-800 dark:text-slate-200">
            Task Prediction Audit Log
          </h2>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-mono pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            onClick={exportCSV}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-500 transition-colors disabled:opacity-50"
            title="Export Logs as CSV"
          >
            <Download className="w-3.5 h-3.5 text-sky-500" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      <div className="inner-box overflow-x-auto p-0 border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-[11px]">
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Task ID</th>
              <th className="py-2.5 px-3">Worker Node</th>
              <th className="py-2.5 px-3">Action</th>
              <th className="py-2.5 px-3">Confidence</th>
              <th className="py-2.5 px-3">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                  No prediction records yet. Click 'START DEMO STREAM' to begin processing tasks.
                </td>
              </tr>
            ) : (
              filteredHistory.map((item) => {
                const getBadgeClass = (pred: string) => {
                  switch (pred) {
                    case 'LEFT_HAND': return 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30';
                    case 'RIGHT_HAND': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
                    default: return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30';
                  }
                };

                return (
                  <tr key={item.id || item.task_id} className="border-b border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 font-bold text-slate-400">{item.sequence_no}</td>
                    <td className="py-2 px-3 text-slate-900 dark:text-slate-100 truncate max-w-[160px]">{item.task_id}</td>
                    <td className="py-2 px-3 text-sky-600 dark:text-sky-400 font-bold">{item.worker_id}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${getBadgeClass(item.prediction)}`}>
                        {item.prediction}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">
                      {(item.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-[11px]">
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
