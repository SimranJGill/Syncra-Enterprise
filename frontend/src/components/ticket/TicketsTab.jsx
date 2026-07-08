import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, AlertOctagon, User, ShieldCheck } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

export default function TicketsTab({ user }) {
  const [tickets, setTickets] = useState([]);
  const [queue, setQueue] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activeView, setActiveView] = useState('my-tickets'); // 'my-tickets', 'queue'

  // Forms
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTicket, setNewTicket] = useState({ category: 'IT', subject: '', description: '', priority: 'Medium' });

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const token = localStorage.getItem('wfm_token');
  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const fetchMyTickets = async () => {
    try {
      const res = await fetch(`${API_BASE}/tickets/my`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQueue = async () => {
    if (user.role !== 'Admin' && user.role !== 'Super Admin' && user.role !== 'HR') return;
    try {
      const res = await fetch(`${API_BASE}/tickets/queue`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setQueue(data.tickets || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTicketDetails = async (ticket) => {
    setSelectedTicket(ticket);
    try {
      const commRes = await fetch(`${API_BASE}/tickets/${ticket.id}/comments`, { headers: getHeaders() });
      if (commRes.ok) {
        const commData = await commRes.json();
        setComments(commData.comments || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMyTickets();
    fetchQueue();
    if (user.role === 'Admin' || user.role === 'Super Admin' || user.role === 'HR') {
      setActiveView('queue');
    }
  }, []);

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/tickets`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newTicket)
      });
      if (res.ok) {
        setSuccessMessage('Help Desk ticket raised successfully.');
        setShowAddForm(false);
        setNewTicket({ category: 'IT', subject: '', description: '', priority: 'Medium' });
        fetchMyTickets();
      } else {
        const data = await res.json();
        setErrorMessage(data.error);
      }
    } catch (err) {
      setErrorMessage('Network failure raising ticket.');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/tickets/${selectedTicket.id}/comments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ comment: newComment })
      });
      if (res.ok) {
        setNewComment('');
        fetchTicketDetails(selectedTicket);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveTicket = async (ticketId, statusUpdate) => {
    try {
      const res = await fetch(`${API_BASE}/tickets/${ticketId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: statusUpdate })
      });
      if (res.ok) {
        setSuccessMessage(`Ticket marked as ${statusUpdate}.`);
        fetchQueue();
        fetchMyTickets();
        setSelectedTicket(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getAgingBadgeColor = (createdAtStr) => {
    const ageHrs = (new Date() - new Date(createdAtStr)) / (1000 * 60 * 60);
    if (ageHrs > 72) return { bg: '#fee2e2', text: '#991b1b', label: 'Urgent SLA Breach (>72h)' };
    if (ageHrs > 24) return { bg: '#fef9c3', text: '#854d0e', label: 'Aging Warning (>24h)' };
    return { bg: '#dcfce7', text: '#166534', label: 'Within SLA (<24h)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Messages */}
      {errorMessage && (
        <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', fontSize: '13px' }}>
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div style={{ padding: '12px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', color: '#166534', fontSize: '13px' }}>
          {successMessage}
        </div>
      )}

      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {(user.role === 'Admin' || user.role === 'Super Admin' || user.role === 'HR') && (
            <button
              onClick={() => setActiveView('queue')}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeView === 'queue' ? '#eff6ff' : 'transparent', color: activeView === 'queue' ? '#2563eb' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
            >
              IT Support Queue
            </button>
          )}
          <button
            onClick={() => setActiveView('my-tickets')}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeView === 'my-tickets' ? '#eff6ff' : 'transparent', color: activeView === 'my-tickets' ? '#2563eb' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
          >
            My Raised Tickets
          </button>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'var(--pastel-red)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
        >
          <Plus size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> File Ticket
        </button>
      </div>

      {/* IT Support Queue View */}
      {activeView === 'queue' && (
        <div className="auth-card" style={{ padding: '24px', background: 'white', border: '1px solid #cbd5e1' }}>
          <h3 style={{ margin: 0, fontWeight: '700', fontSize: '16px', marginBottom: '16px' }}>Help Desk Active Incoming Tickets</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                <th style={{ padding: '10px 8px' }}>Category</th>
                <th style={{ padding: '10px 8px' }}>Subject</th>
                <th style={{ padding: '10px 8px' }}>Priority</th>
                <th style={{ padding: '10px 8px' }}>Reporter</th>
                <th style={{ padding: '10px 8px' }}>SLA Age</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
                <th style={{ padding: '10px 8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {queue.map(ticket => {
                const sla = getAgingBadgeColor(ticket.created_at);
                return (
                  <tr key={ticket.id} style={{ borderBottom: '1px solid #e2e8f0', color: '#334155' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{ticket.category}</td>
                    <td style={{ padding: '10px 8px' }}>{ticket.subject}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ color: ticket.priority === 'Urgent' ? '#b91c1c' : '#475569', fontWeight: 'bold' }}>{ticket.priority}</span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>{ticket.raised_by_name}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ fontSize: '11px', background: sla.bg, color: sla.text, padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        {sla.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>{ticket.status}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <button
                        onClick={() => fetchTicketDetails(ticket)}
                        style={{ padding: '4px 8px', fontSize: '11.5px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Respond
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Employee My Tickets View */}
      {activeView === 'my-tickets' && (
        <div className="auth-card" style={{ padding: '24px', background: 'white', border: '1px solid #cbd5e1' }}>
          <h3 style={{ margin: 0, fontWeight: '700', fontSize: '16px', marginBottom: '16px' }}>Your Filed Support Tickets</h3>
          {tickets.length === 0 ? (
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>You have not filed any tickets.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '10px 8px' }}>Category</th>
                  <th style={{ padding: '10px 8px' }}>Subject</th>
                  <th style={{ padding: '10px 8px' }}>Priority</th>
                  <th style={{ padding: '10px 8px' }}>Linked Asset</th>
                  <th style={{ padding: '10px 8px' }}>Status</th>
                  <th style={{ padding: '10px 8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{t.category}</td>
                    <td style={{ padding: '10px 8px' }}>{t.subject}</td>
                    <td style={{ padding: '10px 8px' }}>{t.priority}</td>
                    <td style={{ padding: '10px 8px' }}>{t.asset_name || '--'}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: t.status === 'Resolved' ? '#dcfce7' : '#eff6ff', color: t.status === 'Resolved' ? '#166534' : '#2563eb', fontWeight: 'bold' }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <button
                        onClick={() => fetchTicketDetails(t)}
                        style={{ padding: '4px 8px', fontSize: '11px', background: '#cbd5e1', color: '#1e293b', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        View Thread
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Ticket Details & Comments Modal */}
      {selectedTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div className="auth-card" style={{ padding: '30px', maxWidth: '500px', background: 'white' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>{selectedTicket.subject}</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '6px 0 16px 0' }}>{selectedTicket.description || 'No description provided.'}</p>

            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#475569', background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>
              <div>Category: <strong>{selectedTicket.category}</strong></div>
              <div>Priority: <strong>{selectedTicket.priority}</strong></div>
              <div>Status: <strong>{selectedTicket.status}</strong></div>
            </div>

            {/* Comments thread */}
            <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {comments.map(c => (
                <div key={c.id} style={{ fontSize: '12px', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px' }}>
                  <strong>{c.user_name}:</strong> {c.comment}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Reply to ticket thread..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{ flex: 1, padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              />
              <button type="submit" style={{ padding: '6px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Reply</button>
            </form>

            <div style={{ display: 'flex', gap: '8px' }}>
              {selectedTicket.status !== 'Resolved' && (user.role === 'Admin' || user.role === 'Super Admin' || user.role === 'HR') && (
                <button
                  onClick={() => handleResolveTicket(selectedTicket.id, 'Resolved')}
                  style={{ flex: 1, padding: '10px', background: '#166534', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                  Mark Resolved
                </button>
              )}
              <button
                onClick={() => setSelectedTicket(null)}
                style={{ flex: 1, padding: '10px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
              >
                Close Thread
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Ticket Modal */}
      {showAddForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <form onSubmit={handleRaiseTicket} className="auth-card" style={{ padding: '30px', maxWidth: '400px', background: 'white' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Raise Support Ticket</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <select
                value={newTicket.category}
                onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="IT">IT Technical Support</option>
                <option value="HR">HR Policies & Benefits</option>
                <option value="Facilities">Facilities & Office Space</option>
                <option value="Payroll">Payroll & Taxes</option>
                <option value="Asset issue">Asset Issue (Broken hardware)</option>
                <option value="Other">Other Concerns</option>
              </select>
              <input
                type="text"
                placeholder="Subject line"
                required
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
              <textarea
                placeholder="Describe your issue in detail..."
                required
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '85px' }}
              />
              <select
                value={newTicket.priority}
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Urgent">Urgent Priority</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--pastel-red)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Raise Ticket</button>
              <button type="button" onClick={() => setShowAddForm(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#e2e8f0', color: '#475569', border: 'none', cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
