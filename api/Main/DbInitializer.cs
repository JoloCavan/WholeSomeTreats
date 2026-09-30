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
                ";
                await cmd.ExecuteNonQueryAsync();

                // 2. Ensure schema columns exist for existing tables
                string[] alterStatements = new[]
                {
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) DEFAULT '';",
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50) DEFAULT '';",
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';",
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';",
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

                // 3. Seed default accounts
                cmd.CommandText = @"
                    INSERT INTO users (username, full_name, phone_number, address, password_hash, role)
                    VALUES ('WholeSome', 'Jasmin T. Cavan', '09949516731', 'Upper Pacheco Olongapo City', '123456', 'Admin')
                    ON CONFLICT (username) DO UPDATE SET role = 'Admin', full_name = 'Jasmin T. Cavan', password_hash = '123456';

                    INSERT INTO users (username, full_name, phone_number, address, password_hash, role)
                    VALUES ('Jeicho', 'Jeiricho Lumbag', '09123456755', 'Olongapo City', '123456', 'customer')
                    ON CONFLICT (username) DO UPDATE SET password_hash = '123456';
                ";
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
                        ('Burnt Basque Cheesecake', 180.00, 'whole', '/images/burnt_basque_cheesecake.jpg', true),
                        ('NewYork Cheesecake', 220.00, 'whole', '/images/newyork_cheesecake.jpg', true);
                    ";
                    await cmd.ExecuteNonQueryAsync();
                    Console.WriteLine("🌱 [DbInitializer] Seeded initial products (#1 to #5).");
                }

                // Always ensure product images match the categorized uploaded image assets
                cmd.CommandText = @"
                    UPDATE products SET image_url = '/images/chocolate_chip_cookie.jpg' WHERE id = 1 OR LOWER(name) LIKE '%cookie%';
                    UPDATE products SET image_url = '/images/chewy_cringles.jpg' WHERE id = 2 OR LOWER(name) LIKE '%cringle%';
                    UPDATE products SET image_url = '/images/banana_bread.jpg' WHERE id = 3 OR LOWER(name) LIKE '%banana%';
                    UPDATE products SET image_url = '/images/burnt_basque_cheesecake.jpg' WHERE id = 4 OR LOWER(name) LIKE '%burnt%';
                    UPDATE products SET image_url = '/images/newyork_cheesecake.jpg' WHERE id = 5 OR LOWER(name) LIKE '%newyork%' OR LOWER(name) LIKE '%new york%';
                ";
                await cmd.ExecuteNonQueryAsync();

                // Seed initial sample orders if orders table is empty
                cmd.CommandText = "SELECT COUNT(*) FROM orders;";
                long orderCount = Convert.ToInt64(await cmd.ExecuteScalarAsync());
                if (orderCount == 0)
                {
                    cmd.CommandText = @"
                        DELETE FROM order_items WHERE order_id NOT IN (SELECT id FROM orders);

                        INSERT INTO orders (id, user_id, total_amount, payment_method, status, created_at) VALUES
                        (1, 1, 220.00, 'COD', 'Pending', NOW() - INTERVAL '2 hours'),
                        (2, 1, 180.00, 'COD', 'Processing', NOW() - INTERVAL '1 day'),
                        (3, 1, 145.00, 'COD', 'Completed', NOW() - INTERVAL '2 days')
                        ON CONFLICT (id) DO NOTHING;

                        INSERT INTO order_items (order_id, product_id, variation_id, quantity, price_at_purchase) VALUES
                        (1, 5, NULL, 1, 220.00),
                        (2, 4, NULL, 1, 180.00),
                        (3, 1, NULL, 1, 45.00),
                        (3, 2, NULL, 1, 100.00);
                    ";
                    await cmd.ExecuteNonQueryAsync();
                    Console.WriteLine("🌱 [DbInitializer] Seeded sample orders.");
                }

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
