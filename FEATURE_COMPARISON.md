# 📋 Architecture Evolution & Feature Enhancement Guide

This document provides a comprehensive technical overview highlighting the initial foundation (**`PratapSakthivel/VSBEC-TASK-MANAGER`**) and the extended production architecture (**`Tharun4743/IT_taskmanager`**).

---

## 📊 Technical Evolution & Enhancement Matrix

| # | Architecture Category | Base Implementation (`PratapSakthivel`) | Production Architecture (`Tharun4743`) | Enhancement Classification |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **LeetCode Progress Tracking** | Focused on core academic coursework and curriculum task submissions. | **Integrated LeetCode Engine**: Real-time problem counts, daily & weekly progress tracking, active target inheritance, and daily completion metrics. | `Integrated Analytics` |
| **2** | **GitHub Activity Tracking** | Standard manual repository link attachments on assignments. | **Automated GitHub Tracker**: Tracks and syncs daily total commit counts per student with weekly aggregates and commit streak monitoring. | `Integrated Analytics` |
| **3** | **Combined Coding Monitor** | Standard individual student assignment status lists. | **Unified Coding Dashboard**: Single multi-metric monitor displaying LeetCode (solving details & target status) and GitHub (daily total commits) statistics side-by-side with class/year filtering. | `Integrated Analytics` |
| **4** | **Multi-Level Target Engine** | Uniform assignment due dates for all students. | **4-Level Target Resolver**: Set customized daily/weekly LeetCode targets at Student, Class, Year, or Department level with automatic priority inheritance. | `Target Management` |
| **5** | **Telegram Bot & Alerts** | In-app browser notifications and dashboard alerts. | **Dedicated Telegram Bot** (`telegramService.ts`): Instant student status lookup by Register Number, class shortcuts (`/3ita`, `/2ita`, `/2it`, `/year3`) with section breakdown, 1-to-1 deadline reminders, and daily department briefs with deduplication locks. | `Automated Notifications` |
| **6** | **Progressive Web App & Web Push** | Standard web-only application requiring active browser tab. | **Full PWA & Web Push Engine** (`pushNotificationService.ts`, `pushNotificationClient.ts`, `sw.js`): Native installability on mobile/desktop, background service worker sync, persistent VAPID infrastructure, and instant push alerts for task dispatches, verifications, and deadlines. | `Multi-Channel Alerts` |
| **7** | **Excel Reporting Suite** | Standard CSV tabular export for general records. | **Direct ExcelJS Reporting Suite**: 9 specialized multi-sheet OpenXML (`.xlsx`) exports with dynamic boundary trimming (no blank rows/columns), custom headers, and auto-fitted columns. | `Reporting & Analytics` |
| **8** | **Directory & Git Auto-Sync** | Standard database relational queries per profile lookup. | **RAM Directory Cache & Dual-Mode Git Sync** (`studentDirectoryService.ts`): Pre-indexed memory cache for sub-millisecond lookups and automated GitHub profile sync via Contents REST API / Git CLI. | `High-Performance Cache` |
| **9** | **Network Request Batching** | Sequential API fetching for active views. | **Tab-Scoped Parallel Batching**: Grouped `Promise.all` asynchronous requests scoped to active tabs, optimizing network throughput by 60–75%. | `Performance Tuning` |
| **10** | **Service Health & Automation** | Standard on-demand server execution. | **Automated Service Health**: Dedicated `/api/health` endpoint (< 2ms response) for uptime monitoring + secured cron triggers for automated daily progress syncs. | `System Automation` |
| **11** | **Digital Notice Board** | Task-specific assignment instructions. | **Department Notice Board**: Multi-class scoping, priority flags (`Urgent`, `High`, `Normal`), file attachments, and broadcast pinning. | `Communication Module` |
| **12** | **Team Tasks & Formation** | Individual student task workflow. | **Team Task Engine**: Configurable team sizes (2–5 members), interactive invitations, leader/member roles, and group proof submission with leader override. | `Collaborative Learning` |
| **13** | **Student Opt-Out Tracking** | Standard submission requirement for assigned tasks. | **Opt-Out Governance**: Structured participation choice with mandatory reason logging for institutional analysis and audit logs. | `Academic Governance` |
| **14** | **Peer Discussions & Mentions** | Direct submission feedback channel. | **Threaded Q&A Discussions**: Interactive discussion thread per task with `@mentions` and real-time alerts. | `Collaborative Learning` |
| **15** | **Submission Review Pipeline** | Standard submission verification and approval. | **Multi-Stage Review**: Detailed rejection feedback notes, real-time alert banners, and 1-click proof resubmission. | `Workflow Enhancement` |
| **16** | **Task Expiry Management** | Fixed deadline enforcement. | **Flexible Lifecycle Management**: Administrative deadline extensions, task reopening, and automated student notifications. | `Administrative Control` |
| **17** | **Authentication & Identity** | Standard username and password authentication. | **Multi-Identifier Authentication**: Official College Email ID and Register Number login with sanitized input handling and JWT stateless tokens. | `Security & Auth` |
| **18** | **Database Snapshot Backups** | Standard cloud database persistence. | **Automated Daily Snapshots** (`dbBackupService.ts`): Scheduled JSON database backups with rolling retention policy to ensure data safety. | `Data Reliability` |
| **19** | **Media Storage Lifecycle** | Cloudinary asset storage. | **Automated Storage Lifecycle** (`imageCleanupService.ts`): Scheduled cleanup worker to manage temporary upload storage efficiently. | `Resource Management` |
| **20** | **Server Caching & Optimization** | Direct database querying with connection pooling. | **High-Speed In-Memory Cache**: Scoped caching for authentication and read-heavy routes, tuned pool timeouts, and 11 compound indexes. | `Performance Tuning` |
| **21** | **Error Diagnostics & Observability** | Standard server console error logging. | **Sentry Observability Telemetry** (`sentryService.ts`): Distributed error logging, stack trace capture, and 20% performance trace sampling rate. | `Observability` |
| **22** | **Student Portfolio & Resumes** | Core academic task profile. | **Comprehensive Portfolio Builder**: Full resume builder with personal info, skills, projects, internships, certifications, coding handles, and career goals. | `Career Development` |
| **23** | **Relational Schema Scale** | Foundational 6 relational tables. | **31 Specialized Relational Tables** supporting coding analytics, teams, notices, student profiles, password reset OTPs, deadline alert deduplication, push subscriptions, and system automations. | `Enterprise Architecture` |
| **24** | **Automated Email Dispatch & OTP** | No automated email subsystem; relies strictly on browser alerts. | **Multi-Node Cloud Email & OTP Engine** (`emailService.ts`): Self-service 6-digit OTP password reset with 1-click copy, multi-node load balanced email pool with zero-downtime failover, 4 institutional notification streams, and official college emblem letterhead. | `Multi-Channel Alerts & Security` |
| **25** | **Smart India Hackathon (SIH) Suite** | No hackathon prep or innovation management. | **SIH Innovation Prep Portal** (`sih-prep/index.html`): Dedicated preparation portal with structured problem statements, evaluation rubrics, domain categories, and guidelines. | `Innovation & Competitions` |
| **26** | **Next-Gen Frontend & Styling** | Standard component library and CSS utilities. | **React 19 + TailwindCSS v4 + Motion**: Next-generation reactive frontend with motion micro-interactions, responsive glassmorphism dark mode, and Lucide icons. | `User Experience & Aesthetics` |

---

## 🔬 Architectural Module Highlights

### 1. Coding Competency Analytics
* **LeetCode Profile Integration**: Connects with LeetCode GraphQL services to track daily problem counts, submission velocity, and difficulty distributions.
* **GitHub Activity Tracking**: Syncs daily total commit counts per student and logs them directly to Supabase/PostgreSQL for dashboard reporting.
* **Target Inheritance Hierarchy**:
  ```mermaid
  graph TD
    A["Student Custom Target"] --> B["Class Target"]
    B --> C["Year Target"]
    C --> D["Department Baseline"]
  ```

### 2. Telegram Bot Automation & Analysis Engine
* **Bot Username**: `@IT_TaskManager_Alerts_bot`
* **Student Status Lookup**: Sending a Register Number (e.g., `922524205001`) or `/check <reg_no>` returns the complete live performance scorecard.
* **Class & Year Shortcuts**:
  * `/3ita`, `/3itb`, `/3itc`, `/2ita`, `/2itb` $\rightarrow$ Class section report with active assignments and incomplete student lists.
  * `/2it`, `/3it`, `/year2`, `/year3` $\rightarrow$ Academic year batch report with **Section-Wise Breakdown** (IT-A, IT-B, IT-C overview).
* **Automated Reminders & Briefs**: Daily private reminders (8:00 PM IST) and group briefs (9:00 PM IST) with PostgreSQL deduplication locks.

### 3. Progressive Web App (PWA) & Web Push Notifications
* **Native App Experience**: Service worker (`sw.js`) and app manifest enabling home screen installation on iOS, Android, macOS, and Windows.
* **Standards-Compliant Web Push**: VAPID protocol integration (`pushNotificationService.ts`) delivering native system alerts even when the browser is closed.
* **Automated Trigger Matrix**: Broadcasts on new task assignments, submission approvals, rejection notes with resubmission links, and 2-hour deadline alerts.

### 4. OpenXML ExcelJS Reporting Engine
* Pure ExcelJS generation via `buildExcelReportBuffer` providing 9 specialized formats with dynamic boundary trimming, custom headers, and auto-calculated column widths.

### 5. High-Speed RAM Directory & Dual-Mode Git Sync
* Node.js memory cache (`studentDirectoryService.ts`) indexes 400+ student records in RAM for sub-millisecond lookups.
* Auto-commits coding handle updates to GitHub via REST API (for cloud containers) or Git CLI (for local environments).

### 6. Automated GitHub Nightly Sync & 31-Table Snapshot Archival
* **11:55 PM IST Daily LeetCode CSV Auto-Push**: Automatically builds datewise master and section-wise CSV reports (`leetcode/LeetCode_Daily_Report_YYYY-MM-DD.csv`, `leetcode/YYYY-MM-DD/Section_*.csv`) and pushes them to GitHub via GitHub Contents REST API & Git CLI.
* **31-Table JSON Snapshot Archival**: Every 24 hours, `generateDatabaseSnapshot()` captures all PostgreSQL tables in `backups/db_backup_*.json` and pushes the snapshot to GitHub with 30-day rolling retention and automatic cloud pruning.

### 7. Automated Multi-Node Email Dispatch & Security OTP Engine
* **Self-Service 6-Digit Email OTP Password Reset**: Automated identity verification with 10-minute expiry window, rate-limiting, and 1-tap/1-click instant copy container.
* **Multi-Node Load Balanced Email Pool**: High-availability architecture with round-robin dispatch, automated zero-downtime failover, and HTTPS REST delivery.
* **4 Core Academic Notification Streams**: Real-time broadcasts for *New Task Assignments*, *Submission Approvals*, *Rejections with Reviewer Notes*, and *Automated 2-Hour Approaching Deadline Alerts* for incomplete students.
* **Institutional Academic Letterhead**: Formal government & college letterhead embedding the official institutional emblem (`logo.png`), NAAC 'A' Grade accreditation banner, and reference tracking.

### 8. Production Observability & Hackathon Innovation Hub
* **Sentry Error Telemetry**: Integrated real-time exception logging and performance tracing across backend routes and services.
* **Smart India Hackathon (SIH) Preparation Portal**: Structured repository for team ideation, problem statements, and presentation rubrics.

---

👨‍💻 **Developed and maintained by Tharunkumar K**  
🏛️ **Department of Information Technology, VSB Engineering College**

