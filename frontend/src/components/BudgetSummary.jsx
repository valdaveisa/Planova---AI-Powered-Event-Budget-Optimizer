import { useState, useEffect } from 'react';
import api from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function BudgetSummary({ eventId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/budget-summary?event_id=${eventId || ''}`).then(response => {
      setSummary(response.data);
      setLoading(false);
    });
  }, [eventId]);

  if (loading) return <div>Loading...</div>;

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
  const data = summary.divisions.map(d => ({ name: d.name, value: d.total_spent }));

  return (
    <div className="space-y-6">
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total Budget</p>
          <p className="stat-value">Rp {summary.event.total_budget.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Spent</p>
          <p className="stat-value text-blue-600">Rp {summary.event.total_spent.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Remaining</p>
          <p className="stat-value">Rp {summary.event.remaining_budget.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Spending Breakdown</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold mb-6">Division Distribution</h2>
          <div className="space-y-6">
            {summary.divisions.map(d => (
              <div key={d.id}>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-sm">{d.name}</span>
                  <span className="text-sm font-bold">{d.usage_percent}%</span>
                </div>
                <div className="progress-container">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${Math.min(d.usage_percent, 100)}%`,
                      backgroundColor: d.usage_percent > 90 ? '#EF4444' : '#3B82F6'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
