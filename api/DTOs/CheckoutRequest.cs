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
        public string? PaymentMethod { get; set; }
        public List<CartItemSummary>? Items { get; set; }

        // Delivery location fields
        public string? ContactNumber { get; set; }
        public string? ZipCode { get; set; }
        public string? Landmark { get; set; }
        public string? DeliveryInstructions { get; set; }
        public double? Lat { get; set; }
        public double? Lng { get; set; }
        public bool? LocationConfirmed { get; set; }
    }
}