import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';

function App() {
  const [view, setView] = useState('login'); // 'login', 'register', 'dashboard'
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('wfm_token');
      const savedUser = localStorage.getItem('wfm_user');

      if (!token || !savedUser) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/v1/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setView('dashboard');
        } else {
          // Token is invalid/expired
          localStorage.removeItem('wfm_token');
          localStorage.removeItem('wfm_user');
        }
      } catch (err) {
        console.error('Session validation error:', err.message);
        // On network error, we keep offline details or require relogin
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLoginSuccess = (token, loggedInUser) => {
    localStorage.setItem('wfm_token', token);
    localStorage.setItem('wfm_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('wfm_token');
    localStorage.removeItem('wfm_user');
    setUser(null);
    setView('login');
  };

  const handleRegisterSuccess = () => {
    setView('login');
  };

  if (loading) {
    return (
      <div className="app-container" style={{ flexDirection: 'column', gap: '16px' }}>
        <div className="spinner-arc" style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '3px solid var(--pastel-yellow)',
          borderTopColor: 'var(--pastel-red)',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)', fontSize: '14px' }}>
          Loading session...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-container">
      {view === 'login' && (
        <Login 
          onLoginSuccess={handleLoginSuccess} 
          toggleView={() => setView('register')} 
        />
      )}
      {view === 'register' && (
        <Register 
          onRegisterSuccess={handleRegisterSuccess} 
          toggleView={() => setView('login')} 
        />
      )}
      {view === 'dashboard' && user && (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
}

export default App;
