import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!form.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!form.email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!form.password) {
      setError('Please enter a password.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerApi({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      const data = res.data;

      // Auto-login
      const userData = {
        userId: data.userId || data.id || data.user?.id,
        name: data.name || form.name.trim(),
        email: data.email || form.email.trim(),
        token: data.token || data.accessToken || data.jwt,
      };

      login(userData);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data ||
        'Registration failed. Please try again.';
      setError(typeof msg === 'string' ? msg : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (pw) => {
    if (!pw) return null;
    if (pw.length < 6) return { label: 'Too short', color: 'var(--danger)', width: '20%' };
    if (pw.length < 8) return { label: 'Weak', color: 'var(--warning)', width: '40%' };
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw) && pw.length >= 10) {
      return { label: 'Strong', color: 'var(--success)', width: '100%' };
    }
    return { label: 'Fair', color: '#ffd166', width: '70%' };
  };

  const strength = getPasswordStrength(form.password);

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">
            <span className="auth-brand-icon">💸</span>
            <span className="auth-brand-name">ExpenseTracker</span>
          </div>
          <h1 className="auth-headline">
            Start your
            <span className="text-gradient"> financial journey</span>
          </h1>
          <p className="auth-tagline">
            Join thousands of users who track their expenses and build better money habits every day.
          </p>

          <div className="auth-features">
            {[
              { icon: '✅', title: 'Free to Use', desc: 'No subscription fees, ever' },
              { icon: '📱', title: 'Responsive Design', desc: 'Works on any device, anywhere' },
              { icon: '📈', title: 'Rich Insights', desc: 'Visual breakdowns of your spending' },
            ].map((f) => (
              <div className="auth-feature" key={f.title}>
                <div className="auth-feature-icon">{f.icon}</div>
                <div>
                  <div className="auth-feature-title">{f.title}</div>
                  <div className="auth-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="auth-blob auth-blob-1" />
          <div className="auth-blob auth-blob-2" />
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-card glass-strong slide-up">
          {/* Header */}
          <div className="auth-form-header">
            <h2 className="auth-form-title">Create Account</h2>
            <p className="auth-form-subtitle">It's free and takes less than a minute</p>
          </div>

          {/* Error */}
          {error && (
            <div className="error-banner">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* Name */}
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div className="input-with-icon">
                <span className="input-icon">👤</span>
                <input
                  className="input"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  autoComplete="name"
                  autoFocus
                />
              </div>
            </div>

            {/* Email */}
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div className="input-with-icon">
                <span className="input-icon">✉️</span>
                <input
                  className="input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-with-icon">
                <span className="input-icon">🔒</span>
                <input
                  className="input"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                />
              </div>
              {/* Strength bar */}
              {strength && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    <div
                      className="password-strength-fill"
                      style={{ width: strength.width, background: strength.color }}
                    />
                  </div>
                  <span style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <div className="input-with-icon">
                <span className="input-icon">🔑</span>
                <input
                  className="input"
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  style={{
                    borderColor:
                      form.confirmPassword && form.confirmPassword !== form.password
                        ? 'var(--danger)'
                        : form.confirmPassword && form.confirmPassword === form.password
                        ? 'var(--success)'
                        : undefined,
                  }}
                />
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 4 }}>
                  Passwords don't match
                </p>
              )}
            </div>

            {/* Submit */}
            <button type="submit" className="btn btn-full btn-lg" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="auth-footer">
            <span className="text-secondary">Already have an account? </span>
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
