const express = require('express');
const crypto = require('crypto');
const handleFileUpload = require('../middleware/uploadMiddleware');
const authenticate = require('../middleware/authMiddleware');
const { extractDocumentData } = require('../utils/documentProcessor');
const { summarizeDocumentStream, askQuestionStream } = require('../services/geminiService');
const Document = require('../models/Document');

const router = express.Router();

const EMPTY_TEXT_MESSAGE =
  'No readable text found in this file. It may be a scanned/image-only PDF.';

function friendlyError(error, fallback) {
  const msg = String((error && error.message) || '').slice(0, 300);
  return msg ? `${fallback} (${msg})` : fallback;
}

function sendStreamError(res, status, message) {
  if (!res.headersSent) return res.status(status).json({ error: message });
  res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
  return res.end();
}

const setupSSE = (res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
};

function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function getOrCreateDocument(userId, file, fileBuffer, text) {
  const sha256 = hashBuffer(fileBuffer);

  let document = await Document.findOne({ user: userId, sha256 });

  if (!document) {
    try {
      document = await Document.create({
        user: userId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        sha256,
        extractedText: text,
      });
    } catch (error) {
      // Two requests for the same file at once -> unique index; reuse the winner.
      if (error.code !== 11000) throw error;
      document = await Document.findOne({ user: userId, sha256 });
    }
  } else if (!document.extractedText && text) {
    document.extractedText = text;
    await document.save();
  }

  return document;
}

router.post(
  '/summarize-stream',
  authenticate,
  handleFileUpload('document'),
  async (req, res) => {
    const fileBuffer = req.file.buffer;
    let document;

    try {
      const pdfData = await extractDocumentData(fileBuffer, req.file.mimetype);
      if (!pdfData.text.trim()) {
        return res.status(422).json({ error: EMPTY_TEXT_MESSAGE });
      }
      document = await getOrCreateDocument(req.user._id, req.file, fileBuffer, pdfData.text);

      setupSSE(res);

      let fullSummary = '';

      await summarizeDocumentStream(pdfData.text, (chunk) => {
        fullSummary += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      });

      document.summary = fullSummary;
      await document.save();

      res.write(
        `data: ${JSON.stringify({ done: true, documentId: document._id })}\n\n`
      );
      res.end();
    } catch (error) {
      console.error('Summarize error:', error);
      sendStreamError(res, 500, friendlyError(error, 'Failed to summarize document.'));
    }
  }
);

router.post(
  '/ask-stream',
  authenticate,
  handleFileUpload('document'),
  async (req, res) => {
    const { question } = req.body;
    const fileBuffer = req.file.buffer;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    try {
      const pdfData = await extractDocumentData(fileBuffer, req.file.mimetype);
      if (!pdfData.text.trim()) {
        return res.status(422).json({ error: EMPTY_TEXT_MESSAGE });
      }
      const document = await getOrCreateDocument(
        req.user._id,
        req.file,
        fileBuffer,
        pdfData.text
      );

      setupSSE(res);

      let fullAnswer = '';

      await askQuestionStream(pdfData.text, question.trim(), (chunk) => {
        fullAnswer += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      });

      document.questions.push({
        question: question.trim(),
        answer: fullAnswer,
      });

      await document.save();

      res.write(
        `data: ${JSON.stringify({ done: true, documentId: document._id })}\n\n`
      );
      res.end();
    } catch (error) {
      console.error('QA error:', error);
      sendStreamError(res, 500, friendlyError(error, 'Failed to answer question.'));
    }
  }
);

module.exports = router;
