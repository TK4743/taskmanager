import React from 'react';
import { Github, Code } from 'lucide-react';
import { FloatingModal } from '../../FloatingModal';

export interface StudentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudentHistory: any;
  codingPlatformTab: 'LEETCODE' | 'GITHUB';
  studentHistoryData: any;
}

export function StudentHistoryModal({
  isOpen,
  onClose,
  selectedStudentHistory,
  codingPlatformTab,
  studentHistoryData,
}: StudentHistoryModalProps) {
  if (!isOpen || !selectedStudentHistory) return null;

  const student = selectedStudentHistory;
  const isGithub = codingPlatformTab === 'GITHUB';
  const hasData = studentHistoryData && (
    isGithub
      ? (studentHistoryData.history && studentHistoryData.history.length > 0)
      : (studentHistoryData.daily && studentHistoryData.daily.length > 0)
  );

  const renderDailyChart = () => {
    let data: any[] = [];
    if (isGithub) {
      const historyList = studentHistoryData?.history || [];
      data = historyList.map((h: any) => ({
        date: h.date,
        actual: h.commits ?? h.daily_commit_count ?? 0,
        target: 0,
      }));
    } else {
      data = studentHistoryData?.daily || [];
    }
    if (data.length === 0) {
      return (
        <div className="text-center text-xs py-10 text-zinc-400 font-bold">
          No progress data logged yet
        </div>
      );
    }
    const maxVal = Math.max(...data.map((d: any) => Math.max(d.actual, d.target)), 5);
    const height = 120;
    const width = 500;
    const paddingLeft = 30;
    const paddingRight = 10;
    const paddingTop = 10;
    const paddingBottom = 20;
    const chartHeight = height - paddingTop - paddingBottom;
    const chartWidth = width - paddingLeft - paddingRight;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
        <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="#e4e4e7" strokeDasharray="3,3" />
        <line x1={paddingLeft} y1={paddingTop + chartHeight / 2} x2={width - paddingRight} y2={paddingTop + chartHeight / 2} stroke="#e4e4e7" strokeDasharray="3,3" />
        <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="#e4e4e7" />

        {data.map((d: any, i: number) => {
          const x = paddingLeft + (i * (chartWidth / data.length));
          const barWidth = Math.max(2, (chartWidth / data.length) - 4);
          const barHeight = (d.actual / maxVal) * chartHeight;
          const targetY = height - paddingBottom - (d.target / maxVal) * chartHeight;

          return (
            <g key={i} className="group">
              <rect
                x={x}
                y={height - paddingBottom - barHeight}
                width={barWidth}
                height={barHeight}
                fill={isGithub ? "#4f46e5" : "#f97316"}
                rx={1}
              />
              {d.target > 0 && (
                <circle cx={x + barWidth / 2} cy={targetY} r={2} fill="#ef4444" />
              )}
              <title>{isGithub ? `Date: ${d.date}\nCommits: ${d.actual}` : `Date: ${d.date}\nSolved: ${d.actual}\nTarget: ${d.target}`}</title>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <FloatingModal
      isOpen={isOpen && Boolean(selectedStudentHistory)}
      onClose={onClose}
      title={isGithub ? 'GitHub Commit History' : 'LeetCode Progress History'}
      subtitle={`${student.fullName || student.full_name || ''} (${student.registerNumber || student.register_number || ''}) • ${student.className || 'IT'}`}
      icon={isGithub ? <Github size={20} className="text-indigo-600" /> : <Code size={20} className="text-orange-500" />}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6 custom-scrollbar">
        {/* Student Profile Info */}
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Username / Handle</span>
            <span className="text-sm font-black text-zinc-800 dark:text-zinc-200">
              {isGithub ? (student.githubUsername || 'Not Configured') : (student.leetcodeUsername || 'Not Configured')}
            </span>
          </div>
          <div>
            {isGithub ? (
              student.githubUrl && (
                <a
                  href={student.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-black text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1.5 shadow-2xs transition-all"
                >
                  <Github size={14} /> View Profile
                </a>
              )
            ) : (
              student.leetcodeUrl && (
                <a
                  href={student.leetcodeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-black text-orange-600 dark:text-orange-400 inline-flex items-center gap-1.5 shadow-2xs transition-all"
                >
                  <Code size={14} /> View Profile
                </a>
              )
            )}
          </div>
        </div>

        {/* Performance Stats Summaries */}
        {isGithub ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Commits Today</span>
              <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{studentHistoryData?.commitsToday ?? 0}</span>
            </div>
            <div className="p-4 bg-violet-50/50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/50 rounded-xl">
              <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider block">Commits This Week</span>
              <span className="text-2xl font-black text-violet-700 dark:text-violet-400">{studentHistoryData?.commitsThisWeek ?? 0}</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-orange-50/50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 rounded-xl">
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider block">Solved Today</span>
              <span className="text-2xl font-black text-orange-700 dark:text-orange-400">{studentHistoryData?.solvedToday ?? 0}</span>
            </div>
            <div className="p-4 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-xl">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Solved This Week</span>
              <span className="text-2xl font-black text-amber-700 dark:text-amber-400">{studentHistoryData?.solvedThisWeek ?? 0}</span>
            </div>
          </div>
        )}

        {/* Chart Area */}
        <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 bg-zinc-50/30 dark:bg-zinc-900/30">
          <h4 className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-4">
            {isGithub ? '30-Day Activity History' : 'Daily Solving Progress'}
          </h4>
          {renderDailyChart()}
        </div>

        {/* Logs List Table */}
        <div>
          <h4 className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-3">Detailed History Log</h4>
          {!hasData ? (
            <div className="text-center text-xs py-8 text-zinc-400 font-bold border border-zinc-100 dark:border-zinc-800 rounded-xl bg-zinc-50/20">
              No records logged yet.
            </div>
          ) : (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">
                      {isGithub ? 'Commits Pushed' : 'Problems Solved'}
                    </th>
                    {!isGithub && <th className="px-4 py-3 text-right">Daily Target</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                  {isGithub ? (
                    studentHistoryData.history.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{row.date}</td>
                        <td className="px-4 py-3 text-right text-indigo-600 dark:text-indigo-400 font-bold">
                          {row.commits ?? row.daily_commit_count ?? 0}
                        </td>
                      </tr>
                    ))
                  ) : (
                    studentHistoryData.daily.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{row.date}</td>
                        <td className="px-4 py-3 text-right text-orange-600 dark:text-orange-400 font-bold">{row.actual}</td>
                        <td className="px-4 py-3 text-right text-zinc-500 dark:text-zinc-400">{row.target}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </FloatingModal>
  );
}

export default StudentHistoryModal;
