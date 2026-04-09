import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { 
  Network, MessagesSquare, Users, LineChart, ShieldCheck, 
  ArrowRight, Search, Bell, Settings, LogOut, ChevronRight,
  MessageCircle, Rocket
} from 'lucide-react';
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
    
    {/* Hero Section */}
    <section className="hero-section container">
      <div className="hero-badge">
        <Rocket size={16} /> Beta Access Now Available
      </div>
      <h1 className="hero-title">
        Intelligent Outreach. <br/>
        <span className="text-gradient">Zero Spam.</span>
      </h1>
      <p className="hero-subtitle">
        Synreach is your AI-powered copilot for discovering leads, personalizing conversations securely, 
        and scaling engagement across platforms—while keeping you in complete control.
      </p>
      <div className="hero-actions">
        <Link to="/dashboard" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Start Free Trial <ArrowRight size={18} />
        </Link>
        <button className="btn-secondary">View Demo</button>
      </div>
      
      <div className="hero-visual">
        <div className="hero-glow"></div>
        <div style={{ padding: '40px', textAlign: 'left' }}>
          <div className="glass-panel" style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
             <div style={{ flex: 1 }}>
                <h3 style={{ marginBottom: '8px', color: '#a5b4fc' }}>AI Message Suggestions</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Based on recent posts and profile data, generate 3 highly personalized openers.</p>
             </div>
             <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
               <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Generate</button>
             </div>
          </div>
          <div className="glass-panel" style={{ opacity: 0.7, transform: 'scale(0.95)', transformOrigin: 'top center' }}>
             <p style={{ color: '#94a3b8' }}>Tracking 142 Active Conversations across 3 Platforms...</p>
          </div>
        </div>
      </div>
    </section>

    {/* Features */}
    <section id="features" className="features-section container">
      <div className="section-header">
        <h2 className="section-title">Scale Without Losing the Human Touch</h2>
        <p className="section-subtitle">We give you superpower insights and AI assistance, but you pull the trigger. 100% Policy Compliant.</p>
      </div>
      
      <div className="features-grid">
        <div className="glass-panel animate-fade-in delay-100">
          <div className="feature-icon"><Search /></div>
          <h3 className="feature-title">Smart Lead Discovery</h3>
          <p className="feature-desc">Surface relevant contacts based on complex parameters without scraping. We use official integrations to build your pipeline.</p>
        </div>
        <div className="glass-panel animate-fade-in delay-200">
          <div className="feature-icon"><MessagesSquare /></div>
          <h3 className="feature-title">Context-Aware AI Drafting</h3>
          <p className="feature-desc">Generate messages that sound like you. The AI analyzes your past successful interactions to suggest the perfect response.</p>
        </div>
        <div className="glass-panel animate-fade-in delay-300">
          <div className="feature-icon"><ShieldCheck /></div>
          <h3 className="feature-title">Policy Compliant</h3>
          <p className="feature-desc">Zero automated messaging bots. We prepare the drafts, you review and send. No risk of platform bans.</p>
        </div>
      </div>
    </section>
  </div>
);

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  
  return (
    <div className="app-layout animate-fade-in">
      {/* Sidebar */}
      <aside className="sidebar">
        <Link to="/" className="nav-logo" style={{ marginBottom: '16px' }}>
          <Network size={28} color="#4f46e5" />
          Synreach <span style={{ fontSize: '0.7rem', background: '#ec4899', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px'}}>PRO</span>
        </Link>
        
        <nav className="sidebar-nav">
          {['Overview', 'Campaigns', 'Conversations', 'Analytics', 'Settings'].map((item) => (
            <div 
              key={item}
              className={`nav-item ${activeTab === item ? 'active' : ''}`}
              onClick={() => setActiveTab(item)}
              style={{ cursor: 'pointer' }}
            >
              {item === 'Overview' && <Network size={20} />}
              {item === 'Campaigns' && <Rocket size={20} />}
              {item === 'Conversations' && <MessagesSquare size={20} />}
              {item === 'Analytics' && <LineChart size={20} />}
              {item === 'Settings' && <Settings size={20} />}
              {item}
            </div>
          ))}
        </nav>
        
        <div style={{ marginTop: 'auto' }}>
          <Link to="/" className="nav-item" style={{ color: '#ef4444' }}>
            <LogOut size={20} />
            Exit App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-heading)' }}>{activeTab}</h2>
          <div className="user-profile">
            <Bell size={20} color="#94a3b8" />
            <div className="avatar"></div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Alex D.</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Premium Plan</div>
            </div>
          </div>
        </header>

        {activeTab === 'Overview' && (
          <div>
            <div className="dashboard-grid">
              <div className="glass-panel stat-card">
                <span className="stat-label">Active Leads</span>
                <span className="stat-value">1,248</span>
                <span className="trend-up">+12% this week</span>
              </div>
              <div className="glass-panel stat-card">
                <span className="stat-label">Response Rate</span>
                <span className="stat-value">34.2%</span>
                <span className="trend-up">+4.1% this week</span>
              </div>
              <div className="glass-panel stat-card">
                <span className="stat-label">AI Drafts Used</span>
                <span className="stat-value">892</span>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Since last month</span>
              </div>
            </div>

            <div className="glass-panel">
              <h3 style={{ marginBottom: '24px' }}>Recent AI Suggestions</h3>
              <table className="table-container">
                <thead>
                  <tr>
                    <th>Lead Name</th>
                    <th>Platform</th>
                    <th>Suggested Context</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Sarah Jenkins</td>
                    <td>LinkedIn</td>
                    <td>Congratulate on recent Series B funding</td>
                    <td><span className="status-badge status-pending">Draft Ready</span></td>
                    <td><button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Review</button></td>
                  </tr>
                  <tr>
                    <td>Michael Chen</td>
                    <td>Email</td>
                    <td>Follow-up on product demo from last Tuesday</td>
                    <td><span className="status-badge status-active">Sent</span></td>
                    <td><button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: 0.5 }}>View</button></td>
                  </tr>
                  <tr>
                    <td>Elena Rostova</td>
                    <td>LinkedIn</td>
                    <td>Comment on new AI article publication</td>
                    <td><span className="status-badge status-pending">Draft Ready</span></td>
                    <td><button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Review</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab !== 'Overview' && (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', opacity: 0.7 }}>
             <Rocket size={48} color="#4f46e5" style={{ marginBottom: '16px' }} />
             <h3>{activeTab} Module</h3>
             <p style={{ color: '#94a3b8', marginTop: '8px' }}>This feature is currently being provisioned for your workspace.</p>
          </div>
        )}
      </main>
    </div>
  );
};

// ---- App Router ----

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
