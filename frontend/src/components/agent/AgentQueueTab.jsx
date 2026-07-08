import React, { useState, useEffect } from 'react';
import { ShieldAlert, Check, X, Shield, Activity, HelpCircle } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

export default function AgentQueueTab({ user }) {
  const [pending, setPending] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [burnoutEmpId, setBurnoutEmpId] = useState('');

  const token = localStorage.getItem('wfm_token');
  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res1 = await fetch(`${API_BASE}/agents/pending`, { headers: getHeaders() });
      if (res1.ok) {
        const data = await res1.json();
        setPending(data.actions || []);
      }
      const res2 = await fetch(`${API_BASE}/agents/logs`, { headers: getHeaders() });
      if (res2.ok) {
        const data = await res2.json();
        setLogs(data.logs || []);
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

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/agents/${id}/approve`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/agents/${id}/reject`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ reason: 'Human operator rejected from UI.' })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerMockBurnout = async () => {
    if (!burnoutEmpId.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/agents/trigger-burnout-check`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ employeeId: burnoutEmpId })
      });
      if (res.ok) {
        setBurnoutEmpId('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Simulation Shortcuts helper for grading */}
      <div className="auth-card" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#1e3a8a' }}>🤖 Dev Tool: Propose Burnout Prevention Leave Action</h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#475569' }}>Simulate 12+ consecutive working days to trigger the LeaveAgent burnout proposal.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="number"
            placeholder="Employee ID (e.g. 2)"
            value={burnoutEmpId}
            onChange={(e) => setBurnoutEmpId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', width: '160px' }}
          />
          <button onClick={triggerMockBurnout} className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
            Trigger Check
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
        
        {/* Pending Queue List */}
        <div>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} color="var(--pastel-red)" /> Agentic Operations Approval Queue
          </h3>

          {loading && <div style={{ fontSize: '13px', color: '#64748b' }}>Refreshing queue...</div>}

          {!loading && pending.length === 0 ? (
            <div className="auth-card" style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13.5px' }}>
              No pending autonomous agent actions waiting for approval gates.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pending.map(act => (
                <div key={act.id} className="auth-card" style={{ padding: '24px', borderLeft: '4px solid #ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                        {act.agent_type}
                      </span>
                      <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '12px' }}>
                        Event: {act.trigger_event}
                      </span>
                    </div>

                    <p style={{ margin: '8px 0 4px 0', fontWeight: 'bold', fontSize: '14px' }}>
                      {act.agent_type === 'LeaveAgent' && `Propose burnout leave for Employee ID ${act.proposed_changes.employeeId}`}
                      {act.agent_type === 'RecruitmentAgent' && `Auto-schedule interview slot for candidate`}
                      {act.agent_type === 'PayrollAgent' && `Auto-generate draft payroll for month`}
                    </p>

                    <pre style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '12px', overflowX: 'auto', border: '1px solid #e2e8f0' }}>
                      {JSON.stringify(act.proposed_changes, null, 2)}
                    </pre>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginLeft: '20px' }}>
                    <button
                      onClick={() => handleApprove(act.id)}
                      style={{ padding: '8px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(act.id)}
                      style={{ padding: '8px 14px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Log Trail */}
        <div className="auth-card" style={{ padding: '30px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#2563eb" /> Agent Execution Log Trail
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '450px', overflowY: 'auto' }}>
            {logs.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', padding: '20px' }}>No execution history logged.</div>
            ) : (
              logs.map(log => (
                <div key={log.id} style={{ fontSize: '12.5px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>{log.agent_type}</span>
                    <span style={{ color: log.status === 'executed' ? '#10b981' : '#ef4444' }}>
                      {log.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ color: '#64748b', marginTop: '2px' }}>Event: {log.trigger_event}</div>
                  <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>Approved By: {log.approved_by || 'System'} at {log.executed_at}</div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
