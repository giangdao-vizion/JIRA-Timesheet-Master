
import React, { useMemo } from 'react';
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

const MemberSummaryTable: React.FC<Props> = ({ data, onCellClick }) => {
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

    return Object.values(map).sort((a, b) => a.member.localeCompare(b.member));
  }, [data]);

  if (data.rows.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
        <h2 className="text-lg font-bold text-slate-800">Member Daily Totals</h2>
      </div>
      
      <div className="w-full overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <th className="px-4 py-3 font-semibold text-slate-700 text-sm border-r border-slate-200 bg-slate-50 sticky left-0 z-20">Member</th>
              {data.dates.map((date) => {
                const weekend = isWeekend(date);
                return (
                  <th 
                    key={date} 
                    className={`px-2 py-3 font-semibold text-[10px] uppercase text-center border-r border-slate-200 last:border-r-0 ${weekend ? 'bg-slate-200 text-slate-600' : 'text-slate-600'}`}
                  >
                    {date.split('-')[0]}
                    <span className="block font-normal text-slate-400">{date.split('-')[1]}</span>
                  </th>
                );
              })}
              <th className="px-4 py-3 font-semibold text-indigo-700 text-sm text-center bg-indigo-50 border-l border-slate-200">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {memberSummaries.map((summary) => (
              <tr key={summary.member} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-4 py-3 text-slate-700 text-sm border-r border-slate-200 bg-white sticky left-0 group-hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    {summary.avatar && (
                      <img 
                        src={summary.avatar} 
                        alt={summary.member} 
                        className="w-6 h-6 rounded-full border border-slate-200"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    )}
                    <span className="truncate max-w-[180px] font-medium">{summary.member}</span>
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
                      className={`px-2 py-3 text-xs text-center border-r border-slate-200 last:border-r-0 cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all ${bgColor} ${textColor}`}
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
        <div className="ml-auto text-slate-400 italic">Click any cell to add/edit hours</div>
      </div>
    </div>
  );
};

export default MemberSummaryTable;
