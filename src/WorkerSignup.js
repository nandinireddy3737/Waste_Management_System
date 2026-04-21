import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './WorkerSignup.css';

function WorkerSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/worker/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        })
      });

      const text = await res.text();
      const data = text ? (() => { try { return JSON.parse(text); } catch { return {}; } })() : {};

      if (res.ok) {
        setSuccess(true);
      } else {
        const msg = data.message || data.error || (res.status === 500 ? 'Server error. Check backend console for details.' : 'Sign up failed. Please try again.');
        setError(msg);
      }
    } catch (err) {
      console.error('Signup fetch error:', err);
      setError('Cannot connect to server. Is the backend running on port 5000?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (success) {
    return (
      <div className="worker-signup-page">
        <div className="worker-signup-card">
          <h1 className="worker-signup-title">Account Created</h1>
          <p className="worker-signup-success-msg">
            Your worker account has been created successfully. You can now log in.
          </p>
          <Link to="/worker-login" className="worker-signup-link-btn">
            Go to Login
          </Link>
          <button type="button" className="worker-signup-back-btn" onClick={handleBack}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="worker-signup-page">
      <div className="worker-signup-card">
        <h1 className="worker-signup-title">Worker Sign Up</h1>
        <p className="worker-signup-subtitle">Urban Waste Management System</p>

        <form onSubmit={handleSubmit} className="worker-signup-form">
          <div className="worker-signup-field">
            <label htmlFor="worker-name">Worker Name</label>
            <input
              id="worker-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="worker-signup-field">
            <label htmlFor="worker-email">Worker Email</label>
            <input
              id="worker-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
          </div>

          <div className="worker-signup-field">
            <label htmlFor="worker-phone">Phone</label>
            <input
              id="worker-phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="worker-signup-field">
            <label htmlFor="worker-password">Password</label>
            <input
              id="worker-password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password (min 6 characters)"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className="worker-signup-field">
            <label htmlFor="worker-confirm-password">Confirm Password</label>
            <input
              id="worker-confirm-password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {error && <div className="worker-signup-error">{error}</div>}

          <button
            type="submit"
            className="worker-signup-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="worker-signup-login-text">
            Already have an account? <Link to="/worker-login" className="worker-signup-login-link">Login</Link>
          </p>

          <button
            type="button"
            className="worker-signup-back-btn"
            onClick={handleBack}
          >
            ← Back
          </button>
        </form>
      </div>
    </div>
  );
}

export default WorkerSignup;
