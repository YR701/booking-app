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

/* Author: Jenny Hua */
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



/* Author: Hanjing Zheng */

# Type 2
-- Force drop if previously created tables.
-- SET FOREIGN_KEY_CHECKS = 0;
-- DROP TABLE IF EXISTS type2_meeting_votes;
-- DROP TABLE IF EXISTS type2_meeting_invitees;
-- DROP TABLE IF EXISTS type2_meeting_slots;
-- DROP TABLE IF EXISTS type2_meetings;
-- SET FOREIGN_KEY_CHECKS = 1;

-- Main Type 2 meetings table
CREATE TABLE type2_meetings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  final_slot_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_type2_meetings_owner
    FOREIGN KEY (owner_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE type2_meeting_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,

  CONSTRAINT fk_type2_meeting_slots_meeting
    FOREIGN KEY (meeting_id) REFERENCES type2_meetings(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

ALTER TABLE type2_meetings
ADD CONSTRAINT fk_type2_meetings_final_slot
  FOREIGN KEY (final_slot_id) REFERENCES type2_meeting_slots(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

CREATE TABLE type2_meeting_invitees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  user_id INT NOT NULL,

  CONSTRAINT fk_type2_invitees_meeting
    FOREIGN KEY (meeting_id) REFERENCES type2_meetings(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_type2_invitees_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT uq_type2_invitee UNIQUE (meeting_id, user_id)
);

CREATE TABLE type2_meeting_votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  slot_id INT NOT NULL,
  user_id INT NOT NULL,
  is_available TINYINT(1) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_type2_votes_meeting
    FOREIGN KEY (meeting_id) REFERENCES type2_meetings(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_type2_votes_slot
    FOREIGN KEY (slot_id) REFERENCES type2_meeting_slots(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_type2_votes_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT uq_type2_vote UNIQUE (meeting_id, slot_id, user_id)
);



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