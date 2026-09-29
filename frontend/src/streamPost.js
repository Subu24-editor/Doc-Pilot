// Shared helper: POST a file to a streaming (SSE) endpoint and surface
// real error messages instead of silent failures.
export const MAX_FILE_BYTES = 4 * 1024 * 1024; // Vercel body limit is ~4.5 MB

export async function streamPost(url, formData, onChunk) {
  const token = localStorage.getItem('token');
  if (!token) {
    const err = new Error('You are not logged in. Please log in again.');
    err.status = 401;
    throw err;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    let message = '';
    if (response.status === 413) {
      message = 'File is too large. Maximum size is 4 MB.';
    } else {
      try {
        message = (await response.json()).error;
      } catch (_) {
        // response was not JSON (e.g. a platform error page)
      }
    }
    const err = new Error(message || `Server error (${response.status})`);
    err.status = response.status;
    throw err;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const handleLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return;
    let parsed;
    try {
      parsed = JSON.parse(trimmed.replace(/^data:\s*/, ''));
    } catch (_) {
      return; // partial line
    }
    if (parsed.error) throw new Error(parsed.error);
    if (parsed.chunk) onChunk(parsed.chunk);
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    lines.forEach(handleLine);
  }
  if (buffer) handleLine(buffer);
}

export function handleAuthError(err) {
  if (err && err.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('documentAnalyzerUser');
    setTimeout(() => window.location.assign('/login'), 1500);
  }
}
