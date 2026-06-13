import { useEffect, useState } from "react";
import { api } from "../api/api";

const roleLabels = {
  admin: "مدیر",
  operator: "اپراتور",
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "operator",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "خطا در دریافت لیست کاربران");
    } finally {
      setLoading(false);
    }
  };

  const submitHandler = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const res = await api.post("/users", form);
      setUsers((current) => [res.data, ...current]);
      setForm({ username: "", password: "", role: "operator" });
      setMessage("کاربر جدید ثبت شد");
    } catch (err) {
      setError(err.response?.data?.message || "خطا در ثبت کاربر");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>مدیریت کاربران</h1>
          <p>تعریف کاربر جدید و مشاهده کاربران سامانه</p>
        </div>
        <button type="button" className="secondary-button" onClick={fetchUsers}>
          بروزرسانی
        </button>
      </div>

      <form className="form-panel" onSubmit={submitHandler}>
        <div className="form-grid">
          <label className="field">
            نام کاربری
            <input
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              autoComplete="username"
              required
            />
          </label>

          <label className="field">
            رمز عبور
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              autoComplete="new-password"
              required
            />
          </label>

          <label className="field">
            نقش
            <select
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
            >
              <option value="operator">اپراتور</option>
              <option value="admin">مدیر</option>
            </select>
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-message">{message}</p>}

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? "در حال ثبت..." : "ثبت کاربر"}
          </button>
        </div>
      </form>

      <section className="list-panel users-list-panel">
        <div className="section-header">
          <h2>کاربران ثبت‌شده</h2>
          <p>{users.length} کاربر</p>
        </div>

        {loading && <p>در حال بارگذاری...</p>}

        {!loading && (
          <div className="table-wrap">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>شناسه</th>
                  <th>نام کاربری</th>
                  <th>نقش</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{roleLabels[user.role] || user.role || "-"}</td>
                  </tr>
                ))}
                {!users.length && (
                  <tr>
                    <td colSpan="3">کاربری ثبت نشده است</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
