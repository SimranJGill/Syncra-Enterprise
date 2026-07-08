import React, { useState, useEffect } from 'react';
import { Award, Gift, Sparkles, Trophy, Users, Heart } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

export default function GamificationTab({ user }) {
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Kudos Form States
  const [kudosRecipient, setKudosRecipient] = useState('');
  const [kudosMsg, setKudosMsg] = useState('');
  const [kudosPoints, setKudosPoints] = useState(10);
  const [giftSuccess, setGiftSuccess] = useState(null);

  const token = localStorage.getItem('wfm_token');
  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const fetchData = async () => {
    try {
      const res1 = await fetch(`${API_BASE}/gamification/profile`, { headers: getHeaders() });
      if (res1.ok) {
        const data = await res1.json();
        setProfile(data.profile);
      }

      const res2 = await fetch(`${API_BASE}/gamification/leaderboard`, { headers: getHeaders() });
      if (res2.ok) {
        const data = await res2.json();
        setLeaderboard(data.leaderboard || []);
      }

      const res3 = await fetch(`${API_BASE}/employees?limit=100`, { headers: getHeaders() });
      if (res3.ok) {
        const data = await res3.json();
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGiftKudos = async (e) => {
    e.preventDefault();
    if (!kudosRecipient) return;

    try {
      const res = await fetch(`${API_BASE}/gamification/kudos`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          toEmployeeId: kudosRecipient,
          message: kudosMsg,
          points: kudosPoints
        })
      });
      if (res.ok) {
        setKudosRecipient('');
        setKudosMsg('');
        setGiftSuccess('Kudos successfully gifted!');
        fetchData();
        setTimeout(() => setGiftSuccess(null), 3000);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to gift kudos.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Upper Grid: Profile indicators + Kudos gifting */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '32px' }}>
        
        {/* Profile XP meter and streaks */}
        {profile && (
          <div className="auth-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="#f59e0b" /> Employee XP Level
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px', fontWeight: '900', color: '#f59e0b' }}>Lvl {profile.level}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Progress to Level {profile.level + 1}</span>
                  <strong>{profile.total_xp % 500} / 500 XP</strong>
                </div>
                <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${((profile.total_xp % 500) / 500) * 100}%`, height: '100%', background: '#f59e0b' }} />
                </div>
              </div>
            </div>

            {/* Badges strip */}
            <div style={{ marginTop: '10px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: '#64748b' }}>Earned Badges</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {profile.badges.map(b => (
                  <span
                    key={b}
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      color: '#b45309',
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    🏆 {b.replace('_', ' ').toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* Streaks counters */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
              🔥 Attendance Streak: <strong>{profile.streaks?.attendance || 1} days</strong>
            </div>
          </div>
        )}

        {/* Peer Kudos gifting panel form */}
        <div className="auth-card" style={{ padding: '30px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gift size={18} color="#ec4899" /> Gift Peer Kudos Points
          </h3>

          <form onSubmit={handleGiftKudos} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#64748b', marginBottom: '6px' }}>Select Recipient</label>
                <select
                  value={kudosRecipient}
                  onChange={(e) => setKudosRecipient(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: 'white' }}
                  required
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#64748b', marginBottom: '6px' }}>Points value</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={kudosPoints}
                  onChange={(e) => setKudosPoints(parseInt(e.target.value))}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', color: '#64748b', marginBottom: '6px' }}>Message / Reason</label>
              <input
                type="text"
                placeholder="e.g. Thanks for helping with the Docker deployment!"
                value={kudosMsg}
                onChange={(e) => setKudosMsg(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ background: '#ec4899', border: 'none', padding: '10px' }}>
              <Heart size={16} /> Send Kudos Points
            </button>

            {giftSuccess && (
              <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>{giftSuccess}</div>
            )}
          </form>
        </div>

      </div>

      {/* Leadership Scoreboard */}
      <div className="auth-card" style={{ padding: '30px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={20} color="#f59e0b" /> Department XP Leaderboard
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {leaderboard.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No XP leader rankings available.</div>
          ) : (
            leaderboard.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: idx === 0 ? '#fffbeb' : '#f8fafc', borderRadius: '8px', border: idx === 0 ? '1px solid #fde68a' : '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#64748b', width: '20px' }}>#{idx + 1}</span>
                  <strong style={{ fontSize: '13.5px' }}>{item.employee_name}</strong>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px' }}>
                  <span>Level {item.level}</span>
                  <strong style={{ color: '#f59e0b' }}>{item.total_xp} XP</strong>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
