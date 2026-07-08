import React, { useState, useEffect } from 'react';
import { Bell, ShieldCheck, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import io from 'socket.io-client';

const API_BASE = 'http://localhost:5000/api/v1';

export default function NotificationsCenter({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState({ email_enabled: 1, in_app_enabled: 1 });
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'preferences'
  
  const token = localStorage.getItem('wfm_token');
  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/preferences`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences || { email_enabled: 1, in_app_enabled: 1 });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/read-all`, { method: 'POST', headers: getHeaders() });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'POST', headers: getHeaders() });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePreferences = async (emailVal, inAppVal) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/preferences`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ emailEnabled: emailVal, inAppEnabled: inAppVal })
      });
      if (res.ok) {
        setPreferences({ email_enabled: emailVal ? 1 : 0, in_app_enabled: inAppVal ? 1 : 0 });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();

    // Hook up real-time Socket.IO delivery
    const socket = io('http://localhost:5000');
    socket.emit('join', user.id);

    socket.on('notification', (notif) => {
      // Optimistic state push
      setNotifications(prev => [notif, ...prev]);
      
      // Real-time toast popup notification banner
      showToastNotification(notif);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const showToastNotification = (notif) => {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.background = '#0f172a';
    toast.style.color = 'white';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
    toast.style.zIndex = 2000;
    toast.style.fontSize = '13px';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '8px';
    toast.style.transition = 'opacity 0.3s';
    toast.innerHTML = `🔔 <strong>${notif.title}</strong>: ${notif.message}`;

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          borderRadius: '50%',
          outline: 'none'
        }}
      >
        <Bell size={20} color="#64748b" />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: 'var(--pastel-red)',
            color: 'white',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            fontSize: '9px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Box */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '40px',
          right: 0,
          width: '320px',
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          zIndex: 1150,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
            <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>Alerts</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveTab('list')}
                style={{ fontSize: '11px', border: 'none', background: 'transparent', color: activeTab === 'list' ? '#2563eb' : '#64748b', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Recent
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                style={{ fontSize: '11px', border: 'none', background: 'transparent', color: activeTab === 'preferences' ? '#2563eb' : '#64748b', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Preferences
              </button>
            </div>
          </div>

          {/* List view */}
          {activeTab === 'list' && (
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>No notifications yet.</div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      background: n.read ? 'white' : '#f8fafc',
                      cursor: 'pointer',
                      fontSize: '12px',
                      lineHeight: '1.4'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#1e293b', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{n.title}</span>
                      {!n.read && <span style={{ width: '6px', height: '6px', background: '#3b82f6', borderRadius: '50%' }} />}
                    </div>
                    <div style={{ color: '#64748b', marginTop: '2px' }}>{n.message}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{n.created_at}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Preferences view */}
          {activeTab === 'preferences' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#334155' }}>Email Alerts</span>
                <input
                  type="checkbox"
                  checked={preferences.email_enabled === 1}
                  onChange={(e) => handleSavePreferences(e.target.checked, preferences.in_app_enabled === 1)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#334155' }}>In-App Toasts</span>
                <input
                  type="checkbox"
                  checked={preferences.in_app_enabled === 1}
                  onChange={(e) => handleSavePreferences(preferences.email_enabled === 1, e.target.checked)}
                />
              </div>
            </div>
          )}

          {/* Footer Action */}
          {activeTab === 'list' && notifications.length > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                width: '100%',
                padding: '10px',
                background: '#f8fafc',
                border: 'none',
                borderTop: '1px solid #e2e8f0',
                color: '#2563eb',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Mark all as read
            </button>
          )}
        </div>
      )}
    </div>
  );
}
