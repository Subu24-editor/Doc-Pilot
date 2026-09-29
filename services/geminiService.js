const { GoogleGenerativeAI } = require('@google/generative-ai');

let client;

// Created lazily so a missing key produces a normal API error instead of
// crashing the whole serverless function at import time.
function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  if (!client) client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({ model: process.env.MODEL_NAME || 'gemini-3.5-flash' });
}

async function streamPrompt(prompt, onChunkReceived) {
  const streamResult = await getModel().generateContentStream(prompt);
  for await (const part of streamResult.stream) {
    const text = part.text();
    if (text) onChunkReceived(text);
  }
}

function summarizeDocumentStream(docText, onChunkReceived) {
  return streamPrompt(
    `Please provide a concise, structured summary of the following document content:\n\n${docText}`,
    onChunkReceived
  );
}

function askQuestionStream(docText, userQuestion, onChunkReceived) {
  return streamPrompt(
    `Context Document:\n${docText}\n\nQuestion: ${userQuestion}\n\nAnswer the question accurately using only the provided context document.`,
    onChunkReceived
  );
}

module.exports = { summarizeDocumentStream, askQuestionStream };
