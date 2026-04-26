// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './Login.css';

type Tab = 'login' | 'register';

export function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab]           = useState<Tab>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState<string | null>(null);

  const switchTab = (t: Tab) => {
    setTab(t);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (tab === 'login') {
        await login({ username, password });
        navigate('/search', { replace: true });
      } else {
        await register({ username, password });
        setSuccess('Account created! You can now log in.');
        setTab('login');
        setPassword('');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <h1 className="login-title">SerpSearch</h1>
        <p className="login-subtitle">Search pricing data via Google</p>

        <div className="login-tabs">
          <button
            className={`login-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => switchTab('login')}
          >
            Login
          </button>
          <button
            className={`login-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => switchTab('register')}
          >
            Register
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              disabled={loading}
            />
          </div>

          {error   && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : tab === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>

      </div>
    </div>
  );
}