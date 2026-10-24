import assert from 'node:assert/strict';
import test from 'node:test';
import { isPublicLeaderboardEntry } from '../src/services/publicLeaderboard';

test('public ranking includes real users and excludes bots and generated filler', () => {
  assert.equal(isPublicLeaderboardEntry({ userId: 'student-1' }), true);
  assert.equal(isPublicLeaderboardEntry({ userId: 42 }), true);
  assert.equal(isPublicLeaderboardEntry({ userId: 'gen_lb_0', isGenerated: true }), false);
  assert.equal(isPublicLeaderboardEntry({ userId: 'gen_lb_0' }), false);
  assert.equal(isPublicLeaderboardEntry({ userId: 'gen_0' }), false);
  assert.equal(isPublicLeaderboardEntry({ userId: 10042 }), false);
  assert.equal(isPublicLeaderboardEntry({ userId: '10042' }), false);
  assert.equal(isPublicLeaderboardEntry({ userId: '' }), false);
  assert.equal(isPublicLeaderboardEntry({ userId: 'bot-1', isBot: true }), false);
});
