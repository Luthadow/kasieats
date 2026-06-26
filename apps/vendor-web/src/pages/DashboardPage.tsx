export default function DashboardPage() {
  return (
    <section>
      <div className="page-header">
        <h1>Today&apos;s kitchen</h1>
        <p>Manage incoming orders and keep your kota stand online.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Orders today</span>
          <strong>0</strong>
        </div>
        <div className="stat-card">
          <span>Revenue today</span>
          <strong>R0</strong>
        </div>
        <div className="stat-card">
          <span>Pending orders</span>
          <strong>0</strong>
        </div>
        <div className="stat-card">
          <span>Avg rating</span>
          <strong>4.8</strong>
        </div>
      </div>

      <div className="panel">
        <h2>Store status</h2>
        <p>Your store is online and ready to receive orders from nearby customers.</p>
        <span className="badge">Online</span>
      </div>
    </section>
  );
}
