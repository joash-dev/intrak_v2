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
  const hLabel = hours === 1 ? "hour" : "hours";
  const mLabel = mins === 1 ? "minute" : "minutes";
  if (hours > 0) {
    return mins > 0 ? `${hours} ${hLabel} ${mins} ${mLabel}` : `${hours} ${hLabel}`;
  }
  return mins > 0 ? `${mins} ${mLabel}` : "0 minutes";
}

/**
 * Format date for display
 */
export function formatAttendanceDate(dateString: string): string {
  // Display dates in Asia/Manila to avoid day shifts when values are stored in UTC.
  // Keep format simple/consistent; richer formatting can be handled by localeService if needed.
  return new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila" }).format(new Date(dateString));
}

/**
 * Format time for display
 */
export function formatAttendanceTime(dateString: string | null): string {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(dateString));
}

/** Format minutes into "X hrs Y mins". */
export function formatHoursMinutes(minutes: number): string {
  const safeMinutes = Math.max(0, Math.floor(minutes || 0));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${hours} hrs ${mins} mins`;
}

/** Minutes from midnight in Asia/Manila (0–1439) for a given instant. */
export function getManilaMinutesFromMidnight(iso: string | Date): number {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const h = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const m = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  return h * 60 + m;
}

const MS_PER_MIN = 60000;

function minutesBetweenIso(isoStart: string | null, isoEnd: string | null): number {
  if (!isoStart || !isoEnd) return 0;
  const t0 = new Date(isoStart).getTime();
  const t1 = new Date(isoEnd).getTime();
  if (Number.isNaN(t0) || Number.isNaN(t1) || t1 <= t0) return 0;
  return Math.floor((t1 - t0) / MS_PER_MIN);
}

/**
 * Column H — raw presence: (AM dep − AM arr) + (PM dep − PM arr), no clamping.
 */
export function computeActualHoursDayMinutes(
  amArrival: string | null,
  amDeparture: string | null,
  pmArrival: string | null,
  pmDeparture: string | null
): number {
  return (
    minutesBetweenIso(amArrival, amDeparture) + minutesBetweenIso(pmArrival, pmDeparture)
  );
}

/**
 * Column I — minutes inside official windows only (Asia/Manila):
 * AM 7:30–12:00, PM 13:00–18:00. Uses calendar-day windows anchored on `dateKey` (YYYY-MM-DD Manila).
 */
export function computeOfficialHoursDayMinutes(
  amArrival: string | null,
  amDeparture: string | null,
  pmArrival: string | null,
  pmDeparture: string | null,
  dateKeyYyyyMmDd: string
): number {
  const morningStart = new Date(`${dateKeyYyyyMmDd}T07:30:00.000+08:00`);
  const morningEnd = new Date(`${dateKeyYyyyMmDd}T12:00:00.000+08:00`);
  const afternoonStart = new Date(`${dateKeyYyyyMmDd}T13:00:00.000+08:00`);
  const afternoonEnd = new Date(`${dateKeyYyyyMmDd}T18:00:00.000+08:00`);

  const overlapWithWindow = (
    inIso: string | null,
    outIso: string | null,
    winStart: Date,
    winEnd: Date
  ): number => {
    if (!inIso || !outIso) return 0;
    const inMs = new Date(inIso).getTime();
    const outMs = new Date(outIso).getTime();
    if (Number.isNaN(inMs) || Number.isNaN(outMs) || outMs <= inMs) return 0;
    const start = Math.max(inMs, winStart.getTime());
    const end = Math.min(outMs, winEnd.getTime());
    return end > start ? Math.floor((end - start) / MS_PER_MIN) : 0;
  };

  return (
    overlapWithWindow(amArrival, amDeparture, morningStart, morningEnd) +
    overlapWithWindow(pmArrival, pmDeparture, afternoonStart, afternoonEnd)
  );
}

const ceil30Minutes = (m: number): number => Math.ceil(m / 30) * 30;
const floor30Minutes = (m: number): number => Math.floor(m / 30) * 30;

/**
 * Column J — same windows as I, but arrival CEILING to 30 min, departure FLOOR to 30 min (Manila wall clock), then clamp.
 */
export function computeThirtyMinuteBlockDayMinutes(
  amArrival: string | null,
  amDeparture: string | null,
  pmArrival: string | null,
  pmDeparture: string | null,
  _dateKeyYyyyMmDd: string
): number {
  const AM_START = 7 * 60 + 30;
  const AM_END = 12 * 60;
  const PM_START = 13 * 60;
  const PM_END = 18 * 60;

  const blockSession = (
    arrivalIso: string | null,
    departureIso: string | null,
    winStartMin: number,
    winEndMin: number
  ): number => {
    if (!arrivalIso || !departureIso) return 0;
    const rIn = ceil30Minutes(getManilaMinutesFromMidnight(arrivalIso));
    const rOut = floor30Minutes(getManilaMinutesFromMidnight(departureIso));
    const start = Math.max(rIn, winStartMin);
    const end = Math.min(rOut, winEndMin);
    return Math.max(0, end - start);
  };

  return (
    blockSession(amArrival, amDeparture, AM_START, AM_END) +
    blockSession(pmArrival, pmDeparture, PM_START, PM_END)
  );
}

/**
 * Compute overlap in minutes between one attendance segment and official windows:
 * 7:30–12:00 and 13:00–18:00 in Asia/Manila (same rules as spreadsheet column I, per segment).
 */
export function calculateOfficialMinutes(
  timeIn: string | null,
  timeOut: string | null
): number {
  if (!timeIn || !timeOut) return 0;

  const inDate = new Date(timeIn);
  const outDate = new Date(timeOut);
  if (Number.isNaN(inDate.getTime()) || Number.isNaN(outDate.getTime()) || outDate <= inDate) {
    return 0;
  }

  const yyyyMmDd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(inDate);

  const morningStart = new Date(`${yyyyMmDd}T07:30:00.000+08:00`);
  const morningEnd = new Date(`${yyyyMmDd}T12:00:00.000+08:00`);
  const afternoonStart = new Date(`${yyyyMmDd}T13:00:00.000+08:00`);
  const afternoonEnd = new Date(`${yyyyMmDd}T18:00:00.000+08:00`);

  const overlapMinutes = (startA: Date, endA: Date, startB: Date, endB: Date): number => {
    const start = Math.max(startA.getTime(), startB.getTime());
    const end = Math.min(endA.getTime(), endB.getTime());
    return end > start ? Math.floor((end - start) / 60000) : 0;
  };

  return (
    overlapMinutes(inDate, outDate, morningStart, morningEnd) +
    overlapMinutes(inDate, outDate, afternoonStart, afternoonEnd)
  );
}
