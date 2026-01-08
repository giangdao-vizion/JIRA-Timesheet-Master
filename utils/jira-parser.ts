
import { TimesheetRow, ParsedData } from '../types';

/**
 * Converts JIRA time strings like "8h", "1h 30m", "30m" into decimal numbers.
 */
export const parseJiraTimeString = (timeStr: string): number => {
  if (!timeStr || timeStr === '0') return 0;

  const hourMatch = timeStr.match(/(\d+)h/);
  const minMatch = timeStr.match(/(\d+)m/);

  let hours = 0;
  if (hourMatch) {
    hours += parseInt(hourMatch[1], 10);
  }
  if (minMatch) {
    hours += parseInt(minMatch[1], 10) / 60;
  }

  // Handle case where it's just a number without units
  if (!hourMatch && !minMatch && !isNaN(parseFloat(timeStr))) {
    return parseFloat(timeStr);
  }

  return hours;
};

/**
 * Extracts project code from key (e.g., "UPDP-2" -> "UPDP")
 */
export const getProjectCode = (key: string): string => {
  if (!key) return 'Unknown';
  return key.split('-')[0];
};

/**
 * Parses the raw CSV string into an aggregated structure.
 */
export const parseTimesheetCsv = (csvText: string): ParsedData => {
  // Simple CSV parser that handles quotes
  const parseCSVLine = (text: string) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return { rows: [], dates: [] };

  const header = parseCSVLine(lines[0]);
  
  const authorIdx = header.indexOf('Worklog Author');
  const keyIdx = header.indexOf('Key');
  const avatarIdx = header.indexOf('Avatar');
  
  const datePattern = /^\d{1,2}-[A-Za-z]{3}-\d{2}$/;
  const dateIndices: number[] = [];
  const dateStrings: string[] = [];

  header.forEach((col, idx) => {
    if (datePattern.test(col)) {
      dateIndices.push(idx);
      dateStrings.push(col);
    }
  });

  const aggregation: Record<string, TimesheetRow> = {};
  const memberTotals: Record<string, number> = {};

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length < header.length) continue;

    const memberName = row[authorIdx];
    const projectCode = getProjectCode(row[keyIdx]);
    const avatar = row[avatarIdx];
    const aggKey = `${memberName}|${projectCode}`;

    if (!aggregation[aggKey]) {
      aggregation[aggKey] = {
        member: memberName,
        project: projectCode,
        avatar,
        dailyHours: {},
        totalHours: 0,
        memberTotalMonth: 0
      };
    }

    dateIndices.forEach((colIdx, listIdx) => {
      const dateStr = dateStrings[listIdx];
      const decimalHours = parseJiraTimeString(row[colIdx]);
      
      if (decimalHours > 0) {
        aggregation[aggKey].dailyHours[dateStr] = (aggregation[aggKey].dailyHours[dateStr] || 0) + decimalHours;
        aggregation[aggKey].totalHours += decimalHours;
        memberTotals[memberName] = (memberTotals[memberName] || 0) + decimalHours;
      }
    });
  }

  // Assign member totals to all rows for that member
  const resultRows = Object.values(aggregation).map(row => ({
    ...row,
    memberTotalMonth: memberTotals[row.member] || 0
  }));

  // Sort primarily by Project Code, then by Member Name
  return {
    rows: resultRows.sort((a, b) => 
      a.project.localeCompare(b.project) || a.member.localeCompare(b.member)
    ),
    dates: dateStrings
  };
};
