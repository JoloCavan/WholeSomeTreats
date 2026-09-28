using System.Collections.Generic;
using System.Threading.Tasks;

namespace API.OrdersModule
{
    public interface IOrdersRepository
    {
        Task<int> CreateOrderAsync(int userId, IEnumerable<CartItemSummary> cartItems);
        Task<IEnumerable<Order>> GetAllOrdersAsync(); 
        Task<IEnumerable<Order>> GetOrdersByUserIdAsync(int userId); 
        Task UpdateOrderStatusAsync(int orderId, string status);
        Task<bool> CancelOrderAsync(int orderId, int userId); 
        Task DeleteOrderAsync(int orderId);
    }

    public class CartItemSummary
    {
        public int ProductId { get; set; }
        public int? VariationId { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }
}