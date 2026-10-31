CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'provider') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS slots (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_id INT UNSIGNED NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_slots_provider FOREIGN KEY (provider_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT chk_slots_time CHECK (end_time > start_time),
  UNIQUE KEY uq_slots_provider_start (provider_id, start_time),
  INDEX idx_slots_start_time (start_time)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  slot_id INT UNSIGNED NOT NULL,
  status ENUM('confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
  active_slot_id INT UNSIGNED GENERATED ALWAYS AS (IF(status = 'confirmed', slot_id, NULL)) STORED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_bookings_slot FOREIGN KEY (slot_id) REFERENCES slots (id),
  UNIQUE KEY uq_bookings_active_slot (active_slot_id),
  INDEX idx_bookings_user (user_id)
) ENGINE=InnoDB;