using System.Collections.Generic;
using System.Threading.Tasks;
using API.DTOs;

namespace API.AnalyticsModule
{
    public interface IAnalyticsRepository
    {
        Task<IEnumerable<DailySalesDto>> GetDailySalesAsync();
        Task<IEnumerable<TopProductDto>> GetTopSellingProductsAsync();
        Task<IEnumerable<PaymentMethodRevenueDto>> GetRevenueByPaymentMethodAsync();
        Task<IEnumerable<OrderStatusRateDto>> GetOrderFulfillmentRateAsync();
    }
}