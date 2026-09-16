-- ============================================================
-- Shapoorji Delivery — orders v2 migration (run ONCE)
-- Adds human-readable order/invoice numbers, subtotal, delivery
-- fee, payment method, tower/flat + the order number counter.
--
-- How to use (cPanel -> phpMyAdmin):
--   1. Select database reddevil_shapoorji_delivery
--   2. Click Import -> Choose this file -> Go
-- Backfills existing orders so nothing is left NULL.
-- ============================================================

SET NAMES utf8mb4;

ALTER TABLE orders
  ADD COLUMN order_number VARCHAR(32) NULL AFTER status,
  ADD COLUMN invoice_number VARCHAR(32) NULL AFTER order_number,
  ADD COLUMN subtotal DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER invoice_number,
  ADD COLUMN delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER subtotal,
  ADD COLUMN payment_method VARCHAR(100) NOT NULL DEFAULT 'Pay on Delivery (Cash / UPI QR)' AFTER total,
  ADD COLUMN tower VARCHAR(100) NOT NULL DEFAULT '' AFTER payment_method,
  ADD COLUMN flat VARCHAR(100) NOT NULL DEFAULT '' AFTER tower;

CREATE TABLE IF NOT EXISTS order_counters (
  year INT PRIMARY KEY,
  next_seq INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Backfill existing orders: sequential numbers from 1001 per year,
-- random invoice numbers, old totals kept as subtotal (no fee back then).
SET @rn := 1000;
UPDATE orders
  SET order_number = CONCAT('SPD-', YEAR(created_at), '-', (@rn := @rn + 1))
  WHERE order_number IS NULL ORDER BY created_at;
UPDATE orders
  SET invoice_number = CONCAT('INV-SPD-', FLOOR(10000 + RAND() * 89999))
  WHERE invoice_number IS NULL;
UPDATE orders SET subtotal = total, delivery_fee = 0 WHERE subtotal = 0 AND total <> 0;

-- New orders continue from 1027 (latest known manual number: 1026).
INSERT INTO order_counters (year, next_seq) VALUES (YEAR(CURDATE()), 1027)
  ON DUPLICATE KEY UPDATE next_seq = GREATEST(next_seq, 1027);

ALTER TABLE orders ADD UNIQUE KEY uniq_order_number (order_number);
