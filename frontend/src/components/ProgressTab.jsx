import { useState } from 'react';
import { getProgress, updateStyle } from '../api';

export default function ProgressTab({ studentId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await getProgress(studentId);
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStyle = async (e) => {
    const style = e.target.value;
    if (data) setData(prev => ({ ...prev, learning_style: style }));
    try { await updateStyle({ student_id: studentId, style }); } catch {}
  };

  return (
    <section className="tab-section">
      <div className="section-header">
        <h1>Your Progress</h1>
        <p>Memory-based tracking of topics, mistakes, and quiz performance.</p>
      </div>

      <div className="progress-actions">
        <button id="refreshProgressBtn" className="btn-secondary" onClick={load} disabled={loading}>
          {loading ? <><span className="spinner" style={{ borderTopColor: 'var(--text)' }} /> Loading…</> : '🔄 Refresh'}
        </button>
        <div className="style-selector">
          <label>Learning Style</label>
          <select
            id="styleSelect"
            value={data?.learning_style || 'balanced'}
            onChange={handleStyle}
          >
            <option value="balanced">Balanced</option>
            <option value="simple">Simple</option>
            <option value="detailed">Detailed</option>
            <option value="visual">Visual</option>
          </select>
        </div>
      </div>

      {error && <div className="empty-state">⚠️ {error}</div>}

      {!data && !error && (
        <div className="empty-state">Click <strong>Refresh</strong> to load your progress.</div>
      )}

      {data && (
        <div id="progressContent">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{data.total_questions_asked || 0}</div>
              <div className="stat-label">Questions Asked</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{(data.topics_covered || []).length}</div>
              <div className="stat-label">Topics Covered</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.avg_quiz_score || 0}%</div>
              <div className="stat-label">Avg Quiz Score</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.total_mistakes || 0}</div>
              <div className="stat-label">Mistakes Logged</div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 12, fontSize: '.9rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Topics Covered</h3>
            <div className="tag-list">
              {(data.topics_covered || []).length > 0
                ? data.topics_covered.map(t => <span key={t} className="tag">{t}</span>)
                : <em>None yet</em>}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 12, fontSize: '.9rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Weak Topics</h3>
            <div className="tag-list">
              {(data.weak_topics || []).length > 0
                ? data.weak_topics.map(t => <span key={t} className="tag weak">⚠️ {t}</span>)
                : <em>None — great job!</em>}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 12, fontSize: '.9rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Recent Mistakes</h3>
            {(data.mistakes || []).length === 0
              ? <div className="empty-state" style={{ padding: 16 }}>No mistakes recorded yet 🎉</div>
              : [...(data.mistakes || [])].reverse().slice(0, 5).map((m, i) => (
                <div key={i} className="mistake-item">
                  <div className="mi-q">{m.question}</div>
                  <div className="mi-detail">You said: <strong>{m.wrong_answer}</strong> → Correct: <strong>{m.correct_answer}</strong> ({m.topic})</div>
                </div>
              ))}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 12, fontSize: '.9rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Quiz History</h3>
            {(data.quiz_scores || []).length === 0
              ? <div className="empty-state" style={{ padding: 16 }}>No quizzes taken yet</div>
              : [...(data.quiz_scores || [])].reverse().slice(0, 8).map((s, i) => (
                <div key={i} className="quiz-score-row">
                  <span>{s.topic}</span>
                  <div className="pct-bar-wrap"><div className="pct-bar" style={{ width: `${s.percentage}%` }} /></div>
                  <span>{s.percentage}% ({s.score}/{s.total})</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </section>
  );
}
