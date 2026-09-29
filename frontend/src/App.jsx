import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Link, Navigate } from 'react-router-dom';
import './style.css';
import FileUpload from './components/FileUpload';
import Summarizer from './components/Summarizer';
import QuestionAnswer from './components/QuestionAnswer';

// --- BACKGROUND BLOBS COMPONENT ---
function Background() {
  return (
    <>
      <div className="bg-blob bg-blob--1"></div>
      <div className="bg-blob bg-blob--2"></div>
    </>
  );
}

// --- SIGNUP PAGE ---
function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [disabled, setDisabled] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const res = await response.json();
      if (!response.ok) throw new Error(res.error || 'Signup failed');

      setMessage({ text: res.message || 'Account created successfully!', type: 'success' });
      setDisabled(true);
      setTimeout(() => navigate('/login'), 800);
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    }
  };

  return (
    <div className="auth-container">
      <Background />
      <div className="auth-card">
        <div className="auth-logo">📄</div>
        <h1 className="auth-heading">Create Account</h1>
        <p className="auth-subheading">Join Doc Pilot to analyze your documents with AI</p>

        {message.text && (
          <div className={`auth-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSignup} className="auth-form">
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com" 
              required 
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters" 
              required 
            />
          </div>
          <button type="submit" disabled={disabled} className="submit-btn">
            Sign Up
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
}

// --- LOGIN PAGE ---
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [disabled, setDisabled] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const res = await response.json();
      if (!response.ok) throw new Error(res.error || 'Login failed');

      localStorage.setItem('token', res.token);
      localStorage.setItem('documentAnalyzerUser', JSON.stringify({ id: res.user?.id, email: res.user?.email || email }));

      setMessage({ text: res.message || 'Login successful!', type: 'success' });
      setDisabled(true);

      setTimeout(() => navigate('/home'), 600);
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    }
  };

  return (
    <div className="auth-container">
      <Background />
      <div className="auth-card">
        <div className="auth-logo">🚀</div>
        <h1 className="auth-heading">Welcome Back</h1>
        <p className="auth-subheading">Log in to access your Doc Pilot workspace</p>

        {message.text && (
          <div className={`auth-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com" 
              required 
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password" 
              required 
            />
          </div>
          <button type="submit" disabled={disabled} className="submit-btn">
            Log In
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

// --- HOME PAGE ---
function Home() {
  const navigate = useNavigate();
  if (!localStorage.getItem('token')) return <Navigate to="/login" replace />;
  const user = JSON.parse(localStorage.getItem('documentAnalyzerUser') || 'null');
  
  // Shared state connecting all child components
  const [currentFile, setCurrentFile] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('documentAnalyzerUser');
    navigate('/login');
  };

  return (
    <div className="dashboard-container" style={{ padding: '20px', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2>Doc Pilot Dashboard</h2>
          <p style={{ color: '#aaa', margin: '5px 0 0 0' }}>Logged in as: {user?.email || 'Guest'}</p>
        </div>
        <button onClick={handleLogout} className="submit-btn" style={{ width: 'auto', padding: '10px 20px' }}>
          Logout
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Triggers shared state update */}
          <FileUpload onFileSelect={setCurrentFile} />
          
          {/* Receives the updated file state */}
          <Summarizer file={currentFile} />
        </div>

        <div>
          {/* Pass file to QuestionAnswer too if it needs it */}
          <QuestionAnswer file={currentFile} />
        </div>
      </div>
    </div>
  );
}


// --- MAIN ROUTER ---
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </Router>
  );
}
