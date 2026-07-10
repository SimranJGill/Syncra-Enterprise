import React, { useState } from 'react';

const API_BASE = 'http://localhost:5000/api/v1';

const passwordRules = [
  { label: 'Minimum 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'At least one uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'At least one lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'At least one number', test: (pw) => /[0-9]/.test(pw) },
  { label: 'At least one special character (@$!%*?&)', test: (pw) => /[@$!%*?&]/.test(pw) }
];

const Register = ({ onRegisterSuccess, toggleView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const isPasswordValid = passwordRules.every(rule => rule.test(password));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Basic input validation
    if (!email || !password || !confirmPassword) {
      setMessage({ type: 'error', text: 'All required fields must be filled.' });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      setLoading(false);
      return;
    }

    if (!isPasswordValid) {
      setMessage({ type: 'error', text: 'Password does not meet all security rules.' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setMessage({ type: 'success', text: 'Registration successful! Accessing workspace...' });
      
      // Instantly log user straight in (Auto-login UX)
      setTimeout(() => {
        onRegisterSuccess(data.token, data.user);
      }, 1200);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h1 className="auth-logo" style={{ color: 'var(--pastel-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          Syncra
          <span style={{ color: '#1e3a8a', fontSize: '18px', fontWeight: '500' }}>Enterprise Workforce</span>
        </h1>
        <p className="auth-subtitle">Create your Workforce Operations Account</p>
      </div>

      {message && (
        <div className={`toast-msg toast-${message.type}`}>
          <span>{message.type === 'success' ? '✓' : '⚠'}</span>
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Email Address */}
        <div className="form-group">
          <input
            type="email"
            id="email"
            className="form-control"
            placeholder=" "
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
          <label htmlFor="email" className="form-label">Email Address</label>
        </div>

        {/* Password */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <input
            type="password"
            id="password"
            className="form-control"
            placeholder=" "
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
          <label htmlFor="password" className="form-label">Password</label>
        </div>

        {/* Password Strength Checklist */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '20px',
          boxSizing: 'border-box'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Password Security Rules
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {passwordRules.map((rule, idx) => {
              const passed = rule.test(password);
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <span style={{ 
                    color: passed ? '#10b981' : '#94a3b8', 
                    fontWeight: 'bold',
                    transition: 'color 0.2s'
                  }}>
                    {passed ? '✓' : '○'}
                  </span>
                  <span style={{ color: passed ? '#1e293b' : '#64748b', transition: 'color 0.2s' }}>
                    {rule.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Confirm Password */}
        <div className="form-group" style={{ marginBottom: '24px' }}>
          <input
            type="password"
            id="confirmPassword"
            className="form-control"
            placeholder=" "
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
          />
          <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <div className="auth-toggle" style={{ marginTop: '24px' }}>
        Already have an account?{' '}
        <span className="auth-toggle-link" onClick={toggleView}>
          Sign in
        </span>
      </div>
    </div>
  );
};

export default Register;
