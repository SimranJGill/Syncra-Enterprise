import React, { useState, useEffect } from 'react';
import { Award, User, Target, Plus, Check, Briefcase, Sparkles } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

export default function SkillsMarketplaceTab({ user }) {
  const [skills, setSkills] = useState([]);
  const [employeeSkills, setEmployeeSkills] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [heatmap, setHeatmap] = useState([]);

  // Form states
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Frontend');
  const [newSkillProficiency, setNewSkillProficiency] = useState(3);

  // Bidding form states
  const [activeGigId, setActiveGigId] = useState(null);
  const [bidHours, setBidHours] = useState(10);
  const [bidMsg, setBidMsg] = useState('');

  const token = localStorage.getItem('wfm_token');
  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const fetchData = async () => {
    try {
      const rSkills = await fetch(`${API_BASE}/skills`, { headers: getHeaders() });
      if (rSkills.ok) {
        const d = await rSkills.json();
        setSkills(d.skills || []);
      }

      // Load my own employee skills (assuming employee_id = 2 for dummy demo or lookup from user)
      const empId = 2; // Default fallback for local testing
      const rEmpSkills = await fetch(`${API_BASE}/skills/employee/${empId}`, { headers: getHeaders() });
      if (rEmpSkills.ok) {
        const d = await rEmpSkills.json();
        setEmployeeSkills(d.employeeSkills || []);
      }

      // Load heatmap (dept = 1 for HQ)
      const rHeatmap = await fetch(`${API_BASE}/skills/departments/1/heatmap`, { headers: getHeaders() });
      if (rHeatmap.ok) {
        const d = await rHeatmap.json();
        setHeatmap(d.heatmap || []);
      }

      // Load marketplace gigs
      const rGigs = await fetch(`${API_BASE}/skills/gigs`, { headers: getHeaders() });
      if (rGigs.ok) {
        const d = await rGigs.json();
        setGigs(d.gigs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    try {
      const empId = 2; // Default fallback
      const res = await fetch(`${API_BASE}/skills/employee/${empId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          skillName: newSkillName,
          category: newSkillCategory,
          proficiency: newSkillProficiency
        })
      });
      if (res.ok) {
        setNewSkillName('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlaceBid = async (gigId) => {
    try {
      const empId = 2; // Default
      const res = await fetch(`${API_BASE}/skills/gigs/${gigId}/bid`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          employeeId: empId,
          proposedHours: bidHours,
          message: bidMsg
        })
      });
      if (res.ok) {
        setActiveGigId(null);
        setBidMsg('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Upper Grid: Skill Profiles + AI Career paths */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '32px' }}>
        
        {/* Personal Skill Profile Input Form */}
        <div className="auth-card" style={{ padding: '30px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="#3b82f6" /> Add Skill Target
          </h3>
          <form onSubmit={handleAddSkill} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Skill Name</label>
              <input
                type="text"
                placeholder="e.g. React.js, Docker, Python"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Category</label>
                <select
                  value={newSkillCategory}
                  onChange={(e) => setNewSkillCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
                >
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Design">Design</option>
                  <option value="Soft Skills">Soft Skills</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Proficiency (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={newSkillProficiency}
                  onChange={(e) => setNewSkillProficiency(parseInt(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '10px' }}>
              <Plus size={16} /> Save Skill Tag
            </button>
          </form>

          {/* List of current tagged skills */}
          <div style={{ marginTop: '24px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '12.5px', color: '#64748b' }}>Your Tagged Skills</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {employeeSkills.map(sk => (
                <span
                  key={sk.id}
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#2563eb',
                    padding: '4px 10px',
                    borderRadius: '16px',
                    fontSize: '11.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {sk.skill_name} <strong style={{ color: '#1e40af' }}>Lvl {sk.proficiency}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* AI Career Path Suggestions & Heatmap */}
        <div className="auth-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f0fdf4 100%)', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={18} color="#10b981" />
              <h4 style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#166534' }}>AI Career Path Recommendations</h4>
            </div>
            <p style={{ fontSize: '12.5px', color: '#374151', margin: 0 }}>
              Based on your React.js and DevOps skill tag levels, here are potential trajectories:
            </p>
            <ul style={{ fontSize: '12px', color: '#1b5e20', marginTop: '8px', paddingLeft: '20px', lineHeight: '1.6' }}>
              <li><strong>Senior Frontend Developer</strong> — 85% match (Suggest learning TypeScript to level up)</li>
              <li><strong>DevOps Coordinator</strong> — 62% match (Suggest tagging Docker certifications)</li>
            </ul>
          </div>

          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 'bold' }}>Department Skills Coverage Matrix</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '8px' }}>Team Member</th>
                    <th style={{ padding: '8px' }}>Skill</th>
                    <th style={{ padding: '8px' }}>Proficiency</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Coverage Status</th>
                  </tr>
                </thead>
                <tbody>
                  {heatmap.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>No team metrics registered.</td></tr>
                  ) : (
                    heatmap.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{row.employee_name}</td>
                        <td style={{ padding: '8px' }}>{row.skill_name}</td>
                        <td style={{ padding: '8px' }}>Level {row.proficiency}/5</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <span style={{
                            background: row.proficiency >= 4 ? '#d1fae5' : '#fef3c7',
                            color: row.proficiency >= 4 ? '#065f46' : '#92400e',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            fontSize: '10px'
                          }}>
                            {row.proficiency >= 4 ? 'Well Covered' : 'Improvement Recommended'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Gig Marketplace Board */}
      <div className="auth-card" style={{ padding: '30px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Briefcase size={20} color="#8b5cf6" /> Internal Gig Marketplace Board
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {gigs.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '13px', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
              No micro-gigs are currently open for bidding.
            </div>
          ) : (
            gigs.map(g => (
              <div key={g.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>{g.title}</h4>
                  <span style={{ fontSize: '10.5px', background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                    {g.status.toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{g.description}</p>
                <div style={{ fontSize: '11px', color: '#475569' }}>
                  ⏳ Estimated Hours: <strong>{g.estimated_hours} hrs</strong>
                </div>

                {activeGigId === g.id ? (
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="number"
                      placeholder="Proposed Hours"
                      value={bidHours}
                      onChange={(e) => setBidHours(parseInt(e.target.value))}
                      style={{ padding: '6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                    <input
                      type="text"
                      placeholder="Message (e.g. why you are a good fit)"
                      value={bidMsg}
                      onChange={(e) => setBidMsg(e.target.value)}
                      style={{ padding: '6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handlePlaceBid(g.id)} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Submit Bid</button>
                      <button onClick={() => setActiveGigId(null)} style={{ padding: '6px 12px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveGigId(g.id)}
                    style={{
                      marginTop: 'auto',
                      padding: '8px',
                      background: '#4f46e5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Bid on this Gig
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
