/**
 * Utility functions for attendance calculations with company-specific working schedules
 */

/**
 * Map day names to JavaScript day numbers
 * Monday = 1, Tuesday = 2, ..., Sunday = 0
 */
const DAY_NAME_TO_NUMBER: Record<string, number> = {
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6,
  'Sunday': 0,
};

const DEFAULT_WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const normalizeWorkingDays = (
  workingDays: string[],
  worksOnSaturday?: boolean
): string[] => {
  const sourceDays = Array.isArray(workingDays) && workingDays.length > 0
    ? workingDays
    : DEFAULT_WORKING_DAYS;

  // Build from provided schedule, then apply student Saturday preference override.
  const daySet = new Set(sourceDays.filter((day) => DAY_NAME_TO_NUMBER[day] !== undefined));

  // Sunday is never a required internship day.
  daySet.delete('Sunday');

  if (worksOnSaturday) {
    daySet.add('Saturday');
  } else {
    daySet.delete('Saturday');
  }

  return Array.from(daySet);
};

/**
 * Calculate expected working days between two dates based on company schedule
 * @param startDate Start date of the period
 * @param endDate End date of the period (or current date if ongoing)
 * @param workingDays Array of working day names (e.g., ["Monday", "Tuesday", ...])
 * @param worksOnSaturday Optional: Student's Saturday preference (for private companies)
 * @returns Number of expected working days
 */
export function calculateExpectedWorkingDays(
  startDate: Date,
  endDate: Date,
  workingDays: string[],
  worksOnSaturday?: boolean
): number {
  let expectedDays = 0;
  const currentDate = new Date(startDate);

  const effectiveWorkingDays = normalizeWorkingDays(workingDays, worksOnSaturday);

  // Convert day names to day numbers for comparison
  const workingDayNumbers = effectiveWorkingDays.map(day => DAY_NAME_TO_NUMBER[day]).filter(num => num !== undefined);

  // Loop through each day from start to end
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Check if this day is in the working days list
    if (workingDayNumbers.includes(dayOfWeek)) {
      expectedDays++;
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return expectedDays;
}

/**
 * Check if a specific date is an expected working day
 * @param date Date to check
 * @param workingDays Array of working day names
 * @param worksOnSaturday Optional: Student's Saturday preference (for private companies)
 * @returns True if the date is an expected working day
 */
export function isExpectedWorkingDay(
  date: Date,
  workingDays: string[],
  worksOnSaturday?: boolean
): boolean {
  const effectiveWorkingDays = normalizeWorkingDays(workingDays, worksOnSaturday);

  // Convert day names to day numbers
  const workingDayNumbers = effectiveWorkingDays.map(day => DAY_NAME_TO_NUMBER[day]).filter(num => num !== undefined);

  // Get day of week for the date (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = date.getDay();

  // Check if this day is in the working days list
  return workingDayNumbers.includes(dayOfWeek);
}

/**
 * Estimate internship completion date based on:
 * - start date
 * - required total hours
 * - max hours/day (default 8)
 * - effective working days (company schedule + student Saturday preference)
 */
export function calculateProjectedEndDate(
  startDate: Date,
  totalHours: number,
  workingDays: string[],
  worksOnSaturday?: boolean,
  maxHoursPerDay = 8
): Date | null {
  if (!startDate || Number.isNaN(startDate.getTime())) return null;
  if (!totalHours || totalHours <= 0 || maxHoursPerDay <= 0) return null;

  const effectiveWorkingDays = normalizeWorkingDays(workingDays, worksOnSaturday);
  const workingDayNumbers = effectiveWorkingDays
    .map((day) => DAY_NAME_TO_NUMBER[day])
    .filter((num) => num !== undefined);

  if (workingDayNumbers.length === 0) return null;

  const requiredDays = Math.ceil(totalHours / maxHoursPerDay);
  let completedDays = 0;

  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);

  while (completedDays < requiredDays) {
    const dayOfWeek = cursor.getDay();
    if (workingDayNumbers.includes(dayOfWeek)) {
      completedDays += 1;
      if (completedDays >= requiredDays) {
        break;
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return cursor;
}

