using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Linq;
using System.Threading.Tasks;
using API.Main;

namespace API.ProductsModule
{
    public class ProductsRepository : BaseRepository, IProductsRepository
    {
        private static readonly List<Product> FallbackProducts = new()
        {
            new Product { Id = 1, Name = "Chocolate Chip Cookies", BasePrice = 45.00m, UnitType = "pc", ImageUrl = "/images/chocolate_chip_cookie.jpg", IsAvailable = true },
            new Product { Id = 2, Name = "Chewy Cringles", BasePrice = 100.00m, UnitType = "dozen", ImageUrl = "/images/chewy_cringles.jpg", IsAvailable = true },
            new Product { Id = 3, Name = "Chocolate Chip Nutty Banana Bread", BasePrice = 150.00m, UnitType = "loaf", ImageUrl = "/images/banana_bread.jpg", IsAvailable = true },
            new Product { Id = 4, Name = "Burnt Basque Cheesecake", BasePrice = 180.00m, UnitType = "piece", ImageUrl = "/images/burnt_basque_cheesecake.jpg", IsAvailable = true },
            new Product { Id = 5, Name = "NewYork Cheesecake", BasePrice = 220.00m, UnitType = "piece", ImageUrl = "/images/newyork_cheesecake.jpg", IsAvailable = true }
        };

        private static readonly List<ProductVariation> FallbackVariations = new()
        {
            new ProductVariation { Id = 1, ProductId = 4, FlavorName = "Original", Price = 180.00m },
            new ProductVariation { Id = 2, ProductId = 4, FlavorName = "Strawberry", Price = 200.00m },
            new ProductVariation { Id = 3, ProductId = 4, FlavorName = "Blueberry", Price = 200.00m },
            new ProductVariation { Id = 4, ProductId = 4, FlavorName = "Mango", Price = 200.00m },
            new ProductVariation { Id = 5, ProductId = 5, FlavorName = "Original", Price = 220.00m },
            new ProductVariation { Id = 6, ProductId = 5, FlavorName = "Strawberry", Price = 240.00m },
            new ProductVariation { Id = 7, ProductId = 5, FlavorName = "Blueberry", Price = 240.00m },
            new ProductVariation { Id = 8, ProductId = 5, FlavorName = "Mango", Price = 240.00m }
        };

        public ProductsRepository(MyCon dbConnection) : base(dbConnection) { }

        private Product MapReaderToProduct(DbDataReader reader)
        {
            return new Product
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                Name = reader.GetString(reader.GetOrdinal("name")),
                BasePrice = reader.GetDecimal(reader.GetOrdinal("base_price")),
                UnitType = reader.GetString(reader.GetOrdinal("unit_type")),
                ImageUrl = reader.IsDBNull(reader.GetOrdinal("image_url")) ? null : reader.GetString(reader.GetOrdinal("image_url")),
                IsAvailable = reader.GetBoolean(reader.GetOrdinal("is_available"))
            };
        }

        private ProductVariation MapReaderToVariation(DbDataReader reader)
        {
            return new ProductVariation
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                ProductId = reader.GetInt32(reader.GetOrdinal("product_id")),
                FlavorName = reader.GetString(reader.GetOrdinal("flavor_name")),
                Price = reader.GetDecimal(reader.GetOrdinal("price"))
            };
        }

        public async Task<IEnumerable<Product>> GetAllAsync()
        {
            try
            {
                var dbProducts = await ExecuteReaderToListAsync("SELECT * FROM products ORDER BY id ASC", MapReaderToProduct);
                if (dbProducts.Count > 0)
                {
                    return dbProducts;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ PostgreSQL GetAllAsync notice: {ex.Message}. Returning active product catalog.");
            }

            return FallbackProducts.OrderBy(p => p.Id).ToList();
        }

        public async Task<IEnumerable<ProductVariation>> GetVariationsAsync(int productId)
        {
            try
            {
                var dbVars = await ExecuteReaderToListAsync(
                    "SELECT * FROM product_variations WHERE product_id = @productId ORDER BY id ASC", 
                    MapReaderToVariation, 
                    new[] { CreateParameter("productId", productId) });

                return dbVars;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ PostgreSQL GetVariationsAsync notice: {ex.Message}.");
            }

            return FallbackVariations.Where(v => v.ProductId == productId).ToList();
        }

        public async Task<int> AddProductAsync(Product product)
        {
            try
            {
                await using var connection = _db.GetConnection();
                await connection.OpenAsync();

                // Ensure sequence is aligned with MAX(id)
                await using var syncCmd = connection.CreateCommand();
                syncCmd.CommandText = @"
                    SELECT setval(
                        pg_get_serial_sequence('products', 'id'), 
                        GREATEST((SELECT COALESCE(MAX(id), 1) FROM products), 1), 
                        (SELECT COUNT(*) > 0 FROM products)
                    );
                ";
                await syncCmd.ExecuteScalarAsync();

                var sql = @"INSERT INTO products (name, base_price, unit_type, image_url, is_available) 
                            VALUES (@name, @price, @unit, @image, @available) RETURNING id";
                
                await using var cmd = connection.CreateCommand();
                cmd.CommandText = sql;
                cmd.Parameters.Add(CreateParameter("name", product.Name));
                cmd.Parameters.Add(CreateParameter("price", product.BasePrice));
                cmd.Parameters.Add(CreateParameter("unit", product.UnitType));
                cmd.Parameters.Add(CreateParameter("image", (object?)product.ImageUrl ?? DBNull.Value));
                cmd.Parameters.Add(CreateParameter("available", product.IsAvailable));

                int insertedId = Convert.ToInt32(await cmd.ExecuteScalarAsync());

                // Keep fallback synchronized with database
                product.Id = insertedId;
                if (!FallbackProducts.Any(p => p.Id == insertedId))
                {
                    FallbackProducts.Add(product);
                }
                return insertedId;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ PostgreSQL AddProductAsync error: {ex.Message}");
                int nextId = FallbackProducts.Count > 0 ? FallbackProducts.Max(p => p.Id) + 1 : 1;
                product.Id = nextId;
                FallbackProducts.Add(product);
                return nextId;
            }
        }

        public async Task UpdateProductAsync(Product product)
        {
            try
            {
                var sql = @"UPDATE products SET name = @name, base_price = @price, unit_type = @unit, 
                            image_url = @image, is_available = @available WHERE id = @id";
                
                await ExecuteNonQueryAsync(sql, new[]
                {
                    CreateParameter("name", product.Name),
                    CreateParameter("price", product.BasePrice),
                    CreateParameter("unit", product.UnitType),
                    CreateParameter("image", (object?)product.ImageUrl ?? DBNull.Value),
                    CreateParameter("available", product.IsAvailable),
                    CreateParameter("id", product.Id)
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ PostgreSQL UpdateProductAsync fallback: {ex.Message}");
            }

            var existing = FallbackProducts.FirstOrDefault(p => p.Id == product.Id);
            if (existing != null)
            {
                existing.Name = product.Name;
                existing.BasePrice = product.BasePrice;
                existing.UnitType = product.UnitType;
                existing.ImageUrl = product.ImageUrl;
                existing.IsAvailable = product.IsAvailable;
            }
        }

        public async Task DeleteProductAsync(int productId)
        {
            try
            {
                await ExecuteNonQueryAsync("DELETE FROM products WHERE id = @id", new[] { CreateParameter("id", productId) });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ PostgreSQL DeleteProductAsync fallback: {ex.Message}");
            }

            FallbackProducts.RemoveAll(p => p.Id == productId);
        }
    }
}