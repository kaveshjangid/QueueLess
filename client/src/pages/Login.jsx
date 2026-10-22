import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api';

function homeFor(role) { return role === 'admin' ? '/admin' : role === 'staff' ? '/staff' : '/dashboard'; }

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('customer@queueless.local');
  const [password, setPassword] = useState('QueueLess123!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const user = await login(email, password);
      navigate(location.state?.from?.pathname || homeFor(user.role), { replace: true });
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  }

  return <div className="auth-page">
    <div className="auth-decoration"><div className="auth-orbit orbit-one"/><div className="auth-orbit orbit-two"/><div className="auth-brand"><span className="brand-mark"><Activity size={22}/></span><span>QueueLess</span></div><div className="auth-hero-copy"><span className="eyebrow light">LESS WAITING. MORE LIVING.</span><h1>Your time matters.<br/><em>Skip the line.</em></h1><p>Join a virtual queue, track your place, and arrive when it’s nearly your turn.</p><div className="hero-mini-stats"><div><strong>01</strong><span>Join remotely</span></div><div><strong>02</strong><span>Track live</span></div><div><strong>03</strong><span>Get served</span></div></div></div><div className="auth-decoration-footer">A smarter way to wait.</div></div>
    <div className="auth-form-panel">
      <div className="auth-mobile-brand"><span className="brand-mark"><Activity size={20}/></span> QueueLess</div>
      <div className="auth-form-wrap">
        <div className="auth-heading"><span className="eyebrow">WELCOME BACK</span><h2>Sign in to QueueLess</h2><p>Enter your account details to continue.</p></div>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={submit} className="form-stack">
          <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"/></label>
          <label>Password<div className="password-wrap"><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={8}/><button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
          <button className="btn primary full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={17}/></button>
        </form>
        <div className="auth-switch">New to QueueLess? <Link to="/register">Create an account</Link></div>
        <div className="demo-box"><strong>Demo credentials</strong><p>Customer: customer@queueless.local</p><p>Staff: staff@queueless.local</p><p>Admin: admin@queueless.local</p><small>Password for all: QueueLess123!</small></div>
      </div>
    </div>
  </div>;
}
