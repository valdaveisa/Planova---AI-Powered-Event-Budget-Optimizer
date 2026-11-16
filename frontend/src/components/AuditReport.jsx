import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export default function AuditReport({ eventId }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [eventId]);

  const fetchReports = () => {
    api.get('/audits').then(res => {
      const data = eventId ? res.data.filter(r => r.event_id == eventId) : res.data;
      setReports(data);
    });
  };

  const runAudit = () => {
    if (!eventId) return toast.error('Select event first.');
    setLoading(true);
    api.post('/audits', { event_id: eventId })
      .then(() => {
        fetchReports();
        toast.success('Audit completed!');
        setLoading(false);
      })
      .catch(() => {
        toast.error('Audit failed');
        setLoading(false);
      });
  };

  const deleteAudit = async (auditId) => {
    if (!confirm('Hapus laporan audit ini?')) return;
    try {
      await api.delete(`/audits/${auditId}`);
      toast.success('Audit report deleted!');
      fetchReports();
    } catch (err) {
      toast.error('Gagal hapus audit');
    }
  };

  return (
    <div className="card h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">AI Audit Intelligence</h2>
        <button 
          onClick={runAudit} 
          disabled={loading}
          className="btn btn-accent text-xs"
        >
          {loading ? 'Analyzing...' : 'Run Audit'}
        </button>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {reports.length === 0 && <p className="text-center text-slate-400 py-10 text-sm">No audit history.</p>}
        {reports.map(report => {
          let suggestion = {};
          try {
            suggestion = JSON.parse(report.ai_suggestion);
          } catch {
            suggestion = { summary: report.ai_suggestion };
          }

          return (
            <div key={report.id} className="p-4 rounded-lg bg-slate-50 border border-slate-100 relative group">
              <button 
                onClick={() => deleteAudit(report.id)}
                className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(report.created_at).toLocaleDateString()}</span>
                <span className="badge badge-approved text-[8px]">VALID</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 mb-4">{suggestion.summary}</p>
              
              {suggestion.warnings && suggestion.warnings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Anomalies Detected:</p>
                  <ul className="space-y-1">
                    {suggestion.warnings.map((w, idx) => (
                      <li key={idx} className="text-[11px] text-slate-500 flex gap-2">
                        <span className="text-red-400">●</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
