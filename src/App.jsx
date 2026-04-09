import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import {
  Network, MessagesSquare, Users,
  ArrowRight, Search, Bell,
  MessageCircle, Rocket, Mail, CheckCircle2,
  Zap, Database, Globe, Sparkles, RefreshCw, Copy, Check,
  Key, Eye, EyeOff, AlertTriangle,
} from 'lucide-react';
import { generateIcebreaker, INDUSTRIES } from './utils/aiPersonalization';
import { supabase } from './supabaseClient';
import './App.css';

// ---- Components ----

const Navbar = () => (
  <nav className="navbar">
    <div className="container nav-container">
      <Link to="/" className="nav-logo">
        <Network size={28} color="#4f46e5" />
        Synreach
      </Link>
      <div className="nav-links">
        <a href="#features" className="nav-link">Features</a>
        <a href="#how-it-works" className="nav-link">How it Works</a>
        <a href="#pricing" className="nav-link">Pricing</a>
      </div>
      <div className="nav-actions">
        <Link to="/dashboard" className="btn-secondary">Log in</Link>
        <Link to="/dashboard" className="btn-primary">Get Started</Link>
      </div>
    </div>
  </nav>
);

const Landing = () => (
  <div className="animate-fade-in">
    <Navbar />
    <section className="hero-section container">
      <div className="hero-badge"><Rocket size={16} /> Beta Access Available</div>
      <h1 className="hero-title">Intelligent Outreach. <br/><span className="text-gradient">Zero Spam.</span></h1>
      <p className="hero-subtitle">Scale your engagement across platforms with AI-powered personalization while staying 100% compliant.</p>
      <div className="hero-actions">
        <Link to="/dashboard" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Start Free Trial <ArrowRight size={18} />
        </Link>
        <button className="btn-secondary">View Demo</button>
      </div>
    </section>
  </div>
);

const INITIAL_LEADS = [
  {
    id: 1, name: 'Sarah Jenkins', email: 'sarah@techflow.io', phone: '+260971234567',
    company: 'TechFlow', title: 'Head of People & Culture', industry: 'hr',
    platform: 'Email', method: 'email', status: 'Draft Ready', lastActivity: '2 hours ago',
    context: 'Recently posted about the challenges of remote onboarding and keeping culture cohesive across distributed teams',
    icebreakerDraft: null, icebreakerStatus: 'pending', icebreakerError: null,
  },
  {
    id: 2, name: 'Michael Chen', email: 'm.chen@venture.co', phone: '+260977654321',
    company: 'Venture Co', title: 'VP of Sales', industry: 'saas',
    platform: 'WhatsApp', method: 'whatsapp', status: 'Idle', lastActivity: '1 day ago',
    context: 'Just closed a Series A and is aggressively scaling the sales team from 5 to 20 reps in Q2',
    icebreakerDraft: null, icebreakerStatus: 'pending', icebreakerError: null,
  },
  {
    id: 3, name: 'Elena Rostova', email: 'elena@nexus.ai', phone: '+260972223334',
    company: 'Nexus AI', title: 'CTO', industry: 'saas',
    platform: 'Email', method: 'email', status: 'Draft Ready', lastActivity: '5 hours ago',
    context: 'Published a widely-shared piece on responsible AI deployment in enterprise software',
    icebreakerDraft: null, icebreakerStatus: 'pending', icebreakerError: null,
  },
  {
    id: 4, name: 'David Miller', email: 'dm@builders.com', phone: '+260979998887',
    company: 'Builders Inc', title: 'Head of Talent Acquisition', industry: 'hr',
    platform: 'WhatsApp', method: 'whatsapp', status: 'Draft Ready', lastActivity: '10 mins ago',
    context: 'Hiring aggressively for 30+ engineering roles in Q2 with a very tight timeline',
    icebreakerDraft: null, icebreakerStatus: 'pending', icebreakerError: null,
  },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [leads, setLeads] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [outreachProgress, setOutreachProgress] = useState(0);

  // Fetch leads on mount
  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
    } else {
      // Map DB field names to existing state names if they differ
      const mapped = data.map(l => ({
        ...l,
        icebreakerDraft: l.icebreaker_draft,
        icebreakerStatus: l.icebreaker_status,
        lastActivity: l.last_activity ? new Date(l.last_activity).toLocaleString() : 'N/A'
      }));
      setLeads(mapped);
    }
  };

  // Discovery state
  const [searchQuery, setSearchQuery] = useState('');
  const [isMining, setIsMining] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);
  const [discoveredLeads, setDiscoveredLeads] = useState([]);
  const [discoveryError, setDiscoveryError] = useState(null);

  // AI Drafts state
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('synreach_api_key') || '');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [showKeyValue, setShowKeyValue] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // ── API Key ──────────────────────────────────────────────────────────────
  const saveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) return;
    setApiKey(trimmed);
    localStorage.setItem('synreach_api_key', trimmed);
    setApiKeyInput('');
    setShowKeyForm(false);
  };

  const clearApiKey = () => {
    setApiKey('');
    localStorage.removeItem('synreach_api_key');
  };

  // ── Icebreaker generation ────────────────────────────────────────────────
  const generateForLead = async (leadId) => {
    if (!apiKey) { setShowKeyForm(true); return; }

    // Capture current lead data at generation time
    const lead = leads.find(l => l.id === leadId);

    setLeads(prev => prev.map(l =>
      l.id === leadId ? { ...l, icebreakerStatus: 'generating', icebreakerError: null } : l
    ));

    try {
      const draft = await generateIcebreaker(lead, apiKey);
      
      // Update local state
      setLeads(prev => prev.map(l =>
        l.id === leadId ? { ...l, icebreakerDraft: draft, icebreakerStatus: 'ready' } : l
      ));

      // Sync to Supabase
      await supabase
        .from('leads')
        .update({ icebreaker_draft: draft, icebreaker_status: 'ready' })
        .eq('id', leadId);

    } catch (err) {
      setLeads(prev => prev.map(l =>
        l.id === leadId ? { ...l, icebreakerStatus: 'error', icebreakerError: err.message } : l
      ));
    }
  };

  const generateAll = async () => {
    if (!apiKey) { setShowKeyForm(true); return; }
    const pending = leads.filter(l => l.icebreakerStatus === 'pending' || l.icebreakerStatus === 'error');
    for (const lead of pending) {
      await generateForLead(lead.id);
    }
  };

  const toggleApprove = async (leadId) => {
    const lead = leads.find(l => l.id === leadId);
    const newStatus = lead.icebreakerStatus === 'approved' ? 'ready' : 'approved';
    
    setLeads(prev => prev.map(l =>
      l.id === leadId
        ? { ...l, icebreakerStatus: newStatus }
        : l
    ));

    await supabase
      .from('leads')
      .update({ icebreaker_status: newStatus })
      .eq('id', leadId);
  };

  const updateDraft = (leadId, text) => {
    setLeads(prev => prev.map(l =>
      l.id === leadId ? { ...l, icebreakerDraft: text } : l
    ));
  };

  const updateLeadField = async (leadId, field, value) => {
    setLeads(prev => prev.map(l =>
      l.id === leadId ? { ...l, [field]: value } : l
    ));

    // Map frontend fields to DB fields if needed
    const dbField = field === 'icebreakerDraft' ? 'icebreaker_draft' : field;
    await supabase.from('leads').update({ [dbField]: value }).eq('id', leadId);
  };

  const copyDraft = (leadId, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(leadId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // ── Derived stats ────────────────────────────────────────────────────────
  const draftStats = {
    pending:    leads.filter(l => l.icebreakerStatus === 'pending').length,
    ready:      leads.filter(l => l.icebreakerStatus === 'ready').length,
    approved:   leads.filter(l => l.icebreakerStatus === 'approved').length,
    generating: leads.some(l => l.icebreakerStatus === 'generating'),
  };

  // ── Campaign outreach ────────────────────────────────────────────────────
  const toggleLeadSelection = (id) => {
    setSelectedLeads(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleStartOutreach = async () => {
    if (selectedLeads.length === 0) return;
    setIsSending(true);
    setOutreachProgress(0);
    const leadsToProcess = leads.filter(l => selectedLeads.includes(l.id));
    for (let i = 0; i < leadsToProcess.length; i++) {
      const lead = leadsToProcess[i];
      try {
        const res = await fetch('http://localhost:5000/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId: lead.id,
            method: lead.method,
            recipient: lead.method === 'whatsapp' ? (lead.phone || lead.email) : lead.email,
            subject: 'Exclusive Partnership Proposal',
            content: `<p>Hi ${lead.name.split(' ')[0]},</p><p>${lead.icebreakerDraft || 'I noticed your work and would love to connect...'}</p>`
          })
        });
        if (res.ok) {
          setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'Sent' } : l));
          await supabase.from('leads').update({ status: 'Sent', last_activity: new Date().toISOString() }).eq('id', lead.id);
        } else {
          console.error(`Send failed for ${lead.name}: HTTP ${res.status}`);
        }
      } catch (err) { console.error('Send error:', err); }
      setOutreachProgress(((i + 1) / leadsToProcess.length) * 100);
    }
    setIsSending(false);
    setSelectedLeads([]);
    setTimeout(() => setOutreachProgress(0), 3000);
  };

  // ── Discovery ────────────────────────────────────────────────────────────
  const handleStartDiscovery = async () => {
    if (!searchQuery) return;
    setIsMining(true);
    setMiningProgress(0);
    setDiscoveredLeads([]);
    setDiscoveryError(null);

    // Animate progress while the real request runs
    let progress = 0;
    const interval = setInterval(() => {
      progress = Math.min(progress + 3, 90);
      setMiningProgress(progress);
    }, 200);

    try {
      const res = await fetch('http://localhost:5000/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error (HTTP ${res.status})`);
      }
      const data = await res.json();
      const raw = data.contacts || [];

      const discovered = raw.map((c, i) => ({
        id: Date.now() + i,
        name: c.name,
        role: c.title,
        location: c.location || 'Unknown',
        source: c.source || 'LinkedIn',
        email: c.email,
        phone: c.phone,
        linkedinUrl: c.linkedinUrl,
      }));

      clearInterval(interval);
      setMiningProgress(100);
      setDiscoveredLeads(discovered);
    } catch (err) {
      console.error('Discovery failed:', err);
      clearInterval(interval);
      setMiningProgress(0);
      setDiscoveryError(err.message || 'Discovery failed. Is the server running?');
    } finally {
      setIsMining(false);
    }
  };

  const addDiscoveredToLeads = async (discovered) => {
    const newLeads = discovered.map((d) => ({
      name: d.name,
      email: d.email || `${d.name.toLowerCase().replace(' ', '.')}@unknown.com`,
      phone: d.phone,
      company: d.role?.split(' at ').slice(-1)[0]?.split(' - ').slice(-1)[0] || 'Unknown',
      title: d.role?.split(' at ')[0]?.split(' - ')[0] || 'Professional',
      industry: 'default',
      platform: 'Email',
      method: 'email',
      status: 'Discovered',
      context: '',
      icebreaker_draft: null,
      icebreaker_status: 'pending',
    }));

    const { data, error } = await supabase
      .from('leads')
      .insert(newLeads)
      .select();

    if (error) {
      console.error('Error adding leads:', error);
    } else {
      await fetchLeads(); // Refresh leads from DB
      setActiveTab('AI Drafts');
    }
  };

  const KNOWN_TABS = ['Overview', 'Discovery', 'Campaigns', 'AI Drafts'];

  return (
    <div className="app-layout animate-fade-in">
      <aside className="sidebar">
        <Link to="/" className="nav-logo" style={{ marginBottom: '16px' }}>
          <Network size={28} color="#4f46e5" />
          Synreach <span style={{ fontSize: '0.7rem', background: '#ec4899', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px'}}>PRO</span>
        </Link>
        <nav className="sidebar-nav">
          {[
            { name: 'Overview',  icon: <Network size={20} /> },
            { name: 'Discovery', icon: <Search size={20} /> },
            { name: 'Campaigns', icon: <Rocket size={20} /> },
            { name: 'AI Drafts', icon: <Sparkles size={20} /> },
            { name: 'Messages',  icon: <MessagesSquare size={20} /> },
            { name: 'Leads',     icon: <Users size={20} /> },
          ].map((item) => (
            <div
              key={item.name}
              className={`nav-item ${activeTab === item.name ? 'active' : ''}`}
              onClick={() => setActiveTab(item.name)}
              style={{ cursor: 'pointer' }}
            >
              {item.icon}
              {item.name}
              {item.name === 'AI Drafts' && draftStats.approved > 0 && (
                <span className="nav-badge">{draftStats.approved}</span>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <h2 style={{ fontSize: '1.75rem' }}>{activeTab}</h2>
          <div className="user-profile">
            <Bell size={20} color="#94a3b8" />
            <div className="avatar"></div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Alex D.</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Premium</div>
            </div>
          </div>
        </header>

        {/* ── Overview ──────────────────────────────────────────────────── */}
        {activeTab === 'Overview' && (
          <div className="dashboard-grid">
            <div className="glass-panel stat-card">
              <span className="stat-label">Messages Sent</span>
              <span className="stat-value">1,402</span>
              <span className="trend-up">+15% this month</span>
            </div>
            <div className="glass-panel stat-card">
              <span className="stat-label">Response Rate</span>
              <span className="stat-value">42.8%</span>
              <span className="trend-up">+5.2% improvement</span>
            </div>
            <div className="glass-panel stat-card">
              <span className="stat-label">Leads Discovered</span>
              <span className="stat-value">842</span>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Since last week</span>
            </div>
          </div>
        )}

        {/* ── Discovery ─────────────────────────────────────────────────── */}
        {activeTab === 'Discovery' && (
          <div className="discovery-container animate-fade-in">
            <div className="glass-panel search-section">
              <h3 style={{ marginBottom: '16px' }}>AI Prospecting Engine</h3>
              <div className="search-container">
                <div className="search-input-wrapper">
                  <Search size={20} color="#6366f1" />
                  <input
                    type="text"
                    placeholder="e.g. Find CTOs of Series A fintech startups in London..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartDiscovery()}
                  />
                </div>
                <button className="btn-primary" onClick={handleStartDiscovery} disabled={isMining}>
                  {isMining ? 'Mining...' : 'Mine Leads'}
                </button>
              </div>
            </div>

            {discoveryError && !isMining && (
              <div className="error-state" style={{ marginTop: '12px' }}>
                <AlertTriangle size={14} />
                <span>{discoveryError}</span>
              </div>
            )}

            {isMining && (
              <div className="mining-status">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={18} color="#f59e0b" />
                    <span>AI is crawling data sources...</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>{miningProgress}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${miningProgress}%` }}></div>
                </div>
              </div>
            )}

            {discoveredLeads.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{discoveredLeads.length} leads found</span>
                  <button className="btn-primary" onClick={() => addDiscoveredToLeads(discoveredLeads)}>
                    <Sparkles size={14} style={{ marginRight: '6px' }} />
                    Add All to AI Drafts
                  </button>
                </div>
                <div className="contacts-preview-grid">
                  {discoveredLeads.map(lead => (
                    <div key={lead.id} className="glass-panel contact-card">
                      <span className="source-badge">{lead.source}</span>
                      <div className="contact-card-header">
                        <div className="contact-info">
                          <h4>{lead.name}</h4>
                          <p>{lead.role}</p>
                        </div>
                        <button
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                          onClick={() => addDiscoveredToLeads([lead])}
                        >
                          Add <ArrowRight size={13} />
                        </button>
                      </div>
                      <div className="contact-meta">
                        <div className="meta-item"><Globe size={14} />{lead.location}</div>
                        <div className="meta-item"><Database size={14} /> Verified Profile</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Campaigns ─────────────────────────────────────────────────── */}
        {activeTab === 'Campaigns' && (
          <div className="glass-panel">
            <div className="campaign-controls">
              <div>
                <h3 style={{ marginBottom: '4px' }}>Lead Outreach Control</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Select leads to initiate AI-powered personalized outreach.</p>
              </div>
              <button
                className="btn-primary"
                onClick={handleStartOutreach}
                disabled={selectedLeads.length === 0 || isSending}
                style={{ opacity: (selectedLeads.length === 0 || isSending) ? 0.6 : 1 }}
              >
                {isSending ? 'Sending...' : `Start Outreach (${selectedLeads.length})`}
              </button>
            </div>

            {outreachProgress > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span>Outreach Status</span>
                  <span>{Math.round(outreachProgress)}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${outreachProgress}%` }}></div>
                </div>
              </div>
            )}

            <table className="table-container">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      className="checkbox-custom"
                      checked={selectedLeads.length === leads.filter(l => l.status !== 'Sent').length && leads.filter(l => l.status !== 'Sent').length > 0}
                      onChange={(e) => {
                        const selectableIds = leads.filter(l => l.status !== 'Sent').map(l => l.id);
                        setSelectedLeads(e.target.checked ? selectableIds : []);
                      }}
                    />
                  </th>
                  <th>Lead Name</th>
                  <th>Platform</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} style={{ opacity: lead.status === 'Sent' ? 0.7 : 1 }}>
                    <td>
                      <input
                        type="checkbox"
                        className="checkbox-custom"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={() => toggleLeadSelection(lead.id)}
                        disabled={lead.status === 'Sent'}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{lead.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{lead.email}</div>
                    </td>
                    <td>
                      {lead.platform === 'Email'
                        ? <Mail size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                        : <MessageCircle size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />}
                      {lead.platform}
                    </td>
                    <td><span style={{ textTransform: 'capitalize' }}>{lead.method}</span></td>
                    <td>
                      <span className={`status-badge ${lead.status === 'Draft Ready' ? 'status-pending' : lead.status === 'Sent' ? 'status-active' : 'status-idle'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{lead.lastActivity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── AI Drafts — Review & Refine ───────────────────────────────── */}
        {activeTab === 'AI Drafts' && (
          <div className="ai-drafts-container">

            {/* API Key Banner */}
            <div className={`api-key-banner ${apiKey ? 'key-set' : 'key-missing'}`}>
              <div className="api-key-banner-left">
                <Key size={15} />
                {apiKey
                  ? <span>API key configured{showKeyValue ? ` · ${apiKey.slice(0, 8)}…` : ' · AIza••••••••'}</span>
                  : <span>Add your Google AI Studio API key to generate icebreakers</span>}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {apiKey && (
                  <button className="btn-icon" onClick={() => setShowKeyValue(v => !v)} title="Toggle visibility">
                    {showKeyValue ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                )}
                <button className="btn-icon" onClick={() => setShowKeyForm(v => !v)}>
                  {apiKey ? 'Replace' : 'Add Key'}
                </button>
                {apiKey && (
                  <button className="btn-icon btn-icon-danger" onClick={clearApiKey}>Remove</button>
                )}
              </div>
            </div>

            {showKeyForm && (
              <div className="api-key-form glass-panel">
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '12px' }}>
                  Stored in <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '3px' }}>localStorage</code> — only sent to <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '3px' }}>api.anthropic.com</code>, never to our servers.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    className="api-key-input"
                    type="password"
                    placeholder="sk-ant-api03-…"
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveApiKey()}
                    autoFocus
                  />
                  <button className="btn-primary" onClick={saveApiKey}>Save</button>
                  <button className="btn-secondary" onClick={() => setShowKeyForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            {/* Summary bar */}
            <div className="drafts-summary glass-panel">
              <div className="summary-stats">
                <div className="summary-stat">
                  <span className="summary-count">{draftStats.pending}</span>
                  <span className="summary-label">Pending</span>
                </div>
                <div className="summary-divider" />
                <div className="summary-stat">
                  <span className="summary-count" style={{ color: '#fbbf24' }}>{draftStats.ready}</span>
                  <span className="summary-label">Draft Ready</span>
                </div>
                <div className="summary-divider" />
                <div className="summary-stat">
                  <span className="summary-count" style={{ color: '#34d399' }}>{draftStats.approved}</span>
                  <span className="summary-label">Approved</span>
                </div>
              </div>
              <button
                className="btn-primary"
                onClick={generateAll}
                disabled={draftStats.generating || draftStats.pending === 0}
                style={{
                  opacity: (draftStats.generating || draftStats.pending === 0) ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <Sparkles size={15} />
                {draftStats.generating ? 'Generating…' : `Generate All Pending (${draftStats.pending})`}
              </button>
            </div>

            {/* Lead Draft Cards */}
            <div className="lead-draft-grid">
              {leads.map(lead => {
                const isGenerating = lead.icebreakerStatus === 'generating';
                const isApproved   = lead.icebreakerStatus === 'approved';
                const isReady      = lead.icebreakerStatus === 'ready';
                const isError      = lead.icebreakerStatus === 'error';
                const hasDraft     = isReady || isApproved;

                return (
                  <div key={lead.id} className={`lead-draft-card glass-panel ${isApproved ? 'card-approved' : ''}`}>

                    {/* Card header */}
                    <div className="draft-card-header">
                      <div>
                        <div className="draft-lead-name">{lead.name}</div>
                        <div className="draft-lead-meta">{lead.title} · {lead.company}</div>
                      </div>
                      <div className="draft-platform-badge">
                        {lead.platform === 'Email'
                          ? <Mail size={12} style={{ marginRight: '4px' }} />
                          : <MessageCircle size={12} style={{ marginRight: '4px' }} />}
                        {lead.platform}
                      </div>
                    </div>

                    {/* Industry selector */}
                    <div className="draft-field-group">
                      <label className="draft-field-label">Industry vertical</label>
                      <select
                        className="draft-select"
                        value={lead.industry}
                        onChange={e => updateLeadField(lead.id, 'industry', e.target.value)}
                        disabled={isApproved || isGenerating}
                      >
                        {INDUSTRIES.map(ind => (
                          <option key={ind.value} value={ind.value}>{ind.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Context / Hook */}
                    <div className="draft-field-group">
                      <label className="draft-field-label">Context / Hook</label>
                      <input
                        className="draft-context-input"
                        type="text"
                        value={lead.context}
                        placeholder="What makes this lead relevant right now?"
                        onChange={e => updateLeadField(lead.id, 'context', e.target.value)}
                        disabled={isApproved || isGenerating}
                      />
                    </div>

                    {/* Draft area */}
                    <div className="draft-field-group">
                      <label className="draft-field-label">
                        AI Icebreaker Draft
                        {hasDraft && (
                          <span className="draft-char-count">{lead.icebreakerDraft?.length} chars</span>
                        )}
                      </label>

                      {isGenerating && (
                        <div className="generating-state">
                          <div className="generating-dots">
                            <span /><span /><span />
                          </div>
                          <span>Crafting your icebreaker…</span>
                        </div>
                      )}

                      {isError && !isGenerating && (
                        <div className="error-state">
                          <AlertTriangle size={14} />
                          <span>{lead.icebreakerError}</span>
                        </div>
                      )}

                      {!isGenerating && !isError && !hasDraft && (
                        <div className="draft-placeholder">
                          Click "Generate" to craft a personalized icebreaker for {lead.name.split(' ')[0]}.
                        </div>
                      )}

                      {hasDraft && (
                        <textarea
                          className={`draft-textarea ${isApproved ? 'draft-textarea-locked' : ''}`}
                          value={lead.icebreakerDraft}
                          onChange={e => updateDraft(lead.id, e.target.value)}
                          disabled={isApproved}
                          rows={4}
                          spellCheck
                        />
                      )}
                    </div>

                    {/* Action row */}
                    <div className="draft-actions">
                      {!hasDraft && !isGenerating && (
                        <button
                          className="btn-primary draft-action-btn"
                          onClick={() => generateForLead(lead.id)}
                          disabled={!apiKey}
                          title={!apiKey ? 'Add an API key first' : ''}
                        >
                          <Sparkles size={13} /> Generate
                        </button>
                      )}

                      {(hasDraft || isError) && (
                        <button
                          className="btn-secondary draft-action-btn"
                          onClick={() => generateForLead(lead.id)}
                          disabled={isApproved || isGenerating}
                        >
                          <RefreshCw size={13} /> Regenerate
                        </button>
                      )}

                      {hasDraft && (
                        <>
                          <button
                            className="draft-copy-btn"
                            onClick={() => copyDraft(lead.id, lead.icebreakerDraft)}
                            title="Copy to clipboard"
                          >
                            {copiedId === lead.id
                              ? <><Check size={13} color="#34d399" /> Copied!</>
                              : <><Copy size={13} /> Copy</>}
                          </button>

                          <button
                            className={`draft-approve-btn ${isApproved ? 'btn-approved' : ''}`}
                            onClick={() => toggleApprove(lead.id)}
                          >
                            <CheckCircle2 size={13} />
                            {isApproved ? 'Approved' : 'Approve'}
                          </button>
                        </>
                      )}
                    </div>

                    {isApproved && (
                      <div className="approved-notice">
                        <CheckCircle2 size={12} color="#34d399" />
                        Locked & ready to send. Click "Approved" to unlock for editing.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Placeholder tabs ──────────────────────────────────────────── */}
        {!KNOWN_TABS.includes(activeTab) && (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', opacity: 0.7 }}>
            <Rocket size={48} color="#4f46e5" style={{ marginBottom: '16px' }} />
            <h3>{activeTab} Module</h3>
            <p style={{ color: '#94a3b8', marginTop: '8px' }}>This feature is currently being provisioned.</p>
          </div>
        )}
      </main>
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  </BrowserRouter>
);

export default App;
