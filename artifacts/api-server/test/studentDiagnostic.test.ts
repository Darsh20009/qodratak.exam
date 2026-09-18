import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDiagnosticDecision,
  type DiagnosticAttemptRecord,
  type DiagnosticMasteryRecord,
} from '../src/services/studentDiagnosticService.ts';

const NOW = new Date('2026-09-18T12:00:00.000Z');
const verbal = 'subject.qudrat.verbal';
const quantitative = 'subject.qudrat.quantitative';

function attempts(
  subjectId: string | undefined,
  count: number,
  createdAt: Date | string = NOW,
): DiagnosticAttemptRecord[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${subjectId || 'program'}-${index}`,
    programId: 'program.qudrat',
    subjectId,
    isAnswered: true,
    createdAt,
  }));
}

function mastery(
  taxonomyNodeId: string,
  confidence: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM',
  lastAttemptAt: Date | string = NOW,
): DiagnosticMasteryRecord {
  return {
    taxonomyNodeId,
    programId: 'program.qudrat',
    subjectId: taxonomyNodeId,
    confidence,
    evidenceCount: 6,
    lastAttemptAt,
    lastEvidenceAt: lastAttemptAt,
  };
}

test('brand-new student receives FULL diagnostic without question selection', () => {
  const result = buildDiagnosticDecision('student-a', {
    attempts: [],
    requestedProgramId: 'program.qudrat',
    now: NOW,
  });
  assert.equal(result.diagnosticState, 'NEW');
  assert.equal(result.dataConfidence, 'LOW');
  assert.equal(result.diagnosticRequired, true);
  assert.equal(result.diagnosticMode, 'FULL');
  assert.deepEqual(result.reasonCodes, ['NO_LEARNING_DATA']);
  assert.deepEqual(result.scopes.map((scope) => scope.taxonomyNodeId), ['program.qudrat']);
});

test('some data without enough evidence receives a targeted scope', () => {
  const result = buildDiagnosticDecision('student-a', {
    attempts: attempts(verbal, 1),
    requestedProgramId: 'program.qudrat',
    now: NOW,
  });
  assert.equal(result.diagnosticState, 'INSUFFICIENT_DATA');
  assert.equal(result.diagnosticMode, 'TARGETED');
  assert.equal(result.diagnosticRequired, true);
  assert.ok(result.reasonCodes.includes('INSUFFICIENT_EVIDENCE'));
  assert.ok(result.reasonCodes.includes('LOW_TAXONOMY_COVERAGE'));
  assert.deepEqual(result.scopes.map((scope) => scope.taxonomyNodeId).sort(), [
    verbal,
    quantitative,
  ].sort());
});

test('active status requires recent evidence, trusted mastery, and complete approved subject coverage', () => {
  const result = buildDiagnosticDecision('student-a', {
    attempts: [
      ...attempts(verbal, 6),
      ...attempts(quantitative, 6),
    ],
    mastery: [
      mastery(verbal, 'MEDIUM'),
      mastery(quantitative, 'MEDIUM'),
    ],
    requestedProgramId: 'program.qudrat',
    now: NOW,
  });
  assert.equal(result.diagnosticState, 'ACTIVE');
  assert.equal(result.diagnosticMode, 'NONE');
  assert.equal(result.diagnosticRequired, false);
  assert.deepEqual(result.reasonCodes, ['SUFFICIENT_RECENT_DATA']);
  assert.equal(result.scopes.length, 0);
  assert.equal(result.dataConfidence, 'HIGH');
});

test('a student with one well-covered subject gets a targeted scope for the missing subject', () => {
  const result = buildDiagnosticDecision('student-a', {
    attempts: attempts(quantitative, 6),
    mastery: [mastery(quantitative, 'MEDIUM')],
    requestedProgramId: 'program.qudrat',
    now: NOW,
  });
  assert.equal(result.diagnosticState, 'INSUFFICIENT_DATA');
  assert.equal(result.diagnosticMode, 'TARGETED');
  assert.deepEqual(result.scopes.map((scope) => scope.taxonomyNodeId), [verbal]);
  assert.ok(result.reasonCodes.includes('LOW_TAXONOMY_COVERAGE'));
});

test('stale evidence produces RECOVERY without resetting mastery history', () => {
  const old = new Date('2026-07-01T12:00:00.000Z');
  const result = buildDiagnosticDecision('student-a', {
    attempts: [
      ...attempts(verbal, 6, old),
      ...attempts(quantitative, 6, old),
    ],
    mastery: [
      mastery(verbal, 'HIGH', old),
      mastery(quantitative, 'HIGH', old),
    ],
    requestedProgramId: 'program.qudrat',
    now: NOW,
  });
  assert.equal(result.diagnosticState, 'RETURNING');
  assert.equal(result.diagnosticMode, 'RECOVERY');
  assert.equal(result.diagnosticRequired, true);
  assert.ok(result.reasonCodes.includes('RETURNED_AFTER_GAP'));
  assert.ok(result.reasonCodes.includes('STALE_EVIDENCE'));
  assert.ok(result.scopes.every((scope) => scope.reasonCodes.includes('STALE_EVIDENCE')));
  assert.equal(result.signals.masteryConfidence, 'HIGH');
});

test('legacy diagnostic/profile data is not treated as no data or erased', () => {
  const result = buildDiagnosticDecision('student-a', {
    attempts: [],
    legacyProfiles: [{
      program: 'qudrat',
      status: 'diagnostic_completed',
      lastDiagnosticAt: NOW,
    }],
    requestedProgramId: 'program.qudrat',
    now: NOW,
  });
  assert.equal(result.diagnosticState, 'INSUFFICIENT_DATA');
  assert.notEqual(result.diagnosticState, 'NEW');
  assert.equal(result.signals.legacyDiagnosticPresent, true);
  assert.equal(result.diagnosticMode, 'TARGETED');
});

test('legacy test history contributes activity but not trusted per-question evidence', () => {
  const result = buildDiagnosticDecision('student-a', {
    attempts: [],
    legacyTests: [{ program: 'qudrat', completedAt: NOW }],
    requestedProgramId: 'program.qudrat',
    now: NOW,
  });
  assert.equal(result.diagnosticState, 'INSUFFICIENT_DATA');
  assert.equal(result.signals.answeredEvidenceCount, 0);
  assert.ok(result.reasonCodes.includes('INSUFFICIENT_EVIDENCE'));
});

test('unapproved deep taxonomy never becomes a diagnostic scope', () => {
  const result = buildDiagnosticDecision('student-a', {
    attempts: [{
      id: 'deep',
      programId: 'program.qudrat',
      subjectId: 'concept.qudrat.verbal.foo',
      isAnswered: true,
      createdAt: NOW,
    }],
    requestedProgramId: 'program.qudrat',
    now: NOW,
  });
  assert.equal(result.signals.approvedTaxonomyCoverage, 0);
  assert.equal(result.scopes.some((scope) => scope.type === 'TAXONOMY_NODE'), false);
});

test('invalid program and missing student are rejected', () => {
  assert.throws(
    () => buildDiagnosticDecision('student-a', { attempts: [], requestedProgramId: 'program.invalid' }),
    { code: 'INVALID_PROGRAM' },
  );
  assert.throws(
    () => buildDiagnosticDecision('', { attempts: [] }),
    { code: 'INVALID_STUDENT' },
  );
});

test('the output is deterministic for the same reference time and evidence', () => {
  const input = {
    attempts: [
      ...attempts(verbal, 2),
      ...attempts(quantitative, 1),
    ],
    mastery: [mastery(verbal, 'LOW')],
    requestedProgramId: 'program.qudrat',
    now: NOW,
  };
  const first = buildDiagnosticDecision('student-a', input);
  const second = buildDiagnosticDecision('student-a', input);
  assert.deepEqual(first, second);
});

test('duplicate attempt IDs do not inflate diagnostic evidence', () => {
  const duplicate = attempts(verbal, 1)[0];
  const result = buildDiagnosticDecision('student-a', {
    attempts: [duplicate, duplicate],
    requestedProgramId: 'program.qudrat',
    now: NOW,
  });
  assert.equal(result.signals.answeredEvidenceCount, 1);
});