using System.Collections.Generic;
using API.OrdersModule;

namespace API.DTOs
{
    public class CheckoutRequest
    {
        public int? UserId { get; set; }
        public string? CustomerName { get; set; }
        public string? CustomerAddress { get; set; }
        public string? DeliveryDate { get; set; }
        public List<CartItemSummary>? Items { get; set; }
    }
}