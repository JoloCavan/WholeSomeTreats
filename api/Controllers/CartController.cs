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
    [Authorize(Policy = "CustomerAccess")] 
    public class CartController : ControllerBase
    {
        private readonly ICartRepository _cartRepository;

        public CartController(ICartRepository cartRepository)
        {
            _cartRepository = cartRepository;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : 0;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyCart()
        {
            int userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            var cart = await _cartRepository.GetCartByUserIdAsync(userId);
            return Ok(cart);
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartRequest request)
        {
            int userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            await _cartRepository.AddToCartAsync(userId, request.ProductId, request.VariationId, request.Quantity);
            return Ok(new { message = "Item added to cart successfully." });
        }

        [HttpDelete("remove/{cartItemId}")]
        public async Task<IActionResult> RemoveFromCart(int cartItemId)
        {
            int userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            await _cartRepository.RemoveFromCartAsync(cartItemId, userId);
            return Ok(new { message = "Item removed from cart." });
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart()
        {
            int userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            await _cartRepository.ClearCartAsync(userId);
            return Ok(new { message = "Cart cleared successfully." });
        }
    }
}