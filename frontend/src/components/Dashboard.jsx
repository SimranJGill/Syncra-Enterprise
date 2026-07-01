import React from 'react';

const Dashboard = ({ user, onLogout }) => {
  
  // Custom badges for roles
  const getRoleBadge = (role) => {
    switch(role) {
      case 'Super Admin':
        return <span className="user-badge badge-super-admin">Super Admin</span>;
      case 'Admin':
        return <span className="user-badge badge-admin">Admin / Manager</span>;
      default:
        return <span className="user-badge badge-employee">Employee</span>;
    }
  };

  // Submodule actions list for Employee
  const employeeModules = [
    {
      title: "📅 Shift Calendar",
      desc: "View your weekly work schedules, assigned shifts, and register for open shifts."
    },
    {
      title: "✍ Leave Request",
      desc: "Submit new leave applications or check the status of your existing time-off requests."
    },
    {
      title: "🤖 AI Assistant",
      desc: "Ask the WFM AI Operations Assistant to check policies, request shifts, or answer HR queries."
    },
    {
      title: "📊 My Performance",
      desc: "View your attendance score, average weekly hours, and manager feedback."
    }
  ];

  // Submodule actions list for Admin
  const adminModules = [
    {
      title: "📋 Shift Scheduler",
      desc: "Create and publish weekly schedules, assign roles, and handle shift swaps."
    },
    {
      title: "🔔 Leave Approvals",
      desc: "Review and approve leave requests, track team capacity, and manage coverage gaps."
    },
    {
      title: "📈 Workforce Analytics",
      desc: "Analyze employee productivity, attendance logs, and monitor overtime hours."
    },
    {
      title: "⚙ Shift Rules",
      desc: "Configure shift patterns, compliance regulations, and maximum working hours."
    }
  ];

  // Submodule actions list for Super Admin
  const superAdminModules = [
    {
      title: "🏢 Organization Control",
      desc: "Manage multi-tenant subscriptions, register new organization units, and edit settings."
    },
    {
      title: "👤 Tenant User Directory",
      desc: "Manage global user databases, assign Admin/Super Admin access levels, and audit accounts."
    },
    {
      title: "🛡 System Audit Log",
      desc: "View full system audit trails, access activities, database transactions, and trace errors."
    },
    {
      title: "🔌 API Keys & Integrations",
      desc: "Configure third-party HRIS, payroll, and identity provider (IdP) integration systems."
    }
  ];

  const getModules = () => {
    if (user.role === 'Super Admin') return superAdminModules;
    if (user.role === 'Admin') return adminModules;
    return employeeModules;
  };

  return (
    <div className="dashboard-container">
      {/* Header bar */}
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title" style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--text-dark)' }}>
            Welcome back, {user.name}!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            🏢 {user.organization} &nbsp;|&nbsp; ✉ {user.email}
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {getRoleBadge(user.role)}
          <button className="btn-secondary" onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main operational panels */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '20px', color: 'var(--text-dark)' }}>
          Active Operations Modules
        </h2>
        <div className="dashboard-grid">
          {getModules().map((mod, idx) => (
            <div className="dashboard-card" key={idx}>
              <h3 className="dashboard-card-title">{mod.title}</h3>
              <p className="dashboard-card-desc">{mod.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Simulated AI Operations Assistant Section */}
      <section style={{ 
        background: 'var(--glass-bg)', 
        border: '1.5px solid var(--border-color)', 
        borderRadius: '20px', 
        padding: '30px', 
        boxShadow: 'var(--shadow-md)',
        backdropFilter: 'blur(var(--glass-blur))'
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '10px', color: 'var(--text-dark)' }}>
          💬 WFM AI Assistant Panel
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Ask questions, plan schedules, or request assistance using natural language.
        </p>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Type a request (e.g., 'Draft next week''s shifts' or 'Submit leave for July 5th')..." 
            style={{ marginBottom: 0 }}
          />
          <button className="btn-primary" style={{ width: '120px', flexShrink: 0 }}>
            Send
          </button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
