-- ============================================================
-- Shapoorji Delivery — fractional cart quantities (run ONCE)
-- Weight-based products sell in 0.25 kg steps, but cart_items and
-- order_items quantity columns were INT, so 0.25 was stored as 0
-- and items looked like they were never added to the cart.
-- Also clears junk zero-quantity rows created by that bug.
--
-- How to use (cPanel -> phpMyAdmin):
--   1. Select database reddevil_shapoorji_delivery
--   2. Click Import -> Choose this file -> Go
-- ============================================================

SET NAMES utf8mb4;

ALTER TABLE cart_items MODIFY quantity DECIMAL(10,2) NOT NULL DEFAULT 1;
ALTER TABLE order_items MODIFY quantity DECIMAL(10,2) NOT NULL DEFAULT 1;

DELETE FROM cart_items WHERE quantity <= 0;
