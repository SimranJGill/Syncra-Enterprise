import React, { useState, useEffect } from 'react';
import { Plus, Monitor, Shield, Calendar, RefreshCcw, UserMinus, QrCode } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

export default function AssetsTab({ user }) {
  const [assets, setAssets] = useState([]);
  const [myAssets, setMyAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [activeView, setActiveView] = useState('inventory'); // 'inventory', 'my-assets'

  // Forms
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', type: 'Laptop', assetTag: '', serialNumber: '', purchaseDate: '', purchaseCost: '', warrantyExpiry: '' });

  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const token = localStorage.getItem('wfm_token');
  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const fetchAssets = async () => {
    try {
      const res = await fetch(`${API_BASE}/assets`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyAssets = async () => {
    try {
      const res = await fetch(`${API_BASE}/assets/my`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMyAssets(data.assets || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE}/employees?limit=100`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssetHistory = async (asset) => {
    setSelectedAsset(asset);
    try {
      const res = await fetch(`${API_BASE}/assets/${asset.id}/history`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchMyAssets();
    fetchEmployees();
  }, []);

  const handleRegisterAsset = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/assets`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newAsset)
      });
      if (res.ok) {
        setSuccessMessage('Asset registered successfully.');
        setShowAddForm(false);
        setNewAsset({ name: '', type: 'Laptop', assetTag: '', serialNumber: '', purchaseDate: '', purchaseCost: '', warrantyExpiry: '' });
        fetchAssets();
      } else {
        const data = await res.json();
        setErrorMessage(data.error);
      }
    } catch (err) {
      setErrorMessage('Network failure registering asset.');
    }
  };

  const handleAssignAsset = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/assets/${selectedAsset.id}/assign`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ employeeId: parseInt(selectedEmployeeId) })
      });
      if (res.ok) {
        setSuccessMessage('Asset checked out successfully.');
        setShowAssignForm(false);
        setSelectedEmployeeId('');
        fetchAssets();
        setSelectedAsset(null);
      } else {
        const data = await res.json();
        setErrorMessage(data.error);
      }
    } catch (err) {
      setErrorMessage('Failed to assign asset.');
    }
  };

  const handleReturnAsset = async (assetId) => {
    try {
      const res = await fetch(`${API_BASE}/assets/${assetId}/return`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ conditionNote: 'Returned in good condition' })
      });
      if (res.ok) {
        setSuccessMessage('Asset checked back into inventory.');
        fetchAssets();
        fetchMyAssets();
        setSelectedAsset(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendRepair = async (assetId) => {
    try {
      const res = await fetch(`${API_BASE}/assets/${assetId}/repair`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ reason: 'Keyboard malfunction' })
      });
      if (res.ok) {
        setSuccessMessage('Asset sent for hardware repair diagnostics.');
        fetchAssets();
        setSelectedAsset(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const calcDepreciation = (cost, dateStr) => {
    if (!cost || !dateStr) return 'N/A';
    const purchaseDate = new Date(dateStr);
    const yearsElapsed = (new Date() - purchaseDate) / (1000 * 60 * 60 * 24 * 365.25);
    const lifeExpectancy = 5; // standard 5 year linear depreciation
    const valueLeft = Math.max(0, cost - (cost * (yearsElapsed / lifeExpectancy)));
    return `$${valueLeft.toFixed(2)}`;
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

      {/* View Switcher Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setActiveView('inventory')}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeView === 'inventory' ? '#eff6ff' : 'transparent', color: activeView === 'inventory' ? '#2563eb' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Asset Inventory
          </button>
          <button
            onClick={() => setActiveView('my-assets')}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeView === 'my-assets' ? '#eff6ff' : 'transparent', color: activeView === 'my-assets' ? '#2563eb' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
          >
            My Assigned Assets
          </button>
        </div>

        {activeView === 'inventory' && (
          <button
            onClick={() => setShowAddForm(true)}
            style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'var(--pastel-red)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
          >
            <Plus size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Register Asset
          </button>
        )}
      </div>

      {/* Inventory View */}
      {activeView === 'inventory' && (
        <div className="auth-card" style={{ padding: '24px', background: 'white', border: '1px solid #cbd5e1' }}>
          <h3 style={{ margin: 0, fontWeight: '700', fontSize: '16px', marginBottom: '16px' }}>Corporate Equipment Registry</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                <th style={{ padding: '10px 8px' }}>Asset Tag</th>
                <th style={{ padding: '10px 8px' }}>Name</th>
                <th style={{ padding: '10px 8px' }}>Type</th>
                <th style={{ padding: '10px 8px' }}>Assignee</th>
                <th style={{ padding: '10px 8px' }}>Current Value</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
                <th style={{ padding: '10px 8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => (
                <tr key={asset.id} style={{ borderBottom: '1px solid #e2e8f0', color: '#334155' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{asset.asset_tag}</td>
                  <td style={{ padding: '10px 8px' }}>{asset.name}</td>
                  <td style={{ padding: '10px 8px' }}>{asset.type}</td>
                  <td style={{ padding: '10px 8px' }}>{asset.assignee_name || '--'}</td>
                  <td style={{ padding: '10px 8px' }}>{calcDepreciation(asset.purchase_cost, asset.purchase_date)}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold',
                      background: asset.status === 'Available' ? '#dcfce7' : asset.status === 'Assigned' ? '#eff6ff' : '#fee2e2',
                      color: asset.status === 'Available' ? '#166534' : asset.status === 'Assigned' ? '#2563eb' : '#991b1b'
                    }}>
                      {asset.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {asset.status === 'Available' && (
                        <button
                          onClick={() => { setSelectedAsset(asset); setShowAssignForm(true); }}
                          style={{ padding: '4px 8px', fontSize: '11.5px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Checkout
                        </button>
                      )}
                      {asset.status === 'Assigned' && (
                        <button
                          onClick={() => handleReturnAsset(asset.id)}
                          style={{ padding: '4px 8px', fontSize: '11.5px', background: '#475569', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Return Asset
                        </button>
                      )}
                      {asset.status === 'Available' && (
                        <button
                          onClick={() => handleSendRepair(asset.id)}
                          style={{ padding: '4px 8px', fontSize: '11.5px', background: '#991b1b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Repair
                        </button>
                      )}
                      <button
                        onClick={() => fetchAssetHistory(asset)}
                        style={{ padding: '4px 8px', fontSize: '11.5px', background: '#cbd5e1', color: '#1e293b', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Logs
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* My Assets self service View */}
      {activeView === 'my-assets' && (
        <div className="auth-card" style={{ padding: '24px', background: 'white', border: '1px solid #cbd5e1' }}>
          <h3 style={{ margin: 0, fontWeight: '700', fontSize: '16px', marginBottom: '16px' }}>Assets Currently Checked Out to You</h3>
          {myAssets.length === 0 ? (
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>No corporate assets currently linked to your profile.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {myAssets.map(asset => (
                <div key={asset.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px' }}>
                  <Monitor size={40} color="#2563eb" />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>{asset.name}</h4>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Tag: {asset.asset_tag} | Serial: {asset.serial_number}</span>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>Warranty expires: {asset.warranty_expiry}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Log Modal */}
      {selectedAsset && !showAssignForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div className="auth-card" style={{ padding: '30px', maxWidth: '450px', background: 'white' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Asset Life Cycle Logs: {selectedAsset.name}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {history.map(h => (
                <div key={h.id} style={{ fontSize: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <strong>{h.action}</strong> by {h.employee_name || 'System IT'}
                  <div style={{ color: '#64748b', fontSize: '11px' }}>Notes: "{h.condition_note}"</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSelectedAsset(null)}
              style={{ width: '100%', marginTop: '20px', padding: '8px', background: '#475569', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Assign Asset Modal */}
      {showAssignForm && selectedAsset && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <form onSubmit={handleAssignAsset} className="auth-card" style={{ padding: '30px', maxWidth: '380px', background: 'white' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Assign Asset Workspace</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748b' }}>Device: <strong>{selectedAsset.name} ({selectedAsset.asset_tag})</strong></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <select
                value={selectedEmployeeId}
                required
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="">Select Employee</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--pastel-red)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Checkout</button>
              <button type="button" onClick={() => { setShowAssignForm(false); setSelectedAsset(null); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#e2e8f0', color: '#475569', border: 'none', cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Register Asset Modal */}
      {showAddForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <form onSubmit={handleRegisterAsset} className="auth-card" style={{ padding: '30px', maxWidth: '400px', background: 'white' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Register Inventory Asset</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Asset Name (e.g. MacBook Pro)"
                required
                value={newAsset.name}
                onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
              <select
                value={newAsset.type}
                onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="Laptop">Laptop Computer</option>
                <option value="Monitor">External Monitor</option>
                <option value="Phone">Smart Phone</option>
                <option value="Furniture">Furniture Desk/Chair</option>
                <option value="Software License">Software License Code</option>
              </select>
              <input
                type="text"
                placeholder="Asset Tag ID (Unique, e.g. AST-0042)"
                required
                value={newAsset.assetTag}
                onChange={(e) => setNewAsset({ ...newAsset, assetTag: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
              <input
                type="text"
                placeholder="Serial Number"
                value={newAsset.serialNumber}
                onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px' }}>
                <input
                  type="date"
                  placeholder="Purchase Date"
                  value={newAsset.purchaseDate}
                  onChange={(e) => setNewAsset({ ...newAsset, purchaseDate: e.target.value })}
                  style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
                <input
                  type="number"
                  placeholder="Cost ($)"
                  value={newAsset.purchaseCost}
                  onChange={(e) => setNewAsset({ ...newAsset, purchaseCost: e.target.value })}
                  style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <input
                type="date"
                placeholder="Warranty Expiry Date"
                value={newAsset.warrantyExpiry}
                onChange={(e) => setNewAsset({ ...newAsset, warrantyExpiry: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--pastel-red)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Register</button>
              <button type="button" onClick={() => setShowAddForm(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#e2e8f0', color: '#475569', border: 'none', cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
