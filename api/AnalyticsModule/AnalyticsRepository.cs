using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using API.Main;
using API.DTOs;

namespace API.AnalyticsModule
{
    public class AnalyticsRepository : BaseRepository, IAnalyticsRepository
    {
        public AnalyticsRepository(MyCon dbConnection) : base(dbConnection) { }

        public async Task<IEnumerable<DailySalesDto>> GetDailySalesAsync()
        {
            var sql = @"
                SELECT 
                    DATE(created_at) AS sales_date,
                    COUNT(id) AS total_orders,
                    SUM(total_amount) AS daily_revenue
                FROM orders
                WHERE status IN ('Approved', 'Processing', 'Delivering', 'Completed')
                GROUP BY DATE(created_at)
                ORDER BY sales_date DESC;";

            return await ExecuteReaderToListAsync(sql, reader => new DailySalesDto
            {
                SalesDate = reader.GetDateTime(reader.GetOrdinal("sales_date")),
                // Using Convert to safely handle PostgreSQL bigint/numeric aggregations
                TotalOrders = Convert.ToInt32(reader["total_orders"]), 
                DailyRevenue = reader["daily_revenue"] != DBNull.Value ? Convert.ToDecimal(reader["daily_revenue"]) : 0
            });
        }

        public async Task<IEnumerable<TopProductDto>> GetTopSellingProductsAsync()
        {
            var sql = @"
                SELECT 
                    p.name AS product_name,
                    SUM(oi.quantity) AS total_units_sold,
                    SUM(oi.quantity * oi.price_at_purchase) AS total_revenue_generated
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                JOIN orders o ON oi.order_id = o.id
                WHERE o.status IN ('Approved', 'Processing', 'Delivering', 'Completed')
                GROUP BY p.id, p.name
                ORDER BY total_units_sold DESC
                LIMIT 5;";

            return await ExecuteReaderToListAsync(sql, reader => new TopProductDto
            {
                ProductName = reader.GetString(reader.GetOrdinal("product_name")),
                TotalUnitsSold = Convert.ToInt32(reader["total_units_sold"]),
                TotalRevenueGenerated = reader["total_revenue_generated"] != DBNull.Value ? Convert.ToDecimal(reader["total_revenue_generated"]) : 0
            });
        }

        public async Task<IEnumerable<PaymentMethodRevenueDto>> GetRevenueByPaymentMethodAsync()
        {
            var sql = @"
                SELECT 
                    payment_method,
                    COUNT(id) AS number_of_transactions,
                    SUM(total_amount) AS total_revenue
                FROM orders
                WHERE status IN ('Approved', 'Processing', 'Delivering', 'Completed')
                GROUP BY payment_method
                ORDER BY total_revenue DESC;";

            return await ExecuteReaderToListAsync(sql, reader => new PaymentMethodRevenueDto
            {
                PaymentMethod = reader.GetString(reader.GetOrdinal("payment_method")),
                NumberOfTransactions = Convert.ToInt32(reader["number_of_transactions"]),
                TotalRevenue = reader["total_revenue"] != DBNull.Value ? Convert.ToDecimal(reader["total_revenue"]) : 0
            });
        }

        public async Task<IEnumerable<OrderStatusRateDto>> GetOrderFulfillmentRateAsync()
        {
            var sql = @"
                SELECT 
                    status,
                    COUNT(id) AS order_count,
                    ROUND((COUNT(id) * 100.0 / (SELECT COUNT(*) FROM orders)), 2) AS percentage
                FROM orders
                GROUP BY status
                ORDER BY order_count DESC;";

            return await ExecuteReaderToListAsync(sql, reader => new OrderStatusRateDto
            {
                Status = reader.GetString(reader.GetOrdinal("status")),
                OrderCount = Convert.ToInt32(reader["order_count"]),
                Percentage = Convert.ToDecimal(reader["percentage"])
            });
        }

    }
}