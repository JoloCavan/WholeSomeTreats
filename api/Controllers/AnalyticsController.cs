using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using API.AnalyticsModule;

namespace API.Controllers
{
    [ApiController]
    [Route("api/analytics")]
    [Authorize(Policy = "AdminAccess")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsRepository _analyticsRepository;

        public AnalyticsController(IAnalyticsRepository analyticsRepository)
        {
            _analyticsRepository = analyticsRepository;
        }

        [HttpGet("daily-sales")]
        public async Task<IActionResult> GetDailySales()
        {
            var data = await _analyticsRepository.GetDailySalesAsync();
            return Ok(data);
        }

        [HttpGet("top-products")]
        public async Task<IActionResult> GetTopProducts()
        {
            var data = await _analyticsRepository.GetTopSellingProductsAsync();
            return Ok(data);
        }

        [HttpGet("payment-methods")]
        public async Task<IActionResult> GetPaymentMethods()
        {
            var data = await _analyticsRepository.GetRevenueByPaymentMethodAsync();
            return Ok(data);
        }

        [HttpGet("fulfillment-rate")]
        public async Task<IActionResult> GetFulfillmentRate()
        {
            var data = await _analyticsRepository.GetOrderFulfillmentRateAsync();
            return Ok(data);
        }
    }
}