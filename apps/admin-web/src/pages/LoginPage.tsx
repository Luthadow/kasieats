import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [email, setEmail] = useState('admin@kasieats.co.za');
  const [password, setPassword] = useState('Admin123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<{
        token?: string;
        user?: { email?: string; phone: string; userType: string };
      }>('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!response.token || !response.user?.email) {
        throw new Error('Invalid admin credentials');
      }

      setAuth(response.token, {
        email: response.user.email,
        phone: response.user.phone,
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand brand-center">
          <span className="brand-mark admin-mark">KE</span>
          <div>
            <strong>KasiEats Admin</strong>
            <p>Rustenburg pilot control centre</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="hint">Dev login: admin@kasieats.co.za · Admin123!</p>
      </div>
    </div>
  );
}
