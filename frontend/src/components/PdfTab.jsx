import { useState, useRef } from 'react';
import { uploadPdf, generatePdfQuiz, summarizePdf, submitQuiz } from '../api';

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

// Render markdown-like summary with ## headings and • bullets
function SummaryRenderer({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="summary-rendered">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <h3 key={i} className="sum-heading">{line.replace('## ', '')}</h3>;
        }
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return <div key={i} className="sum-bullet">{line.replace(/^[•\-]\s/, '')}</div>;
        }
        if (line.trim() === '') return <div key={i} className="sum-gap" />;
        return <p key={i} className="sum-para">{line}</p>;
      })}
    </div>
  );
}

export default function PdfTab({ studentId }) {
  const [pdfInfo, setPdfInfo]     = useState(null);   // { filename, pages, word_count, preview }
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver]   = useState(false);

  // Quiz state
  const [numQ, setNumQ]         = useState(5);
  const [quizLoading, setQL]    = useState(false);
  const [questions, setQuestions] = useState([]);
  const [activeTopic, setAT]    = useState('');
  const [selected, setSelected] = useState({});
  const [results, setResults]   = useState(null);

  // Summary state
  const [sumLoading, setSL]     = useState(false);
  const [summary, setSummary]   = useState(null);

  const fileRef = useRef();

  /* ── Upload ── */
  const handleFile = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a PDF file.'); return;
    }
    setUploading(true);
    setPdfInfo(null); setSummary(null); setQuestions([]); setResults(null);
    try {
      const data = await uploadPdf(studentId, file);
      if (data.detail) { alert(data.detail); return; }
      setPdfInfo(data);
    } catch (e) {
      alert(`Upload failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = e => { if (e.target.files[0]) handleFile(e.target.files[0]); };
  const onDrop = e => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  /* ── Generate Quiz ── */
  const handleQuiz = async () => {
    setQL(true); setQuestions([]); setResults(null); setSelected({});
    try {
      const data = await generatePdfQuiz({ student_id: studentId, num_questions: numQ });
      if (data.detail) { alert(data.detail); return; }
      if (data.error)  { alert(data.error);  return; }
      setQuestions(data.questions);
      setAT(data.topic);
    } catch (e) {
      alert(`Quiz generation failed: ${e.message}`);
    } finally {
      setQL(false);
    }
  };

  /* ── Submit Quiz ── */
  const handleSubmit = async () => {
    const answers = questions.map((_, i) => ({ id: i, selected: selected[i] || '' }));
    const unanswered = answers.filter(a => !a.selected).length;
    if (unanswered > 0 && !confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
    try {
      const data = await submitQuiz({ student_id: studentId, topic: activeTopic, answers });
      if (data.error) { alert(data.error); return; }
      setResults(data); setQuestions([]);
    } catch (e) {
      alert(`Submission failed: ${e.message}`);
    }
  };

  /* ── Summarize ── */
  const handleSummary = async () => {
    setSL(true); setSummary(null);
    try {
      const data = await summarizePdf(studentId);
      if (data.detail) { alert(data.detail); return; }
      setSummary(data);
    } catch (e) {
      alert(`Summary failed: ${e.message}`);
    } finally {
      setSL(false);
    }
  };

  const clearPdf = () => {
    setPdfInfo(null); setQuestions([]); setResults(null); setSummary(null); setSelected({});
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <section className="tab-section">
      <div className="section-header">
        <h1>PDF-Based Learning</h1>
        <p>Upload a PDF and generate quizzes or a structured summary from its content.</p>
      </div>

      {/* Drop Zone */}
      {!pdfInfo && (
        <div
          className={`pdf-drop-zone${dragOver ? ' drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={onFileChange} />
          {uploading ? (
            <div className="pdf-drop-inner">
              <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
              <div className="pdf-drop-title">Uploading & extracting text…</div>
            </div>
          ) : (
            <div className="pdf-drop-inner">
              <div className="pdf-drop-icon">📄</div>
              <div className="pdf-drop-title">Drop your PDF here</div>
              <div className="pdf-drop-sub">or click to browse files · max 20 MB</div>
              <button className="btn-secondary" style={{ marginTop: 12 }} onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
                Browse PDF
              </button>
            </div>
          )}
        </div>
      )}

      {/* PDF Info card */}
      {pdfInfo && (
        <div className="pdf-info-card">
          <div className="pdf-info-icon">📄</div>
          <div className="pdf-info-details">
            <div className="pdf-info-name">{pdfInfo.filename}</div>
            <div className="pdf-info-meta">{pdfInfo.pages} pages · {pdfInfo.word_count?.toLocaleString()} words</div>
          </div>
          <button className="pdf-clear-btn" onClick={clearPdf} title="Remove PDF">✕</button>
        </div>
      )}

      {/* Preview */}
      {pdfInfo?.preview && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="pdf-preview-label">📖 Content Preview</div>
          <div className="pdf-preview-text">{pdfInfo.preview}</div>
        </div>
      )}

      {/* Actions */}
      {pdfInfo && (
        <div className="card">
          <div className="form-row" style={{ flexWrap: 'wrap' }}>
            <select className="input-lg" value={numQ} onChange={e => setNumQ(Number(e.target.value))}>
              <option value={3}>3 questions</option>
              <option value={5}>5 questions</option>
              <option value={10}>10 questions</option>
            </select>
            <button className="btn-primary" onClick={handleQuiz} disabled={quizLoading}>
              {quizLoading ? <><span className="spinner" /> Generating Quiz…</> : '🎯 Generate Quiz from PDF'}
            </button>
            <button className="btn-secondary" onClick={handleSummary} disabled={sumLoading}>
              {sumLoading ? <><span className="spinner" style={{ borderTopColor: 'var(--primary)' }} /> Summarizing…</> : '✨ Summarize PDF'}
            </button>
          </div>
        </div>
      )}

      {/* Quiz Questions */}
      {questions.length > 0 && (
        <div>
          {questions.map((q, i) => (
            <div key={i} className="quiz-question-card">
              <div className="q-number">Question {i + 1} of {questions.length}</div>
              <div className="q-text">{q.question}</div>
              <div className="options">
                {q.options.map((opt, j) => {
                  const letter = OPTION_KEYS[j];
                  return (
                    <label
                      key={letter}
                      className={`option-label${selected[i] === letter ? ' selected' : ''}`}
                      onClick={() => setSelected(prev => ({ ...prev, [i]: letter }))}
                    >
                      <input type="radio" name={`pq${i}`} value={letter} readOnly checked={selected[i] === letter} />
                      <span className="opt-key">{letter}</span>
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="quiz-footer">
            <button className="btn-primary btn-lg" onClick={handleSubmit}>Submit Quiz ✓</button>
          </div>
        </div>
      )}

      {/* Quiz Results */}
      {results && (
        <div>
          <div className="result-header">
            <div className="score-ring" style={{ '--pct': `${(results.percentage / 100) * 360}deg` }}>
              <span>{results.percentage}%</span>
            </div>
            <div className="result-msg">{results.message}</div>
            <div className="result-sub">{results.score} / {results.total} correct on <strong>{pdfInfo?.filename}</strong></div>
          </div>
          {(results.results || []).map((r, i) => (
            <div key={i} className={`result-item ${r.is_correct ? 'correct-item' : 'wrong-item'}`}>
              <div className={`result-verdict ${r.is_correct ? 'c' : 'w'}`}>
                {r.is_correct ? '✅ Correct' : '❌ Incorrect'}
              </div>
              <div>{r.question}</div>
              {!r.is_correct && (
                <div className="result-explanation">
                  Correct: <strong>{r.correct_answer}</strong> — {r.explanation || ''}
                </div>
              )}
            </div>
          ))}
          <div className="quiz-footer">
            <button className="btn-secondary" onClick={() => { setResults(null); setSelected({}); }}>
              Try Another Quiz
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="card summary-card" style={{ marginTop: 8 }}>
          <div className="sum-file-badge">📄 {summary.filename} · {summary.pages} pages</div>
          <SummaryRenderer text={summary.summary} />
        </div>
      )}
    </section>
  );
}
