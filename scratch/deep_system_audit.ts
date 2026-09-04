import { pool, initDB } from '../db.js';
import { evaluateCodeSandbox } from '../codingSandboxService.js';
import { generateExcelReport, generateHTMLPDFReport, generateCSVReport } from '../hrReportService.js';
import { getLiveEmailNodesStatus } from '../emailService.js';
import { escapeHtml } from '../telegramService.js';
import { syncAndGenerateStudentDirectory, cleanStudentName } from '../studentDirectoryService.js';

interface AuditResult {
  category: string;
  test: string;
  status: '✅ PASS' | '❌ FAIL';
  details?: string;
  durationMs?: number;
}

const results: AuditResult[] = [];

async function recordTest(category: string, test: string, fn: () => Promise<void | string>) {
  const start = Date.now();
  try {
    const details = await fn();
    const durationMs = Date.now() - start;
    results.push({ category, test, status: '✅ PASS', details: details || undefined, durationMs });
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({ category, test, status: '❌ FAIL', details: err.message, durationMs });
  }
}

async function runDeepAudit() {
  console.log('\n════════════════════════════════════════════════════════════════════');
  console.log('       🔍 DEEP SYSTEM & REPOSITORY AUDIT (FULL SUITE)');
  console.log('════════════════════════════════════════════════════════════════════\n');

  // 1. Database Integrity
  await recordTest('Database Integrity', 'Database Pool Connection & Migration (initDB)', async () => {
    await initDB();
    const res = await pool.query('SELECT current_database(), version()');
    if (!res.rows[0]) throw new Error('Could not query database version');
    return `Connected and initialized tables on: ${res.rows[0].current_database}`;
  });

  await recordTest('Database Integrity', 'Check Essential Tables Exist (All Active Schema Tables)', async () => {
    const expectedTables = [
      'users', 'departments', 'classes', 'tasks', 'task_classes', 'task_submissions',
      'student_coding_profiles', 'leetcode_daily_progress', 'github_daily_commits', 'leetcode_targets',
      'student_profiles', 'password_resets', 'assessment_questions', 'student_assessments',
      'company_profiles', 'industry_postings', 'posting_applications',
      'faculty_industry_opportunities', 'faculty_opportunity_applications',
      'industry_projects', 'industry_project_members',
      'coding_assessments', 'coding_questions', 'coding_test_cases', 'coding_assignments',
      'coding_assignment_questions', 'coding_code_drafts', 'coding_submissions', 'coding_proctoring_events',
      'push_subscriptions', 'system_settings'
    ];

    const res = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const existing = new Set(res.rows.map(r => r.table_name));
    const missing = expectedTables.filter(t => !existing.has(t));
    if (missing.length > 0) {
      throw new Error(`Missing ${missing.length} tables: ${missing.join(', ')}`);
    }
    return `All ${expectedTables.length} tables confirmed present in PostgreSQL schema.`;
  });

  await recordTest('Database Integrity', 'Check Foreign Key Integrity & Orphan Records', async () => {
    const orphanCheck = await pool.query(`
      SELECT COUNT(*) as orphans FROM task_submissions ts
      LEFT JOIN users u ON ts.user_id = u.id
      WHERE u.id IS NULL
    `);
    if (Number(orphanCheck.rows[0].orphans) > 0) {
      throw new Error(`Found ${orphanCheck.rows[0].orphans} orphaned submission records`);
    }
    return 'Zero orphaned submissions detected.';
  });

  // 2. Student Directory Cache
  await recordTest('Student Directory Service', 'Student Name Sanitization & Formatting', async () => {
    const cleaned = cleanStudentName('K. Tharun Kumar');
    if (cleaned !== 'THARUN KUMAR K') throw new Error(`Unexpected name formatting: ${cleaned}`);
    return `Cleaned "K. Tharun Kumar" -> "${cleaned}"`;
  });

  await recordTest('Student Directory Service', 'Database Sync & Section Files Generation', async () => {
    const syncRes = await syncAndGenerateStudentDirectory();
    if (!syncRes.success) throw new Error('Directory sync failed');
    return `Synced ${syncRes.totalStudents} students into ${syncRes.yearFolders.length} year folders`;
  });

  // 3. Compiler Sandboxing
  await recordTest('Compiler Sandbox', 'Python 3 Code Execution & Output Normalization', async () => {
    const pyCode = `import sys\nname = sys.stdin.read().strip()\nprint(f"Hello, {name}!")`;
    const res = await evaluateCodeSandbox('python', pyCode, [
      { input_data: 'VSBEC IT\n', expected_output: 'Hello, VSBEC IT!\n', is_hidden: false }
    ]);
    if (res.status !== 'ACCEPTED') throw new Error(`Python execution failed with status: ${res.status}`);
    return `Status: ${res.status} (${res.max_execution_time_ms}ms)`;
  });

  await recordTest('Compiler Sandbox', 'C Language Compilation & Execution', async () => {
    const cCode = `#include <stdio.h>\nint main() {\n  int a, b;\n  if (scanf("%d %d", &a, &b) == 2) {\n    printf("%d\\n", a + b);\n  }\n  return 0;\n}`;
    const res = await evaluateCodeSandbox('c', cCode, [
      { input_data: '14 28\n', expected_output: '42\n', is_hidden: false }
    ]);
    if (res.status !== 'ACCEPTED') throw new Error(`C execution failed with status: ${res.status}`);
    return `Status: ${res.status} (${res.max_execution_time_ms}ms)`;
  });

  await recordTest('Compiler Sandbox', 'C++ Language Compilation & Execution', async () => {
    const cppCode = `#include <iostream>\n#include <string>\nint main() {\n  std::string s;\n  std::cin >> s;\n  std::cout << "Echo: " << s << std::endl;\n  return 0;\n}`;
    const res = await evaluateCodeSandbox('cpp', cppCode, [
      { input_data: 'Techsquad\n', expected_output: 'Echo: Techsquad\n', is_hidden: false }
    ]);
    if (res.status !== 'ACCEPTED') throw new Error(`C++ execution failed with status: ${res.status}`);
    return `Status: ${res.status} (${res.max_execution_time_ms}ms)`;
  });

  await recordTest('Compiler Sandbox', 'Java 17 Compilation & Execution', async () => {
    const javaCode = `import java.util.Scanner;\npublic class Solution {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    if (sc.hasNext()) {\n      System.out.println("Java: " + sc.next());\n    }\n  }\n}`;
    const res = await evaluateCodeSandbox('java', javaCode, [
      { input_data: 'Verified\n', expected_output: 'Java: Verified\n', is_hidden: false }
    ]);
    if (res.status !== 'ACCEPTED') throw new Error(`Java execution failed with status: ${res.status}`);
    return `Status: ${res.status} (${res.max_execution_time_ms}ms)`;
  });

  await recordTest('Compiler Sandbox', 'Security & Timeout Guard (Infinite Loop Interception)', async () => {
    const infiniteLoopCode = `while True:\n    pass`;
    const res = await evaluateCodeSandbox('python', infiniteLoopCode, [
      { input_data: '', expected_output: 'never', is_hidden: false }
    ]);
    if (res.status !== 'TIME_LIMIT_EXCEEDED') throw new Error(`Expected TIME_LIMIT_EXCEEDED, got ${res.status}`);
    return `Detected timeout properly: ${res.status}`;
  });

  // 4. Report Generation
  await recordTest('HR Report Engine', 'Coding Assessment Report (Excel, HTML/PDF, CSV)', async () => {
    const mockData = [
      {
        candidate_name: 'John Doe',
        register_number: '922524205001',
        department: 'Information Technology',
        score: 85,
        status: 'PASSED',
        proctoring_status: 'NORMAL'
      }
    ];

    const excelBuf = await generateExcelReport('coding-assessment', 'Tech Corp', mockData);
    if (!excelBuf || excelBuf.length === 0) throw new Error('Excel buffer generation failed');

    const htmlStr = generateHTMLPDFReport('coding-assessment', 'Tech Corp', mockData);
    if (!htmlStr || !htmlStr.includes('Tech Corp')) throw new Error('HTML generation failed');

    const csvStr = generateCSVReport(mockData);
    if (!csvStr || !csvStr.includes('922524205001')) throw new Error('CSV generation failed');

    return `Generated Excel (${excelBuf.length} B), HTML (${htmlStr.length} chars), CSV (${csvStr.length} chars)`;
  });

  // 5. Telegram Formatting Safety
  await recordTest('Telegram Engine', 'HTML Tag & Special Characters Escaping', async () => {
    const dirty = '<script>alert("hack")</script> & <b>bold</b> "quotes"';
    const clean = escapeHtml(dirty);
    if (clean.includes('<script>') || clean.includes('& ') || clean.includes('"quotes"')) {
      throw new Error(`Unescaped characters in: ${clean}`);
    }
    return `Escaped: "${clean}"`;
  });

  // 6. Email Pool & Telemetry
  await recordTest('Email Infrastructure', 'Multi-Node Brevo Email Pool & Quota Resolver', async () => {
    const status = await getLiveEmailNodesStatus();
    return `${status.nodes.length} nodes configured | ${status.totalAvailableCredits} credits remaining (${status.healthyNodesCount} healthy)`;
  });

  // Display summary table
  console.table(results.map(r => ({
    Category: r.category,
    Test: r.test,
    Status: r.status,
    Duration: `${r.durationMs || 0}ms`,
    Details: r.details || ''
  })));

  const totalPassed = results.filter(r => r.status === '✅ PASS').length;
  const totalFailed = results.filter(r => r.status === '❌ FAIL').length;

  console.log(`\nAudit Complete: ${totalPassed}/${results.length} PASSED (${totalFailed} FAILED)\n`);

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runDeepAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
