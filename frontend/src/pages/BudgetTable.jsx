import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export default function BudgetTable() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newItem, setNewItem] = useState({
    division_id: '',
    description: '',
    quantity: 1,
    unit_price: 0,
    vendor_name: '',
    status: 'Draft'
  });
  const [editingItem, setEditingItem] = useState(null);

  const startEdit = (item) => {
    setEditingItem({ ...item });
  };

  const updateItem = async () => {
    try {
      await api.put(`/budget-items/${editingItem.id}`, editingItem);
      toast.success('Item updated!');
      setEditingItem(null);
      api.get(`/events/${selectedEventId}`).then(res => setDivisions(res.data.divisions));
    } catch (err) {
      toast.error('Failed to update item');
    }
  };


  useEffect(() => {
    api.get('/events').then(res => {
      setEvents(res.data);
      if (res.data.length > 0) setSelectedEventId(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      setLoading(true);
      api.get(`/events/${selectedEventId}`).then(res => {
        setDivisions(res.data.divisions || []);
        setLoading(false);
      });
    }
  }, [selectedEventId]);

  const [newDivision, setNewDivision] = useState({ name: '', budget_limit: 0 });

  const handleAddDivision = async (e) => {
    e.preventDefault();
    if (!selectedEventId) return;
    try {
      await api.post('/divisions', { ...newDivision, event_id: selectedEventId });
      toast.success('Division added successfully!');
      setNewDivision({ name: '', budget_limit: 0 });
      api.get(`/events/${selectedEventId}`).then(res => setDivisions(res.data.divisions));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add division');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.division_id) return toast.error('Pilih divisi!');
    try {
      await api.post('/budget-items', newItem);
      toast.success('Item added!');
      setNewItem({ ...newItem, description: '', quantity: 1, unit_price: 0, vendor_name: '' });
      api.get(`/events/${selectedEventId}`).then(res => setDivisions(res.data.divisions));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item');
    }
  };

  const deleteDivision = async (divisionId) => {
    if (!confirm('Hapus divisi ini beserta semua itemnya?')) return;
    try {
      await api.delete(`/divisions/${divisionId}`);
      toast.success('Division deleted!');
      api.get(`/events/${selectedEventId}`).then(res => setDivisions(res.data.divisions));
    } catch (err) {
      toast.error('Gagal hapus divisi');
    }
  };

  const deleteItem = async (itemId) => {
    if (!confirm('Hapus item ini?')) return;
    try {
      await api.delete(`/budget-items/${itemId}`);
      toast.success('Item deleted!');
      api.get(`/events/${selectedEventId}`).then(res => setDivisions(res.data.divisions));
    } catch (err) {
      toast.error('Gagal hapus item');
    }
  };

  const updateStatus = async (itemId, status) => {
    try {
      await api.patch(`/budget-items/${itemId}`, { status });
      toast.success('Status updated!');
      api.get(`/events/${selectedEventId}`).then(res => setDivisions(res.data.divisions));
    } catch (err) {
      toast.error('Gagal update status');
    }
  };

  const deleteEvent = async () => {
    if (!confirm('Hapus event ini beserta semua isinya?')) return;
    try {
      await api.delete(`/events/${selectedEventId}`);
      toast.success('Event deleted!');
      setSelectedEventId('');
      api.get('/events').then(res => setEvents(res.data));
    } catch (err) {
      toast.error('Gagal hapus event');
    }
  };
  return (
    <div className="space-y-8 fade-in-up">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">RAB Detail</h1>
          <p className="text-slate-500 text-sm">Input and manage budget allocations per division.</p>
        </div>
        <div className="flex gap-4 items-end">
          <div className="input-group mb-0 max-w-xs">
            <label>Select Event</label>
            <select 
              className="input-field" 
              value={selectedEventId} 
              onChange={e => setSelectedEventId(e.target.value)}
            >
              {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <button 
            onClick={deleteEvent}
            className="btn bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
            disabled={!selectedEventId}
          >
            Hapus Event
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="card">
          <h3 className="text-lg font-bold mb-6">Tambah Divisi</h3>
          <form onSubmit={handleAddDivision} className="space-y-4">
            <div className="input-group">
              <label>Nama Divisi</label>
              <input 
                className="input-field" 
                placeholder="Misal: Konsumsi, Perlengkapan"
                value={newDivision.name}
                onChange={e => setNewDivision({...newDivision, name: e.target.value})}
                required
              />
            </div>
            <div className="input-group">
              <label>Batas Anggaran (Limit)</label>
              <input 
                type="number" className="input-field"
                value={newDivision.budget_limit}
                onChange={e => setNewDivision({...newDivision, budget_limit: e.target.value})}
                required
              />
            </div>
            <button className="btn btn-accent w-full justify-center">Tambah Divisi</button>
          </form>
        </section>

        <section className="card lg:col-span-2">
          <h3 className="text-lg font-bold mb-6">Tambah Item Anggaran</h3>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <label>Divisi</label>
                <select 
                  className="input-field"
                  value={newItem.division_id}
                  onChange={e => setNewItem({...newItem, division_id: e.target.value})}
                  required
                >
                  <option value="">Pilih Divisi</option>
                  {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Deskripsi Item</label>
                <input 
                  className="input-field" 
                  placeholder="Misal: Sewa Sound System"
                  value={newItem.description}
                  onChange={e => setNewItem({...newItem, description: e.target.value})}
                  required
                />
              </div>
              <div className="input-group">
                <label>Qty</label>
                <input 
                  type="number" className="input-field"
                  value={newItem.quantity}
                  onChange={e => setNewItem({...newItem, quantity: e.target.value})}
                  required
                />
              </div>
              <div className="input-group">
                <label>Harga Satuan</label>
                <input 
                  type="number" className="input-field"
                  value={newItem.unit_price}
                  onChange={e => setNewItem({...newItem, unit_price: e.target.value})}
                  required
                />
              </div>
            </div>
            <button className="btn btn-accent w-full justify-center">Tambah Item</button>
          </form>
        </section>
      </div>
      <div className="space-y-6">
        {loading && <div className="card text-center py-8">Loading...</div>}
        {!loading && divisions.length === 0 && (
          <div className="card text-center py-12 text-slate-400 text-sm">Belum ada divisi yang dibuat untuk event ini.</div>
        )}
        {divisions.map(division => (
          <div key={division.id} className="card overflow-hidden p-0">
            <div className="bg-card px-6 py-3 border-b border-soft flex justify-between items-center">
              <h3 className="font-bold">{division.name}</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                  Limit: Rp {Number(division.budget_limit).toLocaleString()}
                </span>
                <button 
                  onClick={() => deleteDivision(division.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                  title="Hapus Divisi"
                >
                  Hapus
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-light border-b border-soft bg-gray-50/50">
                    <th className="px-6 py-3">Item</th>
                    <th className="px-6 py-3 text-right">Qty</th>
                    <th className="px-6 py-3 text-right">Harga</th>
                    <th className="px-6 py-3 text-right">Total</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-soft">
                  {division.budget_items?.map(item => (
                    <tr key={item.id} className="text-sm hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        {editingItem?.id === item.id ? (
                          <input className="input-field py-1" value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
                        ) : item.description}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {editingItem?.id === item.id ? (
                          <input type="number" className="input-field py-1 w-16" value={editingItem.quantity} onChange={e => setEditingItem({...editingItem, quantity: e.target.value})} />
                        ) : item.quantity}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {editingItem?.id === item.id ? (
                          <input type="number" className="input-field py-1 w-24" value={editingItem.unit_price} onChange={e => setEditingItem({...editingItem, unit_price: e.target.value})} />
                        ) : `Rp ${Number(item.unit_price).toLocaleString()}`}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">Rp {(item.quantity * item.unit_price).toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <select 
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded border outline-none
                            ${item.status === 'Approved' ? 'bg-green-100 text-green-700 border-green-200' : 
                              item.status === 'Pending Audit' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                              'bg-gray-100 text-gray-700 border-gray-200'}`}
                          value={item.status}
                          onChange={e => updateStatus(item.id, e.target.value)}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Pending Audit">Pending Audit</option>
                          <option value="Approved">Approved</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center flex justify-center gap-2">
                        {editingItem?.id === item.id ? (
                          <>
                            <button onClick={updateItem} className="text-green-600 font-bold">Save</button>
                            <button onClick={() => setEditingItem(null)} className="text-slate-400">Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(item)} className="text-blue-500 hover:text-blue-700 font-medium mr-2">Edit</button>
                            <button onClick={() => deleteItem(item.id)} className="text-red-500 hover:text-red-700 font-medium">Hapus</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!division.budget_items || division.budget_items.length === 0) && (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-light italic text-sm">Belum ada item untuk divisi ini.</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-card/50">
                  <tr className="font-bold text-sm">
                    <td colSpan="3" className="px-6 py-3 text-right">Total {division.name}:</td>
                    <td className="px-6 py-3 text-right text-accent">
                      Rp {division.budget_items?.reduce((acc, curr) => acc + (curr.quantity * curr.unit_price), 0).toLocaleString()}
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}