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

async function exportTaskProgressReports(dateStr: string) {
  console.log(`[Workflow Backup] Generating Academic Task Progress exports for ${dateStr}...`);

  // 1. Fetch all student submissions with task and user details
  const submissionsRes = await pool.query(`
    SELECT 
      ts.id,
      ts.task_id,
      ts.user_id,
      ts.custom_field_value,
      ts.status,
      ts.screenshot_url,
      ts.verification_note,
      ts.rejection_reason,
      ts.original_filename,
      ts.submitted_at,
      ts.verified_at,
      t.title as task_title,
      t.category as task_category,
      t.deadline as task_deadline,
      t.status as task_status,
      u.full_name as student_name,
      COALESCE(u.register_number, u.username) as register_number,
      u.email as student_email,
      c.name as class_name,
      c.year as class_year
    FROM task_submissions ts
    JOIN tasks t ON ts.task_id = t.id
    JOIN users u ON ts.user_id = u.id
    LEFT JOIN classes c ON u.class_id = c.id
    ORDER BY c.year ASC, c.name ASC, u.register_number ASC, ts.submitted_at DESC NULLS LAST
  `);

  const allSubmissions = submissionsRes.rows;

  // 2. Master Task Progress CSV
  const taskProgressHeader = [
    'Date',
    'Student_Register_Number',
    'Student_Name',
    'Class',
    'Year',
    'Email_ID',
    'Task_Title',
    'Task_Category',
    'Task_Deadline',
    'Submission_Status',
    'Custom_Field_Value',
    'Submitted_At',
    'Verified_At',
    'Proof_Attached',
    'Proof_URL',
    'Rejection_Reason',
    'Verification_Note'
  ].join(',') + '\n';

  const mapSubmissionToCsvRow = (s: any) => {
    const hasProof = s.screenshot_url && !s.screenshot_url.startsWith('PURGED') ? 'YES' : (s.screenshot_url?.startsWith('PURGED') ? 'PURGED' : 'NO');
    return [
      escapeCsvCell(dateStr),
      escapeCsvCell(s.register_number),
      escapeCsvCell(s.student_name),
      escapeCsvCell(s.class_name || '—'),
      escapeCsvCell(s.class_year || '—'),
      escapeCsvCell(s.student_email || '—'),
      escapeCsvCell(s.task_title),
      escapeCsvCell(s.task_category || 'General'),
      escapeCsvCell(s.task_deadline ? new Date(s.task_deadline).toISOString().replace('T', ' ').slice(0, 19) : 'No Deadline'),
      escapeCsvCell(s.status || 'PENDING'),
      escapeCsvCell(s.custom_field_value || ''),
      escapeCsvCell(s.submitted_at ? new Date(s.submitted_at).toISOString().replace('T', ' ').slice(0, 19) : ''),
      escapeCsvCell(s.verified_at ? new Date(s.verified_at).toISOString().replace('T', ' ').slice(0, 19) : ''),
      escapeCsvCell(hasProof),
      escapeCsvCell(s.screenshot_url || ''),
      escapeCsvCell(s.rejection_reason || ''),
      escapeCsvCell(s.verification_note || '')
    ].join(',');
  };

  const masterTaskCsv = taskProgressHeader + allSubmissions.map(mapSubmissionToCsvRow).join('\n');
  safeWriteExportFile(`tasks/Task_Progress_Daily_Report_${dateStr}.csv`, masterTaskCsv);

  // 3. Year-wise Task Progress CSVs
  const yearTaskGroups: Record<string, any[]> = {};
  for (const sub of allSubmissions) {
    const yearKey = String(sub.class_year || 0);
    if (!yearTaskGroups[yearKey]) yearTaskGroups[yearKey] = [];
    yearTaskGroups[yearKey].push(sub);
  }

  for (const [yearKey, yearItems] of Object.entries(yearTaskGroups)) {
    if (yearKey === '0') continue;
    const yearCsv = taskProgressHeader + yearItems.map(mapSubmissionToCsvRow).join('\n');
    safeWriteExportFile(`tasks/${dateStr}/Year_${yearKey}_Tasks.csv`, yearCsv);
  }

  // 4. Task-level Summary Aggregation CSV
  const tasksSummaryRes = await pool.query(`
    SELECT 
      t.id,
      t.title,
      t.category,
      t.deadline,
      t.status,
      t.created_at,
      u_creator.full_name as creator_name,
      COALESCE(
        (SELECT string_agg(c.name, '; ') 
         FROM task_classes tc 
         JOIN classes c ON tc.class_id = c.id 
         WHERE tc.task_id = t.id),
        'All Classes'
      ) as assigned_classes,
      COUNT(DISTINCT ts.id) as total_submissions,
      COUNT(DISTINCT ts.id) FILTER (WHERE ts.status = 'VERIFIED') as verified_count,
      COUNT(DISTINCT ts.id) FILTER (WHERE ts.status = 'SUBMITTED' OR ts.status = 'PENDING') as pending_count,
      COUNT(DISTINCT ts.id) FILTER (WHERE ts.status = 'REJECTED') as rejected_count,
      COUNT(DISTINCT ts.id) FILTER (WHERE ts.status = 'NOT_PARTICIPATING') as opted_out_count
    FROM tasks t
    LEFT JOIN users u_creator ON t.created_by = u_creator.id
    LEFT JOIN task_submissions ts ON t.id = ts.task_id
    GROUP BY t.id, t.title, t.category, t.deadline, t.status, t.created_at, u_creator.full_name
    ORDER BY t.created_at DESC
  `);

  const summaryHeader = [
    'Date',
    'Task_ID',
    'Task_Title',
    'Category',
    'Deadline',
    'Status',
    'Created_By',
    'Assigned_Classes',
    'Total_Submissions',
    'Verified_Count',
    'Pending_Review_Count',
    'Rejected_Count',
    'Opted_Out_Count'
  ].join(',') + '\n';

  const summaryRows = tasksSummaryRes.rows.map(r => [
    escapeCsvCell(dateStr),
    escapeCsvCell(r.id),
    escapeCsvCell(r.title),
    escapeCsvCell(r.category || 'General'),
    escapeCsvCell(r.deadline ? new Date(r.deadline).toISOString().replace('T', ' ').slice(0, 19) : 'None'),
    escapeCsvCell(r.status || 'OPEN'),
    escapeCsvCell(r.creator_name || 'Admin'),
    escapeCsvCell(r.assigned_classes || 'All Classes'),
    escapeCsvCell(r.total_submissions || 0),
    escapeCsvCell(r.verified_count || 0),
    escapeCsvCell(r.pending_count || 0),
    escapeCsvCell(r.rejected_count || 0),
    escapeCsvCell(r.opted_out_count || 0)
  ].join(',')).join('\n');

  safeWriteExportFile(`tasks/Task_Summary_Report_${dateStr}.csv`, summaryHeader + summaryRows);

  // 5. Team Tasks Progress CSV
  try {
    const teamSubmissionsRes = await pool.query(`
      SELECT 
        tm.id as team_id,
        tm.team_name,
        t.title as task_title,
        c.name as class_name,
        c.year as class_year,
        u_lead.full_name as leader_name,
        COALESCE(u_lead.register_number, u_lead.username) as leader_reg_no,
        ts.status as submission_status,
        ts.proof_url,
        ts.created_at as submitted_at,
        ts.updated_at as verified_at,
        ts.remarks,
        COALESCE(
          (SELECT string_agg(u_mem.full_name || ' (' || COALESCE(u_mem.register_number, u_mem.username) || ')', '; ')
           FROM team_members mem
           JOIN users u_mem ON mem.student_id = u_mem.id
           WHERE mem.team_id = tm.id),
          ''
        ) as members_roster,
        COALESCE(
          (SELECT count(*) FROM team_members mem WHERE mem.team_id = tm.id),
          0
        ) as member_count
      FROM teams tm
      JOIN tasks t ON tm.task_id = t.id
      JOIN classes c ON tm.class_id = c.id
      JOIN users u_lead ON tm.leader_id = u_lead.id
      LEFT JOIN team_submissions ts ON tm.id = ts.team_id
      ORDER BY c.year ASC, c.name ASC, tm.created_at DESC
    `);

    const teamHeader = [
      'Date',
      'Team_Name',
      'Task_Title',
      'Class',
      'Year',
      'Leader_Name',
      'Leader_Reg_No',
      'Member_Count',
      'Members_Roster',
      'Submission_Status',
      'Proof_URL',
      'Submitted_At',
      'Verified_At',
      'Remarks'
    ].join(',') + '\n';

    const teamRows = teamSubmissionsRes.rows.map(tr => [
      escapeCsvCell(dateStr),
      escapeCsvCell(tr.team_name),
      escapeCsvCell(tr.task_title),
      escapeCsvCell(tr.class_name),
      escapeCsvCell(tr.class_year),
      escapeCsvCell(tr.leader_name),
      escapeCsvCell(tr.leader_reg_no),
      escapeCsvCell(tr.member_count),
      escapeCsvCell(tr.members_roster),
      escapeCsvCell(tr.submission_status || 'NOT_SUBMITTED'),
      escapeCsvCell(tr.proof_url || ''),
      escapeCsvCell(tr.submitted_at ? new Date(tr.submitted_at).toISOString().replace('T', ' ').slice(0, 19) : ''),
      escapeCsvCell(tr.verified_at ? new Date(tr.verified_at).toISOString().replace('T', ' ').slice(0, 19) : ''),
      escapeCsvCell(tr.remarks || '')
    ].join(',')).join('\n');

    safeWriteExportFile(`tasks/Team_Tasks_Daily_Report_${dateStr}.csv`, teamHeader + teamRows);
  } catch (teamErr: any) {
    console.warn('[Workflow Backup] Team tasks export warning:', teamErr.message);
  }

  console.log(`[Workflow Backup] ✅ Academic Task Progress reports generated for ${dateStr}.`);
}

async function main() {
  const dateStr = process.argv[2] || getISTDateStr();
  console.log(`[Workflow Backup] 🚀 Starting automated database & report backup for date: ${dateStr}...`);

  try {
    // 1. Export LeetCode Reports
    await exportLeetcodeReports(dateStr);

    // 2. Export Task Progress Reports
    await exportTaskProgressReports(dateStr);

    // 3. Export Database Snapshot
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

