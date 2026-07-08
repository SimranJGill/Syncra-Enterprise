import React, { useState, useEffect } from 'react';
import { Calendar, Monitor, Users, Check, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

export default function HybridWorkHubTab({ user }) {
  const [floors, setFloors] = useState([]);
  const [selectedDesk, setSelectedDesk] = useState(null);
  const [selectedFloorId, setSelectedFloorId] = useState(1);
  const [selectedDate, setSelectedDate] = useState('2026-07-10');
  const [message, setMessage] = useState(null);

  const token = localStorage.getItem('wfm_token');
  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const fetchFloorPlan = async () => {
    try {
      const res = await fetch(`${API_BASE}/hybrid/offices/1/floors`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setFloors(data.floors || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFloorPlan();
  }, [selectedFloorId]);

  const handleBookDesk = async () => {
    if (!selectedDesk) return;
    try {
      const empId = 2; // Default mock employee ID
      const res = await fetch(`${API_BASE}/hybrid/desk-bookings`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          employeeId: empId,
          deskId: selectedDesk.deskId,
          date: selectedDate,
          floorId: selectedFloorId
        })
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `Successfully booked desk: ${selectedDesk.deskId} for ${selectedDate}` });
        setSelectedDesk(null);
        fetchFloorPlan();
      } else {
        const errData = await res.json();
        setMessage({ type: 'error', text: errData.error || 'Booking failed.' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentFloor = floors.find(f => f.id === selectedFloorId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '32px' }}>
        
        {/* SVG Floor Map Interactive display */}
        <div className="auth-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '20px', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Interactive Floor Capacity Map</h3>
            <select
              value={selectedFloorId}
              onChange={(e) => setSelectedFloorId(parseInt(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            >
              <option value="1">3rd Floor - Engineering HQ</option>
            </select>
          </div>

          {currentFloor && (
            <div style={{ position: 'relative', width: '100%', height: '300px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <svg width="100%" height="100%">
                {/* Desks circles renders */}
                {currentFloor.desks.map(desk => (
                  <g
                    key={desk.deskId}
                    style={{ cursor: desk.status === 'occupied' ? 'not-allowed' : 'pointer' }}
                    onClick={() => {
                      if (desk.status === 'available') {
                        setSelectedDesk(desk);
                      }
                    }}
                  >
                    <circle
                      cx={desk.x}
                      cy={desk.y}
                      r="16"
                      fill={
                        desk.status === 'occupied'
                          ? '#ef4444' // Red occupied
                          : selectedDesk?.deskId === desk.deskId
                          ? '#2563eb' // Blue selected
                          : '#10b981' // Green available
                      }
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />
                    <text
                      x={desk.x}
                      y={desk.y + 4}
                      fill="white"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {desk.deskId.replace('Desk ', '')}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} /> Available
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} /> Occupied
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2563eb' }} /> Your Selection
            </span>
          </div>
        </div>

        {/* Booking parameters and actions */}
        <div className="auth-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Desk Reservation Desk</h3>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '12.5px', color: '#64748b' }}>Selection Summary</h4>
            {selectedDesk ? (
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Desk: {selectedDesk.deskId} (Coordinates: {selectedDesk.x}, {selectedDesk.y})</span>
            ) : (
              <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>Please click an available desk dot on the map.</span>
            )}
          </div>

          <button
            onClick={handleBookDesk}
            disabled={!selectedDesk}
            className="btn-primary"
            style={{ padding: '10px', width: '100%' }}
          >
            Confirm Desk Booking
          </button>

          {message && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
              color: message.type === 'success' ? '#065f46' : '#991b1b',
              border: message.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fca5a5'
            }}>
              {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              <span>{message.text}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
