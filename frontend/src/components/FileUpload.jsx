import React, { useState } from 'react';
import { MAX_FILE_BYTES } from '../streamPost';

export default function FileUpload({ onFileSelect }) {
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError('File is too large. Maximum size is 4 MB.');
      e.target.value = '';
      onFileSelect(null);
      return;
    }
    setError('');
    onFileSelect(file);
  };

  return (
    <div style={{ background: '#111827', padding: '20px', borderRadius: '8px', border: '1px solid #1f2937' }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>Upload Workspace Document</h3>
      <p style={{ margin: '0 0 15px 0', color: '#9ca3af', fontSize: '14px' }}>
        Select a PDF file to enable the AI summarizer and chatbot features.
      </p>
      
      <div style={{ 
        border: '2px dashed #374151', 
        padding: '20px', 
        borderRadius: '6px', 
        textAlign: 'center', 
        background: '#030712',
        cursor: 'pointer'
      }}>
        <input 
          type="file" 
          id="documentInput" 
          accept=".pdf,.txt" 
          onChange={handleChange} 
          style={{ 
            color: '#9ca3af', 
            fontSize: '14px',
            width: '100%'
          }} 
        />
      </div>
      {error && <p style={{ color: '#f87171', margin: '10px 0 0 0', fontSize: '14px' }}>{error}</p>}
    </div>
  );
}
