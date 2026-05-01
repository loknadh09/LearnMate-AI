import { useState } from 'react';
import { getSummary } from '../api';

// Render markdown-like ## headings, • bullets, and plain paragraphs
function SummaryRenderer({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="summary-rendered">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('## ')) {
          return <h3 key={i} className="sum-heading">{trimmed.replace('## ', '')}</h3>;
        }
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="sum-bullet">
              <span className="sum-bullet-dot">▸</span>
              {trimmed.replace(/^[•\-\*]\s/, '')}
            </div>
          );
        }
        if (trimmed === '') return <div key={i} className="sum-gap" />;
        return <p key={i} className="sum-para">{line}</p>;
      })}
    </div>
  );
}

export default function SummaryTab({ studentId }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [shown, setShown]     = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setShown(false);
    try {
      const data = await getSummary(studentId);
      setSummary(data.summary || 'No summary available yet. Ask some questions first!');
      setShown(true);
    } catch (e) {
      setSummary(`Error: ${e.message}`);
      setShown(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="tab-section">
      <div className="section-header">
        <h1>Revision Summary</h1>
        <p>Get a personalized AI-generated summary of everything you've studied.</p>
      </div>

      <div className="card center-card">
        <div className="sum-hero-icon">✨</div>
        <p className="sum-hero-desc">
          Based on your topics, quiz history, and learning style — LearnMate AI will generate
          a structured revision summary tailored just for you.
        </p>
        <button id="generateSummaryBtn" className="btn-primary btn-lg" onClick={handleGenerate} disabled={loading}>
          {loading ? <><span className="spinner" /> Generating Summary…</> : '✨ Generate My Summary'}
        </button>
      </div>

      {shown && (
        <div id="summaryContent" className="card summary-card">
          <SummaryRenderer text={summary} />
        </div>
      )}
    </section>
  );
}
