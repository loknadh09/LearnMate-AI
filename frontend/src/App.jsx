import { useState, useEffect } from 'react';
import LoginPage  from './components/LoginPage';
import ChatTab    from './components/ChatTab';
import PdfTab     from './components/PdfTab';
import QuizTab    from './components/QuizTab';
import ProgressTab from './components/ProgressTab';
import SummaryTab  from './components/SummaryTab';
import { checkHealth } from './api';
import logoImg from './assets/logo.png';

const TABS = [
  { id: 'chat',     label: '💬 Ask Tutor' },
  { id: 'pdf',      label: '📄 PDF Quiz' },
  { id: 'quiz',     label: '🎯 Quiz' },
  { id: 'progress', label: '📊 Progress' },
  { id: 'summary',  label: '📝 Summary' },
];

export default function App() {
  const [user, setUser]         = useState(null);   // { name, studentId, style }
  const [activeTab, setActiveTab] = useState('chat');
  const [online, setOnline]     = useState(null);

  useEffect(() => {
    const ping = async () => setOnline(await checkHealth());
    ping();
    const id = setInterval(ping, 15000);
    return () => clearInterval(id);
  }, []);

  const dotClass =
    online === null ? 'status-dot' :
    online ? 'status-dot online' : 'status-dot offline';

  /* ── Not logged in → show login page ── */
  if (!user) {
    return <LoginPage onLogin={u => setUser(u)} />;
  }

  /* ── Logged in → show main app ── */
  return (
    <>
      {/* Background blobs */}
      <div className="bg-blob blob1" />
      <div className="bg-blob blob2" />
      <div className="bg-blob blob3" />

      <header>
        <div className="header-inner">
          {/* Logo */}
          <div className="logo" style={{ cursor: 'default' }}>
            <img
              src={logoImg}
              alt="LearnMate AI"
              className="header-logo-img"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="logo-text-wrap">
              <span className="logo-text">
                Learn<span className="grad-text">Mate</span> AI
              </span>
              <span className="logo-sub">Adaptive Learning Companion</span>
            </div>
          </div>

          {/* Right side */}
          <div className="header-right">
            <div className="student-chip">
              <span className="student-avatar">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <span className="student-name">{user.name}</span>
                <span className="student-id-txt">{user.studentId}</span>
              </div>
            </div>
            <div className={dotClass} title={online ? 'Backend online' : 'Backend offline'} />
            <button className="logout-btn" onClick={() => setUser(null)}>
              ⬅ Logout
            </button>
          </div>
        </div>

        <nav className="tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              id={`tab-btn-${t.id}`}
              className={`tab${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {activeTab === 'chat'     && <ChatTab     studentId={user.studentId} />}
        {activeTab === 'pdf'      && <PdfTab      studentId={user.studentId} />}
        {activeTab === 'quiz'     && <QuizTab     studentId={user.studentId} />}
        {activeTab === 'progress' && <ProgressTab studentId={user.studentId} />}
        {activeTab === 'summary'  && <SummaryTab  studentId={user.studentId} />}
      </main>
    </>
  );
}
