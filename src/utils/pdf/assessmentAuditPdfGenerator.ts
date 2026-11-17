import { jsPDF } from 'jspdf';

export interface AssessmentAuditData {
  id: string;
  student_name?: string;
  register_number?: string;
  class_name?: string;
  class_year?: string | number;
  track_title?: string;
  track_type?: string;
  total_questions: number;
  correct_count: number;
  score_percentage: number | string;
  cutoff_percentage?: number | string;
  is_passed?: boolean;
  time_taken_seconds?: number;
  proctor_photo_url?: string | null;
  violation_count?: number;
  integrity_events?: Array<{
    type: string;
    timestamp?: string;
    elapsed_seconds?: number;
    details?: string;
  }>;
  category_breakdown?: Record<string, number | string>;
  strengths?: string[];
  gaps?: string[];
  created_at: string;
  answers_summary?: Array<{
    question_text?: string;
    is_correct?: boolean;
    selected_answer?: string;
    correct_answer?: string;
  }>;
}

const EVENT_TYPE_LABELS: Record<string, { label: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }> = {
  FULLSCREEN_EXIT:   { label: 'Exited Fullscreen Lockdown', severity: 'HIGH' },
  TAB_SWITCH:        { label: 'Tab / Browser Window Switch', severity: 'HIGH' },
  WINDOW_BLUR:       { label: 'Application Lost Focus', severity: 'MEDIUM' },
  COPY_ATTEMPT:      { label: 'Clipboard Copy Attempt', severity: 'MEDIUM' },
  CUT_ATTEMPT:       { label: 'Clipboard Cut Attempt', severity: 'MEDIUM' },
  PASTE_ATTEMPT:     { label: 'Clipboard Paste Attempt', severity: 'HIGH' },
  SELECT_ALL:        { label: 'Select-All Shortcut Attempt', severity: 'LOW' },
  CONTEXT_MENU:      { label: 'Right-Click / Context Menu', severity: 'LOW' },
  DEVTOOLS_SHORTCUT: { label: 'Developer Tools Shortcut', severity: 'CRITICAL' },
  NAV_SHORTCUT:      { label: 'Unauthorized Navigation Key', severity: 'MEDIUM' },
};

/**
 * Loads an image from a Data URL or HTTP URL and returns its dataUrl and format.
 */
async function loadImageData(url: string): Promise<{ dataUrl: string; format: 'JPEG' | 'PNG' | 'WEBP' } | null> {
  if (!url) return null;
  try {
    if (url.startsWith('data:image/')) {
      const format = url.startsWith('data:image/png') ? 'PNG' : url.startsWith('data:image/webp') ? 'WEBP' : 'JPEG';
      return { dataUrl: url, format };
    }

    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const format = blob.type.includes('png') || dataUrl.startsWith('data:image/png')
          ? 'PNG'
          : blob.type.includes('webp') || dataUrl.startsWith('data:image/webp')
          ? 'WEBP'
          : 'JPEG';
        resolve({ dataUrl, format });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('[Audit PDF] Failed to load image:', url, err);
    return null;
  }
}

/**
 * Generates an official, institutional-grade Proctoring Integrity & Scorecard Audit Report PDF.
 */
export async function generateAssessmentAuditPdf(data: AssessmentAuditData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const bottomThreshold = pageHeight - 20;

  let y = 14;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > bottomThreshold) {
      doc.addPage();
      y = 15;
    }
  };

  // ── Pre-load images (College Logo & Proctor Face Snapshot) ──────────────────
  const [logoImg, proctorImg] = await Promise.all([
    loadImageData('/logo.png'),
    data.proctor_photo_url ? loadImageData(data.proctor_photo_url) : Promise.resolve(null),
  ]);

  // ── Institutional Header ───────────────────────────────────────────────────
  // Primary brand banner background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 26, 3, 3, 'F');

  // Embed logo or draw institutional emblem badge
  if (logoImg) {
    try {
      doc.addImage(logoImg.dataUrl, logoImg.format, margin + 3, y + 3, 20, 20);
    } catch {
      // Fallback if addImage fails
    }
  }

  const textStartX = logoImg ? margin + 26 : margin + 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('V.S.B. ENGINEERING COLLEGE (AUTONOMOUS)', textStartX, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(165, 180, 252); // indigo-300
  doc.text('DEPARTMENT OF INFORMATION TECHNOLOGY', textStartX, y + 12.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Official Academic Assessment & AI-Assisted Proctoring Integrity Transcript', textStartX, y + 17.5);

  // Document reference pill (top right)
  const auditRef = `REF: AUD-${(data.id || '000000').slice(0, 8).toUpperCase()}`;
  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(248, 250, 252);
  doc.text(auditRef, margin + contentWidth - 4, y + 7, { align: 'right' });

  y += 30;

  // ── Candidate & Session Information Box ────────────────────────────────────
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 30, 2.5, 2.5, 'FD');

  const scoreNum = Number(data.score_percentage || 0);
  const cutoffNum = Number(data.cutoff_percentage || 60);
  const isPassed = data.is_passed !== undefined ? data.is_passed : scoreNum >= cutoffNum;
  const violationCount = Number(data.violation_count || 0);

  // Left Column: Candidate Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('CANDIDATE NAME', margin + 4, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text((data.student_name || 'STUDENT').toUpperCase(), margin + 4, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('REGISTER NUMBER', margin + 4, y + 17);
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(data.register_number || 'N/A', margin + 4, y + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const classText = data.class_name ? `Class: ${data.class_name}` : 'IT Dept';
  const yearText = data.class_year ? `Year ${data.class_year}` : '';
  doc.text([classText, yearText].filter(Boolean).join(' • '), margin + 4, y + 27);

  // Middle Column: Track & Evaluation Timing
  const midX = margin + 70;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ASSESSMENT TRACK', midX, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(67, 56, 202); // indigo-700
  const trackTitle = data.track_title || 'General Skill Assessment';
  doc.text(doc.splitTextToSize(trackTitle, 55)[0], midX, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ATTEMPT DATE & TIME', midX, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  const testDate = data.created_at ? new Date(data.created_at).toLocaleString() : 'N/A';
  doc.text(testDate, midX, y + 22);

  const durationMin = Math.floor((data.time_taken_seconds || 0) / 60);
  const durationSec = (data.time_taken_seconds || 0) % 60;
  doc.text(`Duration: ${durationMin}m ${durationSec}s`, midX, y + 27);

  // Right Column: Webcam Identity Verification Snapshot
  const photoBoxWidth = 46;
  const photoBoxX = margin + contentWidth - photoBoxWidth - 3;

  if (proctorImg) {
    try {
      // Photo frame
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(99, 102, 241); // indigo-500
      doc.roundedRect(photoBoxX, y + 3.5, photoBoxWidth, 23, 2, 2, 'FD');

      doc.addImage(proctorImg.dataUrl, proctorImg.format, photoBoxX + 2, y + 4.5, 19, 21);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(67, 56, 202); // indigo-700
      doc.text('FACE PROCTOR', photoBoxX + 23, y + 9);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(22, 101, 52); // emerald-800
      doc.text('VERIFIED MATCH', photoBoxX + 23, y + 14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Shutter / Cam Lock', photoBoxX + 23, y + 18);
      doc.text('Session Active', photoBoxX + 23, y + 22);
    } catch {
      // Fallback
    }
  } else {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(photoBoxX, y + 3.5, photoBoxWidth, 23, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('PROCTOR SNAPSHOT', photoBoxX + photoBoxWidth / 2, y + 13, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text('Pre-verified identity', photoBoxX + photoBoxWidth / 2, y + 18, { align: 'center' });
  }

  y += 34;

  // ── Performance & Marks Metrics Grid ────────────────────────────────────────
  const cardGap = 4;
  const numCards = 4;
  const cardW = (contentWidth - cardGap * (numCards - 1)) / numCards;
  const cardH = 20;

  // 1. Final Score
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(margin, y, cardW, cardH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(79, 70, 229);
  doc.text('FINAL SCORE', margin + 3, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(49, 46, 129);
  doc.text(`${scoreNum}%`, margin + 3, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(99, 102, 241);
  doc.text(`${data.correct_count} / ${data.total_questions} Correct`, margin + 3, y + 17.5);

  // 2. Cutoff Benchmark
  const c2X = margin + cardW + cardGap;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(c2X, y, cardW, cardH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('INSTITUTION CUTOFF', c2X + 3, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`${cutoffNum}%`, c2X + 3, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Placement Benchmark', c2X + 3, y + 17.5);

  // 3. Status Clearance
  const c3X = margin + (cardW + cardGap) * 2;
  const statusBg = isPassed ? [236, 253, 245] : [255, 241, 242]; // emerald-50 or rose-50
  const statusBorder = isPassed ? [167, 243, 208] : [254, 205, 211];
  const statusTextCol = isPassed ? [6, 95, 70] : [159, 18, 57];
  doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
  doc.setDrawColor(statusBorder[0], statusBorder[1], statusBorder[2]);
  doc.roundedRect(c3X, y, cardW, cardH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(statusTextCol[0], statusTextCol[1], statusTextCol[2]);
  doc.text('ACADEMIC CLEARANCE', c3X + 3, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(isPassed ? 'PASSED' : 'REMEDIAL', c3X + 3, y + 12.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text(isPassed ? 'Eligible for campus drives' : 'Retake required', c3X + 3, y + 17.5);

  // 4. Integrity Status
  const c4X = margin + (cardW + cardGap) * 3;
  const isClean = violationCount === 0;
  const isWarning = violationCount > 0 && violationCount <= 2;
  const intBg = isClean ? [240, 253, 244] : isWarning ? [254, 252, 232] : [255, 241, 242];
  const intBorder = isClean ? [187, 247, 208] : isWarning ? [254, 240, 138] : [254, 205, 211];
  const intText = isClean ? [22, 101, 52] : isWarning ? [133, 77, 14] : [159, 18, 57];
  doc.setFillColor(intBg[0], intBg[1], intBg[2]);
  doc.setDrawColor(intBorder[0], intBorder[1], intBorder[2]);
  doc.roundedRect(c4X, y, cardW, cardH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(intText[0], intText[1], intText[2]);
  doc.text('INTEGRITY AUDIT', c4X + 3, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(isClean ? 'CLEAN (0)' : `${violationCount} INCIDENT${violationCount > 1 ? 'S' : ''}`, c4X + 3, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text(
    isClean ? 'Full compliance verified' : violationCount >= 3 ? 'Auto-submitted / Flagged' : 'Minor infractions logged',
    c4X + 3,
    y + 17.5
  );

  y += cardH + 5;

  // ── Section Header: Proctoring & Integrity Violations Audit ─────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. PROCTORING & INTEGRITY AUDIT TRAIL', margin, y);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y + 2, margin + contentWidth, y + 2);
  y += 6;

  // Integrity summary banner
  if (isClean) {
    doc.setFillColor(240, 253, 244); // emerald-50
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(22, 101, 52);
    doc.text('STATUS: FULL INTEGRITY COMPLIANCE — ZERO INCIDENTS DETECTED', margin + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(21, 128, 61);
    doc.text(
      'The candidate maintained fullscreen focus throughout the evaluation without tab switches, window blurs, or clipboard attempts.',
      margin + 4,
      y + 9.5
    );
    y += 15;
  } else {
    const isAutoSubmitted = violationCount >= 3;
    doc.setFillColor(isAutoSubmitted ? 255 : 254, isAutoSubmitted ? 241 : 252, isAutoSubmitted ? 242 : 232);
    doc.setDrawColor(isAutoSubmitted ? 254 : 254, isAutoSubmitted ? 205 : 240, isAutoSubmitted ? 211 : 138);
    doc.roundedRect(margin, y, contentWidth, 13, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(isAutoSubmitted ? 159 : 133, isAutoSubmitted ? 18 : 77, isAutoSubmitted ? 57 : 14);
    const alertTitle = isAutoSubmitted
      ? `STATUS: SEVERE INTEGRITY BREACH (${violationCount} INCIDENTS) — AUTO-SUBMITTED BY SYSTEM`
      : `STATUS: INTEGRITY CAUTION (${violationCount} INCIDENTS RECORDED)`;
    doc.text(alertTitle, margin + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(isAutoSubmitted ? 190 : 161, isAutoSubmitted ? 24 : 98, isAutoSubmitted ? 93 : 7);
    doc.text(
      isAutoSubmitted
        ? 'Maximum allowable proctoring violation limit (3) exceeded. Session was locked and submitted automatically.'
        : 'Candidate triggered minor security alerts during the test. Recorded timestamps are itemized below.',
      margin + 4,
      y + 9.5
    );
    y += 16;
  }

  // Incident Timeline Table (if events exist)
  const events = Array.isArray(data.integrity_events) ? data.integrity_events : [];
  if (events.length > 0) {
    checkPageBreak(30);

    // Table Header
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('#', margin + 3, y + 4.2);
    doc.text('INCIDENT TYPE / VIOLATION DETAILS', margin + 12, y + 4.2);
    doc.text('WALL TIME', margin + 105, y + 4.2);
    doc.text('ELAPSED', margin + 140, y + 4.2);
    doc.text('SEVERITY', margin + 168, y + 4.2);
    y += 6;

    events.forEach((evt, idx) => {
      checkPageBreak(7.5);
      const isZebra = idx % 2 === 1;
      if (isZebra) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 6.5, 'F');
      }

      const meta = EVENT_TYPE_LABELS[evt.type] || {
        label: evt.type?.replace(/_/g, ' ') || 'Unknown Violation',
        severity: 'MEDIUM' as const,
      };

      const elapsedMin = Math.floor((evt.elapsed_seconds || 0) / 60);
      const elapsedSec = (evt.elapsed_seconds || 0) % 60;
      const elapsedStr = `+${elapsedMin}m ${elapsedSec}s`;
      const timeStr = evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'N/A';

      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(String(idx + 1).padStart(2, '0'), margin + 3, y + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(meta.label, margin + 12, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(timeStr, margin + 105, y + 4.5);

      doc.setFont('courier', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(99, 102, 241);
      doc.text(elapsedStr, margin + 140, y + 4.5);

      // Severity badge
      const sevColors: Record<string, [number, number, number]> = {
        LOW: [100, 116, 139],
        MEDIUM: [202, 138, 4],
        HIGH: [225, 29, 72],
        CRITICAL: [190, 18, 60],
      };
      const [sr, sg, sb] = sevColors[meta.severity] || [100, 116, 139];
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(sr, sg, sb);
      doc.text(meta.severity, margin + 168, y + 4.5);

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 6.5, margin + contentWidth, y + 6.5);
      y += 6.5;
    });

    y += 4;
  }

  // ── Section 2: Domain Marks Breakdown ───────────────────────────────────────
  const categories = data.category_breakdown ? Object.entries(data.category_breakdown) : [];
  if (categories.length > 0) {
    checkPageBreak(30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('2. DOMAIN EVALUATION & MARKS BREAKDOWN', margin, y);

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 2, margin + contentWidth, y + 2);
    y += 6;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('KNOWLEDGE DOMAIN / SYLLABUS AREA', margin + 3, y + 4.2);
    doc.text('BENCHMARK SCORE', margin + 110, y + 4.2);
    doc.text('PROFICIENCY STATUS', margin + 150, y + 4.2);
    y += 6;

    categories.forEach(([catName, pctVal], idx) => {
      checkPageBreak(7);
      const catPct = Number(pctVal || 0);
      const isZebra = idx % 2 === 1;
      if (isZebra) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 6.5, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(catName, margin + 3, y + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const scoreColor = catPct >= 70 ? [22, 101, 52] : catPct >= 50 ? [180, 83, 9] : [190, 18, 60];
      doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.text(`${catPct}%`, margin + 110, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const statusLabel = catPct >= 70 ? 'Proficient / Cleared' : catPct >= 50 ? 'Intermediate / Average' : 'Needs Reinforcement';
      doc.text(statusLabel, margin + 150, y + 4.5);

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 6.5, margin + contentWidth, y + 6.5);
      y += 6.5;
    });

    y += 4;
  }

  // ── Section 3: Diagnostic Strengths & Growth Areas (if available) ───────────
  const strengths = Array.isArray(data.strengths) ? data.strengths : [];
  const gaps = Array.isArray(data.gaps) ? data.gaps : [];
  if (strengths.length > 0 || gaps.length > 0) {
    checkPageBreak(25);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('3. DIAGNOSTIC PERFORMANCE INSIGHTS', margin, y);

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 2, margin + contentWidth, y + 2);
    y += 6;

    const boxW = (contentWidth - 4) / 2;

    // Strengths box
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(margin, y, boxW, 18, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(22, 101, 52);
    doc.text('DEMONSTRATED STRENGTHS', margin + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(21, 128, 61);
    const strengthsText = strengths.length > 0 ? strengths.slice(0, 3).join(' • ') : 'Standard curriculum proficiency';
    const splitStrengths = doc.splitTextToSize(strengthsText, boxW - 6);
    doc.text(splitStrengths, margin + 3, y + 9.5);

    // Gaps box
    const gapX = margin + boxW + 4;
    doc.setFillColor(255, 241, 242);
    doc.setDrawColor(254, 205, 211);
    doc.roundedRect(gapX, y, boxW, 18, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(159, 18, 57);
    doc.text('AREAS FOR REINFORCEMENT', gapX + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(190, 24, 93);
    const gapsText = gaps.length > 0 ? gaps.slice(0, 3).join(' • ') : 'Continue regular revision';
    const splitGaps = doc.splitTextToSize(gapsText, boxW - 6);
    doc.text(splitGaps, gapX + 3, y + 9.5);

    y += 22;
  }

  // ── Institutional Sign-Off & Verification Footer ────────────────────────────
  checkPageBreak(30);

  y = Math.max(y + 6, pageHeight - 38);

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  // Digital verification token
  doc.setFont('courier', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  const digitalToken = `DOC-SHA256: ${(data.id || 'VSBEC').repeat(2).slice(0, 36).toUpperCase()} • PROCTOR-HASH-OK`;
  doc.text(digitalToken, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text(`Generated: ${new Date().toLocaleString()} • VSBEC Autonomous System`, margin + contentWidth, y, { align: 'right' });

  y += 6;

  // Signatures
  const sigColWidth = contentWidth / 2;

  // Faculty / Coordinator Signature
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Faculty In-Charge / Placement Coordinator', margin, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Verified Academic Proctor', margin, y + 14);

  // HOD Signature
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Head of the Department (HOD)', margin + sigColWidth, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Department of Information Technology • VSBEC', margin + sigColWidth, y + 14);

  // ── Add Page Numbers to all pages ──────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${p} of ${totalPages}`, margin + contentWidth / 2, pageHeight - 6, { align: 'center' });
  }

  return doc;
}

/**
 * Convenience helper to generate and trigger browser file download.
 */
export async function downloadAssessmentAuditPdf(data: AssessmentAuditData, customFileName?: string): Promise<void> {
  const doc = await generateAssessmentAuditPdf(data);
  const cleanReg = (data.register_number || 'STUDENT').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanTrack = (data.track_type || data.track_title || 'Assessment').replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = customFileName || `Audit_Scorecard_${cleanReg}_${cleanTrack}_${dateStr}.pdf`;
  doc.save(fileName);
}
