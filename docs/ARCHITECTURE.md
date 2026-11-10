# 🏛️ VSBEC IT Vault — Architecture & Governance Dossier

This document outlines the technical architecture, security hierarchy, and telemetry daemons powering the **VSBEC IT Vault** (`Taskmanager`), an institutional enterprise task governance platform engineered for the **Department of Information Technology, V.S.B. Engineering College**.

---

## 1. System Topology Overview
The architecture is structured into three distinct decoupled layers:
- **Client Presentation Layer**: React 19, Vite 6, Tailwind CSS, and Microsoft Monaco Editor.
- **API & Daemon Gateway**: Node.js 20, Express, Sentry telemetry, and background sync daemons.
- **Relational Data Tier**: PostgreSQL 14 with 13 normalized tables and transactional audit trails.

---

## 2. Competitive Telemetry Daemons
- **LeetCode GraphQL Daemon (`codingTelemetryService.ts`)**: Automated periodic polling fetching solved counts (Easy/Medium/Hard), contest rankings, and diurnal streak adherence.
- **GitHub Commit Sync (`githubSyncService.ts`)**: Ingestion of commit velocity, PR creation events, and streak metrics across linked GitHub accounts.

---

## 3. Sandboxed Assessment Runtime
- **Isolated Execution (`codingSandboxService.ts`)**: Secure multi-language evaluation supporting C, C++, Java 17 LTS, and Python 3.11 with 2.0s CPU timeouts and 256MB memory boundaries.
- **Automated Grading Engine**: Ingestion of test vectors with edge-case validation against hidden evaluation suites.

---

## 4. Formal Academic Technical Report
The complete 12-page IEEE-standard academic technical specification report and architectural diagrams are available in:
- **LaTeX Source**: [`docs/report/project-report.tex`](file:///c:/Users/tharu/Documents/GITHUB%20REPO/GITHUB%20MANAGER/Taskmanager/docs/report/project-report.tex)
- **Compiled PDF**: [`docs/report/project-report.pdf`](file:///c:/Users/tharu/Documents/GITHUB%20REPO/GITHUB%20MANAGER/Taskmanager/docs/report/project-report.pdf)
