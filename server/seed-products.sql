-- ============================================================
-- Shapoorji Delivery — product seed (from CSV export)
-- 48 products with Supabase image URLs, all set active so they
-- show on the website.
--
-- How to use (cPanel -> phpMyAdmin):
--   1. Select database reddevil_shapoorji_delivery
--   2. Click Import -> Choose this file -> Go
-- Safe to re-run (uses ON DUPLICATE KEY UPDATE).
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Starter schema.sql inserts Fruits/Vegetables with random UUIDs,
-- which collide by NAME with the fixed IDs below. Remove the
-- random ones first so the fixed IDs become the canonical rows.
DELETE FROM categories WHERE slug IN ('fruits', 'vegetables', 'rice', 'grocery');

INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  ('0cfd9c32-1492-479b-bcf7-ced00ae80434', 'Vegetables', 'vegetables', 'Carrot', 2),
  ('b40a8e34-e991-4635-ad0e-459e485b8b6b', 'Fruits', 'fruits', 'Apple', 1),
  ('affe52bc-03a5-4d4d-985d-3913782f5942', 'Rice', 'rice', 'Wheat', 3),
  ('4fe9dafa-2464-4c8d-be92-bf2cc1db45a4', 'Grocery', 'grocery', 'ShoppingBasket', 4)
ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug), icon = VALUES(icon), sort_order = VALUES(sort_order);

INSERT INTO products (id, name, description, price, unit, image_url, category_id, stock, is_active) VALUES
('13e0d7a4-aa6f-459f-b7ac-bad3fb1a46d3', 'Atta (Whole Wheat Flour) | আটা | आटा', 'Atta (Whole Wheat Flour) | আটা | आटा', 53, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/Atta.png', '4fe9dafa-2464-4c8d-be92-bf2cc1db45a4', 10, 1),
('cbd64b16-eb3e-4f35-a549-508cdcf5a474', 'Biryani Rice | বিরিয়ানির চাল | बिरयानी चावल', 'Biryani Rice | বিরিয়ানির চাল | बिरयानी चावल', 95, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/Biryani%20Rice.png', 'affe52bc-03a5-4d4d-985d-3913782f5942', 25, 1),
('2a96edc3-999f-4ea0-ae2d-8f707ef1b647', 'Bitter Gourd (Korola) | করলা | करेला', 'Bitter Gourd (Korola) | করলা | करेला', 60, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/bitter_gourd_korola.png', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 100, 1),
('fe4cfc2e-d9f3-4a5d-aa76-98a79c78b361', 'Black Grapes | কালো আঙুর | काले अंगूर', 'Black Grapes | কালো আঙুর | काले अंगूर', 400, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/black_grapes.png', 'b40a8e34-e991-4635-ad0e-459e485b8b6b', 100, 1),
('49d9f183-edc7-485d-a822-0c50c31aaa07', 'Bottle Gourd | লাউ | लौकी', 'Bottle Gourd | লাউ | लौकी', 40, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/bottle_gourd.jfif', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 100, 1),
('118152a6-4281-42be-a324-e3eecdc5c6d2', 'Brinjal Eggplant | বেগুন | बैंगन', 'Brinjal Eggplant | বেগুন | बैंगन', 80, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/brinjal_eggplant.png', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 100, 1),
('9b4667e9-52a1-4c1c-b7c8-b76e84ee861b', 'Cabbage | বাঁধাকপি | पत्ता गोभी', 'Cabbage | বাঁধাকপি | पत्ता गोभी', 60, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/cabbage.png', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 100, 1),
('0a70f78f-191e-4354-bcaf-e9992a48a5a9', 'Capsicum (Bell Pepper) | ক্যাপসিকাম | शिमला मिर्च', 'Capsicum (Bell Pepper) | ক্যাপসিকাম | शिमला मिर्च', 70, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/capsicum_bell_pepper.png', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 100, 1),
('e3b5e4d8-abda-4259-8143-c8bee69564c7', 'Carrot | গাজর | गाजर', 'Carrot | গাজর | गाजर', 80, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/carrot.png', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 100, 1),
('d3eaf887-a748-46d3-a17b-159b89fdaf93', 'Chana Dal (Split Chickpeas) | ছোলা ডাল | चना दाल', 'Chana Dal (Split Chickpeas) | ছোলা ডাল | चना दाल', 109, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/Chana%20Dal.png', '4fe9dafa-2464-4c8d-be92-bf2cc1db45a4', 10, 1),
('6dc0db5d-8a64-4553-a1ea-9f45e8a6e782', 'Chandramukhi Potato | চন্দ্রমুখী আলু | चंद्रमुखी आलू', 'Chandramukhi Potato | চন্দ্রমুখী আলু | चंद्रमुखी आलू', 18, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/chandramukhi_potato.png', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 100, 1),
('e94cc93f-c914-4a98-b0bb-3199b34bd1d7', 'Cucumber | শসা | खीरा', 'Cucumber | শসা | खीरा', 60, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/cucumber.png', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 100, 1),
('e84a17da-3efd-4b37-9087-b32fdb4f464f', 'Dragon Fruit | ড্রাগন ফল | ड्रैगन फ्रूट', 'Dragon Fruit | ড্রাগন ফল | ड्रैगन फ्रूट', 250, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/dragon_fruit.png', 'b40a8e34-e991-4635-ad0e-459e485b8b6b', 100, 1),
('6995704a-04f0-4d76-bc06-c4fd82b34676', 'Elephant Foot (Yam Ol) | ওল | जिमीकंद', 'Elephant Foot (Yam Ol) | ওল | जिमीकंद', 60, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/elephant_foot_yam_ol.jfif', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 100, 1),
('298e19b7-62f8-42cd-8bb9-b7c2ae7e06c9', 'Garlic | রসুন | लहसुन', 'Garlic | রসুন | लहसुन', 23, '100gms', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/Garlic.png', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 10, 1),
('e2bf01bf-1539-47d3-ac63-41e1d38e4700', 'Ginger | আদা | अदरक', 'Ginger | আদা | अदरक', 30, '100gms', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/Ginger.png', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 10, 1),
('418ab4c7-3df9-4a51-838c-66d362a326a8', 'Gobindobhog Rice | গোবিন্দভোগ চাল | गोबिंदोभोग चावल', 'Gobindobhog Rice | গোবিন্দভোগ চাল | गोबिंदोभोग चावल', 179, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/Gobindobhog.png', 'affe52bc-03a5-4d4d-985d-3913782f5942', 25, 1),
('bd52bd42-502c-48ac-9676-d9ab8b8fef9c', 'Green Apple | গ্রিন আপেল | हरा सेब', 'Green Apple | গ্রিন আপেল | हरा सेब', 250, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/green_apple.png', 'b40a8e34-e991-4635-ad0e-459e485b8b6b', 100, 1),
('ed381d4d-efed-494b-b5fa-3685ed1bfa27', 'Green Chilli | কাঁচা লঙ্কা | हरी मिर्च', 'Green Chilli | কাঁচা লঙ্কা | हरी मिर्च', 100, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/Green%20Chilli.png', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 10, 1),
('928fc8e5-cde0-4c77-b0cc-854f671a06d5', 'Green Grapes | সবুজ আঙুর | हरे अंगूर', 'Green Grapes | সবুজ আঙুর | हरे अंगूर', 200, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/green_grapes.png', 'b40a8e34-e991-4635-ad0e-459e485b8b6b', 100, 1),
('b4368ef8-481a-454c-8fab-31acb9140661', 'Guava | পেয়ারা | अमरूद', 'Guava | পেয়ারা | अमरूद', 70, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/guava.png', 'b40a8e34-e991-4635-ad0e-459e485b8b6b', 100, 1),
('dac68bb9-44ed-482a-99c1-c19dba15a406', 'Jirakati Rice | জিরাকাটি চাল | जीरा काठी चावल', 'Jirakati Rice | জিরাকাটি চাল | जीरा काठी चावल', 81, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/Jirakati%20Rice.png', 'affe52bc-03a5-4d4d-985d-3913782f5942', 25, 1),
('9f007cf4-6827-42f6-8b26-d55477546223', 'Kashmiri Apple | কাশ্মীরি আপেল | कश्मीरी सेब', 'Kashmiri Apple | কাশ্মীরি আপেল | कश्मीरी सेब', 180, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/kashmiri_apple.png', 'b40a8e34-e991-4635-ad0e-459e485b8b6b', 100, 1),
('e426e555-9ef7-4eee-ab1a-7fd6ae34c3ef', 'Lemon | লেবু | नींबू', 'Lemon | লেবু | नींबू', 10, '1pc', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/lemon.jfif', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 100, 1),
('6991eff1-22b9-46ab-b221-6e56405c8ac5', 'Maida (Refined Flour) | ময়দা | मैदा', 'Maida (Refined Flour) | ময়দা | मैदा', 57, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/Maida.png', '4fe9dafa-2464-4c8d-be92-bf2cc1db45a4', 10, 1),
('6464be62-d049-4ba5-9718-17cc7749275a', 'Masoor Dal (Red Lentils) | মসুর ডাল | मसूर दाल', 'Masoor Dal (Red Lentils) | মসুর ডাল | मसूर दाल', 100, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/Masoor%20Dal.png', '4fe9dafa-2464-4c8d-be92-bf2cc1db45a4', 10, 1),
('8ffd69da-d094-435f-9b61-0e0d5a021da1', 'Miniket Rice | মিনিকেট চাল | मिनीकेट चावल', 'Miniket Rice | মিনিকেট চাল | मिनीकेट चावल', 70, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/Miniket%20Rice.png', 'affe52bc-03a5-4d4d-985d-3913782f5942', 25, 1),
('56a05061-9579-4017-be87-bcb66cada54f', 'Moong Dal (Yellow Lentils) | মুগ ডাল | मूंग दाल', 'Moong Dal (Yellow Lentils) | মুগ ডাল | मूंग दाल', 135, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/Moong%20Dal.png', '4fe9dafa-2464-4c8d-be92-bf2cc1db45a4', 10, 1),
('e1331b2f-28a2-4911-8180-cb91cbc4151a', 'Okra Bhindi | ঢেঁড়স (ভেন্ডি) | भिंडी', 'Okra Bhindi | ঢেঁড়স (ভেন্ডি) | भिंडी', 60, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/okra_bhindi.png', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 100, 1),
('1f0b847c-9f7b-46d7-8f58-6a8f2a77ff54', 'Onion | পেঁয়াজ | प्याज', 'Onion | পেঁয়াজ | प्याज', 53, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/Onion.png', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 60, 1),
('a236fcda-8e80-4e62-88e1-a97109df96d8', 'Pear (Naspati) | ন্যাশপাতি | नाशपाती', 'Pear (Naspati) | ন্যাশপাতি | नाशपाती', 150, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/pear_naspati.png', 'b40a8e34-e991-4635-ad0e-459e485b8b6b', 100, 1),
('ff0b9f21-6f3f-490f-9b0d-3aafd0407f47', 'Pineapple | আনারস | अनानास', 'Pineapple | আনারস | अनानास', 90, '1pc', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/pineapple.png', 'b40a8e34-e991-4635-ad0e-459e485b8b6b', 100, 1),
('a9bac45a-380d-48b0-97da-20a000938351', 'Pointed Gourd (Potol) | পটল | परवल', 'Pointed Gourd (Potol) | পটল | परवल', 60, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/pointed_gourd_potol.png', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 100, 1),
('0f3c2997-1949-4e32-aa12-9df1950b4412', 'Pomegranate | বেদানা | अनार', 'Pomegranate | বেদানা | अनार', 230, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/pomegranate.png', 'b40a8e34-e991-4635-ad0e-459e485b8b6b', 100, 1),
('4aa539e2-8f9c-4a32-9877-12d3aea2295f', 'Potato | আলু | आलू', 'Potato | আলু | आलू', 20, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/Potato.png', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 50, 1),
('ddea3f17-1963-4a90-80ee-557beec90218', 'Pumpkin | কুমড়ো | कद्दू', 'Pumpkin | কুমড়ো | कद्दू', 30, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/pumpkin.png', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 100, 1),
('d0f29125-c6ce-456f-b072-d72127fcd60f', 'Raw Papaya | কাঁচা পেঁপে | कच्चा पपीता', 'Raw Papaya | কাঁচা পেঁপে | कच्चा पपीता', 50, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/raw_papaya.jfif', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 100, 1),
('06cf0760-ae57-4c24-ab99-2c200ba065d9', 'Ridge Gourd (Jhinge) | ঝিঙে | तोरई', 'Ridge Gourd (Jhinge) | ঝিঙে | तोरई', 70, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/ridge_gourd_jhinge.png', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 100, 1),
('ce9c86a1-2fa6-4fde-ae6e-95ef2f272d41', 'Ripe Papaya | পাকা পেঁপে | पका पपीता', 'Ripe Papaya | পাকা পেঁপে | पका पपीता', 70, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/ripe_papaya.png', 'b40a8e34-e991-4635-ad0e-459e485b8b6b', 100, 1),
('0db33b8c-bcd3-4bed-91c7-8afb283bd7d9', 'Spinach | পালং শাক | पालक', 'Spinach | পালং শাক | पालक', 15, '1bunch', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/spinach.png', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 100, 1),
('9e4803c6-9211-4bc0-90b1-4d75f6ad474d', 'Sweet Potato (Mishti Alu) | মিষ্টি আলু | शकरकंद', 'Sweet Potato (Mishti Alu) | মিষ্টি আলু | शकरकंद', 180, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/sweet_potato_mishti_alu.png', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 100, 1),
('255cebf2-1bfa-4de0-a28c-efda6e104da4', 'Taro Root (Kochu) | কচু | अरबी', 'Taro Root (Kochu) | কচু | अरबी', 60, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/taro_root_kochu.png', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 100, 1),
('2f393b91-8b6e-4a50-8d6d-625847846999', 'Teasel Gourd (Kakrol) | কাঁকরোল | ककोरा', 'Teasel Gourd (Kakrol) | কাঁকরোল | ककोरा', 60, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/teasel_gourd_kakrol.png', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 100, 1),
('f58175ed-cfa7-476b-97b2-0206279c8bb4', 'Tender Coconut | ডাব | कच्चा नारियल (पानी)', 'Tender Coconut | ডাব | कच्चा नारियल (पानी)', 70, '1pc', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/tender_coconut.png', 'b40a8e34-e991-4635-ad0e-459e485b8b6b', 100, 1),
('eafefc6e-589c-498f-9f72-9f728cecaade', 'Thailand Apple (Fuji) | থাইল্যান্ড আপেল | थाईलैंड सेब', 'Thailand Apple (Fuji) | থাইল্যান্ড আপেল | थाईलैंड सेब', 250, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/thailand_apple_fuji.png', 'b40a8e34-e991-4635-ad0e-459e485b8b6b', 100, 1),
('e8570063-952f-457a-9ea4-603b52e73fbe', 'Tomato | টমেটো | टमाटर', 'Tomato | টমেটো | टमाटर', 60, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/tomato.jfif', '0cfd9c32-1492-479b-bcf7-ced00ae80434', 100, 1),
('50bc1b44-55da-441e-975c-438c12ca1259', 'Watermelon | তরমুজ | तरबूज', 'Watermelon | তরমুজ | तरबूज', 30, '1kg', 'https://ptsdziezwtjrhrvnwuid.supabase.co/storage/v1/object/public/products/12092026/watermelon.png', 'b40a8e34-e991-4635-ad0e-459e485b8b6b', 100, 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  price = VALUES(price),
  unit = VALUES(unit),
  image_url = VALUES(image_url),
  category_id = VALUES(category_id),
  stock = VALUES(stock),
  is_active = VALUES(is_active);

SET FOREIGN_KEY_CHECKS = 1;
