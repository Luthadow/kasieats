import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phoneOrEmail, setPhoneOrEmail] = useState('admin@kasieats.co.za');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(phoneOrEmail, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">
          <span className="brand-mark">KE</span>
          <div>
            <strong>KasiEats</strong>
            <p>Admin Console</p>
          </div>
        </div>
        <h1>Sign in</h1>
        <p className="auth-sub">Approve vendors, drivers and monitor orders.</p>

        <label>Email</label>
        <input
          value={phoneOrEmail}
          onChange={(e) => setPhoneOrEmail(e.target.value)}
          placeholder="admin@kasieats.co.za"
          autoComplete="username"
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {error && <div className="auth-error">{error}</div>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
