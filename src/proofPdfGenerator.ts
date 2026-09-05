import { jsPDF } from 'jspdf';

export interface ProofPdfItem {
  url: string;
  studentName: string;
  registerNumber: string;
  className: string;
  year?: string | number;
  deptName?: string;
  taskTitle: string;
  status: string;
  submittedAt?: string;
  isTeam?: boolean;
  teamName?: string;
  teamLeader?: string;
  members?: string[];
}

export interface ProofPdfProgress {
  current: number;
  total: number;
  percent: number;
  statusText: string;
}

/**
 * Converts a Blob to a base64 Data URL and retrieves its natural dimensions
 */
function blobToDataUrlAndDimensions(blob: Blob): Promise<{ dataUrl: string; width: number; height: number; format: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        let format = 'JPEG';
        if (blob.type.includes('png') || dataUrl.startsWith('data:image/png')) format = 'PNG';
        else if (blob.type.includes('webp') || dataUrl.startsWith('data:image/webp')) format = 'WEBP';
        resolve({
          dataUrl,
          width: img.naturalWidth || 800,
          height: img.naturalHeight || 600,
          format
        });
      };
      img.onerror = () => {
        resolve({ dataUrl, width: 800, height: 600, format: 'JPEG' });
      };
      img.src = dataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Compiles a list of submission proofs into a single, multi-page merged PDF document.
 * Each proof screenshot gets its own A4 page with student / task metadata and IT Logo.
 */
export async function generateMergedProofsPdf(
  items: ProofPdfItem[],
  fetchBlob: (url: string) => Promise<Blob | null>,
  onProgress?: (progress: ProofPdfProgress) => void,
  isAborted?: () => boolean
): Promise<Blob | null> {
  if (!items || items.length === 0) return null;

  // Preload college IT logo
  let logoDataUrl: string | null = null;
  let logoFormat: string = 'PNG';
  try {
    const logoRes = await fetch('/logo.png');
    if (logoRes.ok) {
      const logoBlob = await logoRes.blob();
      const loadedLogo = await blobToDataUrlAndDimensions(logoBlob);
      logoDataUrl = loadedLogo.dataUrl;
      logoFormat = loadedLogo.format;
    }
  } catch (err) {
    console.warn('[Proof PDF] Could not preload /logo.png:', err);
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const total = items.length;

  for (let i = 0; i < total; i++) {
    if (isAborted && isAborted()) {
      return null;
    }

    const item = items[i];
    const pageNum = i + 1;

    if (i > 0) {
      doc.addPage();
    }

    if (onProgress) {
      const pct = Math.round(((i + 0.5) / total) * 90);
      onProgress({
        current: pageNum,
        total,
        percent: pct,
        statusText: `Rendering proof page ${pageNum} of ${total}...`
      });
    }

    // ── 1. Page Background Frame ──
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // ── 2. Top Header Banner ──
    // Header container with soft background & border
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(margin, 8, pageWidth - (margin * 2), 34, 2, 2, 'FD');

    let textStartX = margin + 4;

    // Embed IT Logo if available
    if (logoDataUrl) {
      const logoSize = 10;
      const logoX = margin + 3;
      const logoY = 9.5;
      
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(logoX - 0.5, logoY - 0.5, logoSize + 1, logoSize + 1, 1, 1, 'FD');
      doc.addImage(logoDataUrl, logoFormat, logoX, logoY, logoSize, logoSize, undefined, 'FAST');
      textStartX = margin + 16;
    }

    // College Title (without TASK PROOF ARCHIVE)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('VSB ENGINEERING COLLEGE (AUTONOMOUS)', textStartX, 13.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text('Department of Information Technology', textStartX, 17.5);

    // Running Page Number on top right
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Page ${pageNum} of ${total}`, pageWidth - margin - 4, 13.5, { align: 'right' });

    // Dividing line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin + 4, 21, pageWidth - margin - 4, 21);

    // Student / Team Information Row
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    if (item.isTeam) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Team: ${item.teamName || 'Group Submission'}`, margin + 4, 26);
      doc.setFont('helvetica', 'normal');
      doc.text(`Leader: ${item.teamLeader || 'N/A'}`, margin + 4, 30.5);
      if (item.members && item.members.length > 0) {
        doc.text(`Members: ${item.members.slice(0, 4).join(', ')}${item.members.length > 4 ? '...' : ''}`, margin + 4, 35);
      }
    } else {
      doc.setFont('helvetica', 'bold');
      doc.text(`Student: ${item.studentName || 'Student'}`, margin + 4, 26);
      doc.setFont('helvetica', 'normal');
      doc.text(`Reg No: ${item.registerNumber || 'N/A'}`, margin + 4, 30.5);
      const classStr = [item.year ? `Year ${item.year}` : '', item.className, item.deptName || 'IT'].filter(Boolean).join(' • ');
      doc.text(classStr || 'Class Submission', margin + 4, 35);
    }

    // Right Column: Task Title & Status
    const rightColX = pageWidth - margin - 4;
    doc.setFont('helvetica', 'bold');
    const taskTitleTruncated = (item.taskTitle || 'Task').length > 36
      ? (item.taskTitle.slice(0, 33) + '...')
      : item.taskTitle;
    doc.text(`Task: ${taskTitleTruncated}`, rightColX, 26, { align: 'right' });

    // Status Badge
    const statusText = (item.status || 'SUBMITTED').toUpperCase();
    let badgeColor: [number, number, number] = [37, 99, 235]; // Blue (Submitted)
    if (statusText === 'VERIFIED' || statusText === 'APPROVED') {
      badgeColor = [16, 149, 106]; // Emerald (Verified)
    } else if (statusText === 'REJECTED') {
      badgeColor = [220, 38, 38]; // Red (Rejected)
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.text(`STATUS: ${statusText}`, rightColX, 30.5, { align: 'right' });

    if (item.submittedAt) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Date: ${item.submittedAt}`, rightColX, 35, { align: 'right' });
    }

    // ── 3. Screenshot Image Section ──
    const imgAreaTop = 46;
    const imgAreaBottom = pageHeight - 12;
    const maxImgWidth = pageWidth - (margin * 2);
    const maxImgHeight = imgAreaBottom - imgAreaTop;

    let imageLoaded = false;

    if (item.url) {
      try {
        const blob = await fetchBlob(item.url);
        if (blob) {
          const { dataUrl, width: origW, height: origH, format } = await blobToDataUrlAndDimensions(blob);

          if (origW > 0 && origH > 0) {
            // Calculate proportional dimensions to fit inside [maxImgWidth x maxImgHeight]
            const imgAspect = origW / origH;
            const containerAspect = maxImgWidth / maxImgHeight;

            let renderWidth = maxImgWidth;
            let renderHeight = maxImgHeight;

            if (imgAspect > containerAspect) {
              renderWidth = maxImgWidth;
              renderHeight = maxImgWidth / imgAspect;
            } else {
              renderHeight = maxImgHeight;
              renderWidth = maxImgHeight * imgAspect;
            }

            // Center image in the printable area
            const renderX = margin + ((maxImgWidth - renderWidth) / 2);
            const renderY = imgAreaTop + ((maxImgHeight - renderHeight) / 2);

            // Subtle border behind/around image
            doc.setFillColor(241, 245, 249);
            doc.setDrawColor(203, 213, 225);
            doc.roundedRect(renderX - 1, renderY - 1, renderWidth + 2, renderHeight + 2, 1, 1, 'FD');

            doc.addImage(dataUrl, format, renderX, renderY, renderWidth, renderHeight, undefined, 'FAST');
            imageLoaded = true;
          }
        }
      } catch (err) {
        console.warn(`[Proof PDF] Error embedding image on page ${pageNum}:`, err);
      }
    }

    if (!imageLoaded) {
      doc.setFillColor(254, 242, 242); // red-50
      doc.setDrawColor(252, 165, 165); // red-300
      doc.roundedRect(margin, imgAreaTop + 20, maxImgWidth, 40, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(185, 28, 28); // red-700
      doc.text('Proof Screenshot Unavailable', pageWidth / 2, imgAreaTop + 35, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(153, 27, 27);
      doc.text('The proof image could not be loaded from storage or was purged.', pageWidth / 2, imgAreaTop + 43, { align: 'center' });
    }

    // ── 4. Bottom Footer with Interactive Hyperlinks ──
    const footerY = pageHeight - 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    // Portal link (Clickable)
    doc.setTextColor(37, 99, 235); // Blue #2563eb
    doc.textWithLink('IT TaskManager Portal', margin, footerY, { url: 'https://it-taskmanager.vercel.app/' });
    const portalWidth = doc.getTextWidth('IT TaskManager Portal');

    // Separator text
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(' • Built by ', margin + portalWidth, footerY);
    const separatorWidth = doc.getTextWidth(' • Built by ');

    // TechSquad Team Portfolio link (Clickable)
    doc.setTextColor(37, 99, 235);
    doc.textWithLink('TechSquad Portfolio', margin + portalWidth + separatorWidth, footerY, { url: 'https://techsquadsih.netlify.app/' });
    const techSquadWidth = doc.getTextWidth('TechSquad Portfolio');

    doc.setTextColor(148, 163, 184);
    doc.text(' • Official Academic Record', margin + portalWidth + separatorWidth + techSquadWidth, footerY);

    // Right side: Generation date
    doc.setTextColor(148, 163, 184);
    doc.text(
      new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      pageWidth - margin,
      footerY,
      { align: 'right' }
    );
  }

  if (isAborted && isAborted()) {
    return null;
  }

  if (onProgress) {
    onProgress({
      current: total,
      total,
      percent: 95,
      statusText: 'Finalizing PDF output...'
    });
  }

  return doc.output('blob');
}
