/**
 * 📢 VSBEC IT Task Manager - Dedicated Telegram Automation Runner
 * Can be executed by:
 * - GitHub Actions (.github/workflows/auto-backup.yml)
 * - In-Server Scheduler
 * - CLI / npm run
 * Zero external cron dependencies. Backed by PostgreSQL atomic idempotency.
 */

import dotenv from 'dotenv';
dotenv.config();

import { pool } from '../db.js';
import { 
  sendGroupSummary, 
  sendGroupDeadlineAlert, 
  triggerPendingTaskReminders,
  getISTDateStr,
  ensureBotTokenLoaded,
  ensureAdminChatIdLoaded,
  getGroupChatId
} from '../telegramService.js';
import { syncAllCodingProgress } from '../codingTelemetryService.js';

function getISTParts() {
  const d = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = Object.fromEntries(formatter.formatToParts(d).map(p => [p.type, p.value]));
  const todayStr = `${parts.year}-${parts.month}-${parts.day}`;
  const hours = parseInt(parts.hour, 10) % 24;
  const minutes = parseInt(parts.minute, 10);

  const prevDate = new Date(d.getTime() - 24 * 60 * 60 * 1000);
  const prevParts = Object.fromEntries(formatter.formatToParts(prevDate).map(p => [p.type, p.value]));
  const prevDayStr = `${prevParts.year}-${prevParts.month}-${prevParts.day}`;

  return { todayStr, prevDayStr, hours, minutes };
}

async function runAutomation() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'auto';
  const isForced = args.includes('--force');

  const { todayStr, prevDayStr, hours, minutes } = getISTParts();
  console.log(`[Telegram Automation Runner] Mode: ${mode} | IST Date: ${todayStr} (Prev: ${prevDayStr}) | Time: ${hours}:${minutes.toString().padStart(2, '0')} IST | Force: ${isForced}`);

  // 1. Ensure credentials are resolved (env with PostgreSQL fallback)
  const botToken = await ensureBotTokenLoaded();
  if (!botToken) {
    console.error('❌ FATAL: Telegram bot token not configured in environment or database.');
    process.exit(1);
  }
  await ensureAdminChatIdLoaded();
  const groupChatId = await getGroupChatId();
  console.log(`[Telegram Automation Runner] Bot Token: Resolved | Group Chat ID: ${groupChatId || 'Not found'}`);

  let runMorning = false;
  let runEvening = false;

  if (mode === 'morning') {
    runMorning = true;
  } else if (mode === 'evening') {
    runEvening = true;
  } else {
    // Auto mode based on current IST hour
    if (hours >= 7 && hours < 16) {
      runMorning = true;
    }
    if (hours >= 19 || hours === 0) {
      runEvening = true;
    }
    if (!runMorning && !runEvening) {
      console.log(`[Telegram Automation Runner] Current hour (${hours} IST) does not fall in automated morning (7-15) or evening (19-23) windows. Use --force or specify 'morning'/'evening' mode.`);
    }
  }

  // ── MORNING GROUP SUMMARY PIPELINE ──────────────────────────────────────────
  if (runMorning) {
    console.log(`[Telegram Automation Runner] 🌅 Checking Morning Group Summary for ${todayStr}...`);
    const checkRes = await pool.query(
      "SELECT value FROM system_settings WHERE key = 'telegram_last_group_summary_morning_date'"
    );
    const lastDate = checkRes.rows[0]?.value;

    if (!isForced && lastDate === todayStr) {
      console.log(`ℹ️ Morning group summary for ${todayStr} was already dispatched. Skipping duplicate.`);
    } else {
      console.log(`[Telegram Automation Runner] 🔄 Syncing LeetCode & GitHub telemetry for ${prevDayStr} before generating summary...`);
      await syncAllCodingProgress(prevDayStr);

      console.log(`🚀 Dispatching Morning Group Summary (covering previous day: ${prevDayStr})...`);
      const summaryRes = await sendGroupSummary(undefined, prevDayStr, { force: isForced });
      console.log('Morning Summary Result:', summaryRes);

      if (summaryRes.success) {
        await pool.query(`
          INSERT INTO system_settings (key, value, updated_at)
          VALUES ('telegram_last_group_summary_morning_date', $1, CURRENT_TIMESTAMP)
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
        `, [todayStr]);
        console.log(`✅ Locked 'telegram_last_group_summary_morning_date' = ${todayStr}`);

        // Send 24-hour upcoming deadline alerts
        console.log('⏰ Triggering 24-Hour Task Deadline Alerts...');
        const alertRes = await sendGroupDeadlineAlert();
        console.log('Deadline Alerts Result:', alertRes);
      } else if (summaryRes.skipped) {
        console.log('ℹ️ Summary was skipped (cooldown active).');
      } else {
        console.error('❌ Morning Group Summary failed to dispatch:', summaryRes.message);
      }
    }
  }

  // ── EVENING GROUP SUMMARY PIPELINE ──────────────────────────────────────────
  if (runEvening) {
    console.log(`[Telegram Automation Runner] 🌇 Checking Evening Group Summary for ${todayStr}...`);
    const checkRes = await pool.query(
      "SELECT value FROM system_settings WHERE key = 'telegram_last_group_summary_evening_date'"
    );
    const lastDate = checkRes.rows[0]?.value;

    if (!isForced && lastDate === todayStr) {
      console.log(`ℹ️ Evening group summary for ${todayStr} was already dispatched. Skipping duplicate.`);
    } else {
      console.log(`[Telegram Automation Runner] 🔄 Syncing LeetCode & GitHub telemetry for ${todayStr} before generating summary...`);
      await syncAllCodingProgress(todayStr);

      console.log(`🚀 Dispatching Evening Group Summary for today (${todayStr})...`);
      const summaryRes = await sendGroupSummary(undefined, todayStr, { force: isForced });
      console.log('Evening Summary Result:', summaryRes);

      if (summaryRes.success) {
        await pool.query(`
          INSERT INTO system_settings (key, value, updated_at)
          VALUES ('telegram_last_group_summary_evening_date', $1, CURRENT_TIMESTAMP)
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
        `, [todayStr]);
        console.log(`✅ Locked 'telegram_last_group_summary_evening_date' = ${todayStr}`);

        // Send 1-to-1 pending reminders
        console.log('📢 Triggering 1-to-1 Student Pending Reminders...');
        const reminderRes = await triggerPendingTaskReminders();
        console.log('Pending Reminders Result:', reminderRes);
      } else if (summaryRes.skipped) {
        console.log('ℹ️ Summary was skipped (cooldown active).');
      } else {
        console.error('❌ Evening Group Summary failed to dispatch:', summaryRes.message);
      }
    }
  }

  await pool.end();
  console.log('[Telegram Automation Runner] Finished successfully.');
}

runAutomation().catch(err => {
  console.error('[Telegram Automation Runner] Fatal Exception:', err);
  process.exit(1);
});
