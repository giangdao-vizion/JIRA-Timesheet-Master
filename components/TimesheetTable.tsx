
import React from 'react';
import { ParsedData } from '../types';
import { exportToCsv } from '../utils/csv-exporter';

interface Props {
  data: ParsedData;
  onCellClick?: (member: string, project: string, date: string, hours: number) => void;
}

const TimesheetTable: React.FC<Props> = ({ data, onCellClick }) => {
  if (data.rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
        <p>No data to display. Please upload a JIRA CSV export.</p>
      </div>
    );
  }

  const handleDownload = () => {
    exportToCsv(data, `Jira_Summary_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
          <h2 className="text-lg font-bold text-slate-800">Project-Member Summary</h2>
        </div>
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="w-full overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <th className="px-4 py-3 font-semibold text-slate-700 text-sm border-r border-slate-200 bg-slate-50 sticky left-0 z-20">Project</th>
              <th className="px-4 py-3 font-semibold text-slate-700 text-sm border-r border-slate-200 bg-slate-50 sticky left-[100px] z-20">Member</th>
              {data.dates.map((date) => (
                <th key={date} className="px-2 py-3 font-semibold text-slate-600 text-[10px] uppercase text-center border-r border-slate-200 last:border-r-0">
                  {date.split('-')[0]}
                  <span className="block font-normal text-slate-400">{date.split('-')[1]}</span>
                </th>
              ))}
              <th className="px-4 py-3 font-semibold text-slate-700 text-sm text-center border-l border-slate-200">Project Total</th>
              <th className="px-4 py-3 font-semibold text-indigo-700 text-sm text-center bg-indigo-50 border-l border-slate-200">Working Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.rows.map((row, idx) => (
              <tr key={`${row.member}-${row.project}-${idx}`} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-4 py-3 font-medium text-slate-800 text-sm border-r border-slate-200 bg-white sticky left-0 group-hover:bg-slate-50">
                  <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-600 font-mono text-xs">
                    {row.project}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700 text-sm border-r border-slate-200 bg-white sticky left-[100px] group-hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    {row.avatar && (
                      <img 
                        src={row.avatar} 
                        alt={row.member} 
                        className="w-6 h-6 rounded-full border border-slate-200"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    )}
                    <span className="truncate max-w-[150px]">{row.member}</span>
                  </div>
                </td>
                {data.dates.map((date) => {
                  const hours = row.dailyHours[date] || 0;
                  return (
                    <td 
                      key={date} 
                      onClick={() => onCellClick?.(row.member, row.project, date, hours)}
                      className={`px-2 py-3 text-xs text-center border-r border-slate-200 last:border-r-0 cursor-pointer hover:bg-indigo-50 hover:ring-1 hover:ring-indigo-300 transition-all ${hours ? 'font-semibold text-slate-900' : 'text-slate-300'}`}
                    >
                      {hours ? hours.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) : '0'}
                    </td>
                  );
                })}
                <td className="px-4 py-3 font-bold text-slate-600 text-sm text-center border-l border-slate-200">
                  {row.totalHours.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </td>
                <td className="px-4 py-3 font-black text-indigo-600 text-sm text-center bg-indigo-50 border-l border-slate-200">
                  {row.memberTotalMonth.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimesheetTable;
