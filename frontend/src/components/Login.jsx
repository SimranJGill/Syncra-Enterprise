import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

const CaptchaV2Fallback = ({ onChange }) => {
  const [checked, setChecked] = useState(false);
  const handleCheck = () => {
    const nextState = !checked;
    setChecked(nextState);
    onChange(nextState ? 'mock_v2_captcha_token_123' : '');
  };
  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        margin: '16px 0',
        cursor: 'pointer',
        boxSizing: 'border-box'
      }} 
      onClick={handleCheck}
    >
      <input 
        type="checkbox" 
        checked={checked} 
        readOnly 
        style={{ cursor: 'pointer', width: '18px', height: '18px' }} 
      />
      <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>I'm not a robot</span>
      <img 
        src="https://www.gstatic.com/recaptcha/api2/logo_48.png" 
        alt="recaptcha" 
        style={{ width: '22px', height: '22px', marginLeft: 'auto' }} 
      />
    </div>
  );
};

const Login = ({ onLoginSuccess, toggleView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Captcha states
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [captchaV2Response, setCaptchaV2Response] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('mock_v3_recaptcha_token');

  // OAuth states
  const [config, setConfig] = useState({ googleEnabled: false, linkedinEnabled: false });

  useEffect(() => {
    // Query backend to check if OAuth API credentials exist in environment variables
    fetch(`${API_BASE}/auth/config`)
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => console.warn('OAuth config query failed:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!email || !password) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      setLoading(false);
      return;
    }

    // If Captcha is required (after 3 failures), verify it is checked
    if (failedAttempts >= 3 && !captchaV2Response) {
      setMessage({ type: 'error', text: 'Please complete the CAPTCHA check.' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password,
          recaptchaToken,
          captchaV2Response
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please check credentials.');
      }

      setMessage({ type: 'success', text: data.message });
      setFailedAttempts(0);
      setCaptchaV2Response('');

      setTimeout(() => {
        onLoginSuccess(data.token, data.user);
      }, 800);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      // Increment failed attempts on credential failures
      setFailedAttempts(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setMessage({ type: 'error', text: 'Email address is required.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card" style={{ position: 'relative' }}>
      <div className="auth-header">
        <h1 className="auth-logo" style={{ color: 'var(--pastel-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          Syncra
          <span style={{ color: '#1e3a8a', fontSize: '18px', fontWeight: '500' }}>Enterprise Workforce</span>
        </h1>
        <p className="auth-subtitle">AI-Powered Workforce Operations Assistant</p>
      </div>

      {message && (
        <div className={`toast-msg toast-${message.type}`}>
          <span>{message.type === 'success' ? '✓' : '⚠'}</span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Forgot Password Mode Form */}
      {forgotMode ? (
        <form onSubmit={handleForgotPassword} noValidate>
          <div style={{ marginBottom: '24px', fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Enter your account email below. We will simulate sending a password reset link to your email address.
          </div>
          <div className="form-group">
            <input
              type="email"
              id="resetEmail"
              className="form-control"
              placeholder=" "
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              disabled={loading}
              required
            />
            <label htmlFor="resetEmail" className="form-label">Account Email Address</label>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span 
              className="auth-toggle-link" 
              onClick={() => { setForgotMode(false); setMessage(null); }}
              style={{ fontSize: '13.5px' }}
            >
              ← Back to Login
            </span>
          </div>
        </form>
      ) : (
        /* Standard Login Mode Form */
        <>
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

            <div className="form-group" style={{ marginBottom: '8px' }}>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              {failedAttempts > 0 && failedAttempts < 3 && (
                <span style={{ fontSize: '11px', color: 'var(--pastel-red)', fontWeight: 'bold' }}>
                  {3 - failedAttempts} attempts remaining before CAPTCHA
                </span>
              )}
              <span 
                className="auth-toggle-link" 
                onClick={() => { setForgotMode(true); setMessage(null); }}
                style={{ fontSize: '13px', fontWeight: 500, marginLeft: 'auto' }}
              >
                Forgot password?
              </span>
            </div>

            {/* Captcha v2 fallback trigger after 3 failed login attempts */}
            {failedAttempts >= 3 && (
              <CaptchaV2Fallback onChange={setCaptchaV2Response} />
            )}

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Social Logins Section */}
          <div style={{ margin: '24px 0 16px 0', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', margin: '16px 0' }}>
              <hr style={{ flexGrow: 1, border: 'none', borderTop: '1px solid rgba(74,46,42,0.08)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Or login through</span>
              <hr style={{ flexGrow: 1, border: 'none', borderTop: '1px solid rgba(74,46,42,0.08)' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {/* Google OAuth Button */}
              <button 
                type="button" 
                className="btn-secondary" 
                title={config.googleEnabled ? "Sign in with Google" : "Coming soon"}
                style={{ 
                  flexGrow: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  padding: '8px 16px', 
                  fontSize: '13px', 
                  border: '1px solid rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  opacity: 1
                }}
                onClick={() => {
                  // Direct redirect to backend oauth path
                  window.location.href = `${API_BASE}/auth/google`;
                }}
              >
                <img src="https://images.coolfields.co.uk/g-logo.png" alt="G" style={{ width: '14px', height: '14px' }} onError={(e) => { e.target.style.display='none'; }} />
                Google {!config.googleEnabled && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(Demo)</span>}
              </button>

              {/* LinkedIn OAuth Button */}
              <button 
                type="button" 
                className="btn-secondary" 
                title={config.linkedinEnabled ? "Sign in with LinkedIn" : "Coming soon"}
                style={{ 
                  flexGrow: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  padding: '8px 16px', 
                  fontSize: '13px', 
                  border: '1px solid rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  opacity: 1
                }}
                onClick={() => {
                  window.location.href = `${API_BASE}/auth/linkedin`;
                }}
              >
                <span style={{ color: '#0077B5', fontWeight: 'bold', fontSize: '14px' }}>in</span>
                LinkedIn {!config.linkedinEnabled && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(Demo)</span>}
              </button>
            </div>
          </div>
        </>
      )}

      <div className="auth-toggle" style={{ marginTop: '24px' }}>
        Don't have an account?{' '}
        <span className="auth-toggle-link" onClick={toggleView}>
          Create new account
        </span>
      </div>
    </div>
  );
};

export default Login;
