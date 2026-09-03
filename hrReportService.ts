import { pool } from './db.js';
import ExcelJS from 'exceljs';

export interface ReportFilterOptions {
  companyId: string;
  postingId?: string;
  status?: string;
  minMatch?: number;
  startDate?: string;
  endDate?: string;
}

export type ReportType =
  | 'applications'
  | 'skill-match'
  | 'shortlist'
  | 'interviews'
  | 'selections'
  | 'rejections'
  | 'postings-summary'
  | 'recruitment-summary'
  | 'coding-assessment';

export async function fetchReportData(reportType: ReportType, filters: ReportFilterOptions) {
  const { companyId, postingId, status, minMatch, startDate, endDate } = filters;
  const whereClauses: string[] = [`p.company_id = $1`];
  const queryParams: any[] = [companyId];
  let paramIndex = 2;

  if (postingId) {
    whereClauses.push(`pa.posting_id = $${paramIndex}`);
    queryParams.push(postingId);
    paramIndex++;
  }

  if (status) {
    whereClauses.push(`pa.status = $${paramIndex}`);
    queryParams.push(status);
    paramIndex++;
  }

  if (minMatch !== undefined && !isNaN(minMatch)) {
    whereClauses.push(`COALESCE(pa.match_score, 0) >= $${paramIndex}`);
    queryParams.push(minMatch);
    paramIndex++;
  }

  if (startDate) {
    whereClauses.push(`pa.created_at >= $${paramIndex}::timestamp`);
    queryParams.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    whereClauses.push(`pa.created_at <= $${paramIndex}::timestamp`);
    queryParams.push(endDate);
    paramIndex++;
  }

  const whereSql = whereClauses.join(' AND ');

  if (reportType === 'applications' || reportType === 'shortlist' || reportType === 'interviews' || reportType === 'selections' || reportType === 'rejections') {
    let statusFilter = '';
    if (reportType === 'shortlist') statusFilter = "AND pa.status = 'SHORTLISTED'";
    if (reportType === 'interviews') statusFilter = "AND pa.status = 'INTERVIEW'";
    if (reportType === 'selections') statusFilter = "AND pa.status = 'SELECTED'";
    if (reportType === 'rejections') statusFilter = "AND pa.status = 'REJECTED'";

    const query = `
      SELECT 
        pa.id as application_id,
        u.full_name as candidate_name,
        u.email,
        u.register_number,
        0.0 as cgpa,
        p.title as opportunity_title,
        p.posting_type,
        pa.match_score,
        pa.status as application_status,
        pa.matched_skills,
        pa.gap_skills,
        pa.cover_note,
        pa.created_at as applied_date
      FROM posting_applications pa
      JOIN industry_postings p ON p.id = pa.posting_id
      JOIN users u ON u.id = pa.student_id
      WHERE ${whereSql} ${statusFilter}
      ORDER BY pa.created_at DESC
    `;
    const res = await pool.query(query, queryParams);
    return res.rows;
  }

  if (reportType === 'skill-match') {
    const query = `
      SELECT 
        u.full_name as candidate_name,
        u.email,
        u.register_number,
        0.0 as cgpa,
        p.title as opportunity_title,
        p.posting_type,
        pa.match_score,
        pa.matched_skills,
        pa.gap_skills,
        p.required_skills,
        pa.status as application_status,
        pa.created_at as applied_date
      FROM posting_applications pa
      JOIN industry_postings p ON p.id = pa.posting_id
      JOIN users u ON u.id = pa.student_id
      WHERE ${whereSql}
      ORDER BY pa.match_score DESC
    `;
    const res = await pool.query(query, queryParams);
    return res.rows;
  }

  if (reportType === 'postings-summary') {
    const query = `
      SELECT 
        p.id as posting_id,
        p.title as opportunity_title,
        p.posting_type,
        p.mode,
        p.status as posting_status,
        p.total_seats,
        COUNT(pa.id) as total_applications,
        COUNT(pa.id) FILTER (WHERE pa.status = 'SHORTLISTED') as shortlisted_count,
        COUNT(pa.id) FILTER (WHERE pa.status = 'INTERVIEW') as interview_count,
        COUNT(pa.id) FILTER (WHERE pa.status = 'SELECTED') as selected_count,
        COUNT(pa.id) FILTER (WHERE pa.status = 'REJECTED') as rejected_count,
        ROUND(AVG(COALESCE(pa.match_score, 0)), 1) as avg_match_score
      FROM industry_postings p
      LEFT JOIN posting_applications pa ON pa.posting_id = p.id
      WHERE p.company_id = $1
      GROUP BY p.id, p.title, p.posting_type, p.mode, p.status, p.total_seats
      ORDER BY p.created_at DESC
    `;
    const res = await pool.query(query, [companyId]);
    return res.rows;
  }

  if (reportType === 'recruitment-summary') {
    const postingsQuery = `
      SELECT 
        COUNT(DISTINCT p.id) as total_opportunities,
        COUNT(DISTINCT pa.id) as total_applications,
        COUNT(DISTINCT pa.id) FILTER (WHERE pa.status = 'SHORTLISTED') as total_shortlisted,
        COUNT(DISTINCT pa.id) FILTER (WHERE pa.status = 'INTERVIEW') as total_interviews,
        COUNT(DISTINCT pa.id) FILTER (WHERE pa.status = 'SELECTED') as total_selected,
        ROUND(AVG(COALESCE(pa.match_score, 0)), 1) as overall_avg_match
      FROM industry_postings p
      LEFT JOIN posting_applications pa ON pa.posting_id = p.id
      WHERE p.company_id = $1
    `;
    const res = await pool.query(postingsQuery, [companyId]);
    return res.rows;
  }

  if (reportType === 'coding-assessment') {
    const codingQuery = `
      SELECT 
        u.full_name as candidate_name,
        u.email,
        COALESCE(u.register_number, '') as register_number,
        ca.title as assessment_title,
        asn.status as attempt_status,
        asn.final_score,
        CASE WHEN asn.is_passed THEN 'PASSED' ELSE 'FAILED' END as result_status,
        (
          SELECT string_agg(cq.title, ' | ')
          FROM coding_questions cq
          WHERE cq.id::text = ANY(SELECT jsonb_array_elements_text(asn.assigned_question_ids))
        ) as assigned_questions,
        (
          SELECT cs.language 
          FROM coding_submissions cs 
          WHERE cs.assignment_id = asn.id 
          ORDER BY cs.submitted_at ASC LIMIT 1
        ) as q1_language,
        (
          SELECT cs.score 
          FROM coding_submissions cs 
          WHERE cs.assignment_id = asn.id 
          ORDER BY cs.submitted_at ASC LIMIT 1
        ) as q1_score,
        (
          SELECT cs.language 
          FROM coding_submissions cs 
          WHERE cs.assignment_id = asn.id 
          ORDER BY cs.submitted_at DESC LIMIT 1
        ) as q2_language,
        (
          SELECT cs.score 
          FROM coding_submissions cs 
          WHERE cs.assignment_id = asn.id 
          ORDER BY cs.submitted_at DESC LIMIT 1
        ) as q2_score,
        COALESCE((asn.proctoring_summary->>'tab_switches')::int, 0) as tab_switches,
        COALESCE((asn.proctoring_summary->>'fullscreen_exits')::int, 0) as fullscreen_exits,
        COALESCE((asn.proctoring_summary->>'camera_interruptions')::int, 0) as camera_interruptions,
        CASE 
          WHEN COALESCE((asn.proctoring_summary->>'tab_switches')::int, 0) > 3 
            OR COALESCE((asn.proctoring_summary->>'fullscreen_exits')::int, 0) > 2 THEN 'REVIEW_REQUIRED'
          ELSE 'NORMAL'
        END as proctoring_status,
        asn.started_at,
        asn.submitted_at
      FROM coding_assignments asn
      JOIN coding_assessments ca ON ca.id = asn.assessment_id
      JOIN users u ON u.id = asn.student_id
      WHERE ca.company_id = $1
      ORDER BY asn.submitted_at DESC NULLS LAST, asn.created_at DESC
    `;
    const res = await pool.query(codingQuery, [companyId]);
    return res.rows;
  }

  return [];
}

// ── Export Generators ──────────────────────────────────────────────────────────

export function generateCSVReport(data: any[]): string {
  if (!data || data.length === 0) return 'No records found';
  const headers = Object.keys(data[0]);
  const rows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(h => {
      let val = row[h];
      if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val);
      }
      val = String(val ?? '').replace(/"/g, '""');
      return `"${val}"`;
    });
    rows.push(values.join(','));
  }
  return rows.join('\n');
}

export async function generateExcelReport(reportType: string, companyName: string, data: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Academia-Industry Portal';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('HR Report');

  // Title block
  worksheet.mergeCells('A1:G1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `${companyName.toUpperCase()} — HR RECRUITMENT REPORT (${reportType.toUpperCase().replace('-', ' ')})`;
  titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.getRow(1).height = 30;
  worksheet.addRow([]); // Blank row

  if (data.length > 0) {
    const headers = Object.keys(data[0]).map(h => h.replace(/_/g, ' ').toUpperCase());
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 24;

    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '334155' } };
      cell.alignment = { vertical: 'middle' };
    });

    for (const rowObj of data) {
      const rowValues = Object.keys(data[0]).map(k => {
        const val = rowObj[k];
        if (typeof val === 'object' && val !== null) return JSON.stringify(val);
        return val ?? '';
      });
      worksheet.addRow(rowValues);
    }

    // Auto width
    worksheet.columns.forEach(col => {
      col.width = 22;
    });
  } else {
    worksheet.addRow(['No data records found for selected filters']);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function generateHTMLPDFReport(reportType: string, companyName: string, data: any[]): string {
  const dateStr = new Date().toLocaleDateString();

  let tableHeader = '';
  let tableRows = '';

  if (data.length > 0) {
    const keys = Object.keys(data[0]);
    tableHeader = keys.map(k => `<th style="padding: 10px; border-bottom: 2px solid #0f172a; text-align: left; font-size: 11px; color: #0f172a; text-transform: uppercase;">${k.replace(/_/g, ' ')}</th>`).join('');

    tableRows = data.map(row => {
      const cells = keys.map(k => {
        let val = row[k];
        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
        return `<td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155;">${val ?? '—'}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>${reportType} Report</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #0f172a; }
        .hdr { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; }
        .title { font-size: 20px; font-weight: 800; }
        .sub { font-size: 12px; color: #64748b; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="hdr">
        <div>
          <div class="title">${companyName} — ${reportType.toUpperCase().replace('-', ' ')} REPORT</div>
          <div class="sub">SIH26044 Academia–Industry Intelligence Platform · Generated: ${dateStr}</div>
        </div>
      </div>
      <table>
        <thead><tr>${tableHeader}</tr></thead>
        <tbody>${tableRows || '<tr><td colspan="6">No records found</td></tr>'}</tbody>
      </table>
      <div class="footer">
        Confidential Report generated for ${companyName} · Official Institution Record
      </div>
    </body>
    </html>
  `;
}
