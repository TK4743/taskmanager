/**
 * 📦 Task Deadline Backup Service
 * Automatically captures a comprehensive backup ZIP archive for tasks
 * exactly 5 minutes before their deadline.
 *
 * Archive Contents:
 * - `<Task_Name>_Submissions.xlsx`: Full student roster, completion metrics, and submission records
 * - `proofs/`: Real student proof files (screenshots, PDFs, images) named by register number & student name
 * - `proofs/MANIFEST.txt`: Complete inventory of downloaded proofs and audit log
 *
 * Lifecycle Features:
 * - Atomic DB locks (backed_up_deadline, backup_file_path, backup_taken_at)
 * - Auto-cleanup on task reopen or deadline extension (deletes old zip, resets lock)
 * - Safe filename sanitization
 */

import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import ExcelJS from 'exceljs';
import { pool } from './db.js';

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

/**
 * Builds the comprehensive Task Submission Excel Workbook
 */
export async function buildTaskExcelBuffer(task: any, assignedClasses: any[], submissions: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'VSBEC IT Task Manager';
  workbook.created = new Date();

  // ── Sheet 1: Summary ────────────────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet('Task Summary', {
    views: [{ showGridLines: true }]
  });

  summarySheet.columns = [
    { header: 'Property', key: 'prop', width: 26 },
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
    { prop: 'Assigned Classes', val: assignedClasses.map(c => c.name).join(', ') || 'All Department Classes' },
    { prop: 'Archive Generated At', val: formatISTDateTime(new Date()) },
    { prop: '', val: '' },
    { prop: 'METRICS & PROGRESS', val: '' },
    { prop: 'Total Assigned Students', val: totalAssigned },
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

  // ── Sheet 2: Student Submissions Detail ─────────────────────────────────────
  const detailSheet = workbook.addWorksheet('Student Submissions', {
    views: [{ showGridLines: true }]
  });

  detailSheet.columns = [
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
    { header: 'Proof Filename in ZIP', key: 'proofFile', width: 35 },
    { header: 'Proof URL', key: 'proofUrl', width: 45 },
    { header: 'Verification Remarks', key: 'remarks', width: 30 },
    { header: 'Rejection Reason', key: 'rejectionReason', width: 30 }
  ];

  // Header styling
  const headerRow = detailSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  submissions.forEach((s, idx) => {
    const hasProof = Boolean(s.screenshot_url);
    const row = detailSheet.addRow({
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
      proofAttached: hasProof ? 'YES' : 'NO',
      proofFile: s.zipProofFilename || (hasProof ? 'Attached in proofs/' : 'None'),
      proofUrl: s.screenshot_url || '',
      remarks: s.verification_note || '',
      rejectionReason: s.rejection_reason || ''
    });

    // Zebra striping
    if (idx % 2 === 1) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }

    // Colorize status cell
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

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generates the complete Task Deadline Backup ZIP
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

    // 2. Fetch Assigned Classes
    const tcRes = await pool.query(`
      SELECT c.id, c.name, c.year, c.section 
      FROM task_classes tc
      JOIN classes c ON tc.class_id = c.id
      WHERE tc.task_id = $1
      ORDER BY c.year ASC, c.name ASC
    `, [taskId]);

    const assignedClasses = tcRes.rows;
    const classIds = assignedClasses.map(c => c.id);

    // 3. Fetch all assigned students & their submission for this task
    let studentsQuery = `
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
      LEFT JOIN classes c ON u.class_id = c.id
      LEFT JOIN task_submissions ts ON ts.task_id = $1 AND ts.user_id = u.id
      WHERE u.role = 'STUDENT'
    `;
    const params: any[] = [taskId];

    if (classIds.length > 0) {
      params.push(classIds);
      studentsQuery += ` AND u.class_id = ANY($2::uuid[])`;
    } else if (task.department_id) {
      params.push(task.department_id);
      studentsQuery += ` AND u.department_id = $2`;
    }

    studentsQuery += ` ORDER BY c.year ASC, c.name ASC, u.register_number ASC`;

    const submissionsRes = await pool.query(studentsQuery, params);
    const submissions = submissionsRes.rows;

    console.log(`[Task Deadline Backup] 📦 Creating archive for "${task.title}" (${submissions.length} students, deadline: ${task.deadline})...`);

    // 4. Initialize ZIP Archive
    const zip = new JSZip();
    const proofsFolder = zip.folder('proofs');

    const manifestLines: string[] = [
      `================================================================================`,
      `VSBEC IT TASK MANAGER - TASK DEADLINE PROOF MANIFEST`,
      `================================================================================`,
      `Task Title:       ${task.title}`,
      `Category:         ${task.category || 'General'}`,
      `Deadline:         ${formatISTDateTime(task.deadline)}`,
      `Generated At:     ${formatISTDateTime(new Date())}`,
      `Total Students:   ${submissions.length}`,
      `================================================================================\n`,
      `REGISTER NO.     | STUDENT NAME                   | STATUS     | PROOF FILE / STATUS`,
      `--------------------------------------------------------------------------------`
    ];

    let downloadedProofsCount = 0;
    const proofDownloads: Array<{ submission: any; zipFileName: string }> = [];

    // Assign proof filenames in advance so Excel matches ZIP contents
    for (const sub of submissions) {
      if (sub.screenshot_url) {
        const cleanReg = sanitizeArchiveName(sub.register_number || 'REG');
        const cleanName = sanitizeArchiveName(sub.full_name || 'Student');
        const ext = determineProofExtension(sub.original_filename, undefined, sub.screenshot_url);
        const zipProofName = `${cleanReg}_${cleanName}_proof${ext}`;
        sub.zipProofFilename = zipProofName;
        proofDownloads.push({ submission: sub, zipFileName: zipProofName });
      } else {
        sub.zipProofFilename = '';
      }
    }

    // 5. Download Proofs in Batches of 5
    const BATCH_SIZE = 5;
    for (let i = 0; i < proofDownloads.length; i += BATCH_SIZE) {
      const batch = proofDownloads.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async ({ submission, zipFileName }) => {
        const result = await downloadProofFile(submission.screenshot_url);
        if (result && proofsFolder) {
          proofsFolder.file(zipFileName, result.buffer);
          downloadedProofsCount++;
          manifestLines.push(
            `${(submission.register_number || 'N/A').padEnd(16)} | ${(submission.full_name || 'N/A').slice(0, 30).padEnd(30)} | ${(submission.status || 'SUBMITTED').padEnd(10)} | proofs/${zipFileName}`
          );
        } else {
          manifestLines.push(
            `${(submission.register_number || 'N/A').padEnd(16)} | ${(submission.full_name || 'N/A').slice(0, 30).padEnd(30)} | ${(submission.status || 'SUBMITTED').padEnd(10)} | [DOWNLOAD_FAILED: ${submission.screenshot_url}]`
          );
        }
      }));
    }

    // Add manifest to proofs folder
    if (proofsFolder) {
      proofsFolder.file('MANIFEST.txt', manifestLines.join('\n'));
    }

    // 6. Generate Excel Report
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

    return {
      success: true,
      message: `Backup archive successfully created for task "${task.title}".`,
      filePath: relativeZipPath,
      fileName: zipFileName,
      fileSize: zipBuffer.length,
      totalSubmissions: submissions.length,
      totalProofs: downloadedProofsCount
    };
  } catch (err: any) {
    console.error(`[Task Deadline Backup] Error backing up task ${taskId}:`, err);
    return { success: false, message: err.message || 'Error generating task backup' };
  }
}

/**
 * 🗑️ Cleans up old backup ZIP file from disk and database when a task is reopened or deadline extended
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
    // Select open tasks where:
    // 1. Deadline is strictly in the future (deadline > CURRENT_TIMESTAMP)
    // 2. Deadline is within windowMinutes (e.g. deadline <= CURRENT_TIMESTAMP + 5 minutes)
    // 3. Backup has not already been taken for THIS exact deadline (backed_up_deadline IS NULL OR backed_up_deadline != deadline)
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
