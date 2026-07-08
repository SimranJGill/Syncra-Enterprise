import React, { useState, useEffect } from 'react';
import { BarChart, PieChart, Download, Calendar, Filter, FileText } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

export default function ReportsTab({ user }) {
  const [selectedReport, setSelectedReport] = useState('attendance');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [dateRange, setDateRange] = useState({ start: '2026-01-01', end: '2026-12-31' });
  const [selectedDept, setSelectedDept] = useState('');

  const token = localStorage.getItem('wfm_token');
  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const fetchReport = async (reportType) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reports/${reportType}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedReport);
  }, [selectedReport]);

  const handleExportCSV = () => {
    if (!reportData) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    if (selectedReport === 'attendance') {
      csvContent += 'Status,Count\n';
      (reportData.statusCounts || []).forEach(row => {
        csvContent += `${row.status},${row.count}\n`;
      });
    } else if (selectedReport === 'leave') {
      csvContent += 'Leave Type,Approved Requests Count\n';
      (reportData.typeUtilization || []).forEach(row => {
        csvContent += `${row.leave_type},${row.count}\n`;
      });
    } else if (selectedReport === 'payroll') {
      csvContent += 'Month,Total Gross,Total Net,Total Tax Deducted\n';
      (reportData.monthlyTrends || []).forEach(row => {
        csvContent += `${row.month},${row.gross},${row.net},${row.tax}\n`;
      });
    } else if (selectedReport === 'recruitment') {
      csvContent += 'Funnel Stage,Candidate Count\n';
      (reportData.funnel || []).forEach(row => {
        csvContent += `${row.status},${row.count}\n`;
      });
    } else if (selectedReport === 'performance') {
      csvContent += 'Manager Rating,Count\n';
      (reportData.ratingDistribution || []).forEach(row => {
        csvContent += `${row.manager_rating},${row.count}\n`;
      });
    } else if (selectedReport === 'projects') {
      csvContent += 'Task Status,Count\n';
      (reportData.taskStatus || []).forEach(row => {
        csvContent += `${row.status},${row.count}\n`;
      });
    } else if (selectedReport === 'assets') {
      csvContent += 'Asset Status,Count\n';
      (reportData.statusCounts || []).forEach(row => {
        csvContent += `${row.status},${row.count}\n`;
      });
    } else if (selectedReport === 'helpdesk') {
      csvContent += 'Category,Ticket Volume Count\n';
      (reportData.categoryVolume || []).forEach(row => {
        csvContent += `${row.category},${row.count}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedReport}_summary_report.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // Shared semantic color primitive mapper
  const getSemanticColor = (label) => {
    const l = String(label).toLowerCase();
    if (l.includes('high') || l.includes('late') || l.includes('urgent') || l.includes('breach') || l.includes('blocked')) {
      return '#ef4444'; // Vermillion Red
    }
    if (l.includes('medium') || l.includes('pending') || l.includes('warning') || l.includes('review') || l.includes('under repair')) {
      return '#f59e0b'; // Amber Yellow
    }
    if (l.includes('low') || l.includes('approved') || l.includes('resolved') || l.includes('completed') || l.includes('available')) {
      return '#10b981'; // Green
    }
    return '#3b82f6'; // Slate Blue default
  };

  const reportsList = [
    { id: 'attendance', label: 'Attendance Audit' },
    { id: 'leave', label: 'Leave Utilization' },
    { id: 'payroll', label: 'Payroll & Salaries' },
    { id: 'recruitment', label: 'Recruitment Funnel' },
    { id: 'performance', label: 'Performance Distributions' },
    { id: 'projects', label: 'Project Workload' },
    { id: 'assets', label: 'Equipment Inventory' },
    { id: 'helpdesk', label: 'IT Ticket Volumes' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Filters Toolbar */}
      <div className="auth-card" style={{ padding: '16px 24px', background: 'white', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><Filter size={16} /> Filters:</span>
          
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
          />
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleExportCSV}
            style={{ padding: '8px 14px', fontSize: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={handlePrintPDF}
            style={{ padding: '8px 14px', fontSize: '12px', background: '#475569', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileText size={14} /> Print Report
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
        {/* Reports Navigation Menu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {reportsList.map(rep => (
            <button
              key={rep.id}
              onClick={() => setSelectedReport(rep.id)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                textAlign: 'left',
                background: selectedReport === rep.id ? '#eff6ff' : 'white',
                color: selectedReport === rep.id ? '#2563eb' : '#475569',
                fontWeight: selectedReport === rep.id ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: '13px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.15s'
              }}
            >
              {rep.label}
            </button>
          ))}
        </div>

        {/* Chart Viewport */}
        <div className="auth-card" style={{ padding: '30px', background: 'white', border: '1px solid #cbd5e1', minHeight: '400px' }}>
          {loading && <div style={{ fontSize: '14px', color: '#64748b' }}>Generating data metrics...</div>}

          {!loading && reportData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <h3 style={{ margin: 0, textTransform: 'capitalize', fontSize: '18px', fontWeight: 'bold' }}>
                {selectedReport} Report Summaries
              </h3>

              {/* Render SVGs Chart Primitive */}
              <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                {/* 1. Bar Chart primitive mapping */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>Distribution breakdown</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {selectedReport === 'attendance' && (reportData.statusCounts || []).map(row => (
                      <div key={row.status}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                          <span>{row.status}</span>
                          <strong>{row.count}</strong>
                        </div>
                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, (row.count / 20) * 100)}%`, height: '100%', background: getSemanticColor(row.status) }} />
                        </div>
                      </div>
                    ))}

                    {selectedReport === 'leave' && (reportData.typeUtilization || []).map(row => (
                      <div key={row.leave_type}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                          <span>{row.leave_type}</span>
                          <strong>{row.count}</strong>
                        </div>
                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, (row.count / 10) * 100)}%`, height: '100%', background: getSemanticColor('Approved') }} />
                        </div>
                      </div>
                    ))}

                    {selectedReport === 'payroll' && (reportData.monthlyTrends || []).map(row => (
                      <div key={row.month}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                          <span>{row.month} (Net Cost)</span>
                          <strong>${row.net}</strong>
                        </div>
                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, (row.net / 200000) * 100)}%`, height: '100%', background: '#3b82f6' }} />
                        </div>
                      </div>
                    ))}

                    {selectedReport === 'recruitment' && (reportData.funnel || []).map(row => (
                      <div key={row.status}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                          <span>{row.status}</span>
                          <strong>{row.count}</strong>
                        </div>
                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, (row.count / 10) * 100)}%`, height: '100%', background: getSemanticColor(row.status) }} />
                        </div>
                      </div>
                    ))}

                    {selectedReport === 'performance' && (reportData.ratingDistribution || []).map(row => (
                      <div key={row.manager_rating}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                          <span>Rating: {row.manager_rating}</span>
                          <strong>{row.count}</strong>
                        </div>
                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, (row.count / 10) * 100)}%`, height: '100%', background: '#10b981' }} />
                        </div>
                      </div>
                    ))}

                    {selectedReport === 'projects' && (reportData.taskStatus || []).map(row => (
                      <div key={row.status}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                          <span>{row.status}</span>
                          <strong>{row.count}</strong>
                        </div>
                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, (row.count / 15) * 100)}%`, height: '100%', background: getSemanticColor(row.status) }} />
                        </div>
                      </div>
                    ))}

                    {selectedReport === 'assets' && (reportData.statusCounts || []).map(row => (
                      <div key={row.status}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                          <span>{row.status}</span>
                          <strong>{row.count}</strong>
                        </div>
                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, (row.count / 10) * 100)}%`, height: '100%', background: getSemanticColor(row.status) }} />
                        </div>
                      </div>
                    ))}

                    {selectedReport === 'helpdesk' && (reportData.categoryVolume || []).map(row => (
                      <div key={row.category}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                          <span>{row.category} Category</span>
                          <strong>{row.count}</strong>
                        </div>
                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, (row.count / 10) * 100)}%`, height: '100%', background: '#8b5cf6' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Visual Donut/Pie Chart SVG Primitive */}
                <div style={{ width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="150" height="150" viewBox="0 0 42 42" className="donut">
                    <circle className="donut-hole" cx="21" cy="21" r="15.915" fill="#fff" />
                    <circle className="donut-ring" cx="21" cy="21" r="15.915" fill="transparent" stroke="#e2e8f0" strokeWidth="3" />
                    <circle
                      className="donut-segment"
                      cx="21"
                      cy="21"
                      r="15.915"
                      fill="transparent"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeDasharray="65 35"
                      strokeDashoffset="25"
                    />
                  </svg>
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '12px' }}>Visual Percentage Breakdown</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
