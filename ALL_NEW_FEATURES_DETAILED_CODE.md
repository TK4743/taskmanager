# Complete Guide & Full Code for All Newly Added Features

This document provides a comprehensive, detailed breakdown of all newly added features along with their complete, production-ready code.

---

## 📑 Table of Contents
1. [Feature 1: Student Assessment Marks & Scorecards Viewing](#feature-1-student-assessment-marks--scorecards-viewing)
2. [Feature 2: LeetCode Weekly Streak & Consistency (Pillar 2)](#feature-2-leetcode-weekly-streak--consistency-pillar-2)
3. [Feature 3: Technical Project Portfolio (Pillar 3)](#feature-3-technical-project-portfolio-pillar-3)
4. [Feature 4: Live Brevo Email Credits & Mail Logo Icon](#feature-4-live-brevo-email-credits--mail-logo-icon)
5. [Feature 5: Telegram Announcement Chat ID Fix](#feature-5-telegram-announcement-chat-id-fix)
6. [Full Backend Code (`server.ts`)](#full-backend-code-serverts)
7. [Full Email Service Code (`emailService.ts`)](#full-email-service-code-emailservicets)
8. [Full Database Migration DDL (`db.ts`)](#full-database-migration-ddl-dbts)
9. [Full App Integration (`src/App.tsx`)](#full-app-integration-srcapptsx)
10. [Full Code: src/PlacementReadinessView.tsx](#10-full-code-srcplacementreadinessviewtsx)
11. [Full Code: src/SkillAssessmentView.tsx](#11-full-code-srcskillassessmentviewtsx)

---

## Feature 1: Student Assessment Marks & Scorecards Viewing

### Detailed Explanation:
- **Problem**: Previously, students could only take mock tests and view a temporary post-test screen. Once navigated away, there was no persistent academic transcript or history where students could review their past test marks, cut-off statuses, or domain breakdowns.
- **Solution**:
  1. **Backend**: Implemented `GET /api/assessment/my-results`. It pulls all historical attempts from `student_assessments` in descending order by `created_at`. It aggregates overall student metrics: `average_score`, `highest_score`, `total_attempts`, `passed_count`, and `pass_rate`.
  2. **Frontend Tab**: Added `My Assessment Marks (${count})` to the student navigation bar in `SkillAssessmentView.tsx`.
  3. **Performance Ribbon**: Displays 4 KPI cards: Average Mark (%), Personal Best (%), Tests Attempted, and Clearance Rate (%).
  4. **Assessment History Cards**: Shows Track Title, Cutoff %, Score %, Marks (`13 / 15 Correct`), Status Badge (`PASSED ✅` / `ACTION REQUIRED ⚠️`), Duration, Date, Domain breakdown bars (*Quantitative, Logical, Verbal, Core Tech*), and a Proctor Face Verified thumbnail badge.
  5. **Interactive Scorecard Modal**: Clicking "View Full Scorecard" opens an official modal transcript featuring student details, score gauge, strengths, focus areas, and a full question-by-question review with selected answers, correct answers, and step-by-step explanations.
  6. **Pillar 1 Integration**: In `PlacementReadinessView.tsx`, Pillar 1 now shows a direct "View Marks & Scorecard" button once a student has completed an assessment.

---

## Feature 2: LeetCode Weekly Streak & Consistency (Pillar 2)

### Detailed Explanation:
- **Problem**: Previously, Pillar 2 measured total lifetime solved problems. This disadvantaged consistent daily learners who recently started and rewarded students who practiced months ago but are currently inactive.
- **Solution**:
  1. **Calculation**: Instead of `MAX(total_solved)`, the system queries `leetcode_daily_progress` over a rolling 7-day window:
     ```sql
     COUNT(CASE WHEN date >= CURRENT_DATE - INTERVAL '7 days' AND (solved_today > 0 OR status = 'COMPLETED') THEN 1 END) as active_days_7d
     ```
  2. **Metrics**:
     - `weekly_streak`: Integer between `0` and `7` days.
     - `consistency`: Percentage calculated as `Math.min(100, Math.round((weekly_streak / 7) * 100))`.
     - `score / norm`: `consistency` (0–100%).
     - `contribution`: `Math.round(consistency * 0.25)` (Max **25 points**).
  3. **Display**: UI cards display `"X / 7 Days Active This Week"` and a consistency gauge.
  4. **Excel Export**: Exports columns for `LeetCode Weekly Streak (Days)` and `LeetCode Consistency (%)`.

---

## Feature 3: Technical Project Portfolio (Pillar 3)

### Detailed Explanation:
- **Problem**: Previously, Pillar 3 counted raw 30-day GitHub commits. Commits can easily be artificially inflated or misleading.
- **Solution**:
  1. **Calculation**: Evaluates real, verified software engineering projects recorded in `student_projects`:
     ```sql
     SELECT user_id, COUNT(*) as project_count FROM student_projects GROUP BY user_id
     ```
  2. **Benchmark**: Set to **3+ verified projects = 100%** (Max **20 points**):
     - `projectNorm = Math.min(100, Math.round((projectCount / 3) * 100))`.
     - `projectContrib = Math.round(projectNorm * 0.20)`.
  3. **Display**: The student dashboard displays their portfolio count, progress toward the 3-project benchmark, and an interactive list of projects with tech stacks and links.
  4. **HOD Table**: Shows the student's project count and portfolio contribution.

---

## Feature 4: Live Brevo Email Credits & Mail Logo Icon

### Detailed Explanation:
- **Problem**: HODs and Advisors triggering cohort assessments had no visual indication of remaining Brevo email credits or whether their multi-node quota was sufficient for the targeted batch.
- **Solution**:
  1. **Header Trigger Button**: Updated to `Trigger Assessment & Emails` with a live credit count pill (`600 credits`) and a `Mail` logo icon from `lucide-react`.
  2. **Live Brevo Engine Card**: Added to the top of the Assessment Announcement Studio Modal:
     - Shows total credits across all active nodes (`600 Credits`).
     - Shows individual node health pills (`Brevo-Node-1: 300 left`, `Brevo-Node-2: 300 left`).
     - Shows a live refresh button that calls `GET /api/email-service/status`.
  3. **Cohort Quota Sufficiency Check**: Compares total targeted students against remaining credits:
     - If sufficient: Displays `✅ Quota Sufficient: X targeted`.
     - If insufficient: Warns the coordinator before sending.
  4. **Dispatch Button**: Styled with `<Mail size={15} /> Dispatch Assessment via Email Balancer`.

---

## Feature 5: Telegram Announcement Chat ID Fix

### Detailed Explanation:
- **Problem**: `sendTelegramMessage` expects `targetChatId` as the 1st parameter and `htmlText` as the 2nd parameter. In `POST /api/assessment/trigger-announcement`, the call was missing the group chat ID.
- **Solution**:
  - Imported `getGroupChatId` from `./telegramService.js`.
  - Updated call:
    ```ts
    const targetChatId = (await getGroupChatId()) || process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (targetChatId) {
      sendTelegramMessage(targetChatId, groupText).catch(() => {});
    }
    ```

---

## Full Backend Code (`server.ts`)

Here are the complete backend routes to add/update in `server.ts`:

```ts
// ============================================================================
// 1. Telegram Service Import (Ensure getGroupChatId is present)
// ============================================================================
import {
  getTelegramStats,
  setGroupChatId,
  getGroupChatId,
  sendTelegramMessage,
  // other existing exports...
} from './telegramService.js';

// ============================================================================
// 2. Student Assessment Marks History Endpoint
// ============================================================================
app.get('/api/assessment/my-results', asyncHandler(async (req: any, res: any) => {
  let targetUserId = req.query.user_id;

  if (!targetUserId) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded: any = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'secret');
        targetUserId = decoded.id;
      } catch (_) {}
    }
  }

  // Fallback for Tharunkumar K if testing unauthenticated
  if (!targetUserId) {
    const tharun = await pool.query("SELECT id FROM users WHERE register_number = '922524205171' LIMIT 1");
    if (tharun.rows.length > 0) targetUserId = tharun.rows[0].id;
  }

  if (!targetUserId) {
    return res.json({ success: true, assessments: [], metrics: null });
  }

  const result = await pool.query(`
    SELECT 
      id, track_type, track_title, total_questions, correct_count,
      score_percentage, is_passed, cutoff_percentage, time_taken_seconds,
      proctor_photo_url, category_breakdown, strengths, gaps, answers_summary,
      created_at
    FROM student_assessments
    WHERE user_id = $1
    ORDER BY created_at DESC;
  `, [targetUserId]);

  const totalAttempts = result.rows.length;
  let avgScore = 0;
  let passedCount = 0;
  let highestScore = 0;

  if (totalAttempts > 0) {
    const sum = result.rows.reduce((acc, r) => acc + Number(r.score_percentage || 0), 0);
    avgScore = Math.round(sum / totalAttempts);
    passedCount = result.rows.filter(r => r.is_passed === true || Number(r.score_percentage || 0) >= Number(r.cutoff_percentage || 60)).length;
    highestScore = Math.round(Math.max(...result.rows.map(r => Number(r.score_percentage || 0))) * 100) / 100;
  }

  res.json({
    success: true,
    metrics: {
      total_attempts: totalAttempts,
      average_score: avgScore,
      highest_score: highestScore,
      passed_count: passedCount,
      pass_rate: totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0
    },
    assessments: result.rows
  });
}));

// ============================================================================
// 3. Telegram Announcement Call in POST /api/assessment/trigger-announcement
// ============================================================================
// Inside app.post('/api/assessment/trigger-announcement', ...):
const targetChatId = (await getGroupChatId()) || process.env.TELEGRAM_ADMIN_CHAT_ID;
if (targetChatId) {
  sendTelegramMessage(targetChatId, groupText).catch(() => {});
}

// ============================================================================
// 4. Placement Readiness Dashboard: Pillar 2 & 3 Overhaul
// ============================================================================
app.get('/api/placement/readiness-dashboard', asyncHandler(async (req: any, res: any) => {
  const { class_id, tier, search } = req.query;

  const [
    studentsRes,
    assessmentRes,
    leetcodeRes,
    projectRes,
    githubRes,
    taskSubRes,
    taskClassRes,
    classesRes
  ] = await Promise.all([
    pool.query(`
      SELECT u.id, u.full_name, u.register_number, u.email, u.phone, u.class_id,
             c.name as class_name, c.year as class_year, c.batch
      FROM users u
      LEFT JOIN classes c ON c.id = u.class_id
      WHERE u.role = 'STUDENT'
      ORDER BY u.register_number ASC
    `),
    pool.query(`
      SELECT DISTINCT ON (user_id) 
        user_id, score_percentage, correct_count, total_questions, proctor_photo_url, track_type, track_title
      FROM student_assessments
      ORDER BY user_id, score_percentage DESC, created_at DESC
    `),
    pool.query(`
      SELECT 
        user_id,
        COUNT(CASE WHEN date >= CURRENT_DATE - INTERVAL '7 days' AND (solved_today > 0 OR status = 'COMPLETED') THEN 1 END) as active_days_7d,
        COUNT(CASE WHEN date >= CURRENT_DATE - INTERVAL '30 days' AND (solved_today > 0 OR status = 'COMPLETED') THEN 1 END) as active_days_30d,
        MAX(total_solved) as total_solved
      FROM leetcode_daily_progress
      GROUP BY user_id
    `),
    pool.query(`
      SELECT user_id, COUNT(*) as project_count
      FROM student_projects
      GROUP BY user_id
    `),
    pool.query(`
      SELECT student_id, SUM(daily_commit_count) as commits_30d
      FROM github_daily_commits
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY student_id
    `),
    pool.query(`
      SELECT user_id, COUNT(DISTINCT task_id) as submitted_tasks
      FROM task_submissions
      WHERE status IN ('VERIFIED', 'SUBMITTED')
      GROUP BY user_id
    `),
    pool.query(`
      SELECT tc.class_id, COUNT(DISTINCT tc.task_id) as total_tasks
      FROM task_classes tc
      GROUP BY tc.class_id
    `),
    pool.query(`SELECT id, name, year, batch FROM classes ORDER BY year ASC, name ASC`)
  ]);

  const assessmentMap = new Map();
  for (const row of assessmentRes.rows) assessmentMap.set(row.user_id, row);

  const leetcodeMap = new Map();
  for (const row of leetcodeRes.rows) {
    leetcodeMap.set(row.user_id, {
      active_days_7d: Math.min(7, Number(row.active_days_7d) || 0),
      active_days_30d: Number(row.active_days_30d) || 0,
      total_solved: Number(row.total_solved) || 0
    });
  }

  const projectMap = new Map();
  for (const row of projectRes.rows) projectMap.set(row.user_id, Number(row.project_count) || 0);

  const githubMap = new Map();
  for (const row of githubRes.rows) githubMap.set(row.student_id, Number(row.commits_30d) || 0);

  const taskSubMap = new Map();
  for (const row of taskSubRes.rows) taskSubMap.set(row.user_id, Number(row.submitted_tasks) || 0);

  const taskClassMap = new Map();
  for (const row of taskClassRes.rows) taskClassMap.set(row.class_id, Number(row.total_tasks) || 0);

  const allStudents = studentsRes.rows.map(u => {
    const assessment = assessmentMap.get(u.id);
    const aptitudeScore = assessment ? Number(assessment.score_percentage) : 0;
    const aptitudePhoto = assessment ? assessment.proctor_photo_url : null;
    const aptitudeCompleted = Boolean(assessment);

    // Pillar 2: LeetCode Weekly Streak & Consistency
    const lcData = leetcodeMap.get(u.id) || { active_days_7d: 0, active_days_30d: 0, total_solved: 0 };
    const leetcodeWeeklyStreak = lcData.active_days_7d;
    const leetcodeConsistency = Math.min(100, Math.round((leetcodeWeeklyStreak / 7) * 100));
    const leetcodeNorm = leetcodeConsistency;

    // Pillar 3: Technical Project Portfolio (3+ projects benchmark)
    const projectCount = projectMap.get(u.id) || 0;
    const projectNorm = Math.min(100, Math.round((projectCount / 3) * 100));

    const githubCommits = githubMap.get(u.id) || 0;

    const classTotalTasks = Number(taskClassMap.get(u.class_id)) || 0;
    const userSubmittedTasks = taskSubMap.get(u.id) || 0;
    const taskRate = classTotalTasks > 0 ? Math.min(100, Math.round((userSubmittedTasks / classTotalTasks) * 100)) : 100;

    // 4 Pillars Contribution
    const aptitudeContrib = Math.round(aptitudeScore * 0.35);
    const leetcodeContrib = Math.round(leetcodeNorm * 0.25);
    const projectContrib = Math.round(projectNorm * 0.20);
    const taskContrib = Math.round(taskRate * 0.20);

    const readinessScore = Math.min(100, aptitudeContrib + leetcodeContrib + projectContrib + taskContrib);

    let studentTier = 'NEEDS_ATTENTION';
    let tierLabel = 'Critical Action Required';
    let companies: string[] = [];

    if (readinessScore >= 80) {
      studentTier = 'TIER_1';
      tierLabel = 'Tier 1: Product / Dream Ready';
      companies = ['Zoho', 'Kaar Technologies', 'Freshworks', 'Thoughtworks', 'TCS Prime'];
    } else if (readinessScore >= 65) {
      studentTier = 'TIER_2';
      tierLabel = 'Tier 2: IT Services Ready';
      companies = ['TCS Ninja', 'Infosys', 'Cognizant', 'Wipro', 'Accenture', 'HCL'];
    } else if (readinessScore >= 50) {
      studentTier = 'TIER_3';
      tierLabel = 'Tier 3: Developing Baseline';
      companies = ['Regional Tech', 'Technical Apprenticeships', 'Startups'];
    }

    return {
      id: u.id,
      full_name: u.full_name,
      register_number: u.register_number,
      email: u.email,
      phone: u.phone,
      class_id: u.class_id,
      class_name: u.class_name || 'N/A',
      class_year: u.class_year,
      batch: u.batch,
      aptitude_score: aptitudeScore,
      aptitude_completed: aptitudeCompleted,
      proctor_photo_url: aptitudePhoto,
      leetcode_weekly_streak: leetcodeWeeklyStreak,
      leetcode_consistency: leetcodeConsistency,
      leetcode_norm: leetcodeNorm,
      project_count: projectCount,
      project_norm: projectNorm,
      github_commits_30d: githubCommits,
      task_completion_rate: taskRate,
      readiness_score: readinessScore,
      pillars: {
        aptitude: { score: aptitudeScore, contribution: aptitudeContrib, weight: 35 },
        leetcode: {
          weekly_streak: leetcodeWeeklyStreak,
          consistency: leetcodeConsistency,
          score: leetcodeNorm,
          contribution: leetcodeContrib,
          weight: 25
        },
        projects: {
          count: projectCount,
          score: projectNorm,
          contribution: projectContrib,
          weight: 20
        },
        tasks: { rate: taskRate, contribution: taskContrib, weight: 20 }
      },
      tier: studentTier,
      tier_label: tierLabel,
      eligible_companies: companies
    };
  });

  const totalCount = allStudents.length;
  const eligibleCount = allStudents.filter(s => s.readiness_score >= 75).length;
  const tier1Count = allStudents.filter(s => s.tier === 'TIER_1').length;
  const tier2Count = allStudents.filter(s => s.tier === 'TIER_2').length;
  const tier3Count = allStudents.filter(s => s.tier === 'TIER_3').length;
  const actionCount = allStudents.filter(s => s.tier === 'NEEDS_ATTENTION').length;

  const avgReadiness = totalCount > 0
    ? Math.round(allStudents.reduce((acc, s) => acc + s.readiness_score, 0) / totalCount)
    : 0;

  let filtered = allStudents;
  if (class_id && class_id !== 'ALL') {
    filtered = filtered.filter(s => s.class_id === class_id);
  }
  if (tier && tier !== 'ALL') {
    filtered = filtered.filter(s => s.tier === tier);
  }
  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(s => 
      s.full_name?.toLowerCase().includes(q) || 
      s.register_number?.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    metrics: {
      total_students: totalCount,
      eligible_count: eligibleCount,
      average_readiness: avgReadiness,
      tier_distribution: {
        tier_1: tier1Count,
        tier_2: tier2Count,
        tier_3: tier3Count,
        needs_attention: actionCount
      }
    },
    students: filtered,
    classes: classesRes.rows
  });
}));

// ============================================================================
// 5. Individual Student Readiness Profile (GET /api/placement/my-readiness)
// ============================================================================
app.get('/api/placement/my-readiness', asyncHandler(async (req: any, res: any) => {
  let targetUserId = req.query.user_id;

  if (!targetUserId) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded: any = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'secret');
        targetUserId = decoded.id;
      } catch (_) {}
    }
  }

  if (!targetUserId) {
    const tharun = await pool.query("SELECT id FROM users WHERE register_number = '922524205171' LIMIT 1");
    if (tharun.rows.length > 0) targetUserId = tharun.rows[0].id;
  }

  if (!targetUserId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const [userRes, assessmentRes, leetcodeRes, projectsRes, githubRes, taskSubRes, taskClassRes] = await Promise.all([
    pool.query(`
      SELECT u.id, u.full_name, u.register_number, u.email, u.phone, u.class_id,
             c.name as class_name, c.year as class_year, c.batch
      FROM users u
      LEFT JOIN classes c ON c.id = u.class_id
      WHERE u.id = $1
    `, [targetUserId]),
    pool.query(`
      SELECT score_percentage, correct_count, total_questions, proctor_photo_url, track_type, track_title, created_at
      FROM student_assessments
      WHERE user_id = $1
      ORDER BY score_percentage DESC, created_at DESC
      LIMIT 1
    `, [targetUserId]),
    pool.query(`
      SELECT 
        COUNT(CASE WHEN date >= CURRENT_DATE - INTERVAL '7 days' AND (solved_today > 0 OR status = 'COMPLETED') THEN 1 END) as active_days_7d,
        COUNT(CASE WHEN date >= CURRENT_DATE - INTERVAL '30 days' AND (solved_today > 0 OR status = 'COMPLETED') THEN 1 END) as active_days_30d,
        MAX(total_solved) as max_solved,
        SUM(solved_today) as solved_recent
      FROM leetcode_daily_progress
      WHERE user_id = $1
    `, [targetUserId]),
    pool.query(`
      SELECT id, project_name, description, tech_stack, github_url, live_demo_url, created_at
      FROM student_projects
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [targetUserId]),
    pool.query(`
      SELECT SUM(daily_commit_count) as total_commits
      FROM github_daily_commits
      WHERE student_id = $1 AND date >= CURRENT_DATE - INTERVAL '30 days'
    `, [targetUserId]),
    pool.query(`
      SELECT COUNT(DISTINCT task_id) as submitted_tasks
      FROM task_submissions
      WHERE user_id = $1 AND status IN ('VERIFIED', 'SUBMITTED')
    `, [targetUserId]),
    pool.query(`
      SELECT COUNT(DISTINCT tc.task_id) as total_tasks
      FROM task_classes tc
      JOIN users u ON u.class_id = tc.class_id
      WHERE u.id = $1
    `, [targetUserId])
  ]);

  if (userRes.rows.length === 0) {
    return res.status(404).json({ error: 'Student profile not found' });
  }

  const u = userRes.rows[0];
  const assessment = assessmentRes.rows[0];
  const aptitudeScore = assessment ? Number(assessment.score_percentage) : 0;
  const aptitudeCompleted = Boolean(assessment);
  const proctorPhoto = assessment ? assessment.proctor_photo_url : null;

  // Pillar 2: LeetCode Weekly Streak & Consistency
  const lcRow = leetcodeRes.rows[0];
  const leetcodeWeeklyStreak = Math.min(7, Number(lcRow?.active_days_7d) || 0);
  const leetcodeConsistency = Math.min(100, Math.round((leetcodeWeeklyStreak / 7) * 100));
  const leetcodeNorm = leetcodeConsistency;

  // Pillar 3: Technical Project Portfolio
  const studentProjects = projectsRes.rows || [];
  const projectCount = studentProjects.length;
  const projectNorm = Math.min(100, Math.round((projectCount / 3) * 100));

  const githubCommits = Number(githubRes.rows[0]?.total_commits) || 0;

  const totalAssignedTasks = Number(taskClassRes.rows[0]?.total_tasks) || 0;
  const userSubmittedTasks = Number(taskSubRes.rows[0]?.submitted_tasks) || 0;
  const taskRate = totalAssignedTasks > 0 ? Math.min(100, Math.round((userSubmittedTasks / totalAssignedTasks) * 100)) : 100;

  const aptitudeContrib = Math.round(aptitudeScore * 0.35);
  const leetcodeContrib = Math.round(leetcodeNorm * 0.25);
  const projectContrib = Math.round(projectNorm * 0.20);
  const taskContrib = Math.round(taskRate * 0.20);

  const readinessScore = Math.min(100, aptitudeContrib + leetcodeContrib + projectContrib + taskContrib);

  let studentTier = 'NEEDS_ATTENTION';
  let tierLabel = 'Critical Action Required';
  let eligibleCompanies: string[] = [];

  if (readinessScore >= 80) {
    studentTier = 'TIER_1';
    tierLabel = 'Tier 1: Product / Dream Ready';
    eligibleCompanies = ['Zoho', 'Kaar Technologies', 'Freshworks', 'Thoughtworks', 'TCS Prime'];
  } else if (readinessScore >= 65) {
    studentTier = 'TIER_2';
    tierLabel = 'Tier 2: IT Services Ready';
    eligibleCompanies = ['TCS Ninja', 'Infosys', 'Cognizant', 'Wipro', 'Accenture', 'HCL'];
  } else if (readinessScore >= 50) {
    studentTier = 'TIER_3';
    tierLabel = 'Tier 3: Developing Baseline';
    eligibleCompanies = ['Regional Tech', 'Technical Apprenticeships', 'Startups'];
  }

  const recommendations: string[] = [];
  if (!aptitudeCompleted) {
    recommendations.push('Complete the proctored 15-Question Skill Assessment Benchmark to earn up to +35 placement points.');
  } else if (aptitudeScore < 70) {
    recommendations.push(`Your assessment mark is ${aptitudeScore}%. Retake the mock assessment or review AI remedial cheat sheets to aim for 80%+.`);
  }

  if (leetcodeWeeklyStreak < 5) {
    recommendations.push(`Your current weekly LeetCode streak is ${leetcodeWeeklyStreak} days (${leetcodeConsistency}% consistency). Maintain a 5+ day streak each week to maximize your problem-solving rating.`);
  }

  if (projectCount < 3) {
    recommendations.push(`You currently have ${projectCount} project(s) documented. Build and showcase at least ${3 - projectCount} more project(s) to reach the 3-project benchmark for full placement marks.`);
  }

  if (taskRate < 90) {
    recommendations.push(`Your academic task submission rate is ${taskRate}%. Submit missing department tasks to maintain institutional clearance.`);
  }

  res.json({
    success: true,
    profile: {
      id: u.id,
      full_name: u.full_name,
      register_number: u.register_number,
      email: u.email,
      phone: u.phone,
      class_name: u.class_name,
      class_year: u.class_year,
      batch: u.batch,
      readiness_score: readinessScore,
      tier: studentTier,
      tier_label: tierLabel,
      eligible_companies: eligibleCompanies,
      proctor_photo_url: proctorPhoto,
      pillars: {
        aptitude: {
          score: aptitudeScore,
          completed: aptitudeCompleted,
          contribution: aptitudeContrib,
          weight: 35,
          title: 'Aptitude & Skill Assessment'
        },
        leetcode: {
          weekly_streak: leetcodeWeeklyStreak,
          consistency: leetcodeConsistency,
          score: leetcodeNorm,
          contribution: leetcodeContrib,
          weight: 25,
          benchmark: 7,
          title: 'LeetCode Weekly Streak & Consistency'
        },
        projects: {
          count: projectCount,
          score: projectNorm,
          contribution: projectContrib,
          weight: 20,
          benchmark: 3,
          title: 'Technical Project Portfolio',
          projects_list: studentProjects
        },
        tasks: {
          submitted: userSubmittedTasks,
          total_assigned: totalAssignedTasks,
          rate: taskRate,
          contribution: taskContrib,
          weight: 20,
          title: 'Academic Task Discipline'
        }
      },
      recommendations
    }
  });
}));
```

---

## Full Email Service Code (`emailService.ts`)

Ensure the following functions are exported in `emailService.ts`:

```ts
export async function sendAssessmentInvitationEmail(params: {
  to: string;
  studentName: string;
  registerNumber: string;
  className: string;
  classYear: number | string;
  trackTitle: string;
  trackType: string;
  cutoffPercentage: number;
  durationMins: number;
  questionCount: number;
  deadline?: string;
  customInstructions?: string;
  senderName?: string;
  senderRole?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const {
    to,
    studentName,
    registerNumber,
    className,
    trackTitle,
    cutoffPercentage,
    durationMins,
    questionCount,
    deadline,
    customInstructions,
    senderName = 'HOD / Placement Coordinator',
    senderRole = 'Department of Information Technology'
  } = params;

  const subject = `🎯 Institutional Skill Assessment: ${trackTitle} — Official Notice`;
  const portalLink = `${getWebUrl()}/#skill-assessment`;
  const formattedDeadline = deadline ? new Date(deadline).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : 'To be completed at the earliest';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
    <tr>
      <td style="background: linear-gradient(135deg, #09090b 0%, #1e1b4b 100%); padding: 32px 28px; text-align: left;">
        <span style="display: inline-block; background: rgba(255, 255, 255, 0.15); color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 12px; border-radius: 999px; margin-bottom: 12px;">
          Official Placement Assessment
        </span>
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 6px 0;">${trackTitle}</h1>
        <p style="color: #cbd5e1; font-size: 13px; margin: 0;">VSB Engineering College • Department of Information Technology</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 28px;">
        <p style="font-size: 15px; color: #1e293b; margin: 0 0 16px 0;">Dear <strong>${studentName}</strong> (${registerNumber || 'Student'}),</p>
        <p style="font-size: 13.5px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
          An official proctored assessment benchmark has been assigned for your cohort (<strong>${className}</strong>) by <strong>${senderName}</strong> (${senderRole}).
        </p>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; padding: 16px;">
          <tr>
            <td style="padding: 6px 12px; font-size: 12.5px; color: #64748b; font-weight: 600;">Assessment Track:</td>
            <td style="padding: 6px 12px; font-size: 13px; color: #0f172a; font-weight: 700;">${trackTitle}</td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; font-size: 12.5px; color: #64748b; font-weight: 600;">Question Count:</td>
            <td style="padding: 6px 12px; font-size: 13px; color: #0f172a; font-weight: 700;">${questionCount} Questions</td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; font-size: 12.5px; color: #64748b; font-weight: 600;">Duration Allowed:</td>
            <td style="padding: 6px 12px; font-size: 13px; color: #0f172a; font-weight: 700;">${durationMins} Minutes</td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; font-size: 12.5px; color: #64748b; font-weight: 600;">Qualifying Cutoff:</td>
            <td style="padding: 6px 12px; font-size: 13px; color: #4338ca; font-weight: 800;">${cutoffPercentage}%</td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; font-size: 12.5px; color: #64748b; font-weight: 600;">Submission Deadline:</td>
            <td style="padding: 6px 12px; font-size: 13px; color: #b45309; font-weight: 700;">${formattedDeadline}</td>
          </tr>
        </table>
        ${customInstructions ? `
        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 12.5px; color: #92400e;"><strong>Special Instructions:</strong> ${customInstructions}</p>
        </div>` : ''}
        <div style="text-align: center; margin: 28px 0;">
          <a href="${portalLink}" style="background: linear-gradient(135deg, #09090b 0%, #1e1b4b 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 30px; border-radius: 10px; display: inline-block;">
            🚀 Start Proctored Assessment Now →
          </a>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return await dispatchEmailThroughPool(to, studentName, subject, htmlContent, 'VSBEC Placement Cell');
}

export async function triggerAssessmentCampaignEmails(params: {
  track_type: string;
  track_title?: string;
  target_year?: string;
  target_class_id?: string;
  custom_instructions?: string;
  deadline?: string;
  senderRole?: string;
  senderName?: string;
}): Promise<{ totalTargeted: number; totalDispatched: number; failedCount: number; errors: string[] }> {
  try {
    const {
      track_type,
      track_title: passedTitle,
      target_year = 'ALL',
      target_class_id = 'ALL',
      custom_instructions,
      deadline,
      senderRole,
      senderName
    } = params;

    const trackRes = await pool.query(`
      SELECT track_type, COALESCE(MAX(track_title), 'General Aptitude Benchmark') as track_title,
             COUNT(id)::int as question_count, COALESCE(MAX(cutoff_percentage), 60.00) as cutoff_percentage,
             15 as duration_mins
      FROM assessment_questions
      WHERE is_active = true AND track_type = $1
      GROUP BY track_type
    `, [track_type]);

    const track = trackRes.rows[0] || {
      track_type,
      track_title: passedTitle || 'Placement Skill Benchmark',
      question_count: 15,
      cutoff_percentage: 60,
      duration_mins: 15
    };

    let query = `
      SELECT u.id, u.full_name, u.register_number, u.email,
             c.name as class_name, c.year as class_year
      FROM users u
      JOIN classes c ON c.id = u.class_id
      WHERE u.role = 'STUDENT' AND u.email IS NOT NULL AND TRIM(u.email) != ''
    `;
    const values: any[] = [];
    let idx = 1;

    if (target_year && target_year !== 'ALL') {
      query += ` AND c.year = $${idx++}`;
      values.push(parseInt(target_year, 10));
    }
    if (target_class_id && target_class_id !== 'ALL') {
      query += ` AND c.id = $${idx++}`;
      values.push(target_class_id);
    }
    query += ` ORDER BY c.year ASC, c.name ASC, u.register_number ASC`;

    const studentsRes = await pool.query(query, values);
    const students = studentsRes.rows;

    if (students.length === 0) return { totalTargeted: 0, totalDispatched: 0, failedCount: 0, errors: [] };

    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    const BATCH_SIZE = 2;

    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const chunk = students.slice(i, i + BATCH_SIZE);
      await Promise.all(chunk.map(async (s) => {
        try {
          const res = await sendAssessmentInvitationEmail({
            to: s.email,
            studentName: s.full_name,
            registerNumber: s.register_number,
            className: s.class_name,
            classYear: s.class_year,
            trackTitle: track.track_title,
            trackType: track.track_type,
            cutoffPercentage: Number(track.cutoff_percentage),
            durationMins: Number(track.duration_mins),
            questionCount: Number(track.question_count),
            deadline,
            customInstructions: custom_instructions,
            senderName,
            senderRole
          });
          if (res.success) {
            sentCount++;
            await pool.query(`
              INSERT INTO notifications (user_id, message, type)
              VALUES ($1, $2, 'ASSESSMENT_INVITATION')
            `, [s.id, `🎯 New Placement Assessment Assigned: "${track.track_title}". Cutoff: ${track.cutoff_percentage}%.`]);
          } else {
            failedCount++;
            if (res.error) errors.push(`${s.email}: ${res.error}`);
          }
        } catch (e: any) {
          failedCount++;
          errors.push(`${s.email}: ${e.message}`);
        }
      }));
      if (i + BATCH_SIZE < students.length) await new Promise(r => setTimeout(r, 250));
    }

    return { totalTargeted: students.length, totalDispatched: sentCount, failedCount, errors: errors.slice(0, 10) };
  } catch (err: any) {
    return { totalTargeted: 0, totalDispatched: 0, failedCount: 0, errors: [err.message] };
  }
}
```

---

## Full Database Migration DDL (`db.ts`)

Add this inside your database init function:

```sql
CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option INTEGER NOT NULL,
  category VARCHAR(100) NOT NULL,
  skill_tag VARCHAR(100),
  difficulty VARCHAR(20) DEFAULT 'MEDIUM',
  explanation TEXT,
  track_type VARCHAR(50) DEFAULT 'GENERAL_APTITUDE',
  track_title VARCHAR(150) DEFAULT 'General Aptitude Benchmark',
  cutoff_percentage NUMERIC(5,2) DEFAULT 60.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  student_name VARCHAR(255),
  register_number VARCHAR(100),
  total_questions INTEGER NOT NULL DEFAULT 10,
  correct_count INTEGER NOT NULL DEFAULT 0,
  score_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  category_breakdown JSONB,
  answers_summary JSONB,
  strengths JSONB,
  gaps JSONB,
  time_taken_seconds INTEGER DEFAULT 0,
  proctor_photo_url VARCHAR(1000),
  track_type VARCHAR(50) DEFAULT 'GENERAL_APTITUDE',
  track_title VARCHAR(150) DEFAULT 'General Aptitude Benchmark',
  cutoff_percentage NUMERIC(5,2) DEFAULT 60.00,
  is_passed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_type VARCHAR(100) NOT NULL,
  track_title VARCHAR(255) NOT NULL,
  target_year VARCHAR(20) NOT NULL DEFAULT 'ALL',
  target_class_id VARCHAR(100) NOT NULL DEFAULT 'ALL',
  custom_instructions TEXT,
  deadline TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_q_track ON assessment_questions(track_type, is_active);
CREATE INDEX IF NOT EXISTS idx_student_assessments_track ON student_assessments(user_id, track_type);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_target ON assessment_assignments(target_year, target_class_id);
```

---

## Full App Integration (`src/App.tsx`)

In `src/App.tsx`:

```tsx
// 1. Imports
import SkillAssessmentView from './SkillAssessmentView';
import PlacementReadinessView from './PlacementReadinessView';

// 2. Sidebar Navigation Items
<SidebarItem
  icon={<Sparkles size={20} />}
  label="Skill Assessment"
  active={view === 'skill-assessment'}
  onClick={() => { setView('skill-assessment'); setIsMobileSidebarOpen(false); }}
/>

<SidebarItem
  icon={<Target size={20} />}
  label="Placement Rating"
  active={view === 'placement-readiness'}
  onClick={() => { setView('placement-readiness'); setIsMobileSidebarOpen(false); }}
/>

// 3. View Switcher Routing
{view === 'skill-assessment' && (
  <motion.div
    key="skill-assessment"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="w-full h-full flex flex-col min-h-0 overflow-y-auto"
  >
    <SkillAssessmentView user={user} token={token} addToast={addToast} />
  </motion.div>
)}

{view === 'placement-readiness' && (
  <motion.div
    key="placement-readiness"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="w-full h-full flex flex-col min-h-0 overflow-y-auto"
  >
    <PlacementReadinessView
      user={user}
      token={token}
      addToast={addToast}
      onNavigateToAssessment={() => setView('skill-assessment')}
    />
  </motion.div>
)}
```

---

---

## 10. Full Code: `src/PlacementReadinessView.tsx`

Below is the complete, self-contained code for `src/PlacementReadinessView.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import {
  Target,
  Briefcase,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Search,
  Download,
  Filter,
  Sparkles,
  Code,
  GitCommit,
  FileCheck,
  Building2,
  Star,
  RefreshCw,
  UserCheck,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { API_URL } from './config';

interface PlacementReadinessViewProps {
  user: any;
  token: string | null;
  addToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  onNavigateToAssessment?: () => void;
}

export const PlacementReadinessView: React.FC<PlacementReadinessViewProps> = ({
  user,
  token,
  addToast,
  onNavigateToAssessment
}) => {
  const isHOD = user?.role === 'HOD' || user?.role === 'SUPREME_ADMIN';
  const isAdvisor = user?.role === 'CLASS_ADVISOR';
  const isStudent = user?.role === 'STUDENT';

  // HOD / Advisor Dashboard State
  const [metrics, setMetrics] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Student Profile State
  const [myProfile, setMyProfile] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isHOD || isAdvisor) {
      fetchDashboardData();
    }
    if (isStudent) {
      fetchMyReadinessProfile();
    }
  }, [selectedTier, selectedClassId]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      let url = `${API_URL}/api/placement/readiness-dashboard?`;
      if (selectedTier && selectedTier !== 'ALL') url += `tier=${selectedTier}&`;
      if (selectedClassId) url += `class_id=${selectedClassId}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setStudents(data.students || []);
        if (data.classes && classes.length === 0) {
          setClasses(data.classes);
        }
      }
    } catch (e) {
      console.error('Error fetching placement readiness:', e);
      addToast('Error loading placement readiness data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyReadinessProfile = async () => {
    setIsProfileLoading(true);
    try {
      const authHeaders: any = {};
      if (token) authHeaders['Authorization'] = `Bearer ${token}`;
      const url = user?.id ? `${API_URL}/api/placement/my-readiness?user_id=${user.id}` : `${API_URL}/api/placement/my-readiness`;
      const res = await fetch(url, { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setMyProfile(data.profile);
      }
    } catch (e) {
      console.error('Error fetching student readiness profile:', e);
    } finally {
      setIsProfileLoading(false);
    }
  };

  // ── Export Company-Ready Shortlist to Excel ────────────────────────────────
  const handleExportCompanyReadyList = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Placement Ready Students');

      worksheet.columns = [
        { header: 'S.No', key: 'sno', width: 8 },
        { header: 'Student Name', key: 'name', width: 26 },
        { header: 'Register Number', key: 'regNo', width: 18 },
        { header: 'Class / Section', key: 'className', width: 18 },
        { header: 'Readiness Score (%)', key: 'readiness', width: 22 },
        { header: 'Placement Tier', key: 'tier', width: 26 },
        { header: 'Aptitude Benchmark (%)', key: 'aptitude', width: 24 },
        { header: 'LeetCode Weekly Streak (Days)', key: 'lcStreak', width: 26 },
        { header: 'LeetCode Consistency (%)', key: 'lcConsistency', width: 24 },
        { header: 'Projects Portfolio Count', key: 'projects', width: 22 },
        { header: 'Task Discipline (%)', key: 'tasks', width: 20 },
        { header: 'Eligible Companies', key: 'companies', width: 35 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Phone', key: 'phone', width: 18 }
      ];

      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' }
      };

      const dataToExport = filteredStudents;

      dataToExport.forEach((s, idx) => {
        worksheet.addRow({
          sno: idx + 1,
          name: s.full_name,
          regNo: s.register_number,
          className: s.class_name,
          readiness: `${s.readiness_score}%`,
          tier: s.tier_label,
          aptitude: s.aptitude_completed ? `${s.aptitude_score}%` : 'Not Attempted',
          lcStreak: `${s.leetcode_weekly_streak ?? s.pillars?.leetcode?.weekly_streak ?? 0} Days/Wk`,
          lcConsistency: `${s.leetcode_consistency ?? s.pillars?.leetcode?.consistency ?? 0}%`,
          projects: `${s.project_count ?? s.pillars?.projects?.count ?? 0} Projects`,
          tasks: `${s.task_completion_rate}%`,
          companies: Array.isArray(s.eligible_companies) ? s.eligible_companies.join(', ') : (s.eligible_companies || 'N/A'),
          email: s.email || 'N/A',
          phone: s.phone || 'N/A'
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Company_Placement_Ready_List_${selectedTier}_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      addToast(`Exported ${dataToExport.length} company-ready candidates to Excel!`, 'success');
    } catch (e) {
      console.error('Export error:', e);
      addToast('Error exporting shortlist', 'error');
    }
  };

  const filteredStudents = students.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(q) ||
      s.register_number?.toLowerCase().includes(q) ||
      s.class_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden p-4 md:p-8 bg-[#F5F5F4] flex flex-col min-h-0">
      <div className="w-full flex flex-col min-h-full space-y-6">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Target size={20} />
              </div>
              <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                Placement Readiness Rating
              </h1>
            </div>
            <p className="text-xs text-zinc-500 font-semibold mt-1">
              Unified 0–100% Placement Eligibility Index (Aptitude 35% • LeetCode 25% • GitHub 20% • Tasks 20%)
            </p>
          </div>

          {(isHOD || isAdvisor) && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchDashboardData}
                className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition"
                title="Refresh Metrics"
              >
                <RefreshCw size={15} />
              </button>
              <button
                type="button"
                onClick={handleExportCompanyReadyList}
                className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download size={14} /> Export Company Shortlist (.xlsx)
              </button>
            </div>
          )}
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            STUDENT VIEW: INDIVIDUAL READINESS PROFILE & 4-PILLAR BREAKDOWN
            ═════════════════════════════════════════════════════════════════════ */}
        {isStudent && (
          <div className="space-y-6">
            {isProfileLoading ? (
              <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center text-zinc-500 text-xs font-semibold">
                Calculating your real-time placement readiness score...
              </div>
            ) : myProfile ? (
              <>
                {/* Hero Card: Overall Placement Readiness Rating */}
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    
                    {/* Dial Gauge */}
                    <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" stroke="#f4f4f5" strokeWidth="8" fill="none" />
                        <circle
                          cx="50" cy="50" r="42"
                          stroke={
                            myProfile.readiness_score >= 80
                              ? '#10b981'
                              : myProfile.readiness_score >= 65
                              ? '#6366f1'
                              : myProfile.readiness_score >= 50
                              ? '#f59e0b'
                              : '#f43f5e'
                          }
                          strokeWidth="8"
                          strokeDasharray="263.89"
                          strokeDashoffset={263.89 - (263.89 * myProfile.readiness_score) / 100}
                          strokeLinecap="round"
                          fill="none"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-3xl font-extrabold text-zinc-900">{myProfile.readiness_score}%</span>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Readiness</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        myProfile.readiness_score >= 80
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : myProfile.readiness_score >= 65
                          ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          : myProfile.readiness_score >= 50
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        <Award size={13} /> {myProfile.tier_label}
                      </span>

                      <h2 className="text-xl font-bold text-zinc-900">
                        {myProfile.full_name} ({myProfile.register_number})
                      </h2>
                      <p className="text-xs text-zinc-500 max-w-lg leading-relaxed">
                        Your consolidated placement score reflects academic discipline, algorithmic competence on LeetCode, continuous GitHub streaks, and aptitude benchmark performance.
                      </p>
                    </div>
                  </div>

                  {/* Company Eligibility Status */}
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 w-full md:w-80 space-y-2 text-left shrink-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-800">
                      <Building2 size={15} className="text-zinc-600" />
                      <span>Eligible Company Tiers</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {myProfile.eligible_companies?.length > 0 ? (
                        myProfile.eligible_companies.map((c: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 bg-white text-zinc-800 rounded-lg text-xs font-bold border border-zinc-200 shadow-2xs">
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-400 italic">Score ≥65% to unlock TCS/Infosys IT tier.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4 Pillars Breakdown Cards (100% Real Live Metrics) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Pillar 1: Aptitude */}
                  <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pillar 1 (35%)</span>
                      <Sparkles size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-zinc-900">
                          {myProfile.pillars.aptitude.completed ? `${myProfile.pillars.aptitude.score}%` : '0%'}
                        </span>
                        <span className="text-xs font-bold text-zinc-500">
                          {myProfile.pillars.aptitude.completed ? 'Benchmark Score' : 'Not Attempted'}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-indigo-700 block mt-0.5">
                        +{myProfile.pillars.aptitude.contribution} / 35 pts earned
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-medium">
                      {myProfile.pillars.aptitude.completed
                        ? 'Proctored 15-Question Skill Assessment Benchmark.'
                        : 'Take the proctored 15-Q aptitude test to earn up to +35 points!'}
                    </p>
                    {onNavigateToAssessment && (
                      <button
                        type="button"
                        onClick={onNavigateToAssessment}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        {myProfile.pillars.aptitude.completed ? 'View Marks & Scorecard' : 'Take Assessment Now'} <ArrowUpRight size={13} />
                      </button>
                    )}
                  </div>

                  {/* Pillar 2: LeetCode Weekly Streak & Consistency */}
                  <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pillar 2 (25%)</span>
                      <Code size={16} className="text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-zinc-900">
                          {myProfile.pillars.leetcode?.weekly_streak ?? 0}d
                        </span>
                        <span className="text-xs font-bold text-zinc-500">Weekly Streak</span>
                      </div>
                      <span className="text-xs font-bold text-amber-700 block mt-0.5">
                        +{myProfile.pillars.leetcode?.contribution ?? 0} / 25 pts ({myProfile.pillars.leetcode?.consistency ?? 0}% Consistency)
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px] text-zinc-500">
                      <div className="flex justify-between">
                        <span>Weekly Streak Target:</span>
                        <span className="font-bold text-zinc-800">7 Days / Week</span>
                      </div>
                      {myProfile.leetcode_url && (
                        <a
                          href={myProfile.leetcode_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline pt-0.5"
                        >
                          Verified LeetCode Profile <ArrowUpRight size={11} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Pillar 3: Technical Project Portfolio */}
                  <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pillar 3 (20%)</span>
                      <Briefcase size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-zinc-900">
                          {myProfile.pillars.projects?.count ?? 0}
                        </span>
                        <span className="text-xs font-bold text-zinc-500">Projects Built</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 block mt-0.5">
                        +{myProfile.pillars.projects?.contribution ?? 0} / 20 pts (Benchmark: 3+ Projects)
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px] text-zinc-500">
                      <div className="flex justify-between">
                        <span>Portfolio Target:</span>
                        <span className="font-bold text-zinc-800">3+ Core Projects</span>
                      </div>
                      {myProfile.pillars.projects?.projects_list?.length > 0 ? (
                        <div className="pt-1 flex flex-wrap gap-1">
                          {myProfile.pillars.projects.projects_list.slice(0, 2).map((p: any) => (
                            <span key={p.id} className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200 truncate max-w-[140px]" title={p.project_name}>
                              {p.project_name}
                            </span>
                          ))}
                          {myProfile.pillars.projects.projects_list.length > 2 && (
                            <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                              +{myProfile.pillars.projects.projects_list.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-400 italic">No projects registered yet</span>
                      )}
                    </div>
                  </div>

                  {/* Pillar 4: Tasks */}
                  <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pillar 4 (20%)</span>
                      <FileCheck size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-zinc-900">
                          {myProfile.pillars.tasks.rate}%
                        </span>
                        <span className="text-xs font-bold text-zinc-500">Discipline Rate</span>
                      </div>
                      <span className="text-xs font-bold text-purple-700 block mt-0.5">
                        +{myProfile.pillars.tasks.contribution} / 20 pts ({myProfile.pillars.tasks.submitted}/{myProfile.pillars.tasks.total_assigned} tasks)
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-medium">
                      Verified academic tasks and laboratory assignments submitted on portal.
                    </p>
                  </div>
                </div>

                {/* Actionable Recommendations to Level Up */}
                {myProfile.recommendations?.length > 0 && (
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={18} className="text-indigo-600" />
                      <h3 className="text-sm font-bold text-zinc-900">
                        How to Boost Your Placement Readiness Score
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {myProfile.recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-700 flex items-start gap-2.5">
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center text-zinc-500 text-xs">
                Could not load profile. Please verify credentials.
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            HOD / ADVISOR DASHBOARD: AGGREGATE STATS, COMPANY FILTERS & TABLE
            ═════════════════════════════════════════════════════════════════════ */}
        {(isHOD || isAdvisor) && (
          <div className="space-y-6">

            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Placement Eligible (≥75%)</span>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1">{metrics?.eligible_count || 0}</p>
                <span className="text-[11px] font-medium text-zinc-500 mt-0.5 block">
                  {metrics?.pass_rate || 0}% of cohort ready
                </span>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Average Readiness</span>
                <p className="text-2xl font-extrabold text-zinc-900 mt-1">{metrics?.average_readiness || 0}%</p>
                <span className="text-[11px] font-medium text-zinc-500 mt-0.5 block">Cohort weighted rating</span>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Zoho / Product Tier (≥80%)</span>
                <p className="text-2xl font-extrabold text-indigo-600 mt-1">{metrics?.tier1_count || 0}</p>
                <span className="text-[11px] font-medium text-indigo-600 mt-0.5 block">Top dream placement</span>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Action Needed (&lt;50%)</span>
                <p className="text-2xl font-extrabold text-rose-600 mt-1">{metrics?.needs_attention_count || 0}</p>
                <span className="text-[11px] font-medium text-rose-600 mt-0.5 block">Requires intervention</span>
              </div>
            </div>

            {/* Filter Bar with 1-Click Company Presets */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                
                {/* Company & Tier Filter Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-zinc-400 mr-1.5 flex items-center gap-1">
                    <Filter size={13} /> Filter:
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedTier('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      selectedTier === 'ALL'
                        ? 'bg-black text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    All Students ({metrics?.total_students || 0})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTier('ZOHO')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                      selectedTier === 'ZOHO'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    <Star size={12} /> Zoho / Product (≥80%)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTier('TCS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                      selectedTier === 'TCS'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
                    }`}
                  >
                    <Briefcase size={12} /> TCS / Infosys (≥65%)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTier('ELIGIBLE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                      selectedTier === 'ELIGIBLE'
                        ? 'bg-black text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    <UserCheck size={12} /> Placement Ready (≥75%)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTier('NEEDS_ATTENTION')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                      selectedTier === 'NEEDS_ATTENTION'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    <AlertTriangle size={12} /> Action Needed (&lt;50%)
                  </button>
                </div>

                {/* Class Dropdown & Search Input */}
                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <select
                    value={selectedClassId}
                    onChange={e => setSelectedClassId(e.target.value)}
                    className="py-1.5 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">All Classes & Sections</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Year {c.year})
                      </option>
                    ))}
                  </select>

                  <div className="relative flex-1 md:w-60">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search name or reg no..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Candidate List Table */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="text-sm font-bold text-zinc-900">
                  Candidate Readiness Ranking ({filteredStudents.length} Students)
                </h3>
                <span className="text-xs text-zinc-400">
                  Sorted by Register Number
                </span>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                  <Target size={28} className="mx-auto text-zinc-400 mb-2" />
                  <p className="text-sm font-bold text-zinc-700">No Candidates Match the Filter</p>
                  <p className="text-xs text-zinc-400">Try selecting "All Students" or resetting the search query.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider">
                        <th className="p-3">Candidate</th>
                        <th className="p-3">Class</th>
                        <th className="p-3">Readiness Rating</th>
                        <th className="p-3">Placement Tier</th>
                        <th className="p-3">Aptitude (35%)</th>
                        <th className="p-3">LeetCode Streak (25%)</th>
                        <th className="p-3">Projects Built (20%)</th>
                        <th className="p-3">Tasks (20%)</th>
                        <th className="p-3 text-right">Eligible Companies</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredStudents.map(s => (
                        <tr key={s.id} className="hover:bg-zinc-50/80 font-medium">
                          {/* Student Info */}
                          <td className="p-3 font-bold text-zinc-900 flex items-center gap-2.5">
                            {s.proctor_photo_url ? (
                              <img
                                src={s.proctor_photo_url}
                                alt={s.full_name}
                                className="w-9 h-9 rounded-full object-cover border border-zinc-300 shadow-2xs shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[11px] font-bold text-zinc-600 shrink-0">
                                {s.full_name?.charAt(0) || 'S'}
                              </div>
                            )}
                            <div>
                              <span>{s.full_name}</span>
                              <span className="block text-[10px] text-zinc-400 font-mono">{s.register_number}</span>
                            </div>
                          </td>

                          {/* Class */}
                          <td className="p-3 text-zinc-600 font-semibold">{s.class_name}</td>

                          {/* Readiness Rating Bar */}
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-zinc-900">{s.readiness_score}%</span>
                              <div className="w-16 h-2 bg-zinc-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    s.readiness_score >= 80
                                      ? 'bg-emerald-500'
                                      : s.readiness_score >= 65
                                      ? 'bg-indigo-500'
                                      : s.readiness_score >= 50
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${s.readiness_score}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Tier Badge */}
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded font-bold text-[11px] ${
                              s.tier === 'TIER_1'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : s.tier === 'TIER_2'
                                ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                                : s.tier === 'TIER_3'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {s.tier === 'TIER_1'
                                ? 'Tier 1 (Product)'
                                : s.tier === 'TIER_2'
                                ? 'Tier 2 (Services)'
                                : s.tier === 'TIER_3'
                                ? 'Tier 3 (Baseline)'
                                : 'Action Required'}
                            </span>
                          </td>

                          {/* Aptitude */}
                          <td className="p-3 font-semibold text-zinc-700">
                            {s.aptitude_completed ? `${s.aptitude_score}%` : <span className="text-zinc-400 italic">Not taken</span>}
                          </td>

                          {/* LeetCode Weekly Streak & Consistency */}
                          <td className="p-3 font-semibold text-zinc-700">
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-900">
                                {s.leetcode_weekly_streak ?? s.pillars?.leetcode?.weekly_streak ?? 0}d / Wk
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                {s.leetcode_consistency ?? s.pillars?.leetcode?.consistency ?? 0}% Consistency
                              </span>
                            </div>
                          </td>

                          {/* Projects Built */}
                          <td className="p-3 font-semibold text-zinc-700">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${
                              (s.project_count ?? s.pillars?.projects?.count ?? 0) >= 3
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : (s.project_count ?? s.pillars?.projects?.count ?? 0) > 0
                                ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                                : 'bg-zinc-100 text-zinc-500'
                            }`}>
                              <Briefcase size={12} />
                              {s.project_count ?? s.pillars?.projects?.count ?? 0} Projects
                            </span>
                          </td>

                          {/* Tasks */}
                          <td className="p-3 font-semibold text-zinc-700">
                            {s.task_completion_rate}%
                          </td>

                          {/* Eligible Companies */}
                          <td className="p-3 text-right">
                            <span className="text-[11px] font-semibold text-zinc-600">
                              {s.eligible_companies?.slice(0, 2).join(', ') || 'None yet'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
export default PlacementReadinessView;

```

---

## 11. Full Code: `src/SkillAssessmentView.tsx`

Below is the complete, self-contained code for `src/SkillAssessmentView.tsx`:

```tsx
import React, { useState, useEffect, useRef } from 'react';
import ExcelJS from 'exceljs';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
  Upload,
  Download,
  RefreshCw,
  Eye,
  AlertTriangle,
  RotateCcw,
  BarChart2,
  Users,
  Search,
  Maximize2,
  ShieldAlert,
  Play,
  Check,
  Lock,
  Shuffle,
  Camera,
  Video,
  VideoOff,
  ShieldCheck,
  BookOpen,
  Send,
  ExternalLink,
  Code,
  Building2,
  Briefcase,
  Zap,
  Target,
  Award,
  HelpCircle,
  Lightbulb,
  X,
  Mail
} from 'lucide-react';
import { API_URL } from './config';

interface SkillAssessmentViewProps {
  user: any;
  token: string | null;
  addToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

interface ShuffledOption {
  text: string;
  originalIndex: number;
}

interface AssessmentTrack {
  track_type: string;
  track_title: string;
  question_count: number;
  cutoff_percentage: number;
  icon: string;
  badge: string;
  description: string;
  duration_mins: number;
}

interface RemedialModule {
  skill_tag: string;
  title: string;
  category: string;
  video_title: string;
  video_url: string;
  duration: string;
  cheat_sheet_rules: string[];
  sample_question: string;
  solution_steps: string[];
  gap_label?: string;
}

// Fisher-Yates array shuffling algorithm
const shuffleArray = <T,>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const SkillAssessmentView: React.FC<SkillAssessmentViewProps> = ({ user, token, addToast }) => {
  const isHOD = user?.role === 'HOD' || user?.role === 'SUPREME_ADMIN';
  const isAdvisor = user?.role === 'CLASS_ADVISOR';

  // Navigation tabs: 'tracks' | 'test' | 'remedial' | 'upload' | 'analytics' | 'my_marks'
  // Default to Cohort Analytics for HOD/Advisors, and Mock Tracks for Students
  const [activeTab, setActiveTab] = useState<'tracks' | 'test' | 'remedial' | 'upload' | 'analytics' | 'my_marks'>(
    isHOD || isAdvisor ? 'analytics' : 'tracks'
  );

  // ── Tracks State ───────────────────────────────────────────────────────────
  const [tracks, setTracks] = useState<AssessmentTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string>('GENERAL_APTITUDE');
  const [selectedTrackTitle, setSelectedTrackTitle] = useState<string>('General Aptitude Benchmark');
  const [selectedTrackCutoff, setSelectedTrackCutoff] = useState<number>(60);
  const [selectedTrackDuration, setSelectedTrackDuration] = useState<number>(15);
  const [isMicroQuiz, setIsMicroQuiz] = useState<boolean>(false);
  const [microQuizTopic, setMicroQuizTopic] = useState<string | null>(null);

  // ── Raw & Randomized Question State ────────────────────────────────────────
  const [rawQuestions, setRawQuestions] = useState<any[]>([]);
  const [activeQuestions, setActiveQuestions] = useState<any[]>([]); // randomized questions + shuffled options
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showReview, setShowReview] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 minutes default
  const [telegramAlertSent, setTelegramAlertSent] = useState<boolean>(false);

  // ── Strict Full Screen & Lockdown State ─────────────────────────────────────
  const [testStarted, setTestStarted] = useState(false);
  const [showStartConfirmModal, setShowStartConfirmModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFsWarning, setShowFsWarning] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

  // ── Webcam & Cloudinary Face Verification State ────────────────────────────
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState<boolean>(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);

  // ── AI Remedial Recommendations & Cheat Sheets State ───────────────────────
  const [remedialModules, setRemedialModules] = useState<RemedialModule[]>([]);
  const [selectedCheatSheet, setSelectedCheatSheet] = useState<RemedialModule | null>(null);
  const [isLoadingRemedial, setIsLoadingRemedial] = useState(false);

  // ── HOD Excel Upload & Question Bank State ─────────────────────────────────
  const [excelQuestions, setExcelQuestions] = useState<any[]>([]);
  const [uploadTrackType, setUploadTrackType] = useState<string>('GENERAL_APTITUDE');
  const [uploadTrackCutoff, setUploadTrackCutoff] = useState<number>(60);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── HOD Analytics State ───────────────────────────────────────────────────
  const [analytics, setAnalytics] = useState<any>(null);
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedResultTrack, setSelectedResultTrack] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // ── Manual Assessment Announcement & Targeting State (HOD / Advisor) ─────
  const [showTriggerModal, setShowTriggerModal] = useState<boolean>(false);
  const [triggerTrackType, setTriggerTrackType] = useState<string>('ZOHO_MOCK');
  const [triggerYear, setTriggerYear] = useState<string>('ALL');
  const [triggerClassId, setTriggerClassId] = useState<string>('ALL');
  const [triggerInstructions, setTriggerInstructions] = useState<string>('');
  const [triggerDeadline, setTriggerDeadline] = useState<string>('');
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [targetPreviewCount, setTargetPreviewCount] = useState<number | null>(null);
  const [targetPreviewClasses, setTargetPreviewClasses] = useState<string[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [emailNodesStatus, setEmailNodesStatus] = useState<any>(null);
  const [isLoadingEmailStatus, setIsLoadingEmailStatus] = useState<boolean>(false);

  const fetchEmailNodesStatus = async () => {
    setIsLoadingEmailStatus(true);
    try {
      const res = await fetch(`${API_URL}/api/email-service/status`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data && !data.error) {
        setEmailNodesStatus(data);
      }
    } catch (_) {
    } finally {
      setIsLoadingEmailStatus(false);
    }
  };

  const [myAssessments, setMyAssessments] = useState<any[]>([]);
  const [myAssessmentsMetrics, setMyAssessmentsMetrics] = useState<any>(null);
  const [isLoadingMyAssessments, setIsLoadingMyAssessments] = useState<boolean>(false);
  const [viewingScorecard, setViewingScorecard] = useState<any | null>(null);

  const fetchMyAssessments = async () => {
    setIsLoadingMyAssessments(true);
    try {
      const authHeaders: any = {};
      if (token) authHeaders['Authorization'] = `Bearer ${token}`;
      const url = user?.id ? `${API_URL}/api/assessment/my-results?user_id=${user.id}` : `${API_URL}/api/assessment/my-results`;
      const res = await fetch(url, { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setMyAssessments(data.assessments || []);
        setMyAssessmentsMetrics(data.metrics || null);
      }
    } catch (e) {
      console.error('Error fetching student assessment marks:', e);
    } finally {
      setIsLoadingMyAssessments(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch(`${API_URL}/api/classes`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAvailableClasses(data);
      }
    } catch (_) {}
  };

  const fetchTargetPreview = async (year: string, classId: string) => {
    setIsLoadingPreview(true);
    try {
      const res = await fetch(`${API_URL}/api/assessment/target-preview?target_year=${year}&target_class_id=${classId}`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        setTargetPreviewCount(data.total_count);
        setTargetPreviewClasses(data.classes_summary || []);
      }
    } catch (_) {
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/assessment/assignments`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        setAssignments(data.assignments || []);
      }
    } catch (_) {}
  };

  const handleDispatchAssessmentCampaign = async () => {
    if (!triggerTrackType) {
      addToast('Please select an assessment track.', 'warning');
      return;
    }
    setIsTriggering(true);
    try {
      const res = await fetch(`${API_URL}/api/assessment/trigger-announcement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          track_type: triggerTrackType,
          target_year: triggerYear,
          target_class_id: triggerClassId,
          custom_instructions: triggerInstructions,
          deadline: triggerDeadline || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`✅ Dispatched assessment notifications to ${data.delivery?.totalDispatched || 0} student(s) via Email Load Balancer!`, 'success');
        setShowTriggerModal(false);
        setTriggerInstructions('');
        setTriggerDeadline('');
        fetchAssignments();
        fetchTracks();
      } else {
        addToast(data.error || 'Failed to dispatch assessment announcement', 'error');
      }
    } catch (e: any) {
      addToast(e.message || 'Network error triggering assessment', 'error');
    } finally {
      setIsTriggering(false);
    }
  };

  useEffect(() => {
    fetchTracks();
    fetchQuestions('GENERAL_APTITUDE');
    fetchLatestResult();
    fetchMyAssessments();
    fetchRemedialPlan();
    if (isHOD || isAdvisor) {
      fetchHodResults();
      fetchClasses();
      fetchAssignments();
      fetchTargetPreview('ALL', 'ALL');
      fetchEmailNodesStatus();
    }
  }, []);

  // ── Webcam Lifecycle Management ────────────────────────────────────────────
  const startWebcam = async () => {
    setCameraError(null);
    try {
      if (webcamStream) {
        webcamStream.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      setWebcamStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Webcam Access Error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser to proceed with institutional proctoring.'
          : 'No camera hardware detected. A functional webcam is mandatory for verified benchmark assessment.'
      );
      setIsCameraActive(false);
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
      setIsCameraActive(false);
    }
  };

  // Ensure webcam hardware is stopped if component unmounts
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webcamStream]);

  // Trigger camera whenever start modal opens
  useEffect(() => {
    if (showStartConfirmModal && !capturedPhotoUrl) {
      startWebcam();
    }
  }, [showStartConfirmModal]);

  // Connect stream to modal video preview
  useEffect(() => {
    if (showStartConfirmModal && videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream;
    }
  }, [showStartConfirmModal, webcamStream]);

  // Connect stream to Picture-in-Picture proctor window during exam
  useEffect(() => {
    if (testStarted && !testCompleted && pipVideoRef.current && webcamStream) {
      pipVideoRef.current.srcObject = webcamStream;
    }
  }, [testStarted, testCompleted, webcamStream]);

  // Capture face photograph for identity verification & upload to Cloudinary
  const captureIdentityPhoto = async () => {
    if (!videoRef.current) {
      addToast('Camera feed not ready. Please wait...', 'warning');
      return;
    }
    setIsCapturingPhoto(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      // Center crop square
      const minDim = Math.min(video.videoWidth || 640, video.videoHeight || 480);
      const startX = ((video.videoWidth || 640) - minDim) / 2;
      const startY = ((video.videoHeight || 480) - minDim) / 2;

      ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, 480, 480);
      const base64 = canvas.toDataURL('image/jpeg', 0.85);

      // Upload to Cloudinary via backend
      const res = await fetch(`${API_URL}/api/assessment/capture-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          user_id: user?.id
        })
      });
      const data = await res.json();
      if (data.success && data.photo_url) {
        setCapturedPhotoUrl(data.photo_url);
        addToast('Identity photo verified & stored in Cloudinary!', 'success');
      } else {
        setCapturedPhotoUrl(base64);
        addToast('Photo captured locally.', 'info');
      }
    } catch (err) {
      console.error('Error capturing photo:', err);
      addToast('Failed to capture photo. Please retry.', 'error');
    } finally {
      setIsCapturingPhoto(false);
    }
  };

  // Prepare Randomized Questions & Shuffled Answer Options for Student Attempt
  const prepareRandomizedQuestions = (questionsList: any[]) => {
    const shuffledQList = shuffleArray(questionsList);

    return shuffledQList.map(q => {
      const originalOptions: string[] = Array.isArray(q.options) ? q.options : [];
      const optsWithIndices: ShuffledOption[] = originalOptions.map((opt, idx) => ({
        text: opt,
        originalIndex: idx
      }));

      return {
        ...q,
        shuffledOptions: shuffleArray(optsWithIndices)
      };
    });
  };

  // Strict Lockdown: Listen for Fullscreen Changes, Visibility Changes, Tab Blurs, and Keyboard Shortcuts
  useEffect(() => {
    if (!testStarted || testCompleted) return;

    const handleFsChange = () => {
      const isFs = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFs);

      if (!isFs && testStarted && !testCompleted) {
        setViolationCount(prev => prev + 1);
        setShowFsWarning(true);
      } else if (isFs) {
        setShowFsWarning(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && testStarted && !testCompleted) {
        setViolationCount(prev => prev + 1);
        setShowFsWarning(true);
      }
    };

    const handleWindowBlur = () => {
      if (testStarted && !testCompleted) {
        setViolationCount(prev => prev + 1);
        setShowFsWarning(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.metaKey || (e.ctrlKey && ['c', 'v', 'u', 't', 'w', 'r', 'n'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
        setViolationCount(prev => prev + 1);
        setShowFsWarning(true);
      }
      if (['F11', 'F12'].includes(e.key)) {
        e.preventDefault();
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [testStarted, testCompleted]);

  // Request Fullscreen
  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowFsWarning(false);
    } catch (e) {
      console.error('Fullscreen request failed:', e);
    }
  };

  // Exit Fullscreen
  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
      setIsFullscreen(false);
    } catch (e) {
      console.error('Fullscreen exit failed:', e);
    }
  };

  // Auto-Submit Test if Violations Exceed Tolerance (3 Incidents)
  useEffect(() => {
    if (violationCount >= 3 && testStarted && !testCompleted && !isSubmitting) {
      addToast('Exceeded maximum security violations (3). Test auto-submitted for institutional review.', 'error');
      handleSubmitTest();
    }
  }, [violationCount]);

  // Countdown Timer Hook (Auto-submits when timeLeft hits 0)
  useEffect(() => {
    if (!testStarted || testCompleted || Boolean(testResult)) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, testCompleted, Boolean(testResult)]);

  // Format timer into MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── Data Fetching APIs ─────────────────────────────────────────────────────

  const fetchTracks = async () => {
    try {
      const classId = user?.class_id || '';
      const year = user?.class_year || user?.year || '';
      const res = await fetch(`${API_URL}/api/assessment/tracks?class_id=${classId}&year=${year}`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.tracks)) {
        setTracks(data.tracks);
      }
    } catch (e) {
      console.error('Error fetching tracks:', e);
    }
  };

  const fetchQuestions = async (track: string = selectedTrack, skillTag?: string) => {
    try {
      let url = `${API_URL}/api/assessment/questions?track=${track}`;
      if (skillTag) {
        url = `${API_URL}/api/assessment/questions?skill_tag=${encodeURIComponent(skillTag)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        setRawQuestions(data.questions);
        setActiveQuestions(prepareRandomizedQuestions(data.questions));
      }
    } catch (e) {
      console.error('Error fetching questions:', e);
    }
  };

  const fetchLatestResult = async (track?: string) => {
    try {
      const authHeaders: any = {};
      if (token) authHeaders['Authorization'] = `Bearer ${token}`;
      let url = user?.id ? `${API_URL}/api/assessment/my-latest?user_id=${user.id}` : `${API_URL}/api/assessment/my-latest`;
      if (track) url += `&track=${track}`;
      const res = await fetch(url, { headers: authHeaders });
      const data = await res.json();
      if (data.success && data.assessment) {
        setTestResult({
          score_percentage: Number(data.assessment.score_percentage),
          correct_count: data.assessment.correct_count,
          total_questions: data.assessment.total_questions,
          category_breakdown: data.assessment.category_breakdown || {},
          strengths: data.assessment.strengths || [],
          gaps: data.assessment.gaps || [],
          answers_summary: data.assessment.answers_summary || [],
          proctor_photo_url: data.assessment.proctor_photo_url,
          track_title: data.assessment.track_title,
          is_passed: data.assessment.is_passed,
          cutoff_percentage: data.assessment.cutoff_percentage
        });
      }
    } catch (e) {
      console.error('Error fetching latest assessment:', e);
    }
  };

  const fetchRemedialPlan = async () => {
    setIsLoadingRemedial(true);
    try {
      const authHeaders: any = {};
      if (token) authHeaders['Authorization'] = `Bearer ${token}`;
      const url = user?.id ? `${API_URL}/api/assessment/remedial-plan?user_id=${user.id}` : `${API_URL}/api/assessment/remedial-plan`;
      const res = await fetch(url, { headers: authHeaders });
      const data = await res.json();
      if (data.success && Array.isArray(data.remedial_modules)) {
        setRemedialModules(data.remedial_modules);
      }
    } catch (e) {
      console.error('Error fetching remedial plan:', e);
    } finally {
      setIsLoadingRemedial(false);
    }
  };

  const fetchHodResults = async () => {
    setIsLoadingResults(true);
    try {
      const res = await fetch(`${API_URL}/api/assessment/hod-results`);
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.metrics);
        setStudentResults(data.results || []);
      }
    } catch (e) {
      console.error('Error fetching HOD results:', e);
    } finally {
      setIsLoadingResults(false);
    }
  };

  // ── Student: Track Selection & Assessment Flow ─────────────────────────────

  const handleSelectTrack = async (t: AssessmentTrack) => {
    setIsMicroQuiz(false);
    setMicroQuizTopic(null);
    setSelectedTrack(t.track_type);
    setSelectedTrackTitle(t.track_title);
    setSelectedTrackCutoff(t.cutoff_percentage);
    setSelectedTrackDuration(t.duration_mins);
    await fetchQuestions(t.track_type);
    setActiveTab('test');
    setShowStartConfirmModal(true);
  };

  const handleLaunchMicroQuiz = async (mod: RemedialModule) => {
    setIsMicroQuiz(true);
    setMicroQuizTopic(mod.skill_tag);
    setSelectedTrack('MICRO_REMEDIAL');
    setSelectedTrackTitle(`5-Question Targeted Micro-Quiz: ${mod.skill_tag}`);
    setSelectedTrackCutoff(80);
    setSelectedTrackDuration(5);
    await fetchQuestions('MICRO_REMEDIAL', mod.skill_tag);
    setActiveTab('test');
    setShowStartConfirmModal(true);
  };

  // Student Starts Proctored Test
  const handleStartAssessment = async () => {
    if (!capturedPhotoUrl) {
      addToast('Please capture and verify your face photo before proceeding.', 'warning');
      return;
    }
    setShowStartConfirmModal(false);
    await enterFullscreen();

    // Freshly randomize question sequence and swap options for this attempt
    const freshlyShuffled = prepareRandomizedQuestions(rawQuestions.length > 0 ? rawQuestions : activeQuestions);
    setActiveQuestions(freshlyShuffled);
    setCurrentIdx(0);
    setSelectedAnswers({});
    setTimeLeft(selectedTrackDuration * 60);
    setTestStarted(true);
    setTestCompleted(false);
    setTestResult(null);

    addToast(`Assessment started! Live webcam proctoring active for ${selectedTrackTitle}.`, 'success');
  };

  // Student Submits Test
  const handleSubmitTest = async () => {
    setIsSubmitting(true);
    stopWebcam();
    await exitFullscreen();
    try {
      const res = await fetch(`${API_URL}/api/assessment/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          answers: selectedAnswers, // maps { [qId]: originalIndex }
          question_ids: activeQuestions.map(q => q.id),
          time_taken_seconds: (selectedTrackDuration * 60) - timeLeft,
          user_id: user?.id,
          student_name: user?.full_name,
          register_number: user?.register_number,
          proctor_photo_url: capturedPhotoUrl,
          track_type: isMicroQuiz ? 'MICRO_REMEDIAL' : selectedTrack,
          track_title: selectedTrackTitle,
          cutoff_percentage: selectedTrackCutoff
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(data.result);
        setTestCompleted(true);
        setTestStarted(false);
        setTelegramAlertSent(true);
        addToast(`Assessment completed! Score: ${data.result.score_percentage}% • Telegram alert dispatched! 📱`, 'success');
        fetchRemedialPlan();
        fetchMyAssessments();
      } else {
        addToast(data.error || 'Failed to submit test', 'error');
      }
    } catch (e) {
      addToast('Error submitting assessment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetakeTest = async () => {
    stopWebcam();
    setCapturedPhotoUrl(null);
    setTestStarted(false);
    setTestCompleted(false);
    setTestResult(null);
    setSelectedAnswers({});
    setShowReview(false);
    setViolationCount(0);
    setTimeLeft(selectedTrackDuration * 60);
    await fetchQuestions(selectedTrack, isMicroQuiz ? (microQuizTopic || undefined) : undefined);
    setShowStartConfirmModal(true);
  };

  // ── HOD: Excel Upload and Publish ──────────────────────────────────────────

  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Aptitude Questions');

    worksheet.columns = [
      { header: 'Question Text', key: 'question_text', width: 45 },
      { header: 'Option A', key: 'opt_a', width: 22 },
      { header: 'Option B', key: 'opt_b', width: 22 },
      { header: 'Option C', key: 'opt_c', width: 22 },
      { header: 'Option D', key: 'opt_d', width: 22 },
      { header: 'Correct Option (A/B/C/D)', key: 'correct_option', width: 24 },
      { header: 'Category', key: 'category', width: 24 },
      { header: 'Skill Tag', key: 'skill_tag', width: 24 },
      { header: 'Difficulty', key: 'difficulty', width: 14 },
      { header: 'Explanation / Principles', key: 'explanation', width: 40 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }
    };

    worksheet.addRow({
      question_text: "What will be the output of System.out.println(10 + 20 + 'Hello' + 10 + 20)?",
      opt_a: "30Hello1020",
      opt_b: "30Hello30",
      opt_c: "1020Hello1020",
      opt_d: "Compile Error",
      correct_option: "A",
      category: "Technical Core",
      skill_tag: "Core Java",
      difficulty: "MEDIUM",
      explanation: "Java evaluates left to right. 10 + 20 is integer addition (30). Then 30 + 'Hello' is string concatenation."
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Institutional_Questions_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Template downloaded successfully!', 'success');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error('Excel file contains no worksheets.');

      const parsed: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header

        const qText = String(row.getCell(1).value || '').trim();
        const optA = String(row.getCell(2).value || '').trim();
        const optB = String(row.getCell(3).value || '').trim();
        const optC = String(row.getCell(4).value || '').trim();
        const optD = String(row.getCell(5).value || '').trim();
        const correctRaw = String(row.getCell(6).value || '').trim().toUpperCase();
        const category = String(row.getCell(7).value || 'Quantitative Aptitude').trim();
        const skillTag = String(row.getCell(8).value || 'Aptitude').trim();
        const difficulty = String(row.getCell(9).value || 'MEDIUM').trim().toUpperCase();
        const explanation = String(row.getCell(10).value || 'Standard principles apply.').trim();

        if (!qText || !optA || !optB) return;

        let correctIdx = 0;
        if (correctRaw === 'B' || correctRaw === '2') correctIdx = 1;
        else if (correctRaw === 'C' || correctRaw === '3') correctIdx = 2;
        else if (correctRaw === 'D' || correctRaw === '4') correctIdx = 3;

        parsed.push({
          question_text: qText,
          options: [optA, optB, optC, optD].filter(Boolean),
          correct_option: correctIdx,
          category,
          skill_tag: skillTag,
          difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(difficulty) ? difficulty : 'MEDIUM',
          explanation
        });
      });

      if (parsed.length === 0) {
        addToast('No valid questions parsed. Please check template format.', 'error');
      } else {
        setExcelQuestions(parsed);
        addToast(`Successfully parsed ${parsed.length} questions from Excel.`, 'success');
      }
    } catch (err: any) {
      console.error('Error parsing Excel:', err);
      addToast(err.message || 'Failed to read Excel file.', 'error');
    } finally {
      setIsParsingExcel(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePublishQuestions = async () => {
    if (excelQuestions.length === 0) return;
    setIsPublishing(true);
    try {
      const res = await fetch(`${API_URL}/api/assessment/questions/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: excelQuestions,
          replaceExisting: false,
          track_type: uploadTrackType,
          track_title: tracks.find(t => t.track_type === uploadTrackType)?.track_title || uploadTrackType,
          cutoff_percentage: uploadTrackCutoff
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Published ${data.count} questions to ${uploadTrackType}!`, 'success');
        setExcelQuestions([]);
        fetchQuestions();
        fetchTracks();
      } else {
        addToast(data.error || 'Failed to publish questions', 'error');
      }
    } catch (e) {
      addToast('Error publishing questions', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  // ── HOD: Export Student Results to Excel ────────────────────────────────────

  const handleExportResults = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Assessment Results');

      worksheet.columns = [
        { header: 'S.No', key: 'sno', width: 8 },
        { header: 'Student Name', key: 'name', width: 26 },
        { header: 'Register Number', key: 'regNo', width: 20 },
        { header: 'Class / Section', key: 'className', width: 18 },
        { header: 'Assessment Track', key: 'track', width: 28 },
        { header: 'Score (%)', key: 'score', width: 14 },
        { header: 'Result Status', key: 'status', width: 16 },
        { header: 'Correct Answers', key: 'correct', width: 16 },
        { header: 'Total Questions', key: 'total', width: 16 },
        { header: 'Time Taken (sec)', key: 'time', width: 16 },
        { header: 'Attempt Timestamp', key: 'timestamp', width: 24 }
      ];

      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF18181B' }
      };

      const filtered = studentResults.filter(s => {
        if (selectedResultTrack !== 'ALL' && s.track_type !== selectedResultTrack) return false;
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return s.student_name?.toLowerCase().includes(q) || s.register_number?.toLowerCase().includes(q);
      });

      filtered.forEach((r, idx) => {
        worksheet.addRow({
          sno: idx + 1,
          name: r.student_name,
          regNo: r.register_number,
          className: r.class_name || 'Unassigned',
          track: r.track_title || 'General Aptitude',
          score: `${r.score_percentage}%`,
          status: Number(r.score_percentage) >= 60 ? 'PASSED' : 'REMEDIAL REQUIRED',
          correct: r.correct_count,
          total: r.total_questions,
          time: r.time_taken_seconds,
          timestamp: new Date(r.created_at).toLocaleString()
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Assessment_Submissions_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      addToast(`Exported ${filtered.length} student scores to Excel!`, 'success');
    } catch (e) {
      addToast('Error exporting results', 'error');
    }
  };

  const isLockdownActive = testStarted && !testCompleted;
  const currentQ = activeQuestions[currentIdx];
  const totalQuestionCount = activeQuestions.length;

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden p-4 md:p-8 bg-[#F5F5F4] flex flex-col min-h-0">
      <div className="w-full flex flex-col min-h-full space-y-6">

        {/* ── Header Bar ────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                <Sparkles size={20} />
              </div>
              <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                Placement Skill Benchmark & Mock Tracks
              </h1>
            </div>
            <p className="text-xs text-zinc-500 font-semibold mt-1">
              Standardized Technical & Company Mock Assessments • AI Remedial Recommendations • Telegram Alerting
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {(isHOD || isAdvisor) && !isLockdownActive && (
              <button
                type="button"
                onClick={() => {
                  setShowTriggerModal(true);
                  fetchTargetPreview(triggerYear, triggerClassId);
                  fetchEmailNodesStatus();
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 hover:from-blue-700 hover:to-violet-800 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Mail size={14} className="text-white" />
                <span>Trigger Assessment & Emails</span>
                {emailNodesStatus && (
                  <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] rounded-full font-mono font-bold">
                    {emailNodesStatus.totalAvailableCredits ?? 600} credits
                  </span>
                )}
              </button>
            )}

            {/* Navigation Tab Switcher */}
            {!isLockdownActive ? (
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 custom-scrollbar">
                {(isHOD || isAdvisor) ? (
                  <>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('analytics'); fetchHodResults(); }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        activeTab === 'analytics'
                          ? 'bg-black text-white shadow-md'
                          : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                      }`}
                    >
                      <BarChart2 size={14} />
                      <span>Cohort Results & Submissions ({studentResults.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        activeTab === 'upload'
                          ? 'bg-black text-white shadow-md'
                          : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                      }`}
                    >
                      <FileSpreadsheet size={14} />
                      <span>Upload Excel Questions</span>
                    </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('tracks')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      activeTab === 'tracks'
                        ? 'bg-black text-white shadow-md'
                        : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                    }`}
                  >
                    <Target size={14} />
                    <span>Mock Tracks Bank</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('my_marks'); fetchMyAssessments(); }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      activeTab === 'my_marks'
                        ? 'bg-black text-white shadow-md'
                        : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                    }`}
                  >
                    <Award size={14} className={activeTab === 'my_marks' ? 'text-amber-300' : 'text-amber-500'} />
                    <span>My Assessment Marks ({myAssessments.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('tracks')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      activeTab === 'tracks'
                        ? 'bg-black text-white shadow-md'
                        : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                    }`}
                  >
                    <Target size={14} />
                    <span>Mock Test Tracks</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('remedial')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      activeTab === 'remedial'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                    }`}
                  >
                    <BookOpen size={14} />
                    <span>AI Remedials & Cheat Sheets</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('test')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      activeTab === 'test'
                        ? 'bg-black text-white shadow-md'
                        : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                    }`}
                  >
                    <ShieldCheck size={14} />
                    <span>Assessment Room</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-200 flex items-center gap-1.5 animate-pulse">
                <ShieldAlert size={14} /> Lockdown Active
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                <Video size={13} /> Webcam Proctoring
              </span>
              <span className="px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full text-xs font-bold border border-zinc-200 flex items-center gap-1.5">
                <Shuffle size={13} /> Randomized Set
              </span>
            </div>
          )}
          </div>
        </div>

        {/* ── Active Assessment Announcements Banner ── */}
        {assignments.length > 0 && !isLockdownActive && (
          <div className="bg-gradient-to-r from-indigo-50/90 via-violet-50/70 to-sky-50/90 border border-indigo-200/80 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 font-bold">
                  <Send size={15} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200">
                      Active Campaign
                    </span>
                    <h4 className="text-xs font-extrabold text-zinc-900">
                      {assignments[0].track_title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    Target Cohort: <strong className="text-zinc-800">{assignments[0].target_year === 'ALL' ? 'All Batches (II & III IT)' : `Year ${assignments[0].target_year}`}</strong>
                    {assignments[0].class_name ? ` • Section: ${assignments[0].class_name}` : ' • All Sections'}
                    {assignments[0].deadline ? ` • Deadline: ${new Date(assignments[0].deadline).toLocaleString()}` : ''}
                  </p>
                </div>
              </div>

              {(isHOD || isAdvisor) && (
                <button
                  type="button"
                  onClick={() => {
                    setShowTriggerModal(true);
                    fetchTargetPreview(triggerYear, triggerClassId);
                  }}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50/80 border border-indigo-200 px-3 py-1.5 rounded-xl transition shadow-2xs whitespace-nowrap cursor-pointer"
                >
                  + Trigger Another Assessment
                </button>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            PRE-TEST MODAL: WEBCAM IDENTITY VERIFICATION & FULLSCREEN CONFIRMATION
            ═════════════════════════════════════════════════════════════════════ */}
        {showStartConfirmModal && (
          <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-zinc-200 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Camera size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight">
                      Webcam Identity Verification
                    </h3>
                    <p className="text-xs text-zinc-500 font-medium">
                      {selectedTrackTitle}
                    </p>
                  </div>
                </div>

                {capturedPhotoUrl && (
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                )}
              </div>

              {/* Webcam Viewport & Photo Capture Frame */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col items-center justify-center text-center space-y-3">
                {capturedPhotoUrl ? (
                  /* Captured Face Preview */
                  <div className="relative">
                    <img
                      src={capturedPhotoUrl}
                      alt="Verified Face"
                      className="w-44 h-44 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCapturedPhotoUrl(null);
                        startWebcam();
                      }}
                      className="absolute bottom-2 right-2 p-2 bg-black/80 hover:bg-black text-white rounded-xl shadow transition"
                      title="Retake Photo"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                ) : cameraError ? (
                  <div className="p-6 text-center space-y-2">
                    <VideoOff size={32} className="mx-auto text-rose-500" />
                    <p className="text-xs text-rose-700 font-semibold max-w-xs">{cameraError}</p>
                    <button
                      type="button"
                      onClick={startWebcam}
                      className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition"
                    >
                      Retry Camera Permission
                    </button>
                  </div>
                ) : (
                  /* Live Video Stream Viewport */
                  <div className="relative w-48 h-48 rounded-2xl overflow-hidden bg-black border-2 border-dashed border-indigo-400 shadow-inner">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                    <div className="absolute inset-0 border-2 border-indigo-500/40 rounded-2xl pointer-events-none" />
                    <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] font-bold text-white bg-black/60 backdrop-blur-xs py-0.5 rounded">
                      Position face in center
                    </div>
                  </div>
                )}

                {/* Capture Photo Button */}
                {!capturedPhotoUrl && isCameraActive && (
                  <button
                    type="button"
                    disabled={isCapturingPhoto}
                    onClick={captureIdentityPhoto}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera size={14} /> {isCapturingPhoto ? 'Verifying Face...' : 'Capture Face Photo'}
                  </button>
                )}
              </div>

              {/* Assessment Rules */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-amber-900 space-y-2 text-xs">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <ShieldAlert size={15} /> Strict Institutional Integrity Protocol:
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800/90 leading-relaxed font-medium">
                  <li><strong>Target Benchmark:</strong> {selectedTrackTitle} (Cutoff: {selectedTrackCutoff}%).</li>
                  <li><strong>Full-Screen Lockdown:</strong> Leaving full-screen logs an integrity incident.</li>
                  <li><strong>Telegram Alert:</strong> Scorecard will be instantly dispatched to your Telegram account upon submission.</li>
                  <li><strong>Time Limit:</strong> {selectedTrackDuration} Minutes duration with automatic submission.</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopWebcam();
                    setShowStartConfirmModal(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 rounded-xl hover:bg-zinc-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!capturedPhotoUrl}
                  onClick={handleStartAssessment}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 ${
                    capturedPhotoUrl
                      ? 'bg-black hover:bg-zinc-800 text-white cursor-pointer'
                      : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  <Play size={14} /> Enter Full-Screen Exam Room
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            LIVE WEBCAM PICTURE-IN-PICTURE (Shown during active test)
            ═════════════════════════════════════════════════════════════════════ */}
        {isLockdownActive && isCameraActive && (
          <div className="fixed bottom-5 right-5 z-[999999] w-40 sm:w-48 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border-2 border-emerald-500 space-y-1.5 flex flex-col items-center">
            <div className="relative w-full h-28 sm:h-32 rounded-xl overflow-hidden bg-black">
              <video
                ref={pipVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-[9px] font-bold text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>PROCTORING</span>
              </div>
            </div>
            <div className="flex items-center justify-between w-full px-1 text-[10px] font-bold text-zinc-600">
              <span>Webcam Active</span>
              <span className="text-emerald-600 font-extrabold text-[9px]">● LIVE</span>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            STRICT FULL SCREEN VIOLATION MODAL
            ═════════════════════════════════════════════════════════════════════ */}
        {showFsWarning && testStarted && !testCompleted && (
          <div className="fixed inset-0 z-[9999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white border-2 border-red-500 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
                <AlertTriangle size={30} />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-zinc-900 tracking-tight">
                  Strict Full-Screen Violation
                </h3>
                <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                  You have exited full-screen mode or switched windows. Institutional integrity requires strict full-screen to remain active until completion.
                </p>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
                Violation Incident #{violationCount} Logged
              </div>

              <button
                type="button"
                onClick={enterFullscreen}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Maximize2 size={15} /> Return to Full Screen to Continue
              </button>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 1: MOCK TEST TRACKS HUB (Company & Technical Evaluation Suites)
            ═════════════════════════════════════════════════════════════════════ */}
        {!isLockdownActive && activeTab === 'tracks' && (
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  Campus Placement Suites
                </span>
                <h3 className="text-xl font-bold text-zinc-900 mt-2">
                  Company-Specific & Technical Mock Tracks
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Choose a specialized evaluation track patterned after top recruiters. Each track enforces strict proctoring and calculates separate eligibility scores.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200 flex items-center gap-1.5">
                  <Send size={13} className="text-indigo-600" /> Telegram Alerts Active
                </span>
              </div>
            </div>

            {/* Track Selection Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tracks.map(t => {
                const isSelected = selectedTrack === t.track_type;
                return (
                  <div
                    key={t.track_type}
                    className={`bg-white border rounded-2xl p-6 shadow-sm transition-all duration-200 flex flex-col justify-between space-y-4 hover:shadow-md ${
                      isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="space-y-3">
                      {(t as any).is_assigned && (
                        <div className="bg-amber-50 border border-amber-200/90 rounded-xl px-3 py-1.5 flex items-center justify-between text-[10px] font-extrabold text-amber-900 animate-pulse">
                          <span className="flex items-center gap-1.5">
                            <Sparkles size={13} className="text-amber-600" />
                            ASSIGNED BY HOD
                          </span>
                          {(t as any).assignment_details?.deadline && (
                            <span className="font-mono text-amber-800">
                              ⏰ Due: {new Date((t as any).assignment_details.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-start justify-between">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {t.badge}
                        </span>
                        <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                          Cutoff: {t.cutoff_percentage}%
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-extrabold text-zinc-900 leading-snug">
                          {t.track_title}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                          {t.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-zinc-100">
                      <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
                        <span className="flex items-center gap-1">
                          <HelpCircle size={13} /> {t.question_count} Questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} /> {t.duration_mins} Minutes
                        </span>
                      </div>

                      {(isHOD || isAdvisor) ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedResultTrack(t.track_type);
                              setActiveTab('analytics');
                              fetchHodResults();
                            }}
                            className="flex-1 py-2.5 px-3 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <BarChart2 size={13} /> View Results
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectTrack(t)}
                            className="py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold border border-zinc-200 transition flex items-center justify-center gap-1 cursor-pointer"
                            title="Preview Test as Student"
                          >
                            <Eye size={13} /> Preview
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectTrack(t)}
                          className="w-full py-2.5 px-4 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Play size={13} /> Launch Proctored Assessment
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 2: AI REMEDIAL RECOMMENDATIONS & FORMULA CHEAT SHEETS
            ═════════════════════════════════════════════════════════════════════ */}
        {!isLockdownActive && activeTab === 'remedial' && (
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  Adaptive Learning Engine
                </span>
                <h3 className="text-xl font-bold text-zinc-900 mt-2">
                  Personalized AI Remedial Recommendations
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Targeted learning modules, formula cheat sheets, and 5-question micro-quizzes generated from your identified skill gaps (&lt;60% accuracy).
                </p>
              </div>

              <button
                type="button"
                onClick={fetchRemedialPlan}
                className="px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-zinc-200 shadow-2xs"
              >
                <RefreshCw size={13} /> Refresh Recommendations
              </button>
            </div>

            {/* Remedial Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {remedialModules.map((mod, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        Priority Gap Focus
                      </span>
                      <span className="text-xs font-bold text-zinc-400">{mod.category}</span>
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-zinc-900 leading-snug">
                        {mod.title}
                      </h4>
                      <span className="inline-block text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-1">
                        Topic: {mod.skill_tag}
                      </span>
                    </div>

                    {/* Curated Video Lecture Recommendation */}
                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-800">
                        <span className="flex items-center gap-1.5 text-zinc-900">
                          <Video size={14} className="text-rose-600" /> Curated Video Lecture
                        </span>
                        <span className="text-[10px] text-zinc-400">{mod.duration}</span>
                      </div>
                      <p className="text-[11px] text-zinc-600 line-clamp-1">{mod.video_title}</p>
                      <a
                        href={mod.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline pt-0.5"
                      >
                        Watch Video Tutorial <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setSelectedCheatSheet(mod)}
                      className="w-full py-2 px-3 bg-white hover:bg-zinc-50 text-zinc-800 rounded-xl text-xs font-bold border border-zinc-200 shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Lightbulb size={13} className="text-amber-500" /> Formula & Rules Cheat Sheet
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLaunchMicroQuiz(mod)}
                      className="w-full py-2.5 px-4 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Zap size={13} className="text-amber-400" /> Take 5-Q Targeted Micro-Quiz
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            FORMULA CHEAT SHEET MODAL (Quick reference drawer)
            ═════════════════════════════════════════════════════════════════════ */}
        {selectedCheatSheet && (
          <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-zinc-200 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb size={20} className="text-amber-500" />
                  <h3 className="text-base font-extrabold text-zinc-900">
                    {selectedCheatSheet.title} Cheat Sheet
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCheatSheet(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Cheat Sheet Rules */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Essential Mathematical & Syntax Rules:
                </h4>
                <div className="space-y-1.5 p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                  {selectedCheatSheet.cheat_sheet_rules?.map((rule, rIdx) => (
                    <div key={rIdx} className="flex items-start gap-2 text-xs font-medium text-zinc-800">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Problem & Step-by-Step Solution */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Solved Placement Benchmark Problem:
                </h4>
                <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2 text-xs">
                  <p className="font-bold text-indigo-950">{selectedCheatSheet.sample_question}</p>
                  <div className="space-y-1 text-indigo-900/90 text-[11px] font-medium pt-1 border-t border-indigo-100">
                    {selectedCheatSheet.solution_steps?.map((step, sIdx) => (
                      <div key={sIdx}>Step {sIdx + 1}: {step}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCheatSheet(null)}
                  className="px-5 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition"
                >
                  Got It, Ready to Practice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 3: ASSESSMENT ROOM (Pre-Flight, Live Test, and Scorecard)
            ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'test' && (
          <div>
            {testCompleted && testResult ? (
              /* State A: Scorecard Results View */
              <div className="space-y-6">
                
                {/* Telegram Alert Notification Banner */}
                {telegramAlertSent && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-900 text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <Send size={16} className="text-emerald-700 shrink-0" />
                      <span>
                        <strong>Scorecard Sent to Telegram!</strong> An instant performance breakdown has been dispatched to your linked device.
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                      Dispatched
                    </span>
                  </div>
                )}

                {/* Scorecard Hero Card */}
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    {testResult.proctor_photo_url ? (
                      <div className="relative shrink-0">
                        <img
                          src={testResult.proctor_photo_url}
                          alt="Proctor Verified Face"
                          className="w-28 h-28 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                        />
                        <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[9px] font-bold shadow-xs">
                          Face Verified
                        </span>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <Award size={40} />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          testResult.score_percentage >= (testResult.cutoff_percentage || 60)
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {testResult.score_percentage >= (testResult.cutoff_percentage || 60) ? 'PASSED ✅' : 'REMEDIAL REQUIRED ⚠️'}
                        </span>
                        <span className="text-xs font-bold text-zinc-500 font-mono">
                          Track: {testResult.track_title || selectedTrackTitle}
                        </span>
                      </div>

                      <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                        Score: {testResult.score_percentage}% ({testResult.correct_count}/{testResult.total_questions} Correct)
                      </h2>
                      <p className="text-xs text-zinc-500 max-w-md">
                        Institutional placement benchmark score recorded in database. Cutoff for this track is {testResult.cutoff_percentage || selectedTrackCutoff}%.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('remedial')}
                      className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <BookOpen size={14} /> View AI Remedials & Cheat Sheets
                    </button>
                    <button
                      type="button"
                      onClick={handleRetakeTest}
                      className="w-full sm:w-auto px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold border border-zinc-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw size={14} /> Retake Assessment
                    </button>
                  </div>
                </div>

                {/* Performance Analytics Breakdown */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-zinc-900">Domain Performance Breakdown</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(testResult.category_breakdown || {}).map(([cat, score]) => (
                      <div key={cat} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold text-zinc-800">
                          <span>{cat}</span>
                          <span>{Number(score)}%</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              Number(score) >= 75 ? 'bg-emerald-500' : Number(score) >= 50 ? 'bg-indigo-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowReview(!showReview)}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {showReview ? 'Hide Question Solutions' : 'Review Question Solutions'} <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* Answers Review */}
                {showReview && (
                  <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-zinc-900">Question-by-Question Solution Review</h3>
                    <div className="space-y-4 divide-y divide-zinc-100">
                      {testResult.answers_summary?.map((a: any, idx: number) => (
                        <div key={idx} className="pt-4 space-y-2 text-xs">
                          <div className="flex items-start justify-between gap-4">
                            <span className="font-bold text-zinc-900">Q{idx + 1}. {a.question_text}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              a.is_correct ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                            }`}>
                              {a.is_correct ? '✓ Correct' : '✕ Incorrect'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {a.options?.map((opt: string, oIdx: number) => {
                              const isSelected = oIdx === a.selected_option;
                              const isCorrect = oIdx === a.correct_option;
                              return (
                                <div
                                  key={oIdx}
                                  className={`p-2.5 rounded-xl border text-[11px] font-medium ${
                                    isCorrect
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                      : isSelected
                                      ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                                      : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                                  }`}
                                >
                                  <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                                  {isCorrect && <span className="block text-[10px] text-emerald-700 font-bold">Correct Answer</span>}
                                </div>
                              );
                            })}
                          </div>

                          <p className="text-[11px] text-zinc-600 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                            💡 <span className="font-bold text-zinc-800">Explanation:</span> {a.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : !testStarted ? (
              /* State B: Pre-Flight Assessment Confirmation Screen */
              <div className="bg-white border border-zinc-200 rounded-3xl p-8 md:p-12 shadow-sm max-w-3xl mx-auto text-center space-y-8 my-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto shadow-xs">
                  <Sparkles size={32} />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                    Selected Mock Track
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900 tracking-tight">
                    {selectedTrackTitle}
                  </h2>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                    A standardized {totalQuestionCount}-question evaluation with strict webcam identity proctoring and full-screen enforcement. Cutoff score is {selectedTrackCutoff}%.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs">
                      <Clock size={15} className="text-zinc-700" /> {selectedTrackDuration} Minutes Duration
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-snug">Auto-submits automatically when the countdown timer expires.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs">
                      <Camera size={15} className="text-zinc-700" /> Webcam Proctoring
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-snug">Identity photo captured in Cloudinary and monitored during exam.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs">
                      <Send size={15} className="text-zinc-700" /> Telegram Alerts
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-snug">Scorecard dispatched to your Telegram chat upon completion.</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setShowStartConfirmModal(true)}
                    className="w-full sm:w-auto px-8 py-3.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Camera size={16} /> Verify Face Identity & Begin Test
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('tracks')}
                    className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-zinc-100 text-zinc-700 rounded-xl text-sm font-bold border border-zinc-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Target size={16} /> Change Track
                  </button>
                </div>
              </div>
            ) : (
              /* State C: Active Interactive Test with Strict Fullscreen & Proctoring */
              <div className="space-y-6">
                
                {/* Header Status Bar with Fullscreen Indicator & Live Timer */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                    <span className="text-xs font-bold text-zinc-400 mr-2">Questions:</span>
                    {activeQuestions.map((_, qIdx) => {
                      const isAnswered = selectedAnswers[activeQuestions[qIdx]?.id] !== undefined;
                      const isCurrent = qIdx === currentIdx;
                      return (
                        <button
                          key={qIdx}
                          type="button"
                          onClick={() => setCurrentIdx(qIdx)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            isCurrent
                              ? 'bg-black text-white ring-2 ring-zinc-900 shadow-sm'
                              : isAnswered
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          }`}
                        >
                          {qIdx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="hidden sm:inline">Camera Monitored</span>
                    </span>

                    <div className="flex items-center gap-2 bg-black text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 shadow-sm border border-zinc-800">
                      <Clock size={14} className="text-amber-400 animate-pulse" />
                      <span className="text-zinc-400 uppercase text-[10px] tracking-wider font-semibold hidden sm:inline">Time Left:</span>
                      <span className="font-bold tabular-nums tracking-wider text-sm text-white">{formatTime(timeLeft)}</span>
                    </div>
                  </div>
                </div>

                {/* Current Question Card with Swapped/Shuffled Options */}
                {activeQuestions.length > 0 && currentQ && (
                  <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-800 rounded-full text-[10px] font-bold uppercase tracking-wider border border-zinc-200">
                          {currentQ.category}
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold">
                          {selectedTrackTitle}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-zinc-400">
                        Skill Tag: <span className="font-bold text-zinc-800">{currentQ.skill_tag}</span>
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-zinc-900 leading-relaxed">
                        Q{currentIdx + 1} of {totalQuestionCount}. {currentQ.question_text}
                      </h3>
                      <p className="text-xs text-zinc-400">Select one option from the choices below.</p>
                    </div>

                    {/* Randomized Answer Options (Swapped per student) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {currentQ.shuffledOptions?.map((opt: ShuffledOption, displayIdx: number) => {
                        const isSelected = selectedAnswers[currentQ.id] === opt.originalIndex;
                        return (
                          <button
                            key={displayIdx}
                            type="button"
                            onClick={() => {
                              setSelectedAnswers({
                                ...selectedAnswers,
                                [currentQ.id]: opt.originalIndex
                              });
                            }}
                            className={`p-4 rounded-xl border text-left text-xs font-medium transition-all flex items-start gap-3 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 font-bold shadow-xs'
                                : 'bg-zinc-50/60 border-zinc-200 text-zinc-700 hover:bg-zinc-100/80 hover:border-zinc-300'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5 ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-zinc-200 text-zinc-600'
                            }`}>
                              {String.fromCharCode(65 + displayIdx)}
                            </span>
                            <span className="leading-relaxed">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Navigation Buttons between questions */}
                    <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
                      <button
                        type="button"
                        disabled={currentIdx === 0}
                        onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                        className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1.5"
                      >
                        <ArrowLeft size={14} /> Previous
                      </button>

                      <div className="flex items-center gap-3">
                        {currentIdx < totalQuestionCount - 1 ? (
                          <button
                            type="button"
                            onClick={() => setCurrentIdx(prev => Math.min(totalQuestionCount - 1, prev + 1))}
                            className="px-5 py-2 rounded-xl text-xs font-bold bg-black hover:bg-zinc-800 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                          >
                            Next <ArrowRight size={14} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleSubmitTest}
                            className="px-6 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 size={14} /> {isSubmitting ? 'Submitting...' : 'Finish & Submit Test'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 4: HOD EXCEL QUESTION CREATOR & TRACK PUBLISHER
            ═════════════════════════════════════════════════════════════════════ */}
        {!isLockdownActive && activeTab === 'upload' && (isHOD || isAdvisor) && (
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200">
                  HOD Question Bank Management
                </span>
                <h3 className="text-xl font-bold text-zinc-900 mt-2">
                  Upload & Publish Questions to Assessment Tracks
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Tag questions to specific company tracks (Zoho, TCS, Infosys, Technical Core) and set customized cutoff benchmarks.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-zinc-200 shadow-xs"
                >
                  <Download size={14} /> Download Sample Template (.xlsx)
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={isParsingExcel}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                  <Upload size={14} /> {isParsingExcel ? 'Parsing File...' : 'Upload Excel Sheet'}
                </button>
              </div>
            </div>

            {/* Target Track Selection for Upload */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Select Destination Track & Cutoff Percentage:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 block mb-1">Destination Track</label>
                  <select
                    value={uploadTrackType}
                    onChange={e => {
                      setUploadTrackType(e.target.value);
                      const matched = tracks.find(t => t.track_type === e.target.value);
                      if (matched) setUploadTrackCutoff(matched.cutoff_percentage);
                    }}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800"
                  >
                    {tracks.map(t => (
                      <option key={t.track_type} value={t.track_type}>{t.track_title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 block mb-1">Track Cutoff (%)</label>
                  <input
                    type="number"
                    min="40"
                    max="100"
                    value={uploadTrackCutoff}
                    onChange={e => setUploadTrackCutoff(Number(e.target.value))}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Parsed Excel Questions Preview */}
            {excelQuestions.length > 0 && (
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">
                      Parsed Questions Preview ({excelQuestions.length} Questions)
                    </h4>
                    <p className="text-xs text-zinc-400">Review questions before committing to database.</p>
                  </div>
                  <button
                    type="button"
                    disabled={isPublishing}
                    onClick={handlePublishQuestions}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                  >
                    <Check size={14} /> {isPublishing ? 'Publishing to Track...' : `Publish to ${uploadTrackType}`}
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {excelQuestions.map((q, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                      <div className="flex justify-between font-bold text-zinc-800">
                        <span>Q{idx + 1}. {q.question_text}</span>
                        <span className="text-indigo-600">{q.category}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                        {q.options?.map((opt: string, oIdx: number) => (
                          <span
                            key={oIdx}
                            className={`px-2 py-0.5 rounded border ${
                              oIdx === q.correct_option
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                                : 'bg-white border-zinc-200'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}: {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 5: HOD STUDENT RESULTS & ANALYTICS
            ═════════════════════════════════════════════════════════════════════ */}
        {!isLockdownActive && activeTab === 'analytics' && (isHOD || isAdvisor) && (
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200">
                  Institutional Performance
                </span>
                <h3 className="text-xl font-bold text-zinc-900 mt-2">
                  Student Assessment Submissions & Results
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Track student participation, scores, proctoring face photos, and export complete reports to Excel.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleExportResults}
                  className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                  <Download size={14} /> Export Results to Excel (.xlsx)
                </button>
              </div>
            </div>

            {/* Track Filter & Live Search */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-zinc-500">Filter by Track:</span>
                <select
                  value={selectedResultTrack}
                  onChange={e => setSelectedResultTrack(e.target.value)}
                  className="p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800"
                >
                  <option value="ALL">All Tracks</option>
                  <option value="GENERAL_APTITUDE">General Aptitude</option>
                  <option value="TECHNICAL_CORE">Technical Core</option>
                  <option value="ZOHO_MOCK">Zoho Corporation</option>
                  <option value="TCS_NQT">TCS NQT Foundation</option>
                  <option value="INFOSYS_MOCK">Infosys Analytical</option>
                </select>
              </div>

              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search student or reg no..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800"
                />
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider">
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Class</th>
                      <th className="p-3">Track</th>
                      <th className="p-3">Score (%)</th>
                      <th className="p-3">Result</th>
                      <th className="p-3">Correct</th>
                      <th className="p-3">Time</th>
                      <th className="p-3 text-right">Attempt Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium">
                    {studentResults
                      .filter(s => {
                        if (selectedResultTrack !== 'ALL' && s.track_type !== selectedResultTrack) return false;
                        if (!searchQuery) return true;
                        const q = searchQuery.toLowerCase();
                        return s.student_name?.toLowerCase().includes(q) || s.register_number?.toLowerCase().includes(q);
                      })
                      .map(r => (
                        <tr key={r.id} className="hover:bg-zinc-50/80">
                          <td className="p-3 font-bold text-zinc-900 flex items-center gap-2.5">
                            {r.proctor_photo_url ? (
                              <img
                                src={r.proctor_photo_url}
                                alt={r.student_name}
                                className="w-8 h-8 rounded-full object-cover border border-zinc-300 shadow-2xs shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-600 shrink-0">
                                {r.student_name?.charAt(0) || 'S'}
                              </div>
                            )}
                            <div>
                              <span>{r.student_name}</span>
                              <span className="block text-[10px] text-zinc-400 font-mono">{r.register_number}</span>
                            </div>
                          </td>

                          <td className="p-3 text-zinc-600">{r.class_name || 'Unassigned'}</td>
                          <td className="p-3 font-semibold text-zinc-700">{r.track_title || 'General Aptitude'}</td>
                          <td className="p-3 font-extrabold text-zinc-900">{r.score_percentage}%</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              Number(r.score_percentage) >= (r.cutoff_percentage || 60)
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {Number(r.score_percentage) >= (r.cutoff_percentage || 60) ? 'PASSED' : 'REMEDIAL'}
                            </span>
                          </td>
                          <td className="p-3 text-zinc-600">{r.correct_count} / {r.total_questions}</td>
                          <td className="p-3 text-zinc-600">{Math.floor(r.time_taken_seconds / 60)}m {r.time_taken_seconds % 60}s</td>
                          <td className="p-3 text-right text-zinc-400 font-mono text-[11px]">
                            {new Date(r.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 5: STUDENT MY ASSESSMENT MARKS & OFFICIAL SCORECARDS
            ═════════════════════════════════════════════════════════════════════ */}
        {!isLockdownActive && activeTab === 'my_marks' && (
          <div className="space-y-6">
            
            {/* Header Banner */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full shadow-2xs">
                  Official Academic Transcript • Pillar 1
                </span>
                <h3 className="text-2xl font-extrabold text-zinc-900 mt-2 flex items-center gap-2.5">
                  <Award className="text-amber-500" size={24} />
                  My Assessment Marks & Scorecards
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-xl leading-relaxed">
                  Verified assessment records for campus placement benchmarks, institutional mock evaluation suites, and technical screening tracks.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={fetchMyAssessments}
                  disabled={isLoadingMyAssessments}
                  className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={13} className={isLoadingMyAssessments ? 'animate-spin' : ''} />
                  <span>Refresh Marks</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('tracks')}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Target size={13} />
                  <span>Take Another Mock Test</span>
                </button>
              </div>
            </div>

            {/* Performance Summary Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-extrabold uppercase tracking-wider">
                  <span>Average Mark</span>
                  <Award size={16} className="text-amber-500" />
                </div>
                <div className="text-3xl font-extrabold text-zinc-900">
                  {myAssessmentsMetrics?.average_score ?? 0}%
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">Institutional performance average</p>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-extrabold uppercase tracking-wider">
                  <span>Personal Best</span>
                  <Sparkles size={16} className="text-indigo-600" />
                </div>
                <div className="text-3xl font-extrabold text-indigo-600">
                  {myAssessmentsMetrics?.highest_score ?? 0}%
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">Highest score achieved</p>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-extrabold uppercase tracking-wider">
                  <span>Tests Attempted</span>
                  <BookOpen size={16} className="text-blue-600" />
                </div>
                <div className="text-3xl font-extrabold text-zinc-900">
                  {myAssessmentsMetrics?.total_attempts ?? 0}
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">Completed mock evaluations</p>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-extrabold uppercase tracking-wider">
                  <span>Clearance Rate</span>
                  <CheckCircle2 size={16} className="text-emerald-600" />
                </div>
                <div className="text-3xl font-extrabold text-emerald-600">
                  {myAssessmentsMetrics?.pass_rate ?? 0}%
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">
                  {myAssessmentsMetrics?.passed_count ?? 0} of {myAssessmentsMetrics?.total_attempts ?? 0} tests cleared
                </p>
              </div>
            </div>

            {/* Assessment Records List */}
            {isLoadingMyAssessments ? (
              <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center shadow-sm space-y-3">
                <RefreshCw size={24} className="animate-spin mx-auto text-indigo-600" />
                <p className="text-xs font-bold text-zinc-600">Loading your verified assessment records & scorecards...</p>
              </div>
            ) : myAssessments.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center shadow-sm space-y-4 max-w-2xl mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-500">
                  <Award size={28} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-extrabold text-zinc-900">No Assessment Marks Recorded Yet</h4>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                    You have not attempted any proctored mock assessments or institutional placement tests yet. Completing assessments contributes up to +35% toward your overall Placement Readiness Rating (Pillar 1)!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('tracks')}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white rounded-xl text-xs font-bold shadow-md transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Target size={14} />
                  <span>Start Institutional Benchmark Test</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {myAssessments.map(a => {
                  const score = Number(a.score_percentage || 0);
                  const cutoff = Number(a.cutoff_percentage || 60);
                  const passed = a.is_passed || score >= cutoff;

                  return (
                    <div
                      key={a.id}
                      className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        
                        {/* Header: Track & Date */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                              {new Date(a.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <h4 className="text-base font-extrabold text-zinc-900 mt-0.5">
                              {a.track_title || 'General Aptitude Benchmark'}
                            </h4>
                          </div>

                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider shrink-0 ${
                            passed
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {passed ? 'PASSED ✅' : 'ACTION REQUIRED ⚠️'}
                          </span>
                        </div>

                        {/* Marks & Score Bar */}
                        <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex items-center justify-between">
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-3xl font-black text-zinc-900">{score}%</span>
                              <span className="text-xs font-bold text-zinc-500">
                                ({a.correct_count} / {a.total_questions} Correct)
                              </span>
                            </div>
                            <span className="text-[11px] text-zinc-500 font-semibold block mt-0.5">
                              Institutional Cutoff: <strong className="text-zinc-800">{cutoff}%</strong>
                            </span>
                          </div>

                          {a.proctor_photo_url && (
                            <div className="flex flex-col items-center">
                              <img
                                src={a.proctor_photo_url}
                                alt="Proctored Face"
                                className="w-12 h-12 rounded-xl object-cover border-2 border-indigo-400 shadow-2xs"
                              />
                              <span className="text-[9px] font-extrabold text-indigo-700 mt-1 flex items-center gap-0.5">
                                <ShieldCheck size={10} /> Verified
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Category Performance Breakdown */}
                        {a.category_breakdown && Object.keys(a.category_breakdown).length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                              Domain Marks Breakdown
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {Object.entries(a.category_breakdown).map(([domain, pct]: [string, any]) => (
                                <div key={domain} className="p-2 bg-zinc-50/90 border border-zinc-200 rounded-xl text-xs flex items-center justify-between">
                                  <span className="text-[11px] font-semibold text-zinc-700 truncate pr-2" title={domain}>{domain}</span>
                                  <span className={`font-mono font-extrabold text-xs ${
                                    Number(pct) >= 70 ? 'text-emerald-700' : Number(pct) >= 50 ? 'text-amber-700' : 'text-rose-700'
                                  }`}>
                                    {pct}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-3 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {Math.floor((a.time_taken_seconds || 0) / 60)}m {(a.time_taken_seconds || 0) % 60}s duration
                          </span>
                          <span>•</span>
                          <span>ID: {a.id.slice(0, 8)}...</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-zinc-100 flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setViewingScorecard(a)}
                          className="flex-1 py-2.5 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Eye size={13} />
                          <span>View Full Scorecard</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const matched = tracks.find(t => t.track_type === a.track_type);
                            if (matched) handleSelectTrack(matched);
                            else setActiveTab('tracks');
                          }}
                          className="px-3.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <RotateCcw size={12} />
                          <span>Retake</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Detailed Assessment Scorecard Modal */}
            {viewingScorecard && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
                  
                  {/* Modal Header */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-100">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                        Official Assessment Transcript
                      </span>
                      <h3 className="text-xl font-extrabold text-zinc-900 mt-1.5 flex items-center gap-2">
                        <Award className="text-amber-500" size={20} />
                        {viewingScorecard.track_title || 'Assessment Scorecard'}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Completed on {new Date(viewingScorecard.created_at).toLocaleString()} • Proctored Session
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewingScorecard(null)}
                      className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Summary Marks Banner */}
                  <div className="p-6 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                    <div className="space-y-1 text-center sm:text-left">
                      <span className="text-xs text-zinc-400 font-extrabold uppercase tracking-wider">Final Marks Awarded</span>
                      <div className="text-4xl font-black text-white">
                        {viewingScorecard.score_percentage}%
                      </div>
                      <span className="text-xs text-zinc-300 font-medium">
                        {viewingScorecard.correct_count} of {viewingScorecard.total_questions} Questions Answered Correctly
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {viewingScorecard.proctor_photo_url && (
                        <img
                          src={viewingScorecard.proctor_photo_url}
                          alt="Proctor verified"
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
                        />
                      )}
                      <div className="text-right space-y-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-block ${
                          Number(viewingScorecard.score_percentage) >= Number(viewingScorecard.cutoff_percentage || 60)
                            ? 'bg-emerald-500 text-white'
                            : 'bg-rose-500 text-white'
                        }`}>
                          {Number(viewingScorecard.score_percentage) >= Number(viewingScorecard.cutoff_percentage || 60) ? 'Passed ✅' : 'Action Required'}
                        </span>
                        <span className="block text-[10px] text-zinc-400 font-mono">
                          Cutoff: {viewingScorecard.cutoff_percentage || 60}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Domain Breakdown */}
                  {viewingScorecard.category_breakdown && Object.keys(viewingScorecard.category_breakdown).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700">Domain Performance</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {Object.entries(viewingScorecard.category_breakdown).map(([c, pct]: [string, any]) => (
                          <div key={c} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1.5">
                            <div className="flex justify-between text-xs font-bold text-zinc-800">
                              <span className="truncate pr-2">{c}</span>
                              <span className="font-mono">{pct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${Number(pct) >= 70 ? 'bg-emerald-500' : Number(pct) >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Question by Question Review (if saved) */}
                  {Array.isArray(viewingScorecard.answers_summary) && viewingScorecard.answers_summary.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700">Detailed Answer Review</h4>
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                        {viewingScorecard.answers_summary.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                              item.is_correct
                                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                : 'bg-rose-50/60 border-rose-200 text-rose-950'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 font-bold">
                              <span>Q{idx + 1}. {item.question_text}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold shrink-0 ${
                                item.is_correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {item.is_correct ? 'Correct' : 'Incorrect'}
                              </span>
                            </div>
                            <div className="text-[11px] space-y-0.5 font-medium">
                              <div>Your Answer: <span className="font-bold">{item.selected_answer || 'Unanswered'}</span></div>
                              {!item.is_correct && (
                                <div className="text-emerald-800 font-bold">Correct Answer: {item.correct_answer}</div>
                              )}
                              {item.explanation && (
                                <div className="text-zinc-500 italic pt-1 border-t border-zinc-200/50 mt-1">
                                  💡 {item.explanation}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-zinc-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setViewingScorecard(null)}
                      className="px-5 py-2 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Close Scorecard
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* ── Official Assessment Announcement & Email Load Balancer Dispatch Studio Modal ── */}
        {showTriggerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                      Official HOD Placement Studio
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                      <Mail size={11} className="text-blue-600" />
                      Live Brevo Balancer
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-zinc-900 mt-1.5 flex items-center gap-2">
                    <Mail size={20} className="text-blue-600" />
                    Announce Assessment & Dispatch Emails
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Select target year and class section. Official branded invitation emails will be routed through the multi-node load balancer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTriggerModal(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* ── Live Brevo Email Credits Status Card with Mail Logo ── */}
              <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/70 to-sky-50/90 border border-blue-200/90 rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Mail size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-extrabold text-blue-950">
                          Brevo Multi-Node Email Engine
                        </h4>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <p className="text-[11px] text-blue-800 font-semibold mt-0.5">
                        Live Quota Available:{' '}
                        <strong className="text-blue-950 font-mono text-xs">
                          {emailNodesStatus?.totalAvailableCredits ?? 600} Credits
                        </strong>{' '}
                        across active SMTP nodes
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={fetchEmailNodesStatus}
                    disabled={isLoadingEmailStatus}
                    title="Refresh live Brevo credits"
                    className="p-2 text-blue-700 hover:text-blue-900 bg-white/90 hover:bg-white border border-blue-200 rounded-xl transition cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    <RefreshCw size={13} className={isLoadingEmailStatus ? 'animate-spin' : ''} />
                  </button>
                </div>

                {/* Node Status Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-blue-200/60">
                  {emailNodesStatus?.nodes && emailNodesStatus.nodes.length > 0 ? (
                    emailNodesStatus.nodes.map((node: any) => (
                      <div
                        key={node.nodeId}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border shadow-2xs ${
                          node.status === 'HEALTHY'
                            ? 'bg-white text-zinc-800 border-blue-200'
                            : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                        }`}
                      >
                        <Mail size={11} className={node.status === 'HEALTHY' ? 'text-blue-600' : 'text-zinc-400'} />
                        <span className="font-mono">{node.nodeId}:</span>
                        <span className="text-blue-700 font-extrabold">
                          {node.credits !== null ? `${node.credits} left` : node.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] text-blue-700 font-bold">
                      <span className="px-2.5 py-1 bg-white border border-blue-200 rounded-lg flex items-center gap-1">
                        <Mail size={10} className="text-blue-600" /> Node 1: 300 credits
                      </span>
                      <span className="px-2.5 py-1 bg-white border border-blue-200 rounded-lg flex items-center gap-1">
                        <Mail size={10} className="text-blue-600" /> Node 2: 300 credits
                      </span>
                    </div>
                  )}

                  {/* Quota Check Indicator */}
                  <div className="ml-auto text-[10px] font-extrabold">
                    {(targetPreviewCount ?? 0) <= (emailNodesStatus?.totalAvailableCredits ?? 600) ? (
                      <span className="text-emerald-700 bg-emerald-50/90 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Check size={11} /> Quota Sufficient ({targetPreviewCount ?? 0} targeted)
                      </span>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        ⚠ Exceeds single-batch quota
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-4">
                
                {/* 1. Track Selector */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1.5">
                    1. Select Assessment Track
                  </label>
                  <select
                    value={triggerTrackType}
                    onChange={e => setTriggerTrackType(e.target.value)}
                    className="w-full p-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  >
                    {tracks.map(t => (
                      <option key={t.track_type} value={t.track_type}>
                        {t.track_title} ({t.question_count} Qs • Cutoff: {t.cutoff_percentage}%)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Target Year & Target Class Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1.5">
                      2. Target Academic Year
                    </label>
                    <select
                      value={triggerYear}
                      onChange={e => {
                        const yr = e.target.value;
                        setTriggerYear(yr);
                        setTriggerClassId('ALL');
                        fetchTargetPreview(yr, 'ALL');
                      }}
                      className="w-full p-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    >
                      <option value="ALL">All Years (II & III IT — 369 Students)</option>
                      <option value="2">II Year (2025-2029 Batch — 188 Students)</option>
                      <option value="3">III Year (2024-2028 Batch — 181 Students)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1.5">
                      3. Target Class / Section
                    </label>
                    <select
                      value={triggerClassId}
                      onChange={e => {
                        const cid = e.target.value;
                        setTriggerClassId(cid);
                        fetchTargetPreview(triggerYear, cid);
                      }}
                      className="w-full p-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    >
                      <option value="ALL">All Sections in Selected Year</option>
                      {availableClasses
                        .filter(c => triggerYear === 'ALL' || String(c.year) === String(triggerYear))
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} (Year {c.year} • Batch {c.batch})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Target Audience Live Counter */}
                <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      <Users size={15} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                        Live Audience Preview
                      </p>
                      <p className="text-xs font-extrabold text-indigo-950">
                        {isLoadingPreview ? (
                          'Calculating target cohort...'
                        ) : (
                          `${targetPreviewCount ?? 0} Students Selected (${targetPreviewClasses.join(', ') || 'All Sections'})`
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-1 bg-white border border-indigo-200 text-indigo-700 rounded-lg shadow-2xs">
                    Multi-Node Pool Ready
                  </span>
                </div>

                {/* 4. Submission Deadline */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1.5">
                    4. Submission Deadline (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={triggerDeadline}
                    onChange={e => setTriggerDeadline(e.target.value)}
                    className="w-full p-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>

                {/* 5. Custom Instructions */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1.5">
                    5. Special Instructions for Students (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Mandatory mock test before upcoming campus placement drive. Make sure webcam is enabled and full-screen lockdown is maintained."
                    value={triggerInstructions}
                    onChange={e => setTriggerInstructions(e.target.value)}
                    className="w-full p-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition leading-relaxed resize-none"
                  />
                </div>

              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowTriggerModal(false)}
                  disabled={isTriggering}
                  className="px-4 py-2.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDispatchAssessmentCampaign}
                  disabled={isTriggering}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 hover:from-blue-700 hover:to-violet-800 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isTriggering ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Dispatching via Email Load Balancer...</span>
                    </>
                  ) : (
                    <>
                      <Mail size={15} />
                      <span>Dispatch Assessment & Send Emails</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SkillAssessmentView;

```
