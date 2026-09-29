const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const uploadRoute = require('./routes/upload');
const authRoute = require('./routes/auth');
const documentsRoute = require('./routes/documents');

const app = express();

const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET', 'GEMINI_API_KEY'];
const missingEnv = () => REQUIRED_ENV.filter((key) => !process.env[key]);

// The React app is served from this same server, so normal requests are
// same-origin. Only allow cross-origin calls from CLIENT_URL (if set).
const extraOrigins = new Set(
  [process.env.CLIENT_URL].filter(Boolean).map((url) => url.replace(/\/$/, ''))
);

app.use((req, res, next) => {
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      try {
        if (new URL(origin).host === host) return callback(null, true);
      } catch (_) {
        // fall through
      }
      // Not allowed: just omit CORS headers (browser blocks it) instead of throwing a 500.
      return callback(null, extraOrigins.has(origin));
    },
    credentials: true,
  })(req, res, next);
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Fail with a clear message if Vercel env vars are missing.
app.use('/api', (req, res, next) => {
  const missing = missingEnv();
  if (missing.length) {
    console.error('Missing environment variables:', missing.join(', '));
    return res.status(500).json({
      error: `Server is missing environment variables: ${missing.join(', ')}. Add them in Vercel -> Settings -> Environment Variables, then redeploy.`,
    });
  }
  next();
});

// Database is needed by all API routes. Reuse the Mongoose connection when warm.
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    res.status(503).json({
      error: 'Database connection failed. Check MONGODB_URI and that MongoDB Atlas Network Access allows 0.0.0.0/0.',
    });
  }
});

app.use('/api', uploadRoute);
app.use('/api/auth', authRoute);
app.use('/api/documents', documentsRoute);

app.get('/health', async (req, res) => {
  const missing = missingEnv();
  if (missing.length) {
    return res.status(500).json({ status: 'error', missingEnv: missing });
  }
  try {
    await connectDB();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'error', error: `Database unavailable: ${error.message}` });
  }
});

// Serve the built React application from the same deployment.
const frontendDist = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendDist, { index: 'index.html' }));

// SPA fallback for React Router. API routes above are never swallowed by this.
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && req.path !== '/health') {
    return res.sendFile(path.join(frontendDist, 'index.html'), (error) => {
      if (error) next(error);
    });
  }
  next();
});

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Doc Pilot server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
