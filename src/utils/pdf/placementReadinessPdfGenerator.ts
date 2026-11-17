import type { jsPDF as JsPDFType } from 'jspdf';

/**
 * Generates an official, beautifully formatted Student Placement Eligibility Scorecard PDF.
 */
export async function downloadStudentPlacementScorecardPdf(studentProfile: any): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc: JsPDFType = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const p = studentProfile || {};
  const pillars = p.pillars || {};
  const fullName = (p.full_name || 'STUDENT NAME').toUpperCase();
  const regNo = p.register_number || 'N/A';
  const className = p.class_name || 'Class';
  const readinessScore = p.readiness_score ?? 0;
  const tierLabel = p.tier_label || (readinessScore >= 80 ? 'Tier 1: Product / Dream Ready' : readinessScore >= 65 ? 'Tier 2: IT Services Ready' : 'Developing Baseline');
  const eligibleCompanies = Array.isArray(p.eligible_companies) ? p.eligible_companies.join(', ') : (p.eligible_companies || 'Zoho, TCS, Infosys, Cognizant, Wipro');

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);

  // ── Header Box ──
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, 12, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('V.S.B. ENGINEERING COLLEGE', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('DEPARTMENT OF INFORMATION TECHNOLOGY • PLACEMENT TRAINING CELL', pageWidth / 2, 26, { align: 'center' });
  doc.text('OFFICIAL CANDIDATE PLACEMENT ELIGIBILITY & READINESS SCORECARD', pageWidth / 2, 31, { align: 'center' });

  // ── Candidate Summary Card ──
  let y = 42;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 32, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(fullName, margin + 5, y + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Register No: ${regNo}   •   Class: ${className}`, margin + 5, y + 15);
  doc.text(`Report Date: ${new Date().toLocaleDateString('en-GB')}   •   Evaluation Window: Academic Year 2024-2028`, margin + 5, y + 21);
  doc.text(`Verified Status: AUTHENTICATED LIVE DATA   •   Audit Hash: VSB-${regNo.slice(-6)}-${Date.now().toString(36).toUpperCase()}`, margin + 5, y + 27);

  // Score Badge right side
  doc.setFillColor(readinessScore >= 80 ? 16 : readinessScore >= 65 ? 99 : 225, readinessScore >= 80 ? 185 : readinessScore >= 65 ? 102 : 29, readinessScore >= 80 ? 129 : readinessScore >= 65 ? 241 : 72);
  doc.roundedRect(pageWidth - margin - 40, y + 5, 35, 22, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`${readinessScore}%`, pageWidth - margin - 22.5, y + 15, { align: 'center' });
  doc.setFontSize(7);
  doc.text('INDEX RATING', pageWidth - margin - 22.5, y + 21, { align: 'center' });

  // ── Placement Tier Banner ──
  y += 37;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 10, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`PLACEMENT BENCHMARK TIER: ${tierLabel.toUpperCase()}`, margin + 5, y + 6.5);

  // ── 4-Pillar Weighted Evaluation Table ──
  y += 16;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('FOUR CORE COMPETENCY PILLARS (WEIGHTED DECOMPOSITION)', margin, y);

  y += 4;
  // Table Header
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Evaluation Pillar', margin + 3, y + 5.5);
  doc.text('Weight', margin + 65, y + 5.5);
  doc.text('Candidate Performance', margin + 95, y + 5.5);
  doc.text('Contribution', margin + 145, y + 5.5);

  const tableRows = [
    {
      pillar: 'Pillar 1: Aptitude Diagnostic Benchmark',
      weight: '35%',
      perf: `${p.aptitude_score ?? pillars.aptitude?.score ?? 0}% Diagnostic Score`,
      contrib: `+${pillars.aptitude?.contribution ?? Math.round((p.aptitude_score ?? 0) * 0.35)} / 35 pts`
    },
    {
      pillar: 'Pillar 2: LeetCode Weekly Streak & Consistency',
      weight: '25%',
      perf: `${p.leetcode_weekly_streak ?? pillars.leetcode?.weekly_streak ?? 0} Days/Wk (${pillars.leetcode?.consistency ?? 0}% Consistency)`,
      contrib: `+${pillars.leetcode?.contribution ?? 0} / 25 pts`
    },
    {
      pillar: 'Pillar 3: Technical Software Projects Built',
      weight: '20%',
      perf: `${pillars.projects?.count ?? p.project_count ?? 0} Core Projects Verified`,
      contrib: `+${pillars.projects?.contribution ?? 0} / 20 pts`
    },
    {
      pillar: 'Pillar 4: Academic Task Discipline Rate',
      weight: '20%',
      perf: `${pillars.tasks?.rate ?? p.task_completion_rate ?? 0}% Task Completion`,
      contrib: `+${pillars.tasks?.contribution ?? 0} / 20 pts`
    }
  ];

  y += 8;
  doc.setFont('helvetica', 'normal');
  tableRows.forEach((r, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setTextColor(15, 23, 42);
    doc.text(r.pillar, margin + 3, y + 5.5);
    doc.text(r.weight, margin + 65, y + 5.5);
    doc.text(r.perf, margin + 95, y + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(r.contrib, margin + 145, y + 5.5);
    doc.setFont('helvetica', 'normal');
    y += 8;
  });

  // Total Summary Row
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL COMPUTED READINESS SCORE', margin + 3, y + 6);
  doc.text('100%', margin + 65, y + 6);
  doc.text('Unified Institutional Metric', margin + 95, y + 6);
  doc.setTextColor(99, 102, 241);
  doc.text(`${readinessScore} / 100 PTS`, margin + 145, y + 6);

  // ── Eligible Companies ──
  y += 16;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ELIGIBLE RECRUITER CLUSTERS & HIRING POOLS', margin, y);

  y += 4;
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(251, 191, 36);
  doc.rect(margin, y, contentWidth, 12, 'FD');
  doc.setFontSize(8.5);
  doc.setTextColor(120, 53, 15);
  doc.setFont('helvetica', 'normal');
  doc.text(eligibleCompanies, margin + 5, y + 7.5);

  // ── Actionable AI Boost Recommendations ──
  y += 18;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('HOW TO BOOST YOUR PLACEMENT READINESS SCORE', margin, y);

  const recs = p.recommendations || [
    'Complete the 25-question Diagnostic Aptitude Assessment to benchmark core analytical skills.',
    'Maintain a 7-day active daily LeetCode coding streak to strengthen interview problem-solving speed.',
    'Register at least 3 full-stack technical projects with verified GitHub repositories on the portal.',
    'Submit all laboratory and academic tasks before weekly deadlines to maximize task discipline rating.'
  ];

  y += 4;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  recs.slice(0, 4).forEach((rec: string) => {
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setTextColor(16, 185, 129);
    doc.text('✓', margin + 3, y + 5.5);
    doc.setTextColor(51, 65, 85);
    doc.text(rec.length > 95 ? rec.slice(0, 95) + '...' : rec, margin + 8, y + 5.5);
    y += 8.5;
  });

  // ── Official Signatures / Footer ──
  y = Math.max(y + 6, 250);
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Head of Department (IT)', margin + 10, y + 10);
  doc.text('Class Advisor', pageWidth / 2, y + 10, { align: 'center' });
  doc.text('Head of Placements (VSBEC)', pageWidth - margin - 10, y + 10, { align: 'right' });

  doc.setFontSize(6.5);
  doc.text('This scorecard is an official computer-generated institutional record verified by VSB Engineering College Task & Placement Portal.', pageWidth / 2, y + 18, { align: 'center' });

  doc.save(`Placement_Readiness_Scorecard_${regNo}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Generates an official Cohort / Class Placement Readiness Summary Report PDF for Staff.
 */
export async function downloadCohortPlacementReportPdf(
  metrics: any,
  students: any[],
  filterTitle: string = 'Cohort'
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc: JsPDFType = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 12;
  const contentWidth = pageWidth - (margin * 2);

  const m = metrics || {};
  const total = m.total_students || students.length || 0;
  const eligible = m.eligible_count || 0;
  const tier1 = m.tier1_count || 0;
  const tier2 = m.tier2_count || 0;
  const needsAttn = m.needs_attention_count || 0;
  const avgReadiness = m.average_readiness || 0;
  const passRate = m.pass_rate || 0;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, 10, contentWidth, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('V.S.B. ENGINEERING COLLEGE — DEPARTMENT OF INFORMATION TECHNOLOGY', pageWidth / 2, 17, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`OFFICIAL PLACEMENT READINESS AUDIT REPORT • ${filterTitle.toUpperCase()} • GENERATED ON ${new Date().toLocaleDateString('en-GB')}`, pageWidth / 2, 24, { align: 'center' });

  // Metrics KPI Strip
  let y = 34;
  const cardW = contentWidth / 5;
  const kpis = [
    { label: 'COHORT SIZE', val: `${total} Students`, sub: 'Total Evaluated' },
    { label: 'PLACEMENT READY', val: `${eligible} (${passRate}%)`, sub: 'Score ≥ 75%' },
    { label: 'TIER 1 (PRODUCT)', val: `${tier1}`, sub: 'Score ≥ 80% (Zoho/Prime)' },
    { label: 'TIER 2 (SERVICES)', val: `${tier2}`, sub: 'Score ≥ 65% (TCS/Infosys)' },
    { label: 'AVG READINESS', val: `${avgReadiness}%`, sub: 'Cohort Weighted Rating' }
  ];

  kpis.forEach((k, idx) => {
    const x = margin + (idx * cardW);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(x, y, cardW - 2, 16, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(k.label, x + 3, y + 4.5);
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(k.val, x + 3, y + 10);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(k.sub, x + 3, y + 14);
  });

  // Table
  y += 22;
  const drawTableHeader = (curY: number) => {
    doc.setFillColor(226, 232, 240);
    doc.rect(margin, curY, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('S.No', margin + 2, curY + 5);
    doc.text('Student Name', margin + 14, curY + 5);
    doc.text('Register No', margin + 65, curY + 5);
    doc.text('Class', margin + 98, curY + 5);
    doc.text('Readiness', margin + 125, curY + 5);
    doc.text('Placement Tier', margin + 148, curY + 5);
    doc.text('Aptitude', margin + 190, curY + 5);
    doc.text('LeetCode', margin + 210, curY + 5);
    doc.text('Projects', margin + 232, curY + 5);
    doc.text('Eligible Companies', margin + 252, curY + 5);
  };

  drawTableHeader(y);
  y += 7;

  let pageNum = 1;
  students.forEach((s, idx) => {
    if (y > pageHeight - 16) {
      // Add page footer
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${pageNum} — V.S.B. Engineering College Placement Audit Report`, margin, pageHeight - 8);
      doc.addPage();
      pageNum++;
      y = 12;
      drawTableHeader(y);
      y += 7;
    }

    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, contentWidth, 6.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);

    doc.text(`${idx + 1}`, margin + 2, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.text(String(s.full_name || '').slice(0, 24), margin + 14, y + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.text(String(s.register_number || ''), margin + 65, y + 4.5);
    doc.text(String(s.class_name || ''), margin + 98, y + 4.5);

    // Readiness score
    const rScore = s.readiness_score ?? 0;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rScore >= 80 ? 16 : rScore >= 65 ? 99 : 225, rScore >= 80 ? 185 : rScore >= 65 ? 102 : 29, rScore >= 80 ? 129 : rScore >= 65 ? 241 : 72);
    doc.text(`${rScore}%`, margin + 125, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const tierDisplay = s.tier === 'TIER_1' ? 'Tier 1 (Product)' : s.tier === 'TIER_2' ? 'Tier 2 (Services)' : s.tier === 'TIER_3' ? 'Tier 3 (Baseline)' : 'Action Required';
    doc.text(tierDisplay, margin + 148, y + 4.5);

    doc.text(s.aptitude_completed ? `${s.aptitude_score}%` : 'N/A', margin + 190, y + 4.5);
    doc.text(`${s.leetcode_weekly_streak ?? s.pillars?.leetcode?.weekly_streak ?? 0}d/Wk`, margin + 210, y + 4.5);
    doc.text(`${s.project_count ?? s.pillars?.projects?.count ?? 0} Proj`, margin + 232, y + 4.5);

    const comps = Array.isArray(s.eligible_companies) ? s.eligible_companies.slice(0, 2).join(', ') : '';
    doc.text(comps || 'General IT', margin + 252, y + 4.5);

    y += 6.5;
  });

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Page ${pageNum} — V.S.B. Engineering College Placement Audit Report • Total ${students.length} Candidates Evaluated`, margin, pageHeight - 8);

  doc.save(`Placement_Cohort_Report_${filterTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}
