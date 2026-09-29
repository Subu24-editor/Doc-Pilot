import React, { useState } from 'react';
import { streamPost, handleAuthError } from '../streamPost';

export default function Summarizer({ file }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (!file) {
      alert('Please select a PDF file first.');
      return;
    }

    setSummary('');
    setLoading(true);

    const formData = new FormData();
    formData.append('document', file);

    try {
      await streamPost('/api/summarize-stream', formData, (chunk) =>
        setSummary((prev) => prev + chunk)
      );
    } catch (err) {
      console.error('Summarize error:', err);
      setSummary(`Error: ${err.message}`);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card" style={{ marginTop: '20px', maxWidth: '100%', textAlign: 'left' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#fff' }}>Document Summarizer</h3>
      
      <button 
        id="summarizeBtn" 
        onClick={handleSummarize} 
        disabled={loading || !file}
        className="submit-btn"
        style={{ width: '100%', opacity: !file ? 0.5 : 1 }}
      >
        {loading ? 'AI is generating text...' : 'Summarize Document'}
      </button>

      <div 
        id="summaryOutput" 
        style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#111827', 
          borderRadius: '6px', 
          border: '1px solid #1f2937',
          color: '#e5e7eb',
          minHeight: '60px',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.6'
        }}
      >
        {summary || 'Summary text will appear here...'}
      </div>
    </div>
  );
}