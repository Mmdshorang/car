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

CREATE TABLE IF NOT EXISTS cars (
  id SERIAL PRIMARY KEY,
  vehicle_name_id INT,
  model_id INT,
  color_id INT,
  partner_id INT,
  iraqi_driver_id INT,
  iranian_driver_id INT,
  iraqi_plate TEXT,
  iranian_plate TEXT,
  entry_date TEXT,
  renewal_date TEXT,
  iraq_card_change_date TEXT,
  exit_booklet_change_date TEXT,
  iraqi_driver_referrer TEXT,
  entry_border_id INT,
  clearance_agent_id INT,
  insurance_company_id INT,
  guarantee_check_number TEXT,
  guarantee_check_date TEXT,
  iraq_contact_number TEXT,
  owner_contact_number TEXT,
  owner_address TEXT,
  duration_id INT,
  entry_type_id INT,
  notes_attachments TEXT
);
