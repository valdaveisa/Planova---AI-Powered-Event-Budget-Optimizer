import { useState, useEffect } from 'react';
import api from '../services/api';
import BudgetSummary from '../components/BudgetSummary';
import AuditReport from '../components/AuditReport';
import EventForm from '../components/EventForm';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const fetchEvents = () => {
    api.get('/events').then(res => {
      setEvents(res.data);
      if (res.data.length > 0 && !selectedEventId) {
        setSelectedEventId(res.data[0].id);
      }
    });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEventCreated = () => {
    toast.success('Event created!');
    fetchEvents();
  };

  return (
    <div className="fade-in-up">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Financial Oversight</h1>
          <p className="text-slate-500 text-sm">Monitor and optimize your event's cash flow.</p>
        </div>
        <EventForm onCreated={fetchEvents} />
      </header>

      <div className="card mb-8">
        <div className="input-group mb-0 max-w-xs">
          <label>Select Active Event</label>
          <select
            className="input-field"
            value={selectedEventId || ''}
            onChange={e => setSelectedEventId(e.target.value)}
          >
            {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      {selectedEventId && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <BudgetSummary eventId={selectedEventId} />
          </div>
          <div className="lg:col-span-5">
            <AuditReport eventId={selectedEventId} />
          </div>
        </div>
      )}
    </div>
  );
}
