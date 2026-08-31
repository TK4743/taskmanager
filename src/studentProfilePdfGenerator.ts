import { jsPDF } from 'jspdf';

export interface StudentProfileData {
  academic?: any;
  personal?: any;
  skills?: any[];
  projects?: any[];
  internships?: any[];
  certifications?: any[];
  coding_profiles?: any;
  resume?: any;
  achievements?: any[];
  languages?: any[];
  career_preferences?: any;
}

/**
 * Generates a clean, professional, multi-page Resume PDF for a student
 * using native vector typography and standard A4 styling.
 */
export function generateStudentResumePdf(profile: StudentProfileData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const acad = profile.academic || {};
  const personal = profile.personal || {};
  const skills = profile.skills || [];
  const projects = profile.projects || [];
  const internships = profile.internships || [];
  const certs = profile.certifications || [];
  const coding = profile.coding_profiles || {};
  const achievements = profile.achievements || [];
  const languages = profile.languages || [];
  const career = profile.career_preferences || {};

  const fullName = (acad.full_name || 'STUDENT NAME').toUpperCase();
  const regNo = acad.register_number || 'N/A';
  const email = acad.email || personal.email || '';
  const phone = personal.mobile_number || '';
  const dept = acad.department_name || 'Information Technology';
  const className = acad.class_name || '';
  const batch = acad.batch || '';

  let y = 14;
  const margin = 14;
  const pageWidth = 210;
  const contentWidth = pageWidth - (margin * 2);
  const pageHeight = 297;
  const bottomThreshold = pageHeight - 18;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > bottomThreshold) {
      doc.addPage();
      y = 15;
    }
  };

  // ── Header Section ────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(fullName, margin, y);
  y += 5.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text(`DEPARTMENT OF ${dept.toUpperCase()} • VSB ENGINEERING COLLEGE (AUTONOMOUS)`, margin, y);
  y += 4.5;

  // Contact bar
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  const contactParts: string[] = [];
  if (regNo) contactParts.push(`Reg No: ${regNo}`);
  if (email) contactParts.push(email);
  if (phone) contactParts.push(`Mob: ${phone}`);
  if (className) contactParts.push(`Sec: ${className}`);
  if (batch) contactParts.push(`Batch: ${batch}`);
  const contactLine = contactParts.join('  |  ');
  const splitContact = doc.splitTextToSize(contactLine, contentWidth);
  doc.text(splitContact, margin, y);
  y += splitContact.length * 3.8 + 0.5;

  // Social / Coding profiles links bar
  const linkParts: string[] = [];
  if (coding.github_url) linkParts.push(`GitHub: ${coding.github_url.replace(/^https?:\/\//, '')}`);
  if (coding.leetcode_url) linkParts.push(`LeetCode: ${coding.leetcode_url.replace(/^https?:\/\//, '')}`);
  if (coding.linkedin_url) linkParts.push(`LinkedIn: ${coding.linkedin_url.replace(/^https?:\/\//, '')}`);
  if (coding.portfolio_url) linkParts.push(`Portfolio: ${coding.portfolio_url.replace(/^https?:\/\//, '')}`);
  
  if (linkParts.length > 0) {
    doc.setFontSize(7.5);
    doc.setTextColor(99, 102, 241);
    const linkLine = linkParts.join('  •  ');
    const splitLinks = doc.splitTextToSize(linkLine, contentWidth);
    doc.text(splitLinks, margin, y);
    y += splitLinks.length * 3.4 + 0.6;
  }

  // Divider line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.6);
  doc.line(margin, y, margin + contentWidth, y);
  y += 4.5;

  // Helper for Section Titles
  const drawSectionHeader = (title: string) => {
    checkPageBreak(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(title.toUpperCase(), margin, y);
    y += 1.5;
    doc.setDrawColor(79, 70, 229); // indigo line
    doc.setLineWidth(0.4);
    doc.line(margin, y, margin + contentWidth, y);
    y += 4.5;
  };

  // ── 1. Summary / Objective ────────────────────────────────────────────────
  if (personal.about_me || career.primary_role) {
    drawSectionHeader('Professional Summary');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    
    const summaryText = personal.about_me ||
      `Dedicated Information Technology student with a strong foundation in software engineering, algorithmic problem solving, and modern web systems. Seeking opportunities as a ${career.primary_role || 'Software Engineer'} to deliver scalable technological solutions.`;
    
    const splitSummary = doc.splitTextToSize(summaryText, contentWidth);
    checkPageBreak(splitSummary.length * 3.8);
    doc.text(splitSummary, margin, y);
    y += splitSummary.length * 3.8 + 2;
  }

  // ── 2. Education & Academic Background ────────────────────────────────────
  drawSectionHeader('Education');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  const degreeStr = 'Bachelor of Technology (B.Tech) - Information Technology';

  if (batch) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const gradWidth = doc.getTextWidth(batch);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    const degreeWidth = doc.getTextWidth(degreeStr);

    if (degreeWidth + gradWidth + 6 <= contentWidth) {
      doc.text(degreeStr, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(batch, margin + contentWidth, y, { align: 'right' });
      y += 4;
    } else {
      doc.text(degreeStr, margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(batch, margin, y);
      y += 4;
    }
  } else {
    doc.text(degreeStr, margin, y);
    y += 4;
  }

  doc.text('VSB Engineering College (Autonomous), Karur, Tamil Nadu', margin, y);
  y += 4;

  const acadMetrics: string[] = [];
  if (personal.cgpa) acadMetrics.push(`CGPA: ${personal.cgpa} / 10.0`);
  if (personal.semester) acadMetrics.push(`Semester: ${personal.semester}`);
  acadMetrics.push(`Current Arrears: ${personal.current_arrears ?? 0}`);
  acadMetrics.push(`History of Arrears: ${personal.history_of_arrears ?? 0}`);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(79, 70, 229);
  const metricsLine = acadMetrics.join('   |   ');
  const splitMetrics = doc.splitTextToSize(metricsLine, contentWidth);
  doc.text(splitMetrics, margin, y);
  y += splitMetrics.length * 3.5 + 2;

  // ── 3. Technical Skills ───────────────────────────────────────────────────
  if (skills.length > 0) {
    drawSectionHeader('Technical Skills');
    const categories: Record<string, string[]> = {};
    skills.forEach(s => {
      const cat = s.category || 'General';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(`${s.skill_name}${s.proficiency ? ` (${s.proficiency})` : ''}`);
    });

    Object.keys(categories).forEach(cat => {
      checkPageBreak(6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      const catLabel = `${cat}: `;
      const catWidth = doc.getTextWidth(catLabel);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const skillLine = categories[cat].join(', ');
      
      if (catWidth + 35 <= contentWidth) {
        doc.setFont('helvetica', 'bold');
        doc.text(catLabel, margin, y);
        doc.setFont('helvetica', 'normal');
        const splitSkills = doc.splitTextToSize(skillLine, contentWidth - catWidth);
        doc.text(splitSkills, margin + catWidth, y);
        y += splitSkills.length * 3.8 + 1;
      } else {
        doc.setFont('helvetica', 'bold');
        doc.text(catLabel, margin, y);
        y += 3.8;
        doc.setFont('helvetica', 'normal');
        const splitSkills = doc.splitTextToSize(skillLine, contentWidth);
        doc.text(splitSkills, margin, y);
        y += splitSkills.length * 3.8 + 1;
      }
    });
    y += 2;
  }

  // ── 4. Technical Projects ─────────────────────────────────────────────────
  if (projects.length > 0) {
    drawSectionHeader('Technical Projects');
    projects.forEach(p => {
      checkPageBreak(14);
      const projTitle = p.project_name || 'Project';
      const techStr = p.tech_stack ? `[${p.tech_stack}]` : '';

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const projWidth = doc.getTextWidth(projTitle);

      if (techStr) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        const techWidth = doc.getTextWidth(techStr);

        // If project name + tech stack fit on one line with safe clearance
        if (projWidth + techWidth + 6 <= contentWidth) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          doc.text(projTitle, margin, y);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(79, 70, 229);
          doc.text(techStr, margin + contentWidth, y, { align: 'right' });
          y += 3.8;
        } else {
          // If too wide: print title on first line, and tech stack badges wrapped on next line
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          doc.text(projTitle, margin, y);
          y += 3.8;

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(79, 70, 229);
          const splitTech = doc.splitTextToSize(techStr, contentWidth);
          doc.text(splitTech, margin, y);
          y += splitTech.length * 3.3 + 0.8;
        }
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(projTitle, margin, y);
        y += 3.8;
      }

      if (p.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        const splitDesc = doc.splitTextToSize(p.description, contentWidth);
        doc.text(splitDesc, margin, y);
        y += splitDesc.length * 3.5 + 1;
      }

      if (p.github_url || p.live_demo_url) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(99, 102, 241);
        const projectLinks = [];
        if (p.github_url) projectLinks.push(`Code: ${p.github_url}`);
        if (p.live_demo_url) projectLinks.push(`Live: ${p.live_demo_url}`);
        const linkLine = projectLinks.join('  •  ');
        const splitProjLinks = doc.splitTextToSize(linkLine, contentWidth);
        doc.text(splitProjLinks, margin, y);
        y += splitProjLinks.length * 3.4;
      }
      y += 2.5;
    });
  }

  // ── 5. Internships & Work Experience ─────────────────────────────────────
  if (internships.length > 0) {
    drawSectionHeader('Internships & Work Experience');
    internships.forEach(item => {
      checkPageBreak(12);
      const roleCompany = `${item.role || 'Intern'} - ${item.company || 'Company'}`;
      const durationStr = `${item.duration || ''}${item.mode ? ` (${item.mode})` : ''}`;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const titleWidth = doc.getTextWidth(roleCompany);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const metaWidth = durationStr ? doc.getTextWidth(durationStr) : 0;

      if (durationStr && (titleWidth + metaWidth + 6 <= contentWidth)) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(roleCompany, margin, y);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(durationStr, margin + contentWidth, y, { align: 'right' });
        y += 4;
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        const splitTitle = doc.splitTextToSize(roleCompany, contentWidth);
        doc.text(splitTitle, margin, y);
        y += splitTitle.length * 3.8;

        if (durationStr) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(durationStr, margin, y);
          y += 3.8;
        }
      }

      if (item.certificate_url) {
        doc.setFontSize(7.5);
        doc.setTextColor(79, 70, 229);
        const certLine = `Certificate: ${item.certificate_url}`;
        const splitCert = doc.splitTextToSize(certLine, contentWidth);
        doc.text(splitCert, margin, y);
        y += splitCert.length * 3.4;
      }
      y += 2.5;
    });
  }

  // ── 6. Certifications & Courses ──────────────────────────────────────────
  if (certs.length > 0) {
    drawSectionHeader('Certifications');
    certs.forEach(c => {
      checkPageBreak(8);
      const certTitle = `•  ${c.certificate_name}`;
      const provInfo = `${c.provider || 'Provider'}${c.issue_date ? ` (${c.issue_date})` : ''}`;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      const titleWidth = doc.getTextWidth(certTitle);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const provWidth = provInfo ? doc.getTextWidth(provInfo) : 0;

      if (provInfo && (titleWidth + provWidth + 6 <= contentWidth)) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(certTitle, margin, y);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(provInfo, margin + contentWidth, y, { align: 'right' });
        y += 4;
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        const splitTitle = doc.splitTextToSize(certTitle, contentWidth);
        doc.text(splitTitle, margin, y);
        y += splitTitle.length * 3.6;

        if (provInfo) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(`   ${provInfo}`, margin, y);
          y += 3.6;
        }
      }
      y += 1.5;
    });
  }

  // ── 7. Achievements & Co-Curricular ──────────────────────────────────────
  if (achievements.length > 0) {
    drawSectionHeader('Achievements & Awards');
    achievements.forEach(a => {
      checkPageBreak(8);
      const achTitle = `•  ${a.title}${a.category ? ` [${a.category}]` : ''}`;
      const dateStr = a.event_date || '';

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      const titleWidth = doc.getTextWidth(achTitle);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const dateWidth = dateStr ? doc.getTextWidth(dateStr) : 0;

      if (dateStr && (titleWidth + dateWidth + 6 <= contentWidth)) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(achTitle, margin, y);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(dateStr, margin + contentWidth, y, { align: 'right' });
        y += 3.8;
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        const splitTitle = doc.splitTextToSize(achTitle, contentWidth);
        doc.text(splitTitle, margin, y);
        y += splitTitle.length * 3.6;

        if (dateStr) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(`   ${dateStr}`, margin, y);
          y += 3.6;
        }
      }

      if (a.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        const splitAchDesc = doc.splitTextToSize(a.description, contentWidth - 4);
        doc.text(splitAchDesc, margin + 4, y);
        y += splitAchDesc.length * 3.5 + 1;
      }
      y += 1.5;
    });
  }

  // ── Footer / Institutional Endorsement across all pages ───────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 10;
    
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.4);
    doc.line(margin, footerY - 3, margin + contentWidth, footerY - 3);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('VSB ENGINEERING COLLEGE (AUTONOMOUS)', margin, footerY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    const rightInfo = `Official Academic Profile Record • Generated ${new Date().toLocaleDateString()} • Page ${i} of ${totalPages}`;
    doc.text(rightInfo, margin + contentWidth, footerY, { align: 'right' });
  }

  return doc;
}

/**
 * Downloads single student's resume PDF directly to the browser
 */
export function downloadStudentResumePdf(profile: StudentProfileData): void {
  const doc = generateStudentResumePdf(profile);
  const regNo = profile.academic?.register_number || 'Student';
  const name = (profile.academic?.full_name || '').replace(/\s+/g, '_');
  const filename = `${regNo}_${name || 'Profile'}_Resume.pdf`;
  doc.save(filename);
}
