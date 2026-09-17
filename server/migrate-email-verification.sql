-- ============================================================
-- Shapoorji Delivery — email verification via OTP (run ONCE)
-- New signups must enter a 6-digit code mailed to them before
-- they can place orders. Existing accounts are grandfathered as
-- verified so nobody gets locked out.
--
-- How to use (cPanel -> phpMyAdmin):
--   1. Select database reddevil_shapoorji_delivery
--   2. Click Import -> Choose this file -> Go
-- ============================================================

SET NAMES utf8mb4;

ALTER TABLE users
  ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN verification_code_hash VARCHAR(255) NULL,
  ADD COLUMN verification_expires_at DATETIME NULL,
  ADD COLUMN verification_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN verification_sent_at DATETIME NULL;

UPDATE users SET email_verified = 1;
