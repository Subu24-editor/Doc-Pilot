const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const Document = require('../models/Document');

const router = express.Router();

// GET /api/documents
router.get('/', authenticate, async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user._id })
      .select('-extractedText')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ documents });
  } catch (error) {
    console.error('Document history error:', error);
    res.status(500).json({ error: 'Failed to load document history.' });
  }
});

// GET /api/documents/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).select('-extractedText');

    if (!document) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    res.json({ document });
  } catch (error) {
    console.error('Document lookup error:', error);
    res.status(400).json({ error: 'Invalid document ID.' });
  }
});

module.exports = router;
