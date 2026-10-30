using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Linq;
using System.Threading.Tasks;
using API.Main;

namespace API.OrdersModule
{
    public class OrdersRepository : BaseRepository, IOrdersRepository
    {
        public OrdersRepository(MyCon dbConnection) : base(dbConnection) { }

        private static string GetStringOrEmpty(DbDataReader reader, string columnName)
        {
            try
            {
                int ordinal = reader.GetOrdinal(columnName);
                if (reader.IsDBNull(ordinal)) return string.Empty;
                return reader.GetString(ordinal);
            }
            catch { return string.Empty; }
        }

        private static double? GetDoubleOrNull(DbDataReader reader, string columnName)
        {
            try
            {
                int ordinal = reader.GetOrdinal(columnName);
                if (reader.IsDBNull(ordinal)) return null;
                return reader.GetDouble(ordinal);
            }
            catch { return null; }
        }

        private static bool GetBoolOrFalse(DbDataReader reader, string columnName)
        {
            try
            {
                int ordinal = reader.GetOrdinal(columnName);
                if (reader.IsDBNull(ordinal)) return false;
                return reader.GetBoolean(ordinal);
            }
            catch { return false; }
        }

        private Order MapReaderToOrder(DbDataReader reader)
        {
            return new Order
            {
                Id                   = reader.GetInt32(reader.GetOrdinal("id")),
                UserId               = reader.GetInt32(reader.GetOrdinal("user_id")),
                TotalAmount          = reader.GetDecimal(reader.GetOrdinal("total_amount")),
                PaymentMethod        = reader.GetString(reader.GetOrdinal("payment_method")),
                Status               = reader.GetString(reader.GetOrdinal("status")),
                CreatedAt            = reader.GetDateTime(reader.GetOrdinal("created_at")),
                CustomerName         = GetStringOrEmpty(reader, "customer_name"),
                CustomerAddress      = GetStringOrEmpty(reader, "customer_address"),
                DeliveryDate         = GetStringOrEmpty(reader, "delivery_date"),
                DeclineReason        = GetStringOrEmpty(reader, "decline_reason"),
                // New location fields
                ContactNumber        = GetStringOrEmpty(reader, "contact_number"),
                ZipCode              = GetStringOrEmpty(reader, "zip_code"),
                Landmark             = GetStringOrEmpty(reader, "landmark"),
                DeliveryInstructions = GetStringOrEmpty(reader, "delivery_instructions"),
                Lat                  = GetDoubleOrNull(reader, "lat"),
                Lng                  = GetDoubleOrNull(reader, "lng"),
                LocationConfirmed    = GetBoolOrFalse(reader, "location_confirmed"),
            };
        }

        public async Task<int> CreateOrderAsync(int userId, CreateOrderRequest request)
        {
            await using var connection = _db.GetConnection();
            await connection.OpenAsync();
            await using var transaction = await connection.BeginTransactionAsync();

            try
            {
                decimal totalAmount = 50; // Fixed delivery fee
                foreach (var item in request.CartItems) totalAmount += item.Price * item.Quantity;

                var orderSql = @"
                    INSERT INTO orders 
                        (user_id, total_amount, payment_method, status, created_at,
                         customer_address, delivery_date,
                         contact_number, zip_code, landmark, delivery_instructions,
                         lat, lng, location_confirmed)
                    VALUES 
                        (@userId, @total, @method, @status, NOW(),
                         @address, @deliveryDate,
                         @contactNumber, @zipCode, @landmark, @deliveryInstructions,
                         @lat, @lng, @locationConfirmed)
                    RETURNING id";

                int orderId = 0;
                await using (var cmd = connection.CreateCommand())
                {
                    cmd.Transaction = transaction;
                    cmd.CommandText = orderSql;
                    cmd.Parameters.Add(CreateParam(cmd, "userId",               userId));
                    cmd.Parameters.Add(CreateParam(cmd, "total",                totalAmount));
                    cmd.Parameters.Add(CreateParam(cmd, "method",               request.PaymentMethod));
                    cmd.Parameters.Add(CreateParam(cmd, "status",               "Pending"));
                    cmd.Parameters.Add(CreateParam(cmd, "address",              request.CustomerAddress));
                    cmd.Parameters.Add(CreateParam(cmd, "deliveryDate",         request.DeliveryDate));
                    cmd.Parameters.Add(CreateParam(cmd, "contactNumber",        request.ContactNumber));
                    cmd.Parameters.Add(CreateParam(cmd, "zipCode",              request.ZipCode));
                    cmd.Parameters.Add(CreateParam(cmd, "landmark",             request.Landmark));
                    cmd.Parameters.Add(CreateParam(cmd, "deliveryInstructions", request.DeliveryInstructions));
                    cmd.Parameters.Add(CreateParam(cmd, "lat",                  (object?)request.Lat ?? DBNull.Value));
                    cmd.Parameters.Add(CreateParam(cmd, "lng",                  (object?)request.Lng ?? DBNull.Value));
                    cmd.Parameters.Add(CreateParam(cmd, "locationConfirmed",    request.LocationConfirmed));

                    orderId = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                }

                foreach (var item in request.CartItems)
                {
                    var itemSql = @"
                        INSERT INTO order_items (order_id, product_id, variation_id, quantity, price_at_purchase)
                        VALUES (@orderId, @prodId, @varId, @qty, @price)";

                    await using var itemCmd = connection.CreateCommand();
                    itemCmd.Transaction  = transaction;
                    itemCmd.CommandText  = itemSql;
                    itemCmd.Parameters.Add(CreateParam(itemCmd, "orderId", orderId));
                    itemCmd.Parameters.Add(CreateParam(itemCmd, "prodId",  item.ProductId));
                    itemCmd.Parameters.Add(CreateParam(itemCmd, "varId",   (object?)item.VariationId ?? DBNull.Value));
                    itemCmd.Parameters.Add(CreateParam(itemCmd, "qty",     item.Quantity));
                    itemCmd.Parameters.Add(CreateParam(itemCmd, "price",   item.Price));
                    await itemCmd.ExecuteNonQueryAsync();
                }

                // Clear the customer's cart
                await using (var clearCmd = connection.CreateCommand())
                {
                    clearCmd.Transaction  = transaction;
                    clearCmd.CommandText  = "DELETE FROM cart_items WHERE user_id = @userId";
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

        private async Task PopulateOrderItemsAsync(IEnumerable<Order> orders)
        {
            if (orders == null || !orders.Any()) return;
            await using var connection = _db.GetConnection();
            await connection.OpenAsync();

            foreach (var order in orders)
            {
                var itemsSql = @"
                    SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.price_at_purchase,
                           p.name AS product_name, p.unit_type, pv.flavor_name
                    FROM order_items oi
                    LEFT JOIN products p ON oi.product_id = p.id
                    LEFT JOIN product_variations pv ON oi.variation_id = pv.id
                    WHERE oi.order_id = @orderId";

                await using var cmd = connection.CreateCommand();
                cmd.CommandText = itemsSql;
                cmd.Parameters.Add(CreateParam(cmd, "orderId", order.Id));

                await using var reader = await cmd.ExecuteReaderAsync();
                var items = new List<OrderItemDetail>();
                while (await reader.ReadAsync())
                {
                    items.Add(new OrderItemDetail
                    {
                        Id               = reader.GetInt32(reader.GetOrdinal("id")),
                        OrderId          = reader.GetInt32(reader.GetOrdinal("order_id")),
                        ProductId        = reader.GetInt32(reader.GetOrdinal("product_id")),
                        Quantity         = reader.GetInt32(reader.GetOrdinal("quantity")),
                        PriceAtPurchase  = reader.GetDecimal(reader.GetOrdinal("price_at_purchase")),
                        ProductName      = GetStringOrEmpty(reader, "product_name"),
                        UnitType         = GetStringOrEmpty(reader, "unit_type"),
                        FlavorName       = GetStringOrEmpty(reader, "flavor_name")
                    });
                }
                order.Items = items;
            }
        }

        public async Task<IEnumerable<Order>> GetAllOrdersAsync()
        {
            var sql = @"
                SELECT o.*,
                       COALESCE(NULLIF(u.full_name, ''), u.username, 'Customer #' || o.user_id) AS customer_name,
                       COALESCE(NULLIF(o.customer_address, ''), NULLIF(u.address, ''), 'N/A') AS customer_address
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                ORDER BY o.created_at DESC";
            var orders = (await ExecuteReaderToListAsync(sql, MapReaderToOrder)).ToList();
            await PopulateOrderItemsAsync(orders);
            return orders;
        }

        public async Task<IEnumerable<Order>> GetOrdersByUserIdAsync(int userId)
        {
            var sql = @"
                SELECT o.*,
                       COALESCE(NULLIF(u.full_name, ''), u.username, 'Customer #' || o.user_id) AS customer_name,
                       COALESCE(NULLIF(o.customer_address, ''), NULLIF(u.address, ''), 'N/A') AS customer_address
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE o.user_id = @userId
                ORDER BY o.created_at DESC";
            var orders = (await ExecuteReaderToListAsync(sql, MapReaderToOrder,
                new[] { CreateParameter("userId", userId) })).ToList();
            await PopulateOrderItemsAsync(orders);
            return orders;
        }

        public async Task UpdateOrderStatusAsync(int orderId, string status)
            => await ExecuteNonQueryAsync("UPDATE orders SET status = @status WHERE id = @id",
               new[] { CreateParameter("status", status), CreateParameter("id", orderId) });

        public async Task DeclineOrderAsync(int orderId, string declineReason)
            => await ExecuteNonQueryAsync("UPDATE orders SET status = 'Declined', decline_reason = @reason WHERE id = @id",
               new[] { CreateParameter("reason", declineReason), CreateParameter("id", orderId) });

        public async Task UpdateDeliveryDateAsync(int orderId, string deliveryDate)
            => await ExecuteNonQueryAsync("UPDATE orders SET delivery_date = @deliveryDate WHERE id = @id",
               new[] { CreateParameter("deliveryDate", deliveryDate), CreateParameter("id", orderId) });

        public async Task UpdateCustomerAddressAsync(int orderId, string customerAddress)
            => await ExecuteNonQueryAsync("UPDATE orders SET customer_address = @customerAddress WHERE id = @id",
               new[] { CreateParameter("customerAddress", customerAddress), CreateParameter("id", orderId) });

        public async Task<bool> CancelOrderAsync(int orderId, int userId)
        {
            int rows = await ExecuteNonQueryAsync(
                "UPDATE orders SET status = 'Cancelled' WHERE id = @id AND (LOWER(status) = 'processing' OR LOWER(status) = 'approved')",
                new[] { CreateParameter("id", orderId) });
            return rows > 0;
        }

        public async Task DeleteOrderAsync(int orderId)
        {
            await ExecuteNonQueryAsync("DELETE FROM order_items WHERE order_id = @id", new[] { CreateParameter("id", orderId) });
            await ExecuteNonQueryAsync("DELETE FROM orders WHERE id = @id",            new[] { CreateParameter("id", orderId) });
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