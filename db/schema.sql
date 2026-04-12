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