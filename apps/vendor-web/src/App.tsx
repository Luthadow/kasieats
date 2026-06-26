import { Link, Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">KE</span>
          <div>
            <strong>KasiEats</strong>
            <p>Vendor Portal</p>
          </div>
        </div>
        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/orders">Orders</Link>
        </nav>
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
