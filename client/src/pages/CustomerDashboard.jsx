import { useCallback, useEffect, useMemo, useState } from 'react';
import { BellRing, Clock3, MapPin, RefreshCw, Ticket, Users, XCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import api, { getErrorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const prettyStatus = status => ({ waiting: 'Waiting', called: 'Your turn', serving: 'Being served', served: 'Served', skipped: 'Skipped', cancelled: 'Cancelled' }[status] || status);

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [serviceRes, tokenRes] = await Promise.all([api.get('/services'), api.get('/queue/my')]);
      setServices(serviceRes.data.services);
      setTokens(tokenRes.data.tokens);
      setSelected(current => current || serviceRes.data.services[0]?._id || '');
      setError('');
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const token = localStorage.getItem('queueless_token');
    const socket = io(socketUrl, { auth: { token } });
    services.forEach(service => socket.emit('queue:subscribe', { serviceId: service._id }));
    socket.on('queue:updated', () => refresh());
    return () => socket.disconnect();
  }, [services.map(s => s._id).join(','), refresh]);

  const activeTokens = useMemo(() => tokens.filter(t => ['waiting', 'called', 'serving'].includes(t.status)), [tokens]);
  const myToken = activeTokens[0];

  async function joinQueue(e) {
    e.preventDefault(); if (!selected) return;
    setBusy(true); setError(''); setNotice('');
    try { const { data } = await api.post('/queue/join', { serviceId: selected }); setNotice(data.message); await refresh(); }
    catch (err) { setError(getErrorMessage(err)); if (err.response?.data?.token) await refresh(); }
    finally { setBusy(false); }
  }

  async function cancelToken(id) {
    if (!window.confirm('Cancel this waiting token?')) return;
    try { const { data } = await api.patch(`/queue/${id}/cancel`); setNotice(data.message); await refresh(); }
    catch (err) { setError(getErrorMessage(err)); }
  }

  if (loading) return <div className="loading-screen">Loading your queue…</div>;

  return <div className="dashboard-page">
    <div className="page-heading-row"><div><span className="eyebrow">CUSTOMER WORKSPACE</span><h1>Good to see you, {user?.name?.split(' ')[0]}.</h1><p>Join a service queue and keep track of your place in line.</p></div><button className="btn secondary" onClick={refresh}><RefreshCw size={16}/> Refresh</button></div>
    {error && <div className="alert error">{error}</div>}{notice && <div className="alert success">{notice}<button onClick={() => setNotice('')}><XCircle size={15}/></button></div>}
    <div className="stats-grid">
      <StatCard label="Active tokens" value={activeTokens.length} hint="Your current queue bookings" icon={Ticket} tone="blue"/>
      <StatCard label="Current token" value={myToken ? `#${String(myToken.tokenNumber).padStart(3, '0')}` : '—'} hint={myToken ? myToken.service.name : 'No active token'} icon={BellRing} tone="purple"/>
      <StatCard label="Estimated wait" value={myToken ? `${myToken.estimatedWaitMinutes} min` : '—'} hint={myToken ? `${myToken.peopleAhead} people ahead` : 'Join a queue to get started'} icon={Clock3} tone="orange"/>
    </div>

    <div className="content-grid">
      <section className="panel join-panel">
        <div className="panel-heading"><div><span className="eyebrow">QUICK BOOKING</span><h2>Join a queue</h2></div><span className="heading-icon"><Ticket size={20}/></span></div>
        <p className="muted">Choose a service to receive your virtual token.</p>
        <form onSubmit={joinQueue} className="form-stack">
          <label>Select service<select value={selected} onChange={e => setSelected(e.target.value)} required><option value="" disabled>Choose a service</option>{services.map(service => <option key={service._id} value={service._id}>{service.name} · ~{service.averageMinutes} min/person{service.isPaused ? ' · Paused' : ''}</option>)}</select></label>
          {selected && services.find(s => s._id === selected)?.description && <div className="service-description"><MapPin size={15}/>{services.find(s => s._id === selected)?.description}</div>}
          <button className="btn primary full" disabled={busy || !selected || services.find(s => s._id === selected)?.isPaused}>{busy ? 'Joining…' : 'Get my token'} <Ticket size={17}/></button>
        </form>
        <div className="note-box"><Clock3 size={16}/><span>Waiting times are estimates and may change as the queue moves.</span></div>
      </section>

      <section className="panel token-panel">
        <div className="panel-heading"><div><span className="eyebrow">LIVE STATUS</span><h2>Your active tokens</h2></div><span className="live-pill"><span/> LIVE</span></div>
        {activeTokens.length === 0 ? <div className="empty-state"><div className="empty-icon"><Ticket size={23}/></div><strong>No active queue tokens</strong><p>Choose a service to join the queue. Your token will appear here.</p></div> :
          <div className="token-list">{activeTokens.map(token => <div className="token-card" key={token.id}>
            <div className="token-card-top"><div><span className="token-service">{token.service.name}</span><span className="token-date">Joined {new Date(token.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div><span className={`status-badge ${token.status}`}>{prettyStatus(token.status)}</span></div>
            <div className="token-main"><div><span className="token-label">YOUR TOKEN</span><strong>#{String(token.tokenNumber).padStart(3, '0')}</strong></div><div className="token-wait"><Clock3 size={16}/><span><strong>{token.estimatedWaitMinutes} min</strong><small>estimated wait</small></span></div></div>
            <div className="token-progress"><div style={{ width: `${token.status === 'waiting' ? Math.min(92, 12 + (token.peopleAhead === 0 ? 0 : 1 / (token.peopleAhead + 1)) * 80) : 100}%` }}/></div>
            <div className="token-footer"><span><Users size={15}/>{token.peopleAhead} people ahead</span>{token.status === 'waiting' && <button className="text-button danger-text" onClick={() => cancelToken(token.id)}>Cancel token</button>}</div>
          </div>)}
        </div>}
      </section>
    </div>
  </div>;
}
