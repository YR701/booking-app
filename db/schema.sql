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