/**
 * 📦 Dedicated Task Deadline Backup Runner
 * Usage:
 *   npx tsx scripts/run_task_deadline_backup.ts            -> Check all tasks within 5m of deadline
 *   npx tsx scripts/run_task_deadline_backup.ts <taskId>   -> Force backup for specific task
 */

import dotenv from 'dotenv';
dotenv.config();

import { pool } from '../db.js';
import { checkAndRunPreDeadlineBackups, generateTaskDeadlineBackup } from '../taskDeadlineBackupService.js';

async function run() {
  const arg = process.argv[2];

  if (arg && arg.length > 20) {
    console.log(`[Task Deadline Runner] 🎯 Force-triggering deadline backup for task ID: ${arg}...`);
    const res = await generateTaskDeadlineBackup(arg, { force: true });
    console.log('[Task Deadline Runner] Result:', res);
  } else {
    const windowMinutes = parseInt(arg, 10) || 5;
    console.log(`[Task Deadline Runner] ⏰ Checking tasks within ${windowMinutes} minutes of deadline...`);
    const results = await checkAndRunPreDeadlineBackups(windowMinutes);
    console.log(`[Task Deadline Runner] Completed. Processed ${results.length} task(s).`);
  }

  await pool.end();
  process.exit(0);
}

run().catch(err => {
  console.error('[Task Deadline Runner] Fatal Error:', err);
  process.exit(1);
});
