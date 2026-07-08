import React, { useState, useEffect } from 'react';
import { ShieldAlert, TrendingDown, Users, DollarSign, Calendar, TrendingUp } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

export default function WorkforceSimulatorTab({ user }) {
  const [risks, setRisks] = useState([]);
  const [simResults, setSimResults] = useState(null);
  const [loadingSim, setLoadingSim] = useState(false);

  // Hiring Simulator Variables
  const [hiringCount, setHiringCount] = useState(3);

  // Leave Storm Variables
  const [pendingLeaveCount, setPendingLeaveCount] = useState(5);

  // Resignation Variables
  const [targetEmpName, setTargetEmpName] = useState('John Doe');

  // Budget Variables
  const [budgetCutPercentage, setBudgetCutPercentage] = useState(10);

  const token = localStorage.getItem('wfm_token');
  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const fetchRiskProfiles = async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/attrition-risk`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRisks(data.risks || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRiskProfiles();
  }, []);

  const runSimulation = async (type) => {
    setLoadingSim(true);
    let variables = {};
    if (type === 'hiring') {
      variables = { count: hiringCount };
    } else if (type === 'leave_storm') {
      variables = { pendingCount: pendingLeaveCount };
    } else if (type === 'resignation') {
      variables = { employeeName: targetEmpName };
    } else if (type === 'budget') {
      variables = { percentage: budgetCutPercentage };
    }

    try {
      const res = await fetch(`${API_BASE}/analytics/simulate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ scenarioType: type, variables })
      });
      if (res.ok) {
        const data = await res.json();
        setSimResults({ type, outcomes: data.projectedOutcomes });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSim(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Upper Layout: Risk profiles list */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '32px' }}>
        
        {/* Attrition Risk Profiles Scorecard list */}
        <div className="auth-card" style={{ padding: '30px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} color="var(--pastel-red)" /> Attrition Risk Heatmap
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '350px', overflowY: 'auto' }}>
            {risks.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', padding: '20px' }}>No high-risk employee flags recorded.</div>
            ) : (
              risks.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{r.employee_name}</div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{r.department_name || 'General HQ'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      background: r.attrition_risk_score > 60 ? '#fee2e2' : '#fef3c7',
                      color: r.attrition_risk_score > 60 ? '#ef4444' : '#d97706',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      Risk: {r.attrition_risk_score}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* What-If Simulator Widgets */}
        <div className="auth-card" style={{ padding: '30px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>
            Workforce What-If Decision Simulator
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* 1. Hiring Impact Simulator */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold' }}>Hiring Impact</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', color: '#64748b' }}>Projected Headcount Addition</label>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={hiringCount}
                  onChange={(e) => setHiringCount(parseInt(e.target.value))}
                />
                <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Count: {hiringCount}</span>
                  <button onClick={() => runSimulation('hiring')} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10.5px', cursor: 'pointer' }}>Simulate</button>
                </div>
              </div>
            </div>

            {/* 2. Leave Storm Simulator */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold' }}>Leave Storm</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', color: '#64748b' }}>Approve Pending Leaves</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={pendingLeaveCount}
                  onChange={(e) => setPendingLeaveCount(parseInt(e.target.value))}
                />
                <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Count: {pendingLeaveCount}</span>
                  <button onClick={() => runSimulation('leave_storm')} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10.5px', cursor: 'pointer' }}>Simulate</button>
                </div>
              </div>
            </div>

            {/* 3. Resignation Impact */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold' }}>Resignation Ripple</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', color: '#64748b' }}>Target Employee Resigns</label>
                <input
                  type="text"
                  value={targetEmpName}
                  onChange={(e) => setTargetEmpName(e.target.value)}
                  style={{ padding: '4px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
                <button onClick={() => runSimulation('resignation')} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Simulate Ripple</button>
              </div>
            </div>

            {/* 4. Budget Cut */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold' }}>Budget Optimization</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', color: '#64748b' }}>Payroll Cost Reduction</label>
                <input
                  type="range"
                  min="5"
                  max="35"
                  value={budgetCutPercentage}
                  onChange={(e) => setBudgetCutPercentage(parseInt(e.target.value))}
                />
                <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Cut: {budgetCutPercentage}%</span>
                  <button onClick={() => runSimulation('budget')} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10.5px', cursor: 'pointer' }}>Simulate</button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Simulator outputs display */}
      {simResults && (
        <div className="auth-card" style={{ padding: '30px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <h4 style={{ margin: '0 0 16px 0', textTransform: 'uppercase', fontSize: '12px', fontWeight: 'bold', color: '#1e40af', letterSpacing: '0.5px' }}>
            🔮 Projected Scenario Outcomes ({simResults.type} scenario)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {Object.entries(simResults.outcomes).map(([key, val]) => (
              <div key={key} style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'capitalize', marginBottom: '4px' }}>
                  {key.replace(/([A-Z])/g, ' $1')}
                </div>
                <strong style={{ fontSize: '14px', color: '#1e293b' }}>
                  {Array.isArray(val) ? val.join(', ') : val}
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
