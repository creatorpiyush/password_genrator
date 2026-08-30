import express from 'express';

const router = express.Router();

/**
 * GET /api/v1/breach/check-prefix/:prefix
 * Express proxy route relaying 5-char SHA-1 prefix to HaveIBeenPwned API
 * Resolves CORS issues when querying HIBP from browser clients.
 */
router.get('/check-prefix/:prefix', async (req, res) => {
  try {
    const { prefix } = req.params;
    if (!prefix || prefix.length !== 5 || !/^[0-9A-Fa-f]{5}$/.test(prefix)) {
      return res.status(400).json({ error: 'Invalid 5-character SHA-1 prefix' });
    }

    const hibpRes = await fetch(`https://api.pwnedpasswords.com/range/${prefix.toUpperCase()}`, {
      headers: {
        'User-Agent': 'SentinelVault-Security-Scanner',
        'Add-Padding': 'true',
      },
    });

    if (!hibpRes.ok) {
      return res.status(hibpRes.status).json({ error: 'HIBP API Service Unavailable' });
    }

    const rangeData = await hibpRes.text();
    return res.json({ success: true, prefix: prefix.toUpperCase(), rangeData });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to query breach database' });
  }
});

export default router;
