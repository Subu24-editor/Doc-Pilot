# Doc Pilot - MongoDB Setup

## 1. Install backend packages

From the project root:

```bash
npm install
```

This installs Mongoose, bcryptjs, and jsonwebtoken in addition to the existing backend packages.

## 2. Choose MongoDB

You can use either:

- MongoDB Atlas (cloud), or
- MongoDB Community Server locally.

Put the connection string in `.env` as `MONGODB_URI`.

Example local:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/docpilot
```

Example Atlas:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/docpilot?retryWrites=true&w=majority
```

Also set:

```env
JWT_SECRET=your-long-random-secret
GEMINI_API_KEY=your-gemini-api-key
```

## 3. Collections

The application uses these MongoDB collections:

### users
Stores account information. Passwords are stored as bcrypt hashes, never as plain text.

### documents
Stores:
- owner (`user`)
- original file name
- MIME type and size
- SHA-256 file fingerprint
- extracted document text
- generated summary
- questions and AI answers

The actual uploaded PDF is temporary. The backend deletes it after processing.

## 4. Existing frontend behavior

The existing signup/login pages now create real MongoDB users and return a JWT.

The existing summarize and question-answer endpoints now:
- require the JWT,
- associate data with the logged-in user,
- save summaries,
- save Q&A history,
- reuse the same database document when the same file is uploaded again.

A history API is also available:

```text
GET /api/documents
GET /api/documents/:id
```

Both require:

```text
Authorization: Bearer <token>
```
