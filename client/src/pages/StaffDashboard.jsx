import { useCallback, useEffect, useState } from 'react';
import { Activity, BellRing, Check, Clock3, Pause, Play, RefreshCw, SkipForward, Ticket, Users } from 'lucide-react';
import { io } from 'socket.io-client';
import api, { getErrorMessage } from '../api';
import StatCard from '../components/StatCard';

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const prettyStatus = status => ({ waiting: 'Waiting', called: 'Called', serving: 'Serving', served: 'Served', skipped: 'Skipped', cancelled: 'Cancelled' }[status] || status);

export default function StaffDashboard() {
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState('');
  const [queue, setQueue] = useState({ service: null, tokens: [], history: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadServices = useCallback(async () => {
    try {
      const { data } = await api.get('/services');
      setServices(data.services);
      setServiceId(current => current || data.services[0]?._id || '');
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);

  const loadQueue = useCallback(async () => {
    if (!serviceId) return;
    try { const { data } = await api.get(`/queue/service/${serviceId}`); setQueue(data); setError(''); }
    catch (err) { setError(getErrorMessage(err)); }
  }, [serviceId]);

  useEffect(() => { loadServices(); }, [loadServices]);
  useEffect(() => { loadQueue(); }, [loadQueue]);
  useEffect(() => {
    if (!serviceId) return;
    const socket = io(socketUrl, { auth: { token: localStorage.getItem('queueless_token') } });
    socket.emit('queue:subscribe', { serviceId });
    socket.on('queue:updated', loadQueue);
    return () => socket.disconnect();
  }, [serviceId, loadQueue]);

  async function action(url, method = 'post', body = {}) {
    setBusy(true); setError(''); setNotice('');
    try {
      const { data } = await api[method](url, body);
      setNotice(data.message || 'Queue updated.');
      await loadQueue();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="loading-screen">Loading service desk…</div>;
  const waiting = queue.tokens.filter(t => t.status === 'waiting');
  const called = queue.tokens.find(t => t.status === 'called');
  const serving = queue.tokens.find(t => t.status === 'serving');

  return <div className="dashboard-page">
    <div className="page-heading-row"><div><span className="eyebrow">STAFF WORKSPACE</span><h1>Service desk</h1><p>Manage customer flow and keep the line moving.</p></div><button className="btn secondary" onClick={loadQueue}><RefreshCw size={16}/> Refresh</button></div>
    {error && <div className="alert error">{error}</div>}{notice && <div className="alert success">{notice}</div>}
    <section className="panel service-select-panel"><div className="service-select-copy"><span className="eyebrow">CURRENT SERVICE</span><h2>{queue.service?.name || 'Choose a service'}</h2><p className="muted">Average service time: {queue.service?.averageMinutes || '—'} minutes per customer</p></div><div className="service-select-controls"><select value={serviceId} onChange={e => setServiceId(e.target.value)}><option value="" disabled>Select service</option>{services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</select><button className={`btn ${queue.service?.isPaused ? 'primary' : 'secondary'}`} disabled={busy || !serviceId} onClick={() => action(`/queue/service/${serviceId}/pause`, 'patch', { isPaused: !queue.service?.isPaused })}>{queue.service?.isPaused ? <><Play size={16}/> Resume queue</> : <><Pause size={16}/> Pause queue</>}</button></div></section>
    <div className="stats-grid">
      <StatCard label="Waiting" value={waiting.length} hint="Customers in line" icon={Users} tone="blue"/>
      <StatCard label="Now called" value={called ? `#${String(called.tokenNumber).padStart(3, '0')}` : '—'} hint={called?.customer?.name || 'No token called'} icon={BellRing} tone="purple"/>
      <StatCard label="Queue status" value={queue.service?.isPaused ? 'Paused' : 'Active'} hint={queue.service?.isPaused ? 'Resume to call next' : 'Accepting queue actions'} icon={Activity} tone={queue.service?.isPaused ? 'orange' : 'green'}/>
    </div>
    <div className="content-grid staff-grid">
      <section className="panel current-panel">
        <div className="panel-heading"><div><span className="eyebrow">NOW SERVING</span><h2>Current token</h2></div><span className="heading-icon"><BellRing size={20}/></span></div>
        {called ? <div className="current-token"><span className="token-label">CALLING CUSTOMER</span><strong>#{String(called.tokenNumber).padStart(3, '0')}</strong><span>{called.customer?.name || 'Customer'}</span><div className="current-actions"><button className="btn primary" disabled={busy} onClick={() => action(`/queue/${called.id}/serve`, 'patch')}><Check size={16}/> Mark served</button><button className="btn secondary" disabled={busy} onClick={() => action(`/queue/${called.id}/skip`, 'patch')}><SkipForward size={16}/> Skip</button></div></div> :
          <div className="empty-state"><div className="empty-icon"><Ticket size={23}/></div><strong>No token currently called</strong><p>Call the next waiting customer to get started.</p></div>}
        <button className="btn primary full call-next-btn" disabled={busy || !serviceId || queue.service?.isPaused || Boolean(called) || waiting.length === 0} onClick={() => action(`/queue/service/${serviceId}/next`)}><BellRing size={17}/>{busy ? 'Updating…' : 'Call next token'}</button>
        {queue.service?.isPaused && <p className="inline-warning">This queue is paused. Resume it to call the next token.</p>}
      </section>
      <section className="panel waiting-panel">
        <div className="panel-heading"><div><span className="eyebrow">UP NEXT</span><h2>Waiting line</h2></div><span className="count-pill">{waiting.length} waiting</span></div>
        {waiting.length === 0 ? <div className="empty-state compact"><strong>The waiting line is clear</strong><p>New customer tokens will appear here automatically.</p></div> :
          <div className="queue-table-wrap"><table className="queue-table"><thead><tr><th>Token</th><th>Customer</th><th>Joined</th><th>Status</th><th></th></tr></thead><tbody>{waiting.map(token => <tr key={token.id}><td><strong className="table-token">#{String(token.tokenNumber).padStart(3, '0')}</strong></td><td>{token.customer?.name || 'Customer'}</td><td>{new Date(token.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td><td><span className="status-badge waiting">Waiting</span></td><td><button className="icon-button" title="Skip token" disabled={busy} onClick={() => action(`/queue/${token.id}/skip`, 'patch')}><SkipForward size={16}/></button></td></tr>)}</tbody></table></div>}
      </section>
    </div>
    <section className="panel history-panel"><div className="panel-heading"><div><span className="eyebrow">TODAY</span><h2>Recent token activity</h2></div><span className="heading-icon"><Clock3 size={20}/></span></div>
      <div className="queue-table-wrap"><table className="queue-table"><thead><tr><th>Token</th><th>Customer</th><th>Joined at</th><th>Status</th></tr></thead><tbody>{(queue.history || []).slice(-8).reverse().map(token => <tr key={token.id}><td><strong className="table-token">#{String(token.tokenNumber).padStart(3, '0')}</strong></td><td>{token.customer?.name || 'Customer'}</td><td>{new Date(token.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td><td><span className={`status-badge ${token.status}`}>{prettyStatus(token.status)}</span></td></tr>)}</tbody></table></div>
    </section>
  </div>;
}
