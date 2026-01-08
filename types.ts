
export interface TimesheetRow {
  member: string;
  project: string;
  avatar?: string;
  dailyHours: Record<string, number>; // date string -> decimal hours
  totalHours: number; // total for THIS project-member combo
  memberTotalMonth: number; // total for THIS member across ALL projects
}

export interface ParsedData {
  rows: TimesheetRow[];
  dates: string[];
}
