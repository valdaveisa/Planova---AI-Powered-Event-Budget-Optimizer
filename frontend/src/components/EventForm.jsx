import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export default function EventForm({ onCreated }) {
  const [formData, setFormData] = useState({ name: '', total_budget: '', date: '' });
  const [show, setShow] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events', formData);
      setFormData({ name: '', total_budget: '', date: '' });
      setShow(false);
      if (onCreated) onCreated();
      toast.success('Event created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating event');
    }
  };

  return (
    <div>
      <button onClick={() => setShow(!show)} className="btn btn-primary text-sm">
        {show ? 'Cancel' : 'New Event'}
      </button>

      {show && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Initialize New Event</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="input-group">
                <label>Event Name</label>
                <input 
                  className="input-field"
                  placeholder="e.g. Summer Tech Festival 2026" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label>Initial Budget</label>
                  <input 
                    type="number" className="input-field"
                    placeholder="0" 
                    value={formData.total_budget} 
                    onChange={e => setFormData({...formData, total_budget: e.target.value})}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Event Date</label>
                  <input 
                    type="date" className="input-field"
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn btn-primary flex-1">Create Event</button>
                <button type="button" onClick={() => setShow(false)} className="btn bg-slate-100 flex-1">Discard</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
