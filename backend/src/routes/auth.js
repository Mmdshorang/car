const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = require("express").Router();
const pool = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "local-dev-secret";

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "نام کاربری و رمز عبور الزامی است" });
  }

  const result = await pool.query("SELECT * FROM users WHERE username = $1 LIMIT 1", [username]);
  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({ message: "نام کاربری یا رمز عبور اشتباه است" });
  }

  const hashedPassword = String(user.password || "");
  const validPassword = hashedPassword.startsWith("$2")
    ? await bcrypt.compare(password, hashedPassword)
    : password === hashedPassword;

  if (!validPassword) {
    return res.status(401).json({ message: "نام کاربری یا رمز عبور اشتباه است" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  });
});

module.exports = router;
