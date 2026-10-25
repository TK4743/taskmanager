/**
 * 📦 Task Deadline Backup Service
 * Automatically captures a comprehensive backup ZIP archive for tasks
 * exactly 5 minutes before their deadline.
 *
 * Strict Class Allocation Rules:
 * - Backs up ONLY the explicitly allocated classes for the task.
 * - Any class that is not allocated is completely excluded.
 * - Rows and proofs are organized strictly by allocated class, then student register number.
 * - Generates separate tabs per allocated class in Excel and subfolders per class in proofs/.
 * - Auto-pushes the backup archive to GitHub.
 *
 * Lifecycle Features:
 * - Atomic DB locks (backed_up_deadline, backup_file_path, backup_taken_at)
 * - Auto-cleanup on task reopen or deadline extension (deletes old zip, cleans up git, resets lock)
 * - Safe filename sanitization
 */

import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import ExcelJS from 'exceljs';
import { pool } from './db.js';
import { tryLocalGitPush, deleteGitHubFileViaAPI } from './githubSyncService.js';

export function sanitizeArchiveName(str: string): string {
  if (!str) return 'Task';
  return str
    .replace(/[/\\]/g, '_')
    .replace(/[<>:"|?*\x00-\x1F]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 80) || 'Task';
}

export function formatDeadlineDateStr(date: Date | string): string {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(d);
}

export function formatISTDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(d);
}

export function getTaskBackupZipName(taskTitle: string, deadline: Date | string): string {
  const cleanTitle = sanitizeArchiveName(taskTitle) || 'Task';
  const dateStr = formatDeadlineDateStr(deadline);
  return `${cleanTitle}_${dateStr}.zip`;
}

/**
 * Downloads a proof file buffer from URL with timeout and retry logic
 */
export async function downloadProofFile(url: string, attempts = 2): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!url || !url.startsWith('http')) return null;

  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'VSBEC-TaskManager-BackupEngine/2.0'
        },
        signal: AbortSignal.timeout(12000)
      });
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const contentType = res.headers.get('content-type') || 'application/octet-stream';
        return { buffer, contentType };
      }
    } catch (err: any) {
      if (i === attempts) {
        console.warn(`[Proof Download] Failed to fetch proof from ${url}:`, err.message);
      } else {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  return null;
}

export function determineProofExtension(originalFilename?: string, contentType?: string, url?: string): string {
  if (originalFilename && path.extname(originalFilename)) {
    return path.extname(originalFilename).toLowerCase();
  }
  if (url) {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const ext = path.extname(cleanUrl);
    if (ext && ext.length <= 5) return ext.toLowerCase();
  }
  if (contentType) {
    if (contentType.includes('image/png')) return '.png';
    if (contentType.includes('image/jpeg')) return '.jpg';
    if (contentType.includes('image/webp')) return '.webp';
    if (contentType.includes('image/gif')) return '.gif';
    if (contentType.includes('application/pdf')) return '.pdf';
    if (contentType.includes('application/zip')) return '.zip';
  }
  return '.png';
}

function populateSubmissionsSheet(sheet: ExcelJS.Worksheet, rows: any[]) {
  sheet.columns = [
    { header: 'S.No', key: 'sno', width: 8 },
    { header: 'Register Number', key: 'regNo', width: 18 },
    { header: 'Student Name', key: 'name', width: 28 },
    { header: 'Class', key: 'className', width: 14 },
    { header: 'Year', key: 'year', width: 10 },
    { header: 'Gender', key: 'gender', width: 12 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Submitted At', key: 'submittedAt', width: 24 },
    { header: 'Verified At', key: 'verifiedAt', width: 24 },
    { header: 'Custom Value / Link', key: 'customValue', width: 35 },
    { header: 'Proof Attached', key: 'proofAttached', width: 16 },
    { header: 'Proof Path in ZIP', key: 'proofFile', width: 45 },
    { header: 'Proof URL', key: 'proofUrl', width: 45 },
    { header: 'Verification Remarks', key: 'remarks', width: 30 },
    { header: 'Rejection Reason', key: 'rejectionReason', width: 30 }
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  rows.forEach((s, idx) => {
    const isRejected = (s.status || '').toUpperCase() === 'REJECTED';
    const hasProof = Boolean(s.screenshot_url) && !isRejected;
    const row = sheet.addRow({
      sno: idx + 1,
      regNo: s.register_number || 'N/A',
      name: s.full_name || 'N/A',
      className: s.class_name || 'N/A',
      year: s.year ? `${s.year} Year` : 'N/A',
      gender: s.gender || 'N/A',
      status: s.status || 'PENDING',
      submittedAt: formatISTDateTime(s.submitted_at),
      verifiedAt: formatISTDateTime(s.verified_at),
      customValue: s.custom_field_value || '',
      proofAttached: hasProof ? 'YES' : (isRejected && s.screenshot_url ? 'NO (REJECTED)' : 'NO'),
      proofFile: s.zipProofFilename || (isRejected && s.screenshot_url ? 'Excluded (Proof Rejected)' : (hasProof ? 'Attached in proofs/' : 'None')),
      proofUrl: isRejected ? '' : (s.screenshot_url || ''),
      remarks: s.verification_note || '',
      rejectionReason: s.rejection_reason || ''
    });

    if (idx % 2 === 1) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }

    const statusCell = row.getCell('status');
    statusCell.alignment = { horizontal: 'center' };
    if (s.status === 'VERIFIED') {
      statusCell.font = { color: { argb: 'FF16A34A' }, bold: true };
    } else if (s.status === 'SUBMITTED') {
      statusCell.font = { color: { argb: 'FF0284C7' }, bold: true };
    } else if (s.status === 'REJECTED') {
      statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
    } else {
      statusCell.font = { color: { argb: 'FF64748B' } };
    }
  });
}

/**
 * Builds the comprehensive Task Submission Excel Workbook
 * Organized strictly by allocated class
 */
export async function buildTaskExcelBuffer(task: any, assignedClasses: any[], submissions: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'VSBEC IT Task Manager';
  workbook.created = new Date();

  // ── Sheet 1: Task Summary ──────────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet('Task Summary', {
    views: [{ showGridLines: true }]
  });

  summarySheet.columns = [
    { header: 'Property', key: 'prop', width: 28 },
    { header: 'Value', key: 'val', width: 50 }
  ];

  const totalAssigned = submissions.length;
  const verifiedCount = submissions.filter(s => s.status === 'VERIFIED').length;
  const submittedCount = submissions.filter(s => s.status === 'SUBMITTED').length;
  const rejectedCount = submissions.filter(s => s.status === 'REJECTED').length;
  const pendingCount = submissions.filter(s => s.status === 'PENDING' || !s.status).length;
  const completionRate = totalAssigned > 0 ? Math.round(((verifiedCount + submittedCount) / totalAssigned) * 100) : 0;

  const summaryData = [
    { prop: 'Task Title', val: task.title },
    { prop: 'Category', val: task.category || 'General' },
    { prop: 'Task Status', val: task.status || 'OPEN' },
    { prop: 'Task Deadline', val: formatISTDateTime(task.deadline) },
    { prop: 'Allocated Classes', val: assignedClasses.map(c => c.name).join(', ') },
    { prop: 'Archive Generated At', val: formatISTDateTime(new Date()) },
    { prop: '', val: '' },
    { prop: 'OVERALL PROGRESS', val: '' },
    { prop: 'Total Allocated Students', val: totalAssigned },
    { prop: 'Verified Submissions', val: verifiedCount },
    { prop: 'Submitted (Pending Review)', val: submittedCount },
    { prop: 'Rejected Submissions', val: rejectedCount },
    { prop: 'Pending (Not Submitted)', val: pendingCount },
    { prop: 'Overall Completion Rate', val: `${completionRate}%` }
  ];

  summaryData.forEach(row => summarySheet.addRow(row));

  // Style Header
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  summarySheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Append Class-by-Class Breakdown Table in Summary
  summarySheet.addRow({ prop: '', val: '' });
  summarySheet.addRow({ prop: 'ALLOCATED CLASS BREAKDOWN', val: '' });
  const classBreakdownHeader = summarySheet.addRow({ prop: 'Class Name', val: 'Students / Submissions / Completion Rate' });
  classBreakdownHeader.font = { bold: true };

  assignedClasses.forEach(cls => {
    const classSubs = submissions.filter(s => s.class_name === cls.name);
    const cTotal = classSubs.length;
    const cDone = classSubs.filter(s => s.status === 'VERIFIED' || s.status === 'SUBMITTED').length;
    const cRate = cTotal > 0 ? Math.round((cDone / cTotal) * 100) : 0;
    summarySheet.addRow({
      prop: cls.name,
      val: `${cDone} / ${cTotal} submitted (${cRate}%)`
    });
  });

  // ── Sheet 2: All Allocated Submissions ─────────────────────────────────────
  const masterSheet = workbook.addWorksheet('All Allocated Submissions', {
    views: [{ showGridLines: true }]
  });
  populateSubmissionsSheet(masterSheet, submissions);

  // ── Sheets 3+: Dedicated Tab Per Allocated Class ────────────────────────────
  assignedClasses.forEach(cls => {
    const classRows = submissions.filter(s => s.class_name === cls.name);
    const cleanSheetTitle = `Class - ${cls.name}`.slice(0, 31);
    const classSheet = workbook.addWorksheet(cleanSheetTitle, {
      views: [{ showGridLines: true }]
    });
    populateSubmissionsSheet(classSheet, classRows);
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generates the complete Task Deadline Backup ZIP
 * Filtered STRICTLY by allocated classes only
 */
export async function generateTaskDeadlineBackup(
  taskId: string, 
  options: { force?: boolean } = {}
): Promise<{
  success: boolean;
  message: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  totalSubmissions?: number;
  totalProofs?: number;
  allocatedClasses?: string[];
}> {
  try {
    // 1. Fetch Task Details
    const taskRes = await pool.query(`
      SELECT t.*, u.full_name as creator_name 
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = $1 LIMIT 1
    `, [taskId]);

    const task = taskRes.rows[0];
    if (!task) {
      return { success: false, message: `Task ${taskId} not found` };
    }

    if (!task.deadline) {
      return { success: false, message: `Task "${task.title}" has no deadline set.` };
    }

    // 2. Fetch Assigned Classes (STRICT: only classes explicitly allocated to this task)
    const tcRes = await pool.query(`
      SELECT c.id, c.name, c.year, c.section 
      FROM task_classes tc
      JOIN classes c ON tc.class_id = c.id
      WHERE tc.task_id = $1
      ORDER BY c.year ASC, c.name ASC
    `, [taskId]);

    const assignedClasses = tcRes.rows;
    if (assignedClasses.length === 0) {
      return { 
        success: false, 
        message: `Task "${task.title}" has no allocated classes. Skipping backup (allocated classes only rule).` 
      };
    }

    const classIds = assignedClasses.map(c => c.id);
    const allocatedClassNames = assignedClasses.map(c => c.name);

    // 3. Fetch all assigned students & their submission for this task (STRICT: only allocated classes)
    const studentsQuery = `
      SELECT 
        u.id as user_id,
        u.register_number,
        u.full_name,
        u.gender,
        c.name as class_name,
        c.year,
        ts.id as submission_id,
        ts.status,
        ts.submitted_at,
        ts.verified_at,
        ts.custom_field_value,
        ts.screenshot_url,
        ts.original_filename,
        ts.verification_note,
        ts.rejection_reason
      FROM users u
      JOIN classes c ON u.class_id = c.id
      LEFT JOIN task_submissions ts ON ts.task_id = $1 AND ts.user_id = u.id
      WHERE u.role = 'STUDENT'
        AND u.class_id = ANY($2::uuid[])
      ORDER BY c.year ASC, c.name ASC, u.register_number ASC
    `;

    const submissionsRes = await pool.query(studentsQuery, [taskId, classIds]);
    const submissions = submissionsRes.rows;

    console.log(`[Task Deadline Backup] 📦 Creating archive for "${task.title}" (Allocated classes: ${allocatedClassNames.join(', ')} | ${submissions.length} students)...`);

    // 4. Initialize ZIP Archive
    const zip = new JSZip();
    const proofsFolder = zip.folder('proofs');

    const manifestLines: string[] = [
      `================================================================================`,
      `VSBEC IT TASK MANAGER - TASK DEADLINE PROOF MANIFEST`,
      `================================================================================`,
      `Task Title:         ${task.title}`,
      `Category:           ${task.category || 'General'}`,
      `Deadline:           ${formatISTDateTime(task.deadline)}`,
      `Allocated Classes:  ${allocatedClassNames.join(', ')}`,
      `Generated At:       ${formatISTDateTime(new Date())}`,
      `Total Students:     ${submissions.length}`,
      `================================================================================\n`
    ];

    let downloadedProofsCount = 0;
    const proofDownloads: Array<{ submission: any; zipPath: string; classFolder: string; zipFileName: string }> = [];

    // Assign proof filenames and class folders in advance so Excel matches ZIP contents
    for (const sub of submissions) {
      const isRejected = (sub.status || '').toUpperCase() === 'REJECTED';
      const cleanClassFolder = sanitizeArchiveName(sub.class_name || 'General');
      if (sub.screenshot_url && !isRejected) {
        const cleanReg = sanitizeArchiveName(sub.register_number || 'REG');
        const cleanName = sanitizeArchiveName(sub.full_name || 'Student');
        const ext = determineProofExtension(sub.original_filename, undefined, sub.screenshot_url);
        const zipFileName = `${cleanReg}_${cleanName}_proof${ext}`;
        const relativeProofPath = `proofs/${cleanClassFolder}/${zipFileName}`;
        sub.zipProofFilename = relativeProofPath;
        proofDownloads.push({ submission: sub, zipPath: relativeProofPath, classFolder: cleanClassFolder, zipFileName });
      } else {
        sub.zipProofFilename = '';
        if (isRejected && sub.screenshot_url) {
          manifestLines.push(
            `[${(sub.class_name || 'CLASS').padEnd(10)}] ${(sub.register_number || 'N/A').padEnd(16)} | ${(sub.full_name || 'N/A').slice(0, 26).padEnd(26)} | ${(sub.status || 'REJECTED').padEnd(10)} | [EXCLUDED_PROOF: Submission Rejected]`
          );
        }
      }
    }

    // 5. Download Proofs organized strictly by allocated class folder
    const BATCH_SIZE = 5;
    for (let i = 0; i < proofDownloads.length; i += BATCH_SIZE) {
      const batch = proofDownloads.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async ({ submission, classFolder, zipFileName }) => {
        const result = await downloadProofFile(submission.screenshot_url);
        if (result && proofsFolder) {
          const classZipFolder = proofsFolder.folder(classFolder);
          if (classZipFolder) {
            classZipFolder.file(zipFileName, result.buffer);
            downloadedProofsCount++;
            manifestLines.push(
              `[${(submission.class_name || 'CLASS').padEnd(10)}] ${(submission.register_number || 'N/A').padEnd(16)} | ${(submission.full_name || 'N/A').slice(0, 26).padEnd(26)} | ${(submission.status || 'SUBMITTED').padEnd(10)} | proofs/${classFolder}/${zipFileName}`
            );
          }
        } else {
          manifestLines.push(
            `[${(submission.class_name || 'CLASS').padEnd(10)}] ${(submission.register_number || 'N/A').padEnd(16)} | ${(submission.full_name || 'N/A').slice(0, 26).padEnd(26)} | ${(submission.status || 'SUBMITTED').padEnd(10)} | [DOWNLOAD_FAILED: ${submission.screenshot_url}]`
          );
        }
      }));
    }

    // Add manifest to proofs folder
    if (proofsFolder) {
      proofsFolder.file('MANIFEST.txt', manifestLines.join('\n'));
    }

    // 6. Generate Excel Report with allocated-class tabs
    const excelBuffer = await buildTaskExcelBuffer(task, assignedClasses, submissions);
    const cleanTaskTitle = sanitizeArchiveName(task.title);
    zip.file(`${cleanTaskTitle}_Submissions.xlsx`, excelBuffer);

    // 7. Write ZIP Archive to Disk
    const zipFileName = getTaskBackupZipName(task.title, task.deadline);
    const backupDir = path.join(process.cwd(), 'backups', 'tasks');
    fs.mkdirSync(backupDir, { recursive: true });

    const targetZipPath = path.join(backupDir, zipFileName);
    const relativeZipPath = path.join('backups', 'tasks', zipFileName).replace(/\\/g, '/');

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Unlink old backup file if it exists and path has changed
    if (task.backup_file_path && task.backup_file_path !== relativeZipPath) {
      try {
        const oldAbsPath = path.resolve(process.cwd(), task.backup_file_path);
        if (fs.existsSync(oldAbsPath)) {
          fs.unlinkSync(oldAbsPath);
          console.log(`[Task Deadline Backup] 🗑️ Cleaned up replaced backup file: ${task.backup_file_path}`);
        }
      } catch (unlinkErr: any) {
        console.warn('[Task Deadline Backup] Could not unlink replaced backup:', unlinkErr.message);
      }
    }

    fs.writeFileSync(targetZipPath, zipBuffer);

    // 8. Update Task Record with Atomic Lock
    await pool.query(`
      UPDATE tasks 
      SET backed_up_deadline = $1,
          backup_file_path = $2,
          backup_taken_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [task.deadline, relativeZipPath, taskId]);

    console.log(`[Task Deadline Backup] ✅ Backup ZIP generated successfully: ${relativeZipPath} (${(zipBuffer.length / 1024).toFixed(1)} KB, ${downloadedProofsCount} proofs)`);

    // 9. 🚀 Auto-push backup to GitHub
    try {
      const commitMsg = `chore(backup): archive task "${task.title}" for deadline ${formatDeadlineDateStr(task.deadline)} [skip ci]`;
      await tryLocalGitPush('backups/tasks', commitMsg);
    } catch (gitErr: any) {
      console.warn('[Task Deadline Backup] Auto git push warning:', gitErr.message);
    }

    return {
      success: true,
      message: `Backup archive successfully created and committed for task "${task.title}".`,
      filePath: relativeZipPath,
      fileName: zipFileName,
      fileSize: zipBuffer.length,
      totalSubmissions: submissions.length,
      totalProofs: downloadedProofsCount,
      allocatedClasses: allocatedClassNames
    };
  } catch (err: any) {
    console.error(`[Task Deadline Backup] Error backing up task ${taskId}:`, err);
    return { success: false, message: err.message || 'Error generating task backup' };
  }
}

/**
 * 🗑️ Cleans up old backup ZIP file from disk and database when a task is reopened or deadline extended
 * Also commits deletion to GitHub
 */
export async function cleanupTaskBackup(taskId: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await pool.query(
      'SELECT id, title, backup_file_path, backed_up_deadline FROM tasks WHERE id = $1',
      [taskId]
    );
    const task = res.rows[0];
    if (!task) return { success: false, message: 'Task not found' };

    if (task.backup_file_path) {
      const absPath = path.resolve(process.cwd(), task.backup_file_path);
      if (fs.existsSync(absPath)) {
        try {
          fs.unlinkSync(absPath);
          console.log(`[Task Deadline Backup] 🗑️ Deleted old backup ZIP upon task reopen/deadline change: ${task.backup_file_path}`);
        } catch (delErr: any) {
          console.warn('[Task Deadline Backup] Failed to delete backup file:', delErr.message);
        }
      }

      // Commit deletion to GitHub
      try {
        const commitMsg = `chore(backup): remove superseded backup for reopened task "${task.title}" [skip ci]`;
        await tryLocalGitPush('backups/tasks', commitMsg);
        await deleteGitHubFileViaAPI(task.backup_file_path, commitMsg).catch(() => {});
      } catch (gitErr: any) {
        console.warn('[Task Deadline Backup] Git cleanup warning:', gitErr.message);
      }
    }

    await pool.query(`
      UPDATE tasks 
      SET backup_file_path = NULL,
          backed_up_deadline = NULL,
          backup_taken_at = NULL
      WHERE id = $1
    `, [taskId]);

    return { success: true, message: `Backup reset and old files cleaned up for task "${task.title}".` };
  } catch (err: any) {
    console.error(`[Task Deadline Backup] Error cleaning up task ${taskId}:`, err);
    return { success: false, message: err.message || 'Error cleaning up task backup' };
  }
}

/**
 * ⏰ Scheduler Hook: Detects tasks exactly 5 minutes before deadline and generates backup
 */
export async function checkAndRunPreDeadlineBackups(windowMinutes = 5): Promise<Array<{ taskId: string; result: any }>> {
  const results: Array<{ taskId: string; result: any }> = [];

  try {
    const candidatesRes = await pool.query(`
      SELECT id, title, deadline, backed_up_deadline, backup_file_path
      FROM tasks
      WHERE status = 'OPEN'
        AND deadline IS NOT NULL
        AND deadline > CURRENT_TIMESTAMP
        AND deadline <= CURRENT_TIMESTAMP + ($1 || ' minutes')::interval
        AND (backed_up_deadline IS NULL OR backed_up_deadline != deadline)
      ORDER BY deadline ASC
    `, [windowMinutes]);

    const candidates = candidatesRes.rows;
    if (candidates.length === 0) {
      return results;
    }

    console.log(`[Task Deadline Backup] ⏰ Found ${candidates.length} task(s) within ${windowMinutes} minutes of deadline. Triggering backups...`);

    for (const task of candidates) {
      console.log(`[Task Deadline Backup] 🚀 Triggering 5-minute pre-deadline backup for task "${task.title}" (deadline: ${task.deadline})...`);
      const backupRes = await generateTaskDeadlineBackup(task.id);
      results.push({ taskId: task.id, result: backupRes });
    }
  } catch (err: any) {
    console.error('[Task Deadline Backup] Pre-deadline scheduler tick error:', err);
  }

  return results;
}
