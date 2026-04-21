import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './WorkerLogin.css';

function WorkerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/worker/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));
      const id = data.worker_id || data.workerId || '';
      const hasWorker = res.ok && (data.success === true || id);

      if (hasWorker) {
        sessionStorage.setItem('workerId', String(id));
        sessionStorage.setItem('workerName', data.worker_name || data.workerName || data.name || 'Worker');
        navigate('/worker-dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      console.error(err);
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="worker-login-page">
      <div className="worker-login-card">
        <h1 className="worker-login-title">Worker Login</h1>
        <p className="worker-login-subtitle">Urban Waste Management System</p>

        <form onSubmit={handleSubmit} className="worker-login-form">
          <div className="worker-login-field">
            <label htmlFor="worker-email">Worker Email</label>
            <input
              id="worker-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
          </div>

          <div className="worker-login-field">
            <label htmlFor="worker-password">Password</label>
            <input
              id="worker-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="worker-login-error">{error}</div>}

          <button
            type="submit"
            className="worker-login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

          <p className="worker-login-signup-text">
            Don&apos;t have an account? <Link to="/worker-signup" className="worker-login-signup-link">Sign Up</Link>
          </p>

          <button
            type="button"
            className="worker-login-back-btn"
            onClick={handleBack}
          >
            ← Back
          </button>
        </form>
      </div>
    </div>
  );
}

export default WorkerLogin;
