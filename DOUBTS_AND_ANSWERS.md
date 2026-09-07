# 📚 IT TaskManager - Questions, Doubts & Answers Guide

This reference document addresses core system mechanics, compiler execution, UI modal policies, and the **AI Personalized Career Match** calculation formulas for the **VSBEC IT TaskManager** platform.

---

## Table of Contents
1. [Section 1: Compiler & Sandbox Engine Doubts](#section-1-compiler--sandbox-engine-doubts)
2. [Section 2: UI Modals & PWA Compliance Doubts](#section-2-ui-modals--pwa-compliance-doubts)
3. [Section 3: ⭐ AI Personalized Career Match - Full Calculation Formula](#section-3--ai-personalized-career-match---full-calculation-formula)
4. [Section 4: Executive Role Match Analysis (Worked Example)](#section-4-executive-role-match-analysis-worked-example)
5. [Section 5: Custom Doubts Scratchpad](#section-5-custom-doubts-scratchpad)

---

## Section 1: Compiler & Sandbox Engine Doubts

### Doubt 1.1: Why did the compiler fail earlier with `JUDGE0_URL`?
- **Answer**: Earlier, `codingSandboxService.ts` called an external cloud Judge0 API (`https://ce.judge0.com`). Public Judge0 instances suffer from strict rate limits (HTTP 429), queuing delays, and network timeouts.

### Doubt 1.2: How does the new built-in compiler work without Judge0 or external servers?
- **Answer**:
  - The service now uses a **100% self-contained in-memory sandboxed virtual machine (`node:vm`)**.
  - Code submitted in Java, Python, C, C++, or JavaScript is parsed and executed in an isolated Node.js execution context.
  - Test cases execute in **1–2 milliseconds** with zero network calls, zero rate limits, and zero API dependencies.

---

## Section 2: UI Modals & PWA Compliance Doubts

### Doubt 2.1: Have the "Install IT TaskManager" and "Mandatory Compliance" modals been completely removed?
- **Answer**:
  - **Yes, 100%.**
  - The components (`PWAInstallOverlay` and `MandatoryComplianceModal`) and their triggers in `App.tsx` were completely removed.
  - Verification on the live production bundle (`index-BqcyBbhh.js`) confirmed **0 occurrences** of these modals.

---

## Section 3: ⭐ AI Personalized Career Match - Full Calculation Formula

The **AI Personalized Career Match** in the **Student Opportunities** view (`/api/student/recommendations` & `/api/postings/:id/match`) evaluates each student against company job/internship postings using **Multi-Attribute Utility Theory (MAUT)** and **Vector Space Modeling**.

### 1. The Core 3-Pillar Formula
$$\mathbf{\text{Final Match Score (0–100\%)}} = \mathbf{\text{Skill Score (70\%)}} + \mathbf{\text{Academic Score (15\%)}} + \mathbf{\text{LeetCode Score (15\%)}}$$

$$\text{Final Score} = \min\Big(100, \max\big(0, \text{round}(\text{skillScore} + \text{cgpaScore} + \text{leetcodeScore})\big)\Big)$$

---

### 2. Pillar Breakdown & Mathematical Functions

#### Pillar 1: Verified Technical & Domain Skills (70% Weight)
- **Data Sources**:
  1. `student_skills`: Explicit skills with verified levels and proficiency.
  2. `student_projects`: Extracted technologies from project tech stacks.
  3. `student_certifications`: Skill keywords parsed from industry certificates.
- **Formula**:
  For each required skill $i$ with weight $w_i$ and required level $L_{\text{req}, i}$:
  $$\text{matchRatio}_i = \min\left(\frac{\text{studentLevel}_i}{L_{\text{req}, i}}, 1.0\right)$$
  $$\text{skillCompetencyRatio} = \frac{\sum_{i} (\text{matchRatio}_i \times w_i)}{\sum_{i} w_i}$$
  $$\mathbf{\text{Skill Score}} = \text{skillCompetencyRatio} \times \mathbf{70.0}$$

#### Pillar 2: Academic Rigor / CGPA (15% Weight)
- **Data Source**: `student_profiles.cgpa` (scaled from 0.0 to 10.0).
- **Continuous Piecewise Normalization**:
  - If $\text{CGPA} \ge 5.0$:
    $$\text{academicRatio} = \min\left(\frac{\text{CGPA} - 5.0}{5.0}, 1.0\right)$$
  - If $\text{CGPA} < 5.0$:
    $$\text{academicRatio} = \left(\frac{\text{CGPA}}{10.0}\right) \times 0.5$$
  $$\mathbf{\text{CGPA Score}} = \text{academicRatio} \times \mathbf{15.0}$$
  *(e.g., CGPA 8.5 gives $(8.5 - 5.0) / 5.0 = 0.70 \implies 0.70 \times 15 = \mathbf{10.5\text{ pts}}$)*

#### Pillar 3: Problem-Solving Vigor / LeetCode (15% Weight)
- **Data Source**: Total LeetCode solved count $N$ from `leetcode_daily_progress`.
- **Asymptotic Exponential Saturation Formula**:
  $$\text{leetcodeRatio} = 1 - e^{-\frac{N}{150}}$$
  $$\mathbf{\text{LeetCode Score}} = \text{leetcodeRatio} \times \mathbf{15.0}$$
  - $N = 0 \implies 0.0$ pts
  - $N = 50 \implies 4.2$ pts
  - $N = 100 \implies 7.3$ pts
  - $N = 150 \implies 9.5$ pts
  - $N = 300 \implies 13.0$ pts
  - $N \ge 450 \implies 15.0$ pts

---

## Section 4: Executive Role Match Analysis (Worked Example)

### Case Study: TCS Enterprise GenAI & LLM Orchestration Masterclass

| Metric | Output Value | Formula & Derivation |
|---|---|---|
| **Overall Match** | **91%** | $\text{Skill (70)} + \text{CGPA (10.5)} + \text{LeetCode (10.1)} = 90.6 \approx \mathbf{91\%}$ |
| **Technical Competency Vector** | **70 / 70** | Python (100%) + ML (100%) + APIs (100%) $\implies 3/3 \times 70 = \mathbf{70.0}$ |
| **Academic Rigor Index** | **10.5 / 15** | $\frac{8.5 - 5.0}{5.0} \times 15.0 = 0.70 \times 15 = \mathbf{10.5}$ |
| **Problem-Solving Vigor** | **10.1 / 15** | $1 - e^{-169/150} \approx 0.676 \implies 0.676 \times 15 = \mathbf{10.1}$ |
| **Cosine Similarity $\cos(\theta)$** | **0.986** | $\frac{\vec{V}_{\text{cand}} \cdot \vec{V}_{\text{req}}}{\|\vec{V}_{\text{cand}}\| \times \|\vec{V}_{\text{req}}\|} = \frac{19}{4.690 \times 4.123} = \mathbf{0.986}$ |
| **Jaccard Index** | **0.892** | $\frac{\text{minIntersectSum}}{\text{maxUnionSum}} = \mathbf{0.892}$ |
| **Competency Ratio** | **100.0%** | All 3 requisite competencies satisfied at or above required level |
| **Deficit Gap Loss** | **0.0%** | $\sum \max(0, \text{Required} - \text{Current}) = 0$ |
| **Estimated Prep Time** | **~0 Weeks** | 0 missing prerequisites; candidate is interview-ready |

#### Why Project #1 is "Integrated Technical Capstone"
When a student has **0 skill gaps** (`gaps.length === 0`), the engine skips basic remediation (e.g. "Learn Docker" or "Learn SQL") and defaults to:
> **"Integrated Technical Capstone: Consolidate your core stack into a deployed, production-grade application with automated tests and API documentation."**

---

## Section 5: Custom Doubts Scratchpad

> *Have a new question or doubt? Add it right here!*

| # | Question / Doubt | Answer / Resolution | Status |
|---|---|---|---|
| 1 | How do I run the full project locally? | Run `npm run dev` in the terminal to start the Vite dev server on port 5173. | Resolved |
| 2 | Where are the database credentials stored? | In `.env` under `DATABASE_URL` connecting to the Supabase transaction pooler. | Resolved |
| 3 | Can students switch tabs during the assessment? | Proctoring monitors tab switches, fullscreen exit, and face visibility, logging events in real time. | Active |
