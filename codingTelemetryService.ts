/**
 * ⚡ Coding Telemetry Service (LeetCode & GitHub Automated Sync)
 * Provides centralized, robust GraphQL & REST telemetry sync for students.
 * Used by:
 * - Server startup & continuous background scheduler (server.ts)
 * - Telegram automation runner (scripts/run_telegram_automation.ts)
 * - GitHub Actions automated backup & report workflow
 */

import { pool } from './db.js';

export function extractLeetCodeUsername(profileUrl: string): string {
  if (!profileUrl || !profileUrl.trim()) return '';
  let clean = profileUrl.trim().replace(/^@/, '');
  clean = clean.split('?')[0].split('#')[0].replace(/\/+$/, '');
  const match = clean.match(/leetcode\.(?:com|cn)\/(?:u\/)?([^/]+)/i);
  if (match && match[1]) {
    const extracted = match[1].trim();
    if (['u', 'problems', 'contest', 'explore', 'accounts', 'login', 'profile'].includes(extracted.toLowerCase())) return '';
    return extracted;
  }
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return '';
  }
  return clean;
}

export function extractGitHubUsername(urlOrUsername: string): string {
  if (!urlOrUsername || !urlOrUsername.trim()) return '';
  let clean = urlOrUsername.trim();
  clean = clean.split('?')[0].split('#')[0].replace(/\/+$/, '');
  const match = clean.match(/github\.com\/([^/?#]+)/i);
  if (match && match[1]) {
    return match[1].replace(/^@/, '');
  }
  return clean.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/^github\.com\//i, '').replace(/^@/, '').trim();
}

export function getISTDateStr(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

export function getYesterdayDateStr(dateStr: string): string {
  const parts = dateStr.split('-');
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  date.setDate(date.getDate() - 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function resolveTargetInMemory(
  student: { id: string; class_id?: string; year?: number | null; department_id?: string }, 
  targetRows: any[]
) {
  const userId = student.id ? student.id.toString() : '';
  const classId = student.class_id ? student.class_id.toString() : '';
  const year = student.year !== undefined && student.year !== null ? Number(student.year) : null;
  const departmentId = student.department_id ? student.department_id.toString() : '';

  for (const t of targetRows) {
    if (t.user_id && t.user_id.toString() === userId) return t;
    if (t.class_id && t.class_id.toString() === classId) return t;
    if (t.year && year !== null && Number(t.year) === year) {
      if (!t.department_id || (departmentId && t.department_id.toString() === departmentId)) return t;
    }
    if (t.department_id && !t.user_id && !t.class_id && !t.year && departmentId && t.department_id.toString() === departmentId) return t;
  }

  return {
    id: null,
    daily_target: 0,
    weekly_target: 0,
    start_date: null,
    end_date: null
  };
}

export interface LeetCodeDetails {
  totalSolved: number;
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
  recentSubmissions: Array<{ titleSlug: string; timestamp: number }>;
}

export async function fetchLeetCodeStats(profileUrlOrUsername: string): Promise<LeetCodeDetails | null> {
  const username = extractLeetCodeUsername(profileUrlOrUsername);
  if (!username) return null;
  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body: JSON.stringify({
        query: `
          query userProblemsSolved($username: String!) {
            matchedUser(username: $username) {
              submitStats {
                acSubmissionNum {
                  difficulty
                  count
                }
              }
            }
            recentAcSubmissionList(username: $username, limit: 50) {
              title
              titleSlug
              timestamp
            }
          }
        `,
        variables: { username }
      }),
      signal: AbortSignal.timeout(6000)
    });
    if (!response.ok) return null;
    const result: any = await response.json();
    if (!result.data || !result.data.matchedUser) return null;

    const stats = result.data.matchedUser.submitStats?.acSubmissionNum;
    const allStats = stats?.find((s: any) => s.difficulty === 'All');
    const easyStats = stats?.find((s: any) => s.difficulty === 'Easy');
    const mediumStats = stats?.find((s: any) => s.difficulty === 'Medium');
    const hardStats = stats?.find((s: any) => s.difficulty === 'Hard');

    const totalSolved = allStats ? Number(allStats.count) : 0;
    const easySolved = easyStats ? Number(easyStats.count) : 0;
    const mediumSolved = mediumStats ? Number(mediumStats.count) : 0;
    const hardSolved = hardStats ? Number(hardStats.count) : 0;

    const rawSubmissions = result.data.recentAcSubmissionList || [];
    const recentSubmissions = rawSubmissions.map((s: any) => ({
      titleSlug: s.titleSlug,
      timestamp: Number(s.timestamp)
    }));

    return { totalSolved, easySolved, mediumSolved, hardSolved, recentSubmissions };
  } catch (err) {
    return null;
  }
}

export async function syncLeetcodeProgressForScope(scopeFilter?: { departmentId?: string; classId?: string; year?: number; userId?: string; studentId?: string; date?: string }) {
  try {
    let query = `
      SELECT u.id, u.register_number, u.full_name, u.class_id, u.department_id,
             COALESCE(NULLIF(scp.leetcode, ''), NULLIF(u.leetcode_url, ''), '') AS leetcode_url,
             COALESCE(NULLIF(scp.github, ''), NULLIF(u.github_url, ''), '') AS github_url,
             c.year, c.batch 
      FROM users u
      LEFT JOIN classes c ON u.class_id = c.id
      LEFT JOIN student_coding_profiles scp ON u.id = scp.user_id
      WHERE u.role = 'STUDENT'
    `;
    const params: any[] = [];
    const targetUserId = scopeFilter?.userId || scopeFilter?.studentId;

    if (scopeFilter) {
      if (targetUserId) {
        params.push(targetUserId);
        query += ` AND u.id = $${params.length}`;
      } else if (scopeFilter.classId) {
        params.push(scopeFilter.classId);
        query += ` AND u.class_id = $${params.length}`;
      } else if (scopeFilter.year) {
        params.push(scopeFilter.year);
        query += ` AND c.year = $${params.length}`;
        if (scopeFilter.departmentId) {
          params.push(scopeFilter.departmentId);
          query += ` AND u.department_id = $${params.length}`;
        }
      } else if (scopeFilter.departmentId) {
        params.push(scopeFilter.departmentId);
        query += ` AND u.department_id = $${params.length}`;
      }
    }

    const students = await pool.query(query, params);
    const todayStr = scopeFilter?.date || getISTDateStr();

    const todayStartSec = Math.floor(new Date(`${todayStr}T00:00:00+05:30`).getTime() / 1000);
    const todayEndSec = Math.floor(new Date(`${todayStr}T23:59:59+05:30`).getTime() / 1000);

    const targetsRes = await pool.query(`
      SELECT * FROM leetcode_targets 
      WHERE start_date <= $1 AND end_date >= $1
      ORDER BY 
        CASE 
          WHEN user_id IS NOT NULL THEN 1
          WHEN class_id IS NOT NULL THEN 2
          WHEN year IS NOT NULL THEN 3
          WHEN department_id IS NOT NULL THEN 4
          ELSE 5
        END ASC,
        created_at DESC
    `, [todayStr]);
    const activeTargets = targetsRes.rows;

    let synced = 0;
    let failed = 0;

    const chunkSize = 15;
    for (let i = 0; i < students.rows.length; i += chunkSize) {
      const chunk = students.rows.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async (student) => {
        const userId = student.id;
        const classId = student.class_id;
        const year = student.year ? Number(student.year) : null;
        const departmentId = student.department_id;
        
        const leetcodeProfile = (student.leetcode_url || '').trim();
        const activeTarget = resolveTargetInMemory({ id: userId, class_id: classId, year, department_id: departmentId }, activeTargets);

        let details: LeetCodeDetails | null = null;
        if (leetcodeProfile) {
          details = await fetchLeetCodeStats(leetcodeProfile);
        }

        if (details === null) {
          failed++;
          const existing = await pool.query(
            'SELECT id FROM leetcode_daily_progress WHERE user_id = $1 AND date = $2',
            [userId, todayStr]
          );
          if (existing.rowCount === 0) {
            await pool.query(`
              INSERT INTO leetcode_daily_progress (user_id, date, total_solved, solved_today, daily_target, status)
              VALUES ($1, $2, NULL, 0, $3, 'DATA_UNAVAILABLE')
              ON CONFLICT (user_id, date) DO NOTHING
            `, [userId, todayStr, activeTarget.daily_target]);
          }
        } else {
          synced++;
          const fetchedCount = details.totalSolved;

          const todaySubmissions = details.recentSubmissions
              .filter(s => s.timestamp >= todayStartSec && s.timestamp <= todayEndSec);

          const recentTodayCount = new Set(
            todaySubmissions.map(s => s.titleSlug)
          ).size;

          const prevRes = await pool.query(`
            SELECT total_solved FROM leetcode_daily_progress
            WHERE user_id = $1 AND date < $2 AND total_solved IS NOT NULL
            ORDER BY date DESC LIMIT 1
          `, [userId, todayStr]);

          const todayRes = await pool.query(`
            SELECT total_solved, solved_today FROM leetcode_daily_progress
            WHERE user_id = $1 AND date = $2 AND total_solved IS NOT NULL
          `, [userId, todayStr]);

          let prevTotal: number | null = null;
          if ((prevRes.rowCount ?? 0) > 0 && prevRes.rows[0].total_solved !== null) {
            prevTotal = Number(prevRes.rows[0].total_solved);
          } else if ((todayRes.rowCount ?? 0) > 0 && todayRes.rows[0].total_solved !== null) {
            const tSolved = Number(todayRes.rows[0].total_solved);
            const sToday = Number(todayRes.rows[0].solved_today);
            prevTotal = tSolved - sToday;
          }

          let solvedToday = 0;
          if (prevTotal !== null && prevTotal !== undefined) {
            const diffSolved = Math.max(0, fetchedCount - prevTotal);
            if (todaySubmissions.length < 50) {
              solvedToday = recentTodayCount;
            } else {
              solvedToday = Math.max(diffSolved, recentTodayCount);
            }
          } else {
            solvedToday = recentTodayCount;
          }

          const yesterdayStr = getYesterdayDateStr(todayStr);
          const yesterdayRes = await pool.query(`
            SELECT solved_today FROM leetcode_daily_progress
            WHERE user_id = $1 AND date = $2
          `, [userId, yesterdayStr]);
          const solvedYesterday = (yesterdayRes.rowCount ?? 0) > 0 ? Number(yesterdayRes.rows[0].solved_today) : 0;

          const status = activeTarget.id !== null
            ? (solvedToday >= activeTarget.daily_target ? 'COMPLETED' : 'INCOMPLETE')
            : 'COMPLETED';

          await pool.query(`
            INSERT INTO leetcode_daily_progress (user_id, date, total_solved, solved_today, solved_yesterday, daily_target, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (user_id, date) DO UPDATE
            SET total_solved = EXCLUDED.total_solved,
                solved_today = EXCLUDED.solved_today,
                solved_yesterday = EXCLUDED.solved_yesterday,
                daily_target = EXCLUDED.daily_target,
                status = EXCLUDED.status,
                updated_at = CURRENT_TIMESTAMP
          `, [userId, todayStr, fetchedCount, solvedToday, solvedYesterday, activeTarget.daily_target, status]);
        }
      }));
    }
    return { success: true, synced, failed };
  } catch (err) {
    console.error('[syncLeetcodeProgressForScope] Error:', err);
    return { success: false, synced: 0, failed: 0 };
  }
}

let _cachedGithubToken: string | null = null;

export async function getGitHubToken(): Promise<string | null> {
  const envToken = (process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '').trim().replace(/^["']|["']$/g, '');
  if (envToken) {
    _cachedGithubToken = envToken;
    return envToken;
  }
  if (_cachedGithubToken) return _cachedGithubToken;
  try {
    const res = await pool.query("SELECT value FROM system_settings WHERE key = 'github_token' LIMIT 1");
    if (res.rows[0]?.value) {
      _cachedGithubToken = res.rows[0].value.trim();
      return _cachedGithubToken;
    }
  } catch (err) {}
  return null;
}

export async function fetchGitHubDailyCommits(usernameOrUrl: string, dateStr: string, tokenOverride?: string): Promise<number | null> {
  const username = extractGitHubUsername(usernameOrUrl);
  if (!username) return null;

  const token = tokenOverride || await getGitHubToken();
  if (!token) return null;

  const query = `
    query($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  const fromISO = new Date(`${dateStr}T00:00:00+05:30`).toISOString();
  const toISO = new Date(`${dateStr}T23:59:59+05:30`).toISOString();

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'IT-TaskManager-DailyCommitTracker/2.0',
        },
        body: JSON.stringify({ query, variables: { username, from: fromISO, to: toISO } }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) return null;
        if (response.status === 429 && attempt < 3) {
          await new Promise(res => setTimeout(res, 2000 * attempt));
          continue;
        }
        return null;
      }

      const data: any = await response.json();
      if (data.errors) {
        const notFound = data.errors.some((e: any) => e.type === 'NOT_FOUND' || e.message?.includes('Could not resolve'));
        if (notFound) return 0;
        if (attempt < 3) {
          await new Promise(res => setTimeout(res, 1500));
          continue;
        }
        return null;
      }

      const user = data?.data?.user;
      if (!user) return 0;

      let dailyCommitCount = 0;
      const weeks = user.contributionsCollection?.contributionCalendar?.weeks || [];
      for (const week of weeks) {
        for (const day of (week.contributionDays || [])) {
          if (day.date === dateStr) {
            dailyCommitCount = Number(day.contributionCount) || 0;
            break;
          }
        }
      }
      return dailyCommitCount;
    } catch (err: any) {
      if (attempt < 3) { await new Promise(res => setTimeout(res, 1500)); continue; }
      return null;
    }
  }
  return null;
}

export async function syncDailyGitHubCommits(
  scopeFilter?: { departmentId?: string; classId?: string; year?: number; studentId?: string; userId?: string; date?: string },
  tokenOverride?: string
) {
  const dateStr = scopeFilter?.date || getISTDateStr();
  const token = tokenOverride || await getGitHubToken();
  if (!token) {
    console.warn('[syncDailyGitHubCommits] No GitHub token available. Skipping commit sync.');
    return null;
  }

  let processed = 0, successful = 0, failed = 0, skipped = 0;

  try {
    let query = `
      SELECT u.id, u.register_number, u.full_name, u.class_id, u.department_id, u.leetcode_url,
             COALESCE(NULLIF(scp.github, ''), NULLIF(u.github_url, ''), '') AS github_url,
             c.year, c.name as class_name
      FROM users u
      LEFT JOIN classes c ON u.class_id = c.id
      LEFT JOIN student_coding_profiles scp ON u.id = scp.user_id
      WHERE u.role = 'STUDENT'
    `;
    const params: any[] = [];
    const targetUserId = scopeFilter?.studentId || scopeFilter?.userId;

    if (targetUserId) {
      params.push(targetUserId); query += ` AND u.id = $${params.length}`;
    } else if (scopeFilter?.classId) {
      params.push(scopeFilter.classId); query += ` AND u.class_id = $${params.length}`;
    } else if (scopeFilter?.year) {
      params.push(scopeFilter.year); query += ` AND c.year = $${params.length}`;
      if (scopeFilter.departmentId) { params.push(scopeFilter.departmentId); query += ` AND u.department_id = $${params.length}`; }
    } else if (scopeFilter?.departmentId) {
      params.push(scopeFilter.departmentId); query += ` AND u.department_id = $${params.length}`;
    }

    query += ` ORDER BY u.register_number ASC`;

    const students = (await pool.query(query, params)).rows;
    const totalStudents = students.length;

    const BATCH_SIZE = 4;
    const BATCH_DELAY_MS = 250;

    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const batch = students.slice(i, i + BATCH_SIZE);

      await Promise.all(batch.map(async (student) => {
        processed++;
        const rawProfile = student.github_url || student.github || '';
        const githubUsername = extractGitHubUsername(rawProfile);

        if (!githubUsername) {
          skipped++;
          return;
        }

        try {
          const commitCount = await fetchGitHubDailyCommits(githubUsername, dateStr, token);
          if (commitCount === null) {
            failed++;
            return;
          }

          await pool.query(`
            INSERT INTO github_daily_commits (student_id, github_username, date, daily_commit_count, updated_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (student_id, date) DO UPDATE
              SET daily_commit_count = EXCLUDED.daily_commit_count,
                  github_username = EXCLUDED.github_username,
                  updated_at = CURRENT_TIMESTAMP;
          `, [student.id, githubUsername, dateStr, commitCount]);

          successful++;
        } catch (err: any) {
          failed++;
        }
      }));

      if (i + BATCH_SIZE < students.length) {
        await new Promise(res => setTimeout(res, BATCH_DELAY_MS));
      }
    }

    return {
      total_students: totalStudents,
      processed,
      skipped,
      successful,
      failed,
      date: dateStr
    };
  } catch (err) {
    console.error('[syncDailyGitHubCommits] Error:', err);
    throw err;
  }
}

const lastSyncTimestamps: Record<string, number> = {};

/**
 * 🔄 High-Level Orchestrator: Ensures all coding telemetry (LeetCode + GitHub)
 * is freshly synced for a given date BEFORE any summary generation/dispatch.
 * Includes a 5-minute debounce cache to eliminate redundant successive sync runs.
 */
export async function syncAllCodingProgress(targetDate?: string, options: { force?: boolean } = {}) {
  const dateStr = targetDate || getISTDateStr();
  const now = Date.now();
  const lastSync = lastSyncTimestamps[dateStr] || 0;

  // 5-minute debounce cache: Reuse fresh state if already synced recently
  if (!options.force && (now - lastSync) < 5 * 60 * 1000) {
    console.log(`[Telemetry Sync] ⚡ Telemetry for ${dateStr} was freshly synced ${Math.round((now - lastSync) / 1000)}s ago (< 5m). Reusing fresh state.`);
    return { 
      cached: true, 
      date: dateStr, 
      leetcode: { success: true, synced: 0, failed: 0 }, 
      github: null 
    };
  }

  console.log(`[Telemetry Sync] 🚀 Initiating full pre-summary synchronization for ${dateStr}...`);

  const ghToken = await getGitHubToken();

  const [lcRes, ghRes] = await Promise.all([
    syncLeetcodeProgressForScope({ date: dateStr }).catch(err => {
      console.error('[Telemetry Sync] LeetCode sync error:', err);
      return { success: false, synced: 0, failed: 0 };
    }),
    ghToken 
      ? syncDailyGitHubCommits({ date: dateStr }, ghToken).catch(err => {
          console.error('[Telemetry Sync] GitHub sync error:', err);
          return null;
        })
      : Promise.resolve(null)
  ]);

  lastSyncTimestamps[dateStr] = Date.now();

  console.log(`[Telemetry Sync] ✅ Finished sync for ${dateStr}. LeetCode: ${lcRes.synced} synced (${lcRes.failed} unavailable), GitHub: ${ghRes ? `${ghRes.successful} synced` : 'token skipped'}`);
  return { leetcode: lcRes, github: ghRes, cached: false, date: dateStr };
}
