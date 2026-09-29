const { GoogleGenerativeAI } = require('@google/generative-ai');

let client;

const PRIMARY_MODEL = () => process.env.MODEL_NAME || 'gemini-3.5-flash';
const FALLBACK_MODEL = () => process.env.FALLBACK_MODEL || 'gemini-3.5-flash-lite';

function getModel(name) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured on the server.');
  if (!client) client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({ model: name });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isBusy = (err) => /\b(503|429|500)\b/.test(String(err && err.message));

async function streamOnce(modelName, prompt, onChunk) {
  const result = await getModel(modelName).generateContentStream(prompt);
  let sent = false;
  try {
    for await (const part of result.stream) {
      const text = part.text();
      if (text) { sent = true; onChunk(text); }
    }
  } catch (err) {
    err.partial = sent; // some text already reached the user
    throw err;
  }
}

async function streamPrompt(prompt, onChunk) {
  // 2 tries on the main model, then 1 on the fallback
  const attempts = [PRIMARY_MODEL(), PRIMARY_MODEL(), FALLBACK_MODEL()];
  let lastError;
  for (let i = 0; i < attempts.length; i++) {
    try {
      return await streamOnce(attempts[i], prompt, onChunk);
    } catch (err) {
      lastError = err;
      // Only retry overload errors, and never after text was already streamed
      if (!isBusy(err) || err.partial) break;
      await sleep(1500 * (i + 1));
    }
  }
  throw lastError;
}

function summarizeDocumentStream(docText, onChunk) {
  return streamPrompt(
    `Please provide a concise, structured summary of the following document content:\n\n${docText}`,
    onChunk
  );
}

function askQuestionStream(docText, question, onChunk) {
  return streamPrompt(
    `Context Document:\n${docText}\n\nQuestion: ${question}\n\nAnswer the question accurately using only the provided context document.`,
    onChunk
  );
}

module.exports = { summarizeDocumentStream, askQuestionStream };