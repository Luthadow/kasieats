import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider, useRealtime } from './context/RealtimeContext';
import { useNotifications } from './hooks/useNotifications';
import DashboardPage from './pages/DashboardPage';
import EarningsPage from './pages/EarningsPage';
import LoginPage from './pages/LoginPage';
import MenuPage from './pages/MenuPage';
import OrdersPage from './pages/OrdersPage';
import RegisterPage from './pages/RegisterPage';

function LiveBadge() {
  const { connected } = useRealtime();
  return (
    <div className={`live-badge ${connected ? 'live-badge--on' : ''}`}>
      <span className="live-dot" />
      {connected ? 'Live updates' : 'Reconnecting…'}
    </div>
  );
}

function ProtectedLayout() {
  const { token, user, clearAuth } = useAuth();
  const { unreadCount } = useNotifications(token);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">KE</span>
          <div>
            <strong>KasiEats</strong>
            <p>{user.storeName}</p>
          </div>
        </div>
        <LiveBadge />
        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/menu">Menu</Link>
          <Link to="/earnings">Earnings</Link>
          <Link to="/orders">
            Orders{unreadCount > 0 ? ` (${unreadCount})` : ''}
          </Link>
        </nav>
        <button className="btn btn-ghost sidebar-logout" onClick={clearAuth}>
          Sign out
        </button>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/earnings" element={<EarningsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
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
      <Route path="/register" element={token ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <AppRoutes />
      </RealtimeProvider>
    </AuthProvider>
  );
}
