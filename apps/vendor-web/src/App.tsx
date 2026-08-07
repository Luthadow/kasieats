import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import OrdersPage from './pages/OrdersPage';

function ProtectedLayout() {
  const { token, user, clearAuth } = useAuth();

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
        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/orders">Orders</Link>
        </nav>
        <button className="btn btn-ghost sidebar-logout" onClick={clearAuth}>
          Sign out
        </button>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
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
