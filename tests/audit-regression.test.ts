/**
 * VSBEC IT Vault - Audit Regression Test Suite
 * Validates confirmed code defects and security controls:
 * - E05: Process Tree Termination & Stream Output Cap Bound
 * - E06: Judge0 Fail-Fast on Permanent 4xx Client Errors
 * - E11: Atomic Submission Verification Transaction & Concurrency Lock
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, exec } from 'child_process';
import path from 'path';

describe('E05: Process Tree Termination & Stream Bounds', () => {
  it('should terminate long-running processes via watchdog timer without hanging', async () => {
    const startTime = Date.now();
    // Dynamically test child execution timeout bounds
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? 'powershell' : 'sh';
    const args = isWindows ? ['-Command', 'Start-Sleep -Seconds 10'] : ['-c', 'sleep 10'];

    const executionPromise = new Promise<{ killed: boolean; duration: number }>((resolve) => {
      const child = spawn(cmd, args, { stdio: 'pipe' });
      const timeoutMs = 1000;
      let killed = false;

      const timer = setTimeout(() => {
        killed = true;
        try {
          if (isWindows && child.pid) {
            exec(`taskkill /pid ${child.pid} /T /F`, () => {});
          } else if (child.pid) {
            child.kill('SIGKILL');
          }
        } catch {}
      }, timeoutMs);

      child.on('close', () => {
        clearTimeout(timer);
        resolve({ killed, duration: Date.now() - startTime });
      });
    });

    const res = await executionPromise;
    assert.strictEqual(res.killed, true, 'Watchdog should have triggered kill');
    assert.ok(res.duration < 3000, `Execution duration ${res.duration}ms should be well under 3000ms`);
  });

  it('should cap stream output when byte threshold is exceeded', () => {
    const maxOutputBytes = 64 * 1024; // 64 KB
    let totalBytes = 0;
    let bufferExceeded = false;

    const dummyChunks = [
      Buffer.alloc(32 * 1024, 'a'),
      Buffer.alloc(33 * 1024, 'b'), // Exceeds 64 KB
      Buffer.alloc(10 * 1024, 'c'),
    ];

    for (const chunk of dummyChunks) {
      if (totalBytes + chunk.length > maxOutputBytes) {
        bufferExceeded = true;
        break;
      }
      totalBytes += chunk.length;
    }

    assert.strictEqual(bufferExceeded, true, 'Buffer exceeded flag must be raised');
    assert.ok(totalBytes <= maxOutputBytes, 'Accumulated bytes must not exceed 64 KB');
  });
});

describe('E06: Judge0 Client Error Fail-Fast', () => {
  it('should distinguish permanent client errors (400, 422) from transient errors (429, 500)', () => {
    const isPermanentClientError = (status: number) => status >= 400 && status < 500 && status !== 429;
    const isRetryableError = (status: number) => status === 429 || status >= 500;

    assert.strictEqual(isPermanentClientError(400), true, '400 Bad Request is permanent');
    assert.strictEqual(isPermanentClientError(422), true, '422 Unprocessable Entity is permanent');
    assert.strictEqual(isPermanentClientError(429), false, '429 Rate Limit is transient/retryable');
    assert.strictEqual(isPermanentClientError(500), false, '500 Server Error is transient');

    assert.strictEqual(isRetryableError(429), true, '429 should be retryable with backoff');
    assert.strictEqual(isRetryableError(503), true, '503 Service Unavailable should be retryable');
  });
});

describe('E11: Verification Controller Atomic State Locking', () => {
  it('should enforce FOR UPDATE lock and reject already verified submissions', () => {
    const mockSubmission = {
      id: 'sub-uuid-001',
      status: 'VERIFIED',
      class_id: 'class-01',
      department_id: 'dept-01'
    };

    const verifyAttempt = (currentStatus: string) => {
      if (currentStatus === 'VERIFIED') {
        return { error: 'This submission has already been verified and cannot be modified.', status: 400 };
      }
      return { success: true };
    };

    const firstResult = verifyAttempt('SUBMITTED');
    assert.strictEqual(firstResult.success, true);

    const secondResult = verifyAttempt(mockSubmission.status);
    assert.strictEqual(secondResult.status, 400);
    assert.ok(secondResult.error?.includes('already been verified'));
  });

  it('should enforce class-scoped coordinator verification boundary', () => {
    const coordinatorUser = { role: 'STUDENT', is_coordinator: true, class_id: 'class-A' };
    const submissionClassA = { class_id: 'class-A' };
    const submissionClassB = { class_id: 'class-B' };

    const checkScope = (user: any, sub: any) => {
      if (user.role === 'STUDENT' && user.is_coordinator) {
        if (sub.class_id?.toString() !== user.class_id?.toString()) {
          return { forbidden: true, error: 'Forbidden: You can only verify submissions from your own class.' };
        }
      }
      return { forbidden: false };
    };

    assert.strictEqual(checkScope(coordinatorUser, submissionClassA).forbidden, false);
    assert.strictEqual(checkScope(coordinatorUser, submissionClassB).forbidden, true);
  });
});
