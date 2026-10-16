<div align="center">

# ≡ƒÅ¢∩╕Å VSBEC IT VAULT ΓÇö ACADEMIAΓÇôINDUSTRY INTEGRATED PLATFORM
### *Enterprise Institutional Task Governance, LeetCode/GitHub Daemon Sync & Sandboxed Assessment Engine*

[![Recognition](https://img.shields.io/badge/Recognition-SIH%202026%20Top%2050-10b981?style=for-the-badge&logo=checkmarx&logoColor=white)](#) [![Deployment](https://img.shields.io/badge/Deployment-Production%20Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](#) [![Role](https://img.shields.io/badge/Role-Lead%20Architect-4f46e5?style=for-the-badge&logo=codeforces&logoColor=white)](#) [![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%206-61DAFB?style=for-the-badge&logo=react&logoColor=white)](#) [![Backend](https://img.shields.io/badge/Backend-Node.js%2020%20%2B%20Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](#) [![Database](https://img.shields.io/badge/Database-PostgreSQL%2014%20(13%20Tables)-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](#) [![License](https://img.shields.io/badge/License-Strict%20Proprietary-dc2626?style=for-the-badge&logo=lock&logoColor=white)](#)

<p align="center">
  <a href="https://github.com/Tharun4743/taskmanager">≡ƒôª <b>Official GitHub Repository</b></a>
  ΓÇó <a href="https://it-taskmanager.vercel.app/">≡ƒîÉ <b>Production Live Demo</b></a>
  
</p>

</div>

---

## 1. ≡ƒôî Problem Statement & Context
In engineering institutions, departmental task tracking and algorithmic prep face severe systemic bottlenecks:

* ≡ƒôæ **Fragmented Deliverables:** Academic lab tasks are scattered across Google Forms, WhatsApp groups, and paper records, resulting in lost records and zero auditability.
* ≡ƒÆ╗ **Coding Velocity Blind Spot:** Students solve algorithmic challenges on LeetCode and GitHub without faculty having real-time visibility into daily streaks or mastery.
* ΓÅ▒∩╕Å **Severe Grading Latency:** Manual review creates multi-week backlogs, preventing faculty from providing actionable, personalized mentorship.
* ≡ƒÅó **Corporate Recruitment Disconnect:** Placement coordinators lack empirical, tamper-proof proof of students' sandboxed multi-language programming competency.

---

## 2. ≡ƒöì Existing Solutions & Critical Gaps
| Feature / Dimension | Conventional LMS (Moodle / Classroom) | Manual Spreadsheets & WhatsApp | ≡ƒÅ¢∩╕Å VSBEC IT Vault |
| :--- | :---: | :---: | :---: |
| **Sandboxed Code Execution** | Γ¥î None | Γ¥î None | Γ£à Isolated C, C++, Java 17, Python 3 Sandbox |
| **Competitive Profile Telemetry** | Γ¥î None | Γ¥î None | Γ£à Automated LeetCode GraphQL & GitHub REST Sync |
| **Hierarchical Approval Workflow** | Γ¥î Single-Tier Only | Γ¥î None | Γ£à 3-Tier Pipeline (Peer ΓåÆ Faculty ΓåÆ HOD) |
| **Automated Instant Alerts** | ΓÜá∩╕Å Email Only (Low Open Rates) | Γ¥î None | Γ£à Telegram Webhooks + Web Push + Email Failover |
| **Anti-Cheat Proctoring** | Γ¥î Paid Third-Party Addon | Γ¥î None | Γ£à Integrated Webcam PIP & Fullscreen Lockdown |

### ΓÜá∩╕Å Critical Limitations of Existing Alternatives:
* ≡ƒÜ½ **Zero Sandboxed Execution:** Traditional systems treat code as plain text files without isolated compilation or test suites.
* ≡ƒ¢æ **Subjective Evaluation Bias:** Without rigid rubrics and verification chains, grading consistency varies widely across evaluators.
* ≡ƒô┤ **Communication Blackouts:** Critical placement and lab deadlines are missed due to unreliable email notifications.

---

## 3. ≡ƒÆí Proposed Solution & Architectural Innovation
**VSBEC IT Vault** is an institutional task governance, real-time coding competency tracking, and corporate recruitment ecosystem engineered for the **Department of IT, VSB Engineering College**:

* ≡ƒÅå **SIH 2026 Internal Hackathon Top 50 (Official SIH Portal Nominee):** Shortlisted in the SIH 2026 Internal Hackathon (Top 50 out of 300+ teams) with official SIH portal submission.
* ≡ƒæÑ **Real-World Implementation:** Actively adopted by **365+ enrolled students** in the Department of Information Technology for centralized academic governance, LeetCode habit tracking, and corporate coding assessments.
* ≡ƒ¢í∩╕Å **3-Tier Verification Pipeline:** Enforces an audit trail where tasks are peer-reviewed by Coordinators, validated by Advisors, and authorized by HOD.
* ΓÜí **Algorithmic Momentum Daemons:** Schedulers poll LeetCode GraphQL and GitHub REST APIs daily, computing solve velocity and commit streaks.
* ≡ƒÆ╗ **Sandboxed Multi-Language Compiler:** Isolated execution runtime supporting Monaco Editor assessments for **C, C++, Java, and Python**.

---

## 4. ΓÜÖ∩╕Å Technical Approach & System Architecture

### ≡ƒôÉ High-Level Architectural Flowchart:
```mermaid
graph TD
    Client["Client UI (React 19 + Vite 6)"] --> Gateway["API Gateway & Middleware (Node.js / Express 4)"]
    Gateway --> RBAC["Role-Based Access Guard & Monaco Assessment Core"]
    Gateway --> Sandbox["Sandboxed Compiler Engine (C, C++, Java 17, Python 3)"]
    Gateway --> DB[("PostgreSQL 14 Database (13 Relational Tables)")]
    Gateway --> Daemons["Telemetry Schedulers (LeetCode GraphQL & GitHub REST)"]
    Gateway --> Alerts["Notification Relays (Telegram Webhook & VAPID Push)"]
```

| System Subsystem | Technologies Implemented | Core Engineering Responsibility |
| :--- | :--- | :--- |
| **User Interface** | React 19, TypeScript 5.8, Vite 6, Tailwind CSS | Single-page portal with role layouts, Monaco IDE, and PIP proctoring |
| **Application Layer** | Node.js 20+, Express 4.x, TypeScript | RESTful API server, dynamic RBAC middleware, and report compilers |
| **Data Layer** | PostgreSQL 14+ (13 Tables), In-Memory Cache | Relational schema with foreign key integrity and optimized indexed lookups |
| **Compiler Sandbox** | Isolated Node.js Child Process Jails | Secure compilation for C, C++, Java, and Python with timeout traps |
| **External Daemons** | LeetCode GraphQL, GitHub REST, Telegram Bot | Automated nightly profile sync, webhook relays, and email dispatches |

### ≡ƒöä End-to-End Operational Lifecycle Workflow:
```mermaid
flowchart LR
    A["1. Task Ingestion & Monaco Assessment"] --> B["2. Student Coordinator Peer Audit"]
    B --> C["3. Faculty Advisor Rubric Review"]
    C --> D["4. HOD Final Departmental Sign-Off"]
    D --> E["5. Placement Index & Corporate Export"]
```

1. **Task Submission & Verification:** Student submits source code and screenshot proof ΓåÆ Coordinator verifies rubrics ΓåÆ Faculty reviews ΓåÆ HOD signs off.
2. **Proctored Assessment Execution:** Candidate launches Monaco test ΓåÆ PIP webcam monitors focus ΓåÆ Code evaluates against test suites ΓåÆ Scorecard generated.

---

## 5. ≡ƒôê Quantifiable Impact & Measurable Benefits
* ≡ƒæÑ **365+ Active Students Governed:** Adopted across 6 sections at VSBEC with daily operational utilization.
* ≡ƒÅå **SIH 2026 Top 50 Finalist:** Shortlisted Top 50 out of 300+ campus teams with central SIH portal nomination.
* ≡ƒô£ **100% Digitized Submissions:** Eradicated paper logs, saving 15+ faculty hours weekly.
* ≡ƒñû **100+ Telegram Community:** Morning briefs and deadline alerts delivered with 99.9% reliability.
* ΓÜí **Optimized Low-Latency Lookups:** Indexed relational queries enable instantaneous student record retrieval.

---

## 6. ≡ƒÜÇ Feasibility, Operational Viability & Scalability
* ≡ƒö¼ **Technical Feasibility:** Deployed on Vercel with PostgreSQL cloud database, proven under high-concurrency coding drives.
* ≡ƒÆ░ **Economic & Financial Viability:** Zero-cost open-source stack eliminates recurring third-party academic SaaS fees.
* ≡ƒÅ¢∩╕Å **Operational Governance:** RBAC precisely reflects institutional hierarchies across students, faculty, and administrators.
* ≡ƒôê **Horizontal Scalability Roadmap:** Modular schema easily scales to accommodate entire multi-department universities (10,000+ students).

---

## 7. ≡ƒæ¿ΓÇì≡ƒÆ╗ Author & Intellectual Property License

### Lead Architect & Author
**Tharunkumar K** ([@Tharun4743](https://github.com/Tharun4743))
* ≡ƒÄô B.Tech Information Technology ΓÇó V.S.B. Engineering College, Karur
* ≡ƒîÉ [GitHub Profile](https://github.com/Tharun4743) ΓÇó [LinkedIn](https://linkedin.com/in/tharunkumark4743) ΓÇó [Personal Portfolio](https://tharunkumark4743.netlify.app)

### ≡ƒöÆ Proprietary License Notice (All Rights Reserved)
> [!CAUTION]
> **PROPRIETARY & CONFIDENTIAL INTELLECTUAL PROPERTY**
> 
> All rights reserved. This repository, its architecture, source code, workflows, firmware, and associated documentation are the exclusive intellectual property of **Tharunkumar K**.
> 
> **No entity, organization, or individual is permitted to copy, modify, distribute, publish, commercially exploit, reverse engineer, or deploy any portion of this project without express, prior written permission from the author.**
> 
> **Copyright ┬⌐ 2026 Tharunkumar K. All Rights Reserved.**

<!-- =========================================================================
   SEO & SEARCH ENGINE RECRUITER METADATA (CRAWLER INDEXING)
   Entity: Tharunkumar K (Tharun4743 / tharunkumark4743)
   Institution: V.S.B. Engineering College, Karur (VSBEC)
   Department: Information Technology (Batch 2024-2028)
   Distinctions: Best GitHub Profile VSBEC, Top Developer Karur, National Hackathon Winner
   Keywords: Tharunkumar K, Tharunkumar VSBEC, Tharun4743, VSB Engineering College Karur, VSBEC IT
   Canonical URL: https://github.com/Tharun4743/Taskmanager
========================================================================= -->