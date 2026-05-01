import { useState, useEffect, useRef } from 'react';
import { askTutor } from '../api';

const WELCOME = "Hi! I'm LearnMate AI. Ask me anything you want to learn about and I'll tailor my explanation to your learning style. What topic shall we explore today?";

export default function ChatTab({ studentId }) {
  const [messages, setMessages] = useState([{ role: 'bot', text: WELCOME }]);
  const [input, setInput] = useState('');
  const [useWeb, setUseWeb] = useState(true);
  const [topicHint, setTopicHint] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendQuestion = async () => {
    const question = input.trim();
    if (!question || loading) return;
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    try {
      const data = await askTutor({ student_id: studentId, question, topic: topicHint, use_web: useWeb });
      const answer = data.answer || data.error || 'No response received.';
      setMessages(prev => [...prev, { role: 'bot', text: answer, webUsed: data.resources_used }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: `⚠️ Could not reach backend: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendQuestion(); }
  };

  return (
    <section className="tab-section">
      <div className="section-header">
        <h1>Ask Your AI Tutor</h1>
        <p>Ask anything — your history adapts the explanation to your level.</p>
      </div>
      <div className="chat-wrap">
        <div className="chat-messages" id="chatMessages">
          {messages.map((msg, i) => (
            <div key={i} className={`msg ${msg.role === 'bot' ? 'bot-msg' : 'user-msg'}`}>
              <span className="msg-avatar">{msg.role === 'bot' ? '🧠' : '👤'}</span>
              <div className="msg-bubble">
                {msg.text}
                {msg.role === 'bot' && msg.webUsed && (
                  <div className="web-badge">🌐 Enhanced with web resources</div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="msg bot-msg">
              <span className="msg-avatar">🧠</span>
              <div className="msg-bubble" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="spinner" /> Thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-options">
          <label className="toggle-wrap">
            <input type="checkbox" checked={useWeb} onChange={e => setUseWeb(e.target.checked)} />
            <span className="toggle" />
            <span>Fetch web resources</span>
          </label>
          <input
            type="text"
            className="topic-hint"
            placeholder="Topic hint (optional)"
            value={topicHint}
            onChange={e => setTopicHint(e.target.value)}
          />
        </div>

        <div className="chat-input-row">
          <textarea
            id="chatInput"
            placeholder="Type your question here…"
            rows={2}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button id="sendBtn" className="btn-primary" onClick={sendQuestion} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Send'}
          </button>
        </div>
      </div>
    </section>
  );
}
