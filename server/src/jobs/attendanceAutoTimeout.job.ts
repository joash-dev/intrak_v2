import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { prisma } from '../config/database';
import { getOfficialPairOnClose } from '../utils/attendanceOfficialTime.util';

let tasks: ScheduledTask[] = [];

/**
 * Auto-close morning session at 12:00 PM (Asia/Manila).
 * Auto-close afternoon session at 6:00 PM (Asia/Manila).
 * Stored times are normalized to official slots (8–12 and 1–5/6).
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
          openMorningLogs.map((log) => {
            const pair = getOfficialPairOnClose(log.timeIn!, noon);
            return prisma.attendanceLog.update({
              where: { id: log.id },
              data: {
                timeIn: pair.officialIn,
                timeOut: pair.officialOut,
                durationMinutes: pair.durationMinutes,
              },
            });
          }),
        );
      },
      { timezone: 'Asia/Manila' },
    ),
  );

  // Session 2 auto time-out at official 5:00 PM (OJT standard)
  tasks.push(
    cron.schedule(
      '0 17 * * *',
      async () => {
        const manilaToday = getManilaYyyyMmDd();
        const noon = new Date(`${manilaToday}T12:00:00.000+08:00`);
        const fivePm = new Date(`${manilaToday}T17:00:00.000+08:00`);

        const openAfternoonLogs = await prisma.attendanceLog.findMany({
          where: {
            timeOut: null,
            timeIn: {
              not: null,
              gte: noon,
            },
          },
          select: { id: true, timeIn: true },
        });

        if (openAfternoonLogs.length === 0) return;

        await Promise.all(
          openAfternoonLogs.map((log) => {
            const pair = getOfficialPairOnClose(log.timeIn!, fivePm);
            return prisma.attendanceLog.update({
              where: { id: log.id },
              data: {
                timeIn: pair.officialIn,
                timeOut: pair.officialOut,
                durationMinutes: pair.durationMinutes,
              },
            });
          }),
        );
      },
      { timezone: 'Asia/Manila' },
    ),
  );

  console.log('[Attendance Auto Timeout] Jobs started (12:00 and 17:00 Asia/Manila)');
};

export const stopAttendanceAutoTimeoutJob = (): void => {
  if (tasks.length > 0) {
    tasks.forEach((t) => t.stop());
    tasks = [];
    console.log('[Attendance Auto Timeout] Jobs stopped');
  }
};
