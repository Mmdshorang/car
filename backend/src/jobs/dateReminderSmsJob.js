const pool = require("../db");
const { diffDays, parseGregorianDate, todayYmd } = require("../utils/dateOnly");
const { sendKavenegarLookup, sendKavenegarSms } = require("../utils/kavenegar");
const { normalizePhone } = require("../utils/phone");
const { getSetting, setSetting } = require("../utils/settings");

const SETTING_KEY = "date_reminder_sms";

const reminderFields = [
  { field: "renewal_date", type: "renewal", label: "تاریخ تمدید" },
  { field: "iraq_card_change_date", type: "iraq_card_change", label: "تعویض کارت عراق" },
  { field: "exit_booklet_change_date", type: "exit_booklet_change", label: "تعویض دفترچه خروج" },
];

function clampDays(value, fallback = 5) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), 1), 365);
}

function buildDefaultSettings() {
  const enabled = ["true", "1", "yes"].includes(
    String(process.env.SMS_DATE_REMINDER_ENABLED_DEFAULT || "false").toLowerCase()
  );
  return {
    enabled,
    daysBefore: clampDays(process.env.SMS_DATE_REMINDER_DAYS_BEFORE || 5),
    template: process.env.KAVENEGAR_DATE_REMINDER_TEMPLATE || process.env.KAVENEGAR_TEMPLATE || "",
    mode: process.env.KAVENEGAR_DATE_REMINDER_MODE || "lookup",
    lastRunAt: null,
  };
}

function buildMessage({ car, reminder, targetDate, daysRemaining }) {
  const vehicle = car.vehicle_name || "خودرو";
  const plate = car.iranian_plate || car.iraqi_plate || "";
  const suffix = plate ? ` با پلاک ${plate}` : "";
  const remainingText = daysRemaining === 0 ? "امروز" : `${daysRemaining} روز دیگر`;

  return `${reminder.label} ${vehicle}${suffix} در تاریخ ${targetDate} (${remainingText}) است.`;
}

async function hasSuccessfulLog(carId, reminderType, targetDate) {
  const result = await pool.query(
    `SELECT id FROM reminder_sms_logs
     WHERE car_id = $1 AND reminder_type = $2 AND target_date = $3 AND status = 'success'
     LIMIT 1`,
    [carId, reminderType, targetDate]
  );
  return result.rowCount > 0;
}

async function insertLog({ carId, reminderType, targetDate, receptor, status, message, response, error }) {
  await pool.query(
    `INSERT INTO reminder_sms_logs (
       car_id, reminder_type, target_date, receptor, status, provider, message,
       provider_response, error_message
     ) VALUES ($1,$2,$3,$4,$5,'kavenegar',$6,$7::jsonb,$8)`,
    [
      carId,
      reminderType,
      targetDate,
      receptor,
      status,
      message,
      response ? JSON.stringify(response) : null,
      error || null,
    ]
  );
}

async function sendReminder({ settings, car, reminder, targetDate, daysRemaining, receptor, message }) {
  if (settings.mode === "sms") {
    return sendKavenegarSms({ receptor, message });
  }

  if (!settings.template) {
    return sendKavenegarSms({ receptor, message });
  }

  const vehicleToken = String(car.vehicle_name || car.iranian_plate || car.iraqi_plate || "خودرو").slice(0, 100);
  return sendKavenegarLookup({
    receptor,
    template: settings.template,
    token: vehicleToken,
    token2: reminder.label,
    token3: targetDate,
  });
}

async function collectDueReminders(settings) {
  const today = todayYmd(process.env.SMS_CRON_TZ || "Asia/Tehran");
  const result = await pool.query(`
    SELECT
      c.id,
      c.iraqi_plate,
      c.iranian_plate,
      c.renewal_date,
      c.iraq_card_change_date,
      c.exit_booklet_change_date,
      c.iraq_contact_number,
      c.owner_contact_number,
      vn.name AS vehicle_name
    FROM cars c
    LEFT JOIN vehicle_names vn ON vn.id = c.vehicle_name_id
    ORDER BY c.id DESC
  `);

  const due = [];
  for (const car of result.rows) {
    for (const reminder of reminderFields) {
      const parsed = parseGregorianDate(car[reminder.field]);
      if (!parsed) continue;

      const daysRemaining = diffDays(today, parsed.ymd);
      if (daysRemaining === null || daysRemaining < 0 || daysRemaining > settings.daysBefore) continue;

      due.push({
        car,
        reminder,
        targetDate: parsed.ymd,
        daysRemaining,
      });
    }
  }

  return { today, due };
}

async function runDateReminderSmsJob({ force = false } = {}) {
  const defaults = buildDefaultSettings();
  const settings = await getSetting(pool, SETTING_KEY, defaults);
  settings.daysBefore = clampDays(settings.daysBefore, defaults.daysBefore);
  settings.mode = String(settings.mode || defaults.mode || "lookup").toLowerCase();

  if (!force && settings.enabled !== true) {
    return { ok: true, skipped: true, reason: "disabled" };
  }

  const { today, due } = await collectDueReminders(settings);
  const totals = {
    found: due.length,
    sent: 0,
    failed: 0,
    skippedNoPhone: 0,
    skippedDuplicate: 0,
  };

  for (const item of due) {
    const receptor = normalizePhone(item.car.owner_contact_number || item.car.iraq_contact_number);
    if (!receptor) {
      totals.skippedNoPhone += 1;
      continue;
    }

    const duplicate = await hasSuccessfulLog(item.car.id, item.reminder.type, item.targetDate);
    if (duplicate) {
      totals.skippedDuplicate += 1;
      continue;
    }

    const message = buildMessage(item);
    try {
      const response = await sendReminder({ ...item, settings, receptor, message });
      await insertLog({
        carId: item.car.id,
        reminderType: item.reminder.type,
        targetDate: item.targetDate,
        receptor,
        status: "success",
        message,
        response,
      });
      totals.sent += 1;
    } catch (err) {
      await insertLog({
        carId: item.car.id,
        reminderType: item.reminder.type,
        targetDate: item.targetDate,
        receptor,
        status: "failed",
        message,
        error: err?.message || String(err),
      });
      totals.failed += 1;
    }
  }

  const updated = {
    ...settings,
    lastRunAt: new Date().toISOString(),
  };
  await setSetting(pool, SETTING_KEY, updated);

  return {
    ok: true,
    skipped: false,
    today,
    daysBefore: settings.daysBefore,
    totals,
  };
}

module.exports = {
  SETTING_KEY,
  buildDefaultSettings,
  runDateReminderSmsJob,
};
