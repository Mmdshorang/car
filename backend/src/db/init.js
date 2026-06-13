const bcrypt = require("bcryptjs");
const { Client } = require("pg");
const pool = require("./index");

const lookupTables = [
  "vehicle_names",
  "car_models",
  "colors",
  "partners",
  "iraqi_drivers",
  "iranian_drivers",
  "entry_borders",
  "clearance_agents",
  "insurance_companies",
  "durations",
  "entry_types",
];

const seedRows = [
  {
    vehicle: "کرایسلر C300",
    model: "2022",
    color: "مشکی",
    partner: "G1",
    iraqiDriver: "یوسف رحمان محسن",
    iranianDriver: "محسن القاسی",
    iraqiPlate: "11E11780",
    iranianPlate: "31گ386-0507",
    entryDate: "1405/02/26",
    renewalDate: "1405/07/23",
    iraqCardChangeDate: "2027/07/25",
    exitBookletChangeDate: "2027/05/14",
    iraqiDriverReferrer: "ابراهیم فاخر",
    entryBorder: "مهران",
    clearanceAgent: "روح الله ملک شاهی",
    insuranceCompany: "",
    guaranteeCheckNumber: "0",
    guaranteeCheckDate: "0",
    iraqContactNumber: "+9647702733459",
    ownerContactNumber: "09122455834",
    ownerAddress: "سعادت آباد",
    duration: "یکساله",
    entryType: "کارنه",
    notesAttachments: "",
  },
  { vehicle: "دوج چلنجر", model: "2022", color: "قرمز", partner: "G1", iraqiDriver: "علی رحمان محسن" },
  { vehicle: "لندکروز", model: "2022", color: "مشکی", partner: "G1", iraqiDriver: "علا محمد ستار" },
  { vehicle: "دوج چارجر", model: "2021", color: "نقره ای", partner: "G1", iraqiDriver: "حیدی احمد حمدی" },
  { vehicle: "فورد موستانگ", model: "2019", color: "سفید", partner: "G1", iraqiDriver: "سجاد نبیل عباس" },
  { vehicle: "دوج چارجر", model: "2020", color: "مشکی", partner: "G1", iraqiDriver: "سجاد جواد عجیل" },
  { vehicle: "بنز جی کلاس G63", model: "2019", color: "سبز تیره", partner: "G1", iraqiDriver: "رسول حمد عبد" },
  { vehicle: "رنجروور اسپورت", model: "2019", color: "سفید", partner: "G1", iraqiDriver: "محمد فاروق مصطفی" },
  { vehicle: "فورد موستانگ", model: "2021", color: "خاکستری", partner: "G1", iraqiDriver: "عاصی عبدالله معروف" },
  { vehicle: "لندکروز 200", model: "2017", color: "سفید", partner: "G1", iraqiDriver: "رائد محمد علی حمودی" },
  { vehicle: "بنز S560", model: "2018", color: "سفید", partner: "G1", iraqiDriver: "سیف کفاح غالب" },
  { vehicle: "رنجروور وگ", model: "2025", color: "مشکی", partner: "G1", iraqiDriver: "سعدون عبید فرحان" },
  { vehicle: "رنجروور وگ", model: "2016", color: "مشکی", partner: "G1", iraqiDriver: "سمیر بختیار یونس" },
  { vehicle: "بنز S500", model: "2021", color: "مشکی", partner: "G1", iraqiDriver: "محمد غضبان شامراد" },
  { vehicle: "لکسوس LX700", model: "2025", color: "مشکی", partner: "G1", iraqiDriver: "حمزه عبدالوهاب عثمان" },
];

async function createBaseSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'operator'
    );

    CREATE TABLE IF NOT EXISTS vehicle_names (id SERIAL PRIMARY KEY, name TEXT);
    CREATE TABLE IF NOT EXISTS car_models (id SERIAL PRIMARY KEY, name TEXT);
    CREATE TABLE IF NOT EXISTS colors (id SERIAL PRIMARY KEY, name TEXT);
    CREATE TABLE IF NOT EXISTS partners (id SERIAL PRIMARY KEY, name TEXT);
    CREATE TABLE IF NOT EXISTS iraqi_drivers (id SERIAL PRIMARY KEY, name TEXT, phone TEXT);
    CREATE TABLE IF NOT EXISTS iranian_drivers (id SERIAL PRIMARY KEY, name TEXT, phone TEXT, address TEXT);
    CREATE TABLE IF NOT EXISTS entry_borders (id SERIAL PRIMARY KEY, name TEXT);
    CREATE TABLE IF NOT EXISTS clearance_agents (id SERIAL PRIMARY KEY, name TEXT);
    CREATE TABLE IF NOT EXISTS insurance_companies (id SERIAL PRIMARY KEY, name TEXT);
    CREATE TABLE IF NOT EXISTS durations (id SERIAL PRIMARY KEY, name TEXT);
    CREATE TABLE IF NOT EXISTS entry_types (id SERIAL PRIMARY KEY, name TEXT);

    CREATE TABLE IF NOT EXISTS cars (id SERIAL PRIMARY KEY);

    ALTER TABLE cars ADD COLUMN IF NOT EXISTS vehicle_name_id INT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS model_id INT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS color_id INT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS partner_id INT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS iraqi_driver_id INT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS iranian_driver_id INT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS iraqi_plate TEXT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS iranian_plate TEXT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS entry_date TEXT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS renewal_date TEXT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS iraq_card_change_date TEXT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS exit_booklet_change_date TEXT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS iraqi_driver_referrer TEXT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS entry_border_id INT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS clearance_agent_id INT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS insurance_company_id INT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS guarantee_check_number TEXT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS guarantee_check_date TEXT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS iraq_contact_number TEXT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS owner_contact_number TEXT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS owner_address TEXT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS duration_id INT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS entry_type_id INT;
    ALTER TABLE cars ADD COLUMN IF NOT EXISTS notes_attachments TEXT;

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reminder_sms_logs (
      id SERIAL PRIMARY KEY,
      car_id INT REFERENCES cars(id) ON DELETE CASCADE,
      reminder_type TEXT NOT NULL,
      target_date TEXT NOT NULL,
      receptor TEXT NOT NULL,
      status TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'kavenegar',
      message TEXT,
      provider_response JSONB,
      error_message TEXT,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_reminder_sms_logs_success
      ON reminder_sms_logs (car_id, reminder_type, target_date)
      WHERE status = 'success';
  `);
}

async function ensureDatabaseExists() {
  const database = process.env.DB_NAME;
  if (!database) return;

  const client = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_MAINTENANCE_DB || "postgres",
  });

  await client.connect();
  try {
    const result = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
    if (!result.rowCount) {
      const safeName = database.replace(/"/g, '""');
      await client.query(`CREATE DATABASE "${safeName}"`);
    }
  } finally {
    await client.end();
  }
}

async function seedAdmin() {
  const existing = await pool.query("SELECT id FROM users LIMIT 1");
  if (existing.rowCount) return;

  const passwordHash = await bcrypt.hash("admin123", 10);
  await pool.query(
    "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
    ["admin", passwordHash, "admin"]
  );
}

async function insertLookup(table, name) {
  const normalized = String(name || "").trim();
  if (!normalized) return null;

  const existing = await pool.query(`SELECT id FROM ${table} WHERE name = $1 LIMIT 1`, [normalized]);
  if (existing.rowCount) return existing.rows[0].id;

  const result = await pool.query(`INSERT INTO ${table} (name) VALUES ($1) RETURNING id`, [normalized]);
  return result.rows[0].id;
}

async function seedLookupsAndCars() {
  for (const table of lookupTables) {
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_${table}_name ON ${table} (name)`);
  }

  for (const row of seedRows) {
    const vehicleNameId = await insertLookup("vehicle_names", row.vehicle);
    const modelId = await insertLookup("car_models", row.model);
    const colorId = await insertLookup("colors", row.color);
    const partnerId = await insertLookup("partners", row.partner);
    const iraqiDriverId = await insertLookup("iraqi_drivers", row.iraqiDriver);
    const iranianDriverId = await insertLookup("iranian_drivers", row.iranianDriver);
    const entryBorderId = await insertLookup("entry_borders", row.entryBorder);
    const clearanceAgentId = await insertLookup("clearance_agents", row.clearanceAgent);
    const insuranceCompanyId = await insertLookup("insurance_companies", row.insuranceCompany);
    const durationId = await insertLookup("durations", row.duration);
    const entryTypeId = await insertLookup("entry_types", row.entryType);

    const existing = await pool.query(
      `SELECT id FROM cars
       WHERE vehicle_name_id = $1
         AND COALESCE(model_id, 0) = COALESCE($2, 0)
         AND COALESCE(iraqi_driver_id, 0) = COALESCE($3, 0)
       LIMIT 1`,
      [vehicleNameId, modelId, iraqiDriverId]
    );
    if (existing.rowCount) continue;

    await pool.query(
      `INSERT INTO cars (
        vehicle_name_id, model_id, color_id, partner_id, iraqi_driver_id, iranian_driver_id,
        iraqi_plate, iranian_plate, entry_date, renewal_date, iraq_card_change_date,
        exit_booklet_change_date, iraqi_driver_referrer, entry_border_id, clearance_agent_id,
        insurance_company_id, guarantee_check_number, guarantee_check_date, iraq_contact_number,
        owner_contact_number, owner_address, duration_id, entry_type_id, notes_attachments
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24
      )`,
      [
        vehicleNameId,
        modelId,
        colorId,
        partnerId,
        iraqiDriverId,
        iranianDriverId,
        row.iraqiPlate || "",
        row.iranianPlate || "",
        row.entryDate || "",
        row.renewalDate || "",
        row.iraqCardChangeDate || "",
        row.exitBookletChangeDate || "",
        row.iraqiDriverReferrer || "",
        entryBorderId,
        clearanceAgentId,
        insuranceCompanyId,
        row.guaranteeCheckNumber || "",
        row.guaranteeCheckDate || "",
        row.iraqContactNumber || "",
        row.ownerContactNumber || "",
        row.ownerAddress || "",
        durationId,
        entryTypeId,
        row.notesAttachments || "",
      ]
    );
  }
}

async function initDb() {
  await ensureDatabaseExists();
  await createBaseSchema();
  await seedAdmin();
  await seedLookupsAndCars();
}

module.exports = { initDb, lookupTables };
