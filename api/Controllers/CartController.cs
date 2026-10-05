using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using API.CartModule;
using API.DTOs;

namespace API.Controllers
{
    [ApiController]
    [Route("api/cart")]
    [AllowAnonymous]
    public class CartController : ControllerBase
    {
        private readonly ICartRepository _cartRepository;

        public CartController(ICartRepository cartRepository)
        {
            _cartRepository = cartRepository;
        }

        private int GetCurrentUserId(int? fallbackUserId = null)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int userId) && userId > 0) return userId;
            if (fallbackUserId.HasValue && fallbackUserId.Value > 0) return fallbackUserId.Value;
            return 2; // Default Customer ID (Jolo)
        }

        [HttpGet]
        public async Task<IActionResult> GetMyCart([FromQuery] int? userId = null)
        {
            int targetUserId = GetCurrentUserId(userId);
            var cart = await _cartRepository.GetCartByUserIdAsync(targetUserId);
            return Ok(cart);
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartRequest request)
        {
            int targetUserId = GetCurrentUserId(request?.UserId);
            if (request == null || request.ProductId <= 0 || request.Quantity <= 0)
            {
                return BadRequest(new { message = "Invalid product details." });
            }

            await _cartRepository.AddToCartAsync(targetUserId, request.ProductId, request.VariationId, request.Quantity);
            return Ok(new { message = "Item added to cart successfully." });
        }

        [HttpDelete("remove/{cartItemId}")]
        public async Task<IActionResult> RemoveFromCart(int cartItemId, [FromQuery] int? userId = null)
        {
            int targetUserId = GetCurrentUserId(userId);
            await _cartRepository.RemoveFromCartAsync(cartItemId, targetUserId);
            return Ok(new { message = "Item removed from cart." });
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart([FromQuery] int? userId = null)
        {
            int targetUserId = GetCurrentUserId(userId);
            await _cartRepository.ClearCartAsync(targetUserId);
            return Ok(new { message = "Cart cleared successfully." });
        }
    }
}