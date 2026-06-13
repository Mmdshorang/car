const router = require("express").Router();
const pool = require("../db");
const { lookupTables } = require("../db/init");

function getSafeTable(req, res) {
  const table = req.params.table;
  if (!lookupTables.includes(table)) {
    res.status(404).json({ message: "لیست انتخابی پیدا نشد" });
    return null;
  }
  return table;
}

// generic getter
router.get("/:table", async (req, res) => {
  const table = getSafeTable(req, res);
  if (!table) return;

  const result = await pool.query(`SELECT * FROM ${table} ORDER BY name`);
  res.json(result.rows);
});

// add item
router.post("/:table", async (req, res) => {
  const table = getSafeTable(req, res);
  if (!table) return;

  const { name } = req.body;
  const normalized = String(name || "").trim();

  if (!normalized) {
    return res.status(400).json({ message: "نام الزامی است" });
  }

  const existing = await pool.query(`SELECT * FROM ${table} WHERE name = $1 LIMIT 1`, [normalized]);
  if (existing.rowCount) {
    return res.json(existing.rows[0]);
  }

  const result = await pool.query(
    `INSERT INTO ${table} (name) VALUES ($1) RETURNING *`,
    [normalized]
  );

  res.json(result.rows[0]);
});

module.exports = router;
