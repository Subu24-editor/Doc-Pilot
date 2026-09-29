const pdfParse = require('pdf-parse-fork');

async function extractDocumentData(fileBuffer, mimeType = 'application/pdf') {
  if (!Buffer.isBuffer(fileBuffer)) {
    throw new TypeError('Document buffer is required.');
  }

  if (mimeType === 'text/plain') {
    return { text: fileBuffer.toString('utf8') };
  }

  try {
    const data = await pdfParse(fileBuffer);
    return { text: data.text || '' };
  } catch (error) {
    console.error('Document processing error:', error);
    throw error;
  }
}

// Kept as a compatibility alias for any existing imports.
const extractPdfData = (fileBuffer) => extractDocumentData(fileBuffer, 'application/pdf');

module.exports = {
  extractDocumentData,
  extractPdfData,
};
