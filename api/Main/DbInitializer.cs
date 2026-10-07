using System;
using System.Threading.Tasks;
using API.Main;

namespace API.Main
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(MyCon db)
        {
            try
            {
                if (!await db.CanConnectAsync())
                {
                    Console.WriteLine("⚠️ [DbInitializer] PostgreSQL database connection could not be established. Ensure PostgreSQL is running on host localhost:5432.");
                    return;
                }

                await using var conn = db.GetConnection();
                await conn.OpenAsync();

                await using var cmd = conn.CreateCommand();

                // 1. Ensure users table exists
                cmd.CommandText = @"
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        username VARCHAR(100) UNIQUE NOT NULL,
                        full_name VARCHAR(255) DEFAULT '',
                        phone_number VARCHAR(50) DEFAULT '',
                        address TEXT DEFAULT '',
                        password_hash TEXT NOT NULL,
                        role VARCHAR(50) DEFAULT 'customer',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS messages (
                        id SERIAL PRIMARY KEY,
                        sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        sender_name VARCHAR(100) NOT NULL,
                        receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        receiver_name VARCHAR(100) NOT NULL,
                        content TEXT DEFAULT '',
                        image_url TEXT DEFAULT '',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                ";
                await cmd.ExecuteNonQueryAsync();

                // 2. Ensure schema columns exist for existing tables
                string[] alterStatements = new[]
                {
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) DEFAULT '';",
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50) DEFAULT '';",
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';",
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';",
                    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date VARCHAR(50) DEFAULT '';",
                    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_address TEXT DEFAULT '';",
                    "UPDATE users SET role = 'customer' WHERE role IS NULL OR role = '';"
                };

                foreach (var stmt in alterStatements)
                {
                    try
                    {
                        cmd.CommandText = stmt;
                        await cmd.ExecuteNonQueryAsync();
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"⚠️ [DbInitializer] Alter statement warning on '{stmt}': {ex.Message}");
                    }
                }

                // 3. Seed default accounts safely without overwriting user passwords
                string defaultHashedPassword = API.Security.PasswordHasher.HashPassword("123456");

                cmd.CommandText = @"
                    INSERT INTO users (username, full_name, phone_number, address, password_hash, role)
                    VALUES ('WholeSome', 'Jasmin T. Cavan', '09949516731', 'Upper Pacheco Olongapo City', @defaultHash, 'Admin')
                    ON CONFLICT (username) DO UPDATE SET role = 'Admin';

                    INSERT INTO users (username, full_name, phone_number, address, password_hash, role)
                    VALUES ('Jeicho', 'Jeiricho Lumbag', '09123456755', 'Olongapo City', @defaultHash, 'customer')
                    ON CONFLICT (username) DO NOTHING;

                    INSERT INTO users (username, full_name, phone_number, address, password_hash, role)
                    VALUES ('Jolo', 'Jolo', '09123456789', 'Upper Pacheco Olongapo City', @defaultHash, 'customer')
                    ON CONFLICT (username) DO NOTHING;

                    -- Update any empty/null profile fields for users
                    UPDATE users SET 
                        full_name = CASE WHEN full_name IS NULL OR TRIM(full_name) = '' THEN username ELSE full_name END,
                        phone_number = CASE WHEN phone_number IS NULL OR TRIM(phone_number) = '' THEN '09123456789' ELSE phone_number END,
                        address = CASE WHEN address IS NULL OR TRIM(address) = '' THEN 'Olongapo City' ELSE address END;

                    -- Safely re-sequence user IDs so they are clean and consecutive
                    WITH renumbered AS (
                        SELECT id, ROW_NUMBER() OVER (ORDER BY id ASC) AS new_id
                        FROM users
                    )
                    UPDATE users u
                    SET id = r.new_id
                    FROM renumbered r
                    WHERE u.id = r.id;

                    SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT COALESCE(MAX(id), 1) FROM users));
                ";
                cmd.Parameters.Clear();
                var p = cmd.CreateParameter();
                p.ParameterName = "defaultHash";
                p.Value = defaultHashedPassword;
                cmd.Parameters.Add(p);
                await cmd.ExecuteNonQueryAsync();

                // 4. Products table
                cmd.CommandText = @"
                    CREATE TABLE IF NOT EXISTS products (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        base_price NUMERIC(10,2) NOT NULL,
                        unit_type VARCHAR(50) NOT NULL DEFAULT 'Piece',
                        image_url TEXT,
                        is_available BOOLEAN DEFAULT TRUE
                    );

                    CREATE TABLE IF NOT EXISTS product_variations (
                        id SERIAL PRIMARY KEY,
                        product_id INT REFERENCES products(id) ON DELETE CASCADE,
                        flavor_name VARCHAR(255) NOT NULL,
                        price NUMERIC(10,2) NOT NULL
                    );

                    CREATE TABLE IF NOT EXISTS cart_items (
                        id SERIAL PRIMARY KEY,
                        user_id INT NOT NULL,
                        product_id INT NOT NULL,
                        variation_id INT,
                        quantity INT NOT NULL DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS orders (
                        id SERIAL PRIMARY KEY,
                        user_id INT NOT NULL,
                        total_amount NUMERIC(10,2) NOT NULL,
                        payment_method VARCHAR(50) DEFAULT 'COD',
                        status VARCHAR(50) DEFAULT 'Pending',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS order_items (
                        id SERIAL PRIMARY KEY,
                        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
                        product_id INT NOT NULL,
                        variation_id INT,
                        quantity INT NOT NULL,
                        price_at_purchase NUMERIC(10,2) NOT NULL
                    );

                    CREATE TABLE IF NOT EXISTS announcements (
                        id SERIAL PRIMARY KEY,
                        title VARCHAR(255) NOT NULL,
                        content TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                ";
                await cmd.ExecuteNonQueryAsync();

                // Seed initial products if table is empty
                cmd.CommandText = "SELECT COUNT(*) FROM products;";
                long count = Convert.ToInt64(await cmd.ExecuteScalarAsync());
                if (count == 0)
                {
                    cmd.CommandText = @"
                        INSERT INTO products (name, base_price, unit_type, image_url, is_available) VALUES
                        ('Chocolate Chip Cookies', 45.00, 'pc', '/images/chocolate_chip_cookie.jpg', true),
                        ('Chewy Cringles', 100.00, 'dozen', '/images/chewy_cringles.jpg', true),
                        ('Chocolate Chip Nutty Banana Bread', 150.00, 'loaf', '/images/banana_bread.jpg', true),
                        ('Burnt Basque Cheesecake', 180.00, 'piece', '/images/burnt_basque_cheesecake.jpg', true),
                        ('NewYork Cheesecake', 240.00, 'piece', '/images/newyork_cheesecake.jpg', true);
                    ";
                    await cmd.ExecuteNonQueryAsync();
                    Console.WriteLine("🌱 [DbInitializer] Seeded initial products (#1 to #5).");
                }

                // Always ensure product images, unit types, and prices are up to date
                cmd.CommandText = @"
                    UPDATE products SET image_url = '/images/chocolate_chip_cookie.jpg' WHERE id = 1 OR LOWER(name) LIKE '%cookie%';
                    UPDATE products SET image_url = '/images/chewy_cringles.jpg' WHERE id = 2 OR LOWER(name) LIKE '%cringle%';
                    UPDATE products SET image_url = '/images/banana_bread.jpg' WHERE id = 3 OR LOWER(name) LIKE '%banana%';
                    UPDATE products SET image_url = '/images/burnt_basque_cheesecake.jpg', unit_type = 'piece' WHERE id = 4 OR LOWER(name) LIKE '%burnt%';
                    UPDATE products SET image_url = '/images/newyork_cheesecake.jpg', unit_type = 'piece', base_price = 220.00 WHERE id = 5 OR LOWER(name) LIKE '%newyork%' OR LOWER(name) LIKE '%new york%';

                    -- Seed / Update default flavor variations for Burnt Basque Cheesecake (id 4)
                    INSERT INTO product_variations (product_id, flavor_name, price)
                    SELECT 4, 'Original', 180.00 WHERE NOT EXISTS (SELECT 1 FROM product_variations WHERE product_id = 4 AND flavor_name = 'Original');
                    INSERT INTO product_variations (product_id, flavor_name, price)
                    SELECT 4, 'Strawberry', 200.00 WHERE NOT EXISTS (SELECT 1 FROM product_variations WHERE product_id = 4 AND flavor_name = 'Strawberry');
                    INSERT INTO product_variations (product_id, flavor_name, price)
                    SELECT 4, 'Blueberry', 200.00 WHERE NOT EXISTS (SELECT 1 FROM product_variations WHERE product_id = 4 AND flavor_name = 'Blueberry');
                    INSERT INTO product_variations (product_id, flavor_name, price)
                    SELECT 4, 'Mango', 200.00 WHERE NOT EXISTS (SELECT 1 FROM product_variations WHERE product_id = 4 AND flavor_name = 'Mango');

                    UPDATE product_variations SET price = 180.00 WHERE product_id = 4 AND LOWER(flavor_name) = 'original';
                    UPDATE product_variations SET price = 200.00 WHERE product_id = 4 AND LOWER(flavor_name) IN ('strawberry', 'blueberry', 'mango');

                    -- Seed / Update default flavor variations for NewYork Cheesecake (id 5)
                    INSERT INTO product_variations (product_id, flavor_name, price)
                    SELECT 5, 'Original', 220.00 WHERE NOT EXISTS (SELECT 1 FROM product_variations WHERE product_id = 5 AND flavor_name = 'Original');
                    INSERT INTO product_variations (product_id, flavor_name, price)
                    SELECT 5, 'Strawberry', 240.00 WHERE NOT EXISTS (SELECT 1 FROM product_variations WHERE product_id = 5 AND flavor_name = 'Strawberry');
                    INSERT INTO product_variations (product_id, flavor_name, price)
                    SELECT 5, 'Blueberry', 240.00 WHERE NOT EXISTS (SELECT 1 FROM product_variations WHERE product_id = 5 AND flavor_name = 'Blueberry');
                    INSERT INTO product_variations (product_id, flavor_name, price)
                    SELECT 5, 'Mango', 240.00 WHERE NOT EXISTS (SELECT 1 FROM product_variations WHERE product_id = 5 AND flavor_name = 'Mango');

                    UPDATE product_variations SET price = 220.00 WHERE product_id = 5 AND LOWER(flavor_name) = 'original';
                    UPDATE product_variations SET price = 240.00 WHERE product_id = 5 AND LOWER(flavor_name) IN ('strawberry', 'blueberry', 'mango');
                ";
                await cmd.ExecuteNonQueryAsync();

                // Purge legacy sample seed orders (ID 1, 2, 3) if present
                cmd.CommandText = @"
                    DELETE FROM order_items WHERE order_id IN (1, 2, 3);
                    DELETE FROM orders WHERE id IN (1, 2, 3);
                ";
                await cmd.ExecuteNonQueryAsync();

                // Seed initial announcements if announcements table is empty
                cmd.CommandText = "SELECT COUNT(*) FROM announcements;";
                long annCount = Convert.ToInt64(await cmd.ExecuteScalarAsync());
                if (annCount == 0)
                {
                    cmd.CommandText = @"
                        INSERT INTO announcements (title, content, created_at) VALUES
                        ('🎉 Grand Weekend Promo!', 'Enjoy 10% off on all Burnt Basque Cheesecakes this weekend only! Use promo code WHOLESOME10 at checkout.', NOW() - INTERVAL '1 day'),
                        ('📢 Fresh Batch Every Morning', 'We bake our Artisan Chocolate Chip Cookies fresh every 7:00 AM! Order early to get hot out-of-the-oven treats.', NOW() - INTERVAL '3 days');
                    ";
                    await cmd.ExecuteNonQueryAsync();
                    Console.WriteLine("🌱 [DbInitializer] Seeded sample announcements.");
                }

                // Always synchronize sequences
                cmd.CommandText = @"
                    SELECT setval(
                        pg_get_serial_sequence('products', 'id'), 
                        GREATEST((SELECT COALESCE(MAX(id), 1) FROM products), 1), 
                        (SELECT COUNT(*) > 0 FROM products)
                    );
                    SELECT setval(
                        pg_get_serial_sequence('orders', 'id'), 
                        GREATEST((SELECT COALESCE(MAX(id), 1) FROM orders), 1), 
                        (SELECT COUNT(*) > 0 FROM orders)
                    );
                    SELECT setval(
                        pg_get_serial_sequence('announcements', 'id'), 
                        GREATEST((SELECT COALESCE(MAX(id), 1) FROM announcements), 1), 
                        (SELECT COUNT(*) > 0 FROM announcements)
                    );
                ";
                await cmd.ExecuteNonQueryAsync();
                Console.WriteLine("🔄 [DbInitializer] Synchronized products, orders, and announcements sequences.");

                Console.WriteLine("✅ [DbInitializer] PostgreSQL database schema & tables verified successfully.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ [DbInitializer] Schema initialization warning: {ex.Message}");
            }
        }
    }
}
