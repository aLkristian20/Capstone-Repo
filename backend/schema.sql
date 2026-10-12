CREATE DATABASE IF NOT EXISTS barangay_security CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE barangay_security;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','official') NOT NULL DEFAULT 'official',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS households (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  address VARCHAR(255) NOT NULL,
  contact VARCHAR(40) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  household_id INT UNSIGNED NULL,
  device_id VARCHAR(100) NULL,
  event_type VARCHAR(120) NOT NULL DEFAULT 'Possible Intrusion Detected',
  description TEXT NULL,
  status ENUM('Pending','Under Review','Responding','Resolved') NOT NULL DEFAULT 'Pending',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  source ENUM('device','manual') NOT NULL DEFAULT 'device',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alert_household FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE SET NULL,
  INDEX idx_alerts_created_at (created_at),
  INDEX idx_alerts_status (status)
);

CREATE TABLE IF NOT EXISTS incident_updates (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  alert_id BIGINT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NULL,
  status ENUM('Pending','Under Review','Responding','Resolved') NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_update_alert FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
  CONSTRAINT fk_update_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_updates_alert_created (alert_id, created_at)
);
