import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import "./App.css";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Cars from "./pages/Cars";
import AddCar from "./pages/AddCar";
import Users from "./pages/Users";

function ProtectedRoute({ token, children }) {
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ token, isAdmin, children }) {
  if (!token) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  let currentUser = null;

  try {
    currentUser = JSON.parse(localStorage.getItem("user") || "null");
  } catch (_) {
    currentUser = null;
  }

  const isAdmin = currentUser?.role === "admin";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
  };

  useEffect(() => {
    const handleInvalidAuth = () => setToken(null);

    window.addEventListener("auth:invalid", handleInvalidAuth);
    return () => window.removeEventListener("auth:invalid", handleInvalidAuth);
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container" dir="rtl">
        {token && (
          <nav className="navbar">
            <Link to="/dashboard">داشبورد</Link>
            <Link to="/cars/add">افزودن خودرو</Link>
            <Link to="/cars">لیست خودروها</Link>
            {isAdmin && <Link to="/users">مدیریت کاربران</Link>}
            <button type="button" onClick={logout}>
              خروج
            </button>
          </nav>
        )}

        <Routes>
          <Route
            path="/"
            element={token ? <Navigate to="/dashboard" replace /> : <Login onLogin={setToken} />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute token={token}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cars/add"
            element={
              <ProtectedRoute token={token}>
                <AddCar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cars"
            element={
              <ProtectedRoute token={token}>
                <Cars />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <AdminRoute token={token} isAdmin={isAdmin}>
                <Users />
              </AdminRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
