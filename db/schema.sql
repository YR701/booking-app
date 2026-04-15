/* Author: Yongrong Yang */

CREATE DATABASE IF NOT EXISTS booking_app;
USE booking_app;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    passwordhash VARCHAR(255) NOT NULL,
    role ENUM('student', 'owner') NOT NULL
);

# One time appointment
CREATE TABLE IF NOT EXISTS slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    location VARCHAR(500) NOT NULL DEFAULT '',
    notes TEXT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 0,
    booked_by_user_id INT NULL,
    CONSTRAINT fk_slots_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_slots_booked_by FOREIGN KEY (booked_by_user_id) REFERENCES users (id) ON DELETE SET NULL
);


-- Type1 Request a Meeting
CREATE TABLE IF NOT EXISTS request (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,
    owner_id INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    reason TEXT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_request_requester FOREIGN KEY (requester_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_request_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
    
);

-- Type2 Group Meeting
-- CREATE TABLE IF NOT EXISTS group (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     owner_id INT NOT NULL,
--     title VARCHAR(500) NOT NULL,
--     start_time DATETIME NOT NULL,
--     end_time DATETIME NOT NULL,
--     notes TEXT NULL,
--     invitees TEXT NULL, -- Store invitee user IDs as a comma-separated string
--     slots_list TEXT NULL,
--     status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
--     created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     CONSTRAINT fk_group_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE


# Type 3
CREATE TABLE IF NOT EXISTS type3_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  title VARCHAR(500) NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  location VARCHAR(500) NOT NULL DEFAULT '',
  notes TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  capacity INT NOT NULL DEFAULT 1,
  is_full TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_type3_slots_owner
    FOREIGN KEY (owner_id) REFERENCES users (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS type3_slot_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slot_id INT NOT NULL,
  user_id INT NOT NULL,
  booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_type3_slot_bookings_slot
    FOREIGN KEY (slot_id) REFERENCES type3_slots (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_type3_slot_bookings_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT uq_type3_slot_user UNIQUE (slot_id, user_id)
);