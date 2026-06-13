import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitHandler = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      onLogin(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "خطا در ورود");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page" dir="rtl">
      <form className="login-card" onSubmit={submitHandler}>
        <h1>ورود به سامانه</h1>

        <label>
          نام کاربری
          <input
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
            autoComplete="username"
            required
          />
        </label>

        <label>
          رمز عبور
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "در حال ورود..." : "ورود"}
        </button>
      </form>
    </main>
  );
}
