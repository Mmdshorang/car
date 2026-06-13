const cron = require("node-cron");
const { runDateReminderSmsJob } = require("./dateReminderSmsJob");

function scheduleJobs() {
  const expression = process.env.SMS_DATE_REMINDER_CRON || "0 9 * * *";
  const timezone = process.env.SMS_CRON_TZ || "Asia/Tehran";

  if (!cron.validate(expression)) {
    console.warn(`Invalid SMS_DATE_REMINDER_CRON: ${expression}`);
    return;
  }

  cron.schedule(
    expression,
    async () => {
      try {
        const result = await runDateReminderSmsJob();
        console.log("date reminder sms job:", result);
      } catch (err) {
        console.error("date reminder sms job failed:", err);
      }
    },
    { timezone }
  );

  console.log(`Date reminder SMS cron scheduled (${expression}, tz=${timezone})`);
}

module.exports = {
  scheduleJobs,
};
