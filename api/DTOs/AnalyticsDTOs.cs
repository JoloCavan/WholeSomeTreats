using System;

namespace API.DTOs
{
    public class DailySalesDto
    {
        public DateTime SalesDate { get; set; }
        public int TotalOrders { get; set; }
        public decimal DailyRevenue { get; set; }
    }

    public class TopProductDto
    {
        public string ProductName { get; set; } = string.Empty;
        public int TotalUnitsSold { get; set; }
        public decimal TotalRevenueGenerated { get; set; }
    }

    public class PaymentMethodRevenueDto
    {
        public string PaymentMethod { get; set; } = string.Empty;
        public int NumberOfTransactions { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class OrderStatusRateDto
    {
        public string Status { get; set; } = string.Empty;
        public int OrderCount { get; set; }
        public decimal Percentage { get; set; }
    }
}