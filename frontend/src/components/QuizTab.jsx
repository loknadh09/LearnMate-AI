import { useState } from 'react';
import { generateQuiz, submitQuiz } from '../api';

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

export default function QuizTab({ studentId }) {
  const [topic, setTopic] = useState('');
  const [numQ, setNumQ] = useState(5);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [activeTopic, setActiveTopic] = useState('');
  const [selected, setSelected] = useState({});
  const [results, setResults] = useState(null);

  const handleGenerate = async () => {
    if (!topic.trim()) { alert('Please enter a topic first.'); return; }
    setLoading(true);
    setQuestions([]);
    setResults(null);
    setSelected({});
    try {
      const data = await generateQuiz({ student_id: studentId, topic: topic.trim(), num_questions: numQ });
      if (data.error) { alert(data.error); return; }
      setQuestions(data.questions);
      setActiveTopic(data.topic);
    } catch (e) {
      alert(`Failed to generate quiz: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const answers = questions.map((_, i) => ({ id: i, selected: selected[i] || '' }));
    const unanswered = answers.filter(a => !a.selected).length;
    if (unanswered > 0 && !confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
    try {
      const data = await submitQuiz({ student_id: studentId, topic: activeTopic, answers });
      if (data.error) { alert(data.error); return; }
      setResults(data);
      setQuestions([]);
    } catch (e) {
      alert(`Submission failed: ${e.message}`);
    }
  };

  const reset = () => { setResults(null); setQuestions([]); setSelected({}); setTopic(''); };

  return (
    <section className="tab-section">
      <div className="section-header">
        <h1>Quiz Yourself</h1>
        <p>Test your knowledge — mistakes are tracked and used to improve future explanations.</p>
      </div>

      {/* Setup card */}
      <div id="quizSetup" className="card">
        <div className="form-row">
          <input
            id="quizTopic"
            type="text"
            className="input-lg"
            placeholder="Enter topic (e.g. Photosynthesis)"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          />
          <select id="quizCount" className="input-lg" value={numQ} onChange={e => setNumQ(Number(e.target.value))}>
            <option value={3}>3 questions</option>
            <option value={5}>5 questions</option>
            <option value={10}>10 questions</option>
          </select>
          <button id="generateQuizBtn" className="btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? <><span className="spinner" /> Generating…</> : 'Generate Quiz'}
          </button>
        </div>
      </div>

      {/* Questions */}
      {questions.length > 0 && (
        <div id="quizContainer">
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
                      id={`opt-${i}-${letter}`}
                      className={`option-label${selected[i] === letter ? ' selected' : ''}`}
                      onClick={() => setSelected(prev => ({ ...prev, [i]: letter }))}
                    >
                      <input type="radio" name={`q${i}`} value={letter} readOnly checked={selected[i] === letter} />
                      <span className="opt-key">{letter}</span>
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="quiz-footer">
            <button id="submitQuizBtn" className="btn-primary btn-lg" onClick={handleSubmit}>Submit Quiz ✓</button>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div id="quizResults">
          <div className="result-header">
            <div
              className="score-ring"
              style={{ '--pct': `${(results.percentage / 100) * 360}deg` }}
            >
              <span>{results.percentage}%</span>
            </div>
            <div className="result-msg">{results.message}</div>
            <div className="result-sub">
              {results.score} / {results.total} correct on <strong>{results.topic}</strong>
            </div>
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
            <button id="tryAnotherQuizBtn" className="btn-secondary" onClick={reset}>Try Another Quiz</button>
          </div>
        </div>
      )}
    </section>
  );
}
