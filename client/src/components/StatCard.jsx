export default function StatCard({ label, value, hint, icon: Icon, tone = 'blue' }) {
  return <div className="stat-card">
    <div className={`stat-icon ${tone}`}>{Icon ? <Icon size={20}/> : null}</div>
    <div className="stat-copy"><span>{label}</span><strong>{value ?? '—'}</strong><small>{hint}</small></div>
  </div>;
}
