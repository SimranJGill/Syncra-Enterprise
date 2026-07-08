import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, MessageSquare, X, Mic, Sparkles, Check, Play, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

export default function AIAssistantWidget({ activeTab }) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Pending AI agent actions count for the Orb badge
  const [pendingCount, setPendingCount] = useState(0);

  const messagesEndRef = useRef(null);
  const token = localStorage.getItem('wfm_token');

  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_BASE}/ai/conversations`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingAgentActions = async () => {
    try {
      const res = await fetch(`${API_BASE}/agents/pending`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPendingCount(data.actions?.length || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const res = await fetch(`${API_BASE}/ai/conversations/${convId}/messages`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setActiveConvId(convId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (userText) => {
    if (!userText.trim()) return;

    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: userText }]);

    try {
      const res = await fetch(`${API_BASE}/ai/query`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          query: userText,
          activeTab,
          conversationId: activeConvId
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        if (!activeConvId) {
          setActiveConvId(data.conversationId);
          fetchConversations();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    const text = inputMsg;
    setInputMsg('');
    handleSendMessage(text);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMsg(transcript);
    };
  };

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
    fetchPendingAgentActions();
    
    // Poll agent queue count occasionally for the badge
    const interval = setInterval(fetchPendingAgentActions, 15000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Contextual tips based on current page
  const getContextualContent = () => {
    switch (activeTab) {
      case 'payroll':
        return {
          title: "Payroll Intelligence",
          intro: "I see you are reviewing payroll records.",
          actions: [
            { text: "Check anomalies", query: "Are there any salary payment anomalies in this draft?" },
            { text: "Explain tax deductions", query: "Can you detail the tax calculation formulas used?" },
            { text: "Generate payroll summary", query: "Give me a summary of total spending by department" }
          ]
        };
      case 'overview':
        return {
          title: "Command Center Assistant",
          intro: "Good day! How can I assist you with your day?",
          actions: [
            { text: "Check remaining leaves", query: "How many leaves do I have left?" },
            { text: "Get today's agenda", query: "What are my high priority tasks today?" },
            { text: "Ask HR Policy", query: "Explain the hybrid work office presence policy" }
          ]
        };
      case 'projects':
        return {
          title: "Project Operations Copilot",
          intro: "Reviewing active tasks and deadlines.",
          actions: [
            { text: "Find blocked tasks", query: "Are any project tasks currently marked as Blocked?" },
            { text: "Analyze team workload", query: "Who has the highest workload of pending tasks?" }
          ]
        };
      default:
        return null;
    }
  };

  const contextInfo = getContextualContent();

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1200 }}>
      
      {/* 5.2 AI Agent Orb Toggle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`orb-glow-purple ${loading ? 'animate-pulse' : ''}`}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            outline: 'none',
            transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Bot size={28} />
          {pendingCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)',
              animation: 'bounce 1s infinite alternate'
            }}>
              {pendingCount}
            </span>
          )}
        </button>
      )}

      {/* 8. Context-Aware AI Sidebar Panel */}
      {isOpen && (
        <div 
          className="glass-card" 
          style={{
            width: '400px',
            height: '650px',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', padding: '20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bot size={22} color="#6366F1" />
              <div>
                <span style={{ fontWeight: '700', fontSize: '15px', display: 'block' }}>Command Assistant</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Context: {activeTab}</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            
            {/* Left Session strip */}
            <div style={{ width: '100px', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', background: 'rgba(15, 23, 42, 0.4)' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', padding: '12px 8px 6px 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>History</div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px' }}>
                {conversations.map(c => (
                  <button
                    key={c.id}
                    onClick={() => fetchMessages(c.id)}
                    style={{
                      padding: '8px',
                      fontSize: '11px',
                      textAlign: 'left',
                      border: 'none',
                      borderRadius: '6px',
                      background: activeConvId === c.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                      color: activeConvId === c.id ? '#8f94fb' : '#94a3b8',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    💬 {c.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat screen */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(30, 41, 59, 0.4)' }}>
              
              {/* Message scroll container */}
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {messages.length === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                    
                    {/* Context State prompt cards */}
                    {contextInfo ? (
                      <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '12px', padding: '16px', color: '#f8fafc' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold', color: '#8f94fb', marginBottom: '8px' }}>
                          <Sparkles size={16} />
                          {contextInfo.title}
                        </div>
                        <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 12px 0' }}>{contextInfo.intro}</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {contextInfo.actions.map((act, i) => (
                            <button
                              key={i}
                              onClick={() => handleSendMessage(act.query)}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 12px',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '8px',
                                color: '#f8fafc',
                                fontSize: '11.5px',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                            >
                              💡 {act.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: '12.5px', textAlign: 'center', marginTop: '40px' }}>
                        <Bot size={36} color="#475569" style={{ margin: '0 auto 12px auto' }} />
                        I'm here if you need me. Click history or ask a custom question below.
                      </div>
                    )}
                  </div>
                )}

                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      background: m.role === 'user' ? '#6366F1' : 'rgba(255,255,255,0.06)',
                      color: m.role === 'user' ? 'white' : '#f8fafc',
                      padding: '10px 14px',
                      borderRadius: m.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                      maxWidth: '85%',
                      fontSize: '12.5px',
                      lineHeight: '1.45',
                      border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {m.content}
                  </div>
                ))}

                {loading && (
                  <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: '16px 16px 16px 0', fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="animate-pulse">🤖 thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleFormSubmit} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  style={{ padding: '8px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <Mic size={16} />
                </button>
                <input
                  type="text"
                  placeholder="Ask Command Assistant..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 14px',
                    borderRadius: '99px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(15, 23, 42, 0.4)',
                    color: '#f8fafc',
                    fontSize: '12.5px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '8px',
                    borderRadius: '50%',
                    border: 'none',
                    background: '#6366F1',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Send size={15} />
                </button>
              </form>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
