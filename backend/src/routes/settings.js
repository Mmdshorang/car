const router = require("express").Router();
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { SETTING_KEY, buildDefaultSettings, runDateReminderSmsJob } = require("../jobs/dateReminderSmsJob");
const { getSetting, setSetting } = require("../utils/settings");

const JWT_SECRET = process.env.JWT_SECRET || "local-dev-secret";

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    return res.status(401).json({ message: "ورود به سیستم الزامی است" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "دسترسی فقط برای مدیر مجاز است" });
    }
    req.user = payload;
    return next();
  } catch (_) {
    return res.status(401).json({ message: "توکن نامعتبر است" });
  }
}

function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1" || value === 1) return true;
  if (value === "false" || value === "0" || value === 0) return false;
  return null;
}

function responsePayload(value) {
  const defaults = buildDefaultSettings();
  return {
    key: SETTING_KEY,
    enabled: value.enabled === true,
    daysBefore: Number(value.daysBefore ?? defaults.daysBefore) || defaults.daysBefore,
    template: value.template || defaults.template || "",
    mode: value.mode || defaults.mode || "lookup",
    lastRunAt: value.lastRunAt || null,
    cron: process.env.SMS_DATE_REMINDER_CRON || "0 9 * * *",
    timezone: process.env.SMS_CRON_TZ || "Asia/Tehran",
  };
}

router.use(requireAdmin);

router.get("/date-reminders", async (req, res) => {
  try {
    const defaults = buildDefaultSettings();
    const current = await getSetting(pool, SETTING_KEY, defaults);
    res.json(responsePayload(current));
  } catch (err) {
    res.status(500).json({ message: err?.message || "خطا در دریافت تنظیمات پیامک" });
  }
});

router.put("/date-reminders", async (req, res) => {
  try {
    const defaults = buildDefaultSettings();
    const current = await getSetting(pool, SETTING_KEY, defaults);

    const next = { ...current };
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "enabled")) {
      const enabled = parseBoolean(req.body.enabled);
      if (enabled === null) {
        return res.status(400).json({ message: "enabled باید true یا false باشد" });
      }
      next.enabled = enabled;
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "daysBefore")) {
      const daysBefore = Number(req.body.daysBefore);
      if (!Number.isFinite(daysBefore) || daysBefore < 1 || daysBefore > 365) {
        return res.status(400).json({ message: "daysBefore باید بین 1 تا 365 باشد" });
      }
      next.daysBefore = Math.trunc(daysBefore);
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "template")) {
      next.template = String(req.body.template || "").trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "mode")) {
      const mode = String(req.body.mode || "").trim().toLowerCase();
      if (!["lookup", "sms"].includes(mode)) {
        return res.status(400).json({ message: "mode باید lookup یا sms باشد" });
      }
      next.mode = mode;
    }

    const saved = await setSetting(pool, SETTING_KEY, next);
    res.json(responsePayload(saved));
  } catch (err) {
    res.status(500).json({ message: err?.message || "خطا در ذخیره تنظیمات پیامک" });
  }
});

router.post("/date-reminders/run", async (req, res) => {
  try {
    const result = await runDateReminderSmsJob({ force: true });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err?.message || "خطا در اجرای پیامک" });
  }
});

module.exports = router;
