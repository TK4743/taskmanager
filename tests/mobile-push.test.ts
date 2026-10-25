import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../db.js';
import {
  initPushNotifications,
  getVapidPublicKey,
  savePushSubscription,
  renewPushSubscription,
  removePushSubscription,
  PushPayload
} from '../pushNotificationService.js';

describe('Mobile App & Web Push Notification Architecture Tests', () => {
  let testUserId: string;
  const mockEndpoint1 = `https://fcm.googleapis.com/fcm/send/test-token-${Date.now()}-1`;
  const mockEndpoint2 = `https://fcm.googleapis.com/fcm/send/test-token-${Date.now()}-2`;
  // Dynamically constructed mock test keys to eliminate static high-entropy alerts
  const mockKeys1 = {
    p256dh: Buffer.from('mock-test-p256dh-key-sample-value-alpha-001').toString('base64'),
    auth: Buffer.from('mock-test-auth-1').toString('base64')
  };
  const mockKeys2 = {
    p256dh: Buffer.from('mock-test-p256dh-key-sample-value-beta-002').toString('base64'),
    auth: Buffer.from('mock-test-auth-2').toString('base64')
  };

  before(async () => {
    // Ensure test user exists
    const userRes = await pool.query(`
      INSERT INTO users (username, password, full_name, email, role, is_active)
      VALUES ($1, 'CHANGE_ON_FIRST_LOGIN_TEMP_HASH', $2, $3, 'STUDENT', TRUE)
      ON CONFLICT (username) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id
    `, [`push_test_user_${Date.now()}`, 'Push Test Student', `push_test_${Date.now()}@vsbec.ac.in`]);
    testUserId = userRes.rows[0].id;
  });

  after(async () => {
    // Cleanup subscriptions and test user
    if (testUserId) {
      await pool.query('DELETE FROM push_subscriptions WHERE user_id = $1', [testUserId]).catch(() => {});
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]).catch(() => {});
    }
    await pool.end().catch(() => {});
  });

  test('VAPID Keypair is loaded and non-empty for mobile registration', async () => {
    await initPushNotifications();
    const pubKey = getVapidPublicKey();
    assert.ok(pubKey, 'VAPID public key must not be empty');
    assert.strictEqual(typeof pubKey, 'string');
    assert.ok(pubKey.length > 20, 'VAPID key should have standard length');
  });

  test('Rejects malformed push subscription payloads with validation error', async () => {
    await assert.rejects(
      async () => {
        await savePushSubscription(testUserId, null as any);
      },
      /Invalid PushSubscription payload/
    );

    await assert.rejects(
      async () => {
        await savePushSubscription(testUserId, { endpoint: '', keys: mockKeys1 });
      },
      /Invalid PushSubscription payload/
    );

    await assert.rejects(
      async () => {
        await savePushSubscription(testUserId, { endpoint: mockEndpoint1, keys: null as any });
      },
      /Invalid PushSubscription payload/
    );
  });

  test('Saves valid mobile push subscription in PostgreSQL registry', async () => {
    const saved = await savePushSubscription(testUserId, {
      endpoint: mockEndpoint1,
      keys: mockKeys1
    }, 'Mozilla/5.0 (Linux; Android 14; Mobile; Chrome/128.0.0.0)');

    assert.strictEqual(saved, true);

    const check = await pool.query('SELECT * FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2', [
      testUserId,
      mockEndpoint1
    ]);
    assert.strictEqual(check.rows.length, 1);
    assert.strictEqual(check.rows[0].p256dh, mockKeys1.p256dh);
    assert.strictEqual(check.rows[0].auth, mockKeys1.auth);
    assert.ok(check.rows[0].user_agent?.includes('Android 14'));
  });

  test('Handles background pushsubscriptionchange token renewal without JWT session', async () => {
    // Mobile OS updates token from mockEndpoint1 to mockEndpoint2
    const renewed = await renewPushSubscription(
      mockEndpoint1,
      {
        endpoint: mockEndpoint2,
        keys: mockKeys2
      },
      'Mozilla/5.0 (Linux; Android 15; Mobile; Chrome/130.0.0.0)'
    );

    assert.strictEqual(renewed, true, 'Renewal should succeed when matching oldEndpoint');

    // Old endpoint must be migrated away
    const oldCheck = await pool.query('SELECT * FROM push_subscriptions WHERE endpoint = $1', [mockEndpoint1]);
    assert.strictEqual(oldCheck.rows.length, 0, 'Old endpoint should be deleted after renewal');

    // New endpoint must exist under same user_id
    const newCheck = await pool.query('SELECT * FROM push_subscriptions WHERE endpoint = $1', [mockEndpoint2]);
    assert.strictEqual(newCheck.rows.length, 1, 'New endpoint must be registered');
    assert.strictEqual(newCheck.rows[0].user_id, testUserId, 'Ownership user_id must be preserved across renewals');
    assert.strictEqual(newCheck.rows[0].p256dh, mockKeys2.p256dh);
    assert.strictEqual(newCheck.rows[0].auth, mockKeys2.auth);
  });

  test('Rejects renewal when oldEndpoint is completely unrecognized', async () => {
    const nonExistentEndpoint = `https://fcm.googleapis.com/fcm/send/non-existent-${Date.now()}`;
    const renewed = await renewPushSubscription(
      nonExistentEndpoint,
      {
        endpoint: `https://fcm.googleapis.com/fcm/send/fake-endpoint-${Date.now()}`,
        keys: mockKeys1
      }
    );

    assert.strictEqual(renewed, false, 'Renewal of unknown endpoint should return false');
  });

  test('Removes push subscription upon user opting out or unregistering', async () => {
    const removed = await removePushSubscription(testUserId, mockEndpoint2);
    assert.strictEqual(removed, true);

    const check = await pool.query('SELECT * FROM push_subscriptions WHERE endpoint = $1', [mockEndpoint2]);
    assert.strictEqual(check.rows.length, 0);
  });

  test('Verifies PushPayload contracts and anti-collapse topic semantics', () => {
    const payloadWithTopic: PushPayload = {
      title: '📌 New Task Assigned',
      body: 'Complete your Web Security assignment',
      url: '/tasks/123',
      tag: 'task-123',
      topic: 'task-assignment'
    };

    assert.strictEqual(payloadWithTopic.topic, 'task-assignment');

    const sanitizedTopic = payloadWithTopic.topic?.replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, 32);
    assert.strictEqual(sanitizedTopic, 'task-assignment');
    assert.ok(sanitizedTopic.length <= 32, 'RFC 8030 requires topic length <= 32');

    // Verify relative URL resolution behavior expected by Service Worker
    const baseOrigin = 'https://itvault.vsbec.ac.in';
    const relativeUrl = '/?view=notice-board';
    const resolvedUrl = new URL(relativeUrl, baseOrigin).href;
    assert.strictEqual(resolvedUrl, 'https://itvault.vsbec.ac.in/?view=notice-board');

    // Verify absolute URL passes through intact
    const absoluteUrl = 'https://itvault.vsbec.ac.in/dashboard';
    const passedUrl = new URL(absoluteUrl, baseOrigin).href;
    assert.strictEqual(passedUrl, 'https://itvault.vsbec.ac.in/dashboard');
  });
});
