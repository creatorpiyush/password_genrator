import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Express Backend API (Render Zero-Knowledge Sync & Auth)', () => {
  it('GET /api/v1/health should return ok status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.engine).toContain('SentinelVault');
  });

  it('POST /api/v1/auth/register should register user with zero-knowledge keys', async () => {
    const testEmail = `test_${Date.now()}@sentinel.io`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        username: 'testuser',
        salt: 'a1b2c3d4e5f67890',
        authKeyHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.salt).toBe('a1b2c3d4e5f67890');
  });

  it('POST /api/v1/auth/login should authenticate with valid authKeyHash', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@sentinel.io',
        authKeyHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/v1/auth/login should reject invalid authKeyHash', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@sentinel.io',
        authKeyHash: 'wrong_invalid_hash',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid authentication key or email');
  });

  it('POST /api/v1/vault/sync and GET /api/v1/vault/pull should store and return encrypted blobs', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@sentinel.io',
        authKeyHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });

    const token = loginRes.body.token;

    const encryptedItems = [
      {
        id: 'item_1',
        applicationName: 'GitHub',
        applicationUsername: 'user@github.com',
        encryptedPassword: { iv: '1234', ciphertext: 'abcd' },
        category: 'web',
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    const syncRes = await request(app)
      .post('/api/v1/vault/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'test@sentinel.io',
        encryptedItems,
      });

    expect(syncRes.status).toBe(200);
    expect(syncRes.body.count).toBe(1);

    const pullRes = await request(app)
      .get('/api/v1/vault/pull?email=test@sentinel.io')
      .set('Authorization', `Bearer ${token}`);

    expect(pullRes.status).toBe(200);
    expect(pullRes.body.items).toHaveLength(1);
    expect(pullRes.body.items[0].applicationName).toBe('GitHub');
  });
});
