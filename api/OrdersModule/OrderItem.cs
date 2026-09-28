using System.Text.Json.Serialization;

namespace API.OrdersModule
{
    public class OrderItem
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("order_id")]
        public int OrderId { get; set; }

        [JsonPropertyName("product_id")]
        public int ProductId { get; set; }

        [JsonPropertyName("variation_id")]
        public int? VariationId { get; set; }

        [JsonPropertyName("quantity")]
        public int Quantity { get; set; }

        [JsonPropertyName("price_at_purchase")]
        public decimal PriceAtPurchase { get; set; }
    }
}