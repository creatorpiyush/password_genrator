import express from 'express';
import crypto from 'crypto';
import { ShareRepository } from '../models/Share.js';

const router = express.Router();

/**
 * POST /api/v1/share/create
 * Creates a zero-knowledge self-destructing secret share payload
 */
router.post('/create', async (req, res) => {
  try {
    const { ciphertext, iv, maxViews = 1, expireHours = 24 } = req.body;
    if (!ciphertext || !iv) {
      return res.status(400).json({ error: 'Missing ciphertext or iv in request body' });
    }

    const shareId = crypto.randomBytes(12).toString('hex');
    const record = await ShareRepository.createShare(shareId, { iv, ciphertext }, maxViews, expireHours);

    return res.json({
      success: true,
      shareId,
      expiresAt: record.expiresAt,
      maxViews,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create share link' });
  }
});

/**
 * GET /api/v1/share/:shareId
 * Fetches encrypted payload and auto-destructs if max views reached
 */
router.get('/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    const result = await ShareRepository.getAndConsumeShare(shareId);

    if (!result) {
      return res.status(404).json({
        error: 'Share link has expired or reached maximum allowed view count.',
        expired: true,
      });
    }

    return res.json({
      success: true,
      encryptedPayload: result.encryptedPayload,
      viewsLeft: result.viewsLeft,
      expiresAt: result.expiresAt,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve shared secret' });
  }
});

export default router;
