import { NavLink, useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, LogOut, Ticket, Users, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'admin'
    ? [{ to: '/admin', label: 'Overview', icon: LayoutDashboard }, { to: '/staff', label: 'Queue desk', icon: Ticket }]
    : user?.role === 'staff'
      ? [{ to: '/staff', label: 'Queue desk', icon: Ticket }]
      : [{ to: '/dashboard', label: 'My queue', icon: LayoutDashboard }];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to={user?.role === 'admin' ? '/admin' : user?.role === 'staff' ? '/staff' : '/dashboard'} className="brand">
          <span className="brand-mark"><Activity size={21}/></span>
          <span>QueueLess<small>VIRTUAL QUEUE</small></span>
        </NavLink>
        <div className="nav-label">WORKSPACE</div>
        <nav className="side-nav">
          {links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><Icon size={18}/>{label}</NavLink>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-avatar">{user?.name?.slice(0, 1)?.toUpperCase() || 'U'}</div>
          <div className="user-meta"><strong>{user?.name}</strong><span>{user?.role}</span></div>
          <button className="icon-button" title="Log out" onClick={() => { logout(); navigate('/login'); }}><LogOut size={17}/></button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div><span className="status-dot"/><span className="topbar-status">Queue system online</span></div>
          <div className="topbar-right"><span className="role-pill">{user?.role === 'admin' ? <ShieldCheck size={14}/> : user?.role === 'staff' ? <Users size={14}/> : <Ticket size={14}/>} {user?.role}</span><span className="topbar-name">{user?.name}</span></div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
