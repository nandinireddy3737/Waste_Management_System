-- Add email, phone, and password_hash columns to WORKER table for signup/login
-- Run this in MySQL (waste_management database) before using Worker Sign Up or Worker Login
-- Skip any line if that column already exists

ALTER TABLE WORKER ADD COLUMN email VARCHAR(255);
ALTER TABLE WORKER ADD COLUMN phone VARCHAR(50);
ALTER TABLE WORKER ADD COLUMN password_hash VARCHAR(64);
