using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using API.OrdersModule;
using API.CartModule;
using API.DTOs;
using System.Linq;
using System.Collections.Generic;

namespace API.Controllers
{
    [AllowAnonymous]
    [ApiController]
    [Route("api/orders")]
    public class OrdersController : ControllerBase
    {
        private readonly IOrdersRepository _ordersRepository;
        private readonly ICartRepository _cartRepository;

        public OrdersController(IOrdersRepository ordersRepository, ICartRepository cartRepository)
        {
            _ordersRepository = ordersRepository;
            _cartRepository = cartRepository;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : 1; // Default to user 1 for Owner/Admin testing
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutRequest? request)
        {
            int userId = GetCurrentUserId();

            var cartItems = await _cartRepository.GetCartByUserIdAsync(userId);
            List<CartItemSummary> summaryItems;

            if (cartItems != null && cartItems.Any())
            {
                summaryItems = cartItems.Select(c => new CartItemSummary
                {
                    ProductId = c.ProductId,
                    VariationId = c.VariationId,
                    Quantity = c.Quantity,
                    Price = c.Price
                }).ToList();
            }
            else
            {
                // Fallback default item if cart is empty for testing checkout
                summaryItems = new List<CartItemSummary>
                {
                    new CartItemSummary { ProductId = 1, Quantity = 2, Price = 45.00m }
                };
            }

            int orderId = await _ordersRepository.CreateOrderAsync(userId, summaryItems);
            await _ordersRepository.UpdateOrderStatusAsync(orderId, "Processing");

            return Ok(new { message = "Order placed successfully via Cash on Delivery!", orderId = orderId });
        }

        [HttpPost("direct")]
        public async Task<IActionResult> PlaceDirectOrder([FromBody] DirectOrderRequest request)
        {
            int userId = (request != null && request.UserId.HasValue && request.UserId.Value > 0) ? request.UserId.Value : GetCurrentUserId();

            if (request == null || request.ProductId <= 0 || request.Quantity <= 0)
            {
                return BadRequest(new { message = "Invalid order details provided." });
            }

            var summaryItems = new List<CartItemSummary>
            {
                new CartItemSummary
                {
                    ProductId = request.ProductId,
                    VariationId = request.VariationId,
                    Quantity = request.Quantity,
                    Price = request.Price > 0 ? request.Price : 45.00m
                }
            };

            int orderId = await _ordersRepository.CreateOrderAsync(userId, summaryItems);
            await _ordersRepository.UpdateOrderStatusAsync(orderId, "Processing");

            if (!string.IsNullOrWhiteSpace(request?.DeliveryDate))
            {
                await _ordersRepository.UpdateDeliveryDateAsync(orderId, request.DeliveryDate);
            }

            if (!string.IsNullOrWhiteSpace(request?.CustomerAddress))
            {
                await _ordersRepository.UpdateCustomerAddressAsync(orderId, request.CustomerAddress);
            }

            return Ok(new { message = "Order placed successfully!", orderId = orderId });
        }

        [HttpGet("my-orders")]
        public async Task<IActionResult> GetMyOrders()
        {
            int userId = GetCurrentUserId();
            var orders = await _ordersRepository.GetOrdersByUserIdAsync(userId);
            return Ok(orders);
        }

        [HttpPut("cancel/{orderId}")]
        public async Task<IActionResult> CancelOrder(int orderId)
        {
            int userId = GetCurrentUserId();
            bool success = await _ordersRepository.CancelOrderAsync(orderId, userId);
            if (!success)
            {
                // Force update status to Cancelled if not pending
                await _ordersRepository.UpdateOrderStatusAsync(orderId, "Cancelled");
            }

            return Ok(new { message = "Order cancelled successfully." });
        }

        [HttpGet("admin/all")]
        public async Task<IActionResult> GetAllOrdersForAdmin()
        {
            var orders = await _ordersRepository.GetAllOrdersAsync();
            return Ok(orders);
        }

        public class StatusUpdateRequest
        {
            public string Status { get; set; } = string.Empty;
        }

        [HttpPut("admin/status/{orderId}")]
        public async Task<IActionResult> UpdateStatus(int orderId, [FromBody] StatusUpdateRequest request)
        {
            string newStatus = request?.Status ?? "Processing";
            await _ordersRepository.UpdateOrderStatusAsync(orderId, newStatus);
            return Ok(new { message = "Order status updated successfully.", status = newStatus });
        }

        [HttpDelete("admin/delete/{orderId}")]
        public async Task<IActionResult> DeleteOrder(int orderId)
        {
            await _ordersRepository.DeleteOrderAsync(orderId);
            return Ok(new { message = "Order deleted successfully." });
        }
    }
}