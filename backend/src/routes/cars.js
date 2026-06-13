const router = require("express").Router();
const pool = require("../db");

const carSelect = `
  SELECT
    c.id,
    c.vehicle_name_id,
    vn.name AS vehicle_name,
    c.model_id,
    cm.name AS model,
    c.color_id,
    co.name AS color,
    c.partner_id,
    p.name AS partner,
    c.iraqi_driver_id,
    idr.name AS iraqi_driver_name,
    c.iranian_driver_id,
    ir.name AS iranian_driver_name,
    c.iraqi_plate,
    c.iranian_plate,
    c.entry_date,
    c.renewal_date,
    c.iraq_card_change_date,
    c.exit_booklet_change_date,
    c.iraqi_driver_referrer,
    c.entry_border_id,
    eb.name AS entry_border_name,
    c.clearance_agent_id,
    ca.name AS clearance_agent_name,
    c.insurance_company_id,
    ic.name AS insurance_company,
    c.guarantee_check_number,
    c.guarantee_check_date,
    c.iraq_contact_number,
    c.owner_contact_number,
    c.owner_address,
    c.duration_id,
    d.name AS duration,
    c.entry_type_id,
    et.name AS entry_type,
    c.notes_attachments
  FROM cars c
  LEFT JOIN vehicle_names vn ON vn.id = c.vehicle_name_id
  LEFT JOIN car_models cm ON cm.id = c.model_id
  LEFT JOIN colors co ON co.id = c.color_id
  LEFT JOIN partners p ON p.id = c.partner_id
  LEFT JOIN iraqi_drivers idr ON idr.id = c.iraqi_driver_id
  LEFT JOIN iranian_drivers ir ON ir.id = c.iranian_driver_id
  LEFT JOIN entry_borders eb ON eb.id = c.entry_border_id
  LEFT JOIN clearance_agents ca ON ca.id = c.clearance_agent_id
  LEFT JOIN insurance_companies ic ON ic.id = c.insurance_company_id
  LEFT JOIN durations d ON d.id = c.duration_id
  LEFT JOIN entry_types et ON et.id = c.entry_type_id
`;

function nullable(value) {
  return value === "" || value === undefined ? null : value;
}

router.get("/stats", async (req, res) => {
  const total = await pool.query("SELECT COUNT(*)::int AS count FROM cars");
  const complete = await pool.query(`
    SELECT COUNT(*)::int AS count
    FROM cars
    WHERE vehicle_name_id IS NOT NULL
      AND model_id IS NOT NULL
      AND color_id IS NOT NULL
      AND iraqi_driver_id IS NOT NULL
  `);

  res.json({
    total: total.rows[0].count,
    complete: complete.rows[0].count,
    incomplete: total.rows[0].count - complete.rows[0].count,
  });
});

router.get("/", async (req, res) => {
  const result = await pool.query(`${carSelect} ORDER BY c.id DESC`);
  res.json(result.rows);
});

router.post("/", async (req, res) => {
  const fields = [
    "vehicle_name_id",
    "model_id",
    "color_id",
    "partner_id",
    "iraqi_driver_id",
    "iranian_driver_id",
    "iraqi_plate",
    "iranian_plate",
    "entry_date",
    "renewal_date",
    "iraq_card_change_date",
    "exit_booklet_change_date",
    "iraqi_driver_referrer",
    "entry_border_id",
    "clearance_agent_id",
    "insurance_company_id",
    "guarantee_check_number",
    "guarantee_check_date",
    "iraq_contact_number",
    "owner_contact_number",
    "owner_address",
    "duration_id",
    "entry_type_id",
    "notes_attachments",
  ];

  const values = fields.map((field) => nullable(req.body[field]));
  const placeholders = fields.map((_, index) => `$${index + 1}`).join(",");

  const result = await pool.query(
    `INSERT INTO cars (${fields.join(",")}) VALUES (${placeholders}) RETURNING id`,
    values
  );

  const car = await pool.query(`${carSelect} WHERE c.id = $1`, [result.rows[0].id]);
  res.json(car.rows[0]);
});

module.exports = router;
