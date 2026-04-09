/**
 * Official OJT attendance slots (Asia/Manila).
 *
 * - Session 1 (first segment of the day, wall clock before noon): 8:00 AM – 12:00 PM
 * - Session 2 (afternoon / second segment): 1:00 PM – 5:00 PM (official time-out is always 5:00 PM)
 *
 * Note: Training Agreement and Liability Waiver (Form FM-AA-INT-15) is an overtime-related
 * document; institutional approval for that form is from 5:00 PM onwards — that is separate
 * from the official attendance clock-out time above.
 */

export const getManilaDayRangeUtc = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yyyyMmDd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);

  const start = new Date(`${yyyyMmDd}T00:00:00.000+08:00`);
  const end = new Date(`${yyyyMmDd}T23:59:59.999+08:00`);
  return { start, end, yyyyMmDd };
};

export const getManilaFixedTimeUtc = (dayAnchor: Date, hours24: number, minutes: number) => {
  const { yyyyMmDd } = getManilaDayRangeUtc(dayAnchor);
  const hh = String(hours24).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return new Date(`${yyyyMmDd}T${hh}:${mm}:00.000+08:00`);
};

/** Minutes from midnight in Asia/Manila (0–1439). */
export const getManilaMinuteOfDay = (d: Date): number => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const h = parseInt(parts.find((p) => p.type === 'hour')!.value, 10);
  const m = parseInt(parts.find((p) => p.type === 'minute')!.value, 10);
  return h * 60 + m;
};

/** First segment of the calendar day and clock still before noon → AM slot. */
export const isAmSlotFirstSegment = (segmentsAlreadyForDay: number, actualIn: Date): boolean => {
  return segmentsAlreadyForDay === 0 && getManilaMinuteOfDay(actualIn) < 12 * 60;
};

/** Official stored time-in for a new segment. */
export const getOfficialTimeIn = (segmentsAlreadyForDay: number, actualIn: Date): Date => {
  if (isAmSlotFirstSegment(segmentsAlreadyForDay, actualIn)) {
    return getManilaFixedTimeUtc(actualIn, 8, 0);
  }
  return getManilaFixedTimeUtc(actualIn, 13, 0);
};

/** Infer AM vs PM from wall time (before/after noon Manila on that calendar day). */
export const isAmSessionByTimeIn = (timeIn: Date): boolean => {
  const noon = getManilaFixedTimeUtc(timeIn, 12, 0);
  return timeIn.getTime() < noon.getTime();
};

/** Official afternoon session end — always 5:00 PM Manila (OJT standard). */
const getOfficialPmSessionEnd = (dayAnchor: Date): Date => {
  return getManilaFixedTimeUtc(dayAnchor, 17, 0);
};

/**
 * Canonical in/out + duration when closing a segment (or auto-closing at cutoff).
 * Rewrites time-in to 8:00 or 13:00 and time-out to the official end for that session.
 */
export const getOfficialPairOnClose = (
  timeInForClassification: Date,
  actualOutOrCutoff: Date
): { officialIn: Date; officialOut: Date; durationMinutes: number } => {
  const am = isAmSessionByTimeIn(timeInForClassification);
  const officialIn = am
    ? getManilaFixedTimeUtc(timeInForClassification, 8, 0)
    : getManilaFixedTimeUtc(timeInForClassification, 13, 0);
  const officialOut = am
    ? getManilaFixedTimeUtc(actualOutOrCutoff, 12, 0)
    : getOfficialPmSessionEnd(actualOutOrCutoff);
  const durationMinutes = Math.max(
    0,
    Math.floor((officialOut.getTime() - officialIn.getTime()) / 60000)
  );
  return { officialIn, officialOut, durationMinutes };
};
