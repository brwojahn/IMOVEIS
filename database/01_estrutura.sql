-- Estrutura do banco de dados da imobiliaria CasaNova.
-- Execute este arquivo no MySQL antes de executar 02_inserts.sql.

CREATE DATABASE IF NOT EXISTS imobiliaria
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE imobiliaria;

CREATE TABLE IF NOT EXISTS properties (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(120) NOT NULL,
  address VARCHAR(180) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state CHAR(2) NOT NULL,
  postal_code VARCHAR(10) NOT NULL DEFAULT '',
  property_type ENUM('House', 'Apartment', 'Commercial', 'Land') NOT NULL,
  is_for_sale BOOLEAN NOT NULL DEFAULT FALSE,
  sale_price DECIMAL(12, 2) NULL,
  bedrooms TINYINT UNSIGNED NOT NULL DEFAULT 0,
  bathrooms TINYINT UNSIGNED NOT NULL DEFAULT 0,
  area_sqm DECIMAL(9, 2) NULL,
  status ENUM('Active', 'Sold', 'Inactive') NOT NULL DEFAULT 'Active',
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_properties_status (status),
  INDEX idx_properties_for_sale (is_for_sale),
  INDEX idx_properties_city (city),
  CONSTRAINT chk_property_sale_price CHECK (
    (is_for_sale = TRUE AND (sale_price IS NULL OR sale_price >= 0))
    OR (is_for_sale = FALSE AND sale_price IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS renters (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_renters_email (email)
);

CREATE TABLE IF NOT EXISTS rental_contracts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id INT UNSIGNED NOT NULL,
  renter_id INT UNSIGNED NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent DECIMAL(10, 2) NOT NULL,
  status ENUM('Active', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Active',
  notes VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_contract_property_status (property_id, status),
  INDEX idx_contract_renter (renter_id),
  INDEX idx_contract_end_date (end_date),
  CONSTRAINT fk_contracts_property
    FOREIGN KEY (property_id) REFERENCES properties (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_contracts_renter
    FOREIGN KEY (renter_id) REFERENCES renters (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_contract_dates CHECK (end_date > start_date),
  CONSTRAINT chk_monthly_rent CHECK (monthly_rent >= 0)
);

CREATE TABLE IF NOT EXISTS property_tasks (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id INT UNSIGNED NOT NULL,
  title VARCHAR(120) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  priority ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
  due_date DATE NULL,
  status ENUM('Open', 'In Progress', 'Completed') NOT NULL DEFAULT 'Open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_tasks_property_status (property_id, status),
  INDEX idx_tasks_due_date (due_date),
  CONSTRAINT fk_tasks_property
    FOREIGN KEY (property_id) REFERENCES properties (id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

-- Dashboard filter logic:
-- For Sale: properties.is_for_sale = TRUE AND properties.status = 'Active'
-- Renting: an Active rental_contract whose start_date/end_date include CURDATE()
-- Sold: properties.status = 'Sold'
-- Inactive: properties.status = 'Inactive'
-- For Sale and Renting can both match the same property.
