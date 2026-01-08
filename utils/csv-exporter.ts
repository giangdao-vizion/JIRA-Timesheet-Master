
import { ParsedData } from '../types';

export const exportToCsv = (data: ParsedData, filename: string = 'timesheet_summary.csv') => {
  const headers = ['Project', 'Member', ...data.dates, 'Project Total', 'Working Time'];
  
  const csvRows = data.rows.map(row => {
    const dailyValues = data.dates.map(date => (row.dailyHours[date] || 0).toString());
    return [
      row.project,
      row.member,
      ...dailyValues,
      row.totalHours.toString(),
      row.memberTotalMonth.toString()
    ].map(v => `"${v}"`).join(',');
  });

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...csvRows
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
