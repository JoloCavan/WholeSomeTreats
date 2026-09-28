using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Threading.Tasks;
using API.Main;

namespace API.CartModule
{
    public class CartRepository : BaseRepository, ICartRepository
    {
        public CartRepository(MyCon dbConnection) : base(dbConnection) { }

        private CartItem MapReaderToCartItem(DbDataReader reader)
        {
            return new CartItem
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                UserId = reader.GetInt32(reader.GetOrdinal("user_id")),
                ProductId = reader.GetInt32(reader.GetOrdinal("product_id")),
                VariationId = reader.IsDBNull(reader.GetOrdinal("variation_id")) ? null : reader.GetInt32(reader.GetOrdinal("variation_id")),
                Quantity = reader.GetInt32(reader.GetOrdinal("quantity")),
                ProductName = reader.GetString(reader.GetOrdinal("product_name")),
                Price = reader.GetDecimal(reader.GetOrdinal("price"))
            };
        }

        public async Task<IEnumerable<CartItem>> GetCartByUserIdAsync(int userId)
        {
            var sql = @"
                SELECT c.id, c.user_id, c.product_id, c.variation_id, c.quantity, 
                       p.name as product_name, 
                       COALESCE(v.price, p.base_price) as price
                FROM cart_items c
                JOIN products p ON c.product_id = p.id
                LEFT JOIN product_variations v ON c.variation_id = v.id
                WHERE c.user_id = @userId";

            return await ExecuteReaderToListAsync(sql, MapReaderToCartItem, new[] { CreateParameter("userId", userId) });
        }

        public async Task AddToCartAsync(int userId, int productId, int? variationId, int quantity)
        {
            var sql = "INSERT INTO cart_items (user_id, product_id, variation_id, quantity) VALUES (@userId, @productId, @variationId, @quantity)";
            
            await ExecuteNonQueryAsync(sql, new[]
            {
                CreateParameter("userId", userId),
                CreateParameter("productId", productId),
                CreateParameter("variationId", variationId),
                CreateParameter("quantity", quantity)
            });
        }

        public async Task RemoveFromCartAsync(int cartItemId, int userId)
        {
            var sql = "DELETE FROM cart_items WHERE id = @id AND user_id = @userId";
            await ExecuteNonQueryAsync(sql, new[] 
            { 
                CreateParameter("id", cartItemId),
                CreateParameter("userId", userId)
            });
        }

        public async Task ClearCartAsync(int userId)
        {
            var sql = "DELETE FROM cart_items WHERE user_id = @userId";
            await ExecuteNonQueryAsync(sql, new[] { CreateParameter("userId", userId) });
        }
    }
}