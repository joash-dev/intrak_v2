import { prisma } from "../config/database";

const ceilTo30MinuteBlock = (value: Date): Date => {
  const d = new Date(value);
  const mins = d.getMinutes();
  d.setSeconds(0, 0);
  if (mins === 0 || mins === 30) return d;
  if (mins < 30) {
    d.setMinutes(30);
  } else {
    d.setHours(d.getHours() + 1, 0, 0, 0);
  }
  return d;
};

const floorTo30MinuteBlock = (value: Date): Date => {
  const d = new Date(value);
  const mins = d.getMinutes();
  d.setSeconds(0, 0);
  d.setMinutes(mins < 30 ? 0 : 30);
  return d;
};

const computeOfficialDurationMinutes = (timeIn: Date, timeOut: Date): number => {
  const roundedIn = ceilTo30MinuteBlock(timeIn);
  const roundedOut = floorTo30MinuteBlock(timeOut);
  const diff = roundedOut.getTime() - roundedIn.getTime();
  return Math.max(0, Math.floor(diff / 60000));
};

const getManilaYyyyMmDd = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date); // YYYY-MM-DD

const getManilaFixedTimeUtc = (date: Date, hours24: number, minutes: number) => {
  const yyyyMmDd = getManilaYyyyMmDd(date);
  const hh = String(hours24).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return new Date(`${yyyyMmDd}T${hh}:${mm}:00.000+08:00`);
};

/**
 * Recompute stored durationMinutes using:
 * - floor-to-30-minute blocks
 * - session cutoffs (12:00 PM for session 1, 6:00 PM for session 2) in Asia/Manila
 *
 * It will also normalize timeOut when:
 * - timeOut is null -> set to the cutoff for that session
 * - timeOut exceeds the session cutoff -> set to cutoff (prevents huge cross-day durations)
 */
async function main() {
  const BATCH_SIZE = 500;
  let updated = 0;
  let skipped = 0;

  // Only logs with a timeIn can be repaired.
  let cursor: string | undefined;

  for (;;) {
    const rows = await prisma.attendanceLog.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      where: { timeIn: { not: null } },
      orderBy: { id: "asc" },
      select: {
        id: true,
        timeIn: true,
        timeOut: true,
        durationMinutes: true,
      },
    });

    if (rows.length === 0) break;
    cursor = rows[rows.length - 1].id;

    for (const row of rows) {
      const timeIn = row.timeIn!;
      const noon = getManilaFixedTimeUtc(timeIn, 12, 0);
      const sixPm = getManilaFixedTimeUtc(timeIn, 18, 0);
      const cutoff = timeIn.getTime() < noon.getTime() ? noon : sixPm;

      let effectiveOut = row.timeOut ?? cutoff;
      if (effectiveOut.getTime() > cutoff.getTime()) {
        effectiveOut = cutoff;
      }
      if (effectiveOut.getTime() < timeIn.getTime()) {
        // Bad data edge-case; keep duration at 0 and don't move timeOut backwards.
        effectiveOut = timeIn;
      }

      const computed = computeOfficialDurationMinutes(timeIn, effectiveOut);
      const shouldUpdate =
        computed !== (row.durationMinutes ?? 0) ||
        row.timeOut === null ||
        (row.timeOut && row.timeOut.getTime() !== effectiveOut.getTime());

      if (!shouldUpdate) {
        skipped += 1;
        continue;
      }

      await prisma.attendanceLog.update({
        where: { id: row.id },
        data: {
          timeOut: effectiveOut,
          durationMinutes: computed,
        },
      });
      updated += 1;
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `[recomputeAttendanceDurations] Done. Updated ${updated} log(s), skipped ${skipped} log(s).`,
  );
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[recomputeAttendanceDurations] Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

