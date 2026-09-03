<div align="center">

# 🎓 ACADEMIA–INDUSTRY INTEGRATED PLATFORM & ACADEMIC TASK MANAGER
### *Enterprise Academic Governance, Live Coding Analytics, AI Skill Gap Intelligence & Multi-Language Sandboxed Assessment Engine*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Monaco Editor](https://img.shields.io/badge/Monaco_IDE-VS_Code_Core-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white)](https://microsoft.github.io/monaco-editor/)
[![Telegram Bot](https://img.shields.io/badge/Telegram_Bot-Automated_Poller-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://core.telegram.org/bots/api)
[![PWA](https://img.shields.io/badge/PWA-Web_Push_VAPID-FF6B6B?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

<p align="center">
  <b>Department of Information Technology</b> • <b>VSB Engineering College, Karur</b><br/>
  <i>An Autonomous Institution • Accredited by NAAC with 'A' Grade • Approved by AICTE</i><br/>
  <b>SIH26044 Academia–Industry Innovation Platform</b>
</p>

---

</div>

## 📑 Table of Contents
- [Executive Overview & Vision](#-executive-overview--vision)
- [Comprehensive System Architecture](#-comprehensive-system-architecture)
- [Deep Multi-Role Hierarchy & Governance Matrix](#-deep-multi-role-hierarchy--governance-matrix)
- [End-to-End Operational Workflows](#-end-to-end-operational-workflows)
  - [1. Academic Task Lifecycle & Verification Workflow](#1-academic-task-lifecycle--verification-workflow)
  - [2. Live Coding Intelligence & Daily Daemon Sync](#2-live-coding-intelligence--daily-daemon-sync)
  - [3. Short Industry Coding Assessment & Sandbox Execution](#3-short-industry-coding-assessment--sandbox-execution)
  - [4. AI Skill Gap & Career Intelligence Matching Engine](#4-ai-skill-gap--career-intelligence-matching-engine)
  - [5. Automated Telegram Bot & Omnichannel Alert Automation](#5-automated-telegram-bot--omnichannel-alert-automation)
  - [6. Corporate Industry Portal & HR Report Generation](#6-corporate-industry-portal--hr-report-generation)
- [Compiler Sandbox & Security Guard Architecture](#-compiler-sandbox--security-guard-architecture)
- [Database Schema Architecture (35 Relational Tables)](#-database-schema-architecture-35-relational-tables)
- [Installation & Local Deployment Guide](#-installation--local-deployment-guide)
- [Verification & Automated Test Suite](#-verification--automated-test-suite)
- [License & Intellectual Property](#-license--intellectual-property)

---

## 📌 Executive Overview & Vision

The **Academia–Industry Integrated Platform & IT Task Manager** is an institutional governance, technical competency tracking, and corporate recruitment ecosystem. Designed to bridge traditional academic management with competitive industry expectations, the system addresses three critical institutional challenges:

1. **Academic Task Oversight & Peer Governance**: Eliminates lost assignments and fragmented submission records by enforcing a multi-tier review pipeline (Student Coordinator Peer Review $\rightarrow$ Class Advisor Validation $\rightarrow$ HOD Oversight).
2. **Coding Velocity & Habit Tracking**: Integrates automated background synchronization with LeetCode GraphQL and GitHub REST APIs to track daily problem solving and Git commit momentum across all enrolled students.
3. **Corporate Recruitment & Multi-Compiler Assessments**: Equips corporate hiring partners with a Monaco IDE assessment suite featuring multi-compiler sandboxing (C, C++, Java 17, Python 3), automated test case validation, anti-cheat webcam PIP proctoring, AI skill-gap matching, and multi-format reporting (Excel, PDF, CSV).

---

## 🏛️ Comprehensive System Architecture

```mermaid
flowchart TD
    subgraph Client["🖥️ Presentation Layer (React 19 + TypeScript + Tailwind CSS)"]
        UI_Admin["🛡️ Supreme Admin & HOD Command Center"]
        UI_Faculty["👨‍🏫 Year & Class Advisor Workspace"]
        UI_Student["🎓 Student Portal & Monaco Assessment Studio"]
        UI_Industry["🏢 Corporate HR & Talent Acquisition Portal"]
        UI_PWA["📱 PWA Web Push Client Worker"]
    end

    subgraph Gateway["⚡ API Gateway & Core Application Server (Express.js)"]
        Auth["🔐 Dynamic RBAC & JWT Security Guard"]
        TaskEngine["📝 Task Submission & Multi-Level Verification"]
        Sandbox["⚡ Multi-Language Sandboxed Compiler (C, C++, Java, Python)"]
        MatchAI["🧠 4-Pillar AI Skill Gap & Readiness Analyzer"]
        BotEngine["🤖 Telegram Interactive Poller & 8:00 AM Scheduler"]
        PushEngine["🔔 Web Push VAPID Notification Engine"]
        ReportEngine["📊 HR OpenXML Excel, CSV & HTML-PDF Generator"]
        EmailPool["📧 Multi-Account Brevo HTTPS Dispatch Pool"]
        CacheLayer["⚡ In-Memory RAM Directory Cache (<0.01ms Lookups)"]
    end

    subgraph Storage["💾 Persistence & External Cloud Layer"]
        DB[("🗄️ PostgreSQL Database (35 Tables with RLS)")]
        Cloudinary["🖼️ Cloudinary CDN (Task Proof Assets)"]
        LeetCodeAPI["☁️ LeetCode GraphQL Endpoint"]
        GitHubAPI["☁️ GitHub REST API v3"]
        TelegramAPI["📱 Telegram Bot API Gateway"]
        BrevoAPI["✉️ Brevo HTTPS Transactional API"]
    end

    Client --> Gateway
    Gateway --> Storage
```

---

## 👥 Deep Multi-Role Hierarchy & Governance Matrix

The system implements a role-based access control (RBAC) model across academic and external personas:

| Role Name | Scope & Authority | Primary Responsibilities |
| :--- | :--- | :--- |
| **Supreme Admin** | Global Institutional Scope | Master user provisioning, department configurations, system audit logs, global Excel downloads, and corporate HR account verifications. |
| **Head of Department (HOD)** | Department-wide Scope | Department oversight, class advisor assignments, overall submission approvals, placement readiness index analytics, and custom class reports. |
| **Class Advisor (Faculty)** | Single Class / Section Scope | Final verification of task submissions, rejection management with feedback, student profile approval, attendance & academic monitoring. |
| **Student Coordinator** | Peer Class Scope | Peer review and pre-verification of classmate task submissions, pending task reminders, and cohort coordination. |
| **Student / Candidate** | Individual Student Scope | Task submission with image proof, LeetCode / GitHub profile linking, timed coding assessments, AI skill gap analysis, and job applications. |
| **Industry Partner (HR)** | Corporate Hiring Scope | Job, internship, and research posting creation, 10-question coding assessment management, applicant shortlisting, and candidate report export. |

---

## 🔄 End-to-End Operational Workflows

### 1. Academic Task Lifecycle & Verification Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Advisor as Class Advisor / Faculty
    actor Student as Student
    actor Coord as Student Coordinator
    participant Server as Backend API Server
    participant Cloudinary as Cloudinary CDN
    participant DB as PostgreSQL Database
    participant Telegram as Telegram Bot / Web Push

    Advisor->>Server: POST /api/tasks (Create Task with Deadline & Guidelines)
    Server->>DB: INSERT INTO tasks
    Server->>Telegram: Broadcast Task Alert to Class Chat & Web Push
    
    Student->>Server: POST /api/submissions (Submit Proof Screenshot & Notes)
    Server->>Cloudinary: Upload & Optimize Proof Image
    Server->>DB: INSERT INTO submissions (Status: PENDING_PEER_REVIEW)
    
    Coord->>Server: PUT /api/submissions/:id/peer-review (Approve / Request Revision)
    Server->>DB: UPDATE submissions (Status: PENDING_FACULTY_APPROVAL)
    
    Advisor->>Server: PUT /api/submissions/:id/verify (Final Verification)
    Server->>DB: UPDATE submissions (Status: VERIFIED)
    Server->>Telegram: Send Confirmation Notification to Student
```

---

### 2. Live Coding Intelligence & Daily Daemon Sync

```mermaid
sequenceDiagram
    autonumber
    participant Daemon as Server Background Daemon
    participant LC as LeetCode GraphQL API
    participant GH as GitHub REST API v3
    participant DB as PostgreSQL Database
    participant Telegram as Telegram Alert Bot

    Note over Daemon: 23:50 IST: Daily Scheduled Execution
    Daemon->>DB: SELECT student_coding_profiles (All Active Students)
    
    loop For Each Student
        Daemon->>LC: Query user profile, total solved, ranking
        Daemon->>GH: Query public events, daily commit counts
        Daemon->>DB: INSERT INTO leetcode_daily_progress & github_daily_progress
        Daemon->>DB: UPDATE student_coding_profiles (latest cache)
    end
    
    Note over Daemon: 08:00 AM IST: Morning Quota Evaluator
    Daemon->>DB: Calculate unmet coding targets
    Daemon->>Telegram: Dispatch personalized motivation / reminder alerts
```

---

### 3. Short Industry Coding Assessment & Sandbox Execution

The assessment engine supports timed corporate technical evaluations:
1. **10-Question Pool & 2-Question Random Assignment**: Corporate recruiters create a pool of 10 questions with test cases. On start, each candidate receives 2 unique questions.
2. **Multi-Language Sandboxed Execution**: Code submitted in **C, C++, Java 17, or Python 3** is compiled and executed in a sandboxed runtime with CPU timeout and memory bounds.
3. **Webcam Anti-Cheat PIP Proctoring**: Enforces fullscreen mode and continuous webcam feed capture to log focus exits and tab switches.

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Student / Candidate
    actor HR as Corporate HR Recruiter
    participant Server as Backend API Gateway
    participant Sandbox as Multi-Compiler Sandbox
    participant DB as PostgreSQL Database

    HR->>Server: POST /api/industry/coding-assessments (Create 10-Question Pool)
    Server->>DB: Store Assessment & Test Cases
    
    Candidate->>Server: POST /api/student/coding-assessments/:id/start
    Server->>DB: Randomly select 2 questions & assign to Candidate
    Server->>Candidate: Return Attempt Token, 2 Questions & Starter Code
    
    loop During Assessment
        Candidate->>Server: POST /api/sandbox/run (Execute Code against Sample Cases)
        Server->>Sandbox: Compile & Execute in Sandbox
        Sandbox->>Server: Return stdout, execution time, memory
        Server->>Candidate: Display Execution Result
    end
    
    Candidate->>Server: POST /api/student/coding-assessments/:id/submit
    Server->>Sandbox: Execute Hidden Test Cases (All Languages)
    Server->>DB: Record Score, Pass/Fail Status, Time Taken
    Server->>HR: Assessment Complete (Instant HR Dashboard Update)
```

---

### 4. AI Skill Gap & Career Intelligence Matching Engine

The AI matching algorithm evaluates candidate fit using a weighted composite formula:

$$\text{Match Score} = \left( \sum_{i=1}^{n} w_i \cdot \min\left(\frac{\text{Student Level}_i}{\text{Required Level}_i}, 1.0\right) \times 0.80 \right) + \left( \min\left(\frac{\text{CGPA}}{10}, 1.0\right) \times 0.10 \right) + \left( \min\left(\frac{\text{LeetCode Solved}}{500}, 1.0\right) \times 0.10 \right)$$

- **Weighted Skills (80%)**: Evaluates candidate verified proficiencies against corporate required skills.
- **Academic Discipline (10%)**: Contributed by verified university CGPA.
- **Coding Vigor (10%)**: Milestone bonus earned from verified LeetCode problem solving.

---

### 5. Automated Telegram Bot & Omnichannel Alert Automation

The native Telegram bot engine runs an interactive concurrent poller supporting:
- `/start <token>`: One-click account linking with 6-digit cryptographic handshake.
- `/status`: Instant submission status summary and pending tasks count.
- `/tasks`: Active pending assignments with deadlines.
- `/leetcode`: Real-time LeetCode ranking, total solved, and streak metrics.
- `/help`: Full command manual and advisor contact channel.
- **Daily 8:00 AM IST Broadcast**: Automatically calculates all pending submissions due that day and sends individual alerts to students.

---

### 6. Corporate Industry Portal & HR Report Generation

Corporate recruiters can monitor applicant pools and download recruitment reports:
- **Excel Report (.xlsx)**: Formatted workbook generated using `ExcelJS` with corporate headers, pass/fail status, scores, and execution metrics.
- **HTML/PDF Printable Report**: Formal candidate scorecard suitable for print/PDF archiving.
- **CSV Data Stream**: Raw data export for ATS integration.

---

## ⚡ Compiler Sandbox & Security Guard Architecture

The compilation and execution engine processes code across 4 major languages:

```
┌─────────────────┬─────────────────┬────────────────────┬────────────────────┐
│ Language        │ Compiler / VM   │ Compilation Flags  │ Security Bounds    │
├─────────────────┼─────────────────┼────────────────────┼────────────────────┤
│ C               │ GCC 6.3.0+      │ gcc -O2 -std=c11   │ 4000ms CPU Timeout │
│ C++             │ G++ 6.3.0+      │ g++ -O2 -std=c++17 │ 4000ms CPU Timeout │
│ Java            │ OpenJDK 17      │ javac -> java      │ 6000ms CPU Timeout │
│ Python 3        │ Python 3.11+    │ python -u          │ 4000ms CPU Timeout │
└─────────────────┴─────────────────┴────────────────────┴────────────────────┘
```

**Security Protections**:
1. **Isolated Temp Runtimes**: Every execution occurs inside an ephemeral directory with strict path sanitization.
2. **Infinite Loop Interception**: Asynchronous process management kills hanging child processes cleanly with timeout diagnostics.
3. **Output Normalization**: Strips trailing whitespace and carriage returns (`\r\n` $\rightarrow$ `\n`) for cross-platform test case matching.

---

## 🗄️ Database Schema Architecture (35 Relational Tables)

The database schema is organized into 5 relational modules:

1. **Authentication & User Hierarchy**: `users`, `departments`, `classes`, `notification_preferences`, `password_resets`.
2. **Academic Task Governance**: `tasks`, `submissions`, `submission_history`, `task_attachments`, `task_templates`.
3. **Coding Velocity & Metrics**: `student_coding_profiles`, `leetcode_daily_progress`, `github_daily_progress`, `coding_targets`.
4. **Placement & Assessment Engine**: `skill_assessments`, `skill_assessment_tracks`, `skill_questions`, `assessment_attempts`, `assessment_answers`, `student_skills`, `student_profiles`.
5. **Corporate Hiring & Recruitment**: `company_profiles`, `industry_postings`, `posting_applications`, `short_coding_assessments`, `coding_assessment_questions`, `coding_assessment_test_cases`, `coding_assessment_attempts`, `coding_assessment_submissions`, `faculty_industry_collaborations`, `skill_gap_recommendations`.

---

## 🚀 Installation & Local Deployment Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **Compilers** (for code execution): `gcc`, `g++`, `java` (JDK 17), `python` (3.10+)

### Step-by-Step Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Tharun4743/taskmanager.git
   cd taskmanager
   ```

2. **Install Node Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and provide your credentials:
   ```bash
   cp .env.example .env
   ```
   *Required variables*:
   - `DATABASE_URL`: PostgreSQL connection URI (`postgresql://user:pass@host:5432/dbname`)
   - `JWT_SECRET`: 64-character random secret key
   - `TELEGRAM_BOT_TOKEN`: Token from [@BotFather](https://t.me/botfather)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Cloudinary asset upload credentials

4. **Initialize Database Tables**:
   ```bash
   npm run build
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open **`http://localhost:3000`** in your browser.

---

## 🧪 Verification & Automated Test Suite

Run the full system audit suite covering database integrity, foreign keys, compiler sandboxing, infinite loop guards, and report generation:

```bash
npx tsx scratch/deep_system_audit.ts
```

**Audit Output Preview**:
```
════════════════════════════════════════════════════════════════════
       🔍 DEEP SYSTEM & REPOSITORY AUDIT (FULL SUITE)
════════════════════════════════════════════════════════════════════
┌─────────┬────────────────────────────┬──────────────────────────────────────────────────────┬───────────┐
│ (index) │ Category                   │ Test                                                 │ Status    │
├─────────┼────────────────────────────┼──────────────────────────────────────────────────────┼───────────┤
│ 0       │ 'Database Integrity'       │ 'Check Essential Tables Exist'                       │ '✅ PASS' │
│ 1       │ 'Database Integrity'       │ 'Check Foreign Key Orphan Records'                   │ '✅ PASS' │
│ 2       │ 'Database Integrity'       │ 'Check System Roles & User Distribution'             │ '✅ PASS' │
│ 3       │ 'Compiler Sandbox'         │ 'C Language Compilation & Execution'                 │ '✅ PASS' │
│ 4       │ 'Compiler Sandbox'         │ 'C++ Language Compilation & Execution'               │ '✅ PASS' │
│ 5       │ 'Compiler Sandbox'         │ 'Python 3 Execution & Normalization'                 │ '✅ PASS' │
│ 6       │ 'Compiler Sandbox'         │ 'Java (JDK 17) Compilation & Execution'              │ '✅ PASS' │
│ 7       │ 'Compiler Sandbox'         │ 'Security & Timeout Guard (Infinite Loop Detection)' │ '✅ PASS' │
│ 8       │ 'Compiler Sandbox'         │ 'Syntax Error & Compilation Failure Handling'        │ '✅ PASS' │
│ 9       │ 'HR Report Engine'         │ 'Coding Assessment Report (CSV, Excel, PDF)'         │ '✅ PASS' │
│ 10      │ 'HR Report Engine'         │ 'Recruitment Summary Report'                         │ '✅ PASS' │
│ 11      │ 'Coding Assessment Engine' │ 'Verify 10-Question Pool & 2-Question Randomness'    │ '✅ PASS' │
│ 12      │ 'Dead Code Audit'          │ 'Check Stale and Orphaned Tables/Columns'            │ '✅ PASS' │
└─────────┴────────────────────────────┴──────────────────────────────────────────────────────┴───────────┘
Audit Complete: 13/13 PASSED (0 FAILED)
```

---

## 📜 License & Intellectual Property

This project is developed for the **Department of Information Technology, VSB Engineering College, Karur** as part of the **Smart India Hackathon (SIH26044)** initiative.

Copyright © 2026 Tharunkumar K & Department of Information Technology, VSB Engineering College. All rights reserved.
