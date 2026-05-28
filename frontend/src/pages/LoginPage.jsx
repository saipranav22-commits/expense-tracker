import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as loginApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!form.password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginApi({ email: form.email.trim(), password: form.password });
      const data = res.data;

      // Support various response shapes from Spring Boot
      const userData = {
        userId: data.userId || data.id || data.user?.id,
        name: data.name || data.username || data.user?.name || form.email.split('@')[0],
        email: data.email || data.user?.email || form.email,
        token: data.token || data.accessToken || data.jwt,
      };

      login(userData);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data ||
        'Invalid email or password. Please try again.';
      setError(typeof msg === 'string' ? msg : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            Take control of your
            <span className="text-gradient"> finances</span>
          </h1>
          <p className="auth-tagline">
            Track every rupee, visualize your spending patterns, and achieve your financial goals.
          </p>

          <div className="auth-features">
            {[
              { icon: '📊', title: 'Smart Analytics', desc: 'Interactive charts and monthly breakdowns' },
              { icon: '🏷️', title: 'Category Management', desc: 'Organize expenses with custom categories' },
              { icon: '🔒', title: 'Secure & Private', desc: 'Your data is encrypted and protected' },
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

          {/* Decorative blobs */}
          <div className="auth-blob auth-blob-1" />
          <div className="auth-blob auth-blob-2" />
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-card glass-strong slide-up">
          {/* Header */}
          <div className="auth-form-header">
            <h2 className="auth-form-title">Welcome back</h2>
            <p className="auth-form-subtitle">Sign in to continue to your dashboard</p>
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
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-with-icon">
                <span className="input-icon">🔑</span>
                <input
                  className="input"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Remember me */}
            <div className="auth-remember">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={form.rememberMe}
                  onChange={handleChange}
                  className="auth-checkbox"
                />
                <span>Remember me</span>
              </label>
            </div>

            {/* Submit */}
            <button type="submit" className="btn btn-full btn-lg" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="auth-footer">
            <span className="text-secondary">Don't have an account? </span>
            <Link to="/register" className="auth-link">
              Create one for free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
