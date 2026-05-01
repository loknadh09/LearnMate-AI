import { useState } from 'react';
import logoImg from '../assets/logo.png';

const STYLES = [
  { id: 'balanced', label: '⚖️ Balanced' },
  { id: 'simple',   label: '🌱 Simple' },
  { id: 'detailed', label: '🔬 Detailed' },
  { id: 'visual',   label: '🎨 Visual' },
];

export default function LoginPage({ onLogin }) {
  const [name, setName]       = useState('');
  const [sid, setSid]         = useState('');
  const [style, setStyle]     = useState('balanced');
  const [error, setError]     = useState('');

  const handleLogin = () => {
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!sid.trim())  { setError('Please enter a Student ID.'); return; }
    setError('');
    onLogin({ name: name.trim(), studentId: sid.trim(), style });
  };

  return (
    <div className="login-page">
      {/* Animated blobs */}
      <div className="login-blob lb1" />
      <div className="login-blob lb2" />
      <div className="login-blob lb3" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo-wrap">
          <img
            src={logoImg}
            alt="LearnMate AI"
            className="login-logo-img"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        </div>

        <h1 className="login-title">
          Welcome to <span className="grad-text">LearnMate AI</span>
        </h1>
        <p className="login-subtitle">
          Your personal AI tutor that adapts to how you learn.
        </p>

        <div className="login-form">
          <div className="login-field">
            <label>Your Name</label>
            <input
              type="text"
              placeholder="e.g. Riya Sharma"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoFocus
            />
          </div>

          <div className="login-field">
            <label>Student ID</label>
            <input
              type="text"
              placeholder="e.g. student_42"
              value={sid}
              onChange={e => setSid(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div className="login-field">
            <label>Learning Style</label>
            <div className="style-pills">
              {STYLES.map(s => (
                <button
                  key={s.id}
                  className={`style-pill${style === s.id ? ' active' : ''}`}
                  onClick={() => setStyle(s.id)}
                  type="button"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="login-btn" onClick={handleLogin}>
            Start Learning →
          </button>
        </div>

        <div className="login-features">
          <div className="lf-item">📄 PDF-based Quizzes</div>
          <div className="lf-item">🧠 Memory-adapted Answers</div>
          <div className="lf-item">📊 Progress Tracking</div>
        </div>
      </div>
    </div>
  );
}
