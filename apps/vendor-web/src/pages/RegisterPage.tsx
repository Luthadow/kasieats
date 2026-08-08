import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('123456');
  const [otpSent, setOtpSent] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState('kota');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiRequest('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<{ message: string }>('/auth/vendor/register', {
        method: 'POST',
        body: JSON.stringify({
          phone,
          otp,
          storeName,
          storeCategory,
          address,
          city: 'Rustenburg',
          latitude: -25.6544,
          longitude: 27.2389,
        }),
      });
      setSuccess(response.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h2>Application submitted</h2>
          <p>{success}</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card register-card">
        <div className="brand brand-center">
          <span className="brand-mark">KE</span>
          <div>
            <strong>Register your store</strong>
            <p>Join the Rustenburg pilot</p>
          </div>
        </div>

        <form onSubmit={submit}>
          <label htmlFor="phone">Phone number</label>
          <div className="inline-row">
            <input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="083 123 4567"
              required
            />
            <button type="button" className="btn btn-secondary" onClick={sendOtp} disabled={loading}>
              Send OTP
            </button>
          </div>

          {otpSent && (
            <>
              <label htmlFor="otp">OTP code</label>
              <input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} required />

              <label htmlFor="storeName">Store name</label>
              <input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
              />

              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={storeCategory}
                onChange={(e) => setStoreCategory(e.target.value)}
              >
                <option value="kota">Kota</option>
                <option value="shisanyama">Shisanyama</option>
                <option value="home_kitchen">Home kitchen</option>
                <option value="fast_food">Fast food</option>
              </select>

              <label htmlFor="address">Address</label>
              <input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Zuma Street, Tlhabane"
                required
              />
            </>
          )}

          {error && <p className="error-text">{error}</p>}

          {otpSent && (
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit application'}
            </button>
          )}
        </form>

        <p className="hint">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
