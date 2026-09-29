import React, { useState } from 'react';
import { streamPost, handleAuthError } from '../streamPost';

export default function QuestionAnswer({ file }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a PDF file first.');
      return;
    }
    if (!question.trim()) {
      alert('Please enter a question.');
      return;
    }

    setAnswer('');
    setLoading(true);

    const formData = new FormData();
    formData.append('document', file);
    formData.append('question', question);

    try {
      await streamPost('/api/ask-stream', formData, (chunk) =>
        setAnswer((prev) => prev + chunk)
      );
    } catch (err) {
      console.error('Q&A error:', err);
      setAnswer(`Error: ${err.message}`);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#111827', padding: '20px', borderRadius: '8px', border: '1px solid #1f2937' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#fff' }}>Ask Document Chatbot</h3>
      
      <form onSubmit={handleAsk} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder={file ? "Ask a question about the document..." : "Upload a document first..."}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading || !file}
          style={{
            flex: 1,
            padding: '12px',
            background: '#030712',
            border: '1px solid #374151',
            borderRadius: '6px',
            color: '#fff',
            outline: 'none'
          }}
        />
        <button 
          type="submit" 
          disabled={loading || !file}
          style={{ 
            padding: '12px 24px', 
            background: '#4f46e5', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontWeight: 'bold',
            opacity: (!file || loading) ? 0.5 : 1 
          }}
        >
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      <div 
        style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#030712', 
          borderRadius: '6px', 
          border: '1px solid #374151',
          color: '#e5e7eb',
          minHeight: '120px',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.6'
        }}
      >
        {answer || 'AI chatbot answers will stream down here...'}
      </div>
    </div>
  );
}
