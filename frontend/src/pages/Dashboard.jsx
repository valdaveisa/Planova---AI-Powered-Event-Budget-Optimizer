import { useState, useEffect } from 'react';
import api from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function Dashboard() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.get('/events').then(response => {
      setEvents(response.data);
    });
  }, []);

  const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map(event => {
          const data = event.divisions.map(d => ({
            name: d.name,
            value: d.budgetItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)
          }));

          return (
            <div key={event.id} className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-medium text-gray-900">{event.name}</h2>
              <p className="text-sm text-gray-500 mb-4">{new Date(event.date).toLocaleDateString()}</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {data.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
