/**
 * Token Bucket Rate Limiter Middleware
 * Protects auth and sync endpoints against brute-force attacks
 */

export const createTokenBucketLimiter = (maxTokens = 10, refillRatePerSec = 1) => {
  const buckets = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const now = Date.now();

    let bucket = buckets.get(ip);
    if (!bucket) {
      bucket = { tokens: maxTokens, lastRefill: now };
      buckets.set(ip, bucket);
    } else {
      const elapsedSec = (now - bucket.lastRefill) / 1000;
      bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsedSec * refillRatePerSec);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      next();
    } else {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Token bucket depleted. Please try again shortly.',
      });
    }
  };
};
