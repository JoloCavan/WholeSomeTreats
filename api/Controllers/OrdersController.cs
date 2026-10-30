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
            return int.TryParse(userIdClaim, out int userId) ? userId : 1;
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutRequest? request)
        {
            int userId = (request != null && request.UserId.HasValue && request.UserId.Value > 0)
                ? request.UserId.Value
                : GetCurrentUserId();

            List<CartItemSummary> summaryItems = request?.Items ?? new List<CartItemSummary>();

            if (!summaryItems.Any())
            {
                var cartItems = await _cartRepository.GetCartByUserIdAsync(userId);
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
            }

            if (!summaryItems.Any())
                summaryItems = new List<CartItemSummary> { new CartItemSummary { ProductId = 1, Quantity = 2, Price = 45.00m } };

            // Validate delivery date is Sunday
            if (!string.IsNullOrWhiteSpace(request?.DeliveryDate))
            {
                var datePart = request.DeliveryDate.Trim().Split(' ')[0];
                if (System.DateTime.TryParse(datePart, out var parsedDate) && parsedDate.DayOfWeek != System.DayOfWeek.Sunday)
                    return BadRequest(new { message = "Deliveries are only available on Sundays. Please select a Sunday." });
            }

            var orderRequest = new CreateOrderRequest
            {
                CartItems            = summaryItems,
                PaymentMethod        = request?.PaymentMethod ?? "COD",
                CustomerAddress      = request?.CustomerAddress ?? string.Empty,
                DeliveryDate         = request?.DeliveryDate ?? string.Empty,
                ContactNumber        = request?.ContactNumber ?? string.Empty,
                ZipCode              = request?.ZipCode ?? string.Empty,
                Landmark             = request?.Landmark ?? string.Empty,
                DeliveryInstructions = request?.DeliveryInstructions ?? string.Empty,
                Lat                  = request?.Lat,
                Lng                  = request?.Lng,
                LocationConfirmed    = request?.LocationConfirmed ?? false,
            };

            int orderId = await _ordersRepository.CreateOrderAsync(userId, orderRequest);
            return Ok(new { message = "Order placed successfully!", orderId });
        }

        [HttpPost("direct")]
        public async Task<IActionResult> PlaceDirectOrder([FromBody] DirectOrderRequest request)
        {
            int userId = (request != null && request.UserId.HasValue && request.UserId.Value > 0)
                ? request.UserId.Value
                : GetCurrentUserId();

            if (request == null || request.ProductId <= 0 || request.Quantity <= 0)
                return BadRequest(new { message = "Invalid order details provided." });

            var orderRequest = new CreateOrderRequest
            {
                CartItems = new List<CartItemSummary>
                {
                    new CartItemSummary
                    {
                        ProductId   = request.ProductId,
                        VariationId = request.VariationId,
                        Quantity    = request.Quantity,
                        Price       = request.Price > 0 ? request.Price : 45.00m
                    }
                },
                PaymentMethod        = "COD",
                CustomerAddress      = request?.CustomerAddress ?? string.Empty,
                DeliveryDate         = request?.DeliveryDate ?? string.Empty,
                ContactNumber        = request?.ContactNumber ?? string.Empty,
                ZipCode              = request?.ZipCode ?? string.Empty,
                Landmark             = request?.Landmark ?? string.Empty,
                DeliveryInstructions = request?.DeliveryInstructions ?? string.Empty,
                Lat                  = request?.Lat,
                Lng                  = request?.Lng,
                LocationConfirmed    = request?.LocationConfirmed ?? false,
            };

            int orderId = await _ordersRepository.CreateOrderAsync(userId, orderRequest);
            return Ok(new { message = "Order placed successfully!", orderId });
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
                return BadRequest(new { message = "Cannot cancel order. Orders can only be cancelled while in Processing or Approved status." });
            return Ok(new { message = "Order cancelled successfully.", orderId });
        }

        [HttpGet("admin/all")]
        public async Task<IActionResult> GetAllOrdersForAdmin()
        {
            var orders = await _ordersRepository.GetAllOrdersAsync();
            return Ok(orders);
        }

        public class StatusUpdateRequest { public string Status { get; set; } = string.Empty; }
        public class DeclineOrderRequest { public string Reason { get; set; } = string.Empty; }

        [HttpPut("admin/approve/{orderId}")]
        public async Task<IActionResult> ApproveOrder(int orderId)
        {
            await _ordersRepository.UpdateOrderStatusAsync(orderId, "Approved");
            return Ok(new { message = "Order approved successfully.", orderId });
        }

        [HttpPut("admin/decline/{orderId}")]
        public async Task<IActionResult> DeclineOrder(int orderId, [FromBody] DeclineOrderRequest request)
        {
            string reason = string.IsNullOrWhiteSpace(request?.Reason) ? "Order declined by bakery." : request.Reason.Trim();
            await _ordersRepository.DeclineOrderAsync(orderId, reason);
            return Ok(new { message = "Order declined successfully.", orderId, declineReason = reason });
        }

        [HttpPut("admin/status/{orderId}")]
        public async Task<IActionResult> UpdateStatus(int orderId, [FromBody] StatusUpdateRequest request)
        {
            string newStatus = request?.Status ?? "Processing";
            await _ordersRepository.UpdateOrderStatusAsync(orderId, newStatus);
            return Ok(new { message = "Order status updated.", status = newStatus });
        }

        [HttpDelete("admin/delete/{orderId}")]
        public async Task<IActionResult> DeleteOrder(int orderId)
        {
            await _ordersRepository.DeleteOrderAsync(orderId);
            return Ok(new { message = "Order deleted successfully." });
        }
    }
}