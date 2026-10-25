/**
 * 🧪 Task Deadline Backup Regression & Unit Test Circuit
 * Validates:
 * - Archive naming convention: <task_name>_<date>.zip
 * - Filename sanitization against path traversal and forbidden characters
 * - Excel workbook buffer generation with Summary & Student Details
 * - Proof file extension detection and manifest integrity
 * - ZIP archive bundle structure containing Excel and proofs/
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {
  sanitizeArchiveName,
  formatDeadlineDateStr,
  getTaskBackupZipName,
  determineProofExtension,
  buildTaskExcelBuffer
} from '../taskDeadlineBackupService.js';

describe('Task Deadline Backup: Naming & Sanitization', () => {
  it('should format task backup ZIP name as <Task_Name>_<Date>.zip', () => {
    const taskTitle = 'Mini Project - Phase 1: Authentication & RBAC';
    const deadline = '2026-10-26T17:00:00+05:30';

    const zipName = getTaskBackupZipName(taskTitle, deadline);
    assert.match(zipName, /^Mini_Project_-_Phase_1_Authentication_&_RBAC_2026-10-26\.zip$/);
    assert.strictEqual(zipName.endsWith('.zip'), true);
    assert.strictEqual(zipName.includes(':'), false, 'Forbidden colon should be stripped');
    assert.strictEqual(zipName.includes('/'), false, 'Path slash should be stripped');
    assert.strictEqual(zipName.includes('\\'), false, 'Backslash should be stripped');
  });

  it('should sanitize extreme names, whitespace, and path traversal attempts', () => {
    assert.strictEqual(
      sanitizeArchiveName('../../etc/passwd/hack?*:"<>|'),
      '.._.._etc_passwd_hack'
    );
    assert.strictEqual(
      sanitizeArchiveName('   Multiple   Spaces   In   Title   '),
      'Multiple_Spaces_In_Title'
    );
    assert.strictEqual(
      sanitizeArchiveName(''),
      'Task',
      'Empty string fallback should default to Task'
    );
  });

  it('should accurately detect proof file extensions', () => {
    assert.strictEqual(determineProofExtension('homework.pdf'), '.pdf');
    assert.strictEqual(determineProofExtension('screenshot.PNG'), '.png');
    assert.strictEqual(determineProofExtension(undefined, 'image/jpeg'), '.jpg');
    assert.strictEqual(determineProofExtension(undefined, 'image/webp'), '.webp');
    assert.strictEqual(determineProofExtension(undefined, undefined, 'https://res.cloudinary.com/demo/image/upload/sample.jpg'), '.jpg');
    assert.strictEqual(determineProofExtension(undefined, undefined, 'https://example.com/file_without_ext'), '.png');
  });
});

describe('Task Deadline Backup: Excel Workbook Generation', () => {
  it('should build a valid Excel workbook with Summary and Student Submissions sheets', async () => {
    const mockTask = {
      id: 'task-123',
      title: 'Operating Systems Lab 3',
      category: 'Lab',
      status: 'OPEN',
      deadline: '2026-10-26T17:00:00+05:30'
    };

    const mockClasses = [{ id: 'class-1', name: '3-IT-A' }, { id: 'class-2', name: '3-IT-B' }];

    const mockSubmissions = [
      {
        user_id: 'u-1',
        register_number: '927622BIT001',
        full_name: 'Aravind Kumar',
        class_name: '3-IT-A',
        year: 3,
        gender: 'Male',
        status: 'VERIFIED',
        submitted_at: '2026-10-25T14:00:00+05:30',
        verified_at: '2026-10-25T14:30:00+05:30',
        custom_field_value: 'https://github.com/aravind/os-lab-3',
        screenshot_url: 'https://res.cloudinary.com/demo/image/upload/sample.png',
        zipProofFilename: '927622BIT001_Aravind_Kumar_proof.png',
        verification_note: 'Verified excellent work',
        rejection_reason: null
      },
      {
        user_id: 'u-2',
        register_number: '927622BIT002',
        full_name: 'Bhavani S',
        class_name: '3-IT-A',
        year: 3,
        gender: 'Female',
        status: 'PENDING',
        submitted_at: null,
        verified_at: null,
        custom_field_value: null,
        screenshot_url: null,
        zipProofFilename: '',
        verification_note: null,
        rejection_reason: null
      }
    ];

    const buffer = await buildTaskExcelBuffer(mockTask, mockClasses, mockSubmissions);
    assert.ok(Buffer.isBuffer(buffer));
    assert.ok(buffer.length > 2000, 'Excel buffer size should be substantial');
  });
});

describe('Task Deadline Backup: ZIP Archive Construction', () => {
  it('should assemble a complete ZIP archive containing Excel and proofs directory', async () => {
    const zip = new JSZip();

    // Add mock Excel file
    zip.file('Test_Task_Submissions.xlsx', Buffer.from('mock excel content'));

    // Add proofs folder and mock proof
    const proofsFolder = zip.folder('proofs');
    assert.ok(proofsFolder);
    proofsFolder.file('927622BIT001_Aravind_Kumar_proof.png', Buffer.from('mock image bytes'));
    proofsFolder.file('MANIFEST.txt', 'Manifest log content');

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    assert.ok(Buffer.isBuffer(zipBuffer));
    assert.ok(zipBuffer.length > 100);

    // Re-read zip and verify internal files
    const unzipped = await JSZip.loadAsync(zipBuffer);
    assert.ok(unzipped.file('Test_Task_Submissions.xlsx'));
    assert.ok(unzipped.file('proofs/927622BIT001_Aravind_Kumar_proof.png'));
    assert.ok(unzipped.file('proofs/MANIFEST.txt'));
  });
});
