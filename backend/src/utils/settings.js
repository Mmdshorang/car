async function getSetting(pool, key, defaults = {}) {
  const result = await pool.query("SELECT value FROM app_settings WHERE key = $1 LIMIT 1", [key]);
  if (!result.rowCount) return defaults;
  return { ...defaults, ...(result.rows[0].value || {}) };
}

async function setSetting(pool, key, value) {
  const result = await pool.query(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (key)
     DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
     RETURNING value`,
    [key, JSON.stringify(value || {})]
  );
  return result.rows[0].value;
}

module.exports = {
  getSetting,
  setSetting,
};
