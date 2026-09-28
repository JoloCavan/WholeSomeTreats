using System.Text.Json.Serialization;

namespace API.CartModule
{
    public class CartItem
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("user_id")]
        public int UserId { get; set; }

        [JsonPropertyName("product_id")]
        public int ProductId { get; set; }

        [JsonPropertyName("variation_id")]
        public int? VariationId { get; set; }

        [JsonPropertyName("quantity")]
        public int Quantity { get; set; }

        // Extra fields for the frontend cart display
        [JsonPropertyName("product_name")]
        public string ProductName { get; set; } = string.Empty;

        [JsonPropertyName("price")]
        public decimal Price { get; set; }
    }
}