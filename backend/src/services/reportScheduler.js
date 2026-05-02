const config = require('../config/config');
const notificationService = require('./notificationService');

const DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000;

let timeoutId = null;
let intervalId = null;
let jobRunning = false;

const parseDailyReportTime = (value) => {
  const match = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(String(value || ''));
  if (!match) {
    return { hour: 9, minute: 0 };
  }

  const hour = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2])));
  return { hour, minute };
};

const getNextDelayMs = () => {
  const { hour, minute } = parseDailyReportTime(config.DAILY_REPORT_TIME);
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setHours(hour, minute, 0, 0);

  if (nextRun.getTime() <= now.getTime()) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  return nextRun.getTime() - now.getTime();
};

const runDailyReportJob = async () => {
  if (jobRunning) {
    return;
  }

  jobRunning = true;
  try {
    await notificationService.sendDailyReport();
    console.info('[reports] daily report job completed');
  } catch (err) {
    console.error('[reports] daily report job failed:', err?.message || err);
  } finally {
    jobRunning = false;
  }
};

const startDailyReportScheduler = () => {
  if (process.env.NODE_ENV === 'test' || timeoutId || intervalId) {
    return;
  }

  const initialDelay = getNextDelayMs();
  timeoutId = setTimeout(() => {
    timeoutId = null;
    void runDailyReportJob();
    intervalId = setInterval(() => {
      void runDailyReportJob();
    }, DAILY_INTERVAL_MS);
  }, initialDelay);
};

module.exports = {
  startDailyReportScheduler,
  runDailyReportJob,
};