-- Categories (same ones as your current Store tabs). Icons use char(codepoint)
-- so the file stays plain ASCII and works in any terminal.
INSERT OR IGNORE INTO categories (id, slug, name, icon, sort) VALUES
  (1, 'keyboards',   'Keyboards',   char(127929), 1),  -- piano keys
  (2, 'strings',     'Strings',     char(127928), 2),  -- guitar
  (3, 'traditional', 'Traditional', char(129685), 3),  -- banjo
  (4, 'percussion',  'Percussion',  char(129345), 4),  -- drum
  (5, 'wind',        'Wind',        char(127930), 5),  -- trumpet
  (6, 'audio',       'Audio',       char(127911), 6),  -- headphones
  (7, 'rental',      'Rental',      char(128266), 7);  -- speaker
 
-- Sample seller. The password hash '!' can never match, so nobody can log in as it.
INSERT OR IGNORE INTO users (id, name, phone, password_hash, role, seller_status)
VALUES (1, 'Azmari Sample Seller', '+251900000000', '!', 'user', 'approved');
 
-- TWO SAMPLE ADS (is_sample = 1). Delete them later with:
--   DELETE FROM listings WHERE is_sample = 1;
INSERT INTO listings
  (seller_id, category_id, title, description, price, item_condition, city,
   lat, lng, status, is_sample, approved_at)
SELECT 1, 1, 'Electric keyboard',
       '61-key electric keyboard, good condition, comes with stand and adapter.',
       18500, 'used', 'Bole, Addis Ababa', 8.9806, 38.7578, 'approved', 1,
       strftime('%Y-%m-%dT%H:%M:%SZ','now')
WHERE NOT EXISTS (SELECT 1 FROM listings WHERE is_sample = 1 AND title = 'Electric keyboard');
 
INSERT INTO listings
  (seller_id, category_id, title, description, price, item_condition, city,
   lat, lng, status, is_sample, approved_at)
SELECT 1, 2, 'Acoustic guitar',
       'Full-size acoustic guitar with soft case and extra strings.',
       7800, 'used', 'Piassa, Addis Ababa', 9.0357, 38.7524, 'approved', 1,
       strftime('%Y-%m-%dT%H:%M:%SZ','now')
WHERE NOT EXISTS (SELECT 1 FROM listings WHERE is_sample = 1 AND title = 'Acoustic guitar');
