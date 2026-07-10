import React, { useState, useEffect, useRef } from 'react';
import { Code2, Megaphone, DollarSign, Users, Briefcase, X } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

const DepartmentShowcase = ({ onBack, onManualLogin }) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [selectedDept, setSelectedDept] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const modalRef = useRef(null);
  const triggerRef = useRef(null);

  const fallbackDepartments = [
    { id: 1, name: 'Engineering', code: 'ENG', managerName: 'Jane Doe', headcount: 8, openRoles: 2, shortDescription: 'Core software engineering, platform development, and technical infrastructure operations.', designations: ['Software Engineer', 'Lead Architect', 'DevOps Specialist'] },
    { id: 2, name: 'Marketing', code: 'MKT', managerName: 'Amit Singh', headcount: 3, openRoles: 1, shortDescription: 'Brand strategy, advertising campaigns, and public relations growth operations.', designations: ['Marketing Coordinator', 'Creative Lead'] },
    { id: 3, name: 'Finance', code: 'FIN', managerName: 'Neha Sharma', headcount: 2, openRoles: 0, shortDescription: 'Financial planning, asset management, and payroll compliance administration.', designations: ['Finance Executive', 'Internal Auditor'] },
    { id: 4, name: 'Human Resources', code: 'HR', managerName: 'Priya Sharma', headcount: 4, openRoles: 1, shortDescription: 'Human resources, talent acquisition, recruitment pipelines, and onboarding compliance.', designations: ['HR Manager', 'Recruiting Specialist'] },
    { id: 5, name: 'Corporate Administration', code: 'CORP', managerName: 'System Admin', headcount: 1, openRoles: 0, shortDescription: 'Executive leadership, organizational strategy, and administrative alignment.', designations: ['Operations Lead'] }
  ];

  useEffect(() => {
    const fetchShowcaseData = async () => {
      try {
        const res = await fetch(`${API_BASE}/organizations/public-showcase`);
        if (res.ok) {
          const data = await res.json();
          if (data.departments && data.departments.length > 0) {
            setDepartments(data.departments.slice(0, 5));
          } else {
            setDepartments(fallbackDepartments);
          }
        } else {
          setDepartments(fallbackDepartments);
        }
      } catch (err) {
        console.warn('Backend fetch failed, using fallback static data:', err.message);
        setDepartments(fallbackDepartments);
      } finally {
        setLoading(false);
      }
    };
    fetchShowcaseData();
  }, []);

  // Modal Focus Trap
  useEffect(() => {
    if (!showModal || !selectedDept) return;

    const modalElement = modalRef.current;
    if (!modalElement) return;

    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = modalElement.querySelectorAll(focusableSelectors);
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Shift focus to first element inside modal
    setTimeout(() => {
      firstElement.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    modalElement.addEventListener('keydown', handleKeyDown);
    return () => {
      modalElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal, selectedDept]);

  const handleOpenModal = (dept, event) => {
    triggerRef.current = event.currentTarget; // Store triggering element
    setSelectedDept(dept);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDept(null);
    // Restore focus
    setTimeout(() => {
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    }, 50);
  };

  const getDeptIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('eng') || lower.includes('tech') || lower.includes('code')) return <Code2 size={36} />;
    if (lower.includes('market') || lower.includes('mkt')) return <Megaphone size={36} />;
    if (lower.includes('fin') || lower.includes('pay') || lower.includes('audit') || lower.includes('dollar')) return <DollarSign size={36} />;
    if (lower.includes('hr') || lower.includes('people') || lower.includes('recru') || lower.includes('users')) return <Users size={36} />;
    return <Briefcase size={36} />;
  };

  const getDeptColor = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('eng') || lower.includes('tech') || lower.includes('code')) return '#3b82f6';
    if (lower.includes('market') || lower.includes('mkt')) return '#ec4899';
    if (lower.includes('fin') || lower.includes('pay') || lower.includes('audit') || lower.includes('dollar')) return '#10b981';
    if (lower.includes('hr') || lower.includes('people') || lower.includes('recru') || lower.includes('users')) return '#eab308';
    return '#a855f7';
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#030712',
      color: '#f9fafb',
      padding: '40px',
      fontFamily: 'var(--font-sans)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Top navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: '40px'
      }}>
        <button 
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
        >
          ← Back to Hub
        </button>
      </div>

      {/* Header title */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '36px',
          fontWeight: '800',
          letterSpacing: '1.5px',
          color: '#ffffff',
          marginBottom: '12px'
        }}>
          EXPLORE TECHNOVA GLOBAL
        </h2>
        <p style={{
          fontSize: '15px',
          color: '#9ca3af',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: '1.5'
        }}>
          Explore TechNova Global's departments before you sign in. Select a department card to view open vacancies, headcount analytics, and team roles.
        </p>
      </div>

      {/* Grid structure */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '24px',
        maxWidth: '1100px',
        margin: '0 auto',
        width: '100%',
        flexGrow: 1
      }}>
        {loading ? (
          <div style={{ gridColumn: 'span 5', textAlign: 'center', color: '#9ca3af', fontSize: '15px', padding: '40px' }}>
            Compiling showcase parameters...
          </div>
        ) : (
          departments.map((dept) => {
            const cardColor = getDeptColor(dept.name);
            return (
              <div
                key={dept.id}
                tabIndex={0}
                role="button"
                aria-haspopup="dialog"
                onClick={(e) => handleOpenModal(dept, e)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenModal(dept, e);
                  }
                }}
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '20px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  aspectRatio: '1/1',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = cardColor;
                  e.currentTarget.style.boxShadow = `0 10px 30px -10px ${cardColor}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                className="showcase-card"
              >
                {/* Left-edge color accent line */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '5px',
                  height: '100%',
                  backgroundColor: cardColor
                }} />

                {/* Top Icon */}
                <div style={{ color: cardColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '10px' }}>
                  {getDeptIcon(dept.name)}
                </div>

                {/* Body Details */}
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '10px 0' }}>
                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '17px',
                    fontWeight: '700',
                    color: '#ffffff',
                    marginBottom: '8px',
                    lineHeight: '1.2'
                  }}>
                    {dept.name}
                  </h3>
                  <p style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    lineHeight: '1.4',
                    maxHeight: '40px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {dept.shortDescription}
                  </p>
                </div>

                {/* Small Stat Line at bottom */}
                <div style={{ 
                  fontSize: '11px', 
                  color: '#6b7280', 
                  fontFamily: 'monospace', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
                  width: '100%', 
                  paddingTop: '12px',
                  marginTop: '10px'
                }}>
                  {dept.headcount} employees · {dept.openRoles} open roles
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Styled Focus outlines and separator */}
      <style>{`
        .showcase-card:focus-visible {
          outline: 2px solid var(--pastel-red);
          outline-offset: 2px;
          border-color: var(--pastel-red) !important;
          transform: translateY(-4px);
        }
      `}</style>

      {/* Separator Line */}
      <hr style={{
        border: '0',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        margin: '50px 0 30px 0',
        width: '100%'
      }} />

      {/* Manual Sign-In CTA Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <button 
          onClick={onManualLogin}
          className="btn-primary"
          style={{
            maxWidth: '220px',
            width: '100%',
            padding: '14px 24px',
            fontSize: '14.5px',
            boxShadow: '0 4px 14px rgba(220, 80, 80, 0.35)'
          }}
        >
          Sign In
        </button>
      </div>

      {/* Department Detail Modal */}
      {showModal && selectedDept && (
        <div 
          onClick={handleCloseModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div 
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#0f172a',
              border: `1px solid ${getDeptColor(selectedDept.name)}`,
              borderRadius: '24px',
              padding: '30px',
              color: '#f9fafb',
              position: 'relative',
              boxShadow: `0 20px 50px -15px ${getDeptColor(selectedDept.name)}30`
            }}
          >
            {/* Header close button */}
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                color: '#9ca3af',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9ca3af';
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
              aria-label="Close modal"
            >
              <X size={16} />
            </button>

            {/* Modal Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ color: getDeptColor(selectedDept.name) }}>
                {getDeptIcon(selectedDept.name)}
              </span>
              <div>
                <h3 
                  id="modal-title"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '22px',
                    fontWeight: '800',
                    margin: 0
                  }}
                >
                  {selectedDept.name} Showcase
                </h3>
                <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>
                  DEPARTMENT CODE: {selectedDept.code}
                </span>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Operational Focus
              </h4>
              <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                {selectedDept.shortDescription}
              </p>
            </div>

            {/* Stat Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ display: 'block', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Department Headcount</span>
                <strong style={{ fontSize: '20px', color: '#ffffff' }}>{selectedDept.headcount} active staff</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ display: 'block', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Open Job Listings</span>
                <strong style={{ fontSize: '20px', color: getDeptColor(selectedDept.name) }}>{selectedDept.openRoles} openings</strong>
              </div>
            </div>

            {/* Department Manager */}
            <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ display: 'block', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Department Director</span>
              <strong style={{ fontSize: '15px', color: '#ffffff' }}>{selectedDept.managerName}</strong>
            </div>

            {/* Designations list */}
            <div>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.5px', marginBottom: '10px' }}>
                Operational Roles / Designations
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedDept.designations && selectedDept.designations.length > 0 ? (
                  selectedDept.designations.map((designation, idx) => (
                    <span 
                      key={idx}
                      style={{
                        fontSize: '12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        color: '#9ca3af'
                      }}
                    >
                      {designation}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>No specific designations registered in this unit.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentShowcase;
