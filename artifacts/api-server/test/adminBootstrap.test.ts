import assert from 'node:assert/strict';
import test from 'node:test';
import { adminBootstrapReason, matchesAdminBootstrapToken } from '../src/services/adminBootstrap';

const ready = {
  nodeEnv: 'development',
  replId: 'replit-preview',
  hasMongoUri: true,
  bootstrapToken: 'a'.repeat(48),
  hasAdmin: false,
};

test('first-admin setup is available only in a configured Replit development preview', () => {
  assert.equal(adminBootstrapReason(ready), 'available');
  assert.equal(adminBootstrapReason({ ...ready, nodeEnv: 'production' }), 'production_disabled');
  assert.equal(adminBootstrapReason({ ...ready, replId: undefined }), 'preview_only');
  assert.equal(adminBootstrapReason({ ...ready, hasMongoUri: false }), 'database_unavailable');
  assert.equal(adminBootstrapReason({ ...ready, bootstrapToken: 'too-short' }), 'bootstrap_secret_missing');
  assert.equal(adminBootstrapReason({ ...ready, hasAdmin: true }), 'already_configured');
});

test('bootstrap token comparison accepts only the exact configured secret', () => {
  const token = 'secure-bootstrap-token-'.repeat(2);
  assert.equal(matchesAdminBootstrapToken(token, token), true);
  assert.equal(matchesAdminBootstrapToken(token, `${token}x`), false);
  assert.equal(matchesAdminBootstrapToken(token, token.slice(1)), false);
  assert.equal(matchesAdminBootstrapToken(undefined, token), false);
  assert.equal(matchesAdminBootstrapToken('short', 'short'), false);
});
