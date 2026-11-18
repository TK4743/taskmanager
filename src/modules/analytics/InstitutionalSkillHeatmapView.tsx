import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { API_URL } from '../../config';
import { 
  BarChart3, Sparkles, AlertTriangle, CheckCircle2, TrendingUp, 
  Layers, Search, Download, ShieldCheck, 
  Activity, RefreshCw, Users, X, Eye
} from 'lucide-react';

const API = API_URL || '';

interface SkillHeatmapItem {
  skill_name: string;
  category: string;
  student_count: number;
  cohort_percentage: number;
  avg_proficiency: number;
  verified_count: number;
  level_counts: { beginner: number; intermediate: number; advanced: number; expert: number };
  industry_demand: number;
  students?: Array<{ id: string; name: string; register_number: string; class_name: string }>;
  status: 'STRONG' | 'MODERATE' | 'DEFICIT';
}

interface SectorReadiness {
  sector: string;
  skills_tracked: number;
  readiness_score: number;
  top_strengths: string[];
  top_gaps: string[];
  readiness_tier: string;
}

interface CriticalDeficit {
  skill: string;
  category: string;
  current_proficiency_pct: number;
  avg_score: number;
  industry_demand_rank: number;
  urgency: 'HIGH' | 'MEDIUM';
  recommended_action: string;
}

export default function InstitutionalSkillHeatmapView({ token, user }: { token: string; user: any }) {
  const [loading, setLoading] = useState<boolean>(true);
  const [heatmapData, setHeatmapData] = useState<SkillHeatmapItem[]>([]);
  const [sectorReadiness, setSectorReadiness] = useState<SectorReadiness[]>([]);
  const [criticalDeficits, setCriticalDeficits] = useState<CriticalDeficit[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [healthScore, setHealthScore] = useState<number>(0);
  const [verifiedRatio, setVerifiedRatio] = useState<number>(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'STRONG' | 'MODERATE' | 'DEFICIT'>('ALL');
  const [selectedSkillModal, setSelectedSkillModal] = useState<SkillHeatmapItem | null>(null);
  const [toast, setToast] = useState<string>('');

  const availableCategories = useMemo(() => {
    return Array.from(new Set(heatmapData.map(item => item.category).filter(Boolean))).sort();
  }, [heatmapData]);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchHeatmap = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/analytics/institutional-skills-heatmap`, { headers });
      if (res.ok) {
        const data = await res.json();
        setHeatmapData(data.skills_heatmap || []);
        setSectorReadiness(data.sector_readiness || []);
        setCriticalDeficits(data.critical_deficits || []);
        setTotalStudents(data.total_students || 0);
        setHealthScore(data.institutional_health_score || 0);
        setVerifiedRatio(data.verified_skills_ratio || 0);
      } else {
        showToast('Failed to load institutional heatmap data');
      }
    } catch {
      showToast('Network error loading skills heatmap');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHeatmap();
  }, [fetchHeatmap]);

  const filteredSkills = heatmapData.filter(s => {
    const matchesSearch = s.skill_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || s.category.includes(selectedCategory);
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  const exportExcel = async () => {
    if (heatmapData.length === 0) {
      showToast('No skill data available to export');
      return;
    }
    setIsExportingExcel(true);
    try {
      const ExcelJS = (await import('exceljs')).default || await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Institutional Skill Heatmap');

      worksheet.columns = [
        { header: 'S.No', key: 'sno', width: 8 },
        { header: 'Skill / Competency', key: 'name', width: 32 },
        { header: 'Domain Category', key: 'category', width: 26 },
        { header: 'Student Count', key: 'count', width: 16 },
        { header: 'Cohort Coverage (%)', key: 'cohortPct', width: 22 },
        { header: 'Average Proficiency (%)', key: 'avgProf', width: 24 },
        { header: 'Verified Count', key: 'verified', width: 18 },
        { header: 'Industry Demand Rank', key: 'demand', width: 22 },
        { header: 'Institutional Status', key: 'status', width: 20 }
      ];

      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E1B4B' }
      };

      filteredSkills.forEach((h, idx) => {
        worksheet.addRow({
          sno: idx + 1,
          name: h.skill_name,
          category: h.category,
          count: h.student_count,
          cohortPct: `${h.cohort_percentage}%`,
          avgProf: `${h.avg_proficiency}%`,
          verified: h.verified_count,
          demand: `Rank #${h.industry_demand}`,
          status: h.status
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Institutional_Skill_Heatmap_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`Exported ${filteredSkills.length} skills to Excel!`);
    } catch {
      showToast('Error exporting Excel document');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const exportPDF = async () => {
    if (heatmapData.length === 0) {
      showToast('No skill data available to export');
      return;
    }
    setIsExportingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 12;
      const contentWidth = pageWidth - (margin * 2);

      // Header Banner
      doc.setFillColor(30, 27, 75);
      doc.rect(margin, 10, contentWidth, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('V.S.B. ENGINEERING COLLEGE — INSTITUTIONAL SKILL HEATMAP REPORT', pageWidth / 2, 18, { align: 'center' });
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`COHORT COMPETENCY BENCHMARK & SECTOR READINESS • GENERATED ON ${new Date().toLocaleDateString('en-GB')}`, pageWidth / 2, 25, { align: 'center' });

      // KPI Strip
      let y = 35;
      const cardW = contentWidth / 4;
      const kpis = [
        { label: 'COHORT ANALYZED', val: `${totalStudents} Students` },
        { label: 'HEALTH SCORE', val: `${healthScore}/100` },
        { label: 'VERIFIED SKILLS', val: `${verifiedRatio}% Ratio` },
        { label: 'TRACKED SKILLS', val: `${heatmapData.length} Competencies` }
      ];

      kpis.forEach((k, idx) => {
        const x = margin + (idx * cardW);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.rect(x, y, cardW - 2, 14, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(k.label, x + 3, y + 5);
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(k.val, x + 3, y + 11);
      });

      // Table Header
      y += 20;
      const drawHdr = (curY: number) => {
        doc.setFillColor(226, 232, 240);
        doc.rect(margin, curY, contentWidth, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text('S.No', margin + 2, curY + 5);
        doc.text('Skill / Competency', margin + 14, curY + 5);
        doc.text('Domain Category', margin + 75, curY + 5);
        doc.text('Student Count', margin + 145, curY + 5);
        doc.text('Cohort %', margin + 175, curY + 5);
        doc.text('Avg Prof %', margin + 205, curY + 5);
        doc.text('Verified', margin + 235, curY + 5);
        doc.text('Status', margin + 258, curY + 5);
      };

      drawHdr(y);
      y += 7;

      let pageNum = 1;
      filteredSkills.forEach((h, idx) => {
        if (y > pageHeight - 16) {
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          doc.text(`Page ${pageNum} — Institutional Skill Heatmap Audit Report`, margin, pageHeight - 8);
          doc.addPage();
          pageNum++;
          y = 12;
          drawHdr(y);
          y += 7;
        }

        doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
        doc.rect(margin, y, contentWidth, 6.5, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(15, 23, 42);

        doc.text(`${idx + 1}`, margin + 2, y + 4.5);
        doc.setFont('helvetica', 'bold');
        doc.text(String(h.skill_name || '').slice(0, 32), margin + 14, y + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(String(h.category || '').slice(0, 28), margin + 75, y + 4.5);
        doc.text(`${h.student_count}`, margin + 145, y + 4.5);
        doc.text(`${h.cohort_percentage}%`, margin + 175, y + 4.5);
        doc.text(`${h.avg_proficiency}%`, margin + 205, y + 4.5);
        doc.text(`${h.verified_count}`, margin + 235, y + 4.5);

        doc.setFont('helvetica', 'bold');
        if (h.status === 'STRONG') doc.setTextColor(16, 185, 129);
        else if (h.status === 'MODERATE') doc.setTextColor(245, 158, 11);
        else doc.setTextColor(244, 63, 94);
        doc.text(h.status, margin + 258, y + 4.5);

        y += 6.5;
      });

      doc.save(`Institutional_Skill_Heatmap_${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast('Generated Institutional Skill Heatmap PDF!');
    } catch {
      showToast('Error generating PDF report');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const exportCSV = () => {
    if (heatmapData.length === 0) return;
    const csvRows = [
      ['Skill Name', 'Category', 'Student Count', 'Cohort %', 'Avg Proficiency %', 'Verified Count', 'Industry Demand Rank', 'Institutional Status'],
      ...heatmapData.map(h => [
        `"${h.skill_name}"`,
        `"${h.category}"`,
        h.student_count,
        `${h.cohort_percentage}%`,
        `${h.avg_proficiency}%`,
        h.verified_count,
        h.industry_demand,
        h.status
      ])
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Institutional_Skill_Heatmap_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Exported institutional heatmap CSV successfully');
  };

  return (
    <div className="w-full flex-1 overflow-x-hidden p-4 md:p-8 bg-[#F5F5F4] dark:bg-[#0f0f12] text-zinc-900 dark:text-zinc-100 font-sans">
      <div className="w-full space-y-6">
        {toast && (
          <div className="fixed bottom-6 right-6 z-[99999] bg-zinc-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-zinc-700 text-xs font-bold flex items-center gap-2 animate-bounce">
            <Sparkles size={16} className="text-amber-400" />
            {toast}
          </div>
        )}

        {/* Top Banner Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                <BarChart3 size={20} />
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
                Institutional Skill Heatmap & Cohort Analytics
              </h1>
            </div>
            <p className="text-xs text-zinc-500 font-semibold mt-1">
              Real-time student competency mapping, domain sector readiness (including <strong>Ministry of Ayush & Health-Tech</strong>), and institutional deficit analytics for academic governance.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={fetchHeatmap}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-indigo-600' : ''} />
              Refresh
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer border border-zinc-200"
              title="Export raw CSV data for accreditation bodies"
            >
              <Download size={13} />
              <span>CSV</span>
            </button>
            <button
              onClick={exportExcel}
              disabled={isExportingExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Export formatted multi-column Excel spreadsheet"
            >
              <Download size={13} />
              <span>{isExportingExcel ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
            </button>
            <button
              onClick={exportPDF}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Export official landscape PDF accreditation report"
            >
              <Download size={13} />
              <span>{isExportingPdf ? 'Exporting...' : 'Export Audit (.pdf)'}</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
              <span>Cohort Analyzed</span>
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Users size={16} />
              </span>
            </div>
            <div className="text-2xl font-black text-zinc-900 mt-2">
              {totalStudents} <span className="text-xs font-semibold text-zinc-400">Students</span>
            </div>
            <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1.5 font-bold">
              <CheckCircle2 size={13} /> 100% Active Profiles
            </div>
          </div>

          <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
              <span>Institutional Health</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Activity size={16} />
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-2">
              {healthScore}%
            </div>
            <div className="text-[11px] text-zinc-500 mt-1.5 font-medium">
              Aggregate Competency Index
            </div>
          </div>

          <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
              <span>Verified Skills Ratio</span>
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <ShieldCheck size={16} />
              </span>
            </div>
            <div className="text-2xl font-black text-blue-600 mt-2">
              {verifiedRatio}%
            </div>
            <div className="text-[11px] text-zinc-500 mt-1.5 font-medium">
              Compiler & Proctored Tests
            </div>
          </div>

          <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
              <span>Deficit Alerts</span>
              <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle size={16} />
              </span>
            </div>
            <div className="text-2xl font-black text-rose-600 mt-2">
              {criticalDeficits.length} <span className="text-xs font-semibold text-zinc-400">Skills</span>
            </div>
            <div className="text-[11px] text-rose-600 mt-1.5 font-bold">
              Action Plan Required
            </div>
          </div>
        </div>

        {/* Sector Competency Mapping (Featuring Ministry of Ayush & IT Sectors) */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                <Layers size={18} />
              </span>
              <h2 className="text-base font-extrabold text-zinc-900">
                Domain & Sector Competency Mapping
              </h2>
            </div>
            <span className="text-xs text-zinc-500 font-medium">
              Aggregated across active student submissions, LeetCode sync & proctored coding assessments
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {sectorReadiness.map((sec, idx) => (
              <div 
                key={idx} 
                className="bg-zinc-50/80 hover:bg-white transition-all border border-zinc-200/80 hover:border-indigo-300 rounded-xl p-4 flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-xs font-extrabold text-zinc-900 truncate">{sec.sector}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                      sec.readiness_score >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      sec.readiness_score >= 45 ? 'bg-amber-50 text-amber-800 border-amber-200' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {sec.readiness_score}%
                    </span>
                  </div>

                  <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden mb-3">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        sec.readiness_score >= 70 ? 'bg-emerald-500' :
                        sec.readiness_score >= 45 ? 'bg-amber-500' :
                        'bg-rose-500'
                      }`}
                      style={{ width: `${sec.readiness_score}%` }}
                    />
                  </div>

                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Top Strengths:</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {sec.top_strengths.length > 0 ? (
                      sec.top_strengths.map((st, i) => (
                        <span key={i} className="text-[10px] bg-white border border-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded-md font-semibold">
                          ✓ {st}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-zinc-400 italic">No standout strength</span>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-indigo-700 font-bold mt-2 pt-2 border-t border-zinc-200 flex items-center justify-between">
                  <span>{sec.readiness_tier}</span>
                  <span>{sec.skills_tracked} Skills</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Deficits & Action Plans */}
        {criticalDeficits.length > 0 && (
          <div className="bg-gradient-to-r from-rose-50/70 via-red-50/50 to-amber-50/50 border-2 border-rose-200/90 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                  <AlertTriangle size={18} />
                </span>
                <h2 className="text-base font-extrabold text-rose-950">
                  Critical Institutional Deficits & Faculty Intervention Matrix
                </h2>
              </div>
              <span className="text-xs text-rose-800 font-bold bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-full">
                HOD & Advisor Action Required
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {criticalDeficits.map((def, i) => (
                <div key={i} className="bg-white border border-rose-200/80 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-extrabold text-zinc-900">{def.skill}</span>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                        {def.urgency} Urgency
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 font-medium mb-2">{def.category}</div>
                    
                    <div className="flex items-center justify-between text-xs font-semibold mb-2 text-zinc-700">
                      <span>Cohort Proficiency:</span>
                      <span className="text-rose-600 font-black">{def.current_proficiency_pct}%</span>
                    </div>

                    <p className="text-[11px] text-zinc-600 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 leading-relaxed font-medium">
                      💡 <strong className="text-zinc-800">Action:</strong> {def.recommended_action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Skills Heatmap Table */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <TrendingUp size={18} />
                </span>
                <h2 className="text-base font-extrabold text-zinc-900">
                  Comprehensive Cohort Skill Inventory
                </h2>
              </div>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Showing {filteredSkills.length} verified technical & domain skills across current batch
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search competencies or domain areas..."
                  className="pl-9 pr-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-52 font-medium"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="py-2 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="ALL">All Categories</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="py-2 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="ALL">All Status</option>
                <option value="STRONG">🟢 Strong (&gt;65%)</option>
                <option value="MODERATE">🟡 Moderate (40-65%)</option>
                <option value="DEFICIT">🔴 Deficit (&lt;40%)</option>
              </select>
            </div>
          </div>

          {/* Heatmap Table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-zinc-50 text-zinc-600 font-extrabold border-b border-zinc-200 uppercase tracking-wider text-[10px] font-sans">
                  <th className="p-3.5">Skill & Category</th>
                  <th className="p-3.5">Student Adoption</th>
                  <th className="p-3.5">Proficiency Spectrum</th>
                  <th className="p-3.5">Avg Score</th>
                  <th className="p-3.5">Industry Demand</th>
                  <th className="p-3.5">Accreditation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-medium font-sans">
                {filteredSkills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-zinc-400 font-semibold italic">
                      No matching skills found for the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSkills.map((item, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedSkillModal(item)}
                      className="hover:bg-zinc-100/90 transition-colors font-sans cursor-pointer group"
                      title="Click to view detailed student breakdown for this skill"
                    >
                      <td className="p-3.5">
                        <div className="font-extrabold text-zinc-900 text-xs sm:text-sm flex items-center gap-1.5">
                          <span>{item.skill_name}</span>
                          <Eye size={12} className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-[11px] text-zinc-500 font-medium mt-0.5">{item.category}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-zinc-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.status === 'STRONG' ? 'bg-emerald-500' :
                                item.status === 'MODERATE' ? 'bg-amber-500' :
                                'bg-rose-500'
                              }`}
                              style={{ width: `${item.cohort_percentage}%` }}
                            />
                          </div>
                          <span className="font-black text-zinc-900">{item.cohort_percentage}%</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">{item.student_count} of {totalStudents} students</div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1 text-[10px] font-semibold">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200" title="Beginner">
                            Beg: {item.level_counts.beginner}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100" title="Intermediate">
                            Int: {item.level_counts.intermediate}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100" title="Advanced">
                            Adv: {item.level_counts.advanced}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100" title="Expert">
                            Exp: {item.level_counts.expert}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className={`font-black text-xs ${
                          item.avg_proficiency >= 75 ? 'text-emerald-700' :
                          item.avg_proficiency >= 60 ? 'text-amber-700' :
                          'text-rose-700'
                        }`}>
                          {item.avg_proficiency}%
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700">
                          🔥 {item.industry_demand} Postings
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          item.status === 'STRONG' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                          item.status === 'MODERATE' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                          'bg-rose-50 text-rose-800 border-rose-300'
                        }`}>
                          {item.status === 'STRONG' && <CheckCircle2 size={12} className="text-emerald-600" />}
                          {item.status === 'MODERATE' && <TrendingUp size={12} className="text-amber-600" />}
                          {item.status === 'DEFICIT' && <AlertTriangle size={12} className="text-rose-600" />}
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Skill Breakdown Modal */}
      {selectedSkillModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs cursor-pointer"
          onClick={() => setSelectedSkillModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 cursor-default border border-zinc-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-lg font-black text-zinc-900">{selectedSkillModal.skill_name}</h3>
                <p className="text-xs text-zinc-500 font-medium">{selectedSkillModal.category}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSkillModal(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <div className="text-[10px] font-bold text-zinc-400 uppercase">Adoption</div>
                <div className="text-base font-extrabold text-zinc-900 mt-0.5">{selectedSkillModal.cohort_percentage}%</div>
                <div className="text-[10px] text-zinc-500">{selectedSkillModal.student_count} Students</div>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <div className="text-[10px] font-bold text-zinc-400 uppercase">Proficiency</div>
                <div className="text-base font-extrabold text-emerald-600 mt-0.5">{selectedSkillModal.avg_proficiency}%</div>
                <div className="text-[10px] text-zinc-500">Avg Benchmark</div>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <div className="text-[10px] font-bold text-zinc-400 uppercase">Job Demand</div>
                <div className="text-base font-extrabold text-indigo-600 mt-0.5">{selectedSkillModal.industry_demand}</div>
                <div className="text-[10px] text-zinc-500">Active Postings</div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Enrolled Students with Demonstrated Competency ({selectedSkillModal.students?.length || selectedSkillModal.student_count})
              </h4>
              <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-xl">
                {selectedSkillModal.students && selectedSkillModal.students.length > 0 ? (
                  selectedSkillModal.students.map((st, i) => (
                    <div key={i} className="p-2.5 flex items-center justify-between text-xs hover:bg-zinc-50">
                      <div>
                        <div className="font-bold text-zinc-900">{st.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{st.register_number}</div>
                      </div>
                      <span className="text-[11px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
                        {st.class_name || 'IT Batch'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-zinc-400 font-medium">
                    Cohort aggregate data active across {selectedSkillModal.student_count} registered students.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSkillModal(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
