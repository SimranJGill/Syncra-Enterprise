import React, { useState, useEffect } from 'react';
import { GitMerge, Users, DollarSign, Plus, Check } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

export default function ScenarioOrgChartTab({ user }) {
  const [orgData, setOrgData] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(false);

  // Scenario Plan Form
  const [scenarioName, setScenarioName] = useState('');
  const [changesList, setChangesList] = useState([]);
  const [projectedCostChange, setProjectedCostChange] = useState(0);

  // Node move helper states
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [targetManagerId, setTargetManagerId] = useState('');

  const token = localStorage.getItem('wfm_token');
  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/org-chart`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setOrgData(data.orgData || []);
      }

      const resScen = await fetch(`${API_BASE}/org-chart/scenarios`, { headers: getHeaders() });
      if (resScen.ok) {
        const data = await resScen.json();
        setScenarios(data.scenarios || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddChange = () => {
    if (!selectedNodeId || !targetManagerId) return;

    const movingNode = orgData.find(o => o.id === parseInt(selectedNodeId));
    const targetManager = orgData.find(o => o.id === parseInt(targetManagerId));
    if (!movingNode || !targetManager) return;

    const changeItem = {
      employeeId: movingNode.id,
      employeeName: movingNode.name,
      toManagerId: targetManager.id,
      toManagerName: targetManager.name
    };

    setChangesList([...changesList, changeItem]);
    // Simulate cost impact: mock restructure adjustment fee
    setProjectedCostChange(prev => prev + 1200);

    setSelectedNodeId('');
    setTargetManagerId('');
  };

  const handleSaveScenario = async (e) => {
    e.preventDefault();
    if (!scenarioName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/org-chart/scenarios`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          scenarioName,
          changes: changesList,
          projectedImpact: { costImpact: `+$${projectedCostChange}/month`, nodeMoves: changesList.length }
        })
      });
      if (res.ok) {
        setScenarioName('');
        setChangesList([]);
        setProjectedCostChange(0);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '32px' }}>
        
        {/* Interactive Org tree view */}
        <div className="auth-card" style={{ padding: '30px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 'bold' }}>Live Organizational Reporting Structure</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            {orgData.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>No employees registered.</div>
            ) : (
              orgData.map(node => (
                <div key={node.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: 'white', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                  <div>
                    <strong style={{ color: '#1e293b' }}>{node.name}</strong>
                    <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>({node.role})</span>
                  </div>
                  <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{node.department || 'HQ'}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* What-If Reorg Scenario Planner Form */}
        <div className="auth-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitMerge size={18} color="#2563eb" /> Reorg Scenario Sandbox
          </h3>

          {/* Node move mock selector */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '12px', color: '#475569' }}>Simulate Reporting Shift</h4>
            
            <select
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              style={{ width: '100%', padding: '6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white' }}
            >
              <option value="">-- Drag employee --</option>
              {orgData.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>

            <select
              value={targetManagerId}
              onChange={(e) => setTargetManagerId(e.target.value)}
              style={{ width: '100%', padding: '6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white' }}
            >
              <option value="">-- Under Manager --</option>
              {orgData.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>

            <button onClick={handleAddChange} className="btn-primary" style={{ padding: '6px', fontSize: '11px' }}>
              Add to Sandbox Simulation
            </button>
          </div>

          {/* Sandbox draft log */}
          {changesList.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <h4 style={{ margin: 0, fontWeight: 'bold' }}>Draft Node Adjustments</h4>
              {changesList.map((c, i) => (
                <div key={i} style={{ color: '#475569' }}>
                  🔄 Shift <strong>{c.employeeName}</strong> under manager <strong>{c.toManagerName}</strong>
                </div>
              ))}
              <div style={{ marginTop: '8px', padding: '10px', background: '#eff6ff', borderRadius: '6px', color: '#1e40af' }}>
                💰 Cost Impact: <strong>+${projectedCostChange}/month</strong>
              </div>
            </div>
          )}

          {/* Save Scenario Form */}
          <form onSubmit={handleSaveScenario} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="Scenario Plan Name (e.g. Q3 Restructure)"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
              required
            />
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Save Scenario Plan
            </button>
          </form>
        </div>

      </div>

      {/* List of saved scenario plans */}
      <div className="auth-card" style={{ padding: '30px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 'bold' }}>Saved Reorganization Scenario Archive</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {scenarios.map(sc => (
            <div key={sc.id} style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '16px', background: '#f8fafc' }}>
              <h4 style={{ margin: 0, fontWeight: 'bold', fontSize: '13.5px' }}>{sc.scenario_name}</h4>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                ⚡ Node moves: {sc.projected_impact.nodeMoves || 0}
              </div>
              <div style={{ fontSize: '11.5px', color: '#1e40af', fontWeight: 'bold', marginTop: '4px' }}>
                Cost Outcome: {sc.projected_impact.costImpact || 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
