import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import MenuPage from './pages/MenuPage';

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
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/menu" element={<MenuPage />} />
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
    { to: '/orders', label: 'Orders' },
    { to: '/menu', label: 'Menu' },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">M</span>
        <div>
          <strong>MTHURA</strong>
          <p>Merchant Portal</p>
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
        {user && <p className="sidebar-user">{user.phone}</p>}
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
