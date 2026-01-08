
import React, { useState, useMemo } from 'react';
import { ParsedData, TimesheetRow } from '../types';
import { exportToCsv } from '../utils/csv-exporter';
import { isWeekend } from '../utils/date-utils';

interface Props {
  data: ParsedData;
  onCellClick?: (member: string, project: string, date: string, hours: number) => void;
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc' | null;
};

const TimesheetTable: React.FC<Props> = ({ data, onCellClick }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'project', direction: 'asc' });

  const sortedRows = useMemo(() => {
    const sortableItems = [...data.rows];
    if (sortConfig.direction !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'project') {
          aValue = a.project;
          bValue = b.project;
        } else if (sortConfig.key === 'member') {
          aValue = a.member;
          bValue = b.member;
        } else if (sortConfig.key === 'totalHours') {
          aValue = a.totalHours;
          bValue = b.totalHours;
        } else if (sortConfig.key === 'memberTotalMonth') {
          aValue = a.memberTotalMonth;
          bValue = b.memberTotalMonth;
        } else {
          // Sorting by date
          aValue = a.dailyHours[sortConfig.key] || 0;
          bValue = b.dailyHours[sortConfig.key] || 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [data.rows, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <span className="text-slate-300 ml-1">↕</span>;
    if (sortConfig.direction === 'asc') return <span className="text-indigo-600 ml-1">↑</span>;
    if (sortConfig.direction === 'desc') return <span className="text-indigo-600 ml-1">↓</span>;
    return <span className="text-slate-300 ml-1">↕</span>;
  };

  if (data.rows.length === 0) return null;

  const handleDownload = () => {
    exportToCsv(data, `Jira_Summary_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Fixed widths to align with MemberSummaryTable
  const projectWidth = "100px";
  const memberWidth = "200px";
  const dayWidth = "48px";
  const totalWidth = "100px";

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
        <table className="w-full text-left border-collapse min-w-max table-fixed">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <th 
                style={{ width: projectWidth }}
                className="px-4 py-3 font-semibold text-slate-700 text-xs border-r border-slate-200 bg-slate-50 sticky left-0 z-20 cursor-pointer select-none hover:bg-slate-100"
                onClick={() => requestSort('project')}
              >
                Project {renderSortIcon('project')}
              </th>
              <th 
                style={{ width: memberWidth }}
                className="px-4 py-3 font-semibold text-slate-700 text-xs border-r border-slate-200 bg-slate-50 sticky left-[100px] z-20 cursor-pointer select-none hover:bg-slate-100"
                onClick={() => requestSort('member')}
              >
                Member {renderSortIcon('member')}
              </th>
              {data.dates.map((date) => {
                const weekend = isWeekend(date);
                return (
                  <th 
                    key={date} 
                    style={{ width: dayWidth }}
                    className={`px-1 py-3 font-semibold text-[9px] uppercase text-center border-r border-slate-200 last:border-r-0 cursor-pointer select-none hover:bg-slate-100 ${weekend ? 'bg-slate-200 text-slate-600' : 'text-slate-600'}`}
                    onClick={() => requestSort(date)}
                  >
                    {date.split('-')[0]}
                    <span className="block font-normal text-slate-400">{date.split('-')[1]}</span>
                    {sortConfig.key === date && renderSortIcon(date)}
                  </th>
                );
              })}
              <th 
                style={{ width: totalWidth }}
                className="px-4 py-3 font-semibold text-slate-700 text-xs text-center border-l border-slate-200 cursor-pointer select-none hover:bg-slate-100"
                onClick={() => requestSort('totalHours')}
              >
                Project {renderSortIcon('totalHours')}
              </th>
              <th 
                style={{ width: totalWidth }}
                className="px-4 py-3 font-semibold text-indigo-700 text-xs text-center bg-indigo-50 border-l border-slate-200 cursor-pointer select-none hover:bg-indigo-100"
                onClick={() => requestSort('memberTotalMonth')}
              >
                Working Time {renderSortIcon('memberTotalMonth')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRows.map((row, idx) => (
              <tr key={`${row.member}-${row.project}-${idx}`} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-4 py-3 font-medium text-slate-800 text-sm border-r border-slate-200 bg-white sticky left-0 group-hover:bg-slate-50 overflow-hidden text-ellipsis whitespace-nowrap">
                  <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                    {row.project}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700 text-sm border-r border-slate-200 bg-white sticky left-[100px] group-hover:bg-slate-50 overflow-hidden">
                  <div className="flex items-center gap-2">
                    {row.avatar && (
                      <img 
                        src={row.avatar} 
                        alt={row.member} 
                        className="w-5 h-5 rounded-full border border-slate-200 flex-shrink-0"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    )}
                    <span className="truncate text-xs">{row.member}</span>
                  </div>
                </td>
                {data.dates.map((date) => {
                  const hours = row.dailyHours[date] || 0;
                  const weekend = isWeekend(date);
                  return (
                    <td 
                      key={date} 
                      onClick={() => onCellClick?.(row.member, row.project, date, hours)}
                      className={`px-1 py-3 text-[10px] text-center border-r border-slate-200 last:border-r-0 cursor-pointer hover:bg-indigo-50 hover:ring-1 hover:ring-indigo-300 transition-all ${weekend ? 'bg-slate-100' : ''} ${hours ? 'font-semibold text-slate-900' : 'text-slate-300'}`}
                    >
                      {hours ? hours.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '0'}
                    </td>
                  );
                })}
                <td className="px-4 py-3 font-bold text-slate-600 text-xs text-center border-l border-slate-200">
                  {row.totalHours.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </td>
                <td className="px-4 py-3 font-black text-indigo-600 text-xs text-center bg-indigo-50 border-l border-slate-200">
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
