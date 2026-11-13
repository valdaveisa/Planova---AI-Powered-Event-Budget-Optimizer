import { useState, useEffect } from 'react';
import api from '../services/api';

export default function BudgetTable() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/budget-items').then(response => {
      setItems(response.data);
    });
  }, []);

  const runAudit = (eventId) => {
    api.post('/audits', { event_id: eventId }).then(response => {
      alert('Audit completed! Check the logs/reports.');
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">RAB & AI Audit</h1>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Divisi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map(item => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.division.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Rp {(item.quantity * item.unit_price).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
