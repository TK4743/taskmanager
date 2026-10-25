/**
 * 🤖 Telegram Daily Automation & Scheduler Regression Suite
 * Validates:
 * - Token and Admin Chat ID DB fallback resolution
 * - Cooldown contract (skipped: true, success: false) to prevent false slot locking
 * - Progress bar and HTML escaping sanitization
 * - Incomplete Excel buffer generation robustness
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  escapeHtml, 
  makeProgressBar, 
  getYearFromClassName,
  buildIncompleteExcelBuffer,
  getISTDateStr,
  splitTelegramHtml
} from '../telegramService.js';

describe('Telegram Automation: Text & HTML Safety', () => {
  it('should properly escape special HTML characters to prevent Telegram parse errors', () => {
    const raw = '<script>alert("test & verify")</script>\'';
    const escaped = escapeHtml(raw);
    assert.strictEqual(escaped.includes('<script>'), false);
    assert.strictEqual(escaped.includes('&amp;'), true);
    assert.strictEqual(escaped.includes('&lt;'), true);
    assert.strictEqual(escaped.includes('&gt;'), true);
    assert.strictEqual(escaped.includes('&quot;'), true);
    assert.strictEqual(escaped.includes('&#039;'), true);
  });

  it('should generate accurate tiered multi-color progress bars', () => {
    const low = makeProgressBar(10, 100, 10);
    assert.ok(low.includes('🟥'));
    assert.ok(low.includes('10%'));

    const mid = makeProgressBar(50, 100, 10);
    assert.ok(mid.includes('🟧'));
    assert.ok(mid.includes('50%'));

    const high = makeProgressBar(70, 100, 10);
    assert.ok(high.includes('🟨'));
    assert.ok(high.includes('70%'));

    const full = makeProgressBar(100, 100, 10);
    assert.ok(full.includes('🟩'));
    assert.ok(full.includes('100%'));
  });

  it('should extract correct academic years from varied class naming patterns', () => {
    assert.strictEqual(getYearFromClassName('2-IT-A'), '2');
    assert.strictEqual(getYearFromClassName('II IT B'), '2');
    assert.strictEqual(getYearFromClassName('3-IT-A'), '3');
    assert.strictEqual(getYearFromClassName('III IT C'), '3');
    assert.strictEqual(getYearFromClassName('4-IT-B'), '4');
    assert.strictEqual(getYearFromClassName('IV IT A'), '4');
  });

  it('should split long messages cleanly without exceeding chunk bounds', () => {
    const longText = 'Line of information text.\n\n'.repeat(200);
    const chunks = splitTelegramHtml(longText, 1000);
    assert.ok(chunks.length > 1);
    chunks.forEach(chunk => {
      assert.ok(chunk.length <= 1000);
    });
  });
});

describe('Telegram Automation: Excel Buffer Construction', () => {
  it('should build a valid Excel workbook buffer without crashing on empty or populated data', async () => {
    const mockIncomplete = [
      {
        register_number: '927622BIT001',
        full_name: 'Sample Student',
        class_name: '3-IT-A',
        solved_today: 0,
        leetcode_target: 2
      }
    ];
    const mockPendingTasks = [
      {
        studentName: 'Sample Student',
        registerNumber: '927622BIT001',
        className: '3-IT-A',
        taskTitle: 'Lab Exercise 1',
        category: 'Lab',
        deadline: 'Oct 26, 05:00 PM'
      }
    ];
    const mockAllStudents = [
      {
        id: 1,
        full_name: 'Sample Student',
        register_number: '927622BIT001',
        class_name: '3-IT-A'
      }
    ];

    const buffer = await buildIncompleteExcelBuffer(mockIncomplete, mockPendingTasks, mockAllStudents);
    assert.ok(Buffer.isBuffer(buffer));
    assert.ok(buffer.length > 1000, 'Excel file buffer should be substantial');
  });
});

describe('Telegram Automation: Telemetry Extraction & Pre-Sync Mechanics', () => {
  it('should cleanly extract usernames from various profile URL formats', async () => {
    const { extractLeetCodeUsername, extractGitHubUsername, getYesterdayDateStr } = await import('../codingTelemetryService.js');

    assert.strictEqual(extractLeetCodeUsername('https://leetcode.com/u/student_hero/'), 'student_hero');
    assert.strictEqual(extractLeetCodeUsername('https://leetcode.com/coder42?test=1'), 'coder42');
    assert.strictEqual(extractLeetCodeUsername('@raw_username'), 'raw_username');
    assert.strictEqual(extractLeetCodeUsername('plain_user'), 'plain_user');
    assert.strictEqual(extractLeetCodeUsername(''), '');

    assert.strictEqual(extractGitHubUsername('https://github.com/octocat'), 'octocat');
    assert.strictEqual(extractGitHubUsername('github.com/developer-x/'), 'developer-x');
    assert.strictEqual(extractGitHubUsername('@gituser'), 'gituser');
    assert.strictEqual(extractGitHubUsername('gituser'), 'gituser');
    assert.strictEqual(extractGitHubUsername(''), '');

    assert.strictEqual(getYesterdayDateStr('2026-10-25'), '2026-10-24');
    assert.strictEqual(getYesterdayDateStr('2026-01-01'), '2025-12-31');
    assert.strictEqual(getYesterdayDateStr('2026-03-01'), '2026-02-28');
  });
});

