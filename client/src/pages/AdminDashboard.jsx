import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, Clock3, Plus, RefreshCw, Ticket, Users, X } from 'lucide-react';
import api, { getErrorMessage } from '../api';
import StatCard from '../components/StatCard';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', averageMinutes: 5 });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [statsRes, servicesRes] = await Promise.all([api.get('/analytics/summary'), api.get('/services')]);
      setSummary(statsRes.data); setServices(servicesRes.data.services); setError('');
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function createService(e) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const { data } = await api.post('/services', { ...form, averageMinutes: Number(form.averageMinutes) });
      setNotice(`Created service: ${data.service.name}`); setForm({ name: '', description: '', averageMinutes: 5 }); setShowForm(false); await load();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="loading-screen">Loading admin overview…</div>;

  return <div className="dashboard-page">
    <div className="page-heading-row"><div><span className="eyebrow">ADMINISTRATION</span><h1>Queue overview</h1><p>Monitor daily service activity and manage your service points.</p></div><button className="btn secondary" onClick={load}><RefreshCw size={16}/> Refresh</button></div>
    {error && <div className="alert error">{error}</div>}{notice && <div className="alert success">{notice}</div>}
    <div className="stats-grid">
      <StatCard label="Tokens today" value={summary?.total ?? 0} hint={summary?.dateKey || 'Today'} icon={Ticket} tone="blue"/>
      <StatCard label="Waiting now" value={summary?.waiting ?? 0} hint="Customers in line" icon={Users} tone="purple"/>
      <StatCard label="Served today" value={summary?.served ?? 0} hint="Completed visits" icon={CheckCircle2} tone="green"/>
      <StatCard label="Active services" value={summary?.services ?? 0} hint="Available service points" icon={Activity} tone="orange"/>
    </div>
    <section className="panel service-management">
      <div className="panel-heading"><div><span className="eyebrow">CONFIGURATION</span><h2>Service points</h2><p className="muted">Control the services customers can join.</p></div><button className="btn primary" onClick={() => setShowForm(v => !v)}>{showForm ? <X size={16}/> : <Plus size={16}/>} {showForm ? 'Close' : 'Add service'}</button></div>
      {showForm && <form onSubmit={createService} className="service-create-form">
        <label>Service name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required minLength={2} placeholder="e.g. Library Help Desk"/></label>
        <label>Description<input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} maxLength={300} placeholder="What can visitors do here?"/></label>
        <label>Average minutes<input type="number" value={form.averageMinutes} onChange={e => setForm({ ...form, averageMinutes: e.target.value })} min="1" max="120" required/></label>
        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Create service'}</button>
      </form>}
      <div className="service-list">{services.map((service, index) => <div className="service-row" key={service._id}><div className={`service-symbol symbol-${index % 4}`}><Ticket size={19}/></div><div className="service-row-copy"><strong>{service.name}</strong><span>{service.description || 'No description provided'}</span></div><div className="service-row-time"><Clock3 size={15}/>{service.averageMinutes} min / person</div><span className={`status-badge ${service.isPaused ? 'skipped' : 'served'}`}>{service.isPaused ? 'Paused' : 'Active'}</span></div>)}</div>
    </section>
    <div className="admin-note"><Activity size={18}/><div><strong>Queue operations at a glance</strong><p>Staff can manage individual queues from the Queue desk. Token history is retained in the database for operational reporting.</p></div></div>
  </div>;
}
