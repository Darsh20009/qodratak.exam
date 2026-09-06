import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseBoundedText,
  parseObjectIdString,
  parsePushSubscription,
} from '../src/notificationValidation.ts';

test('accepts valid scalar notification inputs', () => {
  assert.equal(parseObjectIdString('507f1f77bcf86cd799439011'), '507f1f77bcf86cd799439011');
  assert.equal(parseBoundedText('تنبيه صحيح', 200), 'تنبيه صحيح');
  assert.deepEqual(
    parsePushSubscription({
      endpoint: 'https://push.example/subscription',
      keys: { p256dh: 'public-key', auth: 'auth-key' },
    }),
    {
      endpoint: 'https://push.example/subscription',
      keys: { p256dh: 'public-key', auth: 'auth-key' },
    },
  );
});

test('rejects MongoDB operators and nested objects where strings are required', () => {
  for (const unsafe of [
    { $ne: null },
    { $gt: '' },
    { nested: { $ne: null } },
    ['$ne'],
  ]) {
    assert.equal(parseObjectIdString(unsafe), null);
    assert.equal(parseBoundedText(unsafe, 200), null);
  }
});

test('rejects operator objects in push subscription query fields', () => {
  assert.equal(
    parsePushSubscription({
      endpoint: { $ne: null },
      keys: { p256dh: 'public-key', auth: 'auth-key' },
    }),
    null,
  );
  assert.equal(
    parsePushSubscription({
      endpoint: 'https://push.example/subscription',
      keys: { p256dh: { $gt: '' }, auth: 'auth-key' },
    }),
    null,
  );
});

test('copies only allowlisted push subscription fields', () => {
  const parsed = parsePushSubscription({
    endpoint: 'https://push.example/subscription',
    keys: {
      p256dh: 'public-key',
      auth: 'auth-key',
      $ne: 'discarded',
      nested: { $gt: '' },
    },
    $where: 'malicious',
  });

  assert.deepEqual(parsed, {
    endpoint: 'https://push.example/subscription',
    keys: { p256dh: 'public-key', auth: 'auth-key' },
  });
});