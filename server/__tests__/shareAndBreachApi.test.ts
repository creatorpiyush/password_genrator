import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Phase 8 Backend APIs: Share & Breach Proxy', () => {
  it('should validate breach proxy 5-char prefix format', async () => {
    const invalidRes = await request(app).get('/api/v1/breach/check-prefix/123');
    expect(invalidRes.status).toBe(400);

    const validRes = await request(app).get('/api/v1/breach/check-prefix/5BAA6');
    expect([200, 500, 502, 503]).toContain(validRes.status);
    if (validRes.status === 200) {
      expect(validRes.body.success).toBe(true);
      expect(validRes.body.prefix).toBe('5BAA6');
    }
  });

  it('should create and consume a self-destructing shared secret link', async () => {
    // 1. Create share link
    const createRes = await request(app)
      .post('/api/v1/share/create')
      .send({
        ciphertext: 'a1b2c3d4e5f6',
        iv: '1234567890abcdef12345678',
        maxViews: 1,
        expireHours: 1,
      });

    expect(createRes.status).toBe(200);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.shareId).toBeDefined();

    const shareId = createRes.body.shareId;

    // 2. Consume share link (1st view -> should succeed)
    const consumeRes1 = await request(app).get(`/api/v1/share/${shareId}`);
    expect(consumeRes1.status).toBe(200);
    expect(consumeRes1.body.encryptedPayload.ciphertext).toBe('a1b2c3d4e5f6');

    // 3. Consume share link (2nd view -> should fail with 404 self-destructed)
    const consumeRes2 = await request(app).get(`/api/v1/share/${shareId}`);
    expect(consumeRes2.status).toBe(404);
    expect(consumeRes2.body.expired).toBe(true);
  });
});
