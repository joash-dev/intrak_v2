import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { prisma } from '../config/database';

let tasks: ScheduledTask[] = [];

const floorTo30MinuteBlock = (value: Date): Date => {
  const d = new Date(value);
  const mins = d.getMinutes();
  d.setSeconds(0, 0);
  d.setMinutes(mins < 30 ? 0 : 30);
  return d;
};

const computeOfficialDurationMinutes = (timeIn: Date, timeOut: Date): number => {
  const roundedIn = floorTo30MinuteBlock(timeIn);
  const roundedOut = floorTo30MinuteBlock(timeOut);
  const diff = roundedOut.getTime() - roundedIn.getTime();
  return Math.max(0, Math.floor(diff / 60000));
};

/**
 * Auto-close morning session at exactly 12:00 PM (Asia/Manila).
 * If a student timed-in in the morning and forgot to time-out, we force timeOut = 12:00 PM.
 */
export const startAttendanceAutoTimeoutJob = (): void => {
  if (tasks.length > 0) return;

  const getManilaYyyyMmDd = () =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date()); // YYYY-MM-DD

  // Session 1 auto time-out at 12:00 PM
  tasks.push(
    cron.schedule(
      '0 12 * * *',
      async () => {
        const manilaToday = getManilaYyyyMmDd();
        const start = new Date(`${manilaToday}T00:00:00.000+08:00`);
        const noon = new Date(`${manilaToday}T12:00:00.000+08:00`);

        const openMorningLogs = await prisma.attendanceLog.findMany({
          where: {
            timeOut: null,
            timeIn: {
              not: null,
              gte: start,
              lt: noon,
            },
          },
          select: { id: true, timeIn: true },
        });

        if (openMorningLogs.length === 0) return;

        await Promise.all(
          openMorningLogs.map((log) =>
            prisma.attendanceLog.update({
              where: { id: log.id },
              data: {
                timeOut: noon,
                durationMinutes: computeOfficialDurationMinutes(log.timeIn!, noon),
              },
            }),
          ),
        );
      },
      { timezone: 'Asia/Manila' },
    ),
  );

  // Session 2 auto time-out at 6:00 PM
  tasks.push(
    cron.schedule(
      '0 18 * * *',
      async () => {
        const manilaToday = getManilaYyyyMmDd();
        const noon = new Date(`${manilaToday}T12:00:00.000+08:00`);
        const sixPm = new Date(`${manilaToday}T18:00:00.000+08:00`);

        const openAfternoonLogs = await prisma.attendanceLog.findMany({
          where: {
            timeOut: null,
            timeIn: {
              not: null,
              gte: noon,
              lt: sixPm,
            },
          },
          select: { id: true, timeIn: true },
        });

        if (openAfternoonLogs.length === 0) return;

        await Promise.all(
          openAfternoonLogs.map((log) =>
            prisma.attendanceLog.update({
              where: { id: log.id },
              data: {
                timeOut: sixPm,
                durationMinutes: computeOfficialDurationMinutes(log.timeIn!, sixPm),
              },
            }),
          ),
        );
      },
      { timezone: 'Asia/Manila' },
    ),
  );

  console.log('[Attendance Auto Timeout] Jobs started (12:00 and 18:00 Asia/Manila)');
};

export const stopAttendanceAutoTimeoutJob = (): void => {
  if (tasks.length > 0) {
    tasks.forEach((t) => t.stop());
    tasks = [];
    console.log('[Attendance Auto Timeout] Jobs stopped');
  }
};

