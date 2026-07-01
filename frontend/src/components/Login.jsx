import React, { useState } from 'react';

const Login = ({ onLoginSuccess, toggleView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!email || !password) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please check credentials.');
      }

      setMessage({ type: 'success', text: data.message });
      
      // Pass token and user details to parent App state
      setTimeout(() => {
        onLoginSuccess(data.token, data.user);
      }, 800);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h1 className="auth-logo">
          Enterprise<span>WFM</span>
        </h1>
        <p className="auth-subtitle">AI-Powered Workforce Operations Assistant</p>
      </div>

      {message && (
        <div className={`toast-msg toast-${message.type}`}>
          <span>{message.type === 'success' ? '✓' : '⚠'}</span>
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
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

        <div className="form-group">
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

        <button 
          type="submit" 
          className="btn-primary" 
          disabled={loading}
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <div className="auth-toggle">
        Don't have an account?{' '}
        <span className="auth-toggle-link" onClick={toggleView}>
          Create new account
        </span>
      </div>
    </div>
  );
};

export default Login;
