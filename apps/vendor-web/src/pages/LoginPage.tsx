import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [phone, setPhone] = useState('0831234567');
  const [otp, setOtp] = useState('123456');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiRequest('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<{
        token?: string;
        user?: { storeName?: string; phone: string; userType: string };
      }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
      });

      if (!response.token || !response.user?.storeName) {
        throw new Error('This phone number is not linked to a vendor account.');
      }

      setAuth(response.token, {
        storeName: response.user.storeName,
        phone: response.user.phone,
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand brand-center">
          <span className="brand-mark">KE</span>
          <div>
            <strong>KasiEats Vendor</strong>
            <p>Sign in to manage orders</p>
          </div>
        </div>

        <form onSubmit={step === 'phone' ? sendOtp : verifyOtp}>
          <label htmlFor="phone">Phone number</label>
          <input
            id="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="083 123 4567"
            disabled={step === 'otp'}
          />

          {step === 'otp' && (
            <>
              <label htmlFor="otp">OTP code</label>
              <input
                id="otp"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="6-digit code"
              />
            </>
          )}

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : step === 'phone' ? 'Send OTP' : 'Sign in'}
          </button>
        </form>

        <p className="hint">Dev login: 0831234567 · OTP 123456 (Mama Lindiwe&apos;s Kota Stand)</p>
      </div>
    </div>
  );
}
