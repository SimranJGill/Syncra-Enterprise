import React, { useState } from 'react';

const Register = ({ onRegisterSuccess, toggleView }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Employee');
  const [organization, setOrganization] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Basic input validation
    if (!name || !email || !password || !role || !organization) {
      setMessage({ type: 'error', text: 'All fields are required.' });
      setLoading(false);
      return;
    }

    if ((role === 'Admin' || role === 'Super Admin') && !accessCode) {
      setMessage({ type: 'error', text: 'Access code is required for Admin/Super Admin registration.' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          organization,
          accessCode: (role === 'Admin' || role === 'Super Admin') ? accessCode : undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setMessage({ type: 'success', text: 'Registration successful! Redirecting to login...' });
      
      // Auto toggle to Login view after 1.5 seconds
      setTimeout(() => {
        onRegisterSuccess();
      }, 1500);
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
        <p className="auth-subtitle">Create your Workforce Operations Account</p>
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
            type="text"
            id="name"
            className="form-control"
            placeholder=" "
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
          />
          <label htmlFor="name" className="form-label">Full Name</label>
        </div>

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

        <div className="form-group">
          <input
            type="text"
            id="organization"
            className="form-control"
            placeholder=" "
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            disabled={loading}
            required
          />
          <label htmlFor="organization" className="form-label">Organization / Company</label>
        </div>

        <div className="form-group form-select-container">
          <select
            id="role"
            className="form-control form-select"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setAccessCode(''); // Reset access code
            }}
            disabled={loading}
            required
          >
            <option value="Employee">Employee</option>
            <option value="Admin">Admin (Manager/HR)</option>
            <option value="Super Admin">Super Admin (System Owner)</option>
          </select>
          <label htmlFor="role" className="form-label">Select Workspace Role</label>
        </div>

        {/* Dynamic Access Code field */}
        {(role === 'Admin' || role === 'Super Admin') && (
          <>
            <div className="access-code-banner">
              <span>🛈</span>
              <span>
                Demo access code required: 
                <strong> {role === 'Admin' ? 'ADMIN2026' : 'SUPER2026'}</strong>
              </span>
            </div>
            <div className="form-group">
              <input
                type="text"
                id="accessCode"
                className="form-control"
                placeholder=" "
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                disabled={loading}
                required
              />
              <label htmlFor="accessCode" className="form-label">Security Access Code</label>
            </div>
          </>
        )}

        <button 
          type="submit" 
          className="btn-primary" 
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="auth-toggle">
        Already have an account?{' '}
        <span className="auth-toggle-link" onClick={toggleView}>
          Sign in
        </span>
      </div>
    </div>
  );
};

export default Register;
