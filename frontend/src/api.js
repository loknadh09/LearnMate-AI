const API = 'http://localhost:8000';

export async function checkHealth() {
  try {
    const r = await fetch(`${API}/`, { signal: AbortSignal.timeout(3000) });
    return r.ok;
  } catch {
    return false;
  }
}

export async function askTutor({ student_id, question, topic, use_web }) {
  const res = await fetch(`${API}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id, question, topic, use_web }),
  });
  return res.json();
}

export async function generateQuiz({ student_id, topic, num_questions }) {
  const res = await fetch(`${API}/quiz/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id, topic, num_questions }),
  });
  return res.json();
}

export async function submitQuiz({ student_id, topic, answers }) {
  const res = await fetch(`${API}/quiz/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id, topic, answers }),
  });
  return res.json();
}

export async function getProgress(student_id) {
  const res = await fetch(`${API}/progress/${encodeURIComponent(student_id)}`);
  return res.json();
}

export async function updateStyle({ student_id, style }) {
  await fetch(`${API}/progress/style`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id, style }),
  });
}

export async function getSummary(student_id) {
  const res = await fetch(`${API}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id }),
  });
  return res.json();
}

// PDF APIs
export async function uploadPdf(student_id, file) {
  const form = new FormData();
  form.append('student_id', student_id);
  form.append('file', file);
  const res = await fetch(`${API}/pdf/upload`, {
    method: 'POST',
    body: form,
  });
  return res.json();
}

export async function generatePdfQuiz({ student_id, num_questions }) {
  const res = await fetch(`${API}/pdf/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id, num_questions }),
  });
  return res.json();
}

export async function summarizePdf(student_id) {
  const res = await fetch(`${API}/pdf/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id }),
  });
  return res.json();
}
