const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = require("express").Router();
const pool = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "local-dev-secret";
const allowedRoles = new Set(["admin", "operator"]);

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

router.use(requireAdmin);

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, role FROM users ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err?.message || "خطا در دریافت کاربران" });
  }
});

router.post("/", async (req, res) => {
  try {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");
    const role = String(req.body?.role || "operator").trim();

    if (!username || !password) {
      return res.status(400).json({ message: "نام کاربری و رمز عبور الزامی است" });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: "نام کاربری باید حداقل ۳ کاراکتر باشد" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "رمز عبور باید حداقل ۶ کاراکتر باشد" });
    }

    if (!allowedRoles.has(role)) {
      return res.status(400).json({ message: "نقش کاربر نامعتبر است" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password, role)
       VALUES ($1, $2, $3)
       RETURNING id, username, role`,
      [username, passwordHash, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err?.code === "23505") {
      return res.status(409).json({ message: "این نام کاربری قبلا ثبت شده است" });
    }
    return res.status(500).json({ message: err?.message || "خطا در ثبت کاربر" });
  }
});

module.exports = router;
