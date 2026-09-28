using System.Collections.Generic;
using System.Threading.Tasks;

namespace API.CartModule
{
    public interface ICartRepository
    {
        Task<IEnumerable<CartItem>> GetCartByUserIdAsync(int userId);
        Task AddToCartAsync(int userId, int productId, int? variationId, int quantity);
        Task RemoveFromCartAsync(int cartItemId, int userId);
        Task ClearCartAsync(int userId);
    }
}