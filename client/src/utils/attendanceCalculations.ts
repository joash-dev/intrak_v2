// Shared attendance calculation utilities to ensure consistency between student and instructor views

export interface AttendanceLog {
  id: string;
  studentId: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  durationMinutes: number;
  verified: boolean;
  verificationMethod: 'QR' | 'GPS' | 'MANUAL';
  verificationMetadata?: any;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendanceRate: number;
  totalHours: number;
  completedHours: number;
  verifiedDays: number;
  pendingDays: number;
  avgHoursPerDay: number;
}

/**
 * Round minutes to the nearest 30-minute increment (official time standard)
 * - Round to nearest 30-minute interval (0, 30, 60, 90, etc.)
 * - Examples: 25 mins → 30 mins, 36 mins → 30 mins, 85 mins (1h 25m) → 90 mins (1h 30m)
 */
export function roundToOfficialTime(minutes: number): number {
  // Round DOWN to nearest 30-minute interval
  // Anything less than 30 minutes rounds to 0
  if (minutes < 30) {
    return 0;
  }
  // Round down to nearest 30-minute interval (30, 60, 90, 120, etc.)
  return Math.floor(minutes / 30) * 30;
}

/**
 * Calculate attendance statistics using consistent logic
 * This ensures both student and instructor views show the same data
 */
export function calculateAttendanceStats(
  logs: AttendanceLog[],
  requiredHours: number = 240
): AttendanceStats {
  if (!logs || !Array.isArray(logs)) {
    return {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      attendanceRate: 0,
      totalHours: requiredHours,
      completedHours: 0,
      verifiedDays: 0,
      pendingDays: 0,
      avgHoursPerDay: 0,
    };
  }

  // Calculate completed hours from verified logs only
  // Apply official time rounding (30-minute increments)
  const verifiedLogs = logs.filter(log => log.verified);
  const completedMinutes = verifiedLogs.reduce((sum, log) => {
    const roundedMinutes = roundToOfficialTime(log.durationMinutes || 0);
    return sum + roundedMinutes;
  }, 0);
  // Keep as decimal to show accurate hours (e.g., 30 mins = 0.5 hours, not 1.0)
  const completedHours = completedMinutes / 60;
  
  // Calculate attendance metrics
  const verifiedDays = verifiedLogs.length;
  const pendingDays = logs.filter(log => !log.verified).length;
  
  // Calculate attendance rate based on all logs (including unverified)
  const totalDays = logs.length;
  const presentDays = logs.filter(log => log.timeIn && log.timeOut).length;
  const absentDays = totalDays - presentDays;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  
  // Calculate average hours per day
  const avgHoursPerDay = logs.length > 0 ? completedHours / logs.length : 0;

  return {
    totalDays,
    presentDays,
    absentDays,
    attendanceRate,
    totalHours: requiredHours,
    // Keep decimal precision (e.g., 0.5 for 30 minutes, 1.5 for 1 hour 30 minutes)
    completedHours: Math.round(completedHours * 10) / 10, // Round to 1 decimal place
    verifiedDays,
    pendingDays,
    avgHoursPerDay: Math.round(avgHoursPerDay * 10) / 10,
  };
}

/**
 * Calculate attendance trend based on recent vs older attendance patterns
 */
export function calculateAttendanceTrend(logs: AttendanceLog[]): "up" | "down" | "stable" {
  if (!logs || logs.length < 7) return "stable";
  
  // Get recent 7 days and previous 7 days
  const recentLogs = logs.slice(-7);
  const olderLogs = logs.slice(-14, -7);
  
  if (olderLogs.length === 0) return "stable";
  
  const recentPresentDays = recentLogs.filter(log => log.timeIn && log.timeOut).length;
  const olderPresentDays = olderLogs.filter(log => log.timeIn && log.timeOut).length;
  
  const recentRate = recentPresentDays / recentLogs.length * 100;
  const olderRate = olderPresentDays / olderLogs.length * 100;
  
  if (recentRate > olderRate + 5) return "up";
  if (recentRate < olderRate - 5) return "down";
  return "stable";
}

/**
 * Determine student status based on attendance and performance
 */
export function determineStudentStatus(
  attendanceRate: number,
  lastEvaluation: number,
  completedHours: number,
  requiredHours: number
): "excellent" | "good" | "needs_attention" | "critical" {
  // Check if student has completed required hours
  const hoursProgress = (completedHours / requiredHours) * 100;
  
  if (attendanceRate >= 95 && lastEvaluation >= 4.5 && hoursProgress >= 80) {
    return "excellent";
  } else if (attendanceRate >= 85 && lastEvaluation >= 3.5 && hoursProgress >= 60) {
    return "good";
  } else if (attendanceRate >= 70 && hoursProgress >= 40) {
    return "needs_attention";
  } else {
    return "critical";
  }
}

/**
 * Format duration for display (with official time rounding)
 */
export function formatDuration(minutes: number): string {
  // Apply official time rounding (30-minute increments)
  const roundedMinutes = roundToOfficialTime(minutes);
  const hours = Math.floor(roundedMinutes / 60);
  const mins = roundedMinutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return mins > 0 ? `${mins}m` : '0m';
}

/**
 * Format date for display
 */
export function formatAttendanceDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

/**
 * Format time for display
 */
export function formatAttendanceTime(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}
