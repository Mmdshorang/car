import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, complete: 0, incomplete: 0 });
  const [cars, setCars] = useState([]);
  const [reminderSettings, setReminderSettings] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [runResult, setRunResult] = useState("");
  const [error, setError] = useState("");
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (_) {
      return null;
    }
  });
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    loadDashboard();
    if (isAdmin) {
      loadReminderSettings();
    }
  }, [isAdmin]);

  const loadDashboard = async () => {
    setError("");
    try {
      const [statsRes, carsRes] = await Promise.all([api.get("/cars/stats"), api.get("/cars")]);
      setStats(statsRes.data);
      setCars(carsRes.data.slice(0, 5));
    } catch (err) {
      setError(err.response?.data?.message || "خطا در دریافت اطلاعات داشبورد");
    }
  };

  const loadReminderSettings = async () => {
    try {
      const res = await api.get("/settings/date-reminders");
      setReminderSettings(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "خطا در دریافت تنظیمات پیامک");
    }
  };

  const saveReminderSettings = async (patch) => {
    if (!reminderSettings) return;
    setSettingsSaving(true);
    setRunResult("");
    try {
      const res = await api.put("/settings/date-reminders", {
        enabled: reminderSettings.enabled,
        daysBefore: reminderSettings.daysBefore,
        template: reminderSettings.template,
        mode: reminderSettings.mode,
        ...patch,
      });
      setReminderSettings(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "خطا در ذخیره تنظیمات پیامک");
    } finally {
      setSettingsSaving(false);
    }
  };

  const runReminderJob = async () => {
    setSettingsSaving(true);
    setRunResult("");
    try {
      const res = await api.post("/settings/date-reminders/run");
      const totals = res.data?.totals || {};
      setRunResult(
        `یافت‌شده: ${totals.found || 0}، ارسال موفق: ${totals.sent || 0}، ناموفق: ${totals.failed || 0}`
      );
      await loadReminderSettings();
    } catch (err) {
      setError(err.response?.data?.message || "خطا در اجرای دستی پیامک");
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>داشبورد</h1>
          <p>مدیریت ورود و اطلاعات خودروها</p>
        </div>
        <Link className="primary-link" to="/cars/add">
          افزودن خودرو
        </Link>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="stats-grid">
        <div className="stat-card">
          <span>کل خودروها</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span>پرونده‌های کامل</span>
          <strong>{stats.complete}</strong>
        </div>
        <div className="stat-card">
          <span>نیازمند تکمیل</span>
          <strong>{stats.incomplete}</strong>
        </div>
      </div>

      {isAdmin && reminderSettings && (
        <section className="list-panel">
          <div className="section-header">
            <div>
              <h2>پیامک یادآوری تاریخ‌ها</h2>
              <p>برای تاریخ تمدید، تعویض کارت عراق و تعویض دفترچه خروج</p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={runReminderJob}
              disabled={settingsSaving}
            >
              اجرای دستی
            </button>
          </div>

          <div className="settings-grid">
            <div className="settings-card">
              <label>
                وضعیت
                <button
                  type="button"
                  onClick={() => saveReminderSettings({ enabled: !reminderSettings.enabled })}
                  disabled={settingsSaving}
                >
                  {reminderSettings.enabled ? "فعال است - غیرفعال کن" : "غیرفعال است - فعال کن"}
                </button>
              </label>
            </div>

            <div className="settings-card">
              <label>
                چند روز مانده
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={reminderSettings.daysBefore || 5}
                  onChange={(event) =>
                    setReminderSettings((current) => ({
                      ...current,
                      daysBefore: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <button
                type="button"
                className="secondary-button"
                onClick={() => saveReminderSettings({ daysBefore: reminderSettings.daysBefore })}
                disabled={settingsSaving}
              >
                ذخیره روز
              </button>
            </div>

            <div className="settings-card">
              <label>
                روش ارسال
                <select
                  value={reminderSettings.mode || "lookup"}
                  onChange={(event) =>
                    setReminderSettings((current) => ({ ...current, mode: event.target.value }))
                  }
                >
                  <option value="lookup">Template / Lookup</option>
                  <option value="sms">SMS ساده</option>
                </select>
              </label>
              <button
                type="button"
                className="secondary-button"
                onClick={() => saveReminderSettings({ mode: reminderSettings.mode })}
                disabled={settingsSaving}
              >
                ذخیره روش
              </button>
            </div>

            <div className="settings-card">
              <label>
                Template کاوه‌نگار
                <input
                  value={reminderSettings.template || ""}
                  onChange={(event) =>
                    setReminderSettings((current) => ({ ...current, template: event.target.value }))
                  }
                  placeholder="مثلا date_reminder"
                />
              </label>
              <button
                type="button"
                className="secondary-button"
                onClick={() => saveReminderSettings({ template: reminderSettings.template })}
                disabled={settingsSaving}
              >
                ذخیره template
              </button>
            </div>
          </div>

          <p className="settings-meta">
            آخرین اجرا: {reminderSettings.lastRunAt || "-"} | کرون: {reminderSettings.cron} | تایم‌زون:{" "}
            {reminderSettings.timezone}
          </p>
          {runResult && <p className="form-message">{runResult}</p>}
        </section>
      )}

      <section className="list-panel">
        <div className="section-header">
          <h2>آخرین خودروها</h2>
          <Link to="/cars">مشاهده همه</Link>
        </div>
        <div className="table-wrap">
          <table className="data-table compact">
            <thead>
              <tr>
                <th>نام خودرو</th>
                <th>مدل</th>
                <th>رنگ</th>
                <th>همکار</th>
                <th>راننده عراقی</th>
                <th>راننده ایرانی</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => (
                <tr key={car.id}>
                  <td>{car.vehicle_name || "-"}</td>
                  <td>{car.model || "-"}</td>
                  <td>{car.color || "-"}</td>
                  <td>{car.partner || "-"}</td>
                  <td>{car.iraqi_driver_name || "-"}</td>
                  <td>{car.iranian_driver_name || "-"}</td>
                </tr>
              ))}
              {!cars.length && (
                <tr>
                  <td colSpan="6">هنوز خودرویی ثبت نشده است</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
