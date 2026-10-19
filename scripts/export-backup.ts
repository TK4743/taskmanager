import dotenv from 'dotenv';
dotenv.config();

import { pool } from '../db.js';
import { generateDatabaseSnapshot } from '../dbBackupService.js';
import { safeWriteExportFile } from '../githubSyncService.js';

function getISTDateStr(): string {
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return istTime.toISOString().split('T')[0];
}

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function getWeekRange(dateStr: string): { start: string; end: string } {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0]
  };
}

async function enrichStudentProgressBatch(students: any[], dateStr: string) {
  if (!students || students.length === 0) return [];

  const week = getWeekRange(dateStr);
  const studentIds = students.map(s => s.id);

  const targetsRes = await pool.query(`
    SELECT * FROM leetcode_targets 
    WHERE start_date <= $1 AND end_date >= $1
    ORDER BY 
      CASE 
        WHEN user_id IS NOT NULL THEN 1
        WHEN class_id IS NOT NULL THEN 2
        ELSE 3
      END ASC
  `, [dateStr]);

  const [dailyProgressRes, weeklyProgressRes] = await Promise.all([
    pool.query(`
      SELECT user_id, solved_today, solved_yesterday, status, total_solved 
      FROM leetcode_daily_progress 
      WHERE date = $1 AND user_id = ANY($2)
    `, [dateStr, studentIds]),
    pool.query(`
      SELECT user_id, COALESCE(SUM(solved_today), 0) AS solved_week 
      FROM leetcode_daily_progress 
      WHERE date >= $1 AND date <= $2 AND user_id = ANY($3)
      GROUP BY user_id
    `, [week.start, week.end, studentIds])
  ]);

  const dailyMap = new Map<string, any>();
  for (const r of dailyProgressRes.rows) dailyMap.set(String(r.user_id), r);

  const weeklyMap = new Map<string, number>();
  for (const r of weeklyProgressRes.rows) weeklyMap.set(String(r.user_id), parseInt(r.solved_week, 10));

  return students.map(student => {
    let effectiveTarget = targetsRes.rows.find(t => t.user_id === student.id);
    if (!effectiveTarget && student.class_id) {
      effectiveTarget = targetsRes.rows.find(t => t.class_id === student.class_id && !t.user_id);
    }
    if (!effectiveTarget) {
      effectiveTarget = targetsRes.rows.find(t => !t.user_id && !t.class_id);
    }

    const dailyRow = dailyMap.get(student.id);
    const solvedToday = Number(dailyRow?.solved_today) || 0;
    const solvedThisWeek = weeklyMap.get(student.id) || 0;
    const dailyTarget = effectiveTarget ? effectiveTarget.daily_target : 0;
    const weeklyTarget = effectiveTarget ? effectiveTarget.weekly_target : 0;

    return {
      studentId: student.id,
      registerNumber: student.register_number,
      fullName: student.full_name,
      className: student.class_name,
      leetcodeUrl: student.leetcode_url,
      solvedToday,
      dailyTarget,
      dailyStatus: dailyTarget > 0 ? (solvedToday >= dailyTarget ? 'TARGET_MET' : 'TARGET_MISSED') : 'NO_TARGET',
      solvedThisWeek,
      weeklyTarget,
      weeklyStatus: weeklyTarget > 0 ? (solvedThisWeek >= weeklyTarget ? 'TARGET_MET' : 'TARGET_MISSED') : 'NO_TARGET',
      totalSolved: dailyRow?.total_solved || 0
    };
  });
}

async function exportLeetcodeReports(dateStr: string) {
  console.log(`[Workflow Backup] Generating LeetCode CSV exports for ${dateStr}...`);
  const studentRes = await pool.query(`
    SELECT u.id, COALESCE(u.register_number, u.username) AS register_number, u.full_name, u.class_id, u.email, u.leetcode_url, c.year, c.name as class_name
    FROM users u
    LEFT JOIN classes c ON u.class_id = c.id
    WHERE u.role = 'STUDENT'
    ORDER BY c.year ASC, c.name ASC, u.register_number ASC
  `);
  const allStudents = studentRes.rows;
  if (allStudents.length === 0) {
    console.log('[Workflow Backup] No students found.');
    return [];
  }

  const enrichedAll = await enrichStudentProgressBatch(allStudents, dateStr);

  const csvHeader = [
    'Date',
    'Register_Number',
    'Student_Name',
    'Class',
    'Year',
    'Email_ID',
    'LeetCode_ID',
    'LeetCode_URL',
    'Daily_Target',
    'Solved_Today',
    'Daily_Status',
    'Total_Solved',
    'Solved_This_Week',
    'Weekly_Target',
    'Weekly_Status'
  ].join(',') + '\n';

  const mapToCsvRow = (item: any) => {
    const studentInfo = allStudents.find(s => String(s.id) === String(item.studentId));
    return [
      escapeCsvCell(dateStr),
      escapeCsvCell(item.registerNumber),
      escapeCsvCell(item.fullName),
      escapeCsvCell(item.className || '—'),
      escapeCsvCell(studentInfo?.year || '—'),
      escapeCsvCell(studentInfo?.email || '—'),
      escapeCsvCell(item.leetcodeUrl ? item.leetcodeUrl.split('/').filter(Boolean).pop() : ''),
      escapeCsvCell(item.leetcodeUrl || ''),
      escapeCsvCell(item.dailyTarget),
      escapeCsvCell(item.solvedToday),
      escapeCsvCell(item.dailyStatus ? item.dailyStatus.replace('_', ' ') : 'NO_TARGET'),
      escapeCsvCell(item.totalSolved || 0),
      escapeCsvCell(item.solvedThisWeek),
      escapeCsvCell(item.weeklyTarget),
      escapeCsvCell(item.weeklyStatus ? item.weeklyStatus.replace('_', ' ') : 'NO_TARGET')
    ].join(',');
  };

  // 1. Master CSV
  const masterCsvContent = csvHeader + enrichedAll.map(mapToCsvRow).join('\n');
  const masterCsvRelPath = `leetcode/LeetCode_Daily_Report_${dateStr}.csv`;
  safeWriteExportFile(masterCsvRelPath, masterCsvContent);

  // 2. Year & Section CSVs
  const yearGroups: Record<string, any[]> = {};
  const sectionGroups: Record<string, any[]> = {};

  for (const item of enrichedAll) {
    const studentInfo = allStudents.find(s => String(s.id) === String(item.studentId));
    const yearKey = String(studentInfo?.year || 0);
    const sectionKey = studentInfo?.class_name ? studentInfo.class_name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Unassigned_Section';

    if (!yearGroups[yearKey]) yearGroups[yearKey] = [];
    yearGroups[yearKey].push(item);

    if (!sectionGroups[sectionKey]) sectionGroups[sectionKey] = [];
    sectionGroups[sectionKey].push(item);
  }

  for (const [yearKey, yearItems] of Object.entries(yearGroups)) {
    if (yearKey === '0') continue;
    const yearCsvContent = csvHeader + yearItems.map(mapToCsvRow).join('\n');
    safeWriteExportFile(`leetcode/${dateStr}/Year_${yearKey}.csv`, yearCsvContent);
    safeWriteExportFile(`leetcode/${dateStr}/Year_${yearKey}.json`, JSON.stringify(yearItems, null, 2));
  }

  for (const [sectionKey, sectionItems] of Object.entries(sectionGroups)) {
    const sectionCsvContent = csvHeader + sectionItems.map(mapToCsvRow).join('\n');
    safeWriteExportFile(`leetcode/${dateStr}/Section_${sectionKey}.csv`, sectionCsvContent);
  }

  console.log(`[Workflow Backup] ✅ LeetCode reports generated for ${dateStr}.`);
}

async function main() {
  const dateStr = process.argv[2] || getISTDateStr();
  console.log(`[Workflow Backup] 🚀 Starting automated database & report backup for date: ${dateStr}...`);

  try {
    // 1. Export LeetCode Reports
    await exportLeetcodeReports(dateStr);

    // 2. Export Database Snapshot
    console.log('[Workflow Backup] Generating database snapshot JSON...');
    const snapshot = await generateDatabaseSnapshot(true, true);
    console.log(`[Workflow Backup] ✅ Database snapshot generated: ${snapshot.filePath}`);

    console.log('[Workflow Backup] 🎉 All backups successfully generated.');
    process.exit(0);
  } catch (err: any) {
    console.error('[Workflow Backup Error]:', err.message);
    process.exit(1);
  } finally {
    await pool.end().catch(() => {});
  }
}

main();
