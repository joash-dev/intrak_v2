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
  
  // Create effective working days array
  let effectiveWorkingDays = [...workingDays];
  
  // For private companies, exclude Saturday if student doesn't work on Saturday
  if (worksOnSaturday === false) {
    effectiveWorkingDays = effectiveWorkingDays.filter(day => day !== 'Saturday');
  }
  
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
  // Create effective working days array
  let effectiveWorkingDays = [...workingDays];
  
  // For private companies, exclude Saturday if student doesn't work on Saturday
  if (worksOnSaturday === false) {
    effectiveWorkingDays = effectiveWorkingDays.filter(day => day !== 'Saturday');
  }
  
  // Convert day names to day numbers
  const workingDayNumbers = effectiveWorkingDays.map(day => DAY_NAME_TO_NUMBER[day]).filter(num => num !== undefined);
  
  // Get day of week for the date (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = date.getDay();
  
  // Check if this day is in the working days list
  return workingDayNumbers.includes(dayOfWeek);
}

