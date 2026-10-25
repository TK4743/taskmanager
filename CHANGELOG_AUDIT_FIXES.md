# VSBEC IT VAULT — CHANGELOG OF AUDIT CORRECTIONS & FIXES

This document logs every code, configuration, test, and LaTeX modification made during the evidence-based audit of **VSBEC IT Vault — Academic Task Governance and Code Assessment Platform**.

---

## 1. Summary of Changes by Component

| Component | Target File | Finding ID | Change Type | Validation Result |
| :--- | :--- | :--- | :--- | :--- |
| **Compiler Sandbox** | `codingSandboxService.ts` | E05 | Code Fix | Regression test passed (1.25s) |
| **Judge0 Client & Failover** | `codingSandboxService.ts` | E06 | Code Fix | Regression test passed |
| **Verification Controller** | `server.ts` | E11 | Code Fix | Regression test passed |
| **Backup Workflow** | `.github/workflows/auto-backup.yml` | E12 | Config Fix | Validated 8h symmetric cron |
| **Test Script** | `package.json` | E17 | Config Fix | `npm test` functional |
| **Test Suite** | `tests/audit-regression.test.ts` | E05, E06, E11, E17 | Test Addition | 5/5 tests passing |
| **Report TOC & LOF** | `report_template/chapters/00_toc_lot_lof.tex` | E01 | LaTeX Fix | 61 pages synchronized |
| **Literature & Citations** | `report_template/chapters/02_literature_survey.tex`<br>`report_template/chapters/references.tex`<br>`report_template/references.bib` | E21 | LaTeX / BibTeX Fix | Verified against IEEE & ASEE |
| **System Specifications** | `report_template/chapters/04_system_specification.tex` | E02, E03 | LaTeX Fix | Node 22 Maintenance LTS |
| **Implementation Details** | `report_template/chapters/05_implementation.tex` | E04, E07, E08, E15, E16 | LaTeX Fix | Aligned with `server.ts` |
| **System Analysis** | `report_template/chapters/03_system_analysis.tex` | E22 | LaTeX Fix | Softened absolute claims |
| **Code Listing 4** | `report_template/chapters/appendix_a.tex` | E11 | LaTeX Fix | Matches locked transaction |
| **Compiled Report** | `report_template/main.pdf` | E24 | Build Artifact | 61 pages, 10.78 MiB, 0 errors |

---

## 2. Granular Modification Log

### 1. Child Process Sandbox & Process Tree Cleanup (`codingSandboxService.ts`)
- **Finding:** E05 (Process Tree Termination & Output Cap Bound)
- **Rationale:** On Windows, `child.kill('SIGKILL')` does not kill child process trees, leaving orphaned compiler/runtime processes in memory. Furthermore, processes exceeding 64 KB output were not terminated immediately, and timeout handling previously resolved before waiting for child process teardown.
- **Specific Change:**
  - Imported `exec` and `ChildProcess` from `child_process`.
  - Added `terminateTree` invoking `taskkill /pid ${proc.pid} /T /F` and `proc.kill('SIGKILL')` on Windows, and `process.kill(-proc.pid, 'SIGKILL')` with `detached: true` on POSIX.
  - Added stream listener cleanup (`cleanupStreams`) and immediate tree termination when output bounds exceed 64 KB.
  - Added `child.once('close')` listener in the watchdog handler with a bounded 500ms graceTimer, ensuring the API does not resolve prematurely before the child process has actually closed.
- **Evidence:** `codingSandboxService.ts` lines 130–185.
- **Validation:** Executed `npm test`; long-running process killed in 1.25s without hanging.

---

### 2. Judge0 Fail-Fast on Permanent Client Errors & Missing Compilers (`codingSandboxService.ts`)
- **Finding:** E06 (Judge0 Client Error Handling & Cloud Failover)
- **Rationale:** Permanent 4xx client errors (HTTP 400 Bad Request, 422 Unprocessable Entity) will never succeed on retry. Retrying them 3 times wasted API quota. In addition, when local compiler toolchains (GCC/Java) were absent on the host, the sandbox failed with `spawn ENOENT` without falling back to Judge0.
- **Specific Change:**
  - In `evaluateViaJudge0`: Added immediate fail-fast check: if `resp.status >= 400 && resp.status < 500 && resp.status !== 429`, log the client error and return `null` immediately without entering retry backoff.
  - In `evaluateLocallyInSandbox`: Added automatic failover to `evaluateViaJudge0(language, sourceCode, testCases)` whenever local compiler or interpreter execution returns `ENOENT` or spawn failure.
- **Evidence:** `codingSandboxService.ts` lines 314–318, 588–595.
- **Validation:** Verified via unit assertion in `tests/audit-regression.test.ts`.

---

### 3. Submission Verification Atomic Row Lock (`server.ts`)
- **Finding:** E11 (Verification State Race Prevention & Transactional Lock)
- **Rationale:** The verification endpoint previously fetched the submission record with `pool.query` outside the transaction, creating a concurrency window where two simultaneous review requests could both read the pending status and execute conflicting updates.
- **Specific Change:**
  - Moved connection checkout (`pool.connect()`) and `BEGIN` to enclose the initial submission query.
  - Added `SELECT ts.*, u.class_id, u.department_id ... FOR UPDATE OF ts` to obtain a row-level exclusive lock.
  - Enforced status check (`sub.status === 'VERIFIED'`), class/department scope checks, and rejection reason validation inside the locked transaction, rolling back cleanly upon violation.
- **Evidence:** `server.ts` lines 4689–4762.
- **Validation:** Regression tests passed; Appendix A Listing 4 updated to match.

---

### 4. Midday Backup Cron Trigger & Symmetric 8-Hour Schedule (`.github/workflows/auto-backup.yml`)
- **Finding:** E12 (Scheduled Backup Cadence)
- **Rationale:** The report stated backups execute at an 8-hour cadence across 3 daily slots: 07:50 AM, 03:50 PM, and 11:50 PM IST. The GitHub Actions workflow was missing the midday trigger and had misaligned the nightly trigger.
- **Specific Change:**
  - Added `- cron: '20 10 * * *' # 10:20 UTC = 03:50 PM IST (Midday laboratory session sync)`.
  - Aligned nightly trigger to `- cron: '20 18 * * *' # 18:20 UTC = 11:50 PM IST`.
  - Together with `- cron: '20 2 * * *' # 02:20 UTC = 07:50 AM IST`, this forms an exact, symmetric 8-hour cadence (+8 hours between each run).
- **Evidence:** `.github/workflows/auto-backup.yml` lines 4–11.
- **Validation:** Workflow YAML syntax verified.

---

### 5. Automated Regression Test Suite (`tests/audit-regression.test.ts` & `package.json`)
- **Finding:** E17 (Test Automation Infrastructure)
- **Rationale:** The repository had no automated test script declared in `package.json` to reproduce code fixes.
- **Specific Change:**
  - Added `"test": "tsx --test tests/audit-regression.test.ts"` to `package.json`.
  - Authored comprehensive test suite in `tests/audit-regression.test.ts` validating E05 watchdog termination, stream output capping, E06 Judge0 status classification, E11 verification state locking, and class-scoped coordinator boundaries.
- **Validation:** Ran `npm test`; 5 tests across 3 suites passed in 1.49s.

---

### 6. Table of Contents and List of Figures Synchronization (`report_template/chapters/00_toc_lot_lof.tex`)
- **Finding:** E01 (Stale Page References)
- **Rationale:** Template half-title dividers created a 1–2 page shift from Chapter 6 through Bibliography that was not reflected in the manually typed TOC and LOF tables.
- **Specific Change:**
  - Synchronized Table of Contents Part 2: Chapter 6 to p. 22/23, 6.1–6.2 to p. 23, 6.3 to p. 25, 6.4 to p. 26, 6.5 to p. 28, Chapter 7 to p. 29/30, 7.3–7.4 to p. 31.
  - Synchronized Table of Contents Part 3: Chapter 8 to p. 32/33, Chapter 9 to p. 35/36, Appendix to p. 38, Listings 1–4 to p. 39–42, Appendix B to p. 44, References to p. 47, Bibliography to p. 48.
  - Synchronized List of Figures: Fig 5.1 (p. 15), Fig 6.1 (p. 24), Fig 6.2 (p. 26), Fig 6.3 (p. 27), Fig 6.4 (p. 28), Fig B.1 (p. 44), Fig B.2 (p. 45), Fig B.3 (p. 46), Fig B.4 (p. 46).
- **Validation:** Recompiled with Tectonic; verified using Python `pypdf` across all pages.

---

### 7. Academic Citation Metadata Correction (`02_literature_survey.tex`, `references.tex`, `references.bib`)
- **Finding:** E21 (Literature Citation Precision)
- **Rationale:** Moreno-Marcos et al. was listed with incorrect page numbers (`112--116` instead of `117--119`); Cho et al. included an extraneous subtitle.
- **Specific Change:**
  - Updated Moreno-Marcos et al. page range to `117--119` in `references.tex` and `references.bib`.
  - Corrected Cho et al. title to `"Shaking The Silos: Impact of Sequential Live Coding on Students' Performance and Perceptions"` across `02_literature_survey.tex`, `references.tex`, and `references.bib`.
  - Clarified GitHub GraphQL API integration in literature survey synthesis.
- **Validation:** Cross-referenced against IEEE Xplore (ICALT 2025) and ASEE PEER repository.

---

### 8. System Specification Dependencies, Node Lifecycle, and Libuv Internals (`04_system_specification.tex`)
- **Finding:** E02, E03 (Dependency Versions & Libuv Explanation)
- **Rationale:** Table 4.3 and 4.4 had discrepancies with `package.json` (`lucide-react` version `0.546.0`, `multer` `2.1.0`, `cors` `2.8.6`, `jsonwebtoken` `9.0.3`, `bcryptjs` `3.0.3`). Node.js 22 lifecycle as of October 2026 is Maintenance LTS. Section 4.3 erroneously claimed `UV_THREADPOOL_SIZE` accelerates database sockets and bcryptjs.
- **Specific Change:**
  - Updated Table 4.3 and 4.4 version entries to match `package.json`.
  - Updated Node.js 22 description to "Maintenance LTS, backward compatible with 20.x".
  - Clarified that `UV_THREADPOOL_SIZE=128` scales the Libuv worker thread pool for disk filesystem (`fs`), DNS resolution, and crypto microtasks, while database network I/O utilizes non-blocking kernel event loops (IOCP/epoll) and `bcryptjs` executes in pure JavaScript on the V8 engine event loop.
- **Validation:** Verified against official Node.js documentation.

---

### 9. Placement Readiness Formula and Watchdog Teardown Latency (`05_implementation.tex`)
- **Finding:** E04, E07, E08, E15, E16 (Equations & Telemetry Semantics)
- **Rationale:** The published Placement Readiness formula (Equation 12) contradicted `server.ts:10645-10651`. Watchdog duration ($3014 \pm 18$ ms) was described as within a 3000 ms threshold. Telemetry descriptions omitted GraphQL details.
- **Specific Change:**
  - Updated Equation (12) to:  
    $$P_{\text{index}} = 0.35 \cdot S_{\text{aptitude}} + 0.25 \cdot S_{\text{leetcode}} + 0.20 \cdot S_{\text{projects}} + 0.20 \cdot S_{\text{tasks}}$$  
    matching the 4-pillar institutional backend logic, with GitHub commits documented as informational metrics.
  - Updated Equation (5) and narrative: defined $T_{\text{trigger}} = 3000$ ms and host envelope $T_{\text{envelope}} = 3500$ ms, explaining process teardown latency ($\tau_{\text{cleanup}} = 14 \pm 18$ ms).
  - Clarified LeetCode IST timestamp filtering for same-day solves and GitHub GraphQL `contributionsCollection` calendar query.
  - Clarified browser assessment monitoring as non-invasive integrity telemetry to assist faculty review.
  - Aligned nightly backup slot in Section 5.3.5 to 11:50 PM IST (`20 18 * * * UTC`).
- **Validation:** Verified against `server.ts` implementations.

---

### 10. Softening of Absolute Assertions (`03_system_analysis.tex`)
- **Finding:** E22 (Academic Wording Standards)
- **Rationale:** Absolute claims ("overcomes every limitation", "mathematically guarantees") are scientifically unjustified.
- **Specific Change:**
  - Softened to "addresses the core operational limitations" and "achieve an operational Recovery Point Objective (RPO) target $\le 8\text{ hours}$".
- **Validation:** Improved academic rigor and objectivity.

---

### 11. Appendix Source Code Listing 4 (`appendix_a.tex`)
- **Finding:** E11 (Verification Controller Listing)
- **Rationale:** Source listing in the report must match the verified, race-free implementation in `server.ts`.
- **Specific Change:**
  - Updated Listing 4 to include client connection checkout, `BEGIN`, `SELECT ... FOR UPDATE OF ts`, and validation logic inside the transaction block.
- **Validation:** Exact 1:1 parity with `server.ts:4682-4762`.

### 12. Final PDF Compilation & Verification (`report_template/main.pdf`)
- **Finding:** E24 (LaTeX Build)
- **Command:** `C:\Users\tharu\AppData\Roaming\npm\tectonic.exe main.tex`
- **Output:** `main.pdf` (10.78 MiB, exactly 61 pages).
- **Validation:** Clean exit code 0; all cross-references resolved; all page footers match TOC and LOF.
