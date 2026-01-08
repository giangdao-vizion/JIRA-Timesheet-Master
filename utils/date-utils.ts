
/**
 * Checks if a JIRA formatted date (e.g., "1-Dec-25") is a Saturday or Sunday.
 */
export const isWeekend = (dateStr: string): boolean => {
  try {
    // JIRA format 1-Dec-25 is generally parsable by Date constructor
    // but to be safe we can normalize it slightly if needed.
    const date = new Date(dateStr);
    const day = date.getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
  } catch (e) {
    return false;
  }
};
