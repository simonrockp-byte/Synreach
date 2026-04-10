import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import {
  Network, MessagesSquare, Users,
  ArrowRight, Search, Bell,
  MessageCircle, Rocket, Mail, CheckCircle2,
  Zap, Database, Globe, Sparkles, RefreshCw, Copy, Check,
  AlertTriangle,
} from 'lucide-react';
import { generateIcebreaker, INDUSTRIES } from './utils/aiPersonalization';
import { supabase } from './supabaseClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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

const INITIAL_LEADS = [];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [leads, setLeads] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [outreachProgress, setOutreachProgress] = useState(0);

  // Messaging state
  const [messages, setMessages] = useState([]);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  // Fetch leads and messages on mount
  useEffect(() => {
    fetchLeads();
    fetchMessages();
  }, []);

  const fetchLeads = async () => {
    if (!supabase) { setLeads(INITIAL_LEADS); return; }
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      setLeads(INITIAL_LEADS);
    } else {
      const mapped = data.map(l => ({
        ...l,
        icebreakerDraft: l.icebreaker_draft,
        icebreakerStatus: l.icebreaker_status,
        lastActivity: l.last_activity ? new Date(l.last_activity).toLocaleString() : 'N/A'
      }));
      setLeads(mapped.length > 0 ? mapped : INITIAL_LEADS);
    }
  };

  const fetchMessages = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('messages')
      .select('*, leads(name, email)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data);
    }
  };

  // Discovery state
  const [searchQuery, setSearchQuery] = useState('');
  const [isMining, setIsMining] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);
  const [discoveredLeads, setDiscoveredLeads] = useState([]);
  const [discoveryError, setDiscoveryError] = useState(null);

  // AI Drafts state
  const [copiedId, setCopiedId] = useState(null);

  const generateForLead = async (leadId) => {
    // Capture current lead data at generation time
    const lead = leads.find(l => l.id === leadId);

    setLeads(prev => prev.map(l =>
      l.id === leadId ? { ...l, icebreakerStatus: 'generating', icebreakerError: null } : l
    ));

    try {
      const draft = await generateIcebreaker(lead);
      setLeads(prev => prev.map(l =>
        l.id === leadId ? { ...l, icebreakerDraft: draft, icebreakerStatus: 'ready' } : l
      ));

      if (supabase) await supabase
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

    if (supabase) await supabase
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
    if (supabase) await supabase.from('leads').update({ [dbField]: value }).eq('id', leadId);
  };

  const copyDraft = (leadId, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(leadId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // ── Derived stats ────────────────────────────────────────────────────────
  const stats = {
    totalLeads: leads.length,
    sentMessages: leads.filter(l => l.status === 'Sent').length,
    draftsReady: leads.filter(l => l.icebreakerStatus === 'ready' || l.icebreakerStatus === 'approved').length,
    responseRate: 42.8 // Keeping this mock until we have real reply tracking
  };

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
        const res = await fetch(`${API_BASE}/api/send`, {
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
          if (supabase) await supabase.from('leads').update({ status: 'Sent', last_activity: new Date().toISOString() }).eq('id', lead.id);
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
      const res = await fetch(`${API_BASE}/api/discover`, {
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

    if (supabase) {
      const { error } = await supabase.from('leads').insert(newLeads).select();
      if (error) { console.error('Error adding leads:', error); return; }
      await fetchLeads();
    } else {
      const withIds = newLeads.map((l, i) => ({
        ...l,
        id: Date.now() + i,
        icebreakerDraft: null,
        icebreakerStatus: 'pending',
      }));
      setLeads(prev => {
        const existingIds = new Set(prev.map(l => l.id));
        return [...prev, ...withIds.filter(l => !existingIds.has(l.id))];
      });
    }
    setActiveTab('AI Drafts');
  };

  const deleteLead = async (id) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    
    // Update local state
    setLeads(prev => prev.filter(l => l.id !== id));
    
    // Update Supabase
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) console.error('Error deleting lead:', error);
  };

  const KNOWN_TABS = ['Overview', 'Discovery', 'Campaigns', 'AI Drafts', 'Leads', 'Messages'];

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
              <span className="stat-value">{stats.sentMessages}</span>
              <span className="trend-up">{stats.sentMessages > 0 ? '+100% growth' : 'Starting outreach'}</span>
            </div>
            <div className="glass-panel stat-card">
              <span className="stat-label">Drafts Ready</span>
              <span className="stat-value">{stats.draftsReady}</span>
              <span className="trend-up" style={{ color: '#fbbf24'}}>{stats.draftsReady} pending review</span>
            </div>
            <div className="glass-panel stat-card">
              <span className="stat-label">Total Leads</span>
              <span className="stat-value">{stats.totalLeads}</span>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Across all sources</span>
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

        {/* ── Leads Management ────────────────────────────────────────── */}
        {activeTab === 'Leads' && (
          <div className="glass-panel animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ marginBottom: '4px' }}>Contact Database</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Manage all prospects discovered across your campaigns.</p>
              </div>
              <div className="search-input-wrapper" style={{ width: '300px' }}>
                <Search size={18} color="#94a3b8" />
                <input 
                  type="text" 
                  placeholder="Search contacts..." 
                  style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }}
                />
              </div>
            </div>

            <table className="table-container">
              <thead>
                <tr>
                  <th>Name & Company</th>
                  <th>Title</th>
                  <th>Contact Info</th>
                  <th>Industry</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{lead.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6366f1' }}>{lead.company}</div>
                    </td>
                    <td style={{ fontSize: '0.9rem' }}>{lead.title}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{lead.email}</div>
                      {lead.phone && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{lead.phone}</div>}
                    </td>
                    <td><span className="source-badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)' }}>{lead.industry}</span></td>
                    <td>
                      <span className={`status-badge ${lead.status === 'Sent' ? 'status-active' : 'status-idle'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn-icon btn-icon-danger" 
                        onClick={() => deleteLead(lead.id)}
                        style={{ padding: '6px' }}
                      >
                        <AlertTriangle size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                      No leads found. Start discovery to find new prospects.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Messages Inbox ─────────────────────────────────────────── */}
        {activeTab === 'Messages' && (
          <div className="inbox-container animate-fade-in">
            <div className="inbox-sidebar">
              <div className="inbox-header">
                <h3>Recent Messages</h3>
              </div>
              <div className="inbox-list">
                {messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`inbox-item ${selectedMessageId === msg.id ? 'active' : ''} ${!msg.read ? 'unread' : ''}`}
                    onClick={() => setSelectedMessageId(msg.id)}
                  >
                    <div className="inbox-item-header">
                      <span className="inbox-item-name">{msg.leads?.name || 'Unknown Contact'}</span>
                      <span className="inbox-item-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="inbox-item-preview">{msg.content}</div>
                    <div className="inbox-item-platform">
                      {msg.platform === 'whatsapp' ? <MessageCircle size={10} /> : <Mail size={10} />}
                      {msg.platform}
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No messages yet.</div>
                )}
              </div>
            </div>

            <div className="inbox-content">
              {selectedMessageId ? (
                (() => {
                  const msg = messages.find(m => m.id === selectedMessageId);
                  return (
                    <div className="message-view">
                      <div className="message-view-header">
                        <div>
                          <h4>{msg.leads?.name}</h4>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{msg.leads?.email}</span>
                        </div>
                        <span className={`platform-tag ${msg.platform}`}>{msg.platform}</span>
                      </div>
                      <div className="message-bubbles">
                        <div className={`message-bubble ${msg.direction}`}>
                          <div className="bubble-content">{msg.content}</div>
                          <div className="bubble-time">{new Date(msg.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="message-reply-box">
                        <textarea placeholder="Type your reply..." rows={3}></textarea>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                          <button className="btn-primary" onClick={() => alert('Reply sending feature coming soon!')}>Send Reply</button>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', opacity: 0.5 }}>
                  <MessagesSquare size={64} style={{ marginBottom: '16px' }} />
                  <p>Select a message to view the conversation</p>
                </div>
              )}
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
