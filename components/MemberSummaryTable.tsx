
import React, { useState, useMemo } from 'react';
import { ParsedData, TimesheetRow } from '../types';
import { isWeekend } from '../utils/date-utils';

interface Props {
  data: ParsedData;
  onCellClick?: (member: string, date: string, total: number) => void;
}

interface MemberSummary {
  member: string;
  avatar?: string;
  dailyTotals: Record<string, number>;
  totalMonth: number;
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc' | null;
};

const MemberSummaryTable: React.FC<Props> = ({ data, onCellClick }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'member', direction: 'asc' });

  const memberSummaries = useMemo(() => {
    const map: Record<string, MemberSummary> = {};

    data.rows.forEach((row) => {
      if (!map[row.member]) {
        map[row.member] = {
          member: row.member,
          avatar: row.avatar,
          dailyTotals: {},
          totalMonth: 0,
        };
      }

      Object.entries(row.dailyHours).forEach(([date, hours]) => {
        const h = hours as number;
        map[row.member].dailyTotals[date] = (map[row.member].dailyTotals[date] || 0) + h;
        map[row.member].totalMonth += h;
      });
    });

    const items = Object.values(map);

    if (sortConfig.direction !== null) {
      items.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'member') {
          aValue = a.member;
          bValue = b.member;
        } else if (sortConfig.key === 'totalMonth') {
          aValue = a.totalMonth;
          bValue = b.totalMonth;
        } else {
          // Sorting by date
          aValue = a.dailyTotals[sortConfig.key] || 0;
          bValue = b.dailyTotals[sortConfig.key] || 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return items;
  }, [data, sortConfig]);

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

  // Alignment widths: member column here = project (100) + member (200) from TimesheetTable
  const identityWidth = "300px"; 
  const dayWidth = "48px";
  const totalWidth = "200px"; // Align with the combined 2 total columns above

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
        <h2 className="text-lg font-bold text-slate-800">Member Daily Totals</h2>
      </div>
      
      <div className="w-full overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full text-left border-collapse min-w-max table-fixed">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <th 
                style={{ width: identityWidth }}
                className="px-4 py-3 font-semibold text-slate-700 text-xs border-r border-slate-200 bg-slate-50 sticky left-0 z-20 cursor-pointer select-none hover:bg-slate-100"
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
                className="px-4 py-3 font-semibold text-indigo-700 text-xs text-center bg-indigo-50 border-l border-slate-200 cursor-pointer select-none hover:bg-indigo-100"
                onClick={() => requestSort('totalMonth')}
              >
                Monthly Total {renderSortIcon('totalMonth')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {memberSummaries.map((summary) => (
              <tr key={summary.member} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-4 py-3 text-slate-700 text-sm border-r border-slate-200 bg-white sticky left-0 group-hover:bg-slate-50 overflow-hidden">
                  <div className="flex items-center gap-2">
                    {summary.avatar && (
                      <img 
                        src={summary.avatar} 
                        alt={summary.member} 
                        className="w-6 h-6 rounded-full border border-slate-200 flex-shrink-0"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    )}
                    <span className="truncate max-w-[240px] font-medium text-xs">{summary.member}</span>
                  </div>
                </td>
                {data.dates.map((date) => {
                  const hours = summary.dailyTotals[date] || 0;
                  const weekend = isWeekend(date);
                  
                  let bgColor = '';
                  let textColor = 'text-slate-900';
                  
                  if (hours > 12) {
                    bgColor = 'bg-red-500';
                    textColor = 'text-white font-bold';
                  } else if (hours > 8) {
                    bgColor = 'bg-orange-500';
                    textColor = 'text-white font-bold';
                  } else if (hours > 0 && hours < 8 && !weekend) {
                    bgColor = 'bg-yellow-50';
                    textColor = 'text-slate-900 font-semibold';
                  } else if (weekend) {
                    bgColor = 'bg-slate-100';
                    textColor = hours ? 'text-slate-900 font-semibold' : 'text-slate-300';
                  } else {
                    textColor = hours ? 'text-slate-900 font-semibold' : 'text-slate-300';
                  }

                  return (
                    <td 
                      key={date} 
                      onClick={() => onCellClick?.(summary.member, date, hours)}
                      className={`px-1 py-3 text-[10px] text-center border-r border-slate-200 last:border-r-0 cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all ${bgColor} ${textColor}`}
                    >
                      {hours ? hours.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '0'}
                    </td>
                  );
                })}
                <td className="px-4 py-3 font-bold text-indigo-600 text-sm text-center bg-indigo-50 border-l border-slate-200">
                  {summary.totalMonth.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-4 text-[10px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-slate-100 border border-slate-200"></div>
          <span>Weekend</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-yellow-50 border border-yellow-200"></div>
          <span>Under 8h (Weekday)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
          <span className="font-medium text-orange-700">Over 8h</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
          <span className="font-medium text-red-700">Over 12h</span>
        </div>
        <div className="ml-auto text-slate-400 italic">Click headers to sort &middot; Click cells to add/edit hours</div>
      </div>
    </div>
  );
};

export default MemberSummaryTable;
