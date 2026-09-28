using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Threading.Tasks;
using API.Main;

namespace API.OrdersModule
{
    public class OrdersRepository : BaseRepository, IOrdersRepository
    {
        public OrdersRepository(MyCon dbConnection) : base(dbConnection) { }

        private Order MapReaderToOrder(DbDataReader reader)
        {
            return new Order
            {
                Id = reader.GetInt32(reader.GetOrdinal("id")),
                UserId = reader.GetInt32(reader.GetOrdinal("user_id")),
                TotalAmount = reader.GetDecimal(reader.GetOrdinal("total_amount")),
                PaymentMethod = reader.GetString(reader.GetOrdinal("payment_method")),
                // GCash line removed here
                Status = reader.GetString(reader.GetOrdinal("status")),
                CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at"))
            };
        }

        public async Task<int> CreateOrderAsync(int userId, IEnumerable<CartItemSummary> cartItems)
        {
            await using var connection = _db.GetConnection();
            await connection.OpenAsync();
            await using var transaction = await connection.BeginTransactionAsync();

            try
            {
                decimal totalAmount = 0;
                var itemsList = new List<CartItemSummary>(cartItems);
                foreach (var item in itemsList) totalAmount += item.Price * item.Quantity;

                // Hardcoding COD and an initial Pending status
                string paymentMethod = "COD";
                string initialStatus = "Pending";

                var orderSql = @"
                    INSERT INTO orders (user_id, total_amount, payment_method, status, created_at) 
                    VALUES (@userId, @total, @method, @status, NOW()) 
                    RETURNING id";

                int orderId = 0;
                await using (var cmd = connection.CreateCommand())
                {
                    cmd.Transaction = transaction;
                    cmd.CommandText = orderSql;
                    cmd.Parameters.Add(CreateParam(cmd, "userId", userId));
                    cmd.Parameters.Add(CreateParam(cmd, "total", totalAmount));
                    cmd.Parameters.Add(CreateParam(cmd, "method", paymentMethod));
                    cmd.Parameters.Add(CreateParam(cmd, "status", initialStatus));

                    orderId = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                }

                foreach (var item in itemsList)
                {
                    var itemSql = @"
                        INSERT INTO order_items (order_id, product_id, variation_id, quantity, price_at_purchase) 
                        VALUES (@orderId, @prodId, @varId, @qty, @price)";

                    await using var itemCmd = connection.CreateCommand();
                    itemCmd.Transaction = transaction;
                    itemCmd.CommandText = itemSql;
                    itemCmd.Parameters.Add(CreateParam(itemCmd, "orderId", orderId));
                    itemCmd.Parameters.Add(CreateParam(itemCmd, "prodId", item.ProductId));
                    itemCmd.Parameters.Add(CreateParam(itemCmd, "varId", (object?)item.VariationId ?? DBNull.Value));
                    itemCmd.Parameters.Add(CreateParam(itemCmd, "qty", item.Quantity));
                    itemCmd.Parameters.Add(CreateParam(itemCmd, "price", item.Price));

                    await itemCmd.ExecuteNonQueryAsync();
                }

                var clearCartSql = "DELETE FROM cart_items WHERE user_id = @userId";
                await using (var clearCmd = connection.CreateCommand())
                {
                    clearCmd.Transaction = transaction;
                    clearCmd.CommandText = clearCartSql;
                    clearCmd.Parameters.Add(CreateParam(clearCmd, "userId", userId));
                    await clearCmd.ExecuteNonQueryAsync();
                }

                await transaction.CommitAsync();
                return orderId;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // ... (Keep the rest of your methods like GetAllOrdersAsync, CancelOrderAsync exactly the same)
        
        public async Task<IEnumerable<Order>> GetAllOrdersAsync()
        {
            return await ExecuteReaderToListAsync("SELECT * FROM orders ORDER BY created_at DESC", MapReaderToOrder);
        }

        public async Task<IEnumerable<Order>> GetOrdersByUserIdAsync(int userId)
        {
            return await ExecuteReaderToListAsync("SELECT * FROM orders WHERE user_id = @userId ORDER BY created_at DESC", MapReaderToOrder, new[] { CreateParameter("userId", userId) });
        }

        public async Task UpdateOrderStatusAsync(int orderId, string status)
        {
            await ExecuteNonQueryAsync("UPDATE orders SET status = @status WHERE id = @id", new[] { CreateParameter("status", status), CreateParameter("id", orderId) });
        }

        public async Task<bool> CancelOrderAsync(int orderId, int userId)
        {
            var sql = "UPDATE orders SET status = 'Cancelled' WHERE id = @id AND user_id = @userId AND status = 'Pending'";
            int rowsAffected = await ExecuteNonQueryAsync(sql, new[] 
            { 
                CreateParameter("id", orderId), 
                CreateParameter("userId", userId) 
            });
            return rowsAffected > 0;
        }

        public async Task DeleteOrderAsync(int orderId)
        {
            await ExecuteNonQueryAsync("DELETE FROM order_items WHERE order_id = @id", new[] { CreateParameter("id", orderId) });
            await ExecuteNonQueryAsync("DELETE FROM orders WHERE id = @id", new[] { CreateParameter("id", orderId) });
        }

        private DbParameter CreateParam(DbCommand cmd, string name, object value)
        {
            var p = cmd.CreateParameter();
            p.ParameterName = name;
            p.Value = value;
            return p;
        }
    }
}