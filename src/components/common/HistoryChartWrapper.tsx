import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';

export function HistoryChartWrapper({ studentId, type, token }: { studentId: string; type: 'daily' | 'weekly'; token: string | null }) {
  const [history, setHistory] = useState<any>(null);
  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/leetcode/progress/student/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setHistory(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (studentId) fetchHistory();
    return () => { isMounted = false; };
  }, [studentId, token]);

  if (!history) return <div className="text-zinc-400 text-xs font-semibold py-10">Fetching history logs...</div>;

  const data = type === 'daily' ? history.daily : history.weekly;
  if (!data || data.length === 0) return <div className="text-zinc-400 text-xs font-semibold py-10">No progress logs found</div>;

  const maxVal = Math.max(...data.map((d: any) => Math.max(d.actual, d.target)), 5);
  const height = 120;
  const width = 500;
  const paddingLeft = 30;
  const paddingRight = 10;
  const paddingTop = 10;
  const paddingBottom = 20;
  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = width - paddingLeft - paddingRight;

  if (type === 'daily') {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="#e4e4e7" strokeDasharray="3,3" />
        <line x1={paddingLeft} y1={paddingTop + chartHeight / 2} x2={width - paddingRight} y2={paddingTop + chartHeight / 2} stroke="#e4e4e7" strokeDasharray="3,3" />
        <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="#e4e4e7" />
        {data.map((d: any, i: number) => {
          const x = paddingLeft + (i * (chartWidth / data.length));
          const barWidth = Math.max(2, (chartWidth / data.length) - 4);
          const barHeight = (d.actual / maxVal) * chartHeight;
          const targetY = height - paddingBottom - (d.target / maxVal) * chartHeight;
          return (
            <g key={i}>
              <rect x={x} y={height - paddingBottom - barHeight} width={barWidth} height={barHeight} fill="#f97316" rx={1} />
              {d.target > 0 && <circle cx={x + barWidth / 2} cy={targetY} r={2} fill="#ef4444" />}
              <title>{`Date: ${d.date}\nSolved: ${d.actual}\nTarget: ${d.target}`}</title>
            </g>
          );
        })}
      </svg>
    );
  } else {
    const points = data.map((d: any, i: number) => {
      const x = paddingLeft + (i * (chartWidth / Math.max(1, data.length - 1)));
      const y = height - paddingBottom - (d.actual / maxVal) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
    const areaPoints = `${paddingLeft},${height - paddingBottom} ${points} ${paddingLeft + chartWidth},${height - paddingBottom}`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="#e4e4e7" strokeDasharray="3,3" />
        <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="#e4e4e7" />
        <polygon points={areaPoints} fill="rgba(99, 102, 241, 0.1)" />
        <polyline points={points} fill="none" stroke="#6366f1" strokeWidth={2} />
        {data.map((d: any, i: number) => {
          const x = paddingLeft + (i * (chartWidth / Math.max(1, data.length - 1)));
          const y = height - paddingBottom - (d.actual / maxVal) * chartHeight;
          const targetY = height - paddingBottom - (d.target / maxVal) * chartHeight;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={4} fill="#6366f1" />
              <line x1={x - 5} y1={targetY} x2={x + 5} y2={targetY} stroke="#dc2626" strokeWidth={1} />
              <text x={x} y={height - 5} textAnchor="middle" className="text-[8px] font-semibold text-zinc-400">{d.week}</text>
              <title>{`Week: ${d.start} to ${d.end}\nSolved: ${d.actual}\nTarget: ${d.target}`}</title>
            </g>
          );
        })}
      </svg>
    );
  }
}


export default HistoryChartWrapper;
