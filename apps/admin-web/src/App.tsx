import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VendorsPage from './pages/VendorsPage';
import DriversPage from './pages/DriversPage';
import OrdersPage from './pages/OrdersPage';

export default function App() {
  const { token, loading } = useAuth();

  if (loading) return <div className="loading full">Loading…</div>;
  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/vendors', label: 'Vendors' },
    { to: '/drivers', label: 'Drivers' },
    { to: '/orders', label: 'Orders' },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">KE</span>
        <div>
          <strong>KasiEats</strong>
          <p>Admin Console</p>
        </div>
      </div>
      <nav>
        {links.map((l) => (
          <Link key={l.to} to={l.to} className={pathname === l.to ? 'active' : ''}>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        {user && <p className="sidebar-user">{user.email ?? user.phone}</p>}
        <button
          className="btn-ghost"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
