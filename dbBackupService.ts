import { pool } from './db.js';
import fs from 'fs';
import path from 'path';
import { updateGitHubFileViaAPI, deleteGitHubFileViaAPI, safeWriteExportFile, tryLocalGitPush } from './githubSyncService.js';

function getISTDateStr(): string {
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return istTime.toISOString().split('T')[0];
}

/**
 * Creates a complete JSON data snapshot of all tables in PostgreSQL
 * and automatically commits and pushes the backup snapshot to both GitHub repositories.
 */
export async function generateDatabaseSnapshot(force = false) {
  const todayStr = getISTDateStr();

  if (!force) {
    try {
      const checkRes = await pool.query("SELECT value FROM system_settings WHERE key = 'last_db_backup_date' LIMIT 1");
      if (checkRes.rows.length > 0 && checkRes.rows[0].value === todayStr) {
        console.log(`[DB Backup] A database snapshot backup has already been generated today (${todayStr}). Skipping auto-backup.`);
        return { filePath: '', backupPayload: null, skipped: true };
      }
    } catch (checkErr: any) {
      console.warn('[DB Backup] Failed to check last backup date in system_settings:', checkErr.message);
    }
  }

  console.log('[DB Backup] Starting database snapshot creation...');
  try {
    const tables = [
      'departments',
      'classes',
      'users',
      'tasks',
      'task_classes',
      'task_submissions',
      'submission_reviews',
      'notices',
      'teams',
      'team_members',
      'team_invitations',
      'team_submissions',
      'leetcode_targets',
      'leetcode_daily_progress',
      'github_daily_commits',
      'student_profiles',
      'student_skills',
      'student_projects',
      'student_internships',
      'student_certifications',
      'student_coding_profiles',
      'student_resumes',
      'student_achievements',
      'student_languages',
      'student_career_preferences',
      'system_settings',
      'notifications',
      'assessment_questions',
      'assessment_assignments',
      'student_assessments',
      'push_subscriptions',
      'password_resets'
    ];

    const snapshotData: Record<string, any[]> = {};

    for (const table of tables) {
      try {
        let query = `SELECT * FROM ${table}`;
        // For notifications table, backup most recent 2,500 records to prevent snapshot payload ballooning
        if (table === 'notifications') {
          query = `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 2500`;
        }

        const res = await pool.query(query);

        // Omit sensitive password hashes & OTP codes from backup JSON for security
        if (table === 'users') {
          snapshotData[table] = res.rows.map(row => {
            const { password, ...safeUser } = row;
            return safeUser;
          });
        } else if (table === 'password_resets') {
          snapshotData[table] = res.rows.map(row => {
            const { otp_code, ...safeReset } = row;
            return safeReset;
          });
        } else {
          snapshotData[table] = res.rows;
        }
      } catch (tableErr: any) {
        console.warn(`[DB Backup] Table ${table} export warning:`, tableErr.message);
        snapshotData[table] = [];
      }
    }

    const backupPayload = {
      version: '2.0',
      exported_at: new Date().toISOString(),
      record_counts: Object.fromEntries(Object.entries(snapshotData).map(([k, v]) => [k, v.length])),
      data: snapshotData
    };

    // Compact minified JSON representation for optimal transfer speed and payload efficiency
    const jsonString = JSON.stringify(backupPayload);
    const filename = `db_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const relBackupPath = `backups/${filename}`;

    // Safely write to disk (process.cwd() or /tmp fallback on serverless)
    const { absPath: filePath, isTemp } = safeWriteExportFile(relBackupPath, jsonString);
    console.log(`[DB Backup] Database snapshot created successfully at ${filePath} (temp: ${isTemp})`);

    // Cleanup old local backups if running in an environment with persistent backups folder
    const deletedFiles: string[] = [];
    const localBackupDir = path.join(process.cwd(), 'backups');
    if (fs.existsSync(localBackupDir)) {
      try {
        const existingBackups = fs.readdirSync(localBackupDir)
          .filter(f => f.startsWith('db_backup_') && f.endsWith('.json'))
          .sort();

        if (existingBackups.length > 30) {
          const toDelete = existingBackups.slice(0, existingBackups.length - 30);
          for (const oldFile of toDelete) {
            fs.unlinkSync(path.join(localBackupDir, oldFile));
            deletedFiles.push(`backups/${oldFile}`);
          }
        }
      } catch (_) {}
    }

    // ── Auto-Push Database Snapshot to Both GitHub Repositories ───────────────
    const commitMsg = `chore(backup): auto-snapshot database backup for ${filename}`;

    // 1. Dual GitHub push via API
    await updateGitHubFileViaAPI(relBackupPath, commitMsg, jsonString);

    // Also clean up removed backups on GitHub
    for (const oldRelPath of deletedFiles) {
      await deleteGitHubFileViaAPI(oldRelPath, `chore(backup): prune old snapshot ${oldRelPath}`).catch(() => {});
    }

    // 2. Also push via local Git CLI if available in environment
    if (!isTemp) {
      await tryLocalGitPush('backups/', commitMsg);
    }

    // Record the backup date in system_settings
    await pool.query(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ('last_db_backup_date', $1, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
    `, [todayStr]).catch(err => console.warn('[DB Backup] Failed to save backup date in system_settings:', err.message));

    return { filePath, backupPayload };
  } catch (error) {
    console.error('[DB Backup Error]:', error);
    throw error;
  }
}
