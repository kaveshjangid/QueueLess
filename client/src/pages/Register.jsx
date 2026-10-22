import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try { await register(form.name, form.email, form.password); navigate('/dashboard', { replace: true }); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  }
  return <div className="auth-page register-page">
    <div className="auth-decoration"><div className="auth-orbit orbit-one"/><div className="auth-orbit orbit-two"/><div className="auth-brand"><span className="brand-mark"><Activity size={22}/></span><span>QueueLess</span></div><div className="auth-hero-copy"><span className="eyebrow light">WAIT ON YOUR TERMS</span><h1>Make every<br/><em>minute count.</em></h1><p>One token. Live updates. No more guessing how long the line will take.</p></div><div className="auth-decoration-footer">A smarter way to wait.</div></div>
    <div className="auth-form-panel"><div className="auth-mobile-brand"><span className="brand-mark"><Activity size={20}/></span> QueueLess</div><div className="auth-form-wrap">
      <div className="auth-heading"><span className="eyebrow">GET STARTED</span><h2>Create your account</h2><p>Sign up to join a queue in seconds.</p></div>
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={submit} className="form-stack">
        <label>Full name<input name="name" value={form.name} onChange={change} required minLength={2} maxLength={80} placeholder="Your name"/></label>
        <label>Email address<input type="email" name="email" value={form.email} onChange={change} required placeholder="you@example.com"/></label>
        <label>Password<input type="password" name="password" value={form.password} onChange={change} required minLength={8} placeholder="At least 8 characters"/></label>
        <button className="btn primary full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'} <ArrowRight size={17}/></button>
      </form>
      <div className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></div>
    </div></div>
  </div>;
}
