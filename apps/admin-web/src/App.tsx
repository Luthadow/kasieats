import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useNotifications } from './hooks/useNotifications';
import DashboardPage from './pages/DashboardPage';
import DriversPage from './pages/DriversPage';
import LoginPage from './pages/LoginPage';
import OrdersPage from './pages/OrdersPage';
import WithdrawalsPage from './pages/WithdrawalsPage';
import PromotionsPage from './pages/PromotionsPage';
import SupportPage from './pages/SupportPage';
import VendorsPage from './pages/VendorsPage';

function ProtectedLayout() {
  const { token, user, clearAuth } = useAuth();
  const { unreadCount, notifications, markAllRead } = useNotifications(token);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const latest = notifications.slice(0, 3);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark admin-mark">KE</span>
          <div>
            <strong>KasiEats Admin</strong>
            <p>{user.email}</p>
          </div>
        </div>
        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/vendors">Vendors</Link>
          <Link to="/drivers">Drivers</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/withdrawals">Payouts</Link>
          <Link to="/promotions">Promos</Link>
          <Link to="/support">Support</Link>
        </nav>
        {unreadCount > 0 && (
          <div className="notification-panel">
            <div className="notification-header">
              <strong>Alerts ({unreadCount})</strong>
              <button className="link-btn" onClick={markAllRead}>
                Mark read
              </button>
            </div>
            {latest.map((item) => (
              <div key={item.id} className="notification-item">
                <strong>{item.title}</strong>
                <p>{item.message}</p>
              </div>
            ))}
          </div>
        )}
        <button className="btn btn-ghost sidebar-logout" onClick={clearAuth}>
          Sign out
        </button>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/withdrawals" element={<WithdrawalsPage />} />
          <Route path="/promotions" element={<PromotionsPage />} />
          <Route path="/support" element={<SupportPage />} />
        </Routes>
      </main>
    </div>
  );
}

function AppRoutes() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
